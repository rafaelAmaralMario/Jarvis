import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilesPanel } from '../FilesPanel';
import { mockWorkspaceFiles } from '../../hooks/__tests__/test-utils';

describe('FilesPanel', () => {
  const defaultProps = {
    workspacePath: '/workspace',
    files: [] as typeof mockWorkspaceFiles,
    workspaceLoadError: '',
    expandedFolders: new Set<string>(),
    selectedEntry: null,
    onChooseWorkspace: vi.fn(),
    onOpenModal: vi.fn(),
    onSetSelectedEntry: vi.fn(),
    onRefreshWorkspace: vi.fn(),
    onOpenWorkspaceFile: vi.fn(),
  };

  it('should render empty state when no files', () => {
    render(<FilesPanel {...defaultProps} />);
    expect(screen.getByText(/nenhum arquivo/i)).toBeInTheDocument();
  });

  it('should render workspace path', () => {
    render(<FilesPanel {...defaultProps} workspacePath="/my-project" />);
    expect(screen.getByText('/my-project')).toBeInTheDocument();
  });

  it('should render error state', () => {
    render(<FilesPanel {...defaultProps} workspaceLoadError="Error loading" />);
    expect(screen.getByText('Error loading')).toBeInTheDocument();
  });

  it('should render file tree when files provided', () => {
    render(<FilesPanel {...defaultProps} files={mockWorkspaceFiles} />);
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('package.json')).toBeInTheDocument();
  });

  it('should render toolbar buttons', () => {
    render(<FilesPanel {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
