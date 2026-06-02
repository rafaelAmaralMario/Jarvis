import type { GitFileStatus, GitBranch as GitBranchInfo } from '../../infrastructure/native';
import {
  getGitDiff,
  stageGitFile,
  unstageGitFile,
  commitGit,
  createGitBranch,
  checkoutGitBranch,
  getGithubPrUrl,
} from '../../infrastructure/native';
import { shortPath } from '../../shared/utils';

export function createGitService(
  addLog: (message: string, status?: 'ok' | 'warn') => void,
  addAudit: (actor: string, permission: string, target: string, result: string) => void,
  onWorkspaceChanged: () => Promise<void>,
) {
  async function openDiff(workspacePath: string, filePath: string): Promise<string> {
    const result = await getGitDiff(workspacePath, filePath);
    const diff = result || 'Sem diff textual disponivel para este arquivo.';
    addLog(`Diff carregado: ${filePath}`, 'ok');
    return diff;
  }

  async function stageFile(workspacePath: string, filePath: string): Promise<void> {
    try {
      await stageGitFile(workspacePath, filePath);
      await onWorkspaceChanged();
      addAudit('Git', 'git', filePath, 'Stage');
      addLog(`Stage aplicado: ${filePath}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function unstageFile(workspacePath: string, filePath: string): Promise<void> {
    try {
      await unstageGitFile(workspacePath, filePath);
      await onWorkspaceChanged();
      addAudit('Git', 'git', filePath, 'Unstage');
      addLog(`Stage removido: ${filePath}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function createCommit(workspacePath: string, msg: string): Promise<void> {
    try {
      await commitGit(workspacePath, msg);
      await onWorkspaceChanged();
      addAudit('Git', 'git', workspacePath, 'Commit criado');
      addLog('Commit criado com sucesso', 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  function suggestCommitMessage(gitFiles: GitFileStatus[]): string {
    const summary = gitFiles
      .slice(0, 3)
      .map((file) => shortPath(file.path))
      .join(', ');
    return summary ? `chore: update ${summary}` : 'chore: update project';
  }

  async function createBranch(workspacePath: string, name: string): Promise<void> {
    try {
      await createGitBranch(workspacePath, name);
      await onWorkspaceChanged();
      addAudit('Git', 'git', workspacePath, 'Branch criada');
      addLog('Branch criada e ativada', 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function checkoutBranch(workspacePath: string, branch: string): Promise<void> {
    try {
      await checkoutGitBranch(workspacePath, branch);
      await onWorkspaceChanged();
      addAudit('Git', 'git', branch, 'Checkout de branch');
      addLog(`Branch ativa: ${branch}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function createPullRequestUrl(workspacePath: string): Promise<string> {
    const url = await getGithubPrUrl(workspacePath);
    addAudit('GitHub', 'network', workspacePath, 'URL de PR gerada');
    addLog('URL de Pull Request gerada', 'ok');
    return url;
  }

  return { openDiff, stageFile, unstageFile, createCommit, suggestCommitMessage, createBranch, checkoutBranch, createPullRequestUrl };
}

export type GitService = ReturnType<typeof createGitService>;
