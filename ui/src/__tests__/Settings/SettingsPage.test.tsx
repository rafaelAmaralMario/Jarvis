import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from '@/components/Settings/SettingsPage';

const mockBridge = {
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

describe('SettingsPage', () => {
  it('renders settings sidebar header', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders tab buttons', () => {
    render(<SettingsPage />);
    expect(screen.getAllByText(/models/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/agents/i)).toBeInTheDocument();
    expect(screen.getByText(/api keys/i)).toBeInTheDocument();
  });

  it('switches to api-keys tab on click', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await user.click(screen.getByText(/api keys/i));
    expect(await screen.findByText(/adicionar api key/i)).toBeInTheDocument();
  });
});
