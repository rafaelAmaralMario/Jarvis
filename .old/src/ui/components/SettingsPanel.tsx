import { FolderOpen, Sparkles } from 'lucide-react';
import type { SettingsState, ModelHealth, PermissionId, ContextVaultKind } from '../../shared/types';
import type { AiModel, ProviderKind } from '../../domain';
import { selectFolder } from '../../infrastructure/native';
import { permissionItems } from '../constants';

interface SettingsPanelProps {
  workspacePath: string;
  settings: SettingsState;
  secureApiKey: string;
  modelHealth: ModelHealth;
  modelTestActive: boolean;
  availableModels: AiModel[];
  localOllamaModels: string[];
  ollamaModelsError: string;
  onChooseWorkspace: () => void;
  onUpdateProviderKind: (kind: ProviderKind) => void;
  onSetSettings: (updater: (prev: SettingsState) => SettingsState) => void;
  onSetSecureApiKey: (value: string) => void;
  onTestSelectedModel: () => void;
  onStartSelectedOllamaModel: () => void;
  onRefreshOllamaModels: (path?: string) => void;
  onPersistSecureApiKey: () => void;
  onLoadObsidianNotes: () => void;
  onUpdatePermission: (permission: PermissionId, enabled: boolean) => void;
}

export function SettingsPanel({
  workspacePath,
  settings,
  secureApiKey,
  modelHealth,
  modelTestActive,
  availableModels,
  localOllamaModels,
  ollamaModelsError,
  onChooseWorkspace,
  onUpdateProviderKind,
  onSetSettings,
  onSetSecureApiKey,
  onTestSelectedModel,
  onStartSelectedOllamaModel,
  onRefreshOllamaModels,
  onPersistSecureApiKey,
  onLoadObsidianNotes,
  onUpdatePermission,
}: SettingsPanelProps) {
  return (
    <div className="settings-panel">
      <label>
        Projeto atual
        <input value={workspacePath} readOnly />
      </label>
      <button className="primary-button with-icon" onClick={() => void onChooseWorkspace()} type="button">
        <FolderOpen size={15} />
        Selecionar pasta do projeto
      </button>
      <label>
        Provider de IA
        <select
          value={settings.providerKind}
          onChange={(event) => onUpdateProviderKind(event.target.value as ProviderKind)}
        >
          <option value="mock">Mock local</option>
          <option value="ollama">Ollama local</option>
          <option value="openai-compatible">OpenAI-compatible</option>
        </select>
      </label>
      <label>
        Modelo ativo
        <select
          value={settings.selectedModelId}
          onChange={(event) =>
            onSetSettings((current) => ({ ...current, selectedModelId: event.target.value }))
          }
        >
          {availableModels
            .filter((model) => model.providerId === settings.providerKind)
            .map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="primary-button with-icon"
        disabled={modelTestActive}
        onClick={() => void onTestSelectedModel()}
        type="button"
      >
        <Sparkles size={15} />
        {modelTestActive ? 'Testando modelo...' : 'Testar modelo'}
      </button>
      <button
        className="text-button with-icon"
        disabled={settings.providerKind !== 'ollama'}
        onClick={() => void onStartSelectedOllamaModel()}
        type="button"
      >
        <Sparkles size={15} />
        Iniciar modelo selecionado
      </button>
      <div className={`status-line ${modelHealth}`}>
        Modelo: {modelHealth === 'ok' ? 'funcional' : modelHealth === 'fail' ? 'falhou no ultimo teste' : 'nao testado'}
      </div>
      {settings.providerKind === 'ollama' && (
        <>
          <label>
            Endpoint Ollama
            <input
              value={settings.ollamaBaseUrl}
              onChange={(event) =>
                onSetSettings((current) => ({ ...current, ollamaBaseUrl: event.target.value }))
              }
              placeholder="http://127.0.0.1:11434"
            />
          </label>
          <label>
            Pasta de modelos Ollama
            <input
              value={settings.ollamaModelsPath}
              onChange={(event) =>
                onSetSettings((current) => ({ ...current, ollamaModelsPath: event.target.value }))
              }
              placeholder="C:\\Users\\...\\.ollama\\models"
            />
          </label>
          <div className="split-actions">
            <button
              className="text-button"
              onClick={async () => {
                const selected = await selectFolder('Selecionar pasta de modelos do Ollama');
                if (selected) {
                  onSetSettings((current) => ({ ...current, ollamaModelsPath: selected }));
                  await onRefreshOllamaModels(selected);
                }
              }}
              type="button"
            >
              Escolher pasta
            </button>
            <button className="text-button" onClick={() => void onRefreshOllamaModels()} type="button">
              Detectar modelos
            </button>
          </div>
          {ollamaModelsError && <div className="empty-state warning">{ollamaModelsError}</div>}
          {!ollamaModelsError && localOllamaModels.length > 0 && (
            <div className="status-line ok">
              Modelos locais: {localOllamaModels.join(', ')}
            </div>
          )}
        </>
      )}
      {settings.providerKind === 'openai-compatible' && (
        <>
          <label>
            Endpoint OpenAI-compatible
            <input
              value={settings.openaiCompatibleBaseUrl}
              onChange={(event) =>
                onSetSettings((current) => ({
                  ...current,
                  openaiCompatibleBaseUrl: event.target.value,
                }))
              }
              placeholder="https://api.openai.com/v1"
            />
          </label>
          <label>
            API key
            <input
              value={secureApiKey}
              onChange={(event) => onSetSecureApiKey(event.target.value)}
              placeholder="sk-..."
              type="password"
            />
          </label>
          <button className="primary-button" onClick={() => void onPersistSecureApiKey()} type="button">
            Salvar chave
          </button>
        </>
      )}
      <label>
        Tema
        <select
          value={settings.theme}
          onChange={(event) =>
            onSetSettings((current) => ({
              ...current,
              theme: event.target.value as SettingsState['theme'],
            }))
          }
        >
          <option value="dark">Escuro</option>
          <option value="light">Claro</option>
        </select>
      </label>
      <label>
        Destino de contexto
        <select
          value={settings.contextVaultKind}
          onChange={(event) =>
            onSetSettings((current) => ({
              ...current,
              contextVaultKind: event.target.value as ContextVaultKind,
            }))
          }
        >
          <option value="general">Geral</option>
          <option value="project">Especifico do projeto</option>
        </select>
      </label>
      <label>
        Vault Obsidian geral
        <input
          value={settings.generalVaultPath}
          onChange={(event) =>
            onSetSettings((current) => ({ ...current, generalVaultPath: event.target.value }))
          }
          placeholder="C:\\Users\\...\\Vault-Geral"
        />
      </label>
      <label>
        Vault Obsidian do projeto
        <input
          value={settings.projectVaultPath}
          onChange={(event) =>
            onSetSettings((current) => ({ ...current, projectVaultPath: event.target.value }))
          }
          placeholder="C:\\Users\\...\\Vault-Projeto"
        />
      </label>
      <button className="primary-button" onClick={() => void onLoadObsidianNotes()} type="button">
        Validar e carregar notas do destino
      </button>
      <section className="permission-center">
        <strong>Permissoes por workspace</strong>
        {permissionItems.map((permission) => (
          <label className="toggle-row" key={permission.id}>
            <span>
              {permission.label}
              <small>{permission.description}</small>
            </span>
            <input
              checked={settings.permissions[permission.id]}
              onChange={(event) => onUpdatePermission(permission.id, event.target.checked)}
              type="checkbox"
            />
          </label>
        ))}
      </section>
    </div>
  );
}
