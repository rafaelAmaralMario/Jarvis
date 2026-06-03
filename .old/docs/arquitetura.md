# Arquitetura Tecnica - JARVIS

Status: inicial  
Objetivo: definir uma arquitetura profissional, modular e facil de manter para a IDE JARVIS.

## Visao Arquitetural

O JARVIS sera uma aplicacao desktop baseada em Tauri, com frontend em TypeScript/Vite e backend nativo em Rust. A arquitetura deve separar interface, regras de aplicacao, dominio, infraestrutura, agentes, plugins e integracoes externas.

O objetivo principal e permitir evolucao constante sem acoplar o core da IDE a um provedor de LLM, ferramenta externa ou implementacao especifica.

## Camadas

### UI

Responsavel por:

- Telas, componentes e layout.
- Estado visual (hooks).
- Interacoes do usuario.
- Exibicao de diffs, logs, arquivos, agentes e configuracoes.

Organizacao interna:
- **`hooks/`** — estado + efeitos colaterais por domínio. Chamam `application/services/*`.
- **`components/`** — UI pura com props. Sem dependências de infrastructure.

Nao deve:

- Executar comandos de sistema diretamente.
- Decidir permissoes sensiveis.
- Conhecer detalhes de provedores externos.
- Importar de `infrastructure/` diretamente (feito via services).

### Application

Responsavel por:

- Casos de uso.
- Orquestracao de fluxos.
- Coordenacao entre UI, dominio e infraestrutura.
- Validacao de regras de produto.

Contém atualmente `services/` com 6 services (workspace, git, settings, editor, plugins, context).
Cada service é uma factory function que retorna um objeto de métodos, usando `useRef` para lazy initialization nos hooks.

Exemplos:

- Abrir workspace (WorkspaceService).
- Solicitar resposta de modelo (ChatService — ainda no hook).
- Listar status Git (GitService).
- Indexar fonte de contexto (ContextService).

### Domain

Responsavel por:

- Tipos centrais.
- Contratos.
- Entidades de negocio.
- Regras independentes de tecnologia.

Exemplos:

- `ModelProvider`
- `AgentDefinition`
- `PluginManifest`
- `PermissionPolicy`
- `WorkspaceContext`
- `ActionLog`

### Infrastructure

Responsavel por:

- Tauri commands.
- Filesystem.
- Git.
- Rede.
- Armazenamento local.
- APIs externas.
- Chaveiro/secret storage.

Deve implementar contratos definidos pelas camadas internas.

### Agents

Responsavel por:

- Definicao de agentes.
- Ferramentas disponiveis.
- Politicas de autonomia.
- Logs de acoes.
- Propostas de edicao.

Agentes nao devem executar efeitos colaterais diretamente. Eles devem solicitar ferramentas controladas.

### Plugins

Responsavel por:

- Manifestos.
- Registro de plugins.
- Ativacao/desativacao.
- Configuracoes visuais.
- Permissoes declaradas.
- Ciclo de vida.

No MVP, plugins devem ser declarativos. Execucao de codigo local por plugins deve ser decisao futura.

## Fluxo de Acao Sensivel

1. Usuario solicita uma tarefa.
2. UI envia o pedido para um caso de uso.
3. Application identifica ferramentas e permissoes necessarias.
4. Permission Policy valida se a acao e permitida.
5. Se necessario, UI pede confirmacao ao usuario.
6. Infrastructure executa a acao.
7. Action Log registra resultado.
8. UI mostra retorno, diff ou erro.

## Comunicacao Frontend e Tauri

Frontend deve chamar comandos Tauri por uma camada de servicos, nunca diretamente de qualquer componente.

Padrao atual:

```text
UI Component (props) -> Hook (state + effects) -> Application Service (orquestracao) -> native.ts (Tauri adapter) -> Tauri Command -> Rust Service
```

Camadas:
- **`ui/components/`** — recebem props dos hooks, nunca chamam services ou infrastructure.
- **`ui/hooks/`** — estado e efeitos colaterais por domínio. Chamam `application/services/*` com `useRef` para lazy initialization.
- **`application/services/`** — orquestram chamadas a `infrastructure/native.ts`. Implementam factory pattern (fn retorna objeto de métodos).
- **`infrastructure/native.ts`** — adaptador Tauri puro (invoke).

Isso permite testar UI, hooks e regras de aplicacao sem depender do runtime Tauri.

## Contratos Iniciais

Contratos que devem existir cedo:

- Provider de texto.
- Provider de codigo.
- Provider de imagem.
- Provider de embeddings.
- Servico de workspace.
- Servico de arquivos.
- Servico de Git.
- Servico de permissoes.
- Servico de logs.
- Registro de plugins.
- Registro de agentes.

## Armazenamento Local

Tipos de dados:

- Configuracoes comuns.
- Configuracoes por workspace.
- Historico de conversas.
- Logs de acoes.
- Indices de contexto.
- Cache de providers.
- Segredos e tokens.

Segredos nao devem ficar no mesmo arquivo de configuracoes comuns. Sempre que possivel, usar mecanismo seguro do sistema operacional.

## Regras de Dependencia

- `domain` nao depende de UI, Tauri, banco, rede ou providers.
- `application` depende de `domain` e contratos.
- `infrastructure` implementa contratos.
- `ui` chama `application` por servicos.
- `agents` usam contratos de ferramentas, nao implementacoes diretas.
- `plugins` declaram capacidades e sao carregados pelo core.

## Estrutura de Pastas Recomendada

Estrutura inicial sugerida quando o scaffold for criado:

```text
src/
  ui/
  application/
  domain/
  infrastructure/
  agents/
  plugins/
  shared/
src-tauri/
  src/
    commands/
    services/
    security/
    git/
    workspace/
    storage/
docs/
scripts/
```

## Decisoes Tecnicas Iniciais

- Desktop: Tauri.
- Frontend: TypeScript + Vite.
- Editor: Monaco Editor.
- Backend nativo: Rust.
- Formatacao: Prettier e Rustfmt.
- Arquitetura: camadas + SOLID + contratos.

