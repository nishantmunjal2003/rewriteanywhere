#define MyAppName "AI Rewrite Anywhere"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "AI Rewrite Anywhere"
#define MyAppExeName "AIRewriteAnywhere.exe"

[Setup]
AppId={{D37E6482-62D9-4B56-829E-132A89F95071}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={userpf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\installer
OutputBaseFilename=AI-Rewrite-Anywhere-Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
DisableWelcomePage=no
DisableDirPage=no
DisableProgramGroupPage=auto
CloseApplications=force
RestartApplications=no
AppMutex=AIRewriteAnywhere_SingleInstance_Mutex
UninstallDisplayIcon={app}\{#MyAppExeName}
SetupIconFile=app_icon.ico
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=AI Rewrite Anywhere Setup
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startupicon"; Description: "Start automatically with Windows"; GroupDescription: "Windows Integration:"

[Files]
Source: "..\dist\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Parameters: "--minimized"; Tasks: startupicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
function InitializeSetup(): Boolean;
var
  ErrorCode: Integer;
begin
  Exec('taskkill.exe', '/f /im AIRewriteAnywhere.exe', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
  Sleep(300);
  Result := True;
end;

function InitializeUninstall(): Boolean;
var
  ErrorCode: Integer;
begin
  Exec('taskkill.exe', '/f /im AIRewriteAnywhere.exe', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
  Sleep(300);
  Result := True;
end;
