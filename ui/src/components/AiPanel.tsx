import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';
import type { Agent, LLMProviderInfo, ToolAgentCall, ToolAgentResult, PendingQuestion, ModelDetail, VoiceConversationState } from '@/types';
import { CameraPanel } from '@/components/CameraPanel';
import { SPECIALTY_CONFIG } from '@/types';
import { ContextMenu } from '@/components/ui/ContextMenu';
import type { ContextMenuItem } from '@/components/ui/ContextMenu';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
  toolCalls?: ToolAgentCall[];
  toolResults?: ToolAgentResult[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  agentId?: string;
  persisted?: boolean;
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

interface AiPanelProps {
  fullView?: boolean;
}

export function AiPanel({ fullView }: AiPanelProps) {
  const bridge = useJarvis();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = sessionStorage.getItem('jarvis_active_conversations');
    if (saved) {
      try { return JSON.parse(saved) as Conversation[]; } catch {}
    }
    const localSaved = localStorage.getItem('jarvis_conversations');
    if (localSaved) {
      try { return JSON.parse(localSaved) as Conversation[]; } catch {}
    }
    return [];
  });
  const [activeConvId, setActiveConvId] = useState<string>(() => {
    return sessionStorage.getItem('jarvis_active_conv_id') ?? (conversations.length > 0 ? conversations[0].id : crypto.randomUUID());
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [providers, setProviders] = useState<LLMProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('ollama');
  const [availableModels, setAvailableModels] = useState<ModelDetail[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; convId: string; hasSelection: boolean } | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [unattended, setUnattended] = useState(() => localStorage.getItem('jarvis_unattended') === 'true');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamTaskRef = useRef<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceConversationState['status']>('idle');
  const voiceTaskIdRef = useRef<string | null>(null);
  const voiceLoopRef = useRef<boolean>(false);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Persist to sessionStorage on changes
  useEffect(() => {
    sessionStorage.setItem('jarvis_active_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (activeConvId) {
      sessionStorage.setItem('jarvis_active_conv_id', activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        setInput(detail.message);
      }
    };
    window.addEventListener('jarvis:send-to-chat', handler);
    return () => window.removeEventListener('jarvis:send-to-chat', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('jarvis_unattended', String(unattended));
  }, [unattended]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages, loading]);

  // Load agents and ensure a conversation exists
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    bridge.listAgents().then(list => {
      setAgents(list);
      if (!selectedAgentId && list.length > 0) {
        setSelectedAgentId(list[0].id);
      }
    }).catch(() => {});

    bridge.llmGetProviders().then(list => {
      setProviders(list);
      const enabled = list.filter(p => p.enabled);
      if (enabled.length > 0) {
        // Use default provider from bridge, fallback to first enabled
        bridge.llmGetDefaultProvider().then((def: string) => {
          if (def && enabled.some(p => p.provider === def)) {
            setSelectedProvider(def);
          } else {
            setSelectedProvider(enabled[0].provider);
          }
        }).catch(() => setSelectedProvider(enabled[0].provider));
      }
    }).catch(() => {});

    // If no conversations exist, create one
    if (conversations.length === 0) {
      const conv: Conversation = {
        id: crypto.randomUUID(),
        title: 'Nova conversa',
        messages: [{
          role: 'assistant',
          content: 'Olá! Sou o **JARVIS**, seu assistente AI.\n\nComo posso ajudar hoje?',
        }],
      };
      setConversations([conv]);
      setActiveConvId(conv.id);
    }

    // Try to load persisted conversations from backend
    bridge.chatListConversations().then(persisted => {
      if (persisted.length > 0) {
        setConversations(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const newConvs: Conversation[] = [...prev];
          for (const pc of persisted) {
            if (!existingIds.has(pc.id)) {
              newConvs.push({
                id: pc.id,
                title: pc.title,
                messages: [{ role: 'assistant' as const, content: 'Olá! Sou o **JARVIS**.' }],
                agentId: pc.agentId,
                persisted: true,
              });
            } else {
              newConvs.forEach(c => {
                if (c.id === pc.id) c.persisted = true;
              });
            }
          }
          return newConvs;
        });
      }
    }).catch(() => {});
  }, [bridge, initialized, conversations.length, selectedAgentId]);

  const modelsInitialized = useRef(false);

  // Load models when agent or provider changes
  useEffect(() => {
    if (!agents.length) return;
    bridge.listModels().then(ms => {
      const allModels = ms as unknown as ModelDetail[];
      setAvailableModels(allModels);
      const chatModels = allModels.filter(m => m.specialty === 'chat');
      const fallbackModels = chatModels.length > 0 ? chatModels : allModels;
      if (fallbackModels.length === 0) return;
      if (!modelsInitialized.current) {
        const agent = agents.find(a => a.id === selectedAgentId);
        if (agent && fallbackModels.some(m => m.name === agent.model)) {
          setSelectedModel(agent.model);
        } else {
          setSelectedModel(fallbackModels[0].name);
        }
        modelsInitialized.current = true;
      }
    }).catch(() => {});
  }, [selectedAgentId, selectedProvider, agents.length, bridge]);

  const MODEL_SPECIALTY_ICONS: Record<string, string> = {
    chat: '💬', code: '💻', reasoning: '🧠', embedding: '📐', vision: '👁', general: '🤖',
  };

  const updateMessages = useCallback((convId: string, updater: (msgs: Message[]) => Message[]) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: updater(c.messages) } : c
    ));
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      if (voiceMode) {
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            await sendVoiceToBackend(base64);
          };
          reader.readAsDataURL(blob);
        };
        recorder.start();
        setIsRecording(true);
        setVoiceStatus('recording');
        startVAD(stream, recorder);
      } else {
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const result = await bridge.audioTranscribe(base64, 'tiny');
            if (result.success) {
              setInput(prev => (prev ? prev + ' ' : '') + result.text);
            }
          };
          reader.readAsDataURL(blob);
        };
        recorder.start();
        setIsRecording(true);
      }
    } catch (e) {
      setError('Microphone access denied');
    }
  }

  function startVAD(stream: MediaStream, recorder: MediaRecorder) {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let silenceStart = Date.now();

    if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
    vadIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      if (avg < 8) {
        if (Date.now() - silenceStart > 1500) {
          clearInterval(vadIntervalRef.current!);
          vadIntervalRef.current = null;
          audioCtx.close();
          if (recorder.state !== 'inactive') recorder.stop();
        }
      } else {
        silenceStart = Date.now();
      }
    }, 200);
  }

  function stopRecording() {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (voiceMode) setVoiceStatus('idle');
  }

  async function sendVoiceToBackend(audioBase64: string) {
    setIsRecording(false);
    setVoiceStatus('transcribing');
    try {
      const history = activeConv?.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })) || [];
      const result = await bridge.voiceConversationStream(audioBase64, activeConvId, history, selectedAgentId || undefined);
      voiceTaskIdRef.current = result.taskId;
      await pollVoiceStream(result.taskId);
    } catch (e) {
      setVoiceStatus('idle');
      setError(String(e));
      if (voiceLoopRef.current) {
        setTimeout(() => startRecording(), 500);
      }
    }
  }

  async function pollVoiceStream(taskId: string) {
    let lastAudioBase64 = '';
    while (true) {
      const state = await bridge.voiceConversationGetStream(taskId);
      if (state.status === 'transcribing') setVoiceStatus('transcribing');
      else if (state.status === 'thinking') setVoiceStatus('thinking');
      else if (state.status === 'speaking') setVoiceStatus('speaking');

      if (state.text && state.status !== 'idle') {
        setInput(state.text);
      }

      if (state.audioBase64 && state.audioBase64 !== lastAudioBase64) {
        lastAudioBase64 = state.audioBase64;
        try {
          const binary = atob(state.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => {
            URL.revokeObjectURL(url);
            if (voiceLoopRef.current && !state.error) {
              setVoiceStatus('idle');
              setTimeout(() => startRecording(), 300);
            } else {
              setVoiceStatus('idle');
            }
          };
          audio.play();
        } catch (e) {
          // non-critical
        }
      }

      if (state.done) {
        if (state.error) {
          setError(state.error);
          setVoiceStatus('idle');
        } else if (state.response) {
          // Add LLM response as assistant message
          const assistantMsg: Message = { role: 'assistant', content: state.response };
          updateMessages(activeConvId, msgs => [...msgs, assistantMsg]);
        }
        voiceTaskIdRef.current = null;
        if (!voiceLoopRef.current) {
          setVoiceStatus('idle');
        }
        return;
      }

      await new Promise(r => setTimeout(r, 200));
    }
  }

  function toggleVoiceMode() {
    if (voiceMode) {
      voiceLoopRef.current = false;
      if (isRecording) stopRecording();
      setVoiceMode(false);
      setVoiceStatus('idle');
    } else {
      setVoiceMode(true);
      setVoiceStatus('idle');
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);

    const userMsg: Message = { role: 'user', content: text };
    updateMessages(activeConvId, msgs => [...msgs, userMsg]);
    setLoading(true);

    updateMessages(activeConvId, msgs => [...msgs, { role: 'assistant', content: '', toolCalls: [], toolResults: [] }]);

    try {
      const history = activeConv?.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })) || [];
      const stream = await bridge.toolAgentExecuteStream(text, activeConvId, history, selectedAgentId || undefined, unattended, selectedProvider, selectedModel);
      streamTaskRef.current = stream.taskId;

      let pendingQuestionResult: PendingQuestion | null = null;
      const startTime = Date.now();
      const POLL_TIMEOUT = 180_000;

      // Poll for stream state
      while (true) {
        if (Date.now() - startTime > POLL_TIMEOUT) {
          bridge.cancelGeneration();
          setError('Tempo limite excedido (3 min). A resposta foi interrompida.');
          break;
        }

        const state = await bridge.toolAgentGetStream(stream.taskId);

        // Update the placeholder message
        updateMessages(activeConvId, msgs =>
          msgs.map((m, i) =>
            i === msgs.length - 1 && m.role === 'assistant'
              ? {
                  ...m,
                  content: state.content,
                  toolCalls: state.toolCalls || [],
                  toolResults: state.toolResults || [],
                }
              : m
          )
        );

        if (state.audioBase64) {
          try {
            const binary = atob(state.audioBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            new Audio(url).play();
          } catch (e) {
            // audio playback failed, non-critical
          }
        }

        if (state.pendingQuestion) {
          pendingQuestionResult = state.pendingQuestion;
        }

        if (state.done || state.cancelled) {
          if (state.error) setError(state.error);
          break;
        }

        await new Promise(r => setTimeout(r, 100));
      }

      if (pendingQuestionResult) {
        setPendingQuestion(pendingQuestionResult);
        return;
      }

      setLoading(false);

      // Auto-title & persist
      if (activeConv && activeConv.messages.length <= 2) {
        bridge.chatAutoTitle(activeConvId, text).catch(() => {});
        setConversations(prev => prev.map(c =>
          c.id === activeConvId ? { ...c, title: text.length > 60 ? text.slice(0, 60) + '...' : text } : c
        ));
      }
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

  async function handleAnswer() {
    if (!pendingQuestion || !answerInput.trim()) return;
    const qId = pendingQuestion.questionId;
    const ans = answerInput.trim();
    setAnswerInput('');
    setPendingQuestion(null);
    setLoading(true);

    updateMessages(activeConvId, msgs => [...msgs, { role: 'user', content: `**Resposta:** ${ans}` }]);

    try {
      updateMessages(activeConvId, msgs => [...msgs, { role: 'assistant', content: '', toolCalls: [], toolResults: [] }]);

      // Send answer to unblock the agent and resume polling the stream
      await bridge.toolAgentAnswer(qId, ans);

      let pendingQuestionResult: PendingQuestion | null = null;
      const taskId = streamTaskRef.current;
      if (taskId) {
        while (true) {
          const state = await bridge.toolAgentGetStream(taskId);

          updateMessages(activeConvId, msgs =>
            msgs.map((m, i) =>
              i === msgs.length - 1 && m.role === 'assistant'
                ? { ...m, content: state.content, toolCalls: state.toolCalls || [], toolResults: state.toolResults || [] }
                : m
            )
          );

          if (state.pendingQuestion) {
            pendingQuestionResult = state.pendingQuestion;
          }

          if (state.done || state.cancelled) {
            if (state.error) setError(state.error);
            break;
          }

          await new Promise(r => setTimeout(r, 100));
        }
      }

      if (pendingQuestionResult) {
        setPendingQuestion(pendingQuestionResult);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      const errMsg: Message = {
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Erro ao processar resposta.',
        error: true,
      };
      updateMessages(activeConvId, msgs => [...msgs, errMsg]);
    }
  }

  function handleCancel() {
    setIsCancelling(true);
    bridge.cancelGeneration();
    setLoading(false);
    setPendingQuestion(null);
    setIsCancelling(false);
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

    if (activeConv && activeConv.messages.length > 1) {
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
        if (!activeConv) return;
        const text = activeConv.messages.map(m =>
          `${m.role === 'user' ? '👤' : '🤖'}: ${m.content}`
        ).join('\n\n---\n\n');
        bridge.copyToClipboard(text);
      },
    });
    items.push({
      id: 'agent-settings', label: 'Configurações do Agente', icon: '⚙️',
      onClick: () => {},
    });

    return items;
  }, [activeConv, bridge, newConversation]);

  const contextMenuItems = contextMenu
    ? getContextMenuItems(contextMenu.convId, contextMenu.hasSelection)
    : [];

  const quickActions = ['📝 Resumir documento', '💻 Explicar código', '🧠 Brainstorm', '🔀 Multi-Agent'];

  function ToolCallMessage({ toolCalls, toolResults }: { toolCalls: ToolAgentCall[]; toolResults: ToolAgentResult[] }) {
    if (!toolCalls || toolCalls.length === 0) return null;
    return (
      <div className="space-y-1 mt-2 mb-2">
        {toolCalls.map((tc, i) => {
          const result = toolResults?.find(r => r.round === tc.round);
          const isPending = !result;
          const isError = result && !result.success;
          return (
            <div
              key={i}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                isPending
                  ? 'bg-blue-950/20 border-blue-900/40 text-blue-400'
                  : isError
                    ? 'bg-red-950/20 border-red-900/40 text-red-400'
                    : 'bg-green-950/20 border-green-900/40 text-green-400'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{isPending ? '⏳' : isError ? '❌' : '✅'}</span>
                <span className="font-semibold">{tc.name}</span>
                <span className="text-[10px] opacity-60">round {tc.round}</span>
              </div>
              <div className="text-[10px] opacity-70 mt-0.5 truncate">
                {JSON.stringify(tc.args).slice(0, 120)}
              </div>
              {result && result.output && (
                <div className="text-[10px] mt-1 opacity-60 line-clamp-3">
                  {result.output.slice(0, 200)}
                </div>
              )}
              {result && tc.name === 'generate_image' && typeof result.data?.base64 === 'string' && (
                <div className="mt-2">
                  <img
                    src={`data:image/png;base64,${result.data.base64}`}
                    alt="Generated"
                    className="max-w-full rounded-lg border border-border"
                    style={{ maxHeight: 300 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <motion.div
      data-context-menu-enabled
      initial={fullView ? false : { width: 0, opacity: 0 }}
      animate={fullView ? {} : { width: 380, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex flex-col bg-card overflow-hidden relative ${fullView ? 'h-full border-r border-border' : 'border-l border-border'}`}
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
          <div className="relative flex-1 min-w-0">
            <select
              value={selectedAgentId ?? ''}
              onChange={(e) => setSelectedAgentId(e.target.value || null)}
              className="w-full appearance-none bg-transparent text-sm font-semibold truncate focus:outline-none cursor-pointer pr-5"
            >
              {agents.length === 0 && <option value="">Carregando...</option>}
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {MODEL_SPECIALTY_ICONS[a.specialty] || '🤖'} {a.name}
                </option>
              ))}
            </select>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">▼</span>
          </div>
          {providers.length > 1 && (
            <div className="relative">
              <select
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  bridge.llmSetDefaultProvider(e.target.value).catch(() => {});
                }}
                className="appearance-none bg-muted/50 text-[11px] text-muted-foreground truncate focus:outline-none cursor-pointer px-2 py-0.5 rounded-md border border-border pr-5"
                title="Provider"
              >
                {providers.filter(p => p.enabled).map(p => (
                  <option key={p.provider} value={p.provider}>{p.provider}</option>
                ))}
              </select>
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground pointer-events-none">▼</span>
            </div>
          )}
          <div className="relative max-w-[140px]">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none bg-muted/50 text-[11px] text-muted-foreground truncate focus:outline-none cursor-pointer px-2 py-0.5 rounded-md border border-border pr-5 max-w-full"
              title="Model"
            >
              {availableModels.length === 0 && <option value="">Nenhum modelo</option>}
              {availableModels.map(m => (
                <option key={m.name} value={m.name}>
                  {(SPECIALTY_CONFIG as any)[m.specialty]?.icon || '🤖'} {m.name.split(':')[0]}
                </option>
              ))}
            </select>
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground pointer-events-none">▼</span>
          </div>
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
          {activeConv && activeConv.messages.map((msg, i) => (
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
                >
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <ToolCallMessage toolCalls={msg.toolCalls} toolResults={msg.toolResults || []} />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && !pendingQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-muted text-foreground rounded-xl rounded-bl-sm px-3.5 py-2.5 text-sm flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                disabled={isCancelling}
                className="ml-2 px-2 py-0.5 rounded-md text-[10px] bg-red-950/30 text-red-400 border border-red-900/40 hover:bg-red-950/50 transition-colors"
              >
                {isCancelling ? 'Cancelando...' : 'Cancelar'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {pendingQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex justify-start"
          >
            <div className="max-w-[90%] space-y-3 w-full">
              {pendingQuestion.toolName && pendingQuestion.toolName !== 'ask_user' ? (
                <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">!</span>
                    <span className="text-sm font-semibold text-amber-400">Permissão Necessária</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className="text-amber-400/60">Ferramenta:</span>
                    <span className="text-amber-200 font-mono">{pendingQuestion.toolName}</span>
                    {(pendingQuestion.question.match(/`([^`]+)`/g) || []).slice(0, 3).map((_, i) => (
                      <span key={i} className="text-amber-400/60 truncate">{i === 0 ? 'Argumentos:' : ''}</span>
                    ))}
                  </div>
                  <p className="text-xs text-amber-300/80">{pendingQuestion.question}</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setAnswerInput('sim'); handleAnswer(); }}
                      className="px-3 py-1.5 rounded-lg bg-green-600/80 text-white text-xs font-medium hover:bg-green-600 transition-colors"
                    >
                      ✓ Permitir
                    </button>
                    <button
                      onClick={() => { setAnswerInput('não'); handleAnswer(); }}
                      className="px-3 py-1.5 rounded-lg bg-destructive/80 text-white text-xs font-medium hover:bg-destructive transition-colors"
                    >
                      ✕ Negar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-950/20 text-amber-400 border border-amber-900/40 rounded-xl rounded-bl-sm px-3.5 py-2.5 text-sm">
                  <div className="font-semibold text-xs mb-1">🤖 O agente precisa de sua resposta:</div>
                  <div className="whitespace-pre-wrap">{pendingQuestion.question}</div>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAnswer()}
                  placeholder="Digite sua resposta..."
                  className="flex-1 px-3 py-2 rounded-xl bg-muted text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAnswer}
                  disabled={!answerInput.trim()}
                  className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  Enviar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />

        {activeConv && activeConv.messages.length === 1 && !loading && (
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

      {/* Camera panel */}
      {showCamera && <CameraPanel onSendToChat={() => setInput('[Imagem capturada - analise esta cena]')} />}

      {/* Input */}
      <div className="p-3 border-t border-border">
        {error && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-900/40 text-xs text-red-400">
            {error}
          </div>
        )}
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unattended}
              onChange={(e) => setUnattended(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
            />
            <span className={`text-[10px] font-medium uppercase tracking-wider ${unattended ? 'text-amber-400' : 'text-muted-foreground'}`}>
              {unattended ? '🔓 Não Assistido' : '🔒 Assistido'}
            </span>
          </label>
          {unattended && (
            <span className="text-[9px] text-amber-500/60 italic">agente tem permissão total</span>
          )}
          <span className="flex-1" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleVoiceMode}
            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
              voiceMode ? 'bg-primary/20 text-primary border border-primary/40' : 'text-muted-foreground hover:bg-accent'
            }`}
            title={voiceMode ? 'Desativar modo voz' : 'Ativar modo voz'}
          >
            🎤
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCamera(!showCamera)}
            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
              showCamera ? 'bg-primary/20 text-primary border border-primary/40' : 'text-muted-foreground hover:bg-accent'
            }`}
            title={showCamera ? 'Fechar câmera' : 'Abrir câmera'}
          >
            📷
          </motion.button>
        </div>
        {voiceMode && (
          <div className="mb-1.5">
            <div className="flex items-center gap-2 text-xs">
              {voiceStatus === 'idle' && (
                <span className="text-muted-foreground">🎤 Modo voz ativo — clique no microfone para falar</span>
              )}
              {voiceStatus === 'recording' && (
                <span className="text-red-400 animate-pulse">🔴 Ouvindo...</span>
              )}
              {voiceStatus === 'transcribing' && (
                <span className="text-yellow-400">⏳ Transcrevendo...</span>
              )}
              {voiceStatus === 'thinking' && (
                <span className="text-blue-400">🤔 Processando...</span>
              )}
              {voiceStatus === 'speaking' && (
                <span className="text-green-400">🔊 Falando...</span>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={loading ? 'Aguardando resposta...' : voiceMode ? 'Fale algo...' : 'Message JARVIS...'}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading || voiceStatus === 'transcribing' || voiceStatus === 'thinking' || voiceStatus === 'speaking'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium flex-shrink-0 shadow-sm transition-colors ${
              isRecording
                ? 'bg-red-950/30 text-red-400 border border-red-900/40 animate-pulse'
                : voiceStatus === 'transcribing' || voiceStatus === 'thinking'
                  ? 'bg-yellow-950/20 text-yellow-400 border border-yellow-900/40'
                  : voiceStatus === 'speaking'
                    ? 'bg-green-950/20 text-green-400 border border-green-900/40'
                    : 'bg-muted text-muted-foreground border border-border hover:bg-accent'
            }`}
            title={isRecording ? 'Stop recording' : 'Record audio'}
          >
            {isRecording ? '🔴' : voiceStatus === 'speaking' ? '🔊' : '🎤'}
          </motion.button>
          {loading ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              disabled={isCancelling}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium flex-shrink-0 shadow-sm transition-colors bg-red-950/30 text-red-400 border border-red-900/40 hover:bg-red-950/50`}
              title="Cancelar execução"
            >
              ✕
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-medium flex-shrink-0 shadow-sm transition-colors ${
                'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30'
              }`}
            >
              ➤
            </motion.button>
          )}
        </div>
      </div>
      <ContextMenu
        state={contextMenu ? { x: contextMenu.x, y: contextMenu.y, items: contextMenuItems } : null}
        onClose={() => setContextMenu(null)}
      />
    </motion.div>
  );
}
