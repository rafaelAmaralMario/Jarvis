import { useState } from 'react';
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
import type { ActionLog, AuditEvent } from '../../shared/types';

export function useGit(
  workspacePath: string,
  addLog: (message: string, status?: ActionLog['status']) => void,
  addAudit: (actor: string, permission: string, target: string, result: string) => void,
  onWorkspaceChanged: () => Promise<void>,
) {
  const [gitFiles, setGitFiles] = useState<GitFileStatus[]>([]);
  const [gitBranches, setGitBranches] = useState<GitBranchInfo[]>([]);
  const [selectedGitFile, setSelectedGitFile] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [branchName, setBranchName] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [diff, setDiff] = useState('');

  async function openDiff(filePath: string) {
    setSelectedGitFile(filePath);
    const result = await getGitDiff(workspacePath, filePath);
    setDiff(result || 'Sem diff textual disponivel para este arquivo.');
    addLog(`Diff carregado: ${filePath}`, 'ok');
  }

  async function stageFile(filePath: string) {
    try {
      await stageGitFile(workspacePath, filePath);
      await onWorkspaceChanged();
      addAudit('Git', 'git', filePath, 'Stage');
      addLog(`Stage aplicado: ${filePath}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function unstageFile(filePath: string) {
    try {
      await unstageGitFile(workspacePath, filePath);
      await onWorkspaceChanged();
      addAudit('Git', 'git', filePath, 'Unstage');
      addLog(`Stage removido: ${filePath}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function createCommit(msg: string) {
    try {
      await commitGit(workspacePath, msg);
      setCommitMessage('');
      await onWorkspaceChanged();
      addAudit('Git', 'git', workspacePath, 'Commit criado');
      addLog('Commit criado com sucesso', 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  function suggestCommitMessage() {
    const summary = gitFiles
      .slice(0, 3)
      .map((file) => shortPath(file.path))
      .join(', ');
    setCommitMessage(summary ? `chore: update ${summary}` : 'chore: update project');
  }

  async function createBranch(name: string) {
    try {
      await createGitBranch(workspacePath, name);
      setBranchName('');
      await onWorkspaceChanged();
      addAudit('Git', 'git', workspacePath, 'Branch criada');
      addLog('Branch criada e ativada', 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function checkoutBranch(branch: string) {
    try {
      await checkoutGitBranch(workspacePath, branch);
      await onWorkspaceChanged();
      addAudit('Git', 'git', branch, 'Checkout de branch');
      addLog(`Branch ativa: ${branch}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function createPullRequestUrl() {
    try {
      const url = await getGithubPrUrl(workspacePath);
      setPrUrl(url);
      addAudit('GitHub', 'network', workspacePath, 'URL de PR gerada');
      addLog('URL de Pull Request gerada', 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  return {
    gitFiles, setGitFiles,
    gitBranches, setGitBranches,
    selectedGitFile,
    commitMessage, setCommitMessage,
    branchName, setBranchName,
    prUrl,
    diff, setDiff,
    openDiff,
    stageFile,
    unstageFile,
    createCommit,
    suggestCommitMessage,
    createBranch,
    checkoutBranch,
    createPullRequestUrl,
  };
}
