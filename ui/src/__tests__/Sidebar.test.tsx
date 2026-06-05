import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';

const mockBridge = {
  searchNotes: vi.fn().mockResolvedValue([]),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('Sidebar', () => {
  it('renders knowledge title when activeView is knowledge', () => {
    render(<Sidebar activeView="knowledge" isOpen />);
    expect(screen.getByText('Conhecimento')).toBeInTheDocument();
  });

  it('renders IDE title when activeView is ide', () => {
    render(<Sidebar activeView="ide" isOpen />);
    expect(screen.getByText('IDE')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    const { container } = render(<Sidebar activeView="knowledge" isOpen={false} />);
    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();
  });
});
