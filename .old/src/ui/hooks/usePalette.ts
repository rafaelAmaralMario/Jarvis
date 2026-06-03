import { useMemo, useState } from 'react';
import { commands } from '../constants';

export function usePalette() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');

  const filteredCommands = useMemo(
    () => commands.filter((command) =>
      command.label.toLowerCase().includes(paletteQuery.toLowerCase()),
    ),
    [paletteQuery],
  );

  return {
    paletteOpen,
    setPaletteOpen,
    paletteQuery,
    setPaletteQuery,
    filteredCommands,
  };
}
