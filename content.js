// Content script to detect product clicks and extract product information

console.log("Drape extension loaded!");

// Store the last clicked product
let lastClickedProduct = null;

// Function to extract product name from various e-commerce sites
function extractProductName(element) {
  // Try to find product name from common selectors
  let productName = "";

  // Look for common product name patterns
  const selectors = ["h1", '[data-testid*="product"]', ".product-title", ".product-name", '[class*="product-title"]', '[class*="product-name"]', '[id*="productTitle"]', ".pdp-name", ".pdp-title"];

  // Try to find product name in the current page
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim()) {
      productName = el.textContent.trim();
      break;
    }
  }

  // If no product name found, try from clicked element or its parents
  if (!productName && element) {
    let current = element;
    for (let i = 0; i < 5; i++) {
      if (!current) break;

      // Check if element has product-related attributes
      const imgAlt = current.querySelector("img")?.alt;
      const linkTitle = current.getAttribute("title");
      const ariaLabel = current.getAttribute("aria-label");

      if (imgAlt && imgAlt.length > 3) {
        productName = imgAlt;
        break;
      }
      if (linkTitle && linkTitle.length > 3) {
        productName = linkTitle;
        break;
      }
      if (ariaLabel && ariaLabel.length > 3) {
        productName = ariaLabel;
        break;
      }

      current = current.parentElement;
    }
  }

  // Fallback to page title
  if (!productName) {
    productName = document.title;
  }

  return productName.substring(0, 200); // Limit length
}

// Function to extract product image
function extractProductImage() {
  const selectors = ['img[data-testid*="product"]', ".product-image img", '[class*="product-image"] img', '[id*="landingImage"]', ".pdp-image img", 'img[src*="product"]'];

  for (const selector of selectors) {
    const img = document.querySelector(selector);
    if (img && img.src) {
      return img.src;
    }
  }

  // Find the largest image on the page (likely product image)
  const images = Array.from(document.querySelectorAll("img"));
  if (images.length > 0) {
    const largestImage = images.reduce((prev, current) => {
      return current.width * current.height > prev.width * prev.height ? current : prev;
    });
    return largestImage.src;
  }

  return "";
}

// Function to find the product container from clicked element
function findProductContainer(element) {
  let current = element;
  let maxDepth = 15; // Increased depth

  // Traverse up the DOM to find product container
  while (current && current !== document.body && maxDepth > 0) {
    // Check if this element looks like a product container
    const classList = current.className || "";
    const dataAttrs = Array.from(current.attributes || [])
      .map((attr) => attr.name)
      .join(" ");

    // Enhanced product container patterns
    if (classList.includes("product") || classList.includes("item") || classList.includes("card") || classList.includes("result") || classList.includes("listing") || dataAttrs.includes("data-component-type") || dataAttrs.includes("data-asin") || current.hasAttribute("data-asin") || current.hasAttribute("data-component-type") || current.querySelector('img[src*="images-amazon"]') !== null || current.querySelector('img[src*="product"]') !== null || current.querySelector("img[alt]") !== null) {
      // Make sure it's not too high up in the DOM (avoid catching the entire page)
      const hasProductTitle = current.querySelector('h1, h2, h3, [class*="title"], [class*="name"]');
      const hasProductImage = current.querySelector("img");
      const hasProductLink = current.querySelector('a[href*="/dp/"], a[href*="/gp/"], a[href*="product"]');

      if (hasProductTitle || hasProductImage || hasProductLink) {
        console.log("Found product container:", current);
        return current;
      }
    }

    current = current.parentElement;
    maxDepth--;
  }

  return null;
}

// Function to extract product name from a specific container
function extractProductNameFromContainer(container) {
  if (!container) return "";

  // Enhanced selectors for product name within this specific container
  const selectors = ["h2 a span", "h2 span", "h3 a span", "h3 span", ".a-size-medium", ".a-size-base-plus", '[class*="product-title"]', '[class*="product-name"]', '[class*="title"]', "img[alt]", "span[aria-label]", "[title]"];

  for (const selector of selectors) {
    const el = container.querySelector(selector);
    if (el) {
      const text = el.textContent?.trim() || el.alt?.trim() || el.getAttribute("title") || el.getAttribute("aria-label");
      if (text && text.length > 3) {
        console.log(`Found product name with selector ${selector}: ${text}`);
        return text;
      }
    }
  }

  console.log("No product name found in container");
  return "";
}

// Function to extract product image from a specific container
function extractProductImageFromContainer(container) {
  if (!container) return "";

  // Find image within the container
  const img = container.querySelector('img[src*="images"]') || container.querySelector('img[src*="product"]') || container.querySelector("img");

  if (img && img.src) {
    return img.src;
  }

  return "";
}

// Function to extract product URL from a specific container
function extractProductUrlFromContainer(container) {
  if (!container) return window.location.href;

  // Find product link within the container
  const link = container.querySelector('a[href*="/dp/"]') || container.querySelector('a[href*="/gp/"]') || container.querySelector('a[href*="product"]') || container.querySelector("a");

  if (link && link.href) {
    // Return full URL
    return link.href.split("?")[0]; // Remove query params for cleaner URL
  }

  return window.location.href;
}

// Listen for clicks on the page
document.addEventListener(
  "click",
  function (event) {
    const target = event.target;
    console.log("Click detected on:", target);

    // Check if user has uploaded a photo first
    chrome.storage.local.get(["userPhoto", "isGenerating"], function (result) {
      if (!result.userPhoto) {
        console.log("No user photo uploaded yet - ignoring product click");
        return; // Don't process product clicks if no photo uploaded
      }

      // Check if generation is in progress
      if (result.isGenerating) {
        console.log("🚫 Product click blocked - generation in progress");
        return; // Don't process clicks during generation
      }

      // Check if this is a product link click
      const productContainer = findProductContainer(target);
      if (productContainer) {
        console.log("✅ Valid product click detected - processing");

        // Prevent default navigation to keep extension open
        event.preventDefault();
        event.stopPropagation();
        console.log("🚫 Prevented navigation to keep extension open");

        // Process the product click without navigating
        processProductClick(target);
      } else {
        console.log("Not a product click - allowing normal navigation");
      }
    });
  },
  true
);

// Function to process product click (only called if user has uploaded photo)
function processProductClick(target) {
  console.log("🎯 Processing product click...");

  // Find the product container for the clicked element
  const productContainer = findProductContainer(target);

  // Extract product information from the specific container
  let productName = "";
  let productImage = "";
  let productUrl = window.location.href;

  if (productContainer) {
    // Extract from specific product container
    productName = extractProductNameFromContainer(productContainer);
    productImage = extractProductImageFromContainer(productContainer);
    productUrl = extractProductUrlFromContainer(productContainer);

    console.log("Product container found:", productContainer);
    console.log("Extracted from container - Name:", productName, "Image:", productImage, "URL:", productUrl);
  } else {
    // Fallback to page-level extraction (for product detail pages)
    productName = extractProductName(target);
    productImage = extractProductImage();
    productUrl = window.location.href;
    console.log("No container found, using page-level extraction - Name:", productName);
  }

  // Only save if we found a valid product name
  if (!productName || productName.length < 3) {
    console.log("Invalid product name, not saving:", productName);
    return; // Don't save invalid clicks
  }

  lastClickedProduct = {
    name: productName,
    image: productImage,
    url: productUrl,
    timestamp: Date.now(),
  };

  // Save to Chrome storage
  chrome.storage.local.set(
    {
      lastProduct: lastClickedProduct,
    },
    function () {
      console.log("✅ Product saved successfully:", productName);
      console.log("📦 Product data:", lastClickedProduct);
    }
  );

  // Send message to background script
  chrome.runtime
    .sendMessage({
      action: "productClicked",
      product: lastClickedProduct,
    })
    .then((response) => {
      console.log("✅ Product click message sent successfully");
    })
    .catch((err) => {
      // Ignore errors if popup is not open
      console.log("⚠️ Message send failed (popup may be closed):", err);
    });
}

// Also detect when user navigates to a product page
function detectProductPage() {
  // Check if current page looks like a product page
  const isProductPage = window.location.href.includes("/product/") || window.location.href.includes("/dp/") || window.location.href.includes("/gp/") || document.querySelector('[itemtype*="Product"]') !== null;

  if (isProductPage) {
    // Only detect product pages if user has uploaded a photo
    chrome.storage.local.get(["userPhoto"], function (result) {
      if (result.userPhoto) {
        setTimeout(() => {
          const productName = extractProductName();
          const productImage = extractProductImage();
          const productUrl = window.location.href;

          const product = {
            name: productName,
            image: productImage,
            url: productUrl,
            timestamp: Date.now(),
          };

          chrome.storage.local.set({
            lastProduct: product,
          });

          console.log("Product page detected:", productName);
        }, 1000); // Wait for page to load
      } else {
        console.log("No user photo uploaded yet - ignoring product page detection");
      }
    });
  }
}

// Detect product page on load
detectProductPage();

// Check if extension should be open on page load
function checkExtensionState() {
  chrome.storage.local.get(["userPhoto", "isPanelOpen"], (result) => {
    console.log("🔍 Checking extension state:", result);

    if (result.userPhoto) {
      console.log("✅ User photo found - extension should be available");

      if (result.isPanelOpen) {
        console.log("🔄 Restoring extension panel after page reload");
        setTimeout(() => {
          createSidePanel();
        }, 500); // Small delay to ensure page is loaded
      } else {
        console.log("ℹ️ Panel not marked as open, but user photo exists - extension ready for activation");
      }
    } else {
      console.log("❌ No user photo found - extension not ready");
    }
  });
}

// Check extension state on page load
checkExtensionState();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  if (request.action === "getProduct") {
    sendResponse({ product: lastClickedProduct });
  }

  if (request.action === "toggleSidePanel") {
    console.log("Toggle side panel message received!");
    toggleSidePanel();
    sendResponse({ success: true });
  }

  if (request.action === "closeSidePanel") {
    console.log("Close side panel message received!");
    if (isPanelOpen) {
      removeSidePanel();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, message: "Panel not open" });
    }
  }

  return true;
});

// ========================================
// SIDE PANEL FUNCTIONALITY
// ========================================

let sidePanelIframe = null;
let isPanelOpen = false;

function createSidePanel() {
  if (sidePanelIframe) return; // Already exists

  console.log("Creating Drape side panel...");

  // Create iframe for the side panel
  sidePanelIframe = document.createElement("iframe");
  sidePanelIframe.id = "drape-side-panel";
  sidePanelIframe.src = chrome.runtime.getURL("popup.html");

  // Ensure iframe loads properly
  sidePanelIframe.onload = () => {
    console.log("Side panel iframe loaded successfully");
  };

  // Styling for the side panel - like notepad extension
  sidePanelIframe.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    width: 25vw !important;
    min-width: 400px !important;
    max-width: 600px !important;
    height: 100vh !important;
    border: none !important;
    border-left: 1px solid #d1d5db !important;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1) !important;
    z-index: 2147483647 !important;
    background: white !important;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    transform: translateX(100%) !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
  `;

  // Add to document body
  document.body.appendChild(sidePanelIframe);
  console.log("Side panel iframe added to DOM");

  // Animate in
  setTimeout(() => {
    sidePanelIframe.style.transform = "translateX(0)";
    console.log("Side panel animation started");
  }, 50);

  isPanelOpen = true;
  console.log("✅ Side panel created and opened");

  // Store panel state in Chrome storage
  chrome.storage.local.set({ isPanelOpen: true });
}

function removeSidePanel() {
  if (!sidePanelIframe) return;

  console.log("Closing Drape side panel...");

  // Animate out
  sidePanelIframe.style.transform = "translateX(100%)";

  setTimeout(() => {
    if (sidePanelIframe && sidePanelIframe.parentNode) {
      sidePanelIframe.parentNode.removeChild(sidePanelIframe);
    }
    sidePanelIframe = null;
    isPanelOpen = false;
    console.log("✅ Side panel removed");

    // Clear panel state from Chrome storage
    chrome.storage.local.set({ isPanelOpen: false });
  }, 300);
}

function toggleSidePanel() {
  console.log("Toggle side panel requested, current state:", isPanelOpen);

  if (isPanelOpen) {
    removeSidePanel();
  } else {
    createSidePanel();
  }
}

// Test function to manually create side panel (for debugging)
window.createTestSidePanel = function () {
  console.log("Manual test: Creating side panel...");
  createSidePanel();
};

console.log("Content script loaded. Test with: window.createTestSidePanel()");
