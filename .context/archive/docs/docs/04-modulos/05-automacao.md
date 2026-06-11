# Modulo Automacao

**ID:** `jarvis.automation`
**Prioridade:** 🟢 Baixa
**Depende de:** Kernel, AI Engine
**Status:** Nao iniciado

## Funcionalidades
- Automacao de navegador (via Playwright C++ ou WebEngine)
- Automacao de desktop (simulacao de mouse/teclado via API nativa)
- Automacao de terminal (execucao de comandos)
- Captura de tela
- Pre-visualizacao de acoes antes de executar

## Consideracoes
- Playwright tem bindings C++ (playwright-cpp) ou usar Qt WebEngine
- Para desktop: Win32 API (Windows), CGEvent (macOS), XTest (Linux)
- Seguranca critica: usuario deve autorizar cada automacao
