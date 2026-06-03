import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Note, FolderEntry } from '@/types';
import { useJarvis } from '@/hooks/use-jarvis';
import { SearchBar } from './SearchBar';
import { NoteEditor } from './NoteEditor';
import { NotePreview } from './NotePreview';
import { BacklinkPanel } from './BacklinkPanel';
import { GraphView } from './GraphView';

type ViewMode = 'editor' | 'preview' | 'graph';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export function KnowledgePanel() {
  const bridge = useJarvis();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [currentFolder, setCurrentFolder] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadNotes = useCallback(async (folder?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [noteList, folderList] = await Promise.all([
        bridge.listNotes(folder),
        bridge.getFolders(),
      ]);
      setNotes(noteList);
      setFolders(folderList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  async function handleSelectNote(note: Note) {
    setSelectedNote(note);
    setViewMode('editor');
  }

  async function handleSelectNoteById(id: string) {
    try {
      const note = await bridge.getNote(id);
      if (note) setSelectedNote(note);
    } catch {
      // If it's a title, try to find it
      setSelectedNote(null);
    }
  }

  function handleSelectFolder(path: string) {
    setCurrentFolder(path);
    loadNotes(path);
    setSelectedNote(null);
  }

  async function handleSaveContent(content: string) {
    if (!selectedNote) return;
    try {
      const updated = await bridge.updateNote(selectedNote.id, { content });
      setSelectedNote(updated);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleTitleChange(title: string) {
    if (!selectedNote) return;
    try {
      const updated = await bridge.updateNote(selectedNote.id, { title });
      setSelectedNote(updated);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch {
      // Silent fail for auto-save
    }
  }

  async function handleCreateNote() {
    try {
      const note = await bridge.createNote({
        title: 'Untitled',
        content: '',
        folder: currentFolder || '/',
      });
      setSelectedNote(note);
      setNotes((prev) => [note, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDeleteNote(id: string) {
    try {
      await bridge.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleNavigatWikilink(title: string) {
    // Find note by title through search
    try {
      const results = await bridge.searchNotes(title);
      if (results.length > 0) {
        handleSelectNoteById(results[0].id);
      }
    } catch {
      // ignore
    }
  }

  const folderTree = buildFolderTree(folders);

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar: folder tree + note list */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={spring}
            className="border-r border-border bg-card overflow-hidden flex-shrink-0"
          >
            <div className="w-[280px] h-full flex flex-col">
              <div className="p-3 border-b border-border">
                <SearchBar onSelectNote={(id) => handleSelectNoteById(id)} />
              </div>

              <div className="flex-1 overflow-auto">
                {/* Folder tree */}
                <div className="px-2 py-2">
                  <button
                    onClick={() => handleSelectFolder('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentFolder === '' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                    }`}
                  >
                    <span className="mr-2">📂</span> All Notes
                    <span className="ml-2 text-[10px] text-muted-foreground">({notes.length})</span>
                  </button>

                  {folderTree.map((folder) => (
                    <button
                      key={folder.path}
                      onClick={() => handleSelectFolder(folder.path)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ml-3 ${
                        currentFolder === folder.path ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                      }`}
                    >
                      <span className="mr-2">📁</span> {folder.name}
                      <span className="ml-2 text-[10px] text-muted-foreground">({folder.noteCount})</span>
                    </button>
                  ))}
                </div>

                {/* Note list */}
                <div className="border-t border-border px-2 pt-2">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                    Notes
                  </div>
                  {loading ? (
                    <div className="px-3 py-4 text-xs text-muted-foreground animate-pulse">Loading...</div>
                  ) : notes.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-muted-foreground">
                      {currentFolder ? 'No notes in this folder.' : 'No notes yet. Create one!'}
                    </div>
                  ) : (
                    notes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => handleSelectNote(note)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group ${
                          selectedNote?.id === note.id
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">📄</span>
                          <span className="flex-1 truncate font-medium">{note.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-[10px] text-muted-foreground/50 ml-5 truncate">
                          {note.folder} · {new Date(note.updatedAt).toLocaleDateString()}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="p-3 border-t border-border">
                <button
                  onClick={handleCreateNote}
                  className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  + New Note
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>

          <div className="flex gap-1 ml-2">
            {(['editor', 'preview', 'graph'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'editor' ? '✏️ Edit' : mode === 'preview' ? '👁 Preview' : '🕸 Graph'}
              </button>
            ))}
          </div>

          {error && (
            <div className="ml-auto px-3 py-1 rounded bg-red-950/20 border border-red-900/40 text-[10px] text-red-400">
              {error}
              <button onClick={() => setError(null)} className="ml-2 hover:text-red-300">✕</button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {viewMode === 'editor' && (
              <NoteEditor
                note={selectedNote}
                onSave={handleSaveContent}
                onTitleChange={handleTitleChange}
              />
            )}
            {viewMode === 'preview' && (
              <NotePreview
                note={selectedNote}
                onNavigate={handleNavigatWikilink}
              />
            )}
            {viewMode === 'graph' && (
              <div className="p-4 h-full">
                <GraphView onSelectNode={(id) => handleSelectNoteById(id)} />
              </div>
            )}
          </div>

          {/* Backlink panel */}
          {selectedNote && viewMode !== 'graph' && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              className="border-l border-border bg-card p-3 overflow-auto flex-shrink-0"
            >
              <BacklinkPanel noteId={selectedNote.id} />
            </motion.aside>
          )}
        </div>
      </div>
    </div>
  );
}

function buildFolderTree(folders: FolderEntry[]): FolderEntry[] {
  // Sort by path
  return [...folders].sort((a, b) => a.path.localeCompare(b.path));
}
