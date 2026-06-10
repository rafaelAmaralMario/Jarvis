; Inno Setup script for JARVIS Installer
; Requires Inno Setup 6+ (https://jrsoftware.org/isdl.php)
;
; Build .exe first with:
;   python scripts/build_exe.py
;
; Then compile installer with:
;   iscc scripts/installer.iss

#define MyAppName "JARVIS"
#define MyAppVersion "0.2.0"
#define MyAppPublisher "JARVIS AI"
#define MyAppURL "https://github.com/rafaelAmaralMario/Jarvis"
#define MyAppExeName "JARVIS.exe"

[Setup]
AppId={{8A2E3B1C-5D4F-4A6B-9C8E-7F1D2E3A4B5C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\dist
OutputBaseFilename=JARVIS-Setup-{#MyAppVersion}
Compression=lzma2/ultra
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
DisableProgramGroupPage=yes
SetupIconFile=..\scripts\jarvis.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName} {#MyAppVersion}
ShowLanguageDialog=auto
LanguageDetectionMethod=uilanguage
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} - AI Assistant with Integrated IDE

[Languages]
Name: "portuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na &Área de Trabalho"; GroupDescription: "Ícones adicionais:"; Flags: checkedonce
Name: "quicklaunchicon"; Description: "Criar atalho na &Barra de Tarefas"; GroupDescription: "Ícones adicionais:"; Flags: checkedonce; OnlyBelowVersion: 0,6.1

[Files]
Source: "..\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion isreadme
Source: "..\CHANGELOG.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Comment: "Iniciar {#MyAppName}"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon; Comment: "Iniciar {#MyAppName}"
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Iniciar {#MyAppName} agora"; Flags: postinstall nowait skipifsilent shellexec

[UninstallRun]
Filename: "{cmd}"; Parameters: "/C taskkill /F /IM JARVIS.exe 2>NUL"; Flags: runhidden

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    if not FileExists(ExpandConstant('{app}\{#MyAppExeName}')) then
      MsgBox('JARVIS.exe não encontrado! A compilação pode ter falhado.', mbError, MB_OK);
  end;
end;

function InitializeUninstall(): Boolean;
var
  ResultCode: Integer;
begin
  Result := True;
  if FileExists(ExpandConstant('{app}\{#MyAppExeName}')) then
  begin
    Exec(ExpandConstant('{cmd}'), '/C taskkill /F /IM JARVIS.exe 2>NUL', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
