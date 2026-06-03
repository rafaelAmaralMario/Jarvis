import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
  enabled: boolean;
  delay: number;
  isDirty: boolean;
  content: string;
  path: string | null;
  onSave: (path: string) => void;
}

export function useAutoSave({ enabled, delay, isDirty, content, path, onSave }: UseAutoSaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const pathRef = useRef(path);

  contentRef.current = content;
  pathRef.current = path;

  useEffect(() => {
    if (!enabled || !isDirty || !path) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (pathRef.current && isDirty) {
        onSave(pathRef.current);
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, delay, isDirty, content, path, onSave]);
}
