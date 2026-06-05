# Proposta: Automação de Workflows com IA

## Visão Geral
Criar um motor de workflows visuais onde o usuário pode definir, agendar e executar sequências de ações automatizadas, orquestradas por IA.

## Arquitetura

```
┌──────────────────────────────────────────────┐
│           Workflow Engine                    │
│  ┌────────┐  ┌────────┐  ┌────────┐         │
│  │ Steps  │  │ Routes │  │  Triggers │      │
│  │ (nodes)│  │(edges) │  │ (events) │       │
│  └────────┘  └────────┘  └────────┘         │
│  ┌──────────────────────────────────────┐    │
│  │        Step Executors                │    │
│  │  RunCmd │ ApiCall │ OpenFile │ Wait  │    │
│  │  SendMsg│ LLMQuery│ FileOp  │ Cond   │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │        Schedule & Triggers           │    │
│  │  Cron │ FileWatch │ GitHook │ Manual │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

## Tipos de Step

| Step | Descrição | Parâmetros |
|------|-----------|-----------|
| RunCommand | Executa comando shell | comando, args, cwd, timeout |
| ApiCall | Faz requisição HTTP | url, method, body, headers |
| OpenFile | Abre arquivo no editor | path, linha |
| LLMQuery | Consulta IA | prompt, modelo, temperatura |
| FileOp | Operação em arquivo | tipo (copy/move/delete), origem, destino |
| SendMessage | Envia notificação | título, corpo, tipo |
| Wait | Aguarda | tempo ms |
| Condition | Branch condicional | expressão, if, else |
| Loop | Repetir steps | variável, lista, steps |
| ExtractData | Extrair dados (regex/JSON path) | pattern, input, outputVar |

## Triggers

| Trigger | Descrição |
|---------|-----------|
| Manual | Executado pelo usuário via botão/atalho |
| Cron | Agendado (cron expression) |
| File Watch | Quando arquivo muda |
| Git Hook | Post-commit, pre-push |
| App Start | Quando JARVIS inicia |
| AI Event | Quando IA completa ação |

## Editor Visual de Workflows
- UI drag-and-drop com nós e conexões
- Paleta de steps disponíveis
- Propriedades do step em painel lateral
- Validação em tempo real (steps conectados corretamente?)
- Test run com passo a passo
- Histórico de execuções com logs

## Variáveis e Contexto
- Variáveis de entrada/saída entre steps
- Template strings: `{{ step1.output }}`
- Contexto compartilhado no workflow
- Suporte a JSON path para extrair dados

## Persistência
```sql
CREATE TABLE workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    trigger_config JSON,
    steps JSON NOT NULL,  -- array de steps
    variables JSON,
    enabled INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE workflow_executions (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    status TEXT NOT NULL,  -- running, success, error
    started_at TEXT NOT NULL,
    finished_at TEXT,
    error TEXT,
    logs JSON,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);
```

## Integração com IA
- Assistente pode sugerir workflows baseados no contexto
- "Crie um workflow que quando eu salvar um arquivo .ts, execute os testes"
- Análise de falhas: "O workflow X falhou. Quer que eu corrija?"

## Depêndencias
- Task 019 (Automação) — task já planejada
- React Flow ou biblioteca similar de grafos para UI
- libuuid ou QUuid para IDs

## Prioridade: Média
## Esforço Estimado: 4-6 semanas
## Impacto: Muito Alto — produtividade exponencial
