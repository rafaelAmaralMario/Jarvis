# Arquitetura do Projeto

## Camadas (Frontend — src/)

```
src/
├── ui/                # Camada de apresentação (React)
│   ├── App.tsx        # Componente principal (~750 linhas)
│   ├── styles.css     # Todos os estilos (~1197 linhas)
│   ├── constants.tsx  # Constantes de UI (activityItems, commands, etc.)
│   ├── TreeEntry.tsx  # Componente de árvore do explorador
│   ├── hooks/         # 13 hooks customizados (estado puro)
│   └── components/    # 17 componentes de UI
├── application/       # Casos de uso e orquestração
│   ├── services/      # 6 services de aplicação (DIP)
│   ├── app-metadata.ts
│   └── model-registry.ts
├── domain/            # Tipos e contratos puros (sem dependências)
│   └── models.ts
├── infrastructure/    # Adaptadores para Tauri e providers
│   ├── tauri.ts       # Detecção de runtime Tauri
│   ├── native.ts      # Invocações de comandos Tauri
│   └── model-providers.ts # Implementações de providers
├── agents/            # Definições de agentes de IA
├── plugins/           # Definições de plugins
└── shared/            # Utilitários compartilhados
```

## Regras de Dependência (estritas)

```
UI Components → Hooks → Application Services → Tauri Adapter (native.ts)
                                                     ↓
                                               Commands Rust
                                                     ↓
                                            Serviços Rust (fs, git, storage)
```

- `domain/` **não depende de nada** — tipos puros
- `application/` depende de `domain/` e interfaces
- `infrastructure/` implementa interfaces de `domain/`
- `ui/hooks/` chamam `application/services/` (nunca infrastructure diretamente)
- `ui/components/` recebem props dos hooks (nunca chamam services/infrastructure)
- `agents/` usam contratos de ferramentas, não implementações diretas

## Padrão de Comunicação

```
Componente UI → Hook (estado) → Application Service (orquestração) → native.ts → Tauri Command → Serviço Rust
```

## Backend Rust (src-tauri/src/)

```
src-tauri/src/
├── main.rs          # Entry point
├── lib.rs           # Builder Tauri com 27 comandos registrados
├── commands/mod.rs  # Thin wrappers Tauri (~173 linhas)
├── workspace/mod.rs # Operações de workspace + validações
├── services/mod.rs  # Ollama + notas Markdown
├── security/mod.rs  # Plugins + validação de manifestos
├── git/mod.rs       # Operações Git
└── storage/mod.rs   # Persistência segura (JSON em APPDATA/JARVIS/)
```

## ADRs (Architecture Decision Records)

| ADR | Decisão | Status |
|-----|---------|--------|
| 0001 | Usar Tauri como base desktop | Aceito |
| 0002 | Usar Monaco Editor | Proposto |
| 0003 | Modelo de permissões explícito | Proposto |
| 0004 | Plugins declarativos no MVP | Proposto |
