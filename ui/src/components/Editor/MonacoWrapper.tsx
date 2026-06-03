import { useEffect, useRef } from 'react';

interface MonacoWrapperProps {
  value: string;
  language: string;
  path: string;
  onChange?: (value: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  onSave?: () => void;
  onClose?: () => void;
}

export function MonacoWrapper({ value, language, path, onChange, onCursorChange, onSave, onClose }: MonacoWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReturnType<typeof import('monaco-editor')['editor']['create']> | null>(null);

  useEffect(() => {
    let disposers: { dispose: () => void }[] = [];

    async function initMonaco() {
      if (!containerRef.current) return;
      if (editorRef.current) return;

      const monaco = await import('monaco-editor');

      const editor = monaco.editor.create(containerRef.current, {
        value,
        language,
        theme: 'vs-dark',
        minimap: { enabled: true },
        lineNumbers: 'on',
        glyphMargin: true,
        folding: true,
        bracketPairColorization: { enabled: true },
        autoIndent: 'advanced',
        tabSize: 4,
        wordWrap: 'off',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorStyle: 'line',
        fontSize: 14,
        fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
        renderWhitespace: 'selection',
        contextmenu: true,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 8 },
      });

      editorRef.current = editor;

      disposers.push(
        editor.onDidChangeModelContent(() => {
          onChange?.(editor.getValue());
        })
      );

      disposers.push(
        editor.onDidChangeCursorPosition((e) => {
          onCursorChange?.(e.position.lineNumber, e.position.column);
        })
      );

      editor.addAction({
        id: 'save-file',
        label: 'Salvar',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        contextMenuGroupId: '1_modification',
        run: () => onSave?.(),
      });

      editor.addAction({
        id: 'close-tab',
        label: 'Fechar',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW],
        contextMenuGroupId: '2_close',
        run: () => onClose?.(),
      });

      editor.addAction({
        id: 'copy-path',
        label: 'Copiar caminho do arquivo',
        keybindings: [],
        contextMenuGroupId: '3_navigation',
        run: () => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(path);
          }
        },
      });
    }

    initMonaco();

    return () => {
      disposers.forEach(d => d.dispose());
      disposers = [];
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      const currentVal = editorRef.current.getValue();
      if (currentVal !== value) {
        editorRef.current.setValue(value);
      }
    }
  }, [path]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
