import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GraphView } from '@/components/Knowledge/GraphView';

const mockBridge = {
  getGraph: vi.fn().mockResolvedValue({
    nodes: [{ id: 'n1', label: 'Node 1', folder: '/', tags: [], linkCount: 0 }],
    edges: [{ source: 'n1', target: 'n2' }],
  }),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('GraphView', () => {
  it('renders canvas after graph loads', async () => {
    const { container } = render(<GraphView onSelectNode={vi.fn()} />);
    await screen.findByText(/node/i);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
