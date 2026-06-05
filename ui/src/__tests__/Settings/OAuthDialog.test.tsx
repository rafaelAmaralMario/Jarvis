import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OAuthDialog } from '@/components/Settings/OAuthDialog';

const mockBridge = {
  networkOAuthStart: vi.fn().mockResolvedValue('https://github.com/login/oauth/authorize?client_id=test'),
  networkOAuthComplete: vi.fn().mockResolvedValue('gho_token123'),
  networkClearToken: vi.fn().mockResolvedValue(true),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('OAuthDialog', () => {
  it('renders when open', () => {
    render(<OAuthDialog isOpen />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /conectar github/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(<OAuthDialog isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows token input after starting OAuth', async () => {
    const user = userEvent.setup();
    render(<OAuthDialog isOpen />);
    await user.click(screen.getByRole('button', { name: /conectar github/i }));
    expect(await screen.findByPlaceholderText(/código de autorização/i)).toBeInTheDocument();
  });
});
