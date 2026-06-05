# Sistema de Build e Deploy

## Build Local (Windows)

### Pré-requisitos
- Visual Studio 2022 Community com ferramentas C++
- Qt 6.8.0 instalado em `C:\Qt\6.8.0\msvc2022_64`
- CMake 3.30+ (recomendado 3.31.6)
- Ninja
- Node.js 20+ (para build da UI)

### Comando único
```bash
.\build.bat
```

O `build.bat` executa:
1. `vcvars64.bat` — configura toolchain MSVC
2. `cmake --preset default` — configura com Ninja + Debug
3. `cmake --build build/default` — compila tudo
4. `windeployqt` — copia DLLs Qt para junto do .exe

### Build manual passo a passo
```bash
# 1. Build da UI
cd ui
npm install
npm run build    # → kernel/resources/webui/

# 2. Configurar CMake
cmake -B build/default -G Ninja `
    -DCMAKE_BUILD_TYPE=Debug `
    -DCMAKE_PREFIX_PATH=C:/Qt/6.8.0/msvc2022_64

# 3. Compilar
cmake --build build/default

# 4. Deploy DLLs
windeployqt --debug --compiler-runtime `
    -webenginewidgets -webchannel -websockets -sql -positioning `
    build/default/kernel/jarvis.exe
```

### Executar
```bash
.\build\default\kernel\Debug\jarvis.exe
```

## CMakePresets.json

```json
{
  "version": 8,
  "configurePresets": [
    {
      "name": "default",
      "generator": "Ninja",
      "binaryDir": "${sourceDir}/build/default",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Debug",
        "CMAKE_PREFIX_PATH": "$env{QT6_DIR}",
        "BUILD_TESTING": "OFF"
      }
    },
    {
      "name": "release",
      "generator": "Ninja",
      "binaryDir": "${sourceDir}/build/release",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "RelWithDebInfo",
        "CMAKE_PREFIX_PATH": "$env{QT6_DIR}",
        "BUILD_TESTING": "OFF"
      }
    },
    {
      "name": "debug",
      "generator": "Ninja",
      "binaryDir": "${sourceDir}/build/debug",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Debug",
        "CMAKE_PREFIX_PATH": "$env{QT6_DIR}",
        "BUILD_TESTING": "ON"
      }
    }
  ]
}
```

## Linux (Docker Dev Container)

```bash
docker compose up dev -d
docker compose exec dev bash
# Dentro do container:
cd /workspace
cmake --preset default
cmake --build build/default
```

## CI/CD (GitHub Actions)

O pipeline está configurado em `.github/workflows/` e inclui:
- Build em matriz (Windows + Linux)
- Testes Catch2 + Vitest
- Lint C++ (clang-tidy) + TypeScript (ESLint)

## Distribuição (Task 027 — Não Iniciada)

| Plataforma | Formato | Ferramenta |
|-----------|---------|-----------|
| Windows | .exe installer | NSIS |
| Linux | .AppImage | appimagetool |
| macOS | .dmg | create-dmg |
| Todas | Auto-update | Qt Updater / Sparkle |
