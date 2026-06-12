import { useState, useEffect, useCallback } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';

interface ImagePreviewProps {
  path: string;
}

export function ImagePreview({ path }: ImagePreviewProps) {
  const bridge = useJarvis();
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ext = path.split('.').pop()?.toLowerCase() || 'png';
        const mimeMap: Record<string, string> = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
          bmp: 'image/bmp', ico: 'image/x-icon',
        };
        const mime = mimeMap[ext] || 'image/png';
        const base64 = await bridge.readFile(path);
        if (!cancelled) setDataUri(`data:${mime};base64,${base64}`);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [bridge, path]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.max(0.1, Math.min(5, z - e.deltaY * 0.002)));
    }
  }, []);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
        Error loading image: {error}
      </div>
    );
  }

  if (!dataUri) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
        Loading image...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1 border-b border-border text-[11px] text-muted-foreground bg-card">
        <span className="text-lg">🖼</span>
        <span className="truncate">{path.split(/[/\\]/).pop()}</span>
        <span className="ml-auto flex items-center gap-2">
          <button onClick={() => setZoom(z => z - 0.25)} className="px-1.5 py-0.5 rounded hover:bg-accent/30">−</button>
          <span className="min-w-[3ch] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => z + 0.25)} className="px-1.5 py-0.5 rounded hover:bg-accent/30">+</button>
          <button onClick={() => setZoom(1)} className="px-1.5 py-0.5 rounded hover:bg-accent/30 text-[10px]">Fit</button>
        </span>
      </div>
      <div
        className="flex-1 flex items-center justify-center overflow-auto bg-grid"
        onWheel={handleWheel}
      >
        <img
          src={dataUri}
          alt={path}
          style={{
            transform: `scale(${zoom})`,
            maxWidth: zoom <= 1 ? '100%' : 'none',
            maxHeight: zoom <= 1 ? '100%' : 'none',
          }}
          className="transition-transform duration-100 shadow-lg rounded"
          draggable={false}
        />
      </div>
    </div>
  );
}
