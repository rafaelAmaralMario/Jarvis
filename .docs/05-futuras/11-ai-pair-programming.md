# Proposta: Programação em Par com IA

## Visão Geral
Transformar o JARVIS em um verdadeiro par de programação com sugestões de código em tempo real, completação inteligente, refatoração assistida e geração de código por descrição em linguagem natural.

## Funcionalidades

### Inline Code Suggestions (Copilot-like)
- Sugestões de código enquanto digita (ghost text no Monaco)
- Aceitar com `Tab`, recusar com `Esc`
- Múltiplas sugestões alternativas (`Alt+[` / `Alt+]`)
- Context-aware baseado no arquivo aberto e projeto
- Modelo especializado para código (CodeLlama, DeepSeek Coder, StarCoder)

### Chat Contextual no Editor
- Selecionar código → "Explique isso" ou "Refatore isso"
- Comandos inline: `/fix`, `/doc`, `/test`, `/optimize`
- Geração de testes unitários para função selecionada
- Documentação automática (JSDoc, Doxygen)
- Explicação de código em linguagem natural

### Geração de Código
- `Ctrl+I` → prompt inline para gerar código
- Descrição em linguagem natural → código
- "Crie uma função que leia um CSV e retorne média por coluna"
- Suporte a múltiplas linguagens (detecção automática)
- Geração de funções, classes, componentes React, SQL queries

### Refatoração Assistida
- Renomear símbolo em todo o projeto
- Extrair função/método da seleção
- "Melhore este código" → sugestões de refatoração
- Converter entre estilos (class → function, Promise → async/await)
- Análise de complexidade e sugestões de simplificação

### Análise de Código
- Detecção de bugs potenciais (null pointer, race conditions)
- Sugestões de performance
- Code review contínuo (linhas alteradas)
- Histórico de sugestões aceitas/rejeitadas (aprendizado)

## Arquitetura

```
┌──────────────────────────────────────────────────┐
│              Monaco Editor                       │
│  ┌───────────────────────────────────────────┐   │
│  │  InlineCompletionProvider                 │   │
│  │  • Ghost text rendering                   │   │
│  │  • Accept/reject handlers                 │   │
│  └───────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────┐   │
│  │  Code Actions (Ctrl+.)                   │   │
│  │  • /fix, /doc, /test, /optimize          │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │ Bridge: getInlineCompletion()
                       ▼
┌──────────────────────────────────────────────────┐
│              AI Engine + Code Model              │
│  ┌───────────────────────────────────────────┐   │
│  │  Code Context Builder                     │   │
│  │  • Arquivo atual + linhas adjacentes      │   │
│  │  • Símbolos do projeto (LSP-like)         │   │
│  │  • AST parcial da linguagem               │   │
│  └───────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────┐   │
│  │  Model Router                             │   │
│  │  • Prioriza modelo de código (CodeLlama)  │   │
│  │  • Fallback para modelo geral (GPT)      │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

## Novos Handlers Bridge
```typescript
editor.getInlineCompletion({ file, position, context })  → Completion[]
editor.explainCode({ code, language })                   → string
editor.generateCode({ description, language, context })  → string
editor.refactorCode({ code, instructions })              → { code, diff }
editor.suggestTests({ code, language })                  → string
editor.analyzeCode({ code, language })                   → AnalysisResult[]
```

## Modelos de Código
- **Local**: CodeLlama 7B/13B via Ollama (grátis, privado)
- **Cloud**: DeepSeek Coder, GitHub Copilot API, OpenAI Codex
- **Híbrido**: local para completação rápida, cloud para refatoração complexa

## Configuração
- Provedor de código (local/cloud/híbrido)
- Atalhos customizáveis (aceitar, recusar, próximo)
- Linguagens habilitadas para sugestão
- Tamanho do contexto (quantas linhas ao redor)
- Modelo específico por linguagem

## Dependências
- AI Engine existente (Models, Orchestration)
- Multi-LLM Gateway (01) — para escolher modelo de código ideal
- LSP server integrado para análise AST

## Prioridade: Média
## Esforço Estimado: 5-7 semanas
## Impacto: Muito Alto — produtividade de desenvolvimento
