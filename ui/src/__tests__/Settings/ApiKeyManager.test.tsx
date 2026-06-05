import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeyManager } from '@/components/Settings/ApiKeyManager';

const mockBridge = {
  networkListApiKeys: vi.fn().mockResolvedValue([
    { service: 'OPENAI', key: 'sk-...xyz' },
  ]),
  networkStoreApiKey: vi.fn().mockResolvedValue(true),
  networkDeleteApiKey: vi.fn().mockResolvedValue(true),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('ApiKeyManager', () => {
  it('renders key list', async () => {
    render(<ApiKeyManager />);
    expect(await screen.findByText('OPENAI')).toBeInTheDocument();
  });

  it('renders add form', () => {
    render(<ApiKeyManager />);
    expect(screen.getByPlaceholderText(/nome do serviço/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/chave/i)).toBeInTheDocument();
  });
});
