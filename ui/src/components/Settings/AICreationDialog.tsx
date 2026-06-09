import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';

interface AICreationDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'agent' | 'workflow';
  onCreated: (result: Record<string, unknown>) => void;
}

export function AICreationDialog({ open, onClose, type, onCreated }: AICreationDialogProps) {
  const bridge = useJarvis();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = type === 'agent'
        ? await bridge.aiGenerateAgent(prompt.trim())
        : await bridge.aiGenerateWorkflow(prompt.trim());
      if (result.error) {
        setError(String(result.error));
      } else {
        onCreated(result);
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setPrompt('');
    setError(null);
    setLoading(false);
    onClose();
  }

  const labels = type === 'agent'
    ? { title: 'Criar Agente com IA', placeholder: 'Descreva o agente que deseja criar...\n\nEx: "Crie um agente especializado em revisão de código que usa o modelo llama3.2 e tem ferramentas de análise de código"', button: 'Criar Agente' }
    : { title: 'Criar Workflow com IA', placeholder: 'Descreva o workflow que deseja criar...\n\nEx: "Crie um workflow que toda manhã faz uma busca no web sobre IA e salva os resultados em um arquivo"', button: 'Criar Workflow' };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{labels.title}</h3>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">✕</button>
            </div>

            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={labels.placeholder}
              rows={6}
              className="w-full rounded-xl border border-border bg-muted/50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60"
            />

            {error && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-red-950/20 border border-red-900/40 text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreate}
                disabled={loading || !prompt.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? 'Gerando...' : labels.button}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
