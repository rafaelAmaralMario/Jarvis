import { invoke } from '@tauri-apps/api/core';

export interface GitFileStatus {
  path: string;
  status: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
}

export async function getGitStatus(workspacePath?: string): Promise<GitFileStatus[]> {
  return invoke<GitFileStatus[]>('git_status', { workspacePath });
}

export async function getGitDiff(workspacePath: string | undefined, filePath: string): Promise<string> {
  return invoke<string>('git_diff', { workspacePath, filePath });
}

export async function stageGitFile(workspacePath: string, filePath: string): Promise<void> {
  return invoke<void>('git_stage', { workspacePath, filePath });
}

export async function unstageGitFile(workspacePath: string, filePath: string): Promise<void> {
  return invoke<void>('git_unstage', { workspacePath, filePath });
}

export async function commitGit(workspacePath: string, message: string): Promise<void> {
  return invoke<void>('git_commit', { workspacePath, message });
}

export async function listGitBranches(workspacePath: string): Promise<GitBranch[]> {
  return invoke<GitBranch[]>('git_branches', { workspacePath });
}

export async function checkoutGitBranch(workspacePath: string, branch: string): Promise<void> {
  return invoke<void>('git_checkout_branch', { workspacePath, branch });
}

export async function createGitBranch(workspacePath: string, branch: string): Promise<void> {
  return invoke<void>('git_create_branch', { workspacePath, branch });
}

export async function getGithubPrUrl(workspacePath: string): Promise<string> {
  return invoke<string>('github_pr_url', { workspacePath });
}
