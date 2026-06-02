import { appMetadata } from '../application';

export function App() {
  return (
    <main className="app-shell">
      <aside className="activity-bar" aria-label="Navegacao principal">
        <span className="activity-logo">J</span>
      </aside>

      <section className="sidebar" aria-label="Explorador">
        <header className="panel-header">{appMetadata.name}</header>
        <div className="sidebar-empty">Workspace ainda nao aberto</div>
      </section>

      <section className="editor-area" aria-label="Editor">
        <div className="editor-welcome">
          <p className="eyebrow">IDE nativa para IA</p>
          <h1>{appMetadata.name}</h1>
          <p>{appMetadata.description}</p>
        </div>
      </section>

      <aside className="ai-panel" aria-label="Painel de IA">
        <header className="panel-header">IA</header>
        <div className="model-badge">Provider mock pendente</div>
      </aside>
    </main>
  );
}
