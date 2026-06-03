import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Note } from '@/types';

interface NoteEditorProps {
  note: Note | null;
  onSave: (content: string) => void;
  onTitleChange: (title: string) => void;
}

export function NoteEditor({ note, onSave, onTitleChange }: NoteEditorProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [changed, setChanged] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setTitle(note.title);
      setChanged(false);
    }
  }, [note?.id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  function handleContentChange(value: string) {
    setContent(value);
    setChanged(true);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    onTitleChange(value);
    setChanged(true);
  }

  function handleSave() {
    onSave(content);
    setChanged(false);
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm">Select a note or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="flex-1 text-lg font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30"
          placeholder="Note title..."
        />
        {changed && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            Save
          </motion.button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-full min-h-[300px] p-4 bg-transparent text-sm text-foreground font-mono resize-none border-none outline-none placeholder:text-muted-foreground/30 leading-relaxed"
          placeholder="Start writing in Markdown...

Use [[Wikilinks]] to connect notes.

Supports:
- **bold**, *italic*, `code`
- Lists and numbered lists
- # Headers
- ```code blocks```"
        />
      </div>

      <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500/60" />
          Markdown
        </span>
        <span>|</span>
        <span>{content.length} chars</span>
        <span>|</span>
        <span>{(content.match(/\[\[([^\]]+)\]\]/g) || []).length} wikilinks</span>
        {note.folder !== '/' && (
          <>
            <span>|</span>
            <span>in {note.folder}</span>
          </>
        )}
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground/40">
          {new Date(note.updatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
