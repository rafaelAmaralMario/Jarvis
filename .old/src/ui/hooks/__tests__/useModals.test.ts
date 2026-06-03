import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModals } from '../useModals';

describe('useModals', () => {
  it('should initialize with null modal', () => {
    const { result } = renderHook(() => useModals());
    expect(result.current.modal).toBeNull();
    expect(result.current.modalValue).toBe('');
  });

  it('should open create-file modal', () => {
    const { result } = renderHook(() => useModals());
    act(() => { result.current.openModal({ type: 'create-file', title: 'Criar arquivo' }); });
    expect(result.current.modal).toEqual({ type: 'create-file', title: 'Criar arquivo' });
    expect(result.current.modalValue).toBe('');
  });

  it('should open rename modal with pre-filled value', () => {
    const { result } = renderHook(() => useModals());
    const entry = { name: 'test.ts', path: '/workspace/test.ts', kind: 'file' as const, children: [] };
    act(() => { result.current.openModal({ type: 'rename', title: 'Renomear', entry }); });
    expect(result.current.modal?.type).toBe('rename');
    expect(result.current.modalValue).toBe('test.ts');
  });

  it('should close modal', () => {
    const { result } = renderHook(() => useModals());
    act(() => { result.current.openModal({ type: 'create-file', title: 'Criar' }); });
    expect(result.current.modal).not.toBeNull();
    act(() => { result.current.closeModal(); });
    expect(result.current.modal).toBeNull();
  });

  it('should update modal value', () => {
    const { result } = renderHook(() => useModals());
    act(() => { result.current.setModalValue('new-value'); });
    expect(result.current.modalValue).toBe('new-value');
  });
});
