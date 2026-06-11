# 📋 JARVIS Kanban

Sistema visual de gerenciamento de tarefas para o desenvolvimento do JARVIS — assistente pessoal local.

## Como usar

### Estrutura de pastas

```
kanban/
├── README.md              ← Este arquivo
├── LOG.md                 ← Timeline cronológica de todas as alterações
├── templates/
│   └── card-template.md   ← Template para criar novos cards
├── logs/                  ← Logs detalhados com timestamp
│   └── YYYY-MM-DD_HHmmss-descricao.md
├── 01_Backlog/            ← Ideias e tarefas não refinadas
├── 02_Ready_For_Work/     ← Tarefas refinadas e prontas para executar
├── 03_In_Progress/        ← Tarefa sendo trabalhada AGORA (máx 1)
├── 04_Review/             ← Concluída, aguardando verificação/testes
└── 05_Done/               ← Completamente finalizada
```

### Fluxo de trabalho

1. **Backlog → Ready For Work**: Uma ideia é refinada com critérios de aceitação e dependências claras
2. **Ready For Work → In Progress**: A tarefa é iniciada (mover o card)
3. **In Progress → Review**: Implementação concluída, precisa de verificação
4. **Review → Done**: Testes passam, revisão aprovada
5. **Sempre que algo é movido**: Criar um arquivo em `logs/` com timestamp explicando o que foi feito

### Convenções

- **Nomenclatura**: `NNN_NomeDescritivo.md` (3 dígitos numéricos + nome)
- **Um card por arquivo**
- **Máximo 1 tarefa em In Progress por vez**
- **Logs seguem formato**: `YYYY-MM-DD_HHmmss-descricao.md`

### Comandos úteis

```powershell
# Ver quantos cards em cada coluna
@('Backlog','Ready_For_Work','In_Progress','Review','Done') | ForEach-Object {
    $count = (Get-ChildItem "kanban/01_$_" -Filter '*.md' -ErrorAction SilentlyContinue).Count
    Write-Host "$_`: $count cards"
}
```
