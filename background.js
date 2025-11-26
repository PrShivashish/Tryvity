// Background service worker for the extension

console.log("Drape background service worker initialized");

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "productClicked") {
    console.log("Product clicked:", request.product);

    // Store the product information
    chrome.storage.local.set({
      lastProduct: request.product,
    });

    // You can add badge or notification here
    chrome.action.setBadgeText({ text: "1" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });

    sendResponse({ success: true });
  }

  if (request.action === "closeSidePanel") {
    console.log("Close side panel message received");

    // Send message to content script to close the side panel
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "closeSidePanel" }).catch((err) => {
          console.log("Message sent to close side panel");
        });
      }
    });

    sendResponse({ success: true });
  }

  return true;
});

// Toggle side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  console.log("Extension icon clicked, toggling side panel...");
  console.log("Tab ID:", tab.id, "URL:", tab.url);

  // Send message to content script to toggle side panel
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: "toggleSidePanel" });
    console.log("Message sent successfully, response:", response);
  } catch (error) {
    console.log("Content script not ready, injecting...", error.message);
    // If content script not loaded, inject it first
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
      console.log("Content script injected successfully");

      // Try again after injection
      setTimeout(async () => {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: "toggleSidePanel" });
          console.log("Message sent after injection, response:", response);
        } catch (retryError) {
          console.error("Failed to send message after injection:", retryError);
        }
      }, 200);
    } catch (injectError) {
      console.error("Failed to inject content script:", injectError);
    }
  }

  // Clear badge
  chrome.action.setBadgeText({ text: "" });
});
