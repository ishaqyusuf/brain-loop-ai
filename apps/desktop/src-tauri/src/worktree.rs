use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone)]
pub struct WorktreePreparation {
    pub path: String,
    pub branch: String,
    pub created: bool,
    pub strategy: String,
    pub used_main_checkout: bool,
}

pub fn ensure_task_worktree(item: &mut crate::brain::QueueItem) -> Result<WorktreePreparation, String> {
    let strategy = crate::state::execution_strategy();
    item.execution_strategy = Some(strategy.clone());

    if strategy == "main-checkout" {
        return use_main_checkout(item, strategy, "main-checkout");
    }

    if let Some(existing_path) = item.worktree_path.clone() {
        if Path::new(&existing_path).exists() {
            item.execution_path = Some(existing_path.clone());
            return Ok(WorktreePreparation {
                path: existing_path,
                branch: branch_name(&item.project_id, &item.id),
                created: false,
                strategy,
                used_main_checkout: false,
            });
        }
    }

    if let Err(error) = ensure_git_project(&item.project_path) {
        if strategy == "auto" && Path::new(&item.project_path).exists() {
            return use_main_checkout(item, strategy, "auto-main-checkout");
        }
        return Err(error);
    }

    let branch = branch_name(&item.project_id, &item.id);
    let path = worktree_path(&item.project_id, &item.id);
    if path.exists() {
        let path_string = path.display().to_string();
        item.worktree_path = Some(path_string.clone());
        item.execution_path = Some(path_string.clone());
        return Ok(WorktreePreparation {
            path: path_string,
            branch,
            created: false,
            strategy,
            used_main_checkout: false,
        });
    }

    crate::state::ensure_dir(path.parent().unwrap_or_else(|| Path::new(".")))
        .map_err(|e| format!("Failed to create worktree parent directory: {}", e))?;

    let add_with_branch = Command::new("git")
        .arg("-C")
        .arg(&item.project_path)
        .arg("worktree")
        .arg("add")
        .arg("-b")
        .arg(&branch)
        .arg(&path)
        .arg("HEAD")
        .output()
        .map_err(|e| format!("Failed to run git worktree add: {}", e))?;

    if !add_with_branch.status.success() {
        let stderr = String::from_utf8_lossy(&add_with_branch.stderr);
        if !stderr.contains("already exists") {
            let error = format!("Failed to create worktree: {}", stderr.trim());
            if strategy == "auto" {
                return use_main_checkout(item, strategy, "auto-main-checkout");
            }
            return Err(error);
        }

        let add_existing_branch = Command::new("git")
            .arg("-C")
            .arg(&item.project_path)
            .arg("worktree")
            .arg("add")
            .arg(&path)
            .arg(&branch)
            .output()
            .map_err(|e| format!("Failed to run git worktree add for existing branch: {}", e))?;

        if !add_existing_branch.status.success() {
            let fallback_stderr = String::from_utf8_lossy(&add_existing_branch.stderr);
            let error = format!(
                "Failed to create worktree from existing branch: {}",
                fallback_stderr.trim()
            );
            if strategy == "auto" {
                return use_main_checkout(item, strategy, "auto-main-checkout");
            }
            return Err(error);
        }
    }

    let path_string = path.display().to_string();
    item.worktree_path = Some(path_string.clone());
    item.execution_path = Some(path_string.clone());

    Ok(WorktreePreparation {
        path: path_string,
        branch,
        created: true,
        strategy,
        used_main_checkout: false,
    })
}

fn use_main_checkout(
    item: &mut crate::brain::QueueItem,
    strategy: String,
    branch: &str,
) -> Result<WorktreePreparation, String> {
    if !Path::new(&item.project_path).exists() {
        return Err(format!("Project path does not exist: {}", item.project_path));
    }

    item.worktree_path = None;
    item.execution_path = Some(item.project_path.clone());
    item.execution_strategy = Some(strategy.clone());

    Ok(WorktreePreparation {
        path: item.project_path.clone(),
        branch: branch.to_string(),
        created: false,
        strategy,
        used_main_checkout: true,
    })
}

fn ensure_git_project(project_path: &str) -> Result<(), String> {
    if !Path::new(project_path).exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    let output = Command::new("git")
        .arg("-C")
        .arg(project_path)
        .arg("rev-parse")
        .arg("--is-inside-work-tree")
        .output()
        .map_err(|e| format!("Failed to inspect git repository: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Project path is not a usable git worktree: {}", stderr.trim()))
    }
}

fn worktree_path(project_id: &str, queue_item_id: &str) -> PathBuf {
    crate::state::worktrees_dir()
        .join(sanitize_component(project_id))
        .join(sanitize_component(queue_item_id))
}

fn branch_name(project_id: &str, queue_item_id: &str) -> String {
    format!(
        "brain-loop/{}-{}",
        sanitize_component(project_id),
        sanitize_component(queue_item_id)
    )
}

fn sanitize_component(value: &str) -> String {
    let mut clean = String::with_capacity(value.len());
    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' {
            clean.push(ch);
        } else {
            clean.push('-');
        }
    }
    let clean = clean.trim_matches('-').to_string();
    if clean.is_empty() {
        "untitled".to_string()
    } else {
        clean
    }
}
