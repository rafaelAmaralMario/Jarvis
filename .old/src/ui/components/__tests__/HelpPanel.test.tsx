import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelpPanel } from '../HelpPanel';

describe('HelpPanel', () => {
  it('should render Ollama instructions', () => {
    render(<HelpPanel providerKind="ollama" onStartSelectedOllamaModel={vi.fn()} />);
    expect(screen.getByText(/Instalar modelos locais com Ollama/i)).toBeInTheDocument();
    expect(screen.getByText(/Documentacao Ollama/i)).toBeInTheDocument();
  });

  it('should render OpenAI instructions', () => {
    render(<HelpPanel providerKind="openai-compatible" onStartSelectedOllamaModel={vi.fn()} />);
    expect(screen.getByText(/Usar OpenAI-compatible/i)).toBeInTheDocument();
  });

  it('should render LM Studio instructions', () => {
    render(<HelpPanel providerKind="mock" onStartSelectedOllamaModel={vi.fn()} />);
    expect(screen.getByText(/LM Studio como servidor local/i)).toBeInTheDocument();
  });

  it('should disable Ollama start button when provider is not ollama', () => {
    render(<HelpPanel providerKind="mock" onStartSelectedOllamaModel={vi.fn()} />);
    expect(screen.getByText(/Iniciar modelo selecionado/i)).toBeDisabled();
  });

  it('should enable Ollama start button when provider is ollama', () => {
    render(<HelpPanel providerKind="ollama" onStartSelectedOllamaModel={vi.fn()} />);
    expect(screen.getByText(/Iniciar modelo selecionado/i)).not.toBeDisabled();
  });
});
