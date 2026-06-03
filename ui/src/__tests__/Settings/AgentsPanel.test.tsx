import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentsPanel } from '@/components/Settings/AgentsPanel';

vi.mock('@/hooks/use-jarvis', () => {
  const mockAgents = [
    {
      id: 'agent-1',
      name: 'Assistant Geral',
      description: 'General assistant',
      model: 'llama3.2:3b',
      systemPrompt: 'You are helpful',
      temperature: 0.7,
      maxTokens: 2048,
      specialty: 'general',
      tools: [],
      isDefault: true,
      canOrchestrate: true,
      priority: 5,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  const bridge = {
    listAgents: vi.fn().mockResolvedValue(mockAgents),
    createAgent: vi.fn().mockResolvedValue(mockAgents[0]),
    updateAgent: vi.fn().mockResolvedValue(mockAgents[0]),
    deleteAgent: vi.fn().mockResolvedValue(true),
    setDefaultAgent: vi.fn().mockResolvedValue(true),
  };
  return { useJarvis: () => bridge };
});

describe('AgentsPanel', () => {
  it('renders agent list', async () => {
    render(<AgentsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Assistant Geral')).toBeInTheDocument();
    });
  });

  it('opens create dialog on button click', async () => {
    const user = userEvent.setup();
    render(<AgentsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Assistant Geral')).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /new agent/i });
    await user.click(createBtn);
    expect(screen.getByRole('heading', { name: /new agent/i })).toBeInTheDocument();
  });
});
