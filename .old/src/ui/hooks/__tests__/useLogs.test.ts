import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogs } from '../useLogs';

describe('useLogs', () => {
  it('should initialize with empty logs', () => {
    const { result } = renderHook(() => useLogs());
    expect(result.current.logs).toEqual([]);
  });

  it('should add log entry', () => {
    const { result } = renderHook(() => useLogs());
    act(() => { result.current.addLog('test message', 'ok'); });
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].message).toBe('test message');
    expect(result.current.logs[0].status).toBe('ok');
  });

  it('should default status to ok', () => {
    const { result } = renderHook(() => useLogs());
    act(() => { result.current.addLog('test'); });
    expect(result.current.logs[0].status).toBe('ok');
  });

  it('should add warn log', () => {
    const { result } = renderHook(() => useLogs());
    act(() => { result.current.addLog('warning', 'warn'); });
    expect(result.current.logs[0].status).toBe('warn');
  });

  it('should keep max 25 entries', () => {
    const { result } = renderHook(() => useLogs());
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.addLog(`log-${i}`);
      }
    });
    expect(result.current.logs.length).toBeLessThanOrEqual(25);
  });

  it('should prepend new logs', () => {
    const { result } = renderHook(() => useLogs());
    act(() => { result.current.addLog('first'); });
    act(() => { result.current.addLog('second'); });
    expect(result.current.logs[0].message).toBe('second');
  });
});
