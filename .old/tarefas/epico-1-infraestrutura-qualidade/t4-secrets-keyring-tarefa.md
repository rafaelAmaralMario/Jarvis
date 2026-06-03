# Tarefa: Migrar Secrets para Keyring/Stronghold

**Epico:** 1 — Infraestrutura e Qualidade  
**Prioridade:** 🔴 Alta  
**Estimativa:** 1-2 semanas  
**Dependencias:** Nenhuma

## Objetivo

Substituir o armazenamento atual de API keys em `secure-settings.json` no filesystem por um mecanismo seguro do sistema operacional (keyring nativo ou Tauri Stronghold).

## Stack Recomendada

| Tecnologia | Funcao |
|-----------|--------|
| keyring crate (Rust) | Acesso ao keyring do SO (Windows Credential Manager, macOS Keychain, Linux Secret Service) |
| tauri-plugin-store (opcional) | Alternativa caso keyring nao funcione no Tauri |
| serde / serde_json | Serializacao dos dados |

## Estado Atual

Atualmente, API keys sao armazenadas em:
- `%APPDATA%/JARVIS/secure-settings.json` (Windows)
- `~/Library/Application Support/JARVIS/secure-settings.json` (macOS)
- `~/.local/share/JARVIS/secure-settings.json` (Linux)

Isso e um risco de seguranca porque:
- Arquivo pode ser lido por outros processos
- Nao tem criptografia em repouso (apenas JSON plano)
- Backup do diretorio expoe chaves

## Como Fazer

### 1. Opcao A: Usar keyring crate

```toml
# src-tauri/Cargo.toml
[dependencies]
keyring = "2.0"
```

```rust
use keyring::Entry;

pub fn save_api_key(service: &str, key: &str) -> Result<(), String> {
    let entry = Entry::new("JARVIS", service).map_err(|e| e.to_string())?;
    entry.set_password(key).map_err(|e| e.to_string())
}

pub fn load_api_key(service: &str) -> Result<String, String> {
    let entry = Entry::new("JARVIS", service).map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

pub fn delete_api_key(service: &str) -> Result<(), String> {
    let entry = Entry::new("JARVIS", service).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())
}
```

### 2. Opcao B: Usar Tauri Stronghold

```toml
[dependencies]
tauri-plugin-stronghold = "2"
```

### 3. Atualizar storage/mod.rs

Substituir leitura/escrita de JSON por chamadas ao keyring.

### 4. Atualizar comandos Tauri

Manter mesma interface (load_secure_settings, save_secure_settings), mas implementacao usa keyring.

### 5. Migracao de dados existentes

Na primeira execucao apos atualizacao, migrar chaves do JSON antigo para o keyring e remover o arquivo.

## Criterios de Pronto

- [ ] Chaves de API armazenadas no keyring do SO
- [ ] Interface de comandos Tauri mantida (load/save/delete)
- [ ] Migracao automatica de chaves existentes
- [ ] JSON antigo removido apos migracao
- [ ] `cargo test` passa
- [ ] `npm run build` passa
- [ ] Logs nunca exibem tokens ou chaves

## Referencias

- `docs/seguranca-permissoes.md` — Politicas de seguranca
- `docs/context/14-funcionalidades-atuais.md#113` — Estado atual do secure storage
- `docs/context/13-plano-manutencao-pos-solid.md` — Etapa de seguranca
