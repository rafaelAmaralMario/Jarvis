import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiPanel } from '@/components/AiPanel';

const mockAgents = [
  { id: 'agent-1', name: 'Geral', model: 'llama3.2:3b', description: '', systemPrompt: '', temperature: 0.7, maxTokens: 2048, specialty: 'general', tools: [], isDefault: true, canOrchestrate: false, priority: 5, createdAt: '', updatedAt: '' },
];

const mockBridge = {
  listAgents: vi.fn().mockResolvedValue(mockAgents),
  sendMessage: vi.fn().mockResolvedValue('Resposta simulada'),
  cancelGeneration: vi.fn(),
  chatListConversations: vi.fn().mockResolvedValue([]),
  chatCreateConversation: vi.fn().mockResolvedValue({ id: '1', title: 'New Chat', createdAt: '', updatedAt: '' }),
  chatDeleteConversation: vi.fn().mockResolvedValue(true),
  chatAutoTitle: vi.fn().mockResolvedValue('Mock Title'),
  toolsList: vi.fn().mockResolvedValue([]),
  toolsExecute: vi.fn().mockResolvedValue({ success: true, output: '' }),
  toolAgentExecute: vi.fn().mockResolvedValue({ success: true, output: '' }),
  toolAgentAnswer: vi.fn().mockResolvedValue(true),
  getOrchestrationConfig: vi.fn().mockResolvedValue({ enabled: true, orchestratorModel: '', criticEnabled: false, criticTemperature: 0.1, maxAgentsPerQuery: 3, showTrace: true }),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('AiPanel', () => {
  it('renders welcome message', async () => {
    render(<AiPanel />);
    expect(await screen.findByText(/Olá/i)).toBeInTheDocument();
  });

  it('renders agent selector', async () => {
    render(<AiPanel />);
    const select = await screen.findByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('renders chat input', async () => {
    render(<AiPanel />);
    const input = await screen.findByPlaceholderText(/message/i);
    expect(input).toBeInTheDocument();
  });
});
