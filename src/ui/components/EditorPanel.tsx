import Editor from '@monaco-editor/react';
import { Save } from 'lucide-react';
import type { EditorTab, ModelHealth, ActionLog, AuditEvent } from '../../shared/types';
import type { AgentFormState, BottomView } from '../types';
import { samePath } from '../../shared/utils';
import { permissionItems, agentDesignerPath, welcomeTab } from '../constants';
import { BottomPanel } from './BottomPanel';

interface EditorPanelProps {
  appName: string;
  appDescription: string;
  selectedModelName: string;
  tabs: EditorTab[];
  activeTab: EditorTab;
  settingsTheme: string;
  agentForm: AgentFormState;
  modelHealth: ModelHealth;
  agentCreationActive: boolean;
  bottomView: BottomView;
  diff: string;
  selectedGitFile: string;
  logs: ActionLog[];
  auditEvents: AuditEvent[];
  proposalAccepted: boolean;
  onSetActiveTabPath: (path: string) => void;
  onCloseTab: (tab: EditorTab) => void;
  onSaveActiveFile: () => void;
  onUpdateActiveTab: (content: string) => void;
  onSetAgentForm: (updater: (prev: AgentFormState) => AgentFormState) => void;
  onCreateCustomAgent: () => void;
  onOpenPalette: () => void;
  onBottomViewChange: (view: BottomView) => void;
  onAcceptProposal: () => void;
}

export function EditorPanel({
  appName,
  appDescription,
  selectedModelName,
  tabs,
  activeTab,
  settingsTheme,
  agentForm,
  modelHealth,
  agentCreationActive,
  bottomView,
  diff,
  selectedGitFile,
  logs,
  auditEvents,
  proposalAccepted,
  onSetActiveTabPath,
  onCloseTab,
  onSaveActiveFile,
  onUpdateActiveTab,
  onSetAgentForm,
  onCreateCustomAgent,
  onOpenPalette,
  onBottomViewChange,
  onAcceptProposal,
}: EditorPanelProps) {
  const isAgentDesigner = activeTab.path === agentDesignerPath;
  return (
    <section className="workbench" aria-label="Editor">
      <div className="top-bar">
        <div>
          <strong>{appName}</strong>
          <span>{appDescription}</span>
        </div>
        <button className="model-badge" onClick={() => onOpenPalette()} type="button">
          {selectedModelName}
        </button>
      </div>
      <div className="editor-tabs">
        {tabs.map((tab) => (
          <button
            className={samePath(activeTab.path, tab.path) ? 'tab active' : 'tab'}
            key={tab.path}
            onClick={() => onSetActiveTabPath(tab.path)}
            onAuxClick={(event) => {
              if (event.button === 1 && tab.path !== welcomeTab.path) {
                onCloseTab(tab);
              }
            }}
            type="button"
          >
            {tab.content !== tab.savedContent && <span className="dirty-dot" />}
            {tab.name}
            {tab.path !== welcomeTab.path && (
              <span className="tab-close" onClick={(event) => { event.stopPropagation(); onCloseTab(tab); }}>
                x
              </span>
            )}
          </button>
        ))}
        <button className="tab-action" onClick={() => onSaveActiveFile()} title="Salvar arquivo" type="button">
          <Save size={15} />
          Salvar
        </button>
      </div>
      <div className="editor-frame">
        {isAgentDesigner ? (
          <section className="agent-designer">
            <div>
              <strong>Novo agente</strong>
              <span>O modelo ativo sera usado para refinar a definicao.</span>
            </div>
            <label>
              Nome
              <input
                value={agentForm.name}
                onChange={(event) => onSetAgentForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex.: Analista de requisitos"
              />
            </label>
            <label>
              O que ele deve fazer
              <textarea
                value={agentForm.intent}
                onChange={(event) => onSetAgentForm((current) => ({ ...current, intent: event.target.value }))}
                placeholder="Descreva a funcao do agente..."
              />
            </label>
            <div className="permission-grid">
              {permissionItems.map((permission) => (
                <label className="toggle-row" key={permission.id}>
                  <span>
                    {permission.label}
                    <small>{permission.description}</small>
                  </span>
                  <input
                    checked={agentForm.permissions.includes(permission.id)}
                    onChange={(event) => {
                      onSetAgentForm((current) => ({
                        ...current,
                        permissions: event.target.checked
                          ? [...current.permissions, permission.id]
                          : current.permissions.filter((item) => item !== permission.id),
                      }));
                    }}
                    type="checkbox"
                  />
                </label>
              ))}
            </div>
            <button
              className="primary-button"
              disabled={modelHealth !== 'ok' || agentCreationActive}
              onClick={() => onCreateCustomAgent()}
              type="button"
            >
              {agentCreationActive ? 'Criando agente...' : 'Criar agente com IA'}
            </button>
          </section>
        ) : (
          <Editor
            language={activeTab.language}
            height="100%"
            theme={settingsTheme === 'dark' ? 'vs-dark' : 'light'}
            value={activeTab.content}
            onChange={(value) => onUpdateActiveTab(value ?? '')}
            options={{ minimap: { enabled: false }, fontSize: 14, readOnly: false }}
          />
        )}
      </div>
      <BottomPanel
        bottomView={bottomView}
        diff={diff}
        selectedGitFile={selectedGitFile}
        logs={logs}
        auditEvents={auditEvents}
        proposalAccepted={proposalAccepted}
        onBottomViewChange={onBottomViewChange}
        onAcceptProposal={onAcceptProposal}
      />
    </section>
  );
}
