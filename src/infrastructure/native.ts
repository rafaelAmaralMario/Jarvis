export type { WorkspaceEntry, FileContent, SearchResult } from './workspace';
export {
  selectWorkspaceFolder, selectFolder, getDefaultWorkspacePath,
  listWorkspaceEntries, readTextFile, writeTextFile,
  createFile, createFolder, deleteEntry, renameEntry, moveEntry,
  searchWorkspace, validatePath,
} from './workspace';

export type { GitFileStatus, GitBranch } from './git';
export {
  getGitStatus, getGitDiff, stageGitFile, unstageGitFile,
  commitGit, listGitBranches, checkoutGitBranch, createGitBranch,
  getGithubPrUrl,
} from './git';

export {
  getDefaultOllamaModelsPath, listOllamaModels, startOllamaModel, testOllamaModel,
} from './ollama';

export type { SecureSettings } from './settings';
export { loadSecureSettings, saveSecureSettings } from './settings';

export type { LocalPluginManifest } from './plugins';
export { listLocalPluginManifests } from './plugins';

export type { MarkdownNote } from './note';
export { listMarkdownNotes, writeMarkdownNote } from './note';
