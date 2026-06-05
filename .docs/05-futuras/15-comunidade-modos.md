# Proposta: Modos de Uso, Comunidade e Gamificação

## Visão Geral
Expandir o JARVIS de uma ferramenta individual para uma plataforma com modos de uso especializados, comunidade de templates/share, e gamificação para engajamento.

## Modos de Uso

Os modos alteram o layout, os painéis padrão e as sugestões de IA para contextos específicos:

| Modo | Painéis Padrão | Público | Diferencial |
|------|---------------|---------|-------------|
| **Dev** | Editor, Git, Terminal, AI | Programadores | Monaco, debug, LSP |
| **Writer** | Knowledge, Preview, AI | Escritores | Markdown, foco, pesquisa |
| **Researcher** | Knowledge, Graph, AI, Web | Acadêmicos | Zotero integration, citações |
| **PM** | Tasks, Calendar, AI, Git | Gerentes | Planning, status reports |
| **Data Analyst** | Notebook, Charts, AI | Cientistas dados | Jupyter-like, visualizações |
| **Student** | Knowledge, Flashcards, AI | Estudantes | Spaced repetition, quizzes |
| **Minimal** | Apenas um painel | Foco máximo | Zen mode, distração zero |

## Templates e Receitas

### O que são
Configurações exportáveis que incluem:
- Plugins instalados e configurados
- Workflows de automação
- Temas e keybindings
- Agentes pré-configurados com prompts
- Workspace template structure

### Marketplace de Templates
- Compartilhar templates entre usuários
- Categorias: "React Developer Setup", "Data Science", "Academic Writing"
- Rating e reviews
- One-click apply

### Exemplo de Template
```json
{
    "name": "React Developer Pro",
    "version": "1.0",
    "author": "community",
    "plugins": ["eslint", "prettier", "tailwind-intellisense"],
    "agents": [
        { "name": "Code Reviewer", "model": "claude-3.5", "prompt": "..." },
        { "name": "Test Writer", "model": "gpt-4o", "prompt": "..." }
    ],
    "workflows": [
        { "trigger": "file:save:*.ts", "action": "run: npm run lint" }
    ],
    "theme": "nord",
    "keybindings": { "editor.save": "Ctrl+S" }
}
```

## Comunidade

### Compartilhamento de Conhecimento
- Publicar notas/anotações anonimizadas (opt-in)
- "Descobrir" — feed de notas públicas sobre tecnologia
- Repositório comunitário de prompts de IA eficientes
- Discussões em notas (comentários)

### JARVIS Scripts
- Scripts em Lua/Python que rodam dentro do JARVIS
- Acesso à API bridge para automação
- Biblioteca comunitária de scripts
- "Um script que organiza minhas notas por tag automaticamente"

## Gamificação

### Conquistas (Achievements)
| Conquista | Requisito |
|-----------|-----------|
| 🏆 First Note | Criar primeira nota |
| 🏆 Knowledge Weaver | Criar 100 notas conectadas |
| 🏆 Git Master | 100 commits pelo JARVIS |
| 🏆 Automation Wizard | 10 workflows ativos |
| 🏆 Plugin Pioneer | Instalar 5 plugins |
| 🏆 Polyglot | Usar JARVIS + IA em 3 idiomas |
| 🏆 Power User | 7 dias consecutivos de uso |
| 🏆 Community Hero | 10 templates compartilhados |

### Streaks e Estatísticas
- Daily streak (dias consecutivos de uso)
- "Você escreveu 500 notas este mês"
- Horas economizadas vs digitação manual
- Gráfico de atividade (GitHub-like contribution graph)

## Interface

### Modo Selector
- Splash screen na primeira vez: "Como você quer usar o JARVIS?"
- Switch de modo no menu Settings
- Transição suave entre modos (layout morphing)

### Profile & Stats
- Avatar, nome, bio
- Estatísticas: notas, commits, horas de uso
- Conquistas desbloqueadas
- Nível do usuário (baseado em XP)

### Community Hub
- Aba "Comunidade" no painel lateral
- Feed de templates populares
- Notas públicas em destaque
- Leaderboard (opcional, anônimo)

## Tabelas SQLite
```sql
CREATE TABLE user_profile (
    id TEXT PRIMARY KEY DEFAULT 'local',
    display_name TEXT,
    avatar_path TEXT,
    current_mode TEXT DEFAULT 'dev',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'local',
    achievement_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE activity_log (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    action_type TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    metadata JSON
);
```

## Dependências
- Templates não exigem novas dependências (são JSON)
- Community Hub precisa de Sync Server + backend cloud
- Gamificação é puramente local (SQLite)

## Prioridade: Baixa
## Esforço Estimado: 4-6 semanas
## Impacto: Médio-Alto — engajamento e retenção de usuários
