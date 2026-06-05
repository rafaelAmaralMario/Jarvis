import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TerminalPanel } from '@/components/Terminal/TerminalPanel';

const mockBridge = {
  terminalCreate: vi.fn().mockResolvedValue('term-1'),
  terminalWrite: vi.fn().mockResolvedValue(true),
  terminalResize: vi.fn().mockResolvedValue(true),
  terminalClose: vi.fn().mockResolvedValue(true),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
  useBridgeEvent: vi.fn(),
}));

vi.mock('@/components/Terminal/TerminalInstance', () => ({
  TerminalInstance: ({ terminalId }: { terminalId: string }) => <div data-testid={`terminal-${terminalId}`}>Terminal {terminalId}</div>,
}));

describe('TerminalPanel', () => {
  it('renders terminal header', async () => {
    render(<TerminalPanel />);
    const newBtn = await screen.findByTitle(/new terminal/i);
    expect(newBtn).toBeInTheDocument();
  });

  it('renders terminal instance', async () => {
    render(<TerminalPanel />);
    expect(await screen.findByTestId('terminal-term-1')).toBeInTheDocument();
  });
});
