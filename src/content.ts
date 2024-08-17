console.log("Content script loaded and running");

function getPageContent() {
  console.log("getPageContent called");
  return document.body.innerText;
}

// Notify that the content script is ready
console.log("Sending contentScriptReady message");
chrome.runtime.sendMessage({ action: "contentScriptReady" }, response => {
  console.log("contentScriptReady message response:", response);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  if (request.action === "getContent") {
    const content = getPageContent();
    console.log("Sending content:", content.substring(0, 100) + "...");
    sendResponse({ content: content });
  }
  return true;  // Indicates that the response is sent asynchronously
});

console.log("Content script setup complete");