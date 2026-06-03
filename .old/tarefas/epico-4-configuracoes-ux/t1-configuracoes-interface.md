# Interface: Configuracoes por Categorias

## Layout

```
┌────────────────────────────────────────────────────┐
│ 🔍 Buscar configuracao...                          │
├──────────┬─────────────────────────────────────────┤
│ Geral    │ ○ Geral                                │
│ Workspace│   ┌─────────────────────────────────┐  │
│ IA       │   │ [Seletor de Tema]               │  │
│ Providers│   │   ○ Claro  ● Escuro             │  │
│ Git      │   └─────────────────────────────────┘  │
│ Plugins  │ ○ Workspace                            │
│ Seguranca│   ┌─────────────────────────────────┐  │
│ Aparencia│   │ Caminho: /projects/jarvis [...] │  │
│ Obsidian │   └─────────────────────────────────┘  │
│ Atalhos  │ ○ IA                                   │
│          │   ┌─────────────────────────────────┐  │
│          │   │ Modelo Texto: [mock-text ▼]     │  │
│          │   │ Modelo Codigo: [ollama:qwen ▼]  │  │
│          │   └─────────────────────────────────┘  │
├──────────┴─────────────────────────────────────────┤
│ Resetar Configuracoes                     Salvar   │
└────────────────────────────────────────────────────┘
```

## Especificacao

- **Sidebar esquerda:** Lista de categorias com icones
- **Painel direito:** Formulario da categoria selecionada
- **Search box:** Filtra configuracoes pelo nome, mantendo categoria
- **Cada categoria** tem campos especificos com tooltips explicativos
- **Toggle switches** para opcoes booleanas (tema, permissoes)
- **Select dropdowns** para opcoes com multiplas escolhas (modelos)
- **Text inputs** para caminhos, URLs, chaves
- **Botoes:** "Salvar" no final, "Resetar" no footer

## Categorias e Icones

| Categoria | Icone | Descricao |
|-----------|-------|-----------|
| Geral | Settings | Tema, idioma |
| Workspace | Folder | Caminho, permissoes |
| IA | Brain | Modelos por categoria |
| Providers | Wifi | URL, chaves, teste |
| Git | GitBranch | Usuario, remote |
| Plugins | Puzzle | Lista, toggle |
| Seguranca | Shield | Permissoes, audit |
| Aparencia | Palette | Tema, zoom |
| Obsidian | BookOpen | Vaults |
| Atalhos | Keyboard | Keybindings |
