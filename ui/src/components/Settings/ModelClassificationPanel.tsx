import { useState, useEffect } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';

const SPECIALTIES = [
  { id: 'chat', label: 'Chat', icon: '💬', desc: 'General conversation' },
  { id: 'code', label: 'Code', icon: '💻', desc: 'Programming and code generation' },
  { id: 'reasoning', label: 'Reasoning', icon: '🧠', desc: 'Complex reasoning and analysis' },
  { id: 'embedding', label: 'Embedding', icon: '📐', desc: 'Text embeddings and vectors' },
  { id: 'vision', label: 'Vision', icon: '👁', desc: 'Image understanding' },
  { id: 'general', label: 'General', icon: '🤖', desc: 'Default for unclassified tasks' },
];

export function ModelClassificationPanel() {
  const bridge = useJarvis();
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [models, setModels] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      bridge.editorGetSettings() as Promise<Record<string, unknown>>,
      bridge.listModels().then(ms => ms.map(m => m.name)),
    ]).then(([settings, modelNames]) => {
      if (settings?.defaultModelsBySpecialty && typeof settings.defaultModelsBySpecialty === 'object') {
        setDefaults(settings.defaultModelsBySpecialty as Record<string, string>);
      }
      setModels(modelNames);
    });
  }, [bridge]);

  const update = (specialty: string, model: string) => {
    setDefaults(prev => ({ ...prev, [specialty]: model }));
    setSaved(false);
  };

  const save = async () => {
    const settings = await bridge.editorGetSettings() as Record<string, unknown>;
    await bridge.editorUpdateSettings({ ...settings, defaultModelsBySpecialty: defaults });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Default Models by Specialty</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set the default model for each task type. When an agent doesn't specify a model,
          the default for its specialty will be used.
        </p>
      </div>

      <div className="space-y-3">
        {SPECIALTIES.map((spec) => (
          <div
            key={spec.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{spec.icon}</span>
              <div>
                <label className="text-sm font-medium text-foreground">{spec.label}</label>
                <p className="text-xs text-muted-foreground">{spec.desc}</p>
              </div>
            </div>
            <select
              value={defaults[spec.id] || ''}
              onChange={(e) => update(spec.id, e.target.value)}
              className="px-3 py-1.5 rounded-lg border bg-background text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Auto —</option>
              {models.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <button
          onClick={save}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {saved ? '✓ Saved' : 'Save Defaults'}
        </button>
      </div>
    </div>
  );
}
