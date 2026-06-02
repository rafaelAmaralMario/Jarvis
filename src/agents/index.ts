export interface AgentDefinition {
  id: string;
  name: string;
  goal: string;
  defaultModelCapability: 'text' | 'code';
  permissions: string[];
  output: 'diff' | 'review' | 'docs' | 'context';
}

export const agentDefinitions: AgentDefinition[] = [
  {
    id: 'project-brain',
    name: 'Cerebro do Projeto',
    goal: 'Analisar o projeto e gerar notas de contexto estruturadas para indexacao no Obsidian.',
    defaultModelCapability: 'text',
    permissions: ['read-workspace'],
    output: 'context',
  },
  {
    id: 'developer',
    name: 'Desenvolvedor',
    goal: 'Propor alteracoes de codigo em formato de diff revisavel.',
    defaultModelCapability: 'code',
    permissions: ['read-workspace', 'write-workspace'],
    output: 'diff',
  },
  {
    id: 'reviewer',
    name: 'Revisor',
    goal: 'Revisar mudancas, riscos e lacunas de teste antes de aplicar alteracoes.',
    defaultModelCapability: 'code',
    permissions: ['read-workspace', 'git'],
    output: 'review',
  },
  {
    id: 'documenter',
    name: 'Documentador',
    goal: 'Sugerir documentacao para funcionalidades e decisoes tecnicas.',
    defaultModelCapability: 'text',
    permissions: ['read-workspace'],
    output: 'docs',
  },
];
