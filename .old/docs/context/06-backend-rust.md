# Backend Rust — Comandos Tauri

## Visão Geral

- **Entry point:** `src-tauri/src/main.rs` → chama `jarvis_lib::run()`
- **Builder Tauri:** `src-tauri/src/lib.rs` — 27 comandos registrados
- **Implementações:** `src-tauri/src/commands/mod.rs` (~879 linhas)

## 27 Comandos Registrados

### Filesystem & Workspace

| Comando | Descrição |
|---------|-----------|
| `default_workspace_path` | Retorna o diretório pai de CARGO_MANIFEST_DIR |
| `list_workspace_entries` | Árvore recursiva de arquivos (max depth 8) |
| `read_text_file` | Ler arquivo com boundary check do workspace |
| `write_text_file` | Escrever arquivo com boundary check |
| `create_file` | Criar arquivo vazio no workspace |
| `create_folder` | Criar diretório no workspace |
| `delete_entry` | Remover arquivo/diretório (não raiz) |
| `rename_entry` | Renomear arquivo/pasta |
| `move_entry` | Mover arquivo/pasta |
| `search_workspace` | Busca textual (max 200 resultados) |
| `validate_path` | Verificar se caminho existe |

### Ollama / Modelos

| Comando | Descrição |
|---------|-----------|
| `default_ollama_models_path` | Retorna ~/.ollama/models |
| `list_ollama_models` | Detecta modelos dos manifests Ollama |
| `start_ollama_model` | Executa `ollama run <model>` |
| `test_ollama_model` | Executa modelo e captura output |

### Git

| Comando | Descrição |
|---------|-----------|
| `git_status` | `git status --short` |
| `git_diff` | `git diff -- <file>` |
| `git_stage` | `git add -- <file>` |
| `git_unstage` | `git restore --staged -- <file>` |
| `git_commit` | `git commit -m <mensagem>` |
| `git_branches` | `git branch --list` |
| `git_checkout_branch` | `git checkout <branch>` |
| `git_create_branch` | `git checkout -b <branch>` |
| `github_pr_url` | Monta URL de PR do GitHub |

### Plugins

| Comando | Descrição |
|---------|-----------|
| `list_local_plugin_manifests` | Lê manifests de plugins do workspace |

### Notes / Contexto

| Comando | Descrição |
|---------|-----------|
| `list_markdown_notes` | Varredura recursiva de arquivos .md |
| `write_markdown_note` | Criar arquivo .md no vault |

### Configuração Segura

| Comando | Descrição |
|---------|-----------|
| `load_secure_settings` | Ler settings de `%APPDATA%/JARVIS/secure-settings.json` |
| `save_secure_settings` | Escrever settings em `%APPDATA%/JARVIS/secure-settings.json` |

## Segurança

### Validações em `commands/mod.rs`

| Função | Finalidade |
|--------|-----------|
| `ensure_inside_workspace()` | Previne path traversal |
| `validate_entry_name()` | Nomes de arquivo inválidos |
| `validate_ollama_model_name()` | Sanitização de nomes de modelo |
| `sanitize_note_title()` | Sanitização de títulos de nota |

### Ignore Patterns

Diretórios/arquivos ignorados nas operações de workspace:
- `.git`, `node_modules`, `target`, `dist`
- `.vite`, `.tmp`, `tmp`, `temp`
- Entradas do `.gitignore` do projeto

## Persistência (Rust)

- **Secure settings:** JSON em `%APPDATA%/JARVIS/secure-settings.json`
  - Contém: `ollama_models_path`, `secure_api_keys`
  - **Não** contém: settings regulares (que ficam no localStorage)
