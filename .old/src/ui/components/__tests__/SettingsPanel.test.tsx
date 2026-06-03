import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsPanel } from '../SettingsPanel';
import { mockSettings } from '../../hooks/__tests__/test-utils';

vi.mock('../../../infrastructure/native', () => ({
  selectFolder: vi.fn(),
}));

describe('SettingsPanel', () => {
  const defaultProps = {
    workspacePath: '/workspace',
    settings: mockSettings,
    secureApiKey: '',
    modelHealth: 'unknown' as const,
    modelTestActive: false,
    availableModels: [] as Array<{ id: string; providerId: string; name: string; capabilities: string[]; status: string }>,
    localOllamaModels: [] as string[],
    ollamaModelsError: '',
    onChooseWorkspace: vi.fn(),
    onUpdateProviderKind: vi.fn(),
    onSetSettings: vi.fn(),
    onSetSecureApiKey: vi.fn(),
    onTestSelectedModel: vi.fn(),
    onStartSelectedOllamaModel: vi.fn(),
    onRefreshOllamaModels: vi.fn(),
    onPersistSecureApiKey: vi.fn(),
    onLoadObsidianNotes: vi.fn(),
    onUpdatePermission: vi.fn(),
  };

  it('should render workspace path', () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByDisplayValue('/workspace')).toBeInTheDocument();
  });

  it('should render provider selector', () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText('Mock local')).toBeInTheDocument();
    expect(screen.getByText('Ollama local')).toBeInTheDocument();
    expect(screen.getByText('OpenAI-compatible')).toBeInTheDocument();
  });

  it('should render theme selector', () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText('Escuro')).toBeInTheDocument();
    expect(screen.getByText('Claro')).toBeInTheDocument();
  });

  it('should render model health status', () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText(/nao testado/i)).toBeInTheDocument();
  });

  it('should render Ollama section when provider is ollama', () => {
    render(<SettingsPanel {...defaultProps} settings={{ ...mockSettings, providerKind: 'ollama' }} />);
    expect(screen.getByPlaceholderText('http://127.0.0.1:11434')).toBeInTheDocument();
  });

  it('should render OpenAI section when provider is openai-compatible', () => {
    render(<SettingsPanel {...defaultProps} settings={{ ...mockSettings, providerKind: 'openai-compatible' }} />);
    expect(screen.getByPlaceholderText('https://api.openai.com/v1')).toBeInTheDocument();
  });

  it('should render permissions section', () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText(/Permissoes por workspace/i)).toBeInTheDocument();
  });

  it('should show model testing state', () => {
    render(<SettingsPanel {...defaultProps} modelTestActive={true} />);
    expect(screen.getByText('Testando modelo...')).toBeInTheDocument();
  });
});
