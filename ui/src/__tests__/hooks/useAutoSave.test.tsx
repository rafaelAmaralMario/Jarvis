import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useEffect } from 'react';

function TestHarness({ enabled, delay, isDirty, content, path, onSave }: {
  enabled: boolean; delay: number; isDirty: boolean; content: string; path: string | null; onSave: (path: string) => void;
}) {
  useAutoSave({ enabled, delay, isDirty, content, path, onSave });
  return null;
}

describe('useAutoSave', () => {
  it('calls onSave after delay when dirty and enabled', async () => {
    const onSave = vi.fn();
    render(<TestHarness enabled delay={50} isDirty content="hello" path="/test/file.ts" onSave={onSave} />);
    await new Promise(r => setTimeout(r, 100));
    expect(onSave).toHaveBeenCalledWith('/test/file.ts');
  });

  it('does not call onSave when not dirty', async () => {
    const onSave = vi.fn();
    render(<TestHarness enabled delay={50} isDirty={false} content="hello" path="/test/file.ts" onSave={onSave} />);
    await new Promise(r => setTimeout(r, 100));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not call onSave when disabled', async () => {
    const onSave = vi.fn();
    render(<TestHarness enabled={false} delay={50} isDirty content="hello" path="/test/file.ts" onSave={onSave} />);
    await new Promise(r => setTimeout(r, 100));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not call onSave when no path', async () => {
    const onSave = vi.fn();
    render(<TestHarness enabled delay={50} isDirty content="hello" path={null} onSave={onSave} />);
    await new Promise(r => setTimeout(r, 100));
    expect(onSave).not.toHaveBeenCalled();
  });
});
