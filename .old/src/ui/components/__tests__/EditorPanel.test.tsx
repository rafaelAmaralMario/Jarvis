import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditorPanel } from '../EditorPanel';
import { makeMockEditorTab } from '../../hooks/__tests__/test-utils';

vi.mock('@monaco-editor/react', () => ({
  default: ({ language, theme, value }: { language: string; theme: string; value: string }) =>
    <div data-testid="monaco-editor" data-language={language} data-theme={theme}>{value}</div>,
}));

describe('EditorPanel', () => {
  const defaultProps = {
    appName: 'JARVIS',
    appDescription: 'IDE',
    selectedModelName: 'mock-text',
    tabs: [] as Array<{ path: string; name: string; content: string; savedContent: string; language: string }>,
    activeTab: { path: '', name: '', content: '', savedContent: '', language: 'plaintext' },
    settingsTheme: 'dark',
    agentForm: { name: '', intent: '', permissions: ['read-workspace'] },
    modelHealth: 'ok' as const,
    agentCreationActive: false,
    bottomView: 'logs' as const,
    diff: '',
    selectedGitFile: '',
    logs: [] as Array<{ id: string; message: string; status: 'ok' | 'warn' }>,
    auditEvents: [] as Array<{ id: string; timestamp: string; actor: string; permission: string; target: string; result: string }>,
    proposalAccepted: false,
    onSetActiveTabPath: vi.fn(),
    onCloseTab: vi.fn(),
    onSaveActiveFile: vi.fn(),
    onUpdateActiveTab: vi.fn(),
    onSetAgentForm: vi.fn(),
    onCreateCustomAgent: vi.fn(),
    onOpenPalette: vi.fn(),
    onBottomViewChange: vi.fn(),
    onAcceptProposal: vi.fn(),
  };

  it('should render top bar with app name', () => {
    render(<EditorPanel {...defaultProps} />);
    expect(screen.getByText('JARVIS')).toBeInTheDocument();
  });

  it('should render model badge', () => {
    render(<EditorPanel {...defaultProps} />);
    expect(screen.getByText('mock-text')).toBeInTheDocument();
  });

  it('should render Monaco editor for normal tabs', () => {
    const tab = makeMockEditorTab();
    render(<EditorPanel {...defaultProps} tabs={[tab]} activeTab={tab} />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('should render agent designer for agent tab', () => {
    const agentTab = makeMockEditorTab({ path: 'jarvis://new-agent', name: 'new-agent' });
    render(<EditorPanel {...defaultProps} tabs={[agentTab]} activeTab={agentTab} />);
    expect(screen.getByText('Novo agente')).toBeInTheDocument();
  });

  it('should render editor tabs', () => {
    const tab1 = makeMockEditorTab({ path: '/file1.ts', name: 'file1.ts' });
    const tab2 = makeMockEditorTab({ path: '/file2.ts', name: 'file2.ts' });
    render(<EditorPanel {...defaultProps} tabs={[tab1, tab2]} activeTab={tab1} />);
    expect(screen.getByText('file1.ts')).toBeInTheDocument();
    expect(screen.getByText('file2.ts')).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    const tab = makeMockEditorTab({ path: '/active.ts', name: 'active.ts' });
    render(<EditorPanel {...defaultProps} tabs={[tab]} activeTab={tab} />);
    const tabButton = screen.getByText('active.ts').closest('button');
    expect(tabButton?.classList.contains('active')).toBe(true);
  });

  it('should render BottomPanel', () => {
    render(<EditorPanel {...defaultProps} />);
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });
});
