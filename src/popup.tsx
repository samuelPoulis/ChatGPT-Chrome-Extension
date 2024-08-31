import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import "./index.css";

type ChatEntry = {
  role: "user" | "assistant";
  content: string;
};

function Popup() {
  const [inputQuery, setInputQuery] = useState<string>("");
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [model, setModel] = useState<string>("gpt-4o-mini");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pageContent, setPageContent] = useState<string>("");

  const getPageContent = async (retryCount = 0) => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab?.id !== undefined) {
        const tabId = tab.id as number;

        chrome.runtime.sendMessage(
          { action: "isContentScriptReady" },
          (response) => {
            if (response && response.ready) {
              chrome.tabs.sendMessage(
                tabId,
                { action: "getContent" },
                (response) => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      "Error sending message to content script:",
                      chrome.runtime.lastError
                    );
                    setPageContent(
                      "Unable to fetch page content. Please refresh the page and try again."
                    );
                  } else if (response && response.content) {
                    setPageContent(response.content);
                  }
                }
              );
            } else {
              console.log(
                `Content script not ready, retrying in ${
                  2 ** retryCount
                } seconds`
              );
              setTimeout(
                () => getPageContent(retryCount + 1),
                1000 * 2 ** retryCount
              );
            }
          }
        );
      } else {
        console.error(
          "Tab ID is undefined. Cannot send message to content script."
        );
      }
    } catch (error) {
      console.error("Error fetching page content:", error);
      setPageContent("Error fetching page content. Please try again.");
    }
  };

  useEffect(() => {
    getPageContent();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyzeClick();
    }
  };

  const handleAnalyzeClick = async () => {
    if (inputQuery.trim() === "" || isLoading) return;
    await processQuery(inputQuery.trim());
  };

  const handleAnalyzePageContent = async () => {
    if (isLoading) return;
    await processQuery(`Analyze this content: ${pageContent}`);
  };

  const processQuery = async (query: string) => {
    const userMessage: ChatEntry = { role: "user", content: query };
    setHistory((prevHistory) => [...prevHistory, userMessage]);
    setInputQuery("");
    setIsLoading(true);

    const newHistory = [...history, userMessage];

    try {
      console.log("Sending request to backend...");
      const response = await axios.post("http://localhost:3000/api/analyze", {
        history: newHistory,
        model,
        pageContent, // Include the page content in the request
      });
      console.log("Received response:", response.data);

      setHistory((prevHistory) => [
        ...prevHistory,
        { role: "assistant", content: response.data.response },
      ]);
    } catch (error) {
      console.error("Error processing query:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearClick = () => {
    setHistory([]);
    setInputQuery("");
  };

  return (
    <div
      className="flex flex-col items-center justify-start p-6"
      style={{ width: "400px", minHeight: "500px" }}
    >
      <h1 className="text-2xl font-bold mb-6">AI ANALYZER</h1>
      <select
        value={model}
        onChange={(e) => setModel(e.target.value)}
        className="w-full mb-6 p-2 border rounded"
      >
        <option value="gpt-4o-mini">GPT-4o-Mini</option>
        <option value="GPT-4o">GPT-4o</option>
        <option value="gpt-4">GPT-4 Legacy</option>
      </select>
      <ScrollArea className="w-full h-96 border rounded p-4 mb-6">
        {history.map((entry, index) => (
          <div key={index} className="mb-4">
            <strong className="text-lg">
              {entry.role === "user" ? "You: " : "GPT: "}
            </strong>
            <div className="chat-content">{entry.content}</div>
          </div>
        ))}
        {isLoading && <div className="text-gray-500">Loading...</div>}
      </ScrollArea>
      <Input
        type="text"
        placeholder="Ask a question..."
        value={inputQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full mb-4 text-base p-3"
        disabled={isLoading}
      />
      <div className="flex w-full mb-4">
        <Button
          onClick={handleAnalyzeClick}
          className="flex-grow mr-2 text-lg py-3"
          variant="default"
          disabled={isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </Button>
        <Button
          onClick={handleClearClick}
          variant="destructive"
          className="text-lg py-3"
          disabled={isLoading}
        >
          Clear Chat
        </Button>
      </div>
      <Button
        onClick={handleAnalyzePageContent}
        className="w-full text-lg py-3"
        variant="outline"
        disabled={isLoading}
      >
        Analyze Page Content
      </Button>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} else {
  console.error("Root element not found");
}
