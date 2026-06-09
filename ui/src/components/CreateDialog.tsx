import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';

type CreateType = 'note' | 'file' | 'folder';

interface CreateDialogProps {
  open: boolean;
  onClose: () => void;
  currentFolder?: string;
  onCreated?: (result: { type: CreateType; name: string }) => void;
}

const typeConfig: Record<CreateType, { label: string; icon: string; description: string; placeholder: string }> = {
  note: { label: 'Nota de Conhecimento', icon: '📝', description: 'Cria uma nova nota no Knowledge Base', placeholder: 'Nome da nota (opcional — deixe vazio para "Untitled")' },
  file: { label: 'Arquivo', icon: '📄', description: 'Cria um novo arquivo no workspace', placeholder: 'ex: src/components/Button.tsx' },
  folder: { label: 'Pasta', icon: '📁', description: 'Cria uma nova pasta no workspace', placeholder: 'ex: src/components' },
};

export function CreateDialog({ open, onClose, currentFolder, onCreated }: CreateDialogProps) {
  const bridge = useJarvis();
  const [type, setType] = useState<CreateType>('note');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      if (type === 'note') {
        const note = await bridge.createNote({
          title: name.trim() || 'Untitled',
          content: '',
          folder: currentFolder || '/',
        });
        onCreated?.({ type: 'note', name: note.title });
      } else if (type === 'file') {
        const fileName = name.trim() || 'untitled.txt';
        if (fileName.includes('/')) {
          await bridge.createFileWithPath(currentFolder ? currentFolder + '/' + fileName : fileName);
        } else {
          await bridge.createFile(fileName, currentFolder || '');
        }
        onCreated?.({ type: 'file', name: fileName });
      } else if (type === 'folder') {
        const folderName = name.trim() || 'new-folder';
        await bridge.createDirectory(folderName, currentFolder || '');
        onCreated?.({ type: 'folder', name: folderName });
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName('');
    setError(null);
    setLoading(false);
    onClose();
  }

  const cfg = typeConfig[type];

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
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Criar Novo</h3>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">✕</button>
            </div>

            <div className="flex gap-2 mb-5">
              {(Object.entries(typeConfig) as [CreateType, typeof cfg][]).map(([key, c]) => (
                <button
                  key={key}
                  onClick={() => { setType(key); setName(''); setError(null); }}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition-all ${
                    type === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30 hover:bg-accent/50 text-muted-foreground'
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-medium">{c.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <div className="mb-1">
              <p className="text-sm font-medium mb-1">{cfg.icon} {cfg.label}</p>
              <p className="text-xs text-muted-foreground mb-3">{cfg.description}</p>
            </div>

            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && name.trim() && handleCreate()}
              placeholder={cfg.placeholder}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60"
              autoFocus
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
                disabled={loading}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? 'Criando...' : `Criar ${cfg.label}`}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
