# Tarefa: Frontmatter + Tags + Propriedades Obsidian

**Epico:** 8 — Contexto e Obsidian  
**Prioridade:** 🔴 Alta  
**Estimativa:** 1-2 semanas  
**Dependencias:** Nenhuma

## Objetivo

Adicionar parsing de frontmatter YAML, tags inline e propriedades estruturadas nas notas do Obsidian lidas/escritas pelo JARVIS.

## Estado Atual

O JARVIS le/escreve arquivos .md como texto plano, **sem conhecimento** de frontmatter, tags ou propriedades do Obsidian.

## Stack Recomendada

| Tecnologia | Funcao |
|-----------|--------|
| serde_yaml (Rust) | Parse de frontmatter YAML no backend |
| gray-matter (JS/TS) | Parse de frontmatter no frontend |
| regex (Rust) | Parser de tags inline (`#tag`) |

## Como Fazer

### 1. Parse de Frontmatter (Rust)

```rust
use serde_yaml;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct NoteFrontmatter {
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub jarvix_agent: Option<String>,
    #[serde(default)]
    pub jarvix_model: Option<String>,
    #[serde(default)]
    pub jarvix_timestamp: Option<String>,
    #[serde(default)]
    pub jarvix_permissions: Vec<String>,
    #[serde(default)]
    pub related_files: Vec<String>,
    #[serde(flatten)]
    pub extra: std::collections::HashMap<String, serde_yaml::Value>,
}

pub fn parse_frontmatter(content: &str) -> (Option<NoteFrontmatter>, String) {
    // Separar --- frontmatter --- do corpo
    // Parsear YAML
    // Retornar (frontmatter, body)
}
```

### 2. Escrita de Frontmatter

Toda nota escrita pelo JARVIS inclui frontmatter padronizado:

```yaml
---
jarvix-agent: project-brain
jarvix-model: llama3
jarvix-timestamp: 2026-06-02T10:00:00
jarvix-permissions:
  - read-workspace
related-files:
  - src/main.rs
  - docs/architecture.md
tags:
  - jarvis/memory
  - jarvis/decision
---
```

### 3. Parser de Tags Inline

```rust
pub fn extract_tags(body: &str) -> Vec<String> {
    let re = Regex::new(r"#([a-zA-Z0-9_/]+)").unwrap();
    re.captures_iter(body)
        .map(|c| c[1].to_string())
        .collect()
}
```

### 4. Atualizar ContextService

```typescript
// Adicionar filtros por tag e propriedade
searchNotes({ query: 'arquitetura', tags: ['jarvis/decision'], since: Date.now() - 7*86400000 });
```

### 5. Atualizar UI (ContextPanel)

- Exibir tags e propriedades das notas
- Filtro por tags no search
- Indicador visual de notas com frontmatter JARVIS

## Criterios de Pronto

- [ ] Frontmatter YAML parseado na leitura de notas
- [ ] Frontmatter padrao incluido em toda nota escrita pelo JARVIS
- [ ] Tags inline extraidas do corpo das notas
- [ ] Filtro por tags no ContextPanel
- [ ] Frontmatter exibido nos detalhes da nota
- [ ] `cargo test` passa com testes de parsing
- [ ] `npm run build` passa

## Referencias

- `docs/context/16-obsidian-features.md#33-tags-e-propriedades` — Tags + Propriedades
- `docs/context/16-obsidian-features.md#38-propriedades-frontmatter` — Frontmatter
