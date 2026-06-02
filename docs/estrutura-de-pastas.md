# Estrutura de Pastas - JARVIS

Status: inicial  
Issue: #10

## Objetivo

Definir a estrutura inicial do repositorio para suportar uma IDE Tauri com frontend TypeScript, backend Rust, agentes, plugins, contexto, Git e modelos de IA sem acoplamento desnecessario.

## Raiz do Projeto

```text
.
├── docs/
├── scripts/
├── src/
├── src-tauri/
├── package.json
├── vite.config.ts
└── README.md
```

## Frontend

```text
src/
├── application/
│   └── services/       # Application services (SRP + DIP)
├── domain/
├── infrastructure/
├── ui/
│   ├── hooks/          # Custom hooks de estado (13 hooks)
│   ├── components/     # Componentes React (17 componentes)
│   ├── App.tsx         # Componente principal (~750 linhas)
│   ├── styles.css
│   ├── constants.tsx
│   └── TreeEntry.tsx
├── agents/
├── plugins/
├── shared/
├── main.tsx
└── vite-env.d.ts
```

A arquitetura de dependências segue: `ui/components/ → ui/hooks/ → application/services/ → infrastructure/native.ts`

### `src/domain`

Contem tipos, contratos e regras independentes de tecnologia.

Pode conter:

- Contratos de providers.
- Tipos de modelos.
- Tipos de agentes.
- Manifestos de plugins.
- Politicas de permissao.

Nao deve depender de React, Tauri, filesystem, Git ou APIs externas.

### `src/application`

Contem casos de uso e orquestracao.

Contém atualmente:
- **`services/`** — 6 services (workspace, git, settings, editor, plugins, context) que orquestram chamadas a `infrastructure/native.ts`
- `app-metadata.ts` — metadados da aplicação
- `model-registry.ts` — registro de modelos de IA

Deve depender de `domain` e de contratos, nao de implementacoes concretas.
Services usam factory pattern com `useRef` para lazy initialization.

### `src/infrastructure`

Contem adaptadores concretos.

Pode conter:

- Chamadas Tauri.
- Providers reais.
- Persistencia local.
- Adaptadores Git.
- Integracoes externas.

Implementa contratos definidos em `domain`.

### `src/ui`

Contem telas, componentes, hooks e estilos.

Organização interna:
- **`hooks/`** — estado e efeitos colaterais por domínio. Chamam `application/services/*`.
- **`components/`** — UI pura com props. Não chamam services nem infrastructure.
- **`App.tsx`** — composição: hooks para estado, componentes para renderizar.
- **`constants.tsx`** — dados estáticos (activityItems, commands, sidebarTitle, etc).
- **`TreeEntry.tsx`** — componente de árvore do explorador de arquivos.

Não deve executar efeitos colaterais sensiveis diretamente.

### `src/agents`

Contem definicoes de agentes, ferramentas e politicas de uso.

Agentes devem usar contratos de ferramentas, nao infraestrutura diretamente.

### `src/plugins`

Contem registro, manifestos e ciclo de vida de plugins.

No MVP, plugins sao declarativos.

### `src/shared`

Contem utilitarios compartilhados que nao pertencem a uma camada especifica.

Evitar transformar `shared` em deposito generico. Se algo tiver dono claro, deve ficar na camada correta.

## Backend Tauri/Rust

```text
src-tauri/src/
├── commands/
├── services/
├── security/
├── git/
├── workspace/
├── storage/
├── lib.rs
└── main.rs
```

### `commands`

Entrada de comandos expostos ao frontend via Tauri.

### `services`

Servicos internos de aplicacao no lado Rust.

### `security`

Permissoes, validacoes e politicas de acesso local.

### `git`

Operacoes Git locais.

### `workspace`

Operacoes de workspace, arquivos e pastas autorizadas.

### `storage`

Persistencia local, configuracoes e cache.

## Regras de Dependencia

- UI chama Application.
- Application depende de Domain.
- Infrastructure implementa contratos de Domain.
- Domain nao depende de nenhuma outra camada.
- Tauri commands delegam para servicos Rust.
- Servicos Rust passam por security antes de acoes sensiveis.

## Criterios de Manutencao

- Criar um modulo apenas quando houver responsabilidade clara.
- Evitar imports circulares.
- Evitar componentes React com regra de negocio.
- Evitar comandos Tauri grandes.
- Preferir contratos pequenos e especificos.
- Manter efeitos colaterais visiveis e auditaveis.

