# Tarefa: Backlinks e Leitura de .obsidian Config

**Epico:** 8 — Contexto e Obsidian  
**Prioridade:** 🟡 Media  
**Estimativa:** 1-2 semanas  
**Dependencias:** T1 (Frontmatter + Tags)

## 1. Backlinks

### Objetivo
Adicionar parsing de wiki links (`[[link]]`, `[[link|alias]]`, `[[link#^block]]`) e indice de referencias para navegacao bidirecional entre notas.

### Como Fazer

```rust
pub fn extract_wiki_links(body: &str) -> Vec<WikiLink> {
    // Pattern: [[link]], [[link|alias]], [[link#^block]], [[link#heading]]
    let re = Regex::new(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]").unwrap();
    re.captures_iter(body)
        .map(|c| WikiLink {
            target: c[1].to_string(),
            alias: c.get(2).map(|m| m.as_str().to_string()),
        })
        .collect()
}
```

### Indice de Backlinks

```typescript
// Para cada nota, manter lista de notas que a referenciam
interface BacklinkIndex {
  [notePath: string]: BacklinkEntry[];
}

interface BacklinkEntry {
  sourcePath: string;
  contextLine: string;  // linha onde o link aparece
}
```

### Navegacao na UI

- Botao "Backlinks" no ContextPanel ao selecionar nota
- Lista de notas que referenciam a nota atual
- Clicar navega para a nota de origem

## 2. Leitura de .obsidian Config

### Objetivo
Detectar automaticamente vaults Obsidian pela presenca de `.obsidian/` e ler configuracoes do vault.

### Como Fazer

```rust
#[tauri::command]
fn detect_obsidian_vaults() -> Result<Vec<String>, String> {
    let common_locations = vec![
        dirs::document_dir(),
        dirs::home_dir().map(|p| p.join("Documents")),
        dirs::home_dir().map(|p| p.join("Obsidian")),
    ];

    let mut vaults = vec![];
    for base in common_locations.iter().flatten() {
        if base.join(".obsidian").exists() {
            vaults.push(base.to_string_lossy().to_string());
        }
    }
    Ok(vaults)
}
```

### Ler configuracoes

```rust
#[derive(Deserialize)]
struct ObsidianAppConfig {
    pub theme: Option<String>,
    pub accent_color: Option<String>,
    pub enabled_plugins: Option<Vec<String>>,
    pub disabled_plugins: Option<Vec<String>>,
}
```

### UI

- Auto-detect vaults: lista de vaults encontrados
- Botao "Abrir vault" que seleciona e configura
- Status "Vault detectado" vs "Vault configurado manualmente"

## Criterios de Pronto

- [ ] Wiki links parseados (`[[link]]`, `[[link|alias]]`)
- [ ] Indice de backlinks construido
- [ ] Painel de backlinks no ContextPanel
- [ ] Auto-detecao de vaults Obsidian
- [ ] Leitura de .obsidian/config (tema, plugins ativos)
- [ ] Migrar configuracao manual para auto-detect quando possivel

## Referencias

- `docs/context/16-obsidian-features.md#32-backlinks` — Backlinks
- `docs/context/16-obsidian-features.md#310-leitura-de-config-obsidian` — .obsidian config
