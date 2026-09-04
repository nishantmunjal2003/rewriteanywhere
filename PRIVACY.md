# PRIVACY.md — AI Rewrite Anywhere

Last Updated: September 2026  
Application Version: 0.1.0  

## Privacy Commitment

**AI Rewrite Anywhere** is designed with privacy and data protection as fundamental architectural constraints. We recognize that you use this software to rewrite sensitive communications, professional emails, research manuscripts, and personal thoughts.

---

## 1. Direct Client-to-Provider Architecture (No Intermediate Servers)

- **Zero Third-Party Relays**: AI Rewrite Anywhere does **not** route your text through any proprietary proxy or cloud service operated by us.
- **Direct Provider Communication**: When you request a rewrite, the application communicates directly from your computer via HTTPS to the AI provider endpoint you have configured (e.g., OpenAI, Google Gemini, or Anthropic Claude).
- **Your Own Credentials (BYOK)**: The application uses your own API keys. You maintain full ownership and control over your relationship with the AI provider.

> [!IMPORTANT]
> **Billing & Account Notice**:  
> This application uses the user's own AI provider API key. AI provider usage charges are billed directly by the respective provider in accordance with your account agreement with them.

---

## 2. Text Processing & Scope

- **On-Demand Processing Only**: The application only reads text when you explicitly initiate a rewrite action (via the floating ✨ button, the global shortcut `Ctrl+Shift+R`, or the system tray menu).
- **No Global Keylogging**: The application registers a discrete global hotkey with Windows (`RegisterHotKey`) to detect its trigger shortcut. It **never** intercepts, listens to, or logs arbitrary keystrokes.
- **No Screen Recording**: The application does not capture, record, OCR, or transmit screenshots or screen contents.
- **No Unrelated Window Scraping**: The application does not scan or read background windows, open browser tabs, or other applications.

---

## 3. Clipboard Privacy & Data Integrity

- **Temporary Transaction Only**: When UI Automation cannot directly extract text from a specific application (such as legacy editors or web canvases), the application utilizes a temporary clipboard transaction.
- **Mandatory Preservation & Restoration**: The application captures a memory backup of your existing clipboard, reads the selected text, and **immediately restores your previous clipboard contents**.
- **No Clipboard Telemetry**: Your clipboard contents are never logged, uploaded, or transmitted anywhere except the selected text explicitly submitted for rewriting.

---

## 4. API Key Security & Windows DPAPI

- **Hardware & Account Bound Encryption**: All API keys entered in Settings are encrypted at rest using the **Windows Data Protection API (DPAPI)** with `DataProtectionScope.CurrentUser`.
- **Zero Plaintext Storage**: Keys are never stored in plaintext configuration files, JSON documents, or SQLite databases.
- **No Key Logging**: Diagnostic logs explicitly scrub and redact sensitive credential patterns (e.g., `sk-...`, `Bearer ...`, `key=...`).
- **UI Masking**: Keys are masked with bullet characters (`●●●●●●●●`) in the Settings interface.

---

## 5. Local Storage & Diagnostic Logging

- **No User Text in Logs**: Diagnostic log files (`%LocalAppData%\AIRewriteAnywhere\logs\rewrite_anywhere.log`) record only high-level operational telemetry (e.g., timestamp, provider name, rewrite mode, request duration, and error codes). User input text and AI outputs are **strictly excluded** from diagnostic logs.
- **Local Configuration**: Non-sensitive application preferences (shortcut key combinations, window size preferences, active theme, and writing style preferences) are stored locally in `%LocalAppData%\AIRewriteAnywhere\settings.json`.
