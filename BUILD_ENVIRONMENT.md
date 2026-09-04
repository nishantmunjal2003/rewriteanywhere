# BUILD_ENVIRONMENT.md

## Machine Environment Inspection Report

*Inspection Date*: 2026-09-04  
*Target Application*: AI Rewrite Anywhere  

### 1. Operating System & Platform
- **OS Name**: Microsoft Windows 11 Pro
- **OS Version**: 10.0.26200 (Build 26200)
- **Architecture**: 64-bit (`win-x64`)
- **PowerShell Version**: 5.1.26100.9168 (Desktop Edition)

### 2. .NET Toolchain & Runtimes
- **.NET SDK**: 10.0.201 (`C:\Program Files\dotnet\sdk\10.0.201`)
- **MSBuild Version**: 18.3.0-release-26153-122
- **Installed Desktop Runtimes**:
  - `Microsoft.WindowsDesktop.App 10.0.5`
  - `Microsoft.WindowsDesktop.App 8.0.23`
  - `Microsoft.NETCore.App 10.0.5`
  - `Microsoft.NETCore.App 8.0.23`
- **Selected Target Framework**: `net8.0-windows` (LTS baseline for maximum stability and compatibility across Windows 10/11)

### 3. Developer & Packaging Tools
- **Inno Setup**: Version 6.7.3 (`$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe`) - Verified functional
- **Git**: Version installed at `C:\Program Files\Git\cmd\git.exe`
- **Node.js / npm**: Node.js installed at `C:\Program Files\nodejs\node.exe`

### 4. Target Application Availability Matrix
| Application | Installed Status | Detected Path |
| :--- | :--- | :--- |
| **Microsoft Notepad** | **Installed** | `C:\windows\system32\notepad.exe` |
| **Google Chrome** | **Installed** | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| **Microsoft Edge** | **Installed** | `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` |
| **Microsoft Word** | **Installed** | `C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE` |
| **Microsoft Outlook** | *Not Installed* | N/A |
| **Microsoft Teams** | *Not Installed* | N/A |
| **WhatsApp Desktop** | *Not Installed* | N/A |

### 5. Architectural Decision
Based on the available native Windows toolchain and deep integration requirements (UI Automation, Win32 hooks, RegisterHotKey, DPAPI, non-activating floating windows `WS_EX_NOACTIVATE`, clipboard restoration), **C# / .NET 8 WPF (`net8.0-windows`)** is selected as the primary implementation architecture.
