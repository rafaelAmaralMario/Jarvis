import { File, FilePlus2, Folder, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import type { WorkspaceEntry } from '../infrastructure/native';

export function TreeEntry({
  entry,
  expandedFolders,
  level,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onOpen,
  onRename,
  selectedPath,
}: {
  entry: WorkspaceEntry;
  expandedFolders: Set<string>;
  level: number;
  onCreateFile: (entry: WorkspaceEntry) => void;
  onCreateFolder: (entry: WorkspaceEntry) => void;
  onDelete: (entry: WorkspaceEntry) => void;
  onOpen: (entry: WorkspaceEntry) => void;
  onRename: (entry: WorkspaceEntry) => void;
  selectedPath?: string;
}) {
  const expanded = expandedFolders.has(entry.path);
  const selected = selectedPath === entry.path;
  return (
    <>
      <div
        className={selected ? 'list-row button-row selected' : 'list-row button-row'}
        onClick={() => onOpen(entry)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(entry);
          }
        }}
        role="button"
        style={{ paddingLeft: `${8 + level * 14}px` }}
        tabIndex={0}
      >
        {entry.kind === 'directory' ? <Folder size={15} /> : <File size={15} />}
        {entry.kind === 'directory' && <span className="tree-caret">{expanded ? '-' : '+'}</span>}
        <span className="tree-label" title={entry.path}>{entry.name}</span>
        <span
          className="tree-actions"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {entry.kind === 'directory' && (
            <>
              <button className="tree-action-button" onClick={() => onCreateFile(entry)} title="Novo arquivo" type="button">
                <FilePlus2 size={13} />
              </button>
              <button className="tree-action-button" onClick={() => onCreateFolder(entry)} title="Nova pasta" type="button">
                <FolderPlus size={13} />
              </button>
            </>
          )}
          <button className="tree-action-button" onClick={() => onRename(entry)} title="Renomear" type="button">
            <Pencil size={13} />
          </button>
          <button className="tree-action-button danger" onClick={() => onDelete(entry)} title="Remover" type="button">
            <Trash2 size={13} />
          </button>
        </span>
      </div>
      {entry.kind === 'directory' &&
        expanded &&
        entry.children.map((child) => (
          <TreeEntry
            entry={child}
            expandedFolders={expandedFolders}
            key={child.path}
            level={level + 1}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
            onDelete={onDelete}
            onOpen={onOpen}
            onRename={onRename}
            selectedPath={selectedPath}
          />
        ))}
    </>
  );
}
