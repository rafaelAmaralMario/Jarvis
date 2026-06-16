import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainArea } from '@/components/MainArea';

const mockBridge = {
  llmGetProviders: vi.fn().mockResolvedValue([]),
  getRoots: vi.fn().mockResolvedValue([]),
  gitIsRepo: vi.fn().mockResolvedValue(false),
  listModels: vi.fn().mockResolvedValue([]),
  listAgents: vi.fn().mockResolvedValue([]),
  getOrchestrationConfig: vi.fn().mockResolvedValue({ enabled: true, orchestratorModel: '', criticEnabled: false, criticTemperature: 0.1, maxAgentsPerQuery: 3, showTrace: true }),
  getOrchestrationPool: vi.fn().mockResolvedValue([]),
  updateOrchestrationConfig: vi.fn().mockResolvedValue(true),
  networkListApiKeys: vi.fn().mockResolvedValue([]),
  chatListConversations: vi.fn().mockResolvedValue([]),
  chatCreateConversation: vi.fn().mockResolvedValue({ id: '1', title: 'New Chat', createdAt: '', updatedAt: '' }),
  chatDeleteConversation: vi.fn().mockResolvedValue(true),
  chatAutoTitle: vi.fn().mockResolvedValue('Mock Title'),
  toolsList: vi.fn().mockResolvedValue([]),
  toolsExecute: vi.fn().mockResolvedValue({ success: true, output: '' }),
  toolAgentExecute: vi.fn().mockResolvedValue({ success: true, output: '' }),
  toolAgentAnswer: vi.fn().mockResolvedValue(true),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('MainArea', () => {
  it('renders AI view for ai activeView', () => {
    render(<MainArea activeView="ai" onViewChange={vi.fn()} />);
    expect(screen.getByText('JARVIS')).toBeInTheDocument();
  });

  it('renders settings view', async () => {
    render(<MainArea activeView="settings" onViewChange={vi.fn()} />);
    expect(await screen.findByText('Settings')).toBeInTheDocument();
  });

  it('shows no-git message for git view without repo', () => {
    render(<MainArea activeView="git" onViewChange={vi.fn()} />);
    expect(screen.getByText(/no git repository/i)).toBeInTheDocument();
  });
});
