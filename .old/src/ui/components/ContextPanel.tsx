import type { ContextResult, MemoryEntry, ContextVaultKind } from '../../shared/types';
import type { MarkdownNote } from '../../infrastructure/native';

interface ContextPanelProps {
  contextQuery: string;
  contextResults: ContextResult[];
  memoryInput: string;
  memoryEntries: MemoryEntry[];
  notes: MarkdownNote[];
  activeVaultPath: string;
  contextVaultKind: ContextVaultKind;
  onContextQueryChange: (value: string) => void;
  onMemoryInputChange: (value: string) => void;
  onRunContextSearch: () => void;
  onAddMemory: () => void;
  onWriteMemoryToObsidian: () => void;
}

export function ContextPanel({
  contextQuery,
  contextResults,
  memoryInput,
  memoryEntries,
  notes,
  activeVaultPath,
  contextVaultKind,
  onContextQueryChange,
  onMemoryInputChange,
  onRunContextSearch,
  onAddMemory,
  onWriteMemoryToObsidian,
}: ContextPanelProps) {
  return (
    <div className="panel-list">
      <div className="workspace-path">
        Destino ativo: {contextVaultKind === 'general' ? 'Geral' : 'Projeto'} | {activeVaultPath || 'nao configurado'}
      </div>
      <label className="context-input">
        Buscar contexto
        <input
          value={contextQuery}
          onChange={(event) => onContextQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onRunContextSearch();
          }}
          placeholder="termo, decisao, arquivo..."
        />
      </label>
      <button className="primary-button" onClick={onRunContextSearch} type="button">
        Buscar memoria
      </button>
      <label className="context-input">
        Nova memoria
        <textarea
          value={memoryInput}
          onChange={(event) => onMemoryInputChange(event.target.value)}
          placeholder="Registre uma decisao, regra ou contexto importante..."
        />
      </label>
      <div className="split-actions">
        <button className="text-button" onClick={onAddMemory} type="button">
          Salvar local
        </button>
        <button className="text-button" onClick={onWriteMemoryToObsidian} type="button">
          Enviar ao Obsidian
        </button>
      </div>
      {contextResults.map((result) => (
        <article className="context-card" key={result.id}>
          <strong>{result.title}</strong>
          <span>{result.source} | score {result.score}</span>
          <p>{result.preview}</p>
        </article>
      ))}
      {memoryEntries.map((entry) => (
        <article className="context-card" key={entry.id}>
          <strong>Memoria local</strong>
          <span>{entry.createdAt}</span>
          <p>{entry.content}</p>
        </article>
      ))}
      {notes.length === 0 && <div className="empty-state">Nenhuma nota carregada.</div>}
      {notes.map((note) => (
        <div className="list-row" key={note.path}>
          <span>MD</span>
          {note.title}
        </div>
      ))}
    </div>
  );
}
