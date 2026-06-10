import { lazy, Suspense, useState, useEffect, Component, type ReactNode } from 'react';
import type { ActivityView } from '@/types';
import { useJarvis } from '@/hooks/use-jarvis';
import { GitPanel } from '@/components/Git/GitPanel';
import { AiPanel } from '@/components/AiPanel';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
          <div className="text-center">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="text-sm">Algo deu errado ao carregar esta página.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const SettingsPage = lazy(() => import('@/components/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const KnowledgePanel = lazy(() => import('@/components/Knowledge/KnowledgePanel').then(m => ({ default: m.KnowledgePanel })));
const WorkspacePanel = lazy(() => import('@/components/Workspace/WorkspacePanel').then(m => ({ default: m.WorkspacePanel })));

interface MainAreaProps {
  activeView: ActivityView;
}

export function MainArea({ activeView }: MainAreaProps) {
  const jarvis = useJarvis();
  const [gitRepoPath, setGitRepoPath] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const roots = await jarvis.getRoots();
        if (roots.length > 0) {
          const isRepo = await jarvis.gitIsRepo(roots[0]);
          setGitRepoPath(isRepo ? roots[0] : '');
        }
      } catch {}
    })();
  }, []);

  if (activeView === 'git' && gitRepoPath) {
    return <GitPanel repoPath={gitRepoPath} />;
  }

  if (activeView === 'git' && !gitRepoPath) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-4xl mb-3">⎇</p>
          <p className="text-sm">No git repository in current workspace</p>
          <p className="text-xs mt-1">Open a git repo in the Workspace view first</p>
        </div>
      </div>
    );
  }

  if (activeView === 'settings') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm animate-pulse">Carregando...</div>}>
          <SettingsPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (activeView === 'knowledge') {
    return (
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm animate-pulse">Carregando...</div>}>
        <KnowledgePanel />
      </Suspense>
    );
  }

  if (activeView === 'ide' || activeView === 'editor') {
    return (
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm animate-pulse">Carregando...</div>}>
        <WorkspacePanel />
      </Suspense>
    );
  }

  if (activeView === 'ai') {
    return <AiPanel fullView />;
  }

  if (activeView === 'automation') {
    return (
      <div className="h-full overflow-y-auto p-8">
        <h1 className="text-lg font-semibold mb-4">⚡ Workflows & Automation</h1>
        <p className="text-sm text-muted-foreground mb-6">Configure and run automation workflows. Go to Settings → Workflows to manage.</p>
        <div className="grid gap-4 max-w-2xl">
          {[
            { icon: '⚡', title: 'Run Command', desc: 'Execute shell commands as workflow steps' },
            { icon: '🌐', title: 'API Calls', desc: 'Make HTTP requests to external services' },
            { icon: '🧠', title: 'AI Query', desc: 'Query LLM models within workflows' },
            { icon: '📝', title: 'Create Note', desc: 'Auto-generate knowledge notes' },
            { icon: '⏰', title: 'Schedule', desc: 'Trigger workflows on a schedule' },
          ].map(item => (
            <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="font-medium text-sm">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
