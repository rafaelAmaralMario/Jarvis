# Sistema de Permissões e Segurança

## Modelo de Permissões

### 5 Permissões Base

| ID | Rótulo | Descrição | Risco |
|----|--------|-----------|-------|
| `read-workspace` | Ler workspace | Analisar arquivos do projeto | Baixo |
| `write-workspace` | Propor escrita | Criar propostas de modificação | Alto |
| `git` | Usar Git | Ler status e diffs Git | Médio |
| `network` | Acessar rede | Providers e integrações externas | Alto |
| `secrets` | Usar secrets | Acessar chaves salvas | Crítico |

### Níveis de Risco

| Risco | Permissões |
|-------|------------|
| Baixo | read-workspace |
| Médio | git (index/diff) |
| Alto | write-workspace, network |
| Crítico | secrets, delete, destructive |

## Onde as Permissões São Aplicadas

### 1. Workspace (configurado em Settings > Permissions)
- O usuário define quais permissões concede para cada workspace
- Workspace = diretório do projeto aberto no JARVIS

### 2. Agentes (definido na definição do agente)
- Cada agente declara quais permissões precisa
- Ao executar, o sistema verifica se o workspace as concedeu

### 3. Plugins (declarado no manifest)
- Cada plugin declara as permissões que requer
- Ao ativar, o sistema verifica se o workspace as concedeu

### 4. Audit Trail
- Toda ação sensível é registrada no log de auditoria
- Contém: actor (agente/usuário), permissão usada, alvo, resultado
- Armazenado em `localStorage` por workspace (`jarvis.audit.<path>`)

## Fluxo de Verificação

```
Usuário/Agente/Plugin solicita ação
  → Verifica permissão necessária
    → Concedida? Executa ação e registra no audit log
    → Negada? Bloqueia e notifica usuário
```

## Pontos de Atenção

- Token de API do OpenAI é armazenado no backend Rust (`secure-settings.json`), não no frontend
- Permissões de rede e secrets são OFF por padrão
- Path traversal é prevenido no Rust com `ensure_inside_workspace()`
- Operações destrutivas (delete) mostram modal de confirmação
