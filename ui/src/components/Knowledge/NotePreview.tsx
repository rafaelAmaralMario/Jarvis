import { useMemo } from 'react';
import type { Note } from '@/types';

interface NotePreviewProps {
  note: Note | null;
  onNavigate?: (noteId: string) => void;
}

function renderMarkdown(content: string): string {
  let html = content;

  // Escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // [[wikilinks]] -> styled spans (clickable via parent)
  html = html.replace(/\[\[([^\]]+)\]\]/g, (_m, title) => {
    return `<span class="wikilink" data-title="${escapeHtml(title)}" style="color:var(--primary);cursor:pointer;font-weight:500;border-bottom:1px dashed var(--primary);">${escapeHtml(title)}</span>`;
  });

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;overflow-x:auto;font-size:12px;line-height:1.5;margin:8px 0;"><code>${escapeHtml(code)}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:#1e1e1e;color:#ce9178;padding:1px 5px;border-radius:3px;font-size:0.9em;">$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 style="margin:12px 0 6px;font-size:14px;font-weight:600;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="margin:16px 0 8px;font-size:16px;font-weight:700;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="margin:20px 0 10px;font-size:20px;font-weight:800;">$1</h1>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li style="margin:2px 0;">$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:6px 0;">$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:2px 0;">$1</li>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--primary);padding:4px 12px;margin:8px 0;color:var(--muted-foreground);">$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">');

  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, '</p><p style="margin:8px 0;line-height:1.7;">');

  // Wrap in paragraph if not starting with block element
  if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<pre') && !html.startsWith('<blockquote')) {
    html = '<p style="margin:8px 0;line-height:1.7;">' + html + '</p>';
  }

  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function NotePreview({ note, onNavigate }: NotePreviewProps) {
  const html = useMemo(() => {
    if (!note) return '';
    return renderMarkdown(note.content);
  }, [note?.content]);

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-4xl mb-3">👁</p>
          <p className="text-sm">Select a note to preview</p>
        </div>
      </div>
    );
  }

  function handleClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('wikilink')) {
      const title = target.getAttribute('data-title');
      if (title && onNavigate) {
        // Find by title — bridge will resolve
        onNavigate(title);
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">{note.title}</h2>
        <div className="flex items-center gap-2 mt-1">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
            >
              #{tag}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground/50 ml-auto">
            {note.folder}
          </span>
        </div>
      </div>
      <div
        className="flex-1 overflow-auto p-4 text-sm text-foreground leading-relaxed"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
