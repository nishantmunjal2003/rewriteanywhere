# AI Rewrite Anywhere

> **Select text anywhere in Windows → Click ✨ or press `Ctrl + Shift + R` → Instant AI Rewrite & In-Place Replacement.**

AI Rewrite Anywhere is a lightweight, production-grade Windows desktop application that integrates modern AI writing assistance across your entire operating system. It replaces the cumbersome workflow of copying text, switching to a web browser, pasting into ChatGPT, copying the result, and switching back.

Works seamlessly across:
- **Microsoft Notepad**
- **Microsoft Word**
- **Google Chrome & Microsoft Edge**
- **Gmail, Outlook Web, and Google Docs**
- **Messaging and social apps** (WhatsApp, Teams, LinkedIn, X/Twitter)

---

## Key Features

- **In-Place Replacement**: Automatically replaces your selected text with the AI rewritten version.
- **Layered Selection Engine**: Combines Windows UI Automation with a safe, atomic clipboard fallback.
- **Strict Clipboard Preservation**: Backs up and restores your existing clipboard data (text, images, files) so nothing is lost.
- **Non-Activating Floating Button (✨)**: A small, rounded floating button appears near selections without stealing focus from your active document.
- **Global Keyboard Shortcut**: Default `Ctrl + Shift + R` (fully customizable in Settings).
- **11 Rewrite Modes**:
  - ✨ **Improve**: Enhances grammar, flow, clarity, and readability.
  - 💼 **Professional**: Polished, articulate, executive business tone.
  - 🎓 **Academic**: Formal academic English with strict protection against hallucinated citations or data.
  - 📧 **Email**: Structured, courteous, professional email communication.
  - 😊 **Friendly**: Warm, conversational, and natural tone.
  - 🙏 **Polite**: Diplomatic, respectful, and considerate phrasing.
  - ✂ **Shorten**: Removes fluff and verbosity while keeping key information.
  - ➕ **Expand**: Adds clarity, context, and elaboration without inventing facts.
  - 🔤 **Grammar**: Direct spelling, punctuation, and grammar correction with minimal changes.
  - 🌐 **Translate**: High-quality translation into 10+ languages (English, Hindi, Spanish, French, German, Chinese, Japanese, and more).
  - ✍ **Custom**: Enter any custom prompt (e.g., *"Convert into bullet points"*, *"Make punchy"*).
- **My Writing Style**: Configure personalized tone, formality, length, and technical term rules applied automatically across rewrites.
- **Preview Mode (Optional)**: Optional side-by-side comparison before replacing text.
- **One-Step Undo**: Quickly reverse any rewrite via the system tray or shortcut.
- **Bring Your Own Key (BYOK)**: Supports **OpenAI**, **Google Gemini**, **Anthropic Claude**, and a built-in **Mock Provider** for offline testing.
- **Bank-Grade Credential Protection**: API keys are encrypted with **Windows DPAPI** (`ProtectedData`) bound to your Windows account. Keys are never stored in plaintext or logged.
- **Zero Intermediary Servers**: Directly communicates with provider endpoints via HTTPS.

> [!IMPORTANT]
> **Billing Notice**:  
> This application uses the user's own AI provider API key. AI provider usage charges are billed directly by the respective provider.

---

## Installation

### Prerequisites
- Windows 10 or Windows 11 (64-bit)
- .NET 8.0 Desktop Runtime (included by default on updated Windows 11 systems, or install via `dotnet-runtime-8.0`).

### Running the Setup Installer
1. Download or locate `AI-Rewrite-Anywhere-Setup.exe` in the `installer/` directory.
2. Run `AI-Rewrite-Anywhere-Setup.exe`.
3. Follow the installation wizard. You can optionally check:
   - *Create a desktop shortcut*
   - *Start automatically with Windows*
4. Click **Finish**. The application will launch and minimize to your Windows system tray.

---

## First-Time Setup & Configuration

1. In your system tray (bottom-right near clock), right-click the **✨ AI Rewrite Anywhere** icon and click **⚙ Settings...**.
2. Click the **🤖 AI Provider & Keys** tab.
3. Choose your desired provider:
   - **OpenAI**: Enter your API key (`sk-...`), select a model (e.g., `gpt-4o-mini`, `gpt-4o`), and click **Save Key**.
   - **Google Gemini**: Enter your Gemini API key, select model (e.g., `gemini-2.5-flash`), and click **Save Key**.
   - **Anthropic Claude**: Enter your Anthropic API key, select model (e.g., `claude-3-5-haiku-20241022`), and click **Save Key**.
   - **Mock Provider**: Requires no key; ideal for offline testing, demos, or air-gapped environments.
4. Click **Test Connection** to verify your API credentials.
5. Click **Save & Close**.

---

## How to Use

### Method 1: Using the Floating Button (✨)
1. In any application (Notepad, Word, Chrome, etc.), select any text.
2. A small floating ✨ button appears near your selection.
3. Click the ✨ button to open the rewrite menu.
4. Click your desired mode (e.g., **Professional**).
5. The selected text is automatically replaced in your application!

### Method 2: Using the Global Shortcut (`Ctrl + Shift + R`)
1. Select text in any window.
2. Press **`Ctrl + Shift + R`**.
3. The AI Rewrite menu opens.
4. Select a mode or type a custom instruction and press Enter.
5. The text is automatically replaced.

### Method 3: System Tray Menu
- Right-click the system tray icon to access:
  - **Rewrite Selected Text**
  - **Undo Last Rewrite**
  - **Show/Hide Floating AI Button**
  - **Settings...**
  - **View Logs**
  - **Exit**

---

## Building from Source

### Prerequisites
- .NET SDK 8.0 or 10.0 (`winget install Microsoft.DotNet.SDK.8`)
- Inno Setup 6 (optional, for building the installer)

### Build Commands
```powershell
# Restore dependencies
dotnet restore

# Build Solution
dotnet build -c Release

# Run Unit & Integration Tests (43 tests)
dotnet test -v normal

# Publish Release Binaries
dotnet publish src/AIRewriteAnywhere/AIRewriteAnywhere.csproj -c Release -r win-x64 --self-contained false -o dist

# Build Installer (produces installer/AI-Rewrite-Anywhere-Setup.exe)
powershell -ExecutionPolicy Bypass -File installer\build-installer.ps1
```

---

## Troubleshooting & Known Limitations

### Troubleshooting
- **"Please select some text first"**: Ensure text is actively highlighted before pressing `Ctrl+Shift+R`.
- **"The API key was rejected"**: Open Settings, re-enter your provider API key, and click *Test Connection*. Verify your provider account has active credit/quota.
- **Floating button does not appear**: Some elevated administrative applications (e.g., Command Prompt running as Admin) restrict UI Automation from lower-integrity processes. Use `Ctrl+Shift+R` to trigger the rewrite menu directly.

### Known Limitations
- Applications using custom non-standard render canvases (like older Java Swing apps or protected game engines) may not expose caret bounding coordinates. In these cases, the menu opens near the mouse cursor and uses the clipboard fallback.
- Native Microsoft Outlook desktop, Teams, and WhatsApp were not installed on this test machine and are documented accordingly in `VALIDATION_REPORT.md`.

---

## License & Support
Distributed under the MIT License. See [PRIVACY.md](PRIVACY.md) and [ARCHITECTURE.md](ARCHITECTURE.md) for further technical details.
