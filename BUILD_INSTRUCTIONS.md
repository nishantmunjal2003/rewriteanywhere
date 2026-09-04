# BUILD_INSTRUCTIONS.md --- AI Rewrite Anywhere

## Instructions to the Coding Agent

This document is the execution plan. Follow it together with `AGENT.md`.

The goal is not to produce a prototype that merely compiles. The goal is
to produce a working Windows desktop application that can actually
perform:

**Select text → Rewrite → Replace**

------------------------------------------------------------------------

# 1. First: Inspect the Environment

Before writing application code, inspect the machine.

Determine:

-   Windows version
-   architecture
-   installed .NET SDK/runtime
-   Visual Studio/build tools
-   Node.js/npm if relevant
-   available packaging tools
-   PowerShell version
-   whether Notepad, Chrome, Edge, Outlook, Word, WhatsApp, etc. are
    installed

Record relevant findings in `BUILD_ENVIRONMENT.md`.

Do not assume tools exist.

------------------------------------------------------------------------

# 2. Choose the Technology

Evaluate the environment and choose the most reliable Windows-native
architecture.

Prefer:

-   C#/.NET + WPF or WinUI 3

Use Tauri only if it provides equally reliable:

-   global hotkeys
-   clipboard access
-   Windows accessibility/UI Automation
-   floating always-on-top windows
-   focus restoration
-   installer generation

Explain the final choice in `ARCHITECTURE.md`.

------------------------------------------------------------------------

# 3. Create the Repository

Create a clean project.

Use version control if available.

Create a sensible directory structure separating:

-   UI
-   core logic
-   AI providers
-   selection detection
-   clipboard
-   Windows integration
-   settings
-   security
-   logging
-   tests

Do not mix provider-specific API code into UI components.

------------------------------------------------------------------------

# 4. Implement the Smallest Working Vertical Slice First

Before building polished UI, make this work:

``` text
Notepad
   ↓
select text
   ↓
Ctrl+Shift+R
   ↓
get selected text
   ↓
OpenAI
   ↓
receive rewritten text
   ↓
replace selected text
```

Use a simple temporary UI if necessary.

Do not proceed to advanced features until this vertical slice has been
successfully tested.

------------------------------------------------------------------------

# 5. Implement Selection Retrieval

Build the selection service using multiple methods.

Preferred order:

1.  UI Automation/accessibility
2.  Clipboard copy fallback
3.  Keyboard fallback

The clipboard fallback must:

-   save current clipboard
-   copy selected text
-   retrieve selected text
-   restore clipboard

Test clipboard preservation independently.

------------------------------------------------------------------------

# 6. Implement Text Replacement

Implement reliable replacement.

Requirements:

-   original application remains active
-   selected text is replaced
-   clipboard is restored
-   no accidental extra characters
-   no accidental duplicate paste
-   no replacement after a failed AI call

Test repeatedly in Notepad before proceeding.

------------------------------------------------------------------------

# 7. Implement OpenAI Provider

Create a provider abstraction.

Implement OpenAI behind it.

Do not hard-code a model name without checking current official OpenAI
API documentation.

Support:

-   authentication
-   request creation
-   response parsing
-   errors
-   timeouts
-   cancellation where practical

Never print API keys.

Use secure credential storage for user credentials.

------------------------------------------------------------------------

# 8. Add Floating Button

After the keyboard workflow is reliable, implement the floating ✨
button.

It must:

-   appear when a selection is detected
-   disappear when appropriate
-   avoid stealing focus
-   remain above normal windows
-   be small
-   be clickable
-   invoke the rewrite menu

If exact selection bounds cannot be obtained in some applications, use
the best available position and retain the keyboard shortcut.

------------------------------------------------------------------------

# 9. Implement Rewrite Menu

Create the compact menu with:

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

Do not create a complicated multi-window workflow.

The user should be able to perform a rewrite in a few seconds.

------------------------------------------------------------------------

# 10. Add Preview Mode

Implement optional preview.

Default:

**OFF**

When enabled:

``` text
Original
↓
AI result
↓
Cancel / Replace
```

Test both preview and direct-replacement paths.

------------------------------------------------------------------------

# 11. Add Gemini and Claude

Implement:

-   Gemini provider
-   Claude provider

Use current official APIs/documentation.

Keep each provider independent.

The user should be able to change providers from Settings.

------------------------------------------------------------------------

# 12. Implement Settings

Build Settings with:

### General

-   Start with Windows
-   Floating button
-   shortcut
-   preview
-   clipboard restoration
-   notifications

### AI

-   provider
-   API key
-   model
-   test connection

### Writing

-   default mode
-   language
-   style preferences

### Appearance

-   system/light/dark

### Privacy

-   explanation of data sent to provider

------------------------------------------------------------------------

# 13. Implement Secure Credential Storage

Use a Windows-native secure mechanism.

Test:

1.  Enter key.
2.  Save.
3.  Close application.
4.  Reopen.
5.  Confirm application can authenticate.
6.  Confirm the raw key is not visible in normal configuration files.
7.  Confirm logs contain no secret.

Also test deleting/replacing credentials.

------------------------------------------------------------------------

# 14. Implement Error Handling

Simulate:

-   no selection
-   missing API key
-   invalid API key
-   no internet
-   provider timeout
-   provider rate limit
-   malformed provider response
-   empty AI response
-   clipboard failure
-   target application closed during operation

In every case:

**Do not destroy or incorrectly replace the user's text.**

------------------------------------------------------------------------

# 15. Implement System Tray

Application behavior:

``` text
Start application
      ↓
System tray icon
      ↓
Right click
      ├── Settings
      ├── Enable/Disable AI button
      ├── Rewrite selected text
      ├── About
      └── Exit
```

Optional:

-   Start with Windows

The application should not unnecessarily display a main window after
startup.

------------------------------------------------------------------------

# 16. Application Compatibility Testing

Test applications actually installed on the development machine.

Priority:

1.  Notepad
2.  Chrome
3.  Edge
4.  Gmail
5.  Outlook
6.  Word
7.  WhatsApp
8.  Teams
9.  Google Docs
10. LinkedIn

Do not claim compatibility for applications that were not tested.

If an application is not installed:

`NOT TESTED — application not installed`

If the application is installed but the workflow fails:

`FAILED — describe limitation`

------------------------------------------------------------------------

# 17. Test Matrix

Create a test matrix:

  --------------------------------------------------------------------------------------------
  Application   Selection   Shortcut   Floating   Rewrite   Replacement   Clipboard   Result
                                       UI                                             
  ------------- ----------- ---------- ---------- --------- ------------- ----------- --------
  Notepad                                                                             

  Chrome                                                                              

  Edge                                                                                

  Gmail                                                                               

  Outlook                                                                             

  Word                                                                                

  WhatsApp                                                                            

  Teams                                                                               

  Google Docs                                                                         

  LinkedIn                                                                            
  --------------------------------------------------------------------------------------------

Only mark a cell as passed after actually testing it.

------------------------------------------------------------------------

# 18. Unit Tests

Write tests for:

-   prompt construction
-   each rewrite mode
-   language handling
-   provider abstraction
-   provider error conversion
-   secure settings
-   clipboard preservation
-   replacement logic
-   shortcut configuration
-   serialization/deserialization
-   empty responses
-   cancellation

Run the full test suite before release.

------------------------------------------------------------------------

# 19. Integration Tests

Where practical test:

-   OpenAI
-   Gemini
-   Claude
-   clipboard
-   global shortcut
-   floating window
-   replacement

Use mocks where real API calls are inappropriate.

Never place real API keys in source control.

------------------------------------------------------------------------

# 20. Manual End-to-End Validation

Perform a complete real workflow.

### Test Case 1

Open Notepad.

Type:

``` text
sir tomorrow i will not able to attend class because i have some personal work. please allow me leave.
```

Select it.

Invoke rewrite.

Choose Professional.

Verify the result is substantially improved while preserving meaning.

Verify automatic replacement.

------------------------------------------------------------------------

### Test Case 2

Repeat with Academic.

Verify:

-   professional academic language
-   original meaning preserved
-   no invented facts

------------------------------------------------------------------------

### Test Case 3

Repeat with Shorten.

Verify the result is shorter.

------------------------------------------------------------------------

### Test Case 4

Put this into clipboard:

``` text
KEEP THIS CLIPBOARD CONTENT
```

Then perform a rewrite on selected text.

Afterward paste into another application.

Verify the original clipboard content remains.

------------------------------------------------------------------------

### Test Case 5

Use an invalid API key.

Verify:

-   error appears
-   no crash
-   selected text remains unchanged

------------------------------------------------------------------------

# 21. Performance Testing

Measure approximately:

-   application startup time
-   idle memory
-   idle CPU
-   UI response time
-   AI request duration

The application must not freeze while waiting for AI.

------------------------------------------------------------------------

# 22. Security Audit

Before release:

Search source and generated files for:

``` text
sk-
api_key
apikey
password
secret
token
Bearer
```

Review every match.

Confirm there are no real credentials.

Review logs.

Confirm user text is not written to logs.

Confirm secure storage is actually used.

------------------------------------------------------------------------

# 23. Build Release Version

Create a Release build.

Then:

1.  Install using the installer.
2.  Launch installed application.
3.  Test tray behavior.
4.  Test settings.
5.  Test rewrite.
6.  Test uninstall.
7.  Reinstall if necessary.
8.  Test again.

The final validation must use the packaged/installed build, not only the
development build.

------------------------------------------------------------------------

# 24. Generate Documentation

Create:

-   `README.md`
-   `ARCHITECTURE.md`
-   `PRIVACY.md`
-   `BUILD_ENVIRONMENT.md`
-   `VALIDATION_REPORT.md`

README must be understandable to a non-developer.

------------------------------------------------------------------------

# 25. Generate Final Artifacts

The project should produce:

``` text
AI-Rewrite-Anywhere/
├── source/
├── tests/
├── docs/
├── README.md
├── AGENT.md
├── BUILD_INSTRUCTIONS.md
├── ARCHITECTURE.md
├── PRIVACY.md
├── BUILD_ENVIRONMENT.md
├── VALIDATION_REPORT.md
└── installer/
    └── AI-Rewrite-Anywhere-Setup.exe
```

Adapt paths to the actual project structure.

------------------------------------------------------------------------

# 26. Final Validation Checklist

Before reporting completion, verify:

-   [ ] Project builds
-   [ ] Release build succeeds
-   [ ] Installer builds
-   [ ] Installer installs
-   [ ] Application starts
-   [ ] Tray icon works
-   [ ] Settings work
-   [ ] Secure API key storage works
-   [ ] Global shortcut works
-   [ ] Selection retrieval works
-   [ ] Clipboard is preserved
-   [ ] OpenAI works
-   [ ] Gemini works
-   [ ] Claude works
-   [ ] Rewrite modes work
-   [ ] Floating button works where supported
-   [ ] Automatic replacement works
-   [ ] Preview mode works
-   [ ] Error handling works
-   [ ] Application does not crash on failed requests
-   [ ] No secrets are present
-   [ ] No user text is logged
-   [ ] Documentation exists
-   [ ] Validation report is accurate

------------------------------------------------------------------------

# 27. Final Agent Report

When finished, report:

## Build

-   framework
-   runtime
-   build command
-   build result

## Features

List implemented features.

## Providers

List providers tested.

## Applications Tested

List applications with actual test results.

## Installer

Provide exact path to installer.

## Tests

Report exact number passed/failed/skipped.

## Known Limitations

Be honest.

## Next Steps

Recommend improvements for Version 0.2.

Do not claim "production ready" if significant core functionality
remains unreliable.

------------------------------------------------------------------------

# 28. Critical Rule

The most important requirement is:

> **Do not confuse "code generated" with "application completed."**

Completion requires:

**CODE → BUILD → RUN → TEST → FIX → REBUILD → VALIDATE**

If the floating button is difficult to make reliable across all
applications, preserve the product's core value through the global
shortcut + selection/clipboard fallback.

The application must always prioritize:

**Reliability \> visual polish \> additional features.**
