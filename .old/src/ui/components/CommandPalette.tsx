interface CommandPaletteProps {
  paletteOpen: boolean;
  paletteQuery: string;
  filteredCommands: Array<{ id: string; label: string }>;
  onPaletteQueryChange: (value: string) => void;
  onPaletteClose: () => void;
  onRunCommand: (commandId: string) => void;
}

export function CommandPalette({
  paletteOpen,
  paletteQuery,
  filteredCommands,
  onPaletteQueryChange,
  onPaletteClose,
  onRunCommand,
}: CommandPaletteProps) {
  if (!paletteOpen) {
    return null;
  }

  return (
    <div className="overlay" onMouseDown={() => onPaletteClose()}>
      <div className="palette" onMouseDown={(event) => event.stopPropagation()}>
        <input
          autoFocus
          value={paletteQuery}
          onChange={(event) => onPaletteQueryChange(event.target.value)}
          placeholder="Digite um comando..."
        />
        {filteredCommands.map((command) => (
          <button key={command.id} onClick={() => onRunCommand(command.id)} type="button">
            {command.label}
          </button>
        ))}
      </div>
    </div>
  );
}
