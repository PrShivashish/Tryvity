// Popup script with photo upload and Gemini API integration

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 POPUP LOADED - Starting initialization...");
  loadProductInfo();
  setupEventListeners();
  initializeHistory();
  chrome.action.setBadgeText({ text: "" });
  console.log("✅ Popup initialization completed");
});

function setupEventListeners() {
  const uploadArea = document.getElementById("upload-area");
  const photoInput = document.getElementById("photo-input");
  uploadArea?.addEventListener("click", () => photoInput.click());
  photoInput?.addEventListener("change", handlePhotoUpload);

  const continueBtn = document.getElementById("continue-btn");
  continueBtn?.addEventListener("click", handleContinue);

  const restartBtn = document.getElementById("restart-btn");
  restartBtn?.addEventListener("click", handleRestart);

  const closeBtn = document.getElementById("close-btn");
  closeBtn?.addEventListener("click", handleClose);

  const tryOnBtn = document.getElementById("try-on-btn");
  tryOnBtn?.addEventListener("click", handleTryOn);

  document.getElementById("download-btn")?.addEventListener("click", downloadResult);
  document.getElementById("try-another-btn")?.addEventListener("click", () => {
    chrome.storage.local.remove(["lastProduct"], showNoProductSelected);
  });
}

function loadProductInfo() {
  chrome.storage.local.get(["lastProduct", "userPhoto"], function (result) {
    if (result.lastProduct) {
      displayProduct(result.lastProduct);
    } else {
      if (result.userPhoto) {
        displayUploadedPhoto(result.userPhoto);
      }
      showNoProduct();
    }
  });
}

function displayProduct(product) {
  const noProductDiv = document.getElementById("no-product");
  const productDisplay = document.getElementById("product-display");
  const noProductSelected = document.getElementById("no-product-selected");
  const productContent = document.getElementById("product-content");

  if (noProductDiv) noProductDiv.style.display = "none";
  if (noProductSelected) noProductSelected.style.display = "none";
  if (productDisplay) productDisplay.style.display = "block";
  if (productContent) productContent.style.display = "flex";

  const productName = document.getElementById("product-name");
  const productImage = document.getElementById("product-image");
  const productUrl = document.getElementById("product-url");

  if (productName) productName.textContent = product.name || "Unknown Product";
  if (productImage && product.image) {
    productImage.src = product.image;
    productImage.style.display = "block";
    productImage.onerror = () => (this.style.display = "none");
  } else if (productImage) {
    productImage.style.display = "none";
  }
  if (productUrl) productUrl.href = product.url;

  resetToProductView();
  updateTryOnButton();
}

function showNoProduct() {
  document.getElementById("no-product").style.display = "flex";
  document.getElementById("product-display").style.display = "none";
}

function showNoProductSelected() {
  document.getElementById("no-product").style.display = "none";
  const productDisplay = document.getElementById("product-display");
  productDisplay.style.display = "block";
  document.getElementById("no-product-selected").style.display = "flex";
  document.getElementById("product-content").style.display = "none";
  document.getElementById("try-on-btn").style.display = "none";
  document.getElementById("result-actions").style.display = "none";
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) return alert("Please select an image file.");
  if (file.size > 5 * 1024 * 1024) return alert("Image size must be less than 5MB.");

  const reader = new FileReader();
  reader.onload = (e) => {
    const photoData = { data: e.target.result, name: file.name, type: file.type };
    chrome.storage.local.set({ userPhoto: photoData }, () => {
      displayUploadedPhoto(photoData);
      updateTryOnButton();
    });
  };
  reader.readAsDataURL(file);
}

function displayUploadedPhoto(photoData) {
  const uploadArea = document.getElementById("upload-area");
  const continueBtn = document.getElementById("continue-btn");
  if (!uploadArea) return;

  uploadArea.innerHTML = "";
  const img = document.createElement("img");
  img.src = photoData.data;
  img.className = "upload-preview";
  uploadArea.appendChild(img);

  const overlay = document.createElement("div");
  overlay.className = "upload-overlay";
  overlay.innerHTML = `<div class="change-photo-text">Change Photo</div>`;
  uploadArea.appendChild(overlay);
  uploadArea.classList.add("has-photo");

  if (continueBtn) {
    continueBtn.style.display = "block";
    setTimeout(() => continueBtn.classList.add("show"), 50);
  }
}

function handleContinue() {
  document.getElementById("no-product").style.display = "none";
  document.getElementById("product-display").style.display = "block";
  showNoProductSelected();
  chrome.storage.local.set({ isPanelOpen: true });
}

function handleRestart() {
  chrome.storage.local.remove(["userPhoto", "lastProduct", "isPanelOpen"], () => {
    location.reload();
  });
}

function handleClose() {
  chrome.storage.local.set({ isPanelOpen: false }, () => {
    chrome.runtime.sendMessage({ action: "closeSidePanel" });
  });
}

function updateTryOnButton() {
  chrome.storage.local.get(["lastProduct", "userPhoto"], (result) => {
    const tryOnBtn = document.getElementById("try-on-btn");
    if (tryOnBtn) {
        tryOnBtn.disabled = !(result.lastProduct && result.userPhoto);
    }
  });
}

async function handleTryOn() {
  if (document.getElementById("try-on-btn").disabled) return;
  showLoadingState();

  try {
    const { lastProduct: product, userPhoto } = await chrome.storage.local.get(["lastProduct", "userPhoto"]);
    if (!product || !userPhoto) throw new Error("Missing product or user photo.");

    console.log("🚀 Starting API call (Attempt 1)...");
    let resultImage = await callGeminiAPI(product, userPhoto, false);

    const areImagesSimilar = await compareImages(userPhoto.data, resultImage);
    if (areImagesSimilar) {
      console.warn("⚠️ AI returned original image. Retrying with stricter prompt...");
      resultImage = await callGeminiAPI(product, userPhoto, true);
      if (await compareImages(userPhoto.data, resultImage)) {
        throw new Error("The AI couldn't process this item. Please try a different product.");
      }
    }
    showResult(resultImage);
  } catch (error) {
    console.error("💥 Main handleTryOn error:", error);
    showError(error.message || "An unknown error occurred.");
  }
}

function showLoadingState() {
  document.body.style.pointerEvents = "none";
  document.getElementById("loading-overlay").style.display = "flex";
  document.getElementById("try-on-btn").disabled = true;
}

function hideLoadingState() {
  document.body.style.pointerEvents = "auto";
  document.getElementById("loading-overlay").style.display = "none";
  document.getElementById("try-on-btn").disabled = false;
}

function showResult(resultImageData) {
  hideLoadingState();
  document.getElementById("product-image").style.display = "none";
  const resultImage = document.getElementById("result-image");
  resultImage.src = resultImageData;
  resultImage.style.display = "block";
  document.getElementById("try-on-btn").style.display = "none";
  document.getElementById("result-actions").style.display = "flex";
  chrome.storage.local.set({ lastResult: resultImageData });
  saveToHistory(resultImageData);
}

function showError(message) {
  hideLoadingState();
  resetToProductView();
  alert(message);
}

async function uploadFileToGemini(imageUrl, type) {
    console.log(`📤 Uploading ${type} to Gemini File API...`);
    try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to fetch ${type} image: ${imageResponse.status}`);
        
        const imageBlob = await imageResponse.blob();
        const formData = new FormData();
        formData.append("file", imageBlob);

        const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${CONFIG.GOOGLE_GEMINI_API_KEY}`;
        const uploadResponse = await fetch(uploadUrl, { method: "POST", body: formData });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Uploading ${type} failed: ${uploadResponse.status} - ${errorText}`);
        }

        const { file } = await uploadResponse.json();
        console.log(`✅ ${type} uploaded successfully, waiting for processing...`);
        
        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const checkUrl = `https://generativelanguage.googleapis.com/v1beta/${file.name}?key=${CONFIG.GOOGLE_GEMINI_API_KEY}`;
            const stateResponse = await fetch(checkUrl);
            if(stateResponse.ok) {
                const { state } = await stateResponse.json();
                if (state === "ACTIVE") {
                    console.log(`✅ ${type} is ACTIVE.`);
                    return file.uri;
                }
            }
        }
        throw new Error(`${type} file did not become active in time.`);

    } catch (error) {
        console.error(`💥 ${type} upload error:`, error);
        throw error;
    }
}

async function callGeminiAPI(product, userPhoto, isRetry) {
  try {
    if (!CONFIG.GOOGLE_GEMINI_API_KEY || CONFIG.GOOGLE_GEMINI_API_KEY.length < 20) {
      throw new Error("Invalid API key in configuration.");
    }
    const [productFileUri, userFileUri] = await Promise.all([
      uploadFileToGemini(product.image, "Product"),
      uploadFileToGemini(userPhoto.data, "User"),
    ]);

    let prompt = `
      You are a master AI stylist specializing in virtual try-on for all fashion items.
      Your primary goal is to seamlessly and realistically place the fashion item from Image 1 onto the person in Image 2.

      ### CORE LOGIC:
      1.  **Identify Item Type:** First, analyze Image 1 to determine the type of fashion item. Categorize it as:
          * **Upper-Body Wear:** (shirt, t-shirt, jacket, hoodie, etc.)
          * **Lower-Body Wear:** (pants, jeans, shorts, etc.)
          * **Footwear:** (shoes, sneakers, boots, etc.)
          * **Eyewear:** (sunglasses, glasses, etc.)
          * **Wristwear:** (watch, bracelet, etc.)
          * **Headwear:** (hat, cap, etc.)

      2.  **Target and Replace:** Based on the identified category, replace the corresponding area on the person in Image 2.
          * For **Upper-Body Wear**, replace the torso clothing.
          * For **Lower-Body Wear**, replace the pants/shorts.
          * For **Footwear**, replace the shoes.
          * For **Eyewear**, place it on the face over the eyes.
          * For **Wristwear**, place it on the wrist.
          * For **Headwear**, place it on the head.

      3.  **Preserve Everything Else:** It is critical to keep every other part of Image 2 (the person's body, face, hair, background, pose, lighting) completely unchanged.

      ### EXECUTION RULES:
      * **Seamless Integration:** The new item must look 100% natural, matching the original image's lighting, shadows, perspective, and body contours.
      * **No Overlays:** This is a replacement, not a simple paste-over. The original item must be completely removed.
      * **Output:** Return ONLY the final, modified image. Do not include any text, captions, or explanations.
    `;
    
    if (isRetry) {
        prompt += "\n**CRITICAL - SECOND ATTEMPT:** Your first attempt was incorrect. You MUST follow the instructions precisely and replace the correct item. Do not return the original user photo (Image 2) again."
    } else {
        prompt += "\n**STRICT INSTRUCTION:** You must not return the original user photo (Image 2) without any changes. A realistic attempt to place the item on the person is mandatory."
    }

    const requestBody = {
      contents: [{ parts: [ { text: prompt }, { fileData: { mimeType: "image/jpeg", fileUri: productFileUri } }, { fileData: { mimeType: "image/png", fileUri: userFileUri } } ] }],
      generationConfig: { temperature: 0.4, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
    };

    const apiUrl = `${CONFIG.GEMINI_API_URL}?key=${CONFIG.GOOGLE_GEMINI_API_KEY}`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API generation request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
    if (imagePart) {
      return `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`;
    } else {
      throw new Error("Model returned no image. The product might be difficult to process.");
    }
  } catch (error) {
    console.error("💥 callGeminiAPI error:", error);
    throw error;
  }
}

async function compareImages(base64Image1, base64Image2) {
    if (!base64Image1 || !base64Image2) return false;
    return base64Image1 === base64Image2;
}

function downloadResult() {
    chrome.storage.local.get("lastResult", ({lastResult}) => {
        if (lastResult) {
            const link = document.createElement("a");
            link.href = lastResult;
            link.download = "vetra-try-on-result.png";
            link.click();
        }
    });
}

function resetToProductView() {
    document.getElementById("product-image").style.display = "block";
    document.getElementById("result-image").style.display = "none";
    document.getElementById("result-actions").style.display = "none";
    const tryOnBtn = document.getElementById("try-on-btn");
    tryOnBtn.style.display = "block";
    tryOnBtn.disabled = false;
}

function saveToHistory(resultImageData) {
  chrome.storage.local.get(["tryOnHistory", "lastProduct"], (result) => {
    const history = result.tryOnHistory || [];
    const { lastProduct } = result;
    if (!lastProduct) return;
    history.unshift({
      id: Date.now().toString(),
      imageData: resultImageData,
      productName: lastProduct.name,
      productUrl: lastProduct.url,
      productImageUrl: lastProduct.image,
    });
    chrome.storage.local.set({ tryOnHistory: history.slice(0, 20) }, updateHistoryDisplay);
  });
}

function updateHistoryDisplay() {
  chrome.storage.local.get("tryOnHistory", ({tryOnHistory = []}) => {
    const historySection = document.getElementById("history-section");
    const historyTrack = document.getElementById("history-track");
    if (!historySection || !historyTrack) return;
    
    historySection.style.display = tryOnHistory.length > 0 ? "block" : "none";
    historyTrack.innerHTML = "";
    
    tryOnHistory.forEach((item, index) => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";
      historyItem.innerHTML = `<img src="${item.imageData}" alt="${item.productName}">`;
      historyItem.addEventListener("click", () => loadHistoryItem(item, index));
      historyTrack.appendChild(historyItem);
    });
    if(tryOnHistory.length > 0) initializeCarousel(tryOnHistory.length);
  });
}

function loadHistoryItem(historyItem) {
  if (document.body.style.pointerEvents === 'none') return;
  document.getElementById("product-name").textContent = historyItem.productName;
  document.getElementById("product-url").href = historyItem.productUrl;
  showResult(historyItem.imageData);
}

let currentCarouselIndex = 0;
function initializeCarousel(itemCount) {
  currentCarouselIndex = 0;
  updateCarouselState(itemCount);
}

function updateCarouselState(itemCount) {
    const items = document.querySelectorAll(".history-item");
    items.forEach((item, index) => {
        item.classList.remove("active", "adjacent", "distant");
        if (index === currentCarouselIndex) item.classList.add("active");
        else if (Math.abs(index - currentCarouselIndex) <= 1) item.classList.add("adjacent");
        else item.classList.add("distant");
    });
}

function initializeHistory() {
  updateHistoryDisplay();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "productClicked") {
    displayProduct(request.product);
    sendResponse({ received: true });
  }
  return true;
});