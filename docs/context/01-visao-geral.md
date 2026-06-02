# Visão Geral do Projeto — JARVIS

## O que é

JARVIS (codinome temporário) é um **IDE experimental** construído do zero para trabalhar com modelos de linguagem (LLMs), agentes de IA e contexto local. Diferente de editores tradicionais, o JARVIS coloca a IA como parte central da experiência de desenvolvimento.

## Status Atual

- **Versão:** 0.1.0
- **Fase:** MVP em desenvolvimento ativo
- **Documentação:** Português Brasileiro
- **Projeto GitHub:** [JARVIS MVP](https://github.com/users/rafaelAmaralMario/projects/2)

## Stack Principal

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Desktop Framework | Tauri | 2.11.2 |
| Frontend | React | 19.2.1 |
| Build | Vite | 7.2.4 |
| Frontend Language | TypeScript | 5.9.3 |
| Backend Language | Rust | edition 2021 |
| Editor | Monaco Editor | 0.55.1 |
| Ícones | Lucide React | 1.17.0 |

## Estrutura de Diretórios Raiz

```
/
├── src/              # Frontend React/TypeScript
├── src-tauri/        # Backend Rust (Tauri)
├── docs/             # Documentação do projeto
├── scripts/          # Scripts auxiliares
├── dist/             # Build output
├── .tmp/             # Arquivos temporários
├── .vite/            # Cache Vite
└── node_modules/     # Dependências npm
```

## Premissas Fundamentais

1. **Privacidade primeiro**: modelos locais (Ollama) como cidadãos de primeira classe
2. **Agentes governados**: agentes de IA com permissões explícitas por workspace
3. **Plugins declarativos no MVP**: sem execução de código arbitrário até ter sandbox
4. **Contexto é central**: integração com Obsidian para memória persistente do projeto
