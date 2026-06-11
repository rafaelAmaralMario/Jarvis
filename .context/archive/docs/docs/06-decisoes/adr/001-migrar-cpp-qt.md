# ADR 001: Migrar para C++ com Qt 6

**Data:** 2026-06-03
**Status:** Aceito

## Contexto

O projeto JARVIS foi inicialmente construido com Tauri 2 + React 19 + Rust + TypeScript + Python sidecar. Apos revisao, decidiu-se que a arquitetura ideal e um sistema modular completo em C++.

## Decisao

Substituir toda a stack por C++20 + Qt 6.8+.

## Consequencias

### Positivas
- Linguagem unica (C++), sem complexidade de multiplas runtimes
- Modularidade nativa (.dll/.so carregados em runtime)
- Performance maxima sem IPC overhead
- Controle total sobre o sistema (acesso a API Win32/POSIX)
- Integracao nativa com AI (whisper.cpp, llama.cpp)
- Tamanho de binario menor (sem WebView/Node)

### Negativas
- Perda de ~8.300 linhas de codigo existentes
- Curva de aprendizado QML (substitui React)
- Ecossistema C++ menos produtivo que TypeScript para UI
- Monaco Editor requer Qt WebEngine (mais pesado)
- Testes precisam ser reescritos (de Vitest para Catch2/QtTest)

### Neutras
- CMake substitui Vite como build system
- Qt Creator substitui VSCode como IDE principal
- vcpkg/CONAN substitui npm para dependencias

## Opcoes Consideradas

| Opcao | Voto |
|-------|------|
| Continuar Rust + Tauri | Rejeitado |
| C++ + Qt 6 | **Aceito** |
| C++ + WebView + React | Considerado, rejeitado (2 linguagens) |
| C++ + Dear ImGui | Rejeitado (UI limitada) |
| Flutter Desktop | Rejeitado (ecossistema pequeno) |
