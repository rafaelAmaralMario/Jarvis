import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchPanel } from '../SearchPanel';

describe('SearchPanel', () => {
  const defaultProps = {
    searchQuery: '',
    searchResults: [] as Array<{ path: string; line: number; preview: string }>,
    onSearchQueryChange: vi.fn(),
    onRunSearch: vi.fn(),
    onLoadSearchResult: vi.fn(),
  };

  it('should render search input', () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('Texto a buscar')).toBeInTheDocument();
  });

  it('should render search button', () => {
    render(<SearchPanel {...defaultProps} />);
    expect(screen.getByText('Buscar')).toBeInTheDocument();
  });

  it('should render search results', () => {
    const results = [{ path: '/workspace/src/index.ts', line: 5, preview: 'import { foo }' }];
    render(<SearchPanel {...defaultProps} searchResults={results} />);
    expect(screen.getByText('index.ts:5')).toBeInTheDocument();
    expect(screen.getByText('import { foo }')).toBeInTheDocument();
  });
});
