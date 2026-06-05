import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KnowledgePanel } from '@/components/Knowledge/KnowledgePanel';

const mockBridge = {
  listNotes: vi.fn().mockResolvedValue([
    { id: 'note-1', title: 'Test Note', content: 'Hello', folder: '/', tags: [], createdAt: '', updatedAt: '' },
  ]),
  getFolders: vi.fn().mockResolvedValue([]),
  getNote: vi.fn().mockResolvedValue(null),
  updateNote: vi.fn().mockResolvedValue({}),
  searchNotes: vi.fn().mockResolvedValue([]),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('KnowledgePanel', () => {
  it('renders note list after loading', async () => {
    render(<KnowledgePanel />);
    expect(await screen.findByText('Test Note')).toBeInTheDocument();
  });

  it('renders new note button', async () => {
    render(<KnowledgePanel />);
    expect(await screen.findByRole('button', { name: /new note/i })).toBeInTheDocument();
  });

  it('renders view mode toggle', async () => {
    render(<KnowledgePanel />);
    const graphBtn = await screen.findByRole('button', { name: /graph/i });
    expect(graphBtn).toBeInTheDocument();
  });
});
