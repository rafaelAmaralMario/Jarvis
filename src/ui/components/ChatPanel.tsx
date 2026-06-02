import { Sparkles } from 'lucide-react';
import type { ChatMessage } from '../../shared/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  chatInput: string;
  generationActive: boolean;
  chatMessagesRef: React.RefObject<HTMLDivElement | null>;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onCancelGeneration: () => void;
}

export function ChatPanel({
  messages,
  chatInput,
  generationActive,
  chatMessagesRef,
  onChatInputChange,
  onSendMessage,
  onCancelGeneration,
}: ChatPanelProps) {
  return (
    <aside className="ai-panel" aria-label="Painel de IA">
      <header className="panel-header">IA</header>
      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.length === 0 && (
          <div className="empty-state">Envie uma mensagem para testar o provider mockado.</div>
        )}
        {messages.map((message, index) => (
          <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
            <strong>{message.role === 'user' ? 'Voce' : 'JARVIS'}</strong>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <textarea
          value={chatInput}
          onChange={(event) => onChatInputChange(event.target.value)}
          placeholder="Peca algo ao JARVIS..."
        />
        <button className="primary-button with-icon" onClick={() => onSendMessage()} type="button">
          <Sparkles size={15} />
          {generationActive ? 'Gerando...' : 'Enviar'}
        </button>
        {generationActive && (
          <button className="text-button" onClick={onCancelGeneration} type="button">
            Cancelar
          </button>
        )}
      </div>
    </aside>
  );
}
