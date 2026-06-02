import { useState, useRef } from 'react';
import type { GitFileStatus, GitBranch as GitBranchInfo } from '../../infrastructure/native';
import { createGitService, type GitService } from '../../application/services/git';
import type { ActionLog, AuditEvent } from '../../shared/types';

export function useGit(
  workspacePath: string,
  addLog: (message: string, status?: ActionLog['status']) => void,
  addAudit: (actor: string, permission: string, target: string, result: string) => void,
  onWorkspaceChanged: () => Promise<void>,
) {
  const serviceRef = useRef<GitService | null>(null);
  function getService() {
    if (!serviceRef.current) {
      serviceRef.current = createGitService(addLog, addAudit, onWorkspaceChanged);
    }
    return serviceRef.current;
  }

  const [gitFiles, setGitFiles] = useState<GitFileStatus[]>([]);
  const [gitBranches, setGitBranches] = useState<GitBranchInfo[]>([]);
  const [selectedGitFile, setSelectedGitFile] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [branchName, setBranchName] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [diff, setDiff] = useState('');

  async function openDiff(filePath: string) {
    setSelectedGitFile(filePath);
    const result = await getService().openDiff(workspacePath, filePath);
    setDiff(result);
  }

  async function stageFile(filePath: string) {
    await getService().stageFile(workspacePath, filePath);
  }

  async function unstageFile(filePath: string) {
    await getService().unstageFile(workspacePath, filePath);
  }

  async function createCommit(msg: string) {
    await getService().createCommit(workspacePath, msg);
    setCommitMessage('');
  }

  function suggestCommitMessage() {
    const msg = getService().suggestCommitMessage(gitFiles);
    setCommitMessage(msg);
  }

  async function createBranch(name: string) {
    await getService().createBranch(workspacePath, name);
    setBranchName('');
  }

  async function checkoutBranch(branch: string) {
    await getService().checkoutBranch(workspacePath, branch);
  }

  async function createPullRequestUrl() {
    const url = await getService().createPullRequestUrl(workspacePath);
    setPrUrl(url);
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
