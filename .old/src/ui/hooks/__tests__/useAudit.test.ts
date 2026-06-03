import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudit } from '../useAudit';

describe('useAudit', () => {
  it('should initialize with empty events', () => {
    const { result } = renderHook(() => useAudit());
    expect(result.current.auditEvents).toEqual([]);
  });

  it('should add audit event', () => {
    const { result } = renderHook(() => useAudit());
    act(() => { result.current.addAudit('user', 'git.commit', 'workspace', 'success'); });
    expect(result.current.auditEvents).toHaveLength(1);
    expect(result.current.auditEvents[0].actor).toBe('user');
    expect(result.current.auditEvents[0].permission).toBe('git.commit');
    expect(result.current.auditEvents[0].target).toBe('workspace');
    expect(result.current.auditEvents[0].result).toBe('success');
  });

  it('should keep max 80 events', () => {
    const { result } = renderHook(() => useAudit());
    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.addAudit(`actor-${i}`, 'perm', 'target', 'ok');
      }
    });
    expect(result.current.auditEvents.length).toBeLessThanOrEqual(80);
  });

  it('should prepend new events', () => {
    const { result } = renderHook(() => useAudit());
    act(() => { result.current.addAudit('first', 'perm', 'target', 'ok'); });
    act(() => { result.current.addAudit('second', 'perm', 'target', 'ok'); });
    expect(result.current.auditEvents[0].actor).toBe('second');
  });
});
