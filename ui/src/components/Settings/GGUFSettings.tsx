import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';
import type { GGUFModelInfo, GGUFModelCatalog } from '@/types';

export function GGUFSettings() {
  const bridge = useJarvis();
  const [models, setModels] = useState<GGUFModelInfo[]>([]);
  const [catalog, setCatalog] = useState<GGUFModelCatalog[]>([]);
  const [diskUsage, setDiskUsage] = useState<{ totalBytes: number; count: number; modelsDir: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [repoId, setRepoId] = useState('');
  const [filename, setFilename] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // HF Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ modelId: string; pipelineTag: string; downloads: number; likes: number; description: string }[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [m, c, d] = await Promise.all([
        bridge.ggufList(),
        bridge.ggufCatalog(),
        bridge.ggufDiskUsage(),
      ]);
      setModels(m);
      setCatalog(c);
      setDiskUsage(d);
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  }

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    try {
      const results = await bridge.hfSearchModels(q);
      setSearchResults(results);
    } catch (e) {
      setError(String(e));
    }
    setSearching(false);
  }

  function selectFromSearch(modelId: string) {
    setRepoId(modelId);
    setFilename('');
  }

  async function handleDownload() {
    if (!repoId || !filename) return;
    setDownloading(true);
    setError(null);
    try {
      const result = await bridge.ggufDownload(repoId.trim(), filename.trim());
      if (!result.success) {
        setError(result.error || 'Download failed');
      }
      await loadAll();
      setRepoId('');
      setFilename('');
    } catch (e) {
      setError(String(e));
    }
    setDownloading(false);
  }

  async function handleDelete(name: string) {
    await bridge.ggufDelete(name);
    await loadAll();
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading GGUF models...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">GGUF Models</h2>
          <p className="text-sm text-muted-foreground">
            Download and manage local GGUF models for the Native provider
          </p>
        </div>
        <button onClick={loadAll} className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent transition-colors">
          Refresh
        </button>
      </div>

      {diskUsage && (
        <div className="text-xs text-muted-foreground">
          {diskUsage.count} model{diskUsage.count !== 1 ? 's' : ''} · {formatBytes(diskUsage.totalBytes)} total
          <br />
          Directory: <code className="px-1 py-0.5 rounded bg-muted">{diskUsage.modelsDir}</code>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg text-xs bg-red-950/20 text-red-400 border border-red-900/40">
          {error}
        </div>
      )}

      {/* HuggingFace Search */}
      <div className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-2">
        <h3 className="text-sm font-semibold">Buscar modelos no HuggingFace</h3>
        <div className="flex gap-2">
          <input
            placeholder="Search GGUF models (e.g. qwen, llama, mistral)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-1 max-h-48 overflow-y-auto mt-2">
            {searchResults.map(r => (
              <button
                key={r.modelId}
                onClick={() => selectFromSearch(r.modelId)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/30 transition-colors border border-border/30"
              >
                <div className="text-xs font-medium">{r.modelId}</div>
                <div className="text-[10px] text-muted-foreground flex gap-2">
                  {r.pipelineTag && <span>{r.pipelineTag}</span>}
                  <span>⬇ {r.downloads.toLocaleString()}</span>
                  <span>❤️ {r.likes}</span>
                </div>
                {r.description && <div className="text-[10px] text-muted-foreground/60 truncate">{r.description}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Download form */}
      <div className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-2">
        <h3 className="text-sm font-semibold">Download Model</h3>
        <input
          placeholder="Hugging Face Repo ID (e.g. Qwen/Qwen2.5-1.5B-Instruct-GGUF)"
          value={repoId}
          onChange={e => setRepoId(e.target.value)}
          className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          placeholder="Filename (e.g. qwen2.5-1.5b-instruct-q4_k_m.gguf)"
          value={filename}
          onChange={e => setFilename(e.target.value)}
          className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={handleDownload}
          disabled={downloading || !repoId || !filename}
          className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {downloading ? 'Downloading...' : 'Download'}
        </button>
      </div>

      {/* Downloaded models */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Downloaded Models</h3>
        {models.length === 0 && (
          <p className="text-xs text-muted-foreground">No models downloaded yet.</p>
        )}
        <div className="grid gap-2">
          {models.map(m => (
            <motion.div key={m.name} layout className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div>
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">{formatBytes(m.sizeBytes)}</div>
              </div>
              <button
                onClick={() => handleDelete(m.name)}
                className="px-2 py-1 text-xs rounded-md border border-border hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/40"
              >
                Delete
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Catalog */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Recommended Models</h3>
        <div className="grid gap-2">
          {catalog.map(m => (
            <motion.div
              key={m.filename}
              layout
              className="p-3 rounded-lg border border-border bg-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.description}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {m.repoId} / {m.filename} · {m.size}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRepoId(m.repoId);
                    setFilename(m.filename);
                  }}
                  className="px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 ml-3"
                >
                  Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
