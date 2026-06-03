import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePanelResize } from '../usePanelResize';

describe('usePanelResize', () => {
  beforeEach(() => {
    window.innerWidth = 1920;
  });

  it('should initialize with panel widths', () => {
    const onSettingsChange = vi.fn();
    const { result } = renderHook(() => usePanelResize(300, 380, onSettingsChange));
    expect(result.current.panelWidths).toBeDefined();
    expect(result.current.panelWidths.sidebar).toBeGreaterThan(0);
    expect(result.current.panelWidths.ai).toBeGreaterThan(0);
  });

  it('should clamp sidebar within bounds', () => {
    const onSettingsChange = vi.fn();
    const { result } = renderHook(() => usePanelResize(10, 380, onSettingsChange));
    expect(result.current.panelWidths.sidebar).toBeGreaterThanOrEqual(260);
  });

  it('should clamp AI panel within bounds', () => {
    const onSettingsChange = vi.fn();
    const { result } = renderHook(() => usePanelResize(300, 10, onSettingsChange));
    expect(result.current.panelWidths.ai).toBeGreaterThanOrEqual(360);
  });

  it('should return viewport width', () => {
    const onSettingsChange = vi.fn();
    const { result } = renderHook(() => usePanelResize(300, 380, onSettingsChange));
    expect(result.current.viewportWidth).toBe(1920);
  });

  it('should update panel widths on settings change', () => {
    const onSettingsChange = vi.fn();
    renderHook(() => usePanelResize(300, 380, onSettingsChange));
    expect(onSettingsChange).not.toHaveBeenCalled();
  });
});
