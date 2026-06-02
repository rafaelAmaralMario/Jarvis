import { Sparkles } from 'lucide-react';
import type { ProviderKind } from '../../domain';

interface HelpPanelProps {
  providerKind: ProviderKind;
  onStartSelectedOllamaModel: () => void;
}

export function HelpPanel({ providerKind, onStartSelectedOllamaModel }: HelpPanelProps) {
  return (
    <div className="panel-list help-panel">
      <article className="plugin-card">
        <strong>Instalar modelos locais com Ollama</strong>
        <ol>
          <li>Baixe o instalador oficial do Ollama para o seu sistema.</li>
          <li>No Windows, use o instalador OllamaSetup.exe.</li>
          <li>Abra o terminal e execute um modelo, por exemplo: ollama run llama3.2.</li>
          <li>Em Configuracoes, selecione Provider de IA: Ollama local.</li>
          <li>Confirme o endpoint http://127.0.0.1:11434 e clique em Testar modelo.</li>
        </ol>
        <a className="external-link" href="https://docs.ollama.com/" rel="noreferrer" target="_blank">
          Documentacao Ollama
        </a>
        <a className="external-link" href="https://docs.ollama.com/windows" rel="noreferrer" target="_blank">
          Instalar no Windows
        </a>
        <button
          className="primary-button with-icon"
          disabled={providerKind !== 'ollama'}
          onClick={onStartSelectedOllamaModel}
          type="button"
        >
          <Sparkles size={15} />
          Iniciar modelo selecionado
        </button>
      </article>
      <article className="plugin-card">
        <strong>Usar OpenAI-compatible</strong>
        <ol>
          <li>Crie ou obtenha uma API key do provider escolhido.</li>
          <li>Configure o endpoint em formato OpenAI-compatible.</li>
          <li>Salve a chave em Configuracoes e clique em Testar modelo.</li>
        </ol>
        <a className="external-link" href="https://developers.openai.com/api/docs/quickstart" rel="noreferrer" target="_blank">
          Quickstart OpenAI API
        </a>
        <a className="external-link" href="https://platform.openai.com/docs/api-reference/authentication" rel="noreferrer" target="_blank">
          Autenticacao OpenAI API
        </a>
      </article>
      <article className="plugin-card">
        <strong>LM Studio como servidor local</strong>
        <ol>
          <li>Instale o LM Studio e baixe um modelo pela aba Discover.</li>
          <li>Ative o servidor local OpenAI-compatible.</li>
          <li>No JARVIS, use Provider OpenAI-compatible e informe o endpoint local.</li>
        </ol>
        <a className="external-link" href="https://lmstudio.ai/docs/app" rel="noreferrer" target="_blank">
          Documentacao LM Studio
        </a>
        <a className="external-link" href="https://www.lmstudio.ai/docs/app/offline" rel="noreferrer" target="_blank">
          Rodar offline e servidor local
        </a>
      </article>
      <article className="plugin-card">
        <strong>Agentes e contexto</strong>
        <ol>
          <li>Teste o modelo antes de criar novos agentes.</li>
          <li>Use o agente Cerebro do Projeto para gerar uma nota inicial no vault especifico.</li>
          <li>Use o vault Geral para conhecimento reaproveitavel e o vault do Projeto para decisoes locais.</li>
        </ol>
      </article>
    </div>
  );
}
