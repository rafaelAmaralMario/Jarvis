import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrchestrationPanel } from '@/components/Settings/OrchestrationPanel';

vi.mock('@/hooks/use-jarvis', () => {
  const bridge = {
    getOrchestrationConfig: vi.fn().mockResolvedValue({
      enabled: true,
      orchestratorModel: 'llama3.2:3b',
      criticEnabled: true,
      criticTemperature: 0.1,
      maxAgentsPerQuery: 3,
      showTrace: true,
    }),
    getOrchestrationPool: vi.fn().mockResolvedValue([]),
    updateOrchestrationConfig: vi.fn().mockResolvedValue(true),
  };
  return { useJarvis: () => bridge };
});

describe('OrchestrationPanel', () => {
  it('renders configuration form', async () => {
    render(<OrchestrationPanel />);

    await waitFor(() => {
      expect(screen.getByText(/multi-agent mode/i)).toBeInTheDocument();
    });
  });

  it('toggles orchestration enabled', async () => {
    const user = userEvent.setup();
    render(<OrchestrationPanel />);

    await waitFor(() => {
      expect(screen.getByText(/multi-agent mode/i)).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
  });
});
