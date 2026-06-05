import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainArea } from '@/components/MainArea';

const mockBridge = {
  getRoots: vi.fn().mockResolvedValue([]),
  gitIsRepo: vi.fn().mockResolvedValue(false),
  listModels: vi.fn().mockResolvedValue([]),
  listAgents: vi.fn().mockResolvedValue([]),
  getOrchestrationConfig: vi.fn().mockResolvedValue({ enabled: true, orchestratorModel: '', criticEnabled: false, criticTemperature: 0.1, maxAgentsPerQuery: 3, showTrace: true }),
  getOrchestrationPool: vi.fn().mockResolvedValue([]),
  updateOrchestrationConfig: vi.fn().mockResolvedValue(true),
  networkListApiKeys: vi.fn().mockResolvedValue([]),
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
