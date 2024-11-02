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
  const [tabId, setTabId] = useState<number | null>(null);

  // Function to get the current tab ID
  const getCurrentTabId = async (): Promise<number | null> => {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.id !== undefined) {
          resolve(currentTab.id);
        } else {
          resolve(null);
        }
      });
    });
  };

  // Functions to interact with chrome.storage.local
  const getStoredHistory = async (tabId: number): Promise<ChatEntry[]> => {
    return new Promise((resolve) => {
      chrome.storage.local.get([`chatHistory_${tabId}`], (result) => {
        if (result[`chatHistory_${tabId}`]) {
          resolve(result[`chatHistory_${tabId}`]);
        } else {
          resolve([]);
        }
      });
    });
  };

  const setStoredHistory = async (
    tabId: number,
    history: ChatEntry[]
  ): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [`chatHistory_${tabId}`]: history }, () => {
        resolve();
      });
    });
  };

  const removeStoredHistory = async (tabId: number): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.remove(`chatHistory_${tabId}`, () => {
        resolve();
      });
    });
  };

  // On component mount, get the tab ID and load history
  useEffect(() => {
    const init = async () => {
      const id = await getCurrentTabId();
      if (id !== null) {
        setTabId(id);
        const storedHistory = await getStoredHistory(id);
        setHistory(storedHistory);
      }
    };
    init();
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    const saveHistoryAsync = async () => {
      if (tabId !== null) {
        await setStoredHistory(tabId, history);
      }
    };
    saveHistoryAsync();
  }, [history, tabId]);

  const getPageContent = async (): Promise<string | null> => {
    try {
      let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab.id !== undefined) {
        const [injectionResult] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const elements = document.querySelectorAll(
              "p, h1, h2, h3, h4, h5, h6"
            );
            return Array.from(elements)
              .map((el) => (el as HTMLElement).innerText)
              .join("\n");
          },
        });

        const pageContent = injectionResult.result ?? null;
        console.log("Page content:", pageContent);
        return pageContent;
      } else {
        console.error("Tab ID is undefined");
        return null;
      }
    } catch (error) {
      console.error("An error occurred:", error);
      return null;
    }
  };

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
    const pageContent = await getPageContent();
    await processQuery(inputQuery.trim(), pageContent);
  };

  const processQuery = async (query: string, pageContent: string | null) => {
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

  const handleClearClick = async () => {
    setHistory([]);
    setInputQuery("");
    if (tabId !== null) {
      await removeStoredHistory(tabId);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-start p-6"
      style={{ width: "400px", minHeight: "500px" }}
    >
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
        placeholder="Ask a question about this page..."
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
