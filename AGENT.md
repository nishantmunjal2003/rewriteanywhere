# AGENT.md --- AI Rewrite Anywhere

## Mission

You are an autonomous senior Windows desktop engineer, product designer,
security engineer, QA engineer, and release engineer.

Build a production-quality Windows application named **AI Rewrite
Anywhere**.

The core experience is:

> Select text anywhere in Windows → invoke a small floating AI control →
> choose a rewrite action → receive an AI rewrite → automatically
> replace the selected text.

The application is initially for personal use but must be architected so
it can later become a commercial product.

Do not stop after generating source code. You must build, run, test,
debug, rebuild, and validate the application.

------------------------------------------------------------------------

## 1. Product Goal

The application eliminates this workflow:

1.  Select text.
2.  Copy it.
3.  Open ChatGPT.
4.  Paste it.
5.  Ask for a polished version.
6.  Copy the result.
7.  Return to the original application.
8.  Paste it.

Replace it with:

**Select → AI button/shortcut → Rewrite → Replace**

The application should work across Windows applications as broadly as
technically possible.

Target applications include:

-   Microsoft Notepad
-   Microsoft Word
-   Microsoft Outlook
-   Gmail in Chrome/Edge
-   Google Docs
-   Chrome
-   Microsoft Edge
-   Firefox
-   WhatsApp Desktop
-   Microsoft Teams
-   LinkedIn
-   Facebook
-   X/Twitter
-   OneNote
-   Notepad++

Where an application does not expose selected text reliably, use the
required fallback mechanisms described below.

------------------------------------------------------------------------

## 2. Platform

Initial target:

-   Windows 10
-   Windows 11
-   64-bit

The application must be a real Windows desktop application.

It must:

-   run in the background/system tray
-   optionally start with Windows
-   provide a Settings window
-   provide a global keyboard shortcut
-   provide a floating rewrite button where technically possible
-   work without ChatGPT being open
-   work without a browser extension
-   work without Microsoft Word being installed

------------------------------------------------------------------------

## 3. Core Workflow

Implement this exact primary workflow:

``` text
User selects text
       ↓
Application detects selection
       ↓
Floating ✨ button appears
       ↓
User clicks ✨
       ↓
Rewrite menu appears
       ↓
User selects action
       ↓
Selected text is sent to configured AI provider
       ↓
AI response is returned
       ↓
Selected text is automatically replaced
       ↓
Original application regains focus
       ↓
User continues typing
```

Also provide a mandatory keyboard fallback:

``` text
Select text
   ↓
Ctrl + Shift + R
   ↓
Rewrite menu
   ↓
AI
   ↓
Replace selected text
```

The exact shortcut should be configurable.

------------------------------------------------------------------------

## 4. Text Selection Architecture

Do not assume one technique will work everywhere.

Implement a layered selection strategy.

### Strategy A --- Windows Accessibility / UI Automation

Use Windows accessibility/UI automation APIs where available to
determine:

-   focused control
-   selected text
-   selection bounds
-   active application

### Strategy B --- Clipboard fallback

When direct selection retrieval is unavailable:

1.  Preserve current clipboard contents.
2.  Trigger copy of the current selection.
3.  Read selected text.
4.  Restore the user's original clipboard contents.
5.  Perform the rewrite.
6.  Replace the selection.
7.  Restore clipboard again if necessary.

Clipboard preservation is mandatory.

Never silently destroy the user's existing clipboard contents.

### Strategy C --- Keyboard replacement fallback

Use keyboard automation where necessary:

-   copy selected text
-   process it
-   paste rewritten result

Do not implement global keylogging.

Only issue explicit keyboard actions as part of the requested rewrite
operation.

### Strategy D --- Floating button fallback

If a particular application does not expose enough information to
position the floating button correctly, the global keyboard shortcut
must still work.

The application must degrade gracefully rather than fail completely.

------------------------------------------------------------------------

## 5. Floating AI Button

When selected text can be detected and its screen position can
reasonably be determined, display a small floating button near the
selection.

Concept:

``` text
┌──────┐
│  ✨  │
└──────┘
```

Requirements:

-   compact
-   modern
-   rounded
-   always-on-top
-   visually unobtrusive
-   light/dark/system theme compatible
-   should not steal focus unnecessarily
-   should disappear when selection disappears
-   should not interfere with normal typing
-   should be configurable
-   should have accessible labels/tooltips

If exact positioning is unreliable, place the button near the active
text/control or use the keyboard shortcut.

------------------------------------------------------------------------

## 6. Rewrite Menu

Clicking the floating button opens a compact menu.

Minimum actions:

-   Improve
-   Professional
-   Academic
-   Email
-   Friendly
-   Polite
-   Shorten
-   Expand
-   Grammar
-   Translate
-   Custom

Example:

``` text
┌──────────────────────────────┐
│ ✨ AI Rewrite                │
├──────────────────────────────┤
│ ✨ Improve                   │
│ 💼 Professional              │
│ 🎓 Academic                  │
│ 📧 Email                     │
│ 😊 Friendly                  │
│ 🙏 Polite                    │
│ ✂ Shorten                   │
│ ➕ Expand                    │
│ 🔤 Grammar                   │
│ 🌐 Translate                 │
│                              │
│ ✍ Custom instruction...      │
└──────────────────────────────┘
```

The UI must be fast and compact.

------------------------------------------------------------------------

## 7. Rewrite Modes

### Improve

Improve grammar, clarity, readability and naturalness while preserving
meaning.

### Professional

Rewrite professionally and clearly.

### Academic

Use clear academic English while preserving technical terminology and
factual meaning.

Never fabricate:

-   citations
-   references
-   research findings
-   statistics
-   claims

### Email

Rewrite as a professional email/message.

### Friendly

Make the writing warm and natural.

### Polite

Make the writing respectful and courteous.

### Shorten

Make the text shorter while retaining important information.

### Expand

Add useful detail without inventing facts.

### Grammar

Correct grammar, spelling and punctuation with minimal unnecessary
changes.

### Translate

Support at minimum:

-   English
-   Hindi
-   Spanish
-   French
-   German
-   Chinese
-   Japanese

Design the language layer so additional languages can be added later.

### Custom

Allow the user to enter any instruction, for example:

> Make this concise and professional.

------------------------------------------------------------------------

## 8. AI Provider Architecture

Support multiple providers through a common abstraction.

Required initial providers:

-   OpenAI
-   Google Gemini
-   Anthropic Claude

Use a provider interface similar in concept to:

``` text
AIProvider
 ├── OpenAIProvider
 ├── GeminiProvider
 └── ClaudeProvider
```

The UI and core rewrite engine must not depend directly on
provider-specific APIs.

A provider should expose operations conceptually similar to:

``` text
GetModels()
ValidateCredentials()
Rewrite(text, instruction, settings)
```

Use current official provider APIs and current model identifiers. Do not
invent or assume obsolete model names.

When provider documentation or API behavior is uncertain, consult
current official documentation before implementation.

------------------------------------------------------------------------

## 9. Bring Your Own Key (BYOK)

The application uses the user's own API credentials.

The user must NOT provide:

-   ChatGPT password
-   Google password
-   Claude password

Instead, Settings must provide secure API key fields.

Example:

``` text
AI Provider
[ OpenAI ▼ ]

API Key
[ *********************** ]

Model
[ Select model ▼ ]

[ Test Connection ]
```

Support separate credentials for each provider.

The application should allow the user to select the active provider.

Do not require a backend server for Version 1.

The application should communicate directly with the configured provider
APIs.

------------------------------------------------------------------------

## 10. API Key Security

API keys are secrets.

Never:

-   hard-code keys
-   commit keys
-   put keys in source files
-   put keys in distributed .env files
-   store keys in plaintext JSON
-   store keys in plaintext SQLite
-   log keys
-   display keys in error messages
-   transmit keys to our own server

Use Windows-secure storage such as Windows Credential Manager and/or
Windows DPAPI.

Mask API keys in the UI.

Provide:

-   Add key
-   Replace key
-   Delete key
-   Test connection

Search the repository before release for likely credential patterns and
confirm no real credentials are present.

------------------------------------------------------------------------

## 11. Prompt Architecture

All rewrite prompts must preserve the user's intent.

Base system instruction should enforce:

``` text
You are an expert writing assistant.

Rewrite the user's text according to the requested style.

Rules:
1. Preserve the original meaning.
2. Do not invent facts.
3. Do not remove important information.
4. Do not add explanations unless requested.
5. Return only the rewritten text.
6. Preserve technical terminology where appropriate.
7. Preserve names, numbers, dates and URLs.
8. Correct grammar and improve clarity.
```

Add mode-specific instructions.

For Academic mode:

``` text
Rewrite in clear academic English.
Preserve technical terminology and factual meaning.
Do not fabricate citations, references, data, results, or claims.
Return only the rewritten text.
```

Prompts must be generated by the application rather than duplicated
throughout provider implementations.

------------------------------------------------------------------------

## 12. My Writing Style

Design the architecture for a persistent user writing profile.

Settings should eventually support:

``` text
My Writing Style

Tone: Professional
Length: Concise
Formality: High
Language: English

Additional instructions:
Use clear professional English.
Avoid unnecessary greetings.
Avoid unnecessarily complex vocabulary.
Preserve technical terminology.
Keep the original meaning.
```

The profile should be included in rewrite instructions when enabled.

This feature is strategically important for later differentiation.

------------------------------------------------------------------------

## 13. Application Awareness

Design for future application-aware behavior.

Examples:

-   LinkedIn → professional/social style
-   WhatsApp → conversational
-   Outlook/Gmail → professional email
-   Word/Google Docs → document/academic style

Do not make application detection a hard dependency of Version 1.

Version 1 must remain fully usable with explicit rewrite modes.

------------------------------------------------------------------------

## 14. Automatic Replacement

After receiving a successful rewrite:

1.  Confirm a valid original selection exists.
2.  Preserve clipboard.
3.  Focus the original application if required.
4.  Replace selected text.
5.  Restore clipboard.
6.  Restore normal interaction.
7.  Keep the original text available for undo/recovery.

Never replace text if the AI request failed.

Never replace text with an empty response.

Never replace text if the active target changed unexpectedly.

Where possible, verify that the target application still has the
expected selection before replacement.

------------------------------------------------------------------------

## 15. Undo

Support normal application undo whenever possible.

Also maintain a last-operation recovery record.

Provide an internal:

**Undo Rewrite**

operation.

The last replacement should be reversible even if the target application
does not integrate perfectly with its native undo stack.

------------------------------------------------------------------------

## 16. Preview Mode

Settings must include:

``` text
☑ Preview before replacing
```

If enabled, show:

``` text
Original
----------------
selected text

Rewritten
----------------
AI result

[Cancel]    [Replace]
```

Default should be OFF for fast workflows.

------------------------------------------------------------------------

## 17. Settings

Create a professional Settings UI.

### General

-   Start with Windows
-   Show floating button
-   Global shortcut
-   Preview before replacing
-   Restore clipboard
-   Enable notifications

### AI Provider

-   Active provider
-   Provider credentials
-   Model
-   Test connection

### Writing

-   Default rewrite mode
-   Default language
-   My Writing Style
-   Preserve technical terms
-   Preferred tone

### Appearance

-   Light
-   Dark
-   System
-   Floating button size

### Privacy

Clearly explain:

> Selected text is sent to the AI provider you configure when you
> request a rewrite.

Do not make false privacy claims.

### About

-   Version
-   Update information
-   License
-   Support

------------------------------------------------------------------------

## 18. Privacy Requirements

The application must:

-   process only the text required for the requested operation
-   never continuously record the screen
-   never globally record keystrokes
-   never upload clipboard contents except when explicitly required to
    retrieve selected text for a rewrite
-   never collect unrelated application contents
-   never send selected text to our own server in Version 1
-   communicate directly with the selected provider
-   avoid persistent storage of user text unless a user explicitly
    enables history

If history is implemented, provide a clear way to disable and delete it.

------------------------------------------------------------------------

## 19. Logging

Logs may contain diagnostics such as:

``` text
Rewrite requested
Provider: OpenAI
Mode: Professional
Duration: 1.8 seconds
Status: Success
```

Never log:

-   selected text
-   AI responses containing user content
-   clipboard content
-   API keys
-   authorization headers
-   passwords

Sanitize exceptions before logging.

------------------------------------------------------------------------

## 20. Error Handling

Handle at minimum:

### No selection

Show:

> Please select some text first.

### Missing credentials

Show:

> Please configure an AI provider and API key in Settings.

### Invalid credentials

Show:

> The API key was rejected. Please check your provider settings.

### Network error

Show:

> Unable to contact the AI provider. Please check your internet
> connection.

### Rate limit

Show:

> The AI provider has temporarily rate-limited this request.

### Empty AI response

Do not modify the original selection.

### Replacement failure

Keep original text unchanged where possible and show an actionable
error.

### Clipboard failure

Do not destroy clipboard contents.

### Provider unavailable

Allow the user to switch providers.

The application must never crash because of a failed rewrite.

------------------------------------------------------------------------

## 21. Performance

The app should be lightweight while idle.

Requirements:

-   fast startup
-   low idle CPU
-   reasonable memory usage
-   asynchronous network operations
-   non-blocking UI
-   cancellable AI requests where supported
-   responsive floating UI

Show a subtle state:

``` text
✨ Rewriting...
```

Do not freeze the application while waiting for AI.

------------------------------------------------------------------------

## 22. Recommended Technology

Choose the technology that gives the most reliable Windows integration.

Preferred:

### Option A

C# / .NET with WinUI 3 or WPF.

### Option B

Tauri + TypeScript/React only if Windows accessibility, global hotkeys,
floating windows, clipboard handling, and packaging can be implemented
reliably.

Prioritize:

1.  Windows integration
2.  Reliability
3.  Security
4.  Maintainability
5.  Performance
6.  Installer quality

Do not select a framework merely because it is familiar.

Document the decision in `ARCHITECTURE.md`.

------------------------------------------------------------------------

## 23. Project Structure

Maintain clear separation, conceptually similar to:

``` text
/src
    /UI
    /Core
    /AI
        /OpenAI
        /Gemini
        /Claude
    /WindowsIntegration
    /Selection
    /Clipboard
    /Security
    /Settings
    /History
    /Logging
    /Tests
```

Adapt the exact structure to the selected framework.

Keep provider-specific implementation isolated.

Use dependency injection where appropriate.

------------------------------------------------------------------------

## 24. Testing Strategy

Create unit tests for:

-   prompt generation
-   rewrite modes
-   provider abstraction
-   provider error mapping
-   settings
-   secure credential handling
-   clipboard preservation
-   text replacement
-   active-window validation
-   configuration
-   error handling

Create integration tests where practical for:

-   provider connectivity
-   global shortcut
-   clipboard workflow
-   floating window
-   text replacement

Real API credentials must never be committed.

Use environment variables, secure local test configuration, or mocked
providers for automated tests.

------------------------------------------------------------------------

## 25. Mandatory Real-World Validation

Do not declare success merely because compilation succeeds.

Actually build and run the application.

At minimum validate:

### Test A --- Startup

-   Launch application
-   Verify no crash
-   Verify tray icon
-   Verify Settings
-   Verify application remains active

### Test B --- Settings

-   Configure provider
-   Enter API key
-   Save
-   Close Settings
-   Reopen Settings
-   Verify credential remains securely available without displaying it

### Test C --- Notepad

Use:

``` text
this is a test sentence which needs improvement
```

Select it.

Press the global shortcut.

Verify rewrite menu appears.

Perform a real rewrite.

Verify the selected text is replaced.

### Test D --- Clipboard

Put unrelated content into the clipboard.

Perform a rewrite.

Verify clipboard contents are preserved.

### Test E --- Chrome/Edge

Test selection, rewrite and replacement.

### Test F --- Outlook/Gmail

Test selection, rewrite and replacement.

### Test G --- Word

Test selection, rewrite and replacement if Word is installed.

### Test H --- WhatsApp Desktop

Test if installed.

### Test I --- Invalid API key

Verify:

-   meaningful error
-   no crash
-   original text remains
-   clipboard remains safe

### Test J --- Provider switching

Verify switching between providers works without application restart
where practical.

------------------------------------------------------------------------

## 26. Test Reporting

Create:

`VALIDATION_REPORT.md`

It must contain actual results.

Example:

``` text
AI Rewrite Anywhere
Version: 0.1.0

Build
✓ Release build completed

Unit Tests
✓ 42 passed
✗ 0 failed

Integration Tests
✓ Clipboard workflow
✓ Global shortcut
✓ OpenAI provider

Windows Integration
✓ System tray
✓ Settings
✓ Floating UI

Applications
✓ Notepad
✓ Chrome
NOT TESTED — Outlook not installed
NOT TESTED — Word not installed
```

Never mark a test as passed unless it was actually performed.

If an application is unavailable:

**NOT TESTED --- application not installed**

If something fails:

**FAILED --- include the reason and attempted fix.**

------------------------------------------------------------------------

## 27. Security Validation

Before release:

Search the entire repository for:

``` text
sk-
api_key
apikey
password
secret
token
Bearer
```

Verify:

-   no real credentials
-   no credential logging
-   no plaintext API-key storage
-   no user content in diagnostic logs
-   secure credential storage is actually used

------------------------------------------------------------------------

## 28. Installer

Create a real Windows installer.

Preferred final artifact:

``` text
AI-Rewrite-Anywhere-Setup.exe
```

or equivalent professional Windows installer.

Installer requirements:

-   install/uninstall
-   Start Menu entry
-   optional desktop shortcut
-   optional start-with-Windows setting
-   clean uninstall
-   version information

Do not require development tools on the user's PC.

------------------------------------------------------------------------

## 29. Documentation

Create:

-   `README.md`
-   `ARCHITECTURE.md`
-   `PRIVACY.md`
-   `VALIDATION_REPORT.md`

README must explain:

-   product purpose
-   installation
-   first-time setup
-   OpenAI configuration
-   Gemini configuration
-   Claude configuration
-   floating button
-   keyboard shortcut
-   rewrite modes
-   privacy
-   troubleshooting
-   known limitations

Clearly state:

> This application uses the user's own AI provider API key. AI provider
> usage charges are billed by the respective provider.

------------------------------------------------------------------------

## 30. Commercial Readiness

Do not implement payments in Version 1.

However, keep the architecture ready for:

``` text
Free
Pro
Academic
Team
Enterprise
```

Potential future differentiators:

-   My Writing Style
-   academic writing
-   application-aware modes
-   custom commands
-   team style guides
-   cloud sync
-   usage analytics
-   institution licensing

Version 1 should remain simple and reliable.

------------------------------------------------------------------------

## 31. Development Order

Follow this order.

### Phase 1 --- Core

Build:

``` text
Notepad
→ select
→ Ctrl+Shift+R
→ retrieve selection
→ OpenAI
→ replace
```

Do not proceed until this works reliably.

### Phase 2 --- Floating UI

Implement the floating ✨ button.

### Phase 3 --- Settings

Implement secure provider configuration.

### Phase 4 --- Other providers

Add:

-   Gemini
-   Claude

### Phase 5 --- Rewrite modes

Implement all modes.

### Phase 6 --- Windows integration

Improve:

-   UI Automation
-   accessibility
-   clipboard fallback
-   active-window detection
-   application compatibility

### Phase 7 --- Reliability

Implement:

-   error handling
-   undo
-   cancellation
-   clipboard safety
-   focus restoration

### Phase 8 --- Testing

Perform actual application tests.

### Phase 9 --- Packaging

Build installer.

### Phase 10 --- Final validation

Run complete validation again after packaging.

------------------------------------------------------------------------

## 32. Mandatory Agent Behavior

Do not:

-   merely describe code
-   stop after scaffolding
-   stop after compilation
-   use fake/mock behavior as the final implementation
-   claim tests passed without running them
-   invent unsupported application compatibility
-   hard-code secrets
-   implement keylogging
-   upload screen contents
-   destroy clipboard contents
-   leave core functionality as TODO
-   ignore build failures
-   ignore runtime failures

When a failure occurs:

1.  Diagnose it.
2.  Fix it.
3.  Rebuild.
4.  Re-run the relevant test.
5.  Record the final result.

------------------------------------------------------------------------

## 33. Definition of Done

The project is complete only when the following real workflow works:

``` text
Windows 10/11
      ↓
Open Notepad
      ↓
Type text
      ↓
Select text
      ↓
Ctrl + Shift + R
      ↓
Rewrite menu
      ↓
Professional
      ↓
AI provider processes selected text
      ↓
Original selection replaced
      ↓
User continues typing
```

And, where supported:

``` text
Select text
      ↓
Floating ✨ button
      ↓
Professional
      ↓
Automatic replacement
```

The release must include:

1.  Source code
2.  Tests
3.  Build instructions
4.  Installer
5.  README
6.  Architecture documentation
7.  Privacy documentation
8.  Validation report
9.  Known limitations
10. Recommended next steps

**Build it. Run it. Test it. Fix it. Rebuild it. Validate it. Then
report honestly.**
