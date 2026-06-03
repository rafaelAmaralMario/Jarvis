# Recomendacoes de Seguranca — JARVIS

## 1. Principios de Seguranca

1. **Minimo privilegio**: agente/plugin so tem acesso ao que pediu e foi autorizado
2. **Consentimento explicito**: acoes criticas sempre exigem confirmacao do usuario
3. **Auditabilidade**: toda acao sensivel e registrada com quem, o que, quando, resultado
4. **Defesa em profundidade**: backend Rust valida o que o frontend enviou
5. **Privacidade por design**: dados do usuario nunca saem sem permissao explicita
6. **Transparencia**: usuario ve exatamente o que cada agente/plugin esta fazendo

---

## 2. Matriz de Permissoes (Expandida)

### Permissoes Atuais (ja existem)

| ID | Risco | Descricao | Requer Confirmacao? |
|---|---|---|---|
| read-workspace | 🟢 Baixo | Ler arquivos do workspace | Nao (se configurado) |
| write-workspace | 🟡 Medio | Escrever/modificar arquivos | Sim (se agente) |
| git | 🟡 Medio | Operacoes Git | Nao |
| network | 🔴 Alto | Acessar rede/APIs | Sim |
| secrets | 🔴 Critico | Acessar chaves salvas | Sim |

### Novas Permissoes (propostas)

| ID | Risco | Descricao | Requer Confirmacao? |
|---|---|---|---|
| system-command | 🔴 Critico | Executar comandos no sistema | **Sempre** |
| browser-control | 🔴 Alto | Controlar navegador web | **Sempre** |
| microphone | 🟡 Medio | Capturar audio do microfone | **Sempre** |
| webcam | 🔴 Alto | Capturar video da webcam | **Sempre** |
| screen-capture | 🔴 Critico | Capturar tela do computador | **Sempre** |
| keyboard-mouse | 🔴 Alto | Simular teclado/mouse | **Sempre** |
| file-download | 🟡 Medio | Download de arquivos para o sistema | Sim |
| clipboard-read | 🟡 Medio | Ler area de transferencia | Sim |
| clipboard-write | 🟢 Baixo | Escrever area de transferencia | Nao |
| notifications | 🟢 Baixo | Enviar notificacoes | Nao |
| automation-web | 🔴 Alto | Automacao de sites (preencher formularios) | **Sempre** |
| automation-finance | 🔴 Critico | Operacoes financeiras automatizadas | **Sempre + 2FA** |

---

## 3. Controle de Acesso a Perifericos

### Microfone

```typescript
// Fluxo de acesso ao microfone
async function requestMicrophoneAccess(reason: string): Promise<boolean> {
  // 1. Verificar se permissao ja foi concedida para este workspace
  if (permissions.microphone === 'granted') return true;
  
  // 2. Mostrar dialogo nativo ou banner na UI
  const granted = await showPermissionDialog({
    permission: 'microphone',
    icon: 'mic',
    agent: currentAgent?.name,
    reason,
    options: ['Permitir uma vez', 'Permitir sempre', 'Negar']
  });
  
  // 3. Se concedido, iniciar captura
  if (granted) {
    await invoke('microphone_start_listening');
    addAudit({ actor: currentAgent?.id, action: 'microphone', result: 'granted' });
    return true;
  }
  
  addAudit({ actor: currentAgent?.id, action: 'microphone', result: 'denied' });
  return false;
}
```

### Webcam

```typescript
async function requestWebcamAccess(reason: string): Promise<boolean> {
  // Mesmo fluxo do microfone, mas com risco maior
  // Requer confirmacao SEMPRE, mesmo se ja autorizado na sessao
}
```

### Captura de Tela

```typescript
async function requestScreenCapture(reason: string): Promise<boolean> {
  // Risco CRITICO: agente pode ver senhas, dados pessoais
  // Requer:
  //   1. Confirmacao explicita do usuario
  //   2. Indicador visual na UI (borda vermelha piscando "Gravando tela")
  //   3. Timeout automatico (max 30 segundos por captura)
  //   4. Registro em auditoria com preview da captura
}
```

### Teclado/Mouse

```typescript
async function requestInputSimulation(reason: string): Promise<boolean> {
  // Risco ALTO: agente pode digitar em qualquer lugar
  // Requer confirmacao explicita
  // Recomendacao: criar "modo seguro" que exibe OSD (on-screen display)
  // mostrando o que o agente esta "digitando" antes de executar
}
```

---

## 4. Automacao Financeira (Seguranca Critica)

### Regras Rigidas

```typescript
interface FinanceOperation {
  type: 'buy' | 'sell' | 'transfer' | 'invest';
  platform: string;      // ex: 'binance', 'nuinvest', 'banco x'
  amount: number;
  asset: string;         // ex: 'PETR4', 'BTC', 'USD'
  timestamp: number;
}

const FINANCE_SAFETY_RULES = {
  requireExplicitConfirmation: true,  // SEMPRE confirmar
  requireSecondFactor: true,          // 2FA/senha adicional
  maxTransactionAmount: 1000,         // Limite padrao via agente
  requireSeparatePassword: true,      // Senha diferente para automacao
  logToSeparateAudit: true,           // Auditoria financeira separada
  requireUserPresent: true,           // Usuario precisa estar na frente
  cooldownBetweenOps: 30000,          // 30s entre operacoes
  maxDailyOperations: 5,              // Max 5 operacoes/dia via agente
};
```

### Banner de Confirmacao Financeira

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠️  OPERACAO FINANCEIRA DETECTADA                                │
│                                                                  │
│  Agente: "Assistente Financeiro"                                 │
│  Acao: Comprar 10 acoes PETR4                                    │
│  Plataforma: Nuinvest                                            │
│  Valor estimado: R$ 475,00                                       │
│                                                                  │
│  [Confirmar com senha] [Confirmar] [Negar] [Bloquear agente]    │
│                                                                  │
│  ⚠️ Esta operacao sera registrada em auditoria separada          │
│  ⚠️ Limite diario restante: 3 operacoes                          │
│  ⚠️ Tempo para expiracao: 60 segundos                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Execucao de Comandos no Sistema

### White-list de Comandos

```rust
// Comandos permitidos SEM confirmacao (baixo risco)
const SAFE_COMMANDS: &[&str] = &[
    "ls", "dir", "pwd", "echo", "cat", "type",
    "npm --version", "node --version", "git --version",
    "cargo --version", "rustc --version",
];

// Comandos que REQUEREM confirmacao
const DANGEROUS_COMMANDS: &[&str] = &[
    "rm", "rmdir", "del", "rd", "format",
    "mkfs", "dd", ">", ">>", "|",
    "sudo", "runas", "chmod", "chown",
    "shutdown", "reboot", "halt",
    "curl", "wget", "scp", "rsync",
    "npm install -g", "pip install", "cargo install",
];
```

### Sandboxing de Comandos

```rust
pub fn execute_command_safe(
    command: &str,
    args: &[String],
) -> Result<CommandResult, String> {
    // 1. Validar permissao system-command
    check_permission("system-command")?;
    
    // 2. Se comando perigoso, exigir confirmacao
    if is_dangerous(command) {
        request_confirmation(format!("Executar: {} {}", command, args.join(" ")))?;
    }
    
    // 3. Executar com timeout (max 30s)
    let output = Command::new(command)
        .args(args)
        .timeout(Duration::from_secs(30))
        .output()?;
    
    // 4. Registrar em auditoria
    add_audit_entry(AuditEntry {
        actor: current_agent(),
        action: "system-command",
        target: format!("{} {}", command, args.join(" ")),
        result: if output.status.success() { "success" } else { "failure" },
        summary: truncate_output(&output.stdout, 500),
    });
    
    Ok(CommandResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}
```

---

## 6. Auditoria e Logs

### Sistema de Auditoria em Duas Camadas

```typescript
// Camada 1: Auditoria rapida (localStorage) - para acoes do dia-a-dia
interface AuditEvent {
  id: string;
  timestamp: number;
  actor: string;           // 'user' | 'agent:developer' | 'plugin:git'
  action: PermissionId;    // 'write-workspace' | 'system-command'
  target: string;          // arquivo, URL, comando
  result: 'success' | 'failure' | 'blocked' | 'pending';
  details?: string;        // descricao adicional
  modelId?: string;        // qual modelo de IA usou
}

// Camada 2: Auditoria financeira (separada, mais detalhada)
interface FinanceAuditEvent extends AuditEvent {
  operationType: 'buy' | 'sell' | 'transfer';
  platform: string;
  amount: number;
  asset: string;
  receipt?: string;        // comprovante ou hash da transacao
  userConfirmedAt: number; // timestamp da confirmacao do usuario
}
```

### Politica de Retencao

| Tipo de Evento | Retencao | Local |
|---------------|----------|-------|
| Acoes diarias (chat, git, arquivos) | 30 dias | localStorage |
| Acoes de permissao | 90 dias | localStorage |
| Operacoes financeiras | 5 anos | SQLite criptografado |
| Acesso a perifericos | 90 dias | localStorage |
| Comandos de sistema | 90 dias | localStorage |

---

## 7. Protecao de Dados e Privacidade

### Regras

1. **Dados nunca saem do computador** sem permissao explicita do usuario
2. **Contexto enviado para LLMs** e sempre mostrado antes do envio
3. **Credenciais nunca vao para prompts** de IA sem autorizacao
4. **Audio/video capturado** nunca e armazenado apos processamento
5. **Capturas de tela** sao descartadas imediatamente apos uso
6. **Usuario pode auditar tudo** que foi enviado para modelos externos

### Interface de Transparencia

```tsx
<ContextSentIndicator>
  <div class="context-sent-header">
    <Eye size={16} />
    <span>Contexto enviado para o modelo:</span>
  </div>
  <div class="context-sent-items">
    <ContextItem file="src/index.ts" lines="1-50" />
    <ContextItem file="README.md" full />
    <ContextItem note="Decisao arquitetural.md" />
  </div>
  <button class="view-full">Ver conteudo completo enviado</button>
</ContextSentIndicator>
```

---

## 8. Checklist de Seguranca para Novas Features

Toda nova feature que envolva perifericos, sistema ou financas deve passar por:

- [ ] Definir nivel de risco (Baixo/Medio/Alto/Critico)
- [ ] Mapear permissoes necessarias
- [ ] Implementar verificacao de permissao no backend Rust
- [ ] Adicionar UI de confirmacao (banner/modal)
- [ ] Registrar em auditoria
- [ ] Adicionar timeout para confirmacao (expirar apos 60s)
- [ ] Testar com permissoes negadas (deve bloquear)
- [ ] Testar com permissoes concedidas (deve executar)
- [ ] Documentar na interface para o usuario
