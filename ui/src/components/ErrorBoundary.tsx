import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      const bridge = (window as any).jarvis;
      if (bridge?.logError) {
        bridge.logError(error.message, info.componentStack || '');
      }
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="max-w-md text-center px-8">
            <div className="text-5xl mb-4">!</div>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Algo deu errado
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Ocorreu um erro inesperado na interface.
              {this.state.error && (
                <span className="block mt-2 font-mono text-xs text-destructive">
                  {this.state.error.message}
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-accent transition-colors"
              >
                Recarregar
              </button>
              <button
                onClick={async () => {
                  try {
                    const bridge = (window as any).pywebview?.api ?? (window as any).jarvis;
                    if (!bridge) { alert('Bridge não disponível. Logs em: %APPDATA%/JARVIS/logs/'); return; }
                    const logPath = typeof bridge.getLogPath === 'function'
                      ? await bridge.getLogPath()
                      : '';
                    if (logPath && typeof bridge.revealInExplorer === 'function') {
                      await bridge.revealInExplorer(logPath);
                    } else {
                      alert(`Logs em: ${logPath || '%APPDATA%/JARVIS/logs/'}`);
                    }
                  } catch (e) {
                    alert(`Erro ao abrir logs. Caminho: %APPDATA%/JARVIS/logs/`);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-amber-950/30 text-amber-400 border border-amber-900/40 text-sm hover:bg-amber-950/50 transition-colors"
              >
                Abrir logs
              </button>
            </div>
            <p className="mt-6 text-[10px] text-muted-foreground">
              Veja os logs em: %APPDATA%/JARVIS/logs/
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
