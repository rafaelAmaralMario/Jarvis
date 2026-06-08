# Roadmap

**Legend:** ✅ Concluído | 🔄 Em andamento | ⬜ Pendente

---

### Fase 1-4: Context Menus (FileTree, EditorTabs, Agent Panel)
- [x] ContextMenu component reutilizável + prevenção global
- [x] FileTree context menu: novo arquivo/pasta, renomear, excluir, copiar caminhos, reveal
- [x] EditorTabs context menu: salvar, fechar, split, shortcuts visuais
- [x] Agent panel context menu: novo chat, limpar, copiar, exportar, config

### Fase 5: Model Server Status Detection
- [x] Bridge methods `getModelServerStatus()` / `startModelServer()`
- [x] ModelsPanel banner: verde (rodando) / vermelho (parado) com PID
- [x] Auto-refresh 5s + botão "▶ Iniciar Servidor"

### Fase 6: Native Folder Picker
- [x] Bridge `showFolderPicker()` via PowerShell/zenity/osascript
- [x] WorkspacePanel: botão "Abrir Pasta" abre diálogo nativo
- [x] Fallback para input manual

### Fase 7: Documentation + Contexts + E2E
- [x] .context/ files for phases 1-6
- [x] HOW-TO-START.md — setup, dev, produção, troubleshooting
- [x] E2E tests (Playwright) — 9 tests, bridge mocking
- [x] All 514 tests passing (318 backend + 179 UI + 8 server + 9 E2E)

### Fase 8: Version System + Update Manager
- [x] `version.py`: version parsing, GitHub releases API, release info
- [x] Bridge: `getAppVersion()`, `checkForUpdates()`, `getAvailableVersions()`, `downloadAndInstall()`
- [x] `UpdatesPanel.tsx`: painel de atualizações com verificação + seletor de versão
- [x] `StatusBar.tsx`: badge de notificação "vX.Y.Z disponível"
- [x] Build scripts: `build_exe.py` (PyInstaller), `jarvis.spec`, `installer.iss` (Inno Setup)
- [x] `.github/workflows/release.yml`: GitHub Actions release workflow
- [x] `scripts/jarvis.ico`: app icon
- [x] 13 tests for version module (331/331 backend)

### Fase 9: Auto-Update Runtime + Release
- [x] Auto-update: download → replace executable → restart on Windows
- [ ] Criar primeira release `v0.1.0` no GitHub

---

## Summary
- **Testes:** 524 total (331 backend + 179 UI + 5 server + 9 E2E)
- **Bridge:** 110+ métodos expostos
- **Versão:** 0.1.0
- **Build:** PyInstaller → .exe → Inno Setup installer
