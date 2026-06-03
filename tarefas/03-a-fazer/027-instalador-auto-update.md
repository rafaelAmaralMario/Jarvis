# 027 — Instalador + Auto-update

## Metadados
- Status: a fazer
- Prioridade: 🟡 Média
- Fase: 8 — Distribuição
- Dependências: (nenhuma — pode ser feito a qualquer momento)

## Descrição
Gerar instaladores para Windows (.exe), Linux (.AppImage) e macOS (.dmg),
com sistema de auto-update via GitHub Releases.

## Especificação Técnica

### 1. Windows — Instalador NSIS

**Dependência:** NSIS (Nullsoft Scriptable Install System)

**Script NSIS — `installer/jarvis.nsi`:**
```nsis
!define PRODUCT_NAME "JARVIS"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "JARVIS"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "JARVIS-${PRODUCT_VERSION}-Setup.exe"
InstallDir "$LOCALAPPDATA\JARVIS"

Section "Install"
  SetOutPath "$INSTDIR"
  File "build\Release\jarvis.exe"
  File "build\Release\*.dll"
  File /r "build\Release\webui"
  File /r "build\Release\plugins"
  File "build\Release\models\whisper-base.bin"
  
  CreateDirectory "$INSTDIR\logs"
  CreateDirectory "$INSTDIR\data"
  
  CreateShortCut "$DESKTOP\JARVIS.lnk" "$INSTDIR\jarvis.exe"
  CreateDirectory "$SMPROGRAMS\JARVIS"
  CreateShortCut "$SMPROGRAMS\JARVIS\JARVIS.lnk" "$INSTDIR\jarvis.exe"
  
  WriteUninstaller "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\JARVIS" "DisplayName" "JARVIS"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\JARVIS" "UninstallString" "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\JARVIS.lnk"
  RMDir /r "$SMPROGRAMS\JARVIS"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\JARVIS"
SectionEnd
```

**Geração automatizada (CMake):**
```cmake
add_custom_target(pack_win
    COMMAND makensis installer/jarvis.nsi
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
)
```

### 2. Linux — AppImage

**Dependência:** linuxdeployqt ou AppImageKit

**Script — `installer/jarvis.appimage.sh`:**
```bash
#!/bin/bash
# 1. Build Linux binaries
mkdir -p build-appimage && cd build-appimage
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)

# 2. Package with linuxdeployqt
wget -c "https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage"
chmod +x linuxdeploy-x86_64.AppImage

export VERSION=1.0.0
./linuxdeploy-x86_64.AppImage \
    --appdir AppDir \
    --executable jarvis \
    --desktop-file installer/jarvis.desktop \
    --icon-file installer/jarvis.png \
    --output appimage
```

**jarvis.desktop:**
```desktop
[Desktop Entry]
Name=JARVIS
Comment=AI-Powered Development Assistant
Exec=jarvis
Icon=jarvis
Terminal=false
Type=Application
Categories=Development;Utility;
```

### 3. macOS — DMG

**Script — `installer/jarvis.dmg.sh`:**
```bash
#!/bin/bash
# 1. Build macOS bundle
mkdir -p build/JARVIS.app/Contents/MacOS
mkdir -p build/JARVIS.app/Contents/Resources
cp build/Release/jarvis build/JARVIS.app/Contents/MacOS/
cp installer/jarvis.icns build/JARVIS.app/Contents/Resources/

# 2. Info.plist
cat > build/JARVIS.app/Contents/Info.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key><string>JARVIS</string>
    <key>CFBundleDisplayName</key><string>JARVIS</string>
    <key>CFBundleIdentifier</key><string>com.jarvis.app</string>
    <key>CFBundleVersion</key><string>1.0.0</string>
    <key>CFBundleShortVersionString</key><string>1.0.0</string>
    <key>CFBundleExecutable</key><string>jarvis</string>
    <key>CFBundleIconFile</key><string>jarvis</string>
    <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
EOF

# 3. Create DMG
hdiutil create -volname "JARVIS" -srcfolder build/JARVIS.app -ov -format UDZO "JARVIS-1.0.0.dmg"
```

### 4. Auto-update System

**Arquitetura:**
- App verifica atualizações ao iniciar (e a cada 6h)
- Consulta GitHub Releases API: `https://api.github.com/repos/{owner}/{repo}/releases/latest`
- Compara versão local com latest
- Se newer: notifica usuário com botão "Baixar e Instalar"

**C++ — UpdateChecker:**
```cpp
class UpdateChecker {
    std::string currentVersion;
    std::string latestVersion;
    std::string downloadUrl;
    bool isChecking = false;

    void checkForUpdates();           // GET /releases/latest
    void downloadUpdate(const std::string& url);   // Download + progresso
    void installUpdate(const std::string& filePath);  // Executa instalador
};
```

**Bridge handlers:**
```cpp
bridge.registerHandler("updateCheck", [updateChecker](const QVariantList&) -> QVariant {
    updateChecker->checkForUpdates();
    return true;
});

bridge.registerHandler("updateGetStatus", [updateChecker](const QVariantList&) -> QVariant {
    QJsonObject obj;
    obj["currentVersion"] = QString::fromStdString(updateChecker->currentVersion);
    obj["latestVersion"] = QString::fromStdString(updateChecker->latestVersion);
    obj["updateAvailable"] = !updateChecker->downloadUrl.empty();
    obj["isChecking"] = updateChecker->isChecking;
    return obj;
});

bridge.registerHandler("updateDownload", [updateChecker](const QVariantList&) -> QVariant {
    updateChecker->downloadUpdate(updateChecker->downloadUrl);
    return true;
});

bridge.registerHandler("updateInstall", [updateChecker](const QVariantList&) -> QVariant {
    updateChecker->installUpdate("");
    return true;
});
```

**Eventos:**
```cpp
bridge.emitEvent("update-checking", {});
bridge.emitEvent("update-available", {{"version", "1.1.0"}, {"url", "..."}});
bridge.emitEvent("update-not-available", {});
bridge.emitEvent("update-download-progress", {{"percent", 45}});
bridge.emitEvent("update-downloaded", {});
bridge.emitEvent("update-error", {{"message", "Failed to download"}});
```

**React — UpdateNotification.tsx:**
- Banner no topo da UI quando update disponível
- "JARVIS 1.1.0 disponível — Baixar agora"
- Barra de progresso durante download
- Botão "Instalar e Reiniciar" após download
- Settings > Sobre: "Verificar atualizações" + versão atual

**Binary Signing:**
- Windows: `signtool sign /a /fd SHA256 /td SHA256 jarvis.exe`
- macOS: `codesign --sign "Developer ID" JARVIS.app`
- Linux: `gpg --detach-sign --armor JARVIS.AppImage`
- Chaves de signing armazenadas em CI/CD secrets

### 5. CI/CD Integration

**GitHub Actions — `.github/workflows/release.yml`:**
```yaml
name: Release
on:
  push:
    tags: ['v*.*.*']

jobs:
  build-win:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: |
          cmake -B build -DCMAKE_BUILD_TYPE=Release
          cmake --build build --config Release
      - name: Package
        run: makensis installer/jarvis.nsi
      - name: Sign
        run: signtool sign /fd SHA256 JARVIS-Setup.exe
      - name: Upload
        uses: actions/upload-artifact@v4
        with:
          name: jarvis-win
          path: JARVIS-Setup.exe

  release:
    needs: [build-win, build-linux, build-mac]
    runs-on: ubuntu-latest
    steps:
      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            JARVIS-Setup.exe
            JARVIS.AppImage
            JARVIS.dmg
```

## Critérios de Aceitação
- [ ] Instalador Windows (.exe) funciona com instalação silenciosa (/S)
- [ ] Instalador Linux (.AppImage) funciona
- [ ] Instalador macOS (.dmg) funciona
- [ ] App adicionado ao menu iniciar/programs
- [ ] Uninstaller funciona (remove todos os arquivos)
- [ ] Auto-update detecta versão mais recente no GitHub
- [ ] Notificação de update aparece na UI
- [ ] Download de update com barra de progresso
- [ ] Instalação automática do update

## Test Cases

### TC-001: Instalação Windows
- **Passos:** 1. Executar JARVIS-Setup.exe
- **Resultado:** App instalado em $LOCALAPPDATA\JARVIS, atalho no desktop e menu iniciar
- **Cobertura:** normal

### TC-002: Desinstalação
- **Passos:** 1. Executar uninstall.exe
- **Resultado:** Todos os arquivos removidos, atalhos deletados, entrada do registry removida
- **Cobertura:** normal

### TC-003: Check update disponível
- **Pré:** Versão local < latest release no GitHub
- **Passos:** 1. Settings > Sobre > "Verificar atualizações"
- **Resultado:** "JARVIS x.y.z disponível" com botão "Baixar"
- **Cobertura:** normal

### TC-004: Download + instalação
- **Passos:** 1. Clicar "Baixar" no update notification
- **Resultado:** Barra de progresso aparece, ao completar botão "Instalar e Reiniciar"
- **Cobertura:** normal

### TC-005: Sem update disponível
- **Pré:** Versão local = latest release
- **Passos:** 1. "Verificar atualizações"
- **Resultado:** "Você já está usando a versão mais recente."
- **Cobertura:** normal
