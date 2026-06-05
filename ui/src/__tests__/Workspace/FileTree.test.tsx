import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileTree } from '@/components/Workspace/FileTree';

const files = [
  { name: 'src', path: '/root/src', isDirectory: true, children: [
    { name: 'index.ts', path: '/root/src/index.ts', isDirectory: false, children: [] },
  ]},
  { name: 'README.md', path: '/root/README.md', isDirectory: false, children: [] },
];

describe('FileTree', () => {
  it('renders file and folder entries', () => {
    render(<FileTree entries={files} onSelectFile={vi.fn()} onDeleteFile={vi.fn()} onCreateFile={vi.fn()} onCreateFolder={vi.fn()} onRename={vi.fn()} />);
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('calls onSelectFile when clicking a file', async () => {
    const user = userEvent.setup();
    const onSelectFile = vi.fn();
    render(<FileTree entries={files} onSelectFile={onSelectFile} onDeleteFile={vi.fn()} onCreateFile={vi.fn()} onCreateFolder={vi.fn()} onRename={vi.fn()} />);
    await user.click(screen.getByText('README.md'));
    expect(onSelectFile).toHaveBeenCalledWith('/root/README.md');
  });
});
