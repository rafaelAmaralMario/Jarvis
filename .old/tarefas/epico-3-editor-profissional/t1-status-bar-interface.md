# Interface: Status Bar

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ main                      │  model: mock-text  │  Tema Escuro       │
└──────────────────────────────────────────────────────────────────────┘
   Left side                    Center/Right items
```

## Especificacao

- **Altura:** 22px (padrao VS Code)
- **Background:** `var(--status-bar-bg)` — tom mais escuro que o fundo do editor
- **Texto:** 12px, cor `var(--status-bar-fg)`
- **Padding:** 0 8px
- **Posicao:** Abaixo do Bottom Panel, grudado na base da janela

## Itens (Lado Esquerdo)

1. Branch Git: `GitBranch` icon + nome da branch (ex: `main`, `feature/login`)
2. Encoding do arquivo: `UTF-8` (fixo por enquanto)
3. Indentacao: `Espacos: 2`

## Itens (Lado Direito)

1. Modelo ativo: nome do modelo (ex: `mock-text`, `ollama:llama3.2`)
   - Clicavel → abre Settings > IA
2. Provider: badge pequeno com cor (Mock=cinza, Ollama=azul, OpenAI=verde)
3. Tema: icone de sol/lua
   - Clicavel → toggle tema
4. Permissoes: icone de escudo
   - Verde: todas ok
   - Amarelo: algumas negadas
   - Clicavel → abre Settings > Seguranca

## Estados

| Estado | Comportamento |
|--------|---------------|
| Sem Git | Branch mostra "Sem Git" em italico |
| Sem workspace | Barra escondida ou mostra apenas tema e modelo |
| Carregando | Skeleton loader de 1-2 segundos |
