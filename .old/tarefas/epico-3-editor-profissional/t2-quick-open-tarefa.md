# Tarefa: Quick Open (Ctrl+P)

**Epico:** 3 — Editor Profissional  
**Prioridade:** 🔴 Alta  
**Estimativa:** 1-2 semanas  
**Dependencias:** Nenhuma

## Objetivo

Adicionar atalho `Ctrl+P` para abrir arquivos rapidamente com fuzzy search, similar ao Quick Open do VS Code.

## Estado Atual

Existe apenas Command Palette (`Ctrl+Shift+P`) com 8 comandos. Nao ha navegacao rapida por nome de arquivo.

## Como Fazer

### 1. Modificar Command Palette

Separar em dois modos:
- `Ctrl+P` — Quick Open (busca arquivos do workspace)
- `Ctrl+Shift+P` — Command Palette (busca comandos)

### 2. Logica do Quick Open

```typescript
function useQuickOpen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuickOpenResult[]>([]);
  const { files } = useWorkspace();

  useEffect(() => {
    if (!query) { setResults(flattenFiles(files)); return; }
    const fuzzy = fuzzySearch(flattenFiles(files), query);
    setResults(fuzzy.slice(0, 20));
  }, [query, files]);

  return { query, setQuery, results, isLoading };
}
```

### 3. Componente QuickOpen

```tsx
function QuickOpen({ isOpen, onClose }: QuickOpenProps) {
  return (
    <div className="quick-open-overlay">
      <input
        ref={inputRef}
        value={query}
        onChange={handleChange}
        placeholder="Buscar arquivos..."
        autoFocus
      />
      <div className="quick-open-results">
        {results.map(file => (
          <div key={file.path} onClick={() => handleSelect(file)}>
            <FileIcon extension={extname(file.name)} />
            <span>{file.name}</span>
            <span className="path">{file.path}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Criterios de Pronto

- [ ] `Ctrl+P` abre Quick Open com busca de arquivos
- [ ] `Ctrl+Shift+P` mantido para Command Palette
- [ ] Fuzzy search nos nomes de arquivo
- [ ] Caminho do arquivo exibido ao lado do nome
- [ ] Enter abre arquivo selecionado no editor
- [ ] Escape fecha sem selecionar
- [ ] Navegacao por setas (cima/baixo)

## Referencias

- `docs/context/18-vscode-features.md#18-comandos-e-atalhos` — Quick Open no VS Code
- `docs/context/14-funcionalidades-atuais.md#110` — Command Palette atual
