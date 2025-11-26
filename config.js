// Configuration file for API keys and settings
// This file loads configuration from config.local.js (which should not be committed)

const CONFIG = {
  // Load API key from local config file
  get GOOGLE_GEMINI_API_KEY() {
    return window.LOCAL_CONFIG?.GOOGLE_GEMINI_API_KEY || "YOUR_API_KEY_HERE";
  },
  get GEMINI_API_URL() {
    return window.LOCAL_CONFIG?.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";
  },
  SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
};

// Make config available globally
if (typeof window !== "undefined") {
  window.CONFIG = CONFIG;
}
