import { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownPreviewProps {
  content: string;
  visible: boolean;
}

export function MarkdownPreview({ content, visible }: MarkdownPreviewProps) {
  const html = useMemo(() => {
    try {
      return marked.parse(content, { async: false }) as string;
    } catch {
      return '<p>Erro ao renderizar markdown</p>';
    }
  }, [content]);

  if (!visible) return null;

  return (
    <div className="h-full overflow-y-auto bg-background" data-markdown-preview>
      <div
        className="max-w-[800px] mx-auto px-6 py-4 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
