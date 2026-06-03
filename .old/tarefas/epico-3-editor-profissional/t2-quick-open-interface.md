# Interface: Quick Open (Ctrl+P)

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│ > src/                                                        │
│                                                              │
│ src/index.ts                                                  │
│ src/components/App.tsx                                        │
│ src/components/App.tsx                                        │
│ src/hooks/useWorkspace.ts                                     │
│ src/services/git.ts                                           │
│ ...                                                           │
└──────────────────────────────────────────────────────────────┘
```

## Especificacao

- **Overlay** semitransparente cobre a tela
- **Search box** no topo com placeholder "Buscar arquivos por nome..."
- **Width:** 60% da janela (max 600px)
- **Position:** Centralizado, top 20%
- **Atalho:** `Ctrl+P` para abrir, `Escape` para fechar
- **Enter** abre arquivo selecionado
- **Setas cima/baixo** navegam pelos resultados

## Comportamento

| Acao | Resultado |
|------|-----------|
| Digitar "index" | Mostra arquivos com "index" no nome |
| Digitar "src/ind" | Fuzzy match: src/index.ts aparece |
| Enter com resultado | Abre arquivo no editor |
| Escape | Fecha Quick Open sem acao |
| Navegacao setas | Destaca item selecionado |
| Sem resultados | Mensagem "Nenhum arquivo encontrado" |
