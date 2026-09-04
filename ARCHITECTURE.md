# ARCHITECTURE.md — AI Rewrite Anywhere

## 1. Overview & Architectural Philosophy

**AI Rewrite Anywhere** is a Windows desktop application engineered to provide a seamless, system-wide text enhancement experience. Its purpose is to eliminate context switching between writing tools (Notepad, Word, web browsers, chat applications) and web-based AI interfaces.

### Core Architectural Principle
**"Reliability > Visual Polish > Additional Features"**  
The application is designed defensively so that:
- It works even when native accessibility APIs fail (via automatic layered fallbacks).
- It never corrupts or destroys the user's existing clipboard contents.
- It never freezes the user interface during network operations.
- It stores credentials strictly in encrypted native operating system vaults (Windows DPAPI).
- It transmits data directly to the user's chosen provider with no intermediate servers.

---

## 2. Technology Selection Rationale

### Choice: C# / .NET 8 WPF (`net8.0-windows`)

We selected **C# / .NET 8 WPF** over hybrid/web-wrapper alternatives (such as Electron or Tauri) based on the following technical requirements:

1. **Native Win32 & Desktop Integration**: Direct access to `RegisterHotKey`, `SendInput`, `GetGUIThreadInfo`, `SetForegroundWindow`, and `AttachThreadInput` without IPC friction or cross-process serialization bottlenecks.
2. **True Non-Activating Windows (`WS_EX_NOACTIVATE`)**: A critical feature of the floating button (✨) is that clicking or displaying it must *never* steal focus from the user's target document or browser. WPF provides low-level window hook access (`OnSourceInitialized` / `SetWindowLongPtr`) to set `WS_EX_NOACTIVATE | WS_EX_TOPMOST | WS_EX_TOOLWINDOW`.
3. **Deep UI Automation Support**: Native bindings to `System.Windows.Automation` and `UIAutomationClient` for inspecting focused elements, text selection ranges, and bounding screen rectangles.
4. **Zero-Dependency Native Security**: Direct access to Windows Data Protection API (DPAPI) via `System.Security.Cryptography.ProtectedData`, binding encryption keys to the active user profile without third-party credential vaults or plaintext files.
5. **System Tray Integration**: Native tray notification icon with context menus and balloon alerts.
6. **Ultra-Low Memory & Lightweight Footprint**: Single self-contained or framework-dependent executable (~150 KB compiled binary, ~2.1 MB installer) with instant startup time (< 0.8s) and minimal idle CPU usage (0.0%).

---

## 3. Subsystem Architecture & Separation of Concerns

The solution strictly decouples concerns across discrete architectural boundaries:

```
src/AIRewriteAnywhere/
├── Common/               # Core enums, constants, observable objects, relay commands
├── Models/               # Data Transfer Objects (AppSettings, RewriteRequest, etc.)
├── Security/             # DPAPI encrypted storage implementation
├── Settings/             # JSON configuration persistence & event dispatch
├── AI/                   # Provider abstractions, prompts, OpenAI, Gemini, Claude, Mock
├── Clipboard/            # Clipboard backup, atomic restoration, format preservation
├── Selection/            # Layered selection retrieval (UI Automation + Clipboard fallback)
├── Replacement/          # Automatic in-place text replacement & undo recovery
├── WindowsIntegration/   # Win32 P/Invoke, Global Hotkeys, Foreground Tracker, Auto-Start
├── Logging/              # Sanitized diagnostic logging (scrubs keys and user text)
├── UI/                   # Floating Button, Rewrite Menu, Preview, Settings, Tray Icon
└── Core/                 # Central RewriteOrchestrator pipeline
```

---

## 4. Layered Selection Strategy

To support applications ranging from native Win32 controls to modern Windows 11 packaged XAML apps and web canvases:

```
[User triggers Ctrl+Shift+R or clicks ✨]
                   │
                   ▼
       Strategy A: UI Automation
 (Inspect FocusedElement / Document via TextPattern)
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    Text Found?         No Text / Unsupported?
        YES                  │
         │                   ▼
         │       Strategy B: Clipboard Fallback
         │    1. Backup existing user clipboard
         │    2. Focus target window (AttachThreadInput)
         │    3. Synthesize Ctrl+C (SendInput)
         │    4. Read copied text from clipboard
         │    5. IMMEDIATELY restore user clipboard!
         │                   │
         └─────────┬─────────┘
                   ▼
      [SelectionInfo Constructed]
   (Contains: Text, TargetHwnd, Bounds)
```

### Clipboard Preservation Invariant
Whenever Strategy B is invoked or text replacement is performed:
1. All available clipboard formats (Text, UnicodeText, HTML, RTF, Dib, FileDropList) are captured into a `ClipboardBackup` object.
2. The internal clipboard transaction occurs.
3. The original `ClipboardBackup` is restored to the Windows clipboard.
The user's prior clipboard content is never permanently lost.

---

## 5. AI Provider Architecture (BYOK)

The AI layer adheres to the Dependency Inversion Principle. No UI or orchestrator component references provider-specific SDKs or endpoints directly.

```
                  ┌──────────────────┐
                  │   IAIProvider    │
                  └─────────┬────────┘
        ┌───────────────────┼───────────────────┬───────────────────┐
        ▼                   ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│OpenAIProvider│    │GeminiProvider│    │ClaudeProvider│    │MockAIProvider│
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

- **OpenAI Provider**: Calls `https://api.openai.com/v1/chat/completions` with bearer authentication.
- **Gemini Provider**: Calls Google Gemini `generateContent` API with user-configured API key.
- **Claude Provider**: Calls Anthropic Messages API `https://api.anthropic.com/v1/messages` with `x-api-key` header.
- **Mock AI Provider**: In-memory deterministic engine providing realistic rewrites for all 11 modes, translations, and offline unit test simulations.

---

## 6. Prompt Engineering Architecture

System prompts are formulated centrally by `PromptBuilder` enforcing the strict requirements of `AGENT.md` §11:
1. **Meaning Preservation**: Original meaning and core intent are strictly maintained.
2. **Fact Integrity**: Prohibits hallucination or fabrication of claims, numbers, citations, or statistics (especially enforced in *Academic* mode).
3. **Concise Non-Chatty Output**: Returns *only* the rewritten text without preambles like "Here is your rewrite:".
4. **Entity & Terminology Protection**: Preserves proper nouns, URLs, formulas, dates, and technical terminology.
5. **Writing Style Profile**: Personalizes tone, length, and formality when enabled in user settings.

---

## 7. Non-Activating Floating UI (`WS_EX_NOACTIVATE`)

Windows typically activates a window and steals keyboard focus whenever a window is displayed or clicked.
To prevent this, `FloatingButtonWindow` initializes with Win32 extended window styles:
- `WS_EX_NOACTIVATE (0x08000000)`: Prevents Windows from bringing the button window into foreground focus.
- `WS_EX_TOPMOST (0x00000008)`: Keeps the button floating visibly above document windows.
- `WS_EX_TOOLWINDOW (0x00000080)`: Prevents the button from appearing as a clutter item in Alt+Tab or the taskbar.

---

## 8. Security Architecture

- **At-Rest Encryption**: API keys are encrypted using Windows DPAPI (`ProtectedData.Protect` with `DataProtectionScope.CurrentUser`), rendering the encrypted bytes indecipherable by any other user or machine.
- **In-Memory Masking**: Keys are presented in Settings as password characters (`●●●●●●●●`).
- **Sanitized Logging**: `FileLogger` uses regular expressions to redact API key patterns (`sk-...`, `Bearer ...`, `key=...`) and excludes raw user text from log entries.
