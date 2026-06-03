import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePalette } from '../usePalette';

describe('usePalette', () => {
  it('should initialize with palette closed', () => {
    const { result } = renderHook(() => usePalette());
    expect(result.current.paletteOpen).toBe(false);
    expect(result.current.paletteQuery).toBe('');
  });

  it('should open palette', () => {
    const { result } = renderHook(() => usePalette());
    act(() => { result.current.setPaletteOpen(true); });
    expect(result.current.paletteOpen).toBe(true);
  });

  it('should close palette', () => {
    const { result } = renderHook(() => usePalette());
    act(() => { result.current.setPaletteOpen(true); });
    act(() => { result.current.setPaletteOpen(false); });
    expect(result.current.paletteOpen).toBe(false);
  });

  it('should filter commands by query', () => {
    const { result } = renderHook(() => usePalette());
    act(() => { result.current.setPaletteQuery('salvar'); });
    expect(result.current.filteredCommands.length).toBeGreaterThan(0);
    expect(result.current.filteredCommands.every((cmd) =>
      cmd.label.toLowerCase().includes('salvar'),
    )).toBe(true);
  });

  it('should return all commands for empty query', () => {
    const { result } = renderHook(() => usePalette());
    result.current.filteredCommands.forEach((cmd) => {
      expect(cmd).toHaveProperty('id');
      expect(cmd).toHaveProperty('label');
    });
  });
});
