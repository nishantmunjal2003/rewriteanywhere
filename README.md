# AI Rewrite Anywhere (`rewriteanywhere`) ✍️⚡

[![Environment](https://img.shields.io/badge/Environment-Windows%20Only%20(10%20%7C%2011%20x64)-0078D6?logo=windows)](https://microsoft.com/windows)
[![Pricing](https://img.shields.io/badge/Pricing-%2419%20USD%20%7C%20%E2%82%B92%2C000%20INR%20(Lifetime)-10b981)](#-commercial-pricing--14-day-guarantee)
[![License Policy](https://img.shields.io/badge/Protection-1%20Active%20PC%20Secret%20Key-6366f1)](#-secret-key-license-protection--anti-piracy)
[![Guarantee](https://img.shields.io/badge/Guarantee-14--Day%20Money--Back-emerald)](#-14-day-money-back-guarantee)
[![Runtime](https://img.shields.io/badge/.NET-8.0%20Desktop%20Runtime-purple.svg)](https://dotnet.microsoft.com/download/dotnet/8.0)
[![Tests](https://img.shields.io/badge/Tests-70%20Passing-brightgreen.svg)]()

> **⚠️ WINDOWS ONLY NOTICE:** AI Rewrite Anywhere is engineered exclusively for **Windows 10 and Windows 11 (64-bit)**. It is built natively with C# and deep Windows Win32 / UI Automation hooks for in-place text replacement in any Windows software. (macOS and Linux are not supported).

---

## ⚡ What is AI Rewrite Anywhere?

**AI Rewrite Anywhere** is an ultra-fast, native Windows desktop utility that brings cutting-edge AI rewriting into **every text box, browser, email client, and document** on your computer. 

Highlight any text → press **`Ctrl + Shift + R`** or click the subtle glowing floating button → **your writing transforms in place instantly.**

No more copying text, opening browser tabs, switching back and forth, or paying recurring monthly cloud fees!

---

## 💰 Commercial Pricing & 14-Day Guarantee

Stop paying $15–$30/month subscriptions for Grammarly, ChatGPT Plus, or copywriting tools. AI Rewrite Anywhere is a simple, transparent **one-time purchase with lifetime access**:

| Region | One-Time Price | Included Value |
| :--- | :---: | :--- |
| **International** | **$19 USD** | Lifetime license for 1 active Windows PC, all v1.x updates, free Gemini guide |
| **India Special** | **₹2,000 INR** | Lifetime license for 1 active Windows PC, all v1.x updates, free Gemini guide |

### 🛡️ 14-Day Money-Back Guarantee
We stand 100% behind our software. If AI Rewrite Anywhere does not save you hours every week, simply email **support@rewriteanywhere.com** within 14 days of purchase with your license key or order details, and we will issue a full, unconditional refund immediately.

---

## 🔒 Secret Key License Protection & Anti-Piracy

To ensure fair commercial licensing, each purchase includes a unique secret license key:

```text
ARW-XXXX-XXXX-XXXX-XXXX
```

### 1 Active User / 1 Device Binding Rule:
* Each license is strictly bound to **one (1) active Windows PC** using a non-reversible cryptographic Hardware ID (`HWID-XXXX-XXXX-XXXX-XXXX`) generated from your system's `MachineGuid` and hardware fingerprint.
* **More than one active license will not work:** Attempting to activate the same key on a second computer will be automatically rejected.
* **Upgrading your PC?** If you buy a new computer or reinstall Windows, simply email `support@rewriteanywhere.com` with your license key and our team will reset your active device binding at no extra charge.

### How Administrators Generate License Keys:
For customer orders and sales fulfillment, run the included key generation script:

```powershell
# Generate a single license key
node scripts/generate-license.js

# Generate multiple keys in bulk (e.g. 10 keys)
node scripts/generate-license.js --count 10

# Generate an India-tier license assigned to a customer email
node scripts/generate-license.js --tier "inr" --email "customer@example.com"
```
Generated keys are automatically cataloged in `web/data/licenses.json`.

---

## 🔑 Step-by-Step Manual: How to Grab Your API Keys

AI Rewrite Anywhere uses a **Bring-Your-Own-Key (BYOK)** architecture. You have complete freedom over which AI model you use. All keys are encrypted locally using **Windows DPAPI** (`ProtectedData`)—plaintext keys never leave your PC.

*(Notice: Mock/fake keys have been removed from user-facing dropdowns; only genuine, high-performance AI engines are provided).*

### 🟢 Option 1: Google Gemini (Recommended – 100% Free Tier)
*Google AI Studio provides a free API tier with up to 1,500 requests per day at zero charge!*
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **"Create API key"** and choose or create a project.
4. Copy the generated key (starts with `AIzaSy...`).
5. Open AI Rewrite Anywhere **Settings → AI Provider**, select **Google Gemini**, paste your key, and click **Save Settings**.

### 🔵 Option 2: OpenAI (GPT-4o / GPT-4o-mini)
1. Go to [OpenAI Platform API Keys](https://platform.openai.com/api-keys).
2. Sign in or create an OpenAI developer account.
3. Click **"Create new secret key"**, give it a name (e.g., `RewriteAnywhere`), and copy the key (starts with `sk-proj-...`).
4. In AI Rewrite Anywhere Settings, select **OpenAI**, paste your key, choose your preferred model (`gpt-4o` or `gpt-4o-mini`), and save.

### 🟣 Option 3: Anthropic Claude (Claude 3.5 Sonnet / Haiku)
1. Go to [Anthropic Console](https://console.anthropic.com/settings/keys).
2. Sign in or create an account.
3. Click **"Create Key"**, name it, and copy your secret key (starts with `sk-ant-...`).
4. In AI Rewrite Anywhere Settings, select **Anthropic Claude**, paste your key, choose `claude-3-5-sonnet` or `claude-3-5-haiku`, and save.

---

## 🌐 Next.js Web App & Commercial Portal

The project includes a state-of-the-art Next.js web application located in `web/`:

* **Landing Sales Page (`/`)**: Features hero with Windows badges, live interactive rewrite simulator, subscription comparison table ($19 vs $144+/yr), pricing card with USD ($19) / INR (₹2,000) toggle, and FAQ.
* **How-to-Use Guide (`/how-to-use`)**: Step-by-step visual installation, license activation, and API key guide.
* **Customer Support (`/support`)**: Helpdesk contact form, hardware license reset requests, and support channels.
* **Terms of Service (`/terms`)**: Commercial licensing rules, 1-PC policy, and 14-day refund terms.
* **Privacy Policy (`/privacy`)**: Detailed privacy commitments, DPAPI security, and zero-telemetry architecture.
* **Activation API (`/api/license/activate`)**: Hardware-bound license verification and activation endpoint.
* **Admin Licensing Portal (`/admin`)**: Visual web dashboard to issue commercial keys, search by HWID or key, release hardware locks, and revoke keys (Passcode: `admin2026`).

### Running the Web Application:
```powershell
cd web
npm install
npm run dev     # Starts development server at http://localhost:3000
npm run build   # Builds production Next.js bundle
```

---

## 🚀 Native Windows Desktop Features

* **Universal In-Place Replacement**: Works in Chrome, Edge, Slack, Teams, WhatsApp, Word, Outlook, Notion, Discord, Notepad, and VS Code.
* **Dual Activation Modes**:
  * **Global Hotkey**: Press **`Ctrl + Shift + R`** anywhere.
  * **Floating Assist Button (✨)**: Non-activating, draggable assist button appears near selected text.
* **Strict Clipboard Preservation**: Backs up and restores original clipboard contents within milliseconds.
* **Personal Profile & Email Signatures**: Save your name, title/position, and custom email signature. When drafting or answering emails, the AI automatically integrates your professional context!
* **15 Pre-Tuned Modes**: Improve, Professional, Academic, Email, Friendly, Polite, Shorten, Expand, Grammar Fix, Translate, LinkedIn Post, X/Twitter Post, Facebook Post, Instagram Caption, and Custom Prompt.
* **Intelligent Power Efficiency**: 0.0% idle CPU utilization with Windows `GetLastInputInfo` idle gating.
* **Per-Monitor V2 DPI Scaling**: Sharp, crystal-clear typography on 4K, 1440p, and multi-monitor setups.

---

## 📥 Desktop App Installation

### Option 1: Windows Setup Installer (Recommended)
1. Run the installer: **[`installer/AI-Rewrite-Anywhere-Setup.exe`](installer/AI-Rewrite-Anywhere-Setup.exe)**
2. Follow the setup wizard and launch the app.
3. Open **Settings → License & Protection**, enter your `ARW-XXXX-XXXX-XXXX-XXXX` license key, and click **Activate License**.

### Option 2: Build from Source (.NET 8.0 SDK required)
```powershell
# Build solution
dotnet build -c Release

# Run automated tests (70 unit and integration tests)
dotnet test --filter "FullyQualifiedName!~LiveApplicationIntegrationTests"

# Build self-contained release installer
powershell -ExecutionPolicy Bypass -File build-installer.ps1
```

---

## 🤝 Support & Legal

* **Support Email**: [support@rewriteanywhere.com](mailto:support@rewriteanywhere.com)
* **Sales Inquiries**: [sales@rewriteanywhere.com](mailto:sales@rewriteanywhere.com)
* **Website**: [https://rewriteanywhere.com](https://rewriteanywhere.com)
* **Terms of Service**: [Terms](web/app/terms/page.js)
* **Privacy Policy**: [Privacy](web/app/privacy/page.js)

---
*© 2026 AI Rewrite Anywhere. Designed and engineered exclusively for Microsoft Windows 10 & 11.*
