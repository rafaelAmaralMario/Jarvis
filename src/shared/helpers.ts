import type { WorkspaceEntry } from '../infrastructure/workspace';
import type { MarkdownNote } from '../infrastructure/note';
import type { PluginManifest } from '../plugins';
import type { AiModel } from '../domain';
import type { PermissionId, EditorTab, ContextResult, MemoryEntry } from './types';
import { tokenize } from './utils';

type PluginCheck = (
  plugin: PluginManifest,
  permissions: Record<string, boolean>,
) => { allowed: boolean; reason: string } | null;

function createPluginVerifier() {
  const checks: PluginCheck[] = [
    (plugin) =>
      plugin.valid === false
        ? { allowed: false, reason: `Plugin invalido: ${plugin.name}` }
        : null,
    (plugin) =>
      plugin.permissions.includes('commands.execute')
        ? { allowed: false, reason: 'Plugins ainda nao podem executar comandos locais.' }
        : null,
  ];

  const permissionChecks: Record<string, string> = {
    'secrets.read': 'Permissao de secrets nao autorizada neste workspace.',
    'network.request': 'Permissao de rede nao autorizada neste workspace.',
    'git.write': 'Permissao Git nao autorizada neste workspace.',
  };

  return {
    registerCheck(check: PluginCheck) {
      checks.push(check);
    },
    registerPermissionCheck(permission: string, reason: string) {
      permissionChecks[permission] = reason;
    },
    verify(
      plugin: PluginManifest,
      permissions: Record<string, boolean>,
    ): { allowed: boolean; reason: string } {
      for (const check of checks) {
        const result = check(plugin, permissions);
        if (result) return result;
      }

      for (const [permission, reason] of Object.entries(permissionChecks)) {
        if (plugin.permissions.includes(permission) && !permissions[permission]) {
          return { allowed: false, reason };
        }
      }

      return { allowed: true, reason: 'Plugin verificado.' };
    },
  };
}

const pluginVerifier = createPluginVerifier();
export const verifyPlugin = pluginVerifier.verify.bind(pluginVerifier);
export const pluginVerifierApi = pluginVerifier;

export function mergeModelRegistry(baseModels: AiModel[], ollamaModels: string[]): AiModel[] {
  const knownIds = new Set(baseModels.map((model) => model.id));
  const detectedModels: AiModel[] = ollamaModels
    .map((model) => ({
      id: `ollama:${model}`,
      providerId: 'ollama',
      name: `Ollama ${model}`,
      capabilities: ['text' as const, 'code' as const],
      status: 'active' as const,
    }))
    .filter((model) => !knownIds.has(model.id));
  return [...baseModels, ...detectedModels];
}

export function renderWorkspaceTree(entries: WorkspaceEntry[], level = 0): string {
  return entries
    .slice(0, 80)
    .map((entry) => {
      const prefix = `${'  '.repeat(level)}- ${entry.kind === 'directory' ? '[dir]' : '[file]'} ${entry.name}`;
      const children = entry.children.length > 0 && level < 3
        ? `\n${renderWorkspaceTree(entry.children, level + 1)}`
        : '';
      return `${prefix}${children}`;
    })
    .join('\n');
}

export function createAgentDiff(tab: EditorTab) {
  const welcomeTabPath = 'welcome.md';
  const filePath = tab.path === welcomeTabPath ? 'novo-arquivo.md' : tab.path;
  const shortName = filePath.split(/[\\/]/).pop() || filePath;
  return [
    `diff --git a/${shortName} b/${shortName}`,
    `--- a/${shortName}`,
    `+++ b/${shortName}`,
    '@@',
    '+// Proposta do Agente Desenvolvedor:',
    '+// revisar este arquivo e adicionar testes antes de aplicar.',
    tab.content
      .split('\n')
      .slice(0, 8)
      .map((line) => ` ${line}`)
      .join('\n'),
  ].join('\n');
}

export function createReview(tab: EditorTab) {
  return [
    `Revisao do arquivo: ${tab.name}`,
    '',
    '- Verificar caminhos de erro antes de aplicar alteracoes.',
    '- Adicionar teste para o fluxo principal alterado.',
    '- Confirmar se a mudanca nao expande permissao sensivel sem aprovacao.',
  ].join('\n');
}

export function createDocumentationProposal(tab: EditorTab) {
  return [
    `Proposta de documentacao para ${tab.name}`,
    '',
    '## Contexto',
    'Descrever objetivo do arquivo e principais contratos usados.',
    '',
    '## Cuidados',
    'Registrar permissoes, dependencias externas e impacto no workspace.',
  ].join('\n');
}

export function searchContext(
  query: string,
  notes: MarkdownNote[],
  memories: MemoryEntry[],
): ContextResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return [];
  }

  const noteResults = notes.map((note) => scoreContextItem(
    `note:${note.path}`,
    note.title,
    'Obsidian',
    `${note.title} ${note.content}`,
  ));
  const memoryResults = memories.map((memory) => scoreContextItem(
    `memory:${memory.id}`,
    'Memoria local',
    memory.createdAt,
    memory.content,
  ));

  return [...noteResults, ...memoryResults]
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 12);

  function scoreContextItem(
    id: string,
    title: string,
    source: string,
    content: string,
  ): ContextResult {
    const contentTokens = tokenize(content);
    const score = queryTokens.reduce(
      (total, token) => total + contentTokens.filter((item) => item === token).length,
      0,
    );

    return {
      id,
      title,
      source,
      score,
      preview: content.slice(0, 180),
    };
  }
}
