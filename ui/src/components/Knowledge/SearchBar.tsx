import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SearchResult } from '@/types';
import { useJarvis } from '@/hooks/use-jarvis';

interface SearchBarProps {
  onSelectNote: (id: string) => void;
}

export function SearchBar({ onSelectNote }: SearchBarProps) {
  const bridge = useJarvis();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await bridge.searchNotes(q.trim());
      setResults(res);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [bridge]);

  const handleSelect = (id: string) => {
    setShowResults(false);
    setQuery('');
    setResults([]);
    onSelectNote(id);
  };

  return (
    <div className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            doSearch(e.target.value);
          }}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search notes..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
            searching...
          </span>
        )}
      </div>

      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r.id)}
                className="w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors border-b border-border last:border-b-0"
              >
                <div className="text-sm font-medium text-foreground">{r.title}</div>
                <div
                  className="text-xs text-muted-foreground mt-1 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: r.snippet }}
                />
                <div className="text-[10px] text-muted-foreground/50 mt-1">
                  score: {r.score.toFixed(2)}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
