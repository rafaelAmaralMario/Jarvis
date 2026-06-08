# Roadmap

**Legend:** ✅ Concluído | 🔄 Em andamento | ⬜ Pendente

---

### Fase 1-6: Features Base
- [x] Context menus (FileTree, EditorTabs, Agent Panel)
- [x] Model server status detection + start button
- [x] Native folder picker (PowerShell/zenity/osascript)
- [x] Version system + update manager
- [x] Auto-update runtime (download → replace → restart)
- [x] App icon (`scripts/jarvis.ico`)

### Fase 7-8: Infrastructure
- [x] HOW-TO-START.md — setup, dev, produção, troubleshooting
- [x] Build scripts: PyInstaller + Inno Setup + GitHub Actions
- [x] `.github/workflows/release.yml`: CI/CD release workflow
- [x] GitHub Release `v0.1.0` criada e publicada

### Fase 9: Test Suite
- [x] Bridge unit tests: 179 UI + 331 backend + 68 bridge integration
- [x] E2E tests (Playwright): 14 tests, bridge mocking
- [x] Bridge integration tests: 68 tests with real DB + managers
- [x] Screen-by-screen navigation tests
- [x] Ollama error messages with cp1252 compat

---

## Summary
- **Testes:** 524 total (399 backend + 179 UI + 5 server + 14 E2E)
- **Bridge:** 135+ métodos expostos
- **Versão:** 0.1.0
- **Build:** PyInstaller → `dist/JARVIS.exe` (~35MB)
- **Release:** https://github.com/rafaelAmaralMario/Jarvis/releases/tag/v0.1.0
