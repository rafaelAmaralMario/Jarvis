import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from '@/components/Knowledge/NoteEditor';

describe('NoteEditor', () => {
  const note = { id: 'n1', title: 'My Note', content: 'Hello world', folder: '/', tags: [], createdAt: '2024-01-01', updatedAt: '2024-01-01' };

  it('renders note content', () => {
    render(<NoteEditor note={note} onSave={vi.fn()} onTitleChange={vi.fn()} />);
    expect(screen.getByDisplayValue('My Note')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hello world')).toBeInTheDocument();
  });

  it('renders empty state when no note', () => {
    render(<NoteEditor note={null} onSave={vi.fn()} onTitleChange={vi.fn()} />);
    expect(screen.getByText(/select a note/i)).toBeInTheDocument();
  });

  it('shows save button after editing', async () => {
    const user = userEvent.setup();
    render(<NoteEditor note={note} onSave={vi.fn()} onTitleChange={vi.fn()} />);
    const textarea = screen.getByDisplayValue('Hello world');
    await user.type(textarea, ' updated');
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});
