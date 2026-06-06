# Sistema de Build e Deploy

## Build Local (Windows)

### Pre-requisitos
- Python 3.14+
- Node.js 20+
- WebView2 Runtime (ja incluso no Windows 11)

### Comando unico
```powershell
.\build_rls.bat
```

O `build_rls.bat` executa:
1. `npm install` — instala dependencias da UI
2. `npm run build` — build React com Vite → `backend/jarvis/webui/`
3. `pip install -e .` — instala o backend Python

### Build manual passo a passo
```powershell
# 1. Build da UI
cd ui
npm install
npm run build    # → ../backend/jarvis/webui/

# 2. Instalar backend
cd ../backend
pip install -e .
```

### Executar
```powershell
python backend/jarvis/main.py
```

### Modo Desenvolvimento
```powershell
# Terminal 1: dev server React
cd ui && npm run dev

# Terminal 2: backend com --dev aponta para Vite
python backend/jarvis/main.py --dev
```

## Pip Install

O backend usa `pyproject.toml` padrao com setuptools:

```toml
[project]
name = "jarvis"
version = "0.1.0"
requires-python = ">=3.14"
dependencies = [
    "pywebview>=5,<6",
    "httpx>=0.28,<1",
    "cryptography>=44,<45",
    "pyte>=0.8,<1",
]

[project.scripts]
jarvis = "jarvis.main:main"
```

## Testes

```powershell
cd backend
python -m pytest      # 260+ testes (unitarios + integracao)

cd ../ui
npm test              # 145 testes Vitest
```

## CI/CD (GitHub Actions — Nao Iniciado)

Pipeline planejado:
- Build em matriz (Windows + Linux)
- Testes pytest + Vitest
- Lint Python (ruff) + TypeScript (ESLint)

## Distribuicao (Nao Iniciada)

| Plataforma | Formato | Ferramenta |
|-----------|---------|-----------|
| Windows | .exe installer | NSIS + PyInstaller |
| Linux | .AppImage | PyInstaller + appimagetool |
| macOS | .dmg | PyInstaller + create-dmg |
