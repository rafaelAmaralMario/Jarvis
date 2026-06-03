import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PluginsPanel } from '../PluginsPanel';

describe('PluginsPanel', () => {
  const mockPlugin = {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    capabilities: ['test.read'],
    permissions: ['read-workspace'],
  };

  const defaultProps = {
    visiblePlugins: [] as Array<typeof mockPlugin & { valid?: boolean; source?: string; errors?: string[] }>,
    enabledPlugins: [] as string[],
    onRefreshLocalPlugins: vi.fn(),
    onTogglePlugin: vi.fn(),
  };

  it('should render refresh button', () => {
    render(<PluginsPanel {...defaultProps} />);
    expect(screen.getByText('Recarregar manifestos locais')).toBeInTheDocument();
  });

  it('should render plugin cards', () => {
    render(<PluginsPanel {...defaultProps} visiblePlugins={[mockPlugin]} />);
    expect(screen.getByText('Test Plugin')).toBeInTheDocument();
    expect(screen.getByText('test.read')).toBeInTheDocument();
  });

  it('should show active status for enabled plugins', () => {
    render(<PluginsPanel {...defaultProps} visiblePlugins={[mockPlugin]} enabledPlugins={['test-plugin']} />);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('should show version for disabled plugins', () => {
    render(<PluginsPanel {...defaultProps} visiblePlugins={[mockPlugin]} enabledPlugins={[]} />);
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });

  it('should show source and errors when present', () => {
    render(
      <PluginsPanel
        {...defaultProps}
        visiblePlugins={[{ ...mockPlugin, source: '/local', valid: false, errors: ['Missing manifest'] }]}
      />,
    );
    expect(screen.getByText(/Origem:.*\/local/)).toBeInTheDocument();
    expect(screen.getByText(/Erros:.*Missing manifest/)).toBeInTheDocument();
  });
});
