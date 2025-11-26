// Example configuration file - Copy this to config.local.js and add your API key
// This file shows the structure needed for local configuration

const LOCAL_CONFIG = {
  // Replace with your actual Google Gemini API key
  GOOGLE_GEMINI_API_KEY: "YOUR_API_KEY_HERE",

  // API endpoint (usually doesn't need to change)
  GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
};

// Make config available globally
if (typeof window !== "undefined") {
  window.LOCAL_CONFIG = LOCAL_CONFIG;
}
