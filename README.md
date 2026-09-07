# WriteAnywhere (AI Rewrite Anywhere) ✍️✨

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%20Windows%2011-blue.svg)](https://microsoft.com/windows)
[![.NET](https://img.shields.io/badge/.NET-8.0%20Desktop%20Runtime-purple.svg)](https://dotnet.microsoft.com/download/dotnet/8.0)
[![Architecture](https://img.shields.io/badge/Architecture-x64-success.svg)]()
[![Tests](https://img.shields.io/badge/Tests-43%20Passing-brightgreen.svg)]()

> **Select text anywhere across Windows → Click ✨ or press `Ctrl + Shift + R` → Instant AI Rewrite & In-Place Replacement.**

**WriteAnywhere** is a lightweight, ultra-responsive Windows desktop utility that integrates state-of-the-art AI rewriting natively into any application across your entire OS. Eliminate the tedious cycle of copying text, switching windows to a browser, waiting on a web chat prompt, copying the result, and pasting it back.

---

## ⚡ Works Everywhere in Windows

Seamlessly enhances text selection across:
- **Productivity**: Microsoft Word, Google Docs, Excel, PowerPoint, OneNote, Microsoft Notepad
- **Browsers**: Google Chrome, Microsoft Edge, Brave, Mozilla Firefox, Opera
- **Communication**: WhatsApp Desktop, Microsoft Teams, Slack, Telegram, Discord, Zoom Chat
- **Web Mail & Social**: Gmail, Outlook Web, LinkedIn, X / Twitter, Reddit, Notion
- **Code & Terminals**: VS Code, Sublime Text, Visual Studio, Windows Terminal, Notepad++

---

## 🚀 Key Features

* **In-Place Replacement**: Replaces your highlighted text with the refined version instantly.
* **Non-Activating Floating Button (✨)**: A subtle, rounded floating button appears right near your active text cursor without stealing focus or interrupting your typing flow.
* **Customizable Global Hotkey**: Trigger anywhere using default **`Ctrl + Shift + R`** (fully configurable in settings).
* **High-DPI & Multi-Monitor Aware**: Per-Monitor V2 DPI scaling ensures crystal-clear rendering across 4K, 1440p, 1080p, and multi-display setups with mixed scaling factors.
* **Robust Hybrid Selection Engine**:
  * Primary: **Windows UI Automation (UIA)** text pattern detection.
  * Fallback: Non-destructive, atomic clipboard capture.
* **Strict Clipboard Preservation**: Backs up and restores your clipboard state (text, rich text, images, and file lists) so your clipboard history remains completely untouched.
* **11 Pre-Tuned Rewrite Modes**:
  | Mode | Icon | Description |
  | :--- | :---: | :--- |
  | **Improve** | ✨ | Enhances grammar, flow, cadence, and overall clarity. |
  | **Professional** | 💼 | Crisp, articulate, and executive business tone. |
  | **Academic** | 🎓 | Rigorous academic English with zero hallucinated claims. |
  | **Email** | 📧 | Courteous, structured, and goal-oriented workplace email. |
  | **Friendly** | 😊 | Warm, empathetic, and natural conversational tone. |
  | **Polite** | 🙏 | Diplomatic, respectful, and considerate phrasing. |
  | **Shorten** | ✂️ | Condenses verbosity while strictly retaining core meaning. |
  | **Expand** | ➕ | Adds helpful depth, context, and nuance without filler. |
  | **Grammar Fix** | 🔤 | Precise punctuation and spelling corrections with minimal edits. |
  | **Translate** | 🌐 | High-fidelity translation across 10+ languages (EN, ES, FR, DE, HI, JA, ZH, etc.). |
  | **Custom Prompt** | ✍️ | Type any custom prompt (e.g., *"Convert to bullet points"*, *"Make humorous"*). |
* **Personalized Writing Style Profile**: Set your preferred tone, length, formality, and technical glossary rules to be applied automatically across all rewrites.
* **Instant Undo (`Ctrl + Z`)**: Revert any rewrite with a single keystroke or from the system tray menu.
* **Side-by-Side Preview (Optional)**: Review a diff of original vs. proposed text before applying changes.

---

## 🔒 Security & Privacy (BYOK)

WriteAnywhere is engineered from the ground up for strict personal privacy:

1. **Bring Your Own Key (BYOK)**: Connect your own API keys directly to **OpenAI**, **Google Gemini**, or **Anthropic Claude**.
2. **Windows DPAPI Hardware Encryption**: All API keys are encrypted with Windows Data Protection API (`ProtectedData`), tied to your Windows user account. Plaintext credentials are **never** stored on disk or in memory dumps.
3. **Zero Intermediary Servers**: Network requests travel directly from your machine to the respective AI provider's official HTTPS endpoints.
4. **Zero Diagnostic Data Logging**: Diagnostic log files scrub all user text and exceptions; prompt content is never logged.
5. **Offline Mock Mode**: Includes a local mock provider for testing, demos, or air-gapped environments without an active internet connection.

---

## 📦 Supported AI Providers & Models

* **Google Gemini**:
  * `gemini-3.6-flash` (Recommended Default)
  * `gemini-flash-latest`
  * `gemini-3.1-flash-lite` (Ultra-low latency)
  * `gemini-pro-latest`
* **OpenAI**:
  * `gpt-4o-mini`
  * `gpt-4o`
  * `gpt-4-turbo`
* **Anthropic Claude**:
  * `claude-3-5-haiku-20241022`
  * `claude-3-5-sonnet-20241022`
* **Mock Provider**: Built-in offline testing engine (no API key required).

---

## 📥 Installation

### Option 1: Windows Setup Installer (Recommended)
1. Grab the latest installer from the `installer/` directory:  
   **[`installer/AI-Rewrite-Anywhere-Setup.exe`](installer/AI-Rewrite-Anywhere-Setup.exe)**
2. Run the installer and follow the setup wizard.
3. Select optional preferences:
   - ✅ *Create a desktop shortcut*
   - ✅ *Start automatically with Windows*
4. Click **Finish**. The app will start running silently in the Windows system tray.

### Option 2: Standalone Release Binary
Directly run the compiled release executable located in `dist/`:
```text
dist\AIRewriteAnywhere.exe
```

---

## ⚙️ Quick Start Guide

1. **Open Settings**: Right-click the **✨** icon in your system tray (bottom-right taskbar) and select **⚙ Settings...**.
2. **Configure Provider**:
   - Select your preferred AI Provider (**Google Gemini**, **OpenAI**, or **Anthropic Claude**).
   - Enter your API key and choose your preferred model.
   - Click **Test Connection** to verify key validity.
   - Click **Save & Close**.
3. **Start Rewriting**:
   - Highlight any text in any program (e.g. an email draft in Chrome).
   - Press **`Ctrl + Shift + R`** or click the floating **✨** button.
   - Choose a mode (e.g. **Professional**).
   - Watch the text transform in place!

---

## 🛠️ Building from Source

### Prerequisites
* Windows 10/11 x64
* [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) or newer
* [Inno Setup 6](https://jrsoftware.org/isinfo.php) (optional, for compiling the setup `.exe`)

### Commands

```powershell
# 1. Clone the repository
git clone https://github.com/nishantmunjal2003/writeanywhere.git
cd writeanywhere

# 2. Restore NuGet dependencies
dotnet restore

# 3. Build Release configuration
dotnet build -c Release

# 4. Run automated test suite (43 tests)
dotnet test -v normal

# 5. Publish self-contained or framework-dependent distribution
dotnet publish src/AIRewriteAnywhere/AIRewriteAnywhere.csproj -c Release -r win-x64 --self-contained false -o dist

# 6. (Optional) Build Inno Setup Installer
powershell -ExecutionPolicy Bypass -File installer\build-installer.ps1
```

---

## 📐 Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Active Windows Window   │
                          │ (Chrome, Word, WhatsApp)  │
                          └─────────────┬─────────────┘
                                        │ Selection Detected
                                        ▼
┌───────────────────────┐        ┌────────────────────────────┐
│   Global Hotkey /     │───────▶│ WindowsIntegration Layer   │
│   Floating ✨ Button  │        │ (UIA / Clipboard Fallback) │
└───────────────────────┘        └─────────────┬──────────────┘
                                               │ Extracted Text
                                               ▼
┌───────────────────────┐        ┌────────────────────────────┐
│   Windows DPAPI       │───────▶│ Core Orchestrator          │
│   Key Vault (Encrypted│        │ (PromptBuilder + Style)    │
└───────────────────────┘        └─────────────┬──────────────┘
                                               │ Structured Prompt
                                               ▼
                                 ┌────────────────────────────┐
                                 │ AI Provider (Direct HTTPS) │
                                 │ Gemini / OpenAI / Claude   │
                                 └─────────────┬──────────────┘
                                               │ Rewritten Text
                                               ▼
                                 ┌────────────────────────────┐
                                 │ Text Replacement Service   │
                                 │ (Atomic in-place swap)     │
                                 └────────────────────────────┘
```

For complete technical specifications, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 📄 Documentation

* [ARCHITECTURE.md](ARCHITECTURE.md) — Deep dive into the threading model, UIA providers, and event pipeline.
* [PRIVACY.md](PRIVACY.md) — Security disclosures, DPAPI encryption specifications, and privacy commitments.
* [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) — Comprehensive developer setup and packaging guide.
* [VALIDATION_REPORT.md](VALIDATION_REPORT.md) — Complete test coverage results, performance benchmarks, and validation logs.

---

## ⚖️ License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete terms.
