import {
  FolderOpen,
  FilePlus2,
  FolderPlus,
  Pencil,
  MoveRight,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import type { WorkspaceEntry } from '../../infrastructure/native';
import type { ModalState } from '../types';
import { TreeEntry } from '../TreeEntry';

interface FilesPanelProps {
  workspacePath: string;
  files: WorkspaceEntry[];
  workspaceLoadError: string;
  expandedFolders: Set<string>;
  selectedEntry: WorkspaceEntry | null;
  onChooseWorkspace: () => void;
  onOpenModal: (modal: ModalState) => void;
  onSetSelectedEntry: (entry: WorkspaceEntry | null) => void;
  onRefreshWorkspace: () => void;
  onOpenWorkspaceFile: (file: WorkspaceEntry) => void;
}

export function FilesPanel({
  workspacePath,
  files,
  workspaceLoadError,
  expandedFolders,
  selectedEntry,
  onChooseWorkspace,
  onOpenModal,
  onSetSelectedEntry,
  onRefreshWorkspace,
  onOpenWorkspaceFile,
}: FilesPanelProps) {
  return (
    <div className="panel-list">
      <div className="toolbar">
        <button className="icon-button" onClick={() => void onChooseWorkspace()} title="Abrir pasta" type="button">
          <FolderOpen size={16} />
        </button>
        <button className="icon-button" onClick={() => onOpenModal({ type: 'create-file', title: 'Criar arquivo' })} title="Criar arquivo" type="button">
          <FilePlus2 size={16} />
        </button>
        <button className="icon-button" onClick={() => onOpenModal({ type: 'create-folder', title: 'Criar pasta' })} title="Criar pasta" type="button">
          <FolderPlus size={16} />
        </button>
        <button className="icon-button" disabled={!selectedEntry} onClick={() => selectedEntry && onOpenModal({ type: 'rename', title: 'Renomear', entry: selectedEntry })} title="Renomear" type="button">
          <Pencil size={16} />
        </button>
        <button className="icon-button" disabled={!selectedEntry} onClick={() => selectedEntry && onOpenModal({ type: 'move', title: 'Mover', entry: selectedEntry })} title="Mover" type="button">
          <MoveRight size={16} />
        </button>
        <button className="icon-button danger" disabled={!selectedEntry} onClick={() => selectedEntry && onOpenModal({ type: 'delete', title: 'Remover item', entry: selectedEntry })} title="Remover selecionado" type="button">
          <Trash2 size={16} />
        </button>
        <button className="icon-button" onClick={() => void onRefreshWorkspace()} title="Atualizar" type="button">
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="workspace-path">{workspacePath}</div>
      {workspaceLoadError && <div className="empty-state warning">{workspaceLoadError}</div>}
      {!workspaceLoadError && files.length === 0 && (
        <div className="empty-state">
          Nenhum arquivo encontrado nesta pasta. Use Atualizar ou selecione outra pasta.
        </div>
      )}
      {files.map((file) => (
        <TreeEntry
          entry={file}
          expandedFolders={expandedFolders}
          key={file.path}
          level={0}
          onCreateFile={(entry) => {
            onSetSelectedEntry(entry);
            onOpenModal({ type: 'create-file', title: `Criar arquivo em ${entry.name}` });
          }}
          onCreateFolder={(entry) => {
            onSetSelectedEntry(entry);
            onOpenModal({ type: 'create-folder', title: `Criar pasta em ${entry.name}` });
          }}
          onDelete={(entry) => {
            onSetSelectedEntry(entry);
            onOpenModal({ type: 'delete', title: 'Remover item', entry });
          }}
          onOpen={(entry) => void onOpenWorkspaceFile(entry)}
          onRename={(entry) => {
            onSetSelectedEntry(entry);
            onOpenModal({ type: 'rename', title: 'Renomear', entry });
          }}
          selectedPath={selectedEntry?.path}
        />
      ))}
    </div>
  );
}
