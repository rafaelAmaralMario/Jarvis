# Proposta: Desenvolvimento Remoto (SSH / DevContainer)

## Visão Geral
Permitir que o JARVIS se conecte a máquinas remotas via SSH ou containers Docker para desenvolvimento, execução de código e acesso a recursos que não estão disponíveis localmente.

## Cenários de Uso
- Desenvolver em servidor Linux remoto (compilar, testar)
- Acessar GPU em servidor cloud para treinar modelos
- Trabalhar com DevContainers (ambiente isolado por projeto)
- Conectar a instâncias EC2, VPS, ou servidores on-premises

## Arquitetura

```
┌─────────────────────────────────────────────┐
│              JARVIS Desktop                  │
│  ┌────────────────────────────────────────┐  │
│  │      Remote Connection Manager        │  │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐   │  │
│  │  │  SSH   │ │ DevCont. │ │  RDP   │   │  │
│  │  │ Client │ │  Client  │ │ Client │   │  │
│  │  └────────┘ └──────────┘ └────────┘   │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │    Remote FS (SFTP/FUSE)              │  │
│  │    • Árvore de arquivos remota        │  │
│  │    • Sync bidirecional (opcional)     │  │
│  │    • Edição remota com cache local    │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │    Remote Terminal                     │  │
│  │    • Shell SSH                         │  │
│  │    • Port Forwarding                   │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Funcionalidades

### Gerenciador de Conexões
- CRUD de conexões (host, porta, user, auth method)
- Suporte a: senha, key file, ssh-agent, keychain
- Teste de conexão
- Status (conectado/desconectado/erro)
- Reconexão automática

### Remote Workspace
- Navegação de arquivos remotos via SFTP
- Cache local de arquivos abertos para edição offline
- Sync automático quando reconectar
- Indicador visual de arquivo remoto vs local

### Remote Terminal
- Shell SSH dentro do TerminalPanel
- Múltiplas sessões SSH paralelas
- Port forwarding (local → remoto)
- Túnel para serviços remotos (ex: banco de dados)

### DevContainer Support
- Detecção de `.devcontainer/devcontainer.json`
- Build e start do container
- Anexar ao container em execução
- Executar comandos dentro do container
- Terminal dentro do container

### Indicadores Visuais
- Tag "🔵 Local" / "🟢 Remoto: servidor-x" no StatusBar
- Ícone na FileTree indicando arquivos remotos
- Badge no terminal indicando conexão SSH/container

## Configuração UI
- Aba "Conexões" no painel Config
- Wizard de nova conexão (tipo: SSH / DevContainer)
- Gerenciador de chaves SSH
- Templates de DevContainer (Node, Python, Rust, C++)

## Dependências
- libssh2 ou libssh (nova dependência)
- Docker CLI (para DevContainer)
- Task 019 (Automação) — para scripts de setup remoto

## Prioridade: Média
## Esforço Estimado: 4-5 semanas
## Impacto: Alto — desenvolvimento multiplataforma sem sair do JARVIS
