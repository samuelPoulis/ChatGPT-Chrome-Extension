console.log("Background script running");

let contentScriptReady = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);
  if (message.action === "contentScriptReady") {
    contentScriptReady = true;
    console.log("Content script is ready");
    sendResponse({ received: true });
  } else if (message.action === "isContentScriptReady") {
    console.log("Checking if content script is ready:", contentScriptReady);
    sendResponse({ ready: contentScriptReady });
  }
  return true;  // Indicates that the response is sent asynchronously
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && /^http/.test(tab.url)) {
    console.log(`Tab ${tabId} updated. Resetting contentScriptReady.`);
    contentScriptReady = false;
  }
});