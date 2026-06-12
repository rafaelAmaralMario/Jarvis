import { useState, useEffect } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';

interface PdfPreviewProps {
  path: string;
}

export function PdfPreview({ path }: PdfPreviewProps) {
  const bridge = useJarvis();
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base64 = await bridge.readFile(path);
        if (!cancelled) setDataUri(`data:application/pdf;base64,${base64}`);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [bridge, path]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
        Error loading PDF: {error}
      </div>
    );
  }

  if (!dataUri) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
        Loading PDF...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1 border-b border-border text-[11px] text-muted-foreground bg-card">
        <span className="text-lg">📕</span>
        <span className="truncate">{path.split(/[/\\]/).pop()}</span>
      </div>
      <iframe
        src={dataUri}
        className="flex-1 w-full border-0 bg-white"
        title={path}
      />
    </div>
  );
}
