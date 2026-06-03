import { useMemo, useState } from 'react';
import type { WorkspaceEntry } from '../../infrastructure/workspace';

export interface QuickOpenResult {
  name: string;
  path: string;
}

function flattenFiles(entries: WorkspaceEntry[]): QuickOpenResult[] {
  const results: QuickOpenResult[] = [];
  function walk(items: WorkspaceEntry[]) {
    for (const entry of items) {
      if (entry.kind === 'file') {
        results.push({ name: entry.name, path: entry.path });
      }
      if (entry.kind === 'directory' && entry.children) {
        walk(entry.children);
      }
    }
  }
  walk(entries);
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  let score = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += qi === 0 ? 10 : 1;
      qi++;
    }
  }
  return qi === q.length ? score : 0;
}

export function useQuickOpen(files: WorkspaceEntry[]) {
  const [quickOpenOpen, setQuickOpenOpen] = useState(false);
  const [quickOpenQuery, setQuickOpenQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allFiles = useMemo(() => flattenFiles(files), [files]);

  const results = useMemo(() => {
    if (!quickOpenQuery.trim()) {
      return allFiles.slice(0, 20);
    }
    const scored = allFiles
      .map((file) => ({ file, score: fuzzyScore(quickOpenQuery, file.name) + fuzzyScore(quickOpenQuery, file.path) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((item) => item.file);
    return scored;
  }, [allFiles, quickOpenQuery]);

  function openQuickOpen() {
    setQuickOpenOpen(true);
    setQuickOpenQuery('');
    setSelectedIndex(0);
  }

  function closeQuickOpen() {
    setQuickOpenOpen(false);
    setQuickOpenQuery('');
  }

  function selectNext() {
    setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
  }

  function selectPrev() {
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  }

  return {
    quickOpenOpen, setQuickOpenOpen,
    quickOpenQuery, setQuickOpenQuery,
    selectedIndex, setSelectedIndex,
    results,
    openQuickOpen, closeQuickOpen, selectNext, selectPrev,
  };
}
