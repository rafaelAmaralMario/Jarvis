import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentFormDialog } from '@/components/Settings/AgentFormDialog';

describe('AgentFormDialog', () => {
  it('submits with valid data', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <AgentFormDialog
        open
        onClose={onClose}
        onSave={onSave}
        models={['llama3.2:3b', 'codellama:7b']}
        agent={null}
      />
    );

    expect(screen.getByText(/new agent/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('Agent name');
    await user.type(nameInput, 'Test Agent');
    await user.click(screen.getByRole('button', { name: /create agent/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test Agent' })
    );
  });
});
