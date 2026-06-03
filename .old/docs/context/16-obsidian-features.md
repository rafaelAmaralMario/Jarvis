# Mapeamento de Funcionalidades do Obsidian para o JARVIS

## 1. Integração JARVIS + Obsidian — O Que Já Existe

### Backend (Rust/Tauri)

| Comando Tauri | Descrição | Arquivo |
|---|---|---|
| `list_markdown_notes` | Varre recursivamente o vault listando arquivos `.md`, ignorando `.obsidian/`, `.git/`, `node_modules/` | `src-tauri/src/services/mod.rs:81` |
| `write_markdown_note` | Cria um novo arquivo `.md` no vault com título sanitizado | `src-tauri/src/services/mod.rs:92` |
| `validate_path` | Verifica se o caminho do vault existe | `src-tauri/src/workspace/` |

### Frontend (TypeScript/React)

| Camada | Arquivo | Função |
|---|---|---|
| Plugin manifest | `src/plugins/manifests.ts:19` | Plugin `jarvis.obsidian` com `context.markdown` e `obsidian.vault.read` |
| Service de contexto | `src/application/services/context.ts:8` | `loadObsidianNotes` + `writeMemoryToObsidian` |
| Infra nativa | `src/infrastructure/note.ts` | Invoca comandos Tauri para ler/escrever notas |
| Hook UI | `src/ui/hooks/useContextManager.ts:26` | Gerencia estado das notas Obsidian no frontend |
| Painel de contexto | `src/ui/components/ContextPanel.tsx:64` | Botão "Enviar ao Obsidian" |
| Painel de configurações | `src/ui/components/SettingsPanel.tsx:215` | Campos para caminho dos vaults (geral e do projeto) |
| Agente `project-brain` | `src/agents/index.ts:14` | Gera notas Markdown estruturadas para indexação no Obsidian |

### Limitações Atuais

- **Apenas leitura/escrita de arquivos planos** — sem conhecimento da estrutura interna do Obsidian
- **Sem parsing de wiki links** (`[[link]]`) — as notas são tratadas como Markdown genérico
- **Sem suporte a frontmatter/tags/propriedades** do Obsidian
- **Sem REST API** — opera exclusivamente via filesystem (Tauri commands)
- **Sem graph view** — JARVIS não tem visualização de conexões entre notas
- **Sem backlinks** — não há rastreamento bidirecional de referências
- **Sem suporte a Canvas, Dataview, Templates ou plugins comunitários**

---

## 2. Mapa de Funcionalidades do Obsidian

### 2.1 Navegação e Descoberta

| Funcionalidade | Core/Plugin | Descrição |
|---|---|---|
| **Quick Switcher** | Core | `Ctrl+O` — busca fuzzy e navegação rápida entre notas |
| **Backlinks** | Core | Painel lateral mostrando todas as notas que referenciam a nota atual |
| **Graph View (Global)** | Core | Grafo força-direcionada do vault inteiro |
| **Graph View (Local)** | Core | Grafo restrito à nota ativa com profundidade configurável |
| **Search** | Core | Busca textual全文 com operadores de path, tag, content |
| **Outline** | Core | Navegação por cabeçalhos da nota ativa |
| **Starred** | Core | Notas favoritadas para acesso rápido |

### 2.2 Edição e Formatação

| Funcionalidade | Core/Plugin | Descrição |
|---|---|---|
| **Editor Live Preview** | Core | WYSIWYG-like para Markdown com preview de links e imagens |
| **Source Mode** | Core | Edição direta do Markdown bruto |
| **Wiki Links** | Core | `[[Nota]]` e `[[Nota|alias]]` para links internos |
| **Markdown padrão** | Core | Headers, lists, tables, code blocks, images |
| **Properties (Frontmatter)** | Core | Metadados YAML entre `---` |
| **Callouts** | Core | Blocos estilizados de destaque (> [!note], > [!warning]) |
| **Templates** | Core | Inserção de templates com `{{date}}`, `{{title}}`, etc. |
| **Canvas** | Core | Quadro branco infinito com cards, setas, agrupamentos |
| **Tabelas** | Core | Suporte completo a tabelas Markdown com formatação |
| **Mermaid diagrams** | Core (opt-in) | Diagramas ` ```mermaid ` no preview |
| **LaTeX** | Core | `$...$` e `$$...$$` para fórmulas matemáticas |
| **Tags** | Core | `#tag` e `#tag/subtag` inline — tag pane para navegação |
| **Audio recorder** | Core | Gravação e anexo de áudio em notas |
| **Slides** | Core | Apresentações a partir de notas (--- como separador) |

### 2.3 Organização e Estrutura

| Funcionalidade | Core/Plugin | Descrição |
|---|---|---|
| **File Explorer** | Core | Árvore de pastas e arquivos do vault |
| **Tags pane** | Core | Lista hierárquica de todas as tags com contagem de uso |
| **Folders** | Core | Organização hierárquica por pastas |
| **Properties** | Core | Metadados estruturados por nota (tipo: texto, número, data, checkbox, tags, lista) |
| **Bases** | Core | Visualização tipo banco de dados/Notion sobre pastas de notas |
| **Outgoing Links** | Core | Links que saem da nota atual |
| **Bookmarks** | Core | Similar a Starred, com suporte a grupos |
| **Dataview (plugin)** | Comunidade | Query engine SQL-like para lists, tables, tasks do vault |
| **Templater (plugin)** | Comunidade | Template engine avançado com scripting JavaScript |

### 2.4 Visualização

| Funcionalidade | Core/Plugin | Descrição |
|---|---|---|
| **Graph View** | Core | Grafo força-direcionada com filtros por path, tags, propriedades |
| **Local Graph** | Core | Subgrafo centrado na nota ativa com slider de profundidade |
| **Canvas** | Core | Quadro branco infinito com cards de notas, grupos, setas |

### 2.5 Publicação e Sincronização

| Funcionalidade | Core/Plugin | Descrição |
|---|---|---|
| **Obsidian Sync** | Pago | Sincronização criptografada entre dispositivos |
| **Obsidian Publish** | Pago | Publicação do vault como site estático |
| **Obsidian Importer** | Gratuito (oficial) | Importação de Evernote, Notion, Roam, etc. |

### 2.6 Extensibilidade

| Funcionalidade | Core/Plugin | Descrição |
|---|---|---|
| **Community Plugins** | Core | 2754+ plugins disponíveis (2026) |
| **Plugin API** | Aberta | TypeScript API para modificar/quase todo aspecto do Obsidian |
| **Custom CSS** | Core | `obsidian.css` snippets e temas CSS completos |
| **Temas** | Core | Temas completos via CSS |
| **Local REST API (plugin)** | Comunidade | REST API + MCP server built-in (~462k downloads) |
| **MCP support** | Via plugin | Model Context Protocol integrado ao REST API plugin |

### 2.7 Estrutura do Vault (.obsidian)

O diretório `.obsidian/` na raiz do vault contém toda a configuração:

| Arquivo/Pasta | Descrição |
|---|---|
| `obsidian.json` | Configurações gerais do vault (tema, plugin states, etc.) |
| `graph.json` | Estado do graph view (zoom, filtros, etc.) |
| `community-plugins.json` | Lista de plugins comunitários habilitados |
| `plugins/` | Binários dos plugins instalados (`plugin-id/main.js`, `manifest.json`) |
| `snippets/` | CSS snippets customizados |
| `themes/` | Temas CSS instalados |
| `app.json` | Configurações de aparência e comportamento |
| `appearance.json` | Configuração de tema e accent color |
| `hotkeys.json` | Atalhos de teclado customizados |
| `core-plugins.json` | Plugins core habilitados/desabilitados |
| `workspace.json` | Layout dos painéis abertos |

---

## 3. Oportunidades de Integração

### 3.1 Graph View para Relacionamento de Contexto

**Como funciona no Obsidian:** Grafo força-direcionada onde nós = notas e arestas = `[[wiki links]]`, com filtros por tag, path e propriedades.

**Integração no JARVIS:**
- Visualizar grafo de notas do vault dentro do JARVIS (painel de contexto)
- Usar estrutura do grafo para mapear relacionamentos entre entidades do projeto (módulos, dependências, decisões arquiteturais)
- Agente `project-brain` poderia usar o grafo para navegar contexto relacionado
- Clusters de notas poderiam representar domínios do conhecimento do projeto

**Requisitos técnicos:**
- Parsear `[[wiki links]]` das notas (Rust ou TypeScript)
- Construção de grafo em memória (ex: D3-force, vis-network, cytoscape)
- Componente de visualização no frontend (novo painel ou integrado ao ContextPanel)
- Filtros por tag, path, data (como o Obsidian faz)

### 3.2 Backlinks para Memória de Agentes

**Como funciona no Obsidian:** Toda nota mostra quais outras notas a referenciam, criando navegação bidirecional.

**Integração no JARVIS:**
- Quando um agente gera uma nota no vault, registrar quais arquivos do workspace foram usados como fonte
- Navegação bidirecional: selecionar uma nota e ver quais decisões/documentos a referenciam
- Cadeia de raciocínio do JARVIS preservada como backlinks entre notas de agente
- Rastrear decisões arquiteturais de volta para as issues/código que as motivaram

**Requisitos técnicos:**
- Parser de links internos (`[[link]]`)
- Index de referências (mapa nota → notas que referenciam)
- Visualização de backlinks no ContextPanel
- Agentes precisam incluir `[[links]]` nas notas que geram

### 3.3 Tags e Propriedades para Permissões e Classificação

**Como funciona no Obsidian:** Tags inline (`#tag`) e propriedades YAML (`status: done`, `priority: high`) para metadados estruturados.

**Integração no JARVIS:**
- Usar tags para classificar notas geradas: `#jarvis/memory`, `#jarvis/decision`, `#jarvis/agent/project-brain`
- Propriedades YAML para metadados: `author: project-brain`, `agent-model: llama3`, `timestamp: 2026-06-02`
- Leitura de tags/propriedades para filtrar contexto relevante no search
- Mapear tags para níveis de permissão (ex: `#secure/credentials` → bloqueado para agentes sem permissão secrets)
- Dataview-like queries no JARVIS para consultar notas por propriedade

**Requisitos técnicos:**
- Parser de frontmatter YAML (Rust: `serde_yaml` ou TypeScript: `gray-matter`)
- Parser de tags inline (`#tag`) no conteúdo Markdown
- Index de tags + propriedades para busca
- Integração com sistema de permissões existente

### 3.4 Canvas como Plano de Arquitetura Visual

**Como funciona no Obsidian:** Quadro branco infinito com cards (notas), grupos, setas, imagens, com suporte a arrastar.

**Integração no JARVIS:**
- Usar Canvas como ferramenta visual de arquitetura: arrastar módulos, conectar dependências
- Agente `architect` poderia propor um canvas visual da arquitetura do projeto
- Converter canvas em Markdown estruturado para documentação
- Integrar com o file explorer: abrir `.canvas` files e renderizá-los

**Requisitos técnicos:**
- Parser de arquivos `.canvas` (JSON — estrutura conhecida e documentada)
- Componente de renderização Canvas no frontend
- Editor visual básico (arrastar, conectar, agrupar)
- Conversão canvas ↔ markdown estruturado

### 3.5 Local REST API para Acesso Programático

**Como funciona:** Plugin comunitário `obsidian-local-rest-api` (coddingtonbear, 462k downloads) expõe REST API + MCP server em `localhost:27124`.

**Integração no JARVIS:**
- **MCP Server nativo**: Conectar JARVIS como cliente MCP ao Obsidian para leitura/escrita bidirecional em tempo real
- **Acesso ao arquivo ativo**: Saber qual nota o usuário está editando no Obsidian para trazer contexto
- **Busca avançada**: Usar API de search do plugin em vez de scan filesystem
- **Comandos**: Disparar comandos do Obsidian (ex: abrir nota específica, rodar template)
- **Periodic notes**: Criar/ler notas diárias, semanais, mensais
- **Patching cirúrgico**: Atualizar seções específicas de notas (heading, block, frontmatter) sem reescrever o arquivo inteiro
- **Tags query**: Listar todas as tags do vault com contagem de uso

**Requisitos técnicos:**
- Plugin `obsidian-local-rest-api` instalado e configurado no Obsidian do usuário
- Gerenciamento de API key (armazenar em `secure-settings.json` como outras secrets)
- Configuração de porta, certificado SSL, health check
- Cliente HTTP no JARVIS (Tauri plugin `http` ou custom reqwest no Rust)
- Cache local para reduzir latência
- Fallback para filesystem scan quando REST API não disponível

### 3.6 Dataview Queries para Busca Semântica

**Como funciona:** Plugin Dataview permite consultar (DQL/JavaScript) o vault como banco de dados — lists, tables, tasks, calendários.

**Integração no JARVIS:**
- Substituir/scaffold busca textual simples por queries estruturadas com filtros
- Agentes poderiam usar Dataview-like queries: "me dê todas as decisões arquiteturais dos últimos 30 dias"
- Integração com busca semântica por embeddings (roadmap v0.2)
- Query builder visual no painel de contexto

**Requisitos técnicos:**
- Implementar motor DQL simplificado ou usar gray-matter + index
- Parse de frontmatter + conteúdo para campos queryáveis
- Cache de índice de metadados
- Interface de query (natural language → structured query via LLM)

### 3.7 Templates e Geração Estruturada

**Como funciona:** Core Templates + Templater (plugin) para inserir notas com placeholders, JavaScript, prompts.

**Integração no JARVIS:**
- Agentes usarem templates do Obsidian para formatar saída (ADR template, decision template, daily note)
- JARVIS propor templates customizados para documentação de projeto
- `{{cursor}}`, `{{date}}`, `{{title}}` mapeados para variáveis do contexto atual

**Requisitos técnicos:**
- Parser de template syntax (`{{variable}}`)
- Mapeamento de variáveis para contexto JARVIS (projeto, data, agente, arquivo ativo)
- Catálogo de templates built-in para documentação de software

### 3.8 Propriedades (Frontmatter) para Metadados Estruturados

**Como funciona:** YAML frontmatter com schema types (text, list, number, date, checkbox, tags).

**Integração no JARVIS:**
- Toda nota escrita pelo JARVIS incluir frontmatter com:
  ```yaml
  ---
  jarvix-agent: project-brain
  jarvix-model: llama3
  jarvix-timestamp: 2026-06-02T10:00:00
  jarvix-permissions: read-workspace
  related-files: ["src/main.rs", "docs/architecture.md"]
  ---
  ```
- Filtrar notas por propriedades para busca de contexto
- Agentes lerem frontmatter para entender contexto de notas existentes
- Schema evolution: versão de metadados para compatibilidade futura

**Requisitos técnicos:**
- Parser/escritor YAML confiável (serde_yaml no Rust, js-yaml no frontend)
- Schema de propriedades JARVIS versionado
- Validação de frontmatter na escrita/leitura

### 3.9 Publish e Exportação

**Como funciona:** Obsidian Publish gera site estático do vault (pago).

**Integração no JARVIS:**
- JARVIS poderia gerar documentação do projeto no formato de site (similar ao Publish)
- Exportar notas de contexto + diagramas + decisões como site estático
- Publicar documentação gerada por agentes automaticamente

**Requisitos técnicos:**
- Gerador de site estático (integração com Vite ou ferramenta externa)
- Template engine para layout de documentação
- Conversão wiki links → HTML links

### 3.10 Leitura de Configuração .obsidian

**Como funciona:** Diretório `.obsidian/` contém toda a configuração do vault em JSON.

**Integração no JARVIS:**
- Detectar automaticamente caminho do vault pela presença de `.obsidian/`
- Ler `community-plugins.json` para saber quais plugins ativos
- Ler `app.json` para respeitar configurações do usuário (ex: attachment folder)
- Respeitar pastas ignoradas configuradas no Obsidian
- Auto-detect de vaults nos locais comuns (Documentos, Dropbox, Google Drive, etc.)

**Requisitos técnicos:**
- Scan de sistema para detectar vaults Obsidian
- Parser de `.obsidian/community-plugins.json` e `app.json`
- UI para selecionar vault entre os descobertos

---

## 4. Requisitos Técnicos por Integração

| Integração | Esforço | Complexidade | Dependências Externas | Risco |
|---|---|---|---|---|
| **3.1 Graph View** | Alto (semanas) | Alta | D3.js / vis-network (frontend) | Médio |
| **3.2 Backlinks** | Médio (dias) | Média | Parser wiki links | Baixo |
| **3.3 Tags + Propriedades** | Baixo (dias) | Baixa | gray-matter / serde_yaml | Baixo |
| **3.4 Canvas** | Alto (semanas) | Alta | Renderer canvas customizado | Alto |
| **3.5 REST API** | Médio (dias) | Média | Plugin externo no Obsidian | Médio |
| **3.6 Dataview Queries** | Alto (semanas) | Alta | Implementação de query engine | Alto |
| **3.7 Templates** | Baixo (dias) | Baixa | Template parser | Baixo |
| **3.8 Frontmatter** | Baixo (dias) | Baixa | YAML parser | Baixo |
| **3.9 Publish** | Alto (semanas) | Alta | SSG + template engine | Médio |
| **3.10 .obsidian config** | Baixo (dias) | Média | JSON parser | Baixo |

### Dependências Técnicas Recomendadas

| Dependência | Uso | Já Existe? |
|---|---|---|
| `serde_yaml` (Rust) | Parse frontmatter YAML | ❌ |
| `gray-matter` (JS) | Parse frontmatter no frontend | ❌ |
| `d3-force` ou `vis-network` | Graph view rendering | ❌ |
| `reqwest` (Rust) | HTTP client p/ REST API | ❌ |
| `tauri-plugin-http` | HTTP requests do frontend | ❌ |
| Parser de wiki links | `\[\[link\]\]` → grafo | ❌ |
| Template engine | Jinja2-like para templates | ❌ |

---

## 5. Ranking de Prioridade

### 🥇 Prioridade Máxima — MVP+ Imediato

| # | Integração | Justificativa |
|---|---|---|
| 1 | **Tags + Propriedades (3.3)** | Já lê/escreve Markdown — adicionar parsing de frontmatter e tags é a evolução mais natural. Permite filtragem de contexto imediatamente. |
| 2 | **Frontmatter padronizado (3.8)** | Toda nota escrita pelo JARVIS ter metadados estruturados (agente, modelo, permissões, data). Base para todas as integrações futuras. |
| 3 | **Backlinks básicos (3.2)** | Parse de `[[wiki links]]` + índice de referências. Relativamente simples e habilita navegação bidirecional no ContextPanel. |

### 🥈 Prioridade Alta — v0.2 / v0.3

| # | Integração | Justificativa |
|---|---|---|
| 4 | **Leitura .obsidian config (3.10)** | Auto-detecção de vaults, respeito a configurações do usuário. Baixo esforço, alto ganho de UX. |
| 5 | **REST API / MCP (3.5)** | Acesso em tempo real ao Obsidian, busca avançada, acesso ao arquivo ativo. Plug-and-play via plugin existente. |
| 6 | **Templates (3.7)** | Agentes usarem templates para gerar notas consistentes. Já há documentos ADR e decisões — templates trazem padronização. |

### 🥉 Prioridade Média — v0.4 / v0.5

| # | Integração | Justificativa |
|---|---|---|
| 7 | **Graph View (3.1)** | Visualmente impactante, mas complexo. Ideal para quando o JARVIS tiver volume de notas significativo. |
| 8 | **Dataview Queries (3.6)** | Search avançado é roadmap v0.2. Dataview-like queries são um upgrade natural após busca semântica. |
| 9 | **Canvas (3.4)** | Ferramenta visual poderosa, mas alto esforço de implementação. Deixar para versão final. |
| 10 | **Publish (3.9)** | Exportar documentação é útil, mas não crítico. Pode ser plugin externo ou integração futura. |

### Resumo da Estratégia

```
v0.1-beta (agora)
  ├── Frontmatter padronizado → metadados nas notas
  ├── Tags + Propriedades → filtragem de contexto
  └── Backlinks → navegação bidirecional

v0.2 (próximo)
  ├── Leitura .obsidian → auto-detect de vaults
  ├── REST API / MCP → acesso em tempo real
  └── Templates → saída estruturada de agentes

v0.3+
  ├── Graph View → visualização de conexões
  ├── Dataview Queries → busca estruturada
  ├── Canvas → diagramação visual
  └── Publish → documentação como site
```

---

## 6. Riscos e Considerações

### Riscos Técnicos

- **REST API plugin**: Depende de plugin de terceiro. Se o autor parar de manter, JARVIS perde essa via.
- **Parser de wiki links**: `[[link]]` pode conter aliases (`[[link|alias]]`), block references (`[[link#^block]]`), headings (`[[link#heading]]`). Implementação precisa cobrir todos os casos.
- **YAML frontmatter**: Arquivos grandes com frontmatter complexo podem ter parsing lento. Considerar lazy parse.
- **Graph view performance**: Vaults com 10k+ notas exigem otimização (virtualização, LOD, WebGL).

### Riscos de UX

- **Complexidade de configuração**: REST API requer instalação de plugin + configuração de API key. Pode ser barreira para usuários não técnicos.
- **Expectativa vs realidade**: Se JARVIS lê/escreve no vault mas não entende a estrutura interna do Obsidian (tags, links), usuários podem achar a integração "quebrada".
- **Duplicação de estado**: Notas escritas pelo JARVIS no filesystem vs notas abertas no Obsidian — possível conflito se ambos editarem simultaneamente (o REST API plugin minimiza isso com acesso ao arquivo ativo).

### Riscos de Segurança

- **JSON Web Tokens / API keys**: A API key do REST API plugin dá acesso total ao vault. Deve ser armazenada no backend seguro (`secure-settings.json`), nunca no frontend.
- **Path traversal**: Já mitigado pelo Rust (`ensure_inside_workspace`), mas deve ser mantido ao adicionar REST API.
- **Permissões por nota**: Se usarmos frontmatter para permissões (`jarvix-permissions`), o mecanismo de validação precisa ser à prova de bypass (validação no backend Rust).
