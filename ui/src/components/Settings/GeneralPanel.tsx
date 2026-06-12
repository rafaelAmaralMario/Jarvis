import { useState, useEffect } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';

type ThemeMode = 'dark' | 'light';
type Language = 'pt-BR' | 'en-US';

interface GeneralSettings {
  language: Language;
  theme: ThemeMode;
  editorFontSize: number;
  terminalFontSize: number;
  autoSave: boolean;
  chatFontSize: number;
  defaultModelsBySpecialty: Record<string, string>;
}

const DEFAULT_SETTINGS: GeneralSettings = {
  language: 'pt-BR',
  theme: 'dark',
  editorFontSize: 14,
  terminalFontSize: 13,
  autoSave: true,
  chatFontSize: 14,
  defaultModelsBySpecialty: {},
};

export function GeneralPanel() {
  const bridge = useJarvis();
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    bridge.editorGetSettings().then((cfg: Record<string, string>) => {
      if (cfg?.general) {
        try {
          const parsed = JSON.parse(cfg.general);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch { /* ignore malformed json */ }
      }
    });
  }, [bridge]);

  function update<K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    try {
      await bridge.editorUpdateSettings('general', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }

  function applyTheme(theme: ThemeMode) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">General Settings</h3>
        <p className="text-xs text-muted-foreground mb-6">
          Configure global application preferences.
        </p>
      </div>

      <div className="space-y-5">
        {/* Language */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Language</label>
            <p className="text-xs text-muted-foreground">Interface language</p>
          </div>
          <select
            value={settings.language}
            onChange={(e) => update('language', e.target.value as Language)}
            className="px-3 py-1.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
          </select>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Theme</label>
            <p className="text-xs text-muted-foreground">Appearance mode</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { update('theme', 'dark'); applyTheme('dark'); }}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                settings.theme === 'dark'
                  ? 'bg-accent text-accent-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => { update('theme', 'light'); applyTheme('light'); }}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                settings.theme === 'light'
                  ? 'bg-accent text-accent-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              ☀️ Light
            </button>
          </div>
        </div>

        {/* Editor Font Size */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Editor Font Size</label>
            <p className="text-xs text-muted-foreground">Monaco editor text size (px)</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="24"
              value={settings.editorFontSize}
              onChange={(e) => update('editorFontSize', Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground w-8 text-right">{settings.editorFontSize}px</span>
          </div>
        </div>

        {/* Terminal Font Size */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Terminal Font Size</label>
            <p className="text-xs text-muted-foreground">xterm.js text size (px)</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="22"
              value={settings.terminalFontSize}
              onChange={(e) => update('terminalFontSize', Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground w-8 text-right">{settings.terminalFontSize}px</span>
          </div>
        </div>

        {/* Chat Font Size */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Chat Font Size</label>
            <p className="text-xs text-muted-foreground">AI panel message text size (px)</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="12"
              max="20"
              value={settings.chatFontSize}
              onChange={(e) => update('chatFontSize', Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground w-8 text-right">{settings.chatFontSize}px</span>
          </div>
        </div>

        {/* Auto Save */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Auto Save</label>
            <p className="text-xs text-muted-foreground">Automatically save edited files</p>
          </div>
          <button
            onClick={() => update('autoSave', !settings.autoSave)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              settings.autoSave ? 'bg-green-500' : 'bg-muted'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              settings.autoSave ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

      </div>

      <div className="pt-4 border-t border-border">
        <button
          onClick={save}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
