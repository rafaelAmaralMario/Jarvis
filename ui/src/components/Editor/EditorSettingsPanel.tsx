import { useState, useEffect } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';

interface EditorSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: () => void;
}

interface Settings {
  fontSize: number;
  tabSize: number;
  wordWrap: string;
  theme: string;
  minimap: boolean;
  lineNumbers: string;
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
  formatOnSaveMode: string;
}

const defaultSettings: Settings = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: 'off',
  theme: 'vs-dark',
  minimap: true,
  lineNumbers: 'on',
  autoSave: true,
  autoSaveDelay: 2000,
  formatOnSave: false,
  formatOnSaveMode: 'monaco',
};

export function EditorSettingsPanel({ isOpen, onClose, onSettingsChange }: EditorSettingsPanelProps) {
  const bridge = useJarvis();
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    if (isOpen) {
      bridge.editorGetSettings().then(raw => {
        setSettings({
          fontSize: parseInt(raw.fontSize || '14', 10),
          tabSize: parseInt(raw.tabSize || '4', 10),
          wordWrap: raw.wordWrap || 'off',
          theme: raw.theme || 'vs-dark',
          minimap: raw.minimap !== 'false',
          lineNumbers: raw.lineNumbers || 'on',
          autoSave: raw.autoSave !== 'false',
          autoSaveDelay: parseInt(raw.autoSaveDelay || '2000', 10),
          formatOnSave: raw.formatOnSave === 'true',
          formatOnSaveMode: raw.formatOnSaveMode || 'monaco',
        });
      });
    }
  }, [isOpen, bridge]);

  const update = (key: string, value: string | boolean | number) => {
    const strVal = String(value);
    bridge.editorUpdateSettings(key, strVal).then(() => {
      onSettingsChange?.();
    });
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-xl w-[420px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium">Configurações do Editor</h3>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent/30 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Tamanho da fonte</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={24}
                value={settings.fontSize}
                onChange={e => update('fontSize', parseInt(e.target.value, 10))}
                className="w-24 accent-primary"
              />
              <span className="text-xs w-6 text-right">{settings.fontSize}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Tamanho da tabulação</label>
            <select
              value={settings.tabSize}
              onChange={e => update('tabSize', parseInt(e.target.value, 10))}
              className="text-xs bg-accent/20 border border-border rounded px-2 py-1 outline-none"
            >
              {[2, 4, 6, 8].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Quebra de linha</label>
            <select
              value={settings.wordWrap}
              onChange={e => update('wordWrap', e.target.value)}
              className="text-xs bg-accent/20 border border-border rounded px-2 py-1 outline-none"
            >
              <option value="off">Off</option>
              <option value="on">On</option>
              <option value="wordWrapColumn">Column</option>
              <option value="bounded">Bounded</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Tema</label>
            <select
              value={settings.theme}
              onChange={e => update('theme', e.target.value)}
              className="text-xs bg-accent/20 border border-border rounded px-2 py-1 outline-none"
            >
              <option value="vs-dark">Vs Dark</option>
              <option value="vs">Vs Light</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Minimapa</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.minimap}
                onChange={e => update('minimap', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-accent/40 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Números de linha</label>
            <select
              value={settings.lineNumbers}
              onChange={e => update('lineNumbers', e.target.value)}
              className="text-xs bg-accent/20 border border-border rounded px-2 py-1 outline-none"
            >
              <option value="on">On</option>
              <option value="off">Off</option>
              <option value="relative">Relative</option>
              <option value="interval">Interval</option>
            </select>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-muted-foreground">Auto-save</label>
                <p className="text-[10px] text-muted-foreground/50">Salvar automaticamente após inatividade</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={e => update('autoSave', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-accent/40 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
            {settings.autoSave && (
              <div className="flex items-center justify-between mt-3">
                <label className="text-xs text-muted-foreground">Delay (ms)</label>
                <input
                  type="number"
                  min={500}
                  max={10000}
                  step={100}
                  value={settings.autoSaveDelay}
                  onChange={e => update('autoSaveDelay', parseInt(e.target.value, 10))}
                  className="text-xs bg-accent/20 border border-border rounded px-2 py-1 w-20 outline-none text-right"
                />
              </div>
            )}
          </div>
        </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-muted-foreground">Formatar ao salvar</label>
                <p className="text-[10px] text-muted-foreground/50">Formatar documento automaticamente</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.formatOnSave}
                  onChange={e => update('formatOnSave', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-accent/40 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
            {settings.formatOnSave && (
              <div className="flex items-center justify-between mt-3">
                <label className="text-xs text-muted-foreground">Modo</label>
                <select
                  value={settings.formatOnSaveMode}
                  onChange={e => update('formatOnSaveMode', e.target.value)}
                  className="text-xs bg-accent/20 border border-border rounded px-2 py-1 outline-none"
                >
                  <option value="monaco">Monaco Native</option>
                </select>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
