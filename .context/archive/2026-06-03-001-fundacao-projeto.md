# Contexto: Fundacao do Projeto

**Timestamp:** 2026-06-03T10:54:00-03:00
**Status:** active
**Supersedes:** —
**Superseded by:** —

## Decisao

Reiniciar o projeto JARVIS do zero com:

1. **Linguagem:** C++ como linguagem principal (substituindo Rust + TypeScript)
2. **Framework Desktop:** Qt 6 (Qt Quick/QML para UI, QtWidgets onde necessario)
3. **Arquitetura:** Modular baseada em plugins/.dll (similar ao VSCode)
4. **Modulos nativos planejados:**
   - Kernel (core module loader + lifecycle)
   - IDE (editor, git, terminal)
   - AI Engine (LLM orchestration, agentes)
   - Conhecimento (sistema de "cerebro" estilo Obsidian)
   - Automacao (browser, desktop)
   - Voz (STT/TTS)
   - Perifericos (mic, webcam)
   - Workspace (sistema de arquivos)
   - Rede (HTTP, WebSocket, OAuth)
   - Seguranca (permissoes, criptografia)
   - Plugins (API publica para terceiros)
5. **Modulo principal:** Conhecimento ("cerebro") — funcionalidade estilo Obsidian como feature nativa e central

## Tecnologias definidas

- C++20 (ISO standard)
- Qt 6.8+ (LGPL)
- CMake 3.30+
- SQLite (via Qt SQL ou sqlite3) para dados locais
- nlohmann/json para JSON (header-only)
- spdlog para logging
- Catch2 ou Qt Test para testes unitarios
- whisper.cpp para STT (futuro)
- llama.cpp para LLM local (futuro)

## Modulos sao .dll/.so carregados em runtime

Cada modulo implementa uma ABI estavel em C:
- `create_module(ModuleHost* host) -> ModuleAPI*`
- `destroy_module(ModuleAPI* api)`

## Proximo passo

Criar a documentacao completa do projeto e a estrutura inicial do kernel (module loader).
