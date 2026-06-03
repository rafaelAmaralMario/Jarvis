import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ModelsPanel } from '@/components/Settings/ModelsPanel';

vi.mock('@/hooks/use-jarvis', () => {
  const mockModels = [
    {
      name: 'llama3.2:3b',
      specialty: 'general',
      status: 'running',
      size: '2.0GB',
      description: 'General purpose',
      color: '#6b7280',
      icon: '🤖',
      modified: '2024-01-01',
      errorMessage: '',
    },
  ];

  const bridge = {
    listModels: vi.fn().mockResolvedValue(mockModels),
    startModel: vi.fn().mockResolvedValue(true),
    stopModel: vi.fn().mockResolvedValue(true),
    pullModel: vi.fn().mockResolvedValue(true),
  };
  return { useJarvis: () => bridge };
});

describe('ModelsPanel', () => {
  it('renders model list after loading', async () => {
    render(<ModelsPanel />);

    await waitFor(() => {
      expect(screen.getByText('llama3.2:3b')).toBeInTheDocument();
    });
  });
});
