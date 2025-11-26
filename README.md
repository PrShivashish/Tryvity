# Tryvity - Virtual Try-On Chrome Extension

<div align="center">
  <img src="icons/icon128.png" alt="Tryvity Logo" width="128" height="128">
  
  **Minimalistic virtual try-on experience powered by AI**
  
  [![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
  [![AI Powered](https://img.shields.io/badge/AI-Gemini%202.5-orange)](https://ai.google.dev/)
</div>

## 🌟 Features

- **🎯 Seamless Product Detection** - Automatically detects products on e-commerce websites
- **📸 Photo Upload** - Upload your photo for personalized virtual try-on
- **🤖 AI-Powered Generation** - Uses Google Gemini 2.5 Flash for realistic virtual try-on images
- **🎨 3D Carousel History** - Beautiful 3D carousel to browse your previous try-ons
- **💾 Persistent Experience** - Extension stays open across page navigations
- **🎨 Minimalistic Design** - Clean, modern interface with GageExo font
- **📱 Responsive Layout** - Side panel that adapts to different screen sizes

## 🎬 Demo

Watch the extension in action:

https://github.com/yourusername/tryvity-extension/assets/Demovideo.webm

_Complete demonstration of the Tryvity extension workflow_

## 🚀 Quick Start

### Prerequisites

- Google Chrome browser
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/tryvity-extension.git
   cd tryvity-extension
   ```

2. **Configure API Key**

   ```bash
   cp config.example.js config.local.js
   ```

   Edit `config.local.js` and add your API key:

   ```javascript
   const LOCAL_CONFIG = {
     GOOGLE_GEMINI_API_KEY: "your-actual-api-key-here",
     GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
   };
   ```

3. **Load Extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension folder

## 📖 How It Works

### User Workflow

1. **📸 Upload Your Photo**

   - Click the Tryvity extension icon
   - Upload a clear photo of yourself
   - Click "Continue" to proceed

2. **🛍️ Browse Products**

   - Navigate to any e-commerce website
   - Click on any product you want to try on
   - The extension automatically detects and loads the product

3. **🎯 Virtual Try-On**

   - Click "Try On" to generate your virtual try-on image
   - Wait 10-30 seconds for AI processing
   - View your personalized result

4. **📚 Browse History**
   - Use the 3D carousel to browse previous try-ons
   - Click any thumbnail to view that result
   - Download your favorite looks

### Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content Script │    │   Background    │    │   Popup/UI      │
│                 │    │     Script      │    │                 │
│ • Product Detect│◄──►│ • Message Relay │◄──►│ • Photo Upload  │
│ • Click Handler │    │ • Panel Toggle  │    │ • Product Display│
│ • Page Injection│    │ • State Mgmt    │    │ • AI Generation  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Gemini AI API  │
                    │                 │
                    │ • Image Upload  │
                    │ • Try-On Gen    │
                    │ • Result Return │
                    └─────────────────┘
```

## 🎨 Sample Images

### Before & After

<table>
<tr>
<td align="center">
<strong>Original Product</strong><br>
<img src="user-image.png" alt="Product Image" width="300">
</td>
<td align="center">
<strong>Virtual Try-On Result</strong><br>
<img src="sample2.png" alt="Try-On Result" width="300">
</td>
</tr>
</table>

_Real examples showing the transformation from product to virtual try-on result_

## 🛠️ Development

### Project Structure

```
tryvity-extension/
├── 📁 icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── 📄 manifest.json          # Extension manifest
├── 📄 background.js          # Background script
├── 📄 content.js             # Content script (product detection)
├── 📄 popup.html             # Extension UI
├── 📄 popup.css              # Styling
├── 📄 popup.js               # Main logic
├── 📄 config.js              # Configuration
├── 📄 config.example.js      # API key template
├── 📄 sample1.png            # Sample product image
├── 📄 sample2.png            # Sample try-on result
├── 📄 Demovideo.webm         # Demo video
└── 📄 README.md              # This file
```

### Key Features Implementation

- **Product Detection**: Advanced selectors for major e-commerce sites
- **AI Integration**: Two-step Gemini API process (upload → generate)
- **State Management**: Chrome storage for persistence across sessions
- **3D Carousel**: CSS transforms and JavaScript for smooth animations
- **Error Handling**: Comprehensive error handling and user feedback

### Configuration

The extension uses a two-tier configuration system:

1. **`config.local.js`** - Your personal settings (API key, etc.)
2. **`config.js`** - Fallback settings and defaults

## 🔧 API Configuration

### Supported Models

- **Primary**: `gemini-2.5-flash-image` - Latest model with image generation
- **Fallback**: `gemini-2.0-flash-exp` - Alternative model
- **Legacy**: `gemini-1.5-pro` - Stable model for testing

### API Endpoints

- **File Upload**: `https://generativelanguage.googleapis.com/upload/v1beta/files`
- **Content Generation**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`

## 🚨 Security & Privacy

- ✅ **API Key Protection** - Local configuration files are gitignored
- ✅ **No Data Collection** - Extension doesn't collect personal data
- ✅ **Secure Storage** - Uses Chrome's local storage API
- ✅ **HTTPS Only** - All API calls use secure connections

### Best Practices

- Never commit `config.local.js` to version control
- Regularly rotate your API keys
- Use environment variables for production deployments
- Monitor API usage in Google AI Studio

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🙏 Acknowledgments

- **Google Gemini AI** - For providing the AI capabilities
- **Chrome Extensions API** - For the extension framework
- **GageExo Font** - For the beautiful typography
- **Open Source Community** - For inspiration and tools

---

<div align="center">
  <p>Made with ❤️ by the Tryvity Team</p>
  <p>
    <a href="#top">⬆️ Back to Top</a> •
    <a href="https://github.com/yourusername/tryvity-extension">⭐ Star on GitHub</a> •
    <a href="https://chrome.google.com/webstore">📦 Install Extension</a>
  </p>
</div>
