import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';
import type { Agent } from '@/types';
import { ContextMenu } from '@/components/ui/ContextMenu';
import type { ContextMenuItem } from '@/components/ui/ContextMenu';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  agentId?: string;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 25 };

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        const lang = codeLang || 'text';
        result.push(`<pre class="bg-muted p-3 rounded-lg overflow-x-auto my-2 text-xs font-mono"><code class="language-${lang}">${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        inCodeBlock = false;
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    let processed = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs">$1</code>');
    if (/^### (.*$)/.test(processed)) {
      processed = processed.replace(/^### (.*$)/, '<h3 class="text-sm font-bold mt-3 mb-1">$1</h3>');
    } else if (/^## (.*$)/.test(processed)) {
      processed = processed.replace(/^## (.*$)/, '<h2 class="text-base font-bold mt-4 mb-1">$1</h2>');
    } else if (/^# (.*$)/.test(processed)) {
      processed = processed.replace(/^# (.*$)/, '<h1 class="text-lg font-bold mt-4 mb-2">$1</h1>');
    } else if (/^- (.*$)/.test(processed)) {
      processed = processed.replace(/^- (.*$)/, '<li class="ml-4 list-disc text-sm">$1</li>');
    } else if (/^\d+\. (.*$)/.test(processed)) {
      processed = processed.replace(/^(\d+\. .*$)/, '<li class="ml-4 list-decimal text-sm">$1</li>');
    } else if (/^> (.*$)/.test(processed)) {
      processed = processed.replace(/^> (.*$)/, '<blockquote class="border-l-2 border-primary/30 pl-3 italic text-muted-foreground my-1">$1</blockquote>');
    }
    result.push(processed || '<br/>');
  }
  return result.join('\n');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function AiPanel() {
  const bridge = useJarvis();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([{
    id: crypto.randomUUID(),
    title: 'Nova conversa',
    messages: [{
      role: 'assistant',
      content: 'Olá! Sou o **JARVIS**, seu assistente AI.\n\nComo posso ajudar hoje?',
    }],
  }]);
  const [activeConvId, setActiveConvId] = useState<string>(conversations[0].id);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; convId: string; hasSelection: boolean } | null>(null);

  const activeConv = conversations.find(c => c.id === activeConvId) ?? conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv.messages, loading]);

  useEffect(() => {
    bridge.listAgents().then(list => {
      setAgents(list);
      if (!selectedAgentId && list.length > 0) {
        setSelectedAgentId(list[0].id);
      }
    }).catch(() => {});
  }, [bridge, selectedAgentId]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const updateMessages = useCallback((convId: string, updater: (msgs: Message[]) => Message[]) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: updater(c.messages) } : c
    ));
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);

    const userMsg: Message = { role: 'user', content: text };
    updateMessages(activeConvId, msgs => [...msgs, userMsg]);

    setLoading(true);
    try {
      const timeout = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: backend não respondeu em 120s')), 120_000)
      );
      const response = await Promise.race([bridge.sendMessage(text), timeout]);
      setLoading(false);
      const isError = typeof response === 'string' && response.startsWith('**Erro:**');
      const assistantMsg: Message = {
        role: 'assistant',
        content: response,
        error: isError,
      };
      updateMessages(activeConvId, msgs => [...msgs, assistantMsg]);
    } catch (err) {
      setLoading(false);
      const errMsg: Message = {
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Erro ao comunicar com o backend.',
        error: true,
      };
      updateMessages(activeConvId, msgs => [...msgs, errMsg]);
    }
  }

  function newConversation() {
    const conv: Conversation = {
      id: crypto.randomUUID(),
      title: 'Nova conversa',
      messages: [{
        role: 'assistant',
        content: 'Olá! Sou o **JARVIS**, seu assistente AI.\n\nComo posso ajudar hoje?',
      }],
      agentId: selectedAgentId ?? undefined,
    };
    setConversations(prev => [...prev, conv]);
    setActiveConvId(conv.id);
    setShowHistory(false);
  }

  function switchConversation(id: string) {
    setActiveConvId(id);
    setShowHistory(false);
  }

  const getContextMenuItems = useCallback((convId: string, hasSelection: boolean): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];

    items.push({
      id: 'new-chat', label: 'Novo Chat', icon: '✚',
      onClick: newConversation,
    });
    items.push({
      id: 'clear-chat', label: 'Limpar Conversa', icon: '🗑️', danger: true,
      onClick: () => {
        setConversations(prev => prev.map(c =>
          c.id === convId ? { ...c, messages: [{
            role: 'assistant' as const,
            content: 'Olá! Sou o **JARVIS**, seu assistente AI.\n\nComo posso ajudar hoje?',
          }] } : c
        ));
      },
    });
    items.push({ id: 'div1', label: '', divider: true, onClick: () => {} });

    if (activeConv.messages.length > 1) {
      items.push({
        id: 'copy-last', label: 'Copiar Última Resposta', icon: '📋',
        onClick: () => {
          const lastAssistant = [...activeConv.messages].reverse().find(m => m.role === 'assistant' && !m.error);
          if (lastAssistant) bridge.copyToClipboard(lastAssistant.content);
        },
      });
    }
    if (hasSelection) {
      items.push({
        id: 'copy-selection', label: 'Copiar Seleção', icon: '📋',
        onClick: () => {
          const sel = window.getSelection()?.toString();
          if (sel) bridge.copyToClipboard(sel);
        },
      });
    }
    items.push({ id: 'div2', label: '', divider: true, onClick: () => {} });
    items.push({
      id: 'export-chat', label: 'Exportar Conversa', icon: '📤',
      onClick: () => {
        const text = activeConv.messages.map(m =>
          `${m.role === 'user' ? '👤' : '🤖'}: ${m.content}`
        ).join('\n\n---\n\n');
        bridge.copyToClipboard(text);
      },
    });
    items.push({
      id: 'agent-settings', label: 'Configurações do Agente', icon: '⚙️',
      onClick: () => {
        // Navigate to settings -> agents tab (handled via view change)
      },
    });

    return items;
  }, [activeConv, bridge, newConversation]);

  const contextMenuItems = contextMenu
    ? getContextMenuItems(contextMenu.convId, contextMenu.hasSelection)
    : [];

  const quickActions = ['📝 Resumir documento', '💻 Explicar código', '🧠 Brainstorm', '🔀 Multi-Agent'];

  return (
    <motion.aside
      data-context-menu-enabled
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 380, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col bg-card border-l border-border overflow-hidden relative"
      onContextMenu={(e) => {
        const sel = window.getSelection();
        const hasSelection = sel && sel.toString().trim().length > 0;
        setContextMenu({ x: e.clientX, y: e.clientY, convId: activeConvId, hasSelection: !!hasSelection });
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            title="Histórico de conversas"
          >
            ☰
          </motion.button>
          <select
            value={selectedAgentId ?? ''}
            onChange={(e) => setSelectedAgentId(e.target.value || null)}
            className="flex-1 bg-transparent text-sm font-semibold truncate focus:outline-none cursor-pointer"
          >
            {agents.length === 0 && <option value="">Carregando...</option>}
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={newConversation}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            title="Nova conversa"
          >
            ✚
          </motion.button>
        </div>
        <div className="flex items-center gap-2 text-[10px] flex-shrink-0">
          {selectedAgent && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/60 animate-pulse" />
              {selectedAgent.model.split(':')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Conversation history sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={spring}
            className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-10 shadow-2xl"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversas</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowHistory(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </motion.button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-44px)] p-2 space-y-1">
              {[...conversations].reverse().map(c => (
                <button
                  key={c.id}
                  onClick={() => switchConversation(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    c.id === activeConvId
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  <div className="font-medium truncate">{c.title}</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {c.messages.length} mensagens
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {activeConv.messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...spring, delay: i * 0.03 }}
              className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div className="max-w-[90%] space-y-2">
                <div
                  className={`px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : msg.error
                        ? 'bg-red-950/20 text-red-400 border border-red-900/40 rounded-bl-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-muted text-foreground rounded-xl rounded-bl-sm px-3.5 py-2.5 text-sm">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Pensando
              </motion.span>
              <span className="inline-flex ml-1">
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>.</motion.span>
              </span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />

        {activeConv.messages.length === 1 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...spring }}
            className="flex gap-2 flex-wrap justify-center mt-4"
          >
            {quickActions.map((text) => (
              <motion.button
                key={text}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setInput(text.replace(/^[^\s]+\s/, ''))}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                {text}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        {error && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-900/40 text-xs text-red-400">
            {error}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={loading ? 'Aguardando resposta...' : 'Message JARVIS...'}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50"
            />
          </div>
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            onClick={loading ? () => {} : handleSend}
            disabled={loading || !input.trim()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-medium flex-shrink-0 shadow-sm transition-colors ${
              loading
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30'
            }`}
          >
            {loading ? '⏳' : '➤'}
          </motion.button>
        </div>
      </div>
      <ContextMenu
        state={contextMenu ? { x: contextMenu.x, y: contextMenu.y, items: contextMenuItems } : null}
        onClose={() => setContextMenu(null)}
      />
    </motion.aside>
  );
}
