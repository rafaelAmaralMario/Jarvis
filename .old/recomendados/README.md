# Visao Geral das Recomendacoes — JARVIS

## Resumo Executivo

Este diretorio contem recomendacoes tecnicas detalhadas para transformar o JARVIS de um MVP funcional em uma **IDE com IA agente completa**, capaz de automatizar tarefas no computador do usuario.

---

## Indice

| # | Arquivo | Conteudo |
|---|---------|----------|
| 1 | `1-interface-recomendacoes.md` | Layout, componentes, atalhos, estados, temas |
| 2 | `2-backend-recomendacoes.md` | Rust, Python sidecar, TypeScript, modelos IA |
| 3 | `3-arquitetura-recomendacoes.md` | Arquitetura geral, comunicacao, estado, banco |
| 4 | `4-seguranca-permissoes-recomendacoes.md` | Matriz de permissoes, perifericos, financas |
| 5 | `5-ia-modelos-recomendacoes.md` | Modelos gratis, roteamento, LangGraph, voz |
| 6 | `6-automacao-sistema-recomendacoes.md` | Web automation, desktop automation, fluxos |
| 7 | `7-perifericos-hardware-recomendacoes.md` | Microfone, webcam, notificacoes, clipboard |
| 8 | `8-tempo-real-streaming-recomendacoes.md` | WebSocket, chat streaming, terminal, voz duplex |
| 9 | `9-ferramentas-bibliotecas-recomendacoes.md` | Libs, ferramentas dev, servicos externos |

---

## Stack Recomendada Final

```
Frontend:  React 19 + TypeScript 5.9 + Zustand + Monaco Editor
Desktop:   Tauri 2.11 (Rust)
Sidecar:   Python 3.12 + FastAPI + LangGraph + Playwright
Editor:    Monaco Editor + xterm.js
IA Local:  Ollama (Qwen 2.5 Coder, Llama 3.2, nomic-embed-text)
IA API:    Gemini 1.5 Flash / DeepSeek V2 (gratuitos)
Voz:       whisper (STT) + edge-tts (TTS)
Busca:     ChromaDB + sentence-transformers
Automacao: Playwright (web) + PyAutoGUI (desktop)
Testes:    Vitest + @testing-library/react + Playwright E2E
CI/CD:     GitHub Actions
```

## Principios Norteadores

1. **Gratuito em primeiro lugar** — modelos locais > APIs gratis > APIs pagas
2. **Privacidade por design** — processamento local sempre que possivel
3. **Seguranca em camadas** — Rust valida, sidecar executa, usuario autoriza
4. **Tempo real nativo** — WebSocket para chat, terminal, voz, automacao
5. **Modular e extensivel** — cada componente pode ser substituido
6. **Foco em automacao** — JARVIS nao so responde, mas AGE no computador
