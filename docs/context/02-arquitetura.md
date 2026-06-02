# Arquitetura do Projeto

## Camadas (Frontend — src/)

```
src/
├── ui/              # Componentes React (UI pura)
│   ├── App.tsx      # Componente principal (~2584 linhas)
│   └── styles.css   # Todos os estilos (~1197 linhas)
├── application/     # Casos de uso e orquestração
│   ├── app-metadata.ts
│   └── model-registry.ts
├── domain/          # Tipos e contratos puros (sem dependências)
│   └── models.ts
├── infrastructure/  # Adaptadores para Tauri e providers
│   ├── tauri.ts     # Detecção de runtime Tauri
│   ├── native.ts    # Invocações de comandos Tauri
│   └── model-providers.ts # Implementações de providers
├── agents/          # Definições de agentes de IA
├── plugins/         # Definições de plugins
└── shared/          # Utilitários compartilhados
```

## Regras de Dependência (estritas)

```
UI → Application → Domain ← Infrastructure
                        ↕
                    Tauri Commands (Rust)
                        ↕
              Serviços Rust (filesystem, git, storage)
```

- `domain/` **não depende de nada** — tipos puros
- `application/` depende de `domain/` e interfaces
- `infrastructure/` implementa interfaces de `domain/`
- `ui/` chama `application/` (nunca infrastructure diretamente)
- `agents/` usam contratos de ferramentas, não implementações diretas

## Padrão de Comunicação

```
Componente UI → Application Service → Tauri Adapter → Comando Tauri → Serviço Rust
```

## Backend Rust (src-tauri/src/)

```
src-tauri/src/
├── main.rs          # Entry point
├── lib.rs           # Builder Tauri com 27 comandos registrados
├── commands/mod.rs  # Implementações dos comandos Tauri (~879 linhas)
├── workspace/mod.rs # Gerenciamento de workspace
├── services/mod.rs  # Serviços diversos
├── security/mod.rs  # Módulo de segurança
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
