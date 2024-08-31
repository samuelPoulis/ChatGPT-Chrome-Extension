let contentScriptInitialized = false;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "isContentScriptReady") {
    sendResponse({ ready: contentScriptInitialized });
  } else if (message.action === "getContent") {
    const pageContent = document.body.innerText || "";
    sendResponse({ content: pageContent });
  }
});

// Initialize the content script
if (!contentScriptInitialized) {
  contentScriptInitialized = true;
  console.log("Content script initialized and ready.");
}


