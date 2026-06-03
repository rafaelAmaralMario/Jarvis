# Tarefa: Aplicar Diffs de Agentes com Aprovacao

**Epico:** 2 — Git Completo  
**Prioridade:** 🔴 Alta  
**Estimativa:** 2-3 semanas  
**Dependencias:** Epic 1 T1 (testes) - para garantir seguranca

## Objetivo

Permitir que agentes gerem diffs reais (nao mockados) que possam ser revisados visualmente e aplicados com confirmacao do usuario.

## Estado Atual

O botao "Aceitar Proposta" existe e registra no audit log, mas **nao aplica mudancas reais** no arquivo. A proposta e mockada.

## Stack Recomendada

| Tecnologia | Funcao |
|-----------|--------|
| Monaco Diff Editor | Visualizacao side-by-side de diffs |
| Tauri command `apply_diff` | Aplicar patch no arquivo |
| serde / serde_json | Formato de diff estruturado |

## Como Fazer

### 1. Formato de Diff Aplicavel

```typescript
interface DiffProposal {
  filePath: string;
  hunks: DiffHunk[];
  originalContent: string;
  proposedContent: string;
  agentId: string;
  timestamp: number;
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string; // linhas do diff com +/-/espaco
}
```

### 2. Criar comando Tauri `apply_diff`

```rust
#[tauri::command]
fn apply_diff(proposal: DiffProposal) -> Result<(), String> {
    // Validar permissao write-workspace
    // Ler arquivo atual
    // Verificar se conteudo ainda e o mesmo (originalContent match)
    // Aplicar hunks
    // Escrever arquivo
    // Registrar auditoria
}
```

### 3. Atualizar geracao de diff nos agentes

Modificar `developer` agent para:
- Usar modelo de IA ativo (em vez de mock)
- Ler conteudo real do arquivo
- Gerar diff estruturado com hunks
- Retornar DiffProposal

### 4. Melhorar UI de proposta

Substituir `<pre>` raw por Monaco Diff Editor.

### 5. Adicionar aprovacao seletiva

Permitir aceitar/rejeitar hunks individuais.

## Criterios de Pronto

- [ ] Agente developer usa modelo de IA ativo para gerar diffs
- [ ] Diff e exibido no Monaco Diff Editor (side-by-side)
- [ ] Usuario pode aceitar ou rejeitar cada proposta
- [ ] Aceitar aplica mudanca real no arquivo via Tauri
- [ ] Rejeitar descarta a proposta sem alterar arquivos
- [ ] Auditoria registra cada aplicacao (agente, arquivo, aceito/rejeitado)
- [ ] Falha preserva arquivo original (rollback seguro)
- [ ] Perdao write-workspace e verificada antes de aplicar

## Referencias

- `docs/context/14-funcionalidades-atuais.md#32` — Estado atual (propostas mockadas)
- `docs/roadmap-pos-mvp.md` — v0.1 Beta
- `docs/context/18-vscode-features.md#13` — Diff Editor vs code
