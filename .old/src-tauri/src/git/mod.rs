use std::process::Command;

use serde::Serialize;

#[derive(Serialize)]
pub struct GitFileStatus {
    pub path: String,
    pub status: String,
}

#[derive(Serialize)]
pub struct GitBranch {
    pub name: String,
    pub current: bool,
}

pub fn status(workspace_path: Option<String>) -> Result<Vec<GitFileStatus>, String> {
    let root = workspace_path.unwrap_or_else(|| {
        let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        manifest_dir
            .parent()
            .unwrap_or(&manifest_dir)
            .to_string_lossy()
            .to_string()
    });

    let output = Command::new("git")
        .args(["status", "--short"])
        .current_dir(root)
        .output()
        .map_err(|error| error.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout
        .lines()
        .filter_map(|line| {
            if line.len() < 4 {
                return None;
            }

            Some(GitFileStatus {
                status: line[..2].trim().to_string(),
                path: line[3..].to_string(),
            })
        })
        .collect())
}

pub fn diff(workspace_path: Option<String>, file_path: String) -> Result<String, String> {
    let root = workspace_path.unwrap_or_else(|| {
        let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        manifest_dir
            .parent()
            .unwrap_or(&manifest_dir)
            .to_string_lossy()
            .to_string()
    });

    let output = Command::new("git")
        .args(["diff", "--", &file_path])
        .current_dir(root)
        .output()
        .map_err(|error| error.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn stage(workspace_path: String, file_path: String) -> Result<(), String> {
    run_git(&workspace_path, &["add", "--", &file_path]).map(|_| ())
}

pub fn unstage(workspace_path: String, file_path: String) -> Result<(), String> {
    run_git(&workspace_path, &["restore", "--staged", "--", &file_path]).map(|_| ())
}

pub fn commit(workspace_path: String, message: String) -> Result<(), String> {
    let trimmed = message.trim();
    if trimmed.is_empty() {
        return Err("Commit message cannot be empty".to_string());
    }

    run_git(&workspace_path, &["commit", "-m", trimmed]).map(|_| ())
}

pub fn branches(workspace_path: String) -> Result<Vec<GitBranch>, String> {
    let output = run_git(&workspace_path, &["branch", "--list"])?;
    Ok(output
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                return None;
            }

            Some(GitBranch {
                current: trimmed.starts_with('*'),
                name: trimmed.trim_start_matches('*').trim().to_string(),
            })
        })
        .collect())
}

pub fn checkout_branch(workspace_path: String, branch: String) -> Result<(), String> {
    run_git(&workspace_path, &["checkout", branch.trim()]).map(|_| ())
}

pub fn create_branch(workspace_path: String, branch: String) -> Result<(), String> {
    let trimmed = branch.trim();
    if trimmed.is_empty() {
        return Err("Branch name cannot be empty".to_string());
    }

    run_git(&workspace_path, &["checkout", "-b", trimmed]).map(|_| ())
}

pub fn github_pr_url(workspace_path: String) -> Result<String, String> {
    let branch = run_git(&workspace_path, &["branch", "--show-current"])?;
    let remote = run_git(&workspace_path, &["config", "--get", "remote.origin.url"])?;
    build_github_pr_url(remote.trim(), branch.trim())
}

fn run_git(workspace_path: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(workspace_path)
        .output()
        .map_err(|error| error.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

fn build_github_pr_url(remote: &str, branch: &str) -> Result<String, String> {
    let repository = remote
        .trim_end_matches(".git")
        .trim_start_matches("git@github.com:")
        .trim_start_matches("https://github.com/");

    if repository == remote || repository.is_empty() || branch.is_empty() {
        return Err("Cannot resolve GitHub repository or active branch".to_string());
    }

    Ok(format!(
        "https://github.com/{repository}/compare/main...{branch}?expand=1"
    ))
}
