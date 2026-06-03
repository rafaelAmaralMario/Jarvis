# 019 — Módulo Automação

## Metadados
- Status: a fazer
- Prioridade: 🟡 Média
- Dependências: 018

## Descrição
Painel de automação com workflows, scripts, browser automation (Playwright) e desktop automation.

## Especificação Técnica

### React — Componentes
- `AutomationPanel.tsx` — componente para view ⚡ no ActivityBar
- Lista de workflows com status (idle/running/error)
- Botão "Novo Workflow" que abre editor de workflow
- Card de workflow com nome, descrição, último run, botões run/edit/delete

### C++ — Workflow Engine
- `AutomationManager` — gerencia workflows registrados
- Workflow = lista de steps (ação + parâmetros)
- Steps: `runCommand`, `openFile`, `apiCall`, `browserAction`, `keyPress`
- Execução em thread separada
- Eventos: `workflow-start`, `workflow-step`, `workflow-end`, `workflow-error`

### Browser Automation
- Bridge handlers para Playwright via Node.js child process
- `automationBrowserNavigate(url)`, `automationBrowserClick(selector)`, etc
- Ou usar biblioteca C++ tipo Puppeteer (via CDP)

### Desktop Automation
- Bridge handlers usando win32/api nativa (SendInput, keybd_event, mouse_event)
- `automationDesktopKeyPress(key)`, `automationDesktopMouseClick(x, y)`
- Bloqueável por segurança (permissão necessária)

## Critérios de Aceitação
- [ ] Painel ⚡ mostra lista de workflows
- [ ] Workflow pode ser criado/editado
- [ ] Workflow executa steps em sequência
- [ ] Browser automation navega em URL
- [ ] Desktop automation simula clique
- [ ] Status/erros reportados em tempo real

## Test Cases

### TC-001: Workflow executa
- **Passos:** 1. Criar workflow com step "echo hello" 2. Executar
- **Resultado:** Workflow completa com sucesso, log mostra "hello"
- **Cobertura:** normal

### TC-002: Browser automation
- **Passos:** 1. Executar workflow com browserNavigate("https://example.com")
- **Resultado:** Browser abre na URL especificada
- **Cobertura:** normal
