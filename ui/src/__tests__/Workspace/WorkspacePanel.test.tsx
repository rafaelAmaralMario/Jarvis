import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkspacePanel } from '@/components/Workspace/WorkspacePanel';

const mockBridge = {
  getRoots: vi.fn().mockResolvedValue([]),
  getProjectInfo: vi.fn().mockResolvedValue(null),
  listFiles: vi.fn().mockResolvedValue([]),
  getRecentFiles: vi.fn().mockResolvedValue([]),
  readFile: vi.fn().mockResolvedValue(''),
  writeFile: vi.fn().mockResolvedValue(true),
  editorDetectLanguage: vi.fn().mockResolvedValue('plaintext'),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('WorkspacePanel', () => {
  it('renders empty state message', async () => {
    render(<WorkspacePanel />);
    expect(await screen.findByText(/no workspace/i)).toBeInTheDocument();
  });

  it('renders add folder button', async () => {
    render(<WorkspacePanel />);
    expect(await screen.findByRole('button', { name: /add folder/i })).toBeInTheDocument();
  });
});
