import { useState, useEffect } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';
import type { PermissionInfo, AuditEntry, SecretInfo } from '@/types';

type SecurityTab = 'permissions' | 'audit' | 'secrets';

export function SecurityPanel() {
  const bridge = useJarvis();
  const [tab, setTab] = useState<SecurityTab>('permissions');
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [secrets, setSecrets] = useState<SecretInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [secretForm, setSecretForm] = useState({ key: '', value: '', category: 'general' });
  const [showSecretForm, setShowSecretForm] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      bridge.securityGetPermissions().then(setPermissions).catch(() => {}),
      bridge.securityGetAuditLog().then(setAuditLog).catch(() => {}),
      bridge.securityListSecrets().then(setSecrets).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function togglePermission(moduleId: string, permission: string, current: boolean) {
    await bridge.securitySetPermission(moduleId, permission, !current);
    const updated = await bridge.securityGetPermissions();
    setPermissions(updated);
  }

  async function handleAddSecret() {
    await bridge.securityStoreSecret(secretForm.key, secretForm.value, secretForm.category);
    setSecrets(await bridge.securityListSecrets());
    setShowSecretForm(false);
    setSecretForm({ key: '', value: '', category: 'general' });
  }

  async function handleDeleteSecret(key: string) {
    await bridge.securityDeleteSecret(key);
    setSecrets(await bridge.securityListSecrets());
  }

  const tabs: { id: SecurityTab; label: string }[] = [
    { id: 'permissions', label: 'Permissions' },
    { id: 'audit', label: 'Audit Log' },
    { id: 'secrets', label: 'Secrets' },
  ];

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Security</h2>
          <p className="text-sm text-muted-foreground">Permissions, audit log, and secret storage</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1 text-xs rounded-md transition-colors ${tab === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'permissions' && (
        <div className="space-y-1">
          {permissions.map(p => (
            <div key={`${p.moduleId}:${p.permission}`} className="flex items-center justify-between p-2 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium w-24 text-xs">{p.moduleId}</span>
                <span className="text-muted-foreground text-xs">{p.permission}</span>
              </div>
              <button onClick={() => togglePermission(p.moduleId, p.permission, p.granted)}
                className={`px-2 py-0.5 text-[10px] rounded-md border transition-colors ${p.granted ? 'bg-green-950/20 text-green-400 border-green-900/40' : 'bg-red-950/20 text-red-400 border-red-900/40'}`}>
                {p.granted ? 'Granted' : 'Denied'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {auditLog.map(e => (
            <div key={e.id} className="flex items-start gap-2 p-2 rounded-lg border border-border bg-card text-xs">
              <span className="text-muted-foreground w-16 flex-shrink-0">{new Date(e.createdAt).toLocaleTimeString()}</span>
              <span className="px-1.5 py-0.5 rounded bg-muted font-medium text-[10px]">{e.module}</span>
              <span className="text-muted-foreground">{e.action}</span>
              {e.detail && <span className="text-muted-foreground/60 truncate">— {e.detail}</span>}
            </div>
          ))}
          {auditLog.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No audit entries yet</p>}
        </div>
      )}

      {tab === 'secrets' && (
        <div className="space-y-2">
          <button onClick={() => setShowSecretForm(true)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">+ Add Secret</button>
          {showSecretForm && (
            <div className="p-3 rounded-xl border border-border bg-card space-y-2">
              <input placeholder="Key" value={secretForm.key} onChange={e => setSecretForm(f => ({ ...f, key: e.target.value }))} className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input placeholder="Value" type="password" value={secretForm.value} onChange={e => setSecretForm(f => ({ ...f, value: e.target.value }))} className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none" />
              <select value={secretForm.category} onChange={e => setSecretForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border">
                <option value="general">General</option>
                <option value="credentials">Credentials</option>
                <option value="tokens">Tokens</option>
              </select>
              <div className="flex gap-2">
                <button onClick={handleAddSecret} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground">Save</button>
                <button onClick={() => setShowSecretForm(false)} className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-1">
            {secrets.map(s => (
              <div key={s.key} className="flex items-center justify-between p-2 rounded-lg border border-border bg-card text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.key}</span>
                  <span className="text-muted-foreground">({s.category})</span>
                </div>
                <button onClick={() => handleDeleteSecret(s.key)} className="px-2 py-0.5 text-[10px] rounded-md border border-border hover:bg-red-950/20 hover:text-red-400">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
