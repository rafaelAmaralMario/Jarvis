import { Search } from 'lucide-react';
import type { SearchResult } from '../../infrastructure/native';
import { shortPath } from '../../shared/utils';

interface SearchPanelProps {
  searchQuery: string;
  searchResults: SearchResult[];
  onSearchQueryChange: (value: string) => void;
  onRunSearch: () => void;
  onLoadSearchResult: (result: SearchResult) => void;
}

export function SearchPanel({
  searchQuery,
  searchResults,
  onSearchQueryChange,
  onRunSearch,
  onLoadSearchResult,
}: SearchPanelProps) {
  return (
    <div className="settings-panel">
      <label>
        Buscar no projeto
        <input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void onRunSearch();
          }}
          placeholder="Texto a buscar"
        />
      </label>
      <button className="primary-button with-icon" onClick={() => void onRunSearch()} type="button">
        <Search size={15} />
        Buscar
      </button>
      <div className="panel-list compact">
        {searchResults.map((result) => (
          <button
            className="search-result"
            key={`${result.path}-${result.line}-${result.preview}`}
            onClick={() => void onLoadSearchResult(result)}
            type="button"
          >
            <strong>{shortPath(result.path)}:{result.line}</strong>
            <span>{result.preview}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
