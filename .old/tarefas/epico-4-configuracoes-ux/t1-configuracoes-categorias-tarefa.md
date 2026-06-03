# Tarefa: Separar Configuracoes por Categorias

**Epico:** 4 — Configuracoes e UX  
**Prioridade:** 🔴 Alta  
**Estimativa:** 1-2 semanas  
**Dependencias:** Nenhuma

## Objetivo

Reorganizar o painel de configuracoes atual em categorias claras e navegaveis, com busca para encontrar rapidamente qualquer configuracao.

## Estado Atual

SettingsPanel atual e um unico scroll com todas as configuracoes misturadas.

## Como Fazer

### 1. Definir Categorias

| Categoria | Campos |
|-----------|--------|
| Geral | Tema, idioma, atalhos |
| Workspace | Diretorio, permissoes, pastas ignoradas |
| IA | Modelo padrao por categoria (texto, codigo, imagem, embeddings) |
| Providers | Ollama URL, OpenAI URL/chave, Mock enabled |
| Git | Usuario, email, remote default |
| Plugins | Lista de plugins com toggle |
| Seguranca | Permissoes workspace, audit trail |
| Aparencia | Tema, zoom, layout |
| Obsidian | Vault geral, vault do projeto |
| Atalhos | Lista de keybindings |

### 2. Componente SettingsPanel

```tsx
function SettingsPanel() {
  const [activeCategory, setActiveCategory] = useState('geral');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'geral', icon: Settings, label: 'Geral' },
    { id: 'workspace', icon: Folder, label: 'Workspace' },
    // ...
  ];

  const filteredSettings = useMemo(() =>
    searchSettings(allSettings, searchQuery), [searchQuery]);

  return (
    <div className="settings-panel">
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <CategoryNav categories={categories} active={activeCategory} />
      <SettingsForm category={activeCategory} settings={filteredSettings} />
    </div>
  );
}
```

### 3. Busca nas Configuracoes

Campo de busca que filtra configuracoes por nome e descricao em tempo real.

## Criterios de Pronto

- [ ] 10 categorias de configuracao separadas
- [ ] Navegacao entre categorias via sidebar/tabs
- [ ] Busca textual filtra configuracoes
- [ ] Busca vazia restaura visual normal
- [ ] Configuracoes existentes continuam persistindo
- [ ] Tema claro/escuro funcionando

## Referencias

- `docs/roadmap-pos-mvp.md` — v0.2 Configuracoes
- `docs/context/14-funcionalidades-atuais.md#110` — SettingsPanel atual
