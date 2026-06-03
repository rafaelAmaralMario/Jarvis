# Casos de Teste: Testes de Integracao e E2E

## Testes de Integracao Frontend

| # | Fluxo | Descricao | Passos | Expected Result |
|---|-------|-----------|--------|-----------------|
| I1 | Chat flow completo | Enviar mensagem > streaming > exibicao | 1. Send "hello" 2. Mock retorna chunks 3. Ver streaming | Tokens aparecem em tempo real, mensagem completa no historico |
| I2 | Chat cancelamento | Cancelar durante geracao | 1. Send mensagem 2. Cancel antes de terminar | Streaming para, isGenerating=false |
| I3 | File CRUD ciclo | Criar > renomear > mover > deletar | 1. Create file 2. Rename 3. Move 4. Delete | Cada operacao chama invoke com args corretos, refresh apos cada |
| I4 | Git flow completo | Status > stage > diff > commit | 1. Status 2. Stage 3. Diff 4. Commit | Estado transiciona corretamente, invoke chamado em cada passo |
| I5 | Settings persistencia | Mudar > reload > valores mantidos | 1. Toggle theme 2. Mock localStorage 3. Reload hook | Tema mantido apos reload |
| I6 | Plugin toggle | Ativar > desativar > verificar | 1. Toggle on 2. Toggle off 3. Verify | enabledPlugins atualizado, verifyPlugin chamado |
| I7 | Agent run | Executar agente developer | 1. Run developer 2. Ver saida | says gerado, Bottom Panel mostra diff |

## Testes Rust

| # | Modulo | Descricao | Codigo | Expected Result |
|---|--------|-----------|--------|-----------------|
| R1 | workspace path valido | Path dentro do workspace | "/ws/src/file.ts" com ws="/ws" | Ok(()) |
| R2 | workspace path traversal | Path fora do workspace | "/etc/passwd" com ws="/ws" | Err "Path traversal detected" |
| R3 | entry name valido | Nome de arquivo valido | "file.ts" | Ok(()) |
| R4 | entry name invalido | Nome com caracteres proibidos | "../../file" | Err "Invalid entry name" |
| R5 | git PR URL | URL de comparacao | repo="user/repo", branch="feature" | "https://github.com/user/repo/compare/main...feature?expand=1" |
| R6 | ollama model valido | Nome de modelo valido | "llama3.2" | Ok(()) |
| R7 | ollama model invalido | Path traversal no nome | "../../malicious" | Err "Invalid model name" |
| R8 | note title sanitizado | Titulo seguro | "Nota: Teste!" | "Nota Teste" |
| R9 | secure settings | Load/Save round-trip | Salvar e carregar | Dados preservados |

## Smoke Tests (Playwright E2E)

| # | Teste | Descricao | Verificacao |
|---|-------|-----------|-------------|
| S1 | App abre | App Tauri inicia | Layout IDE visivel (activity bar, editor, chat, bottom) |
| S2 | Abrir workspace | Dialog de pasta | Arvore de arquivos aparece apos selecao |
| S3 | Abrir arquivo | Monaco carrega | Conteudo do arquivo no editor |
| S4 | Editar e salvar | Edicao + Ctrl+S | Dirty indicator some, arquivo salvo |
| S5 | Busca textual | Pesquisar no workspace | Resultados aparecem no SearchPanel |
| S6 | Chat mock | Enviar mensagem | Resposta streaming aparece |
| S7 | Git status | Git panel | Arquivos modificados listados |
