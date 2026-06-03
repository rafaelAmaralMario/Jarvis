import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextPanel } from '../ContextPanel';

describe('ContextPanel', () => {
  const defaultProps = {
    contextQuery: '',
    contextResults: [] as Array<{ id: string; title: string; source: string; score: number; preview: string }>,
    memoryInput: '',
    memoryEntries: [] as Array<{ id: string; content: string; createdAt: string }>,
    notes: [] as Array<{ path: string; title: string; content: string }>,
    activeVaultPath: '',
    contextVaultKind: 'project' as const,
    onContextQueryChange: vi.fn(),
    onMemoryInputChange: vi.fn(),
    onRunContextSearch: vi.fn(),
    onAddMemory: vi.fn(),
    onWriteMemoryToObsidian: vi.fn(),
  };

  it('should render empty notes state', () => {
    render(<ContextPanel {...defaultProps} />);
    expect(screen.getByText(/Nenhuma nota carregada/i)).toBeInTheDocument();
  });

  it('should render vault destination info', () => {
    render(<ContextPanel {...defaultProps} activeVaultPath="/vault/test" contextVaultKind="project" />);
    expect(screen.getByText(/Projeto/)).toBeInTheDocument();
    expect(screen.getByText(/\/vault\/test/)).toBeInTheDocument();
  });

  it('should render context results', () => {
    const results = [{ id: '1', title: 'Test Result', source: 'Obsidian', score: 5, preview: 'Preview text' }];
    render(<ContextPanel {...defaultProps} contextResults={results} />);
    expect(screen.getByText('Test Result')).toBeInTheDocument();
    expect(screen.getByText(/score 5/)).toBeInTheDocument();
  });

  it('should render memory entries', () => {
    const memories = [{ id: 'm1', content: 'Important decision', createdAt: '2024-01-01' }];
    render(<ContextPanel {...defaultProps} memoryEntries={memories} />);
    expect(screen.getByText('Important decision')).toBeInTheDocument();
  });

  it('should render notes list', () => {
    const notes = [{ path: '/vault/note.md', title: 'Note Title', content: 'Content' }];
    render(<ContextPanel {...defaultProps} notes={notes} />);
    expect(screen.getByText('Note Title')).toBeInTheDocument();
  });
});
