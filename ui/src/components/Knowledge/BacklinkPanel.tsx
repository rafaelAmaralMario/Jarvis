import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Backlink } from '@/types';
import { useJarvis } from '@/hooks/use-jarvis';

interface BacklinkPanelProps {
  noteId: string | null;
}

export function BacklinkPanel({ noteId }: BacklinkPanelProps) {
  const bridge = useJarvis();
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!noteId) {
      setBacklinks([]);
      return;
    }
    setLoading(true);
    bridge.getBacklinks(noteId)
      .then(setBacklinks)
      .catch(() => setBacklinks([]))
      .finally(() => setLoading(false));
  }, [bridge, noteId]);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <span>🔗</span> Backlinks
        <span className="text-[10px] font-normal text-muted-foreground/50">
          ({backlinks.length})
        </span>
      </h3>

      {loading && (
        <div className="text-[11px] text-muted-foreground animate-pulse px-2">
          Loading...
        </div>
      )}

      {!loading && backlinks.length === 0 && (
        <p className="text-[11px] text-muted-foreground/50 px-2">
          {noteId ? 'No notes link to this one yet.' : 'Select a note to see backlinks.'}
        </p>
      )}

      <div className="space-y-1">
        <AnimatePresence>
          {backlinks.map((bl) => (
            <motion.div
              key={bl.noteId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="px-3 py-2 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
            >
              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {bl.title}
              </div>
              {bl.context && (
                <div className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-2 leading-relaxed">
                  ...{bl.context}...
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
