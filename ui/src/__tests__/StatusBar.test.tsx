import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StatusBar } from '@/components/StatusBar';

const mockBridge = {
  getAppVersion: vi.fn().mockResolvedValue({ version: 'v0.1' }),
  checkForUpdates: vi.fn().mockResolvedValue({ update_available: false, latest_version: '' }),
  getModules: vi.fn().mockResolvedValue(Array(5).fill({ name: 'module' })),
  listModels: vi.fn().mockResolvedValue([{ name: 'codellama:7b' }, { name: 'llama3.2:3b' }]),
  getModelServerStatus: vi.fn().mockResolvedValue({ running: true, pid: 12345, port: 11434, error: '' }),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('StatusBar', () => {
  it('renders version', async () => {
    render(<StatusBar />);
    expect(await screen.findByText(/v0\.1/i)).toBeInTheDocument();
  });

  it('shows module count', async () => {
    render(<StatusBar />);
    expect(await screen.findByText(/5 módulos ativos/i)).toBeInTheDocument();
  });

  it('shows model name', async () => {
    render(<StatusBar />);
    expect(await screen.findByText(/codellama/i)).toBeInTheDocument();
  });

  it('shows online indicator', async () => {
    render(<StatusBar />);
    expect(await screen.findByText(/online/i)).toBeInTheDocument();
  });
});
