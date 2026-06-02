import { Folder, Search, GitBranch, Settings, Boxes, Code2, Bot, CircleHelp, type LucideIcon } from 'lucide-react';
import type { ActivityView, BottomView } from './types';

export const activityItems: Array<{ id: ActivityView; label: string; Icon: LucideIcon }> = [
  { id: 'files', label: 'Arquivos', Icon: Folder },
  { id: 'search', label: 'Busca', Icon: Search },
  { id: 'git', label: 'Git', Icon: GitBranch },
  { id: 'settings', label: 'Configuracoes', Icon: Settings },
  { id: 'plugins', label: 'Plugins', Icon: Boxes },
  { id: 'context', label: 'Contexto', Icon: Code2 },
  { id: 'agents', label: 'Agentes', Icon: Bot },
  { id: 'help', label: 'Ajuda', Icon: CircleHelp },
];

export const sidebarTitle: Record<ActivityView, string> = {
  files: 'Arquivos',
  search: 'Busca',
  git: 'Git',
  settings: 'Configuracoes',
  plugins: 'Plugins',
  context: 'Contexto',
  agents: 'Agentes',
  help: 'Ajuda',
};

export const bottomLabels: Record<BottomView, string> = {
  terminal: 'Terminal',
  logs: 'Logs',
  diff: 'Diff',
  proposal: 'Proposta',
  audit: 'Auditoria',
};

import type { PermissionId } from '../shared/types';

export const permissionItems: Array<{ id: PermissionId; label: string; description: string }> = [
  {
    id: 'read-workspace',
    label: 'Ler workspace',
    description: 'Permite agentes analisarem arquivos do projeto.',
  },
  {
    id: 'write-workspace',
    label: 'Propor escrita',
    description: 'Permite agentes criarem propostas de alteracao.',
  },
  {
    id: 'git',
    label: 'Usar Git',
    description: 'Permite leitura de status e diffs Git.',
  },
  {
    id: 'network',
    label: 'Acessar rede',
    description: 'Reservado para providers e integracoes externas.',
  },
  {
    id: 'secrets',
    label: 'Usar secrets',
    description: 'Permite acessar chaves salvas quando necessario.',
  },
];

export const commands = [
  { id: 'open-folder', label: 'Abrir pasta do projeto', Icon: Folder },
  { id: 'save-file', label: 'Salvar arquivo atual', Icon: undefined },
  { id: 'search', label: 'Buscar no projeto', Icon: undefined },
  { id: 'settings', label: 'Abrir configuracoes', Icon: undefined },
  { id: 'help', label: 'Abrir ajuda', Icon: undefined },
  { id: 'toggle-theme', label: 'Alternar tema', Icon: undefined },
];

export const activityBarWidth = 52;
export const combinedResizerWidth = 8;
export const editorMinWidth = 520;
export const sidebarMinWidth = 260;
export const aiPanelMinWidth = 360;
export const agentDesignerPath = 'jarvis://new-agent';

export const welcomeHelp = `# JARVIS - Ajuda rapida

JARVIS e uma IDE pensada para trabalhar com modelos de IA, agentes, contexto do projeto e integracoes locais.

## 1. Abrir um projeto

1. Clique no icone de pasta na barra lateral de Arquivos.
2. Selecione a pasta do projeto.
3. A lista de arquivos deve aparecer no explorer.
4. Use os botoes do explorer para criar arquivos, criar pastas, renomear, mover, remover e atualizar.

## 2. Configurar um modelo

1. Abra Configuracoes.
2. Escolha o Provider de IA:
   - Mock local: apenas valida o fluxo.
   - Ollama local: usa modelos instalados localmente.
   - OpenAI-compatible: usa APIs compativeis com OpenAI.
3. Escolha o modelo ativo.
4. Clique em Testar modelo.

## 3. Instalar modelos locais com Ollama

1. Acesse https://docs.ollama.com/
2. No Windows, siga https://docs.ollama.com/windows
3. Instale o Ollama.
4. No terminal, execute: ollama run llama3.2
5. No JARVIS, selecione Provider de IA: Ollama local.
6. Aponte a pasta de modelos, normalmente C:\\Users\\SeuUsuario\\.ollama\\models.
7. Clique em Detectar modelos para preencher o seletor com os modelos baixados.
8. Escolha o modelo ativo.
9. Use Iniciar modelo selecionado ou clique em Testar modelo.

## 4. Usar OpenAI-compatible

1. Obtenha uma API key do provider escolhido.
2. Configure o endpoint em Configuracoes.
3. Salve a chave.
4. Clique em Testar modelo.

Links uteis:

- https://developers.openai.com/api/docs/quickstart
- https://platform.openai.com/docs/api-reference/authentication

## 5. Obsidian e contexto

Configure dois caminhos:

- Geral: conhecimento reutilizavel entre projetos.
- Especifico do projeto: contexto, decisoes e notas que so fazem sentido neste projeto.

Use o destino ativo na tela de Contexto para salvar memorias no vault correto.

## 6. Agentes

1. Teste o modelo antes de criar agentes.
2. Abra Agentes.
3. Use o formulario para descrever o novo agente.
4. O JARVIS usa o modelo ativo para melhorar a definicao do agente.

Agente inicial:

- Cerebro do Projeto: analisa a estrutura do projeto e gera uma nota Markdown no vault especifico do projeto para indexacao no Obsidian.

## 7. Regras de seguranca

- Revise sempre propostas de agentes antes de aplicar alteracoes.
- Mantenha permissoes sensiveis desativadas ate serem necessarias.
- Separe contexto geral de contexto especifico por projeto.

## 8. Atalhos

- Ctrl+S: salva o arquivo aberto.
- Ponto amarelo na aba: indica arquivo com alteracoes nao salvas.
- Clique do meio na aba: fecha a aba, como no VS Code.
- A mesma aba de arquivo e reutilizada quando o arquivo ja estiver aberto.
`;

import type { EditorTab } from '../shared/types';

export const welcomeTab: EditorTab = {
  path: 'welcome.md',
  name: 'welcome.md',
  content: welcomeHelp,
  savedContent: welcomeHelp,
  language: 'markdown',
};
