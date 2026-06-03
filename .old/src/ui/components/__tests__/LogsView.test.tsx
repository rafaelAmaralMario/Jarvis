import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogsView } from '../LogsView';

describe('LogsView', () => {
  it('should render without crashing', () => {
    const { container } = render(<LogsView logs={[]} />);
    expect(container.querySelector('.bottom-content')).toBeInTheDocument();
  });

  it('should render log messages', () => {
    const logs = [
      { id: '1', message: 'File saved', status: 'ok' as const },
      { id: '2', message: 'Error occurred', status: 'warn' as const },
    ];
    render(<LogsView logs={logs} />);
    expect(screen.getByText('File saved')).toBeInTheDocument();
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });
});
