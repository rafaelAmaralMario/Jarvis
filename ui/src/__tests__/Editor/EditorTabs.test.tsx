import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorTabs } from '@/components/Editor/EditorTabs';

describe('EditorTabs', () => {
  const tabs = [
    { path: '/test/file1.ts', name: 'file1.ts', isDirty: false, language: 'typescript' },
    { path: '/test/file2.tsx', name: 'file2.tsx', isDirty: true, language: 'typescriptreact' },
  ];

  it('renders all tabs', () => {
    render(<EditorTabs tabs={tabs} activeTab="/test/file1.ts" onSelectTab={vi.fn()} onCloseTab={vi.fn()} />);
    expect(screen.getByText('file1.ts')).toBeInTheDocument();
    expect(screen.getByText('file2.tsx')).toBeInTheDocument();
  });

  it('calls onSelectTab when clicking a tab', async () => {
    const user = userEvent.setup();
    const onSelectTab = vi.fn();
    render(<EditorTabs tabs={tabs} activeTab="/test/file1.ts" onSelectTab={onSelectTab} onCloseTab={vi.fn()} />);
    await user.click(screen.getByText('file1.ts'));
    expect(onSelectTab).toHaveBeenCalledWith('/test/file1.ts');
  });

  it('returns null for empty tabs', () => {
    const { container } = render(<EditorTabs tabs={[]} activeTab={null} onSelectTab={vi.fn()} onCloseTab={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });
});
