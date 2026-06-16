use crate::{atomic, brain, lock, state};
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::AppHandle;

const PRE_LANDING_COMMIT_MESSAGE: &str = "brain: preserve pre-landing main changes";

pub fn apply_landing_policy(app: &AppHandle, item: &brain::QueueItem) -> Result<(), String> {
    if item.status != "landing" {
        return Ok(());
    }

    let project = match project_for_item(item) {
        Ok(project) => project,
        Err(e) => {
            block_landing(item.clone(), "brain-loop", &e, "landing_project_missing")?;
            return Err(e);
        }
    };

    if !project.enabled {
        let detail = format!("Project {} is disabled; landing is blocked.", project.id);
        block_landing(item.clone(), "brain-loop", &detail, "landing_project_disabled")?;
        return Err(detail);
    }

    if project.auto_merge_on_review_pass {
        return land_queue_item_by_id(&item.id, "brain-loop-auto-merge");
    }

    let request = crate::approval::request_merge_approval(app, item)?;
    record_merge_approval_wait(item.id.as_str(), request.id.as_str())
}

pub fn land_queue_item_by_id(queue_item_id: &str, by: &str) -> Result<(), String> {
    let item = brain::read_queue_item(queue_item_id)
        .map_err(|e| format!("Failed to read queue item {}: {}", queue_item_id, e))?
        .ok_or_else(|| format!("Queue item not found: {}", queue_item_id))?;

    if item.status != "landing" {
        return Ok(());
    }

    let project = match project_for_item(&item) {
        Ok(project) => project,
        Err(e) => {
            block_landing(item, by, &e, "landing_project_missing")?;
            return Err(e);
        }
    };

    if !project.enabled {
        let detail = format!("Project {} is disabled; landing is blocked.", project.id);
        block_landing(item, by, &detail, "landing_project_disabled")?;
        return Err(detail);
    }

    land_queue_item(item, by)
}

fn land_queue_item(item: brain::QueueItem, by: &str) -> Result<(), String> {
    let project_path = PathBuf::from(item.project_path.clone());
    let implementation_path = PathBuf::from(execution_path(&item));

    if same_path(&implementation_path, &project_path) {
        let commit = current_commit(&project_path).ok();
        approve_landing(item, by, LandingResult {
            status: "not_needed".to_string(),
            branch: current_branch(&project_path).ok(),
            commit,
            pre_landing_status: None,
            pre_landing_commit: None,
            pre_landing_committed_at: None,
        })?;
        return Ok(());
    }

    let lock_id = format!("landing-{}", sanitize_lock_id(&item.project_id));
    acquire_landing_lock(&lock_id, &item)?;
    let merge_result = merge_worktree(&item, &implementation_path, &project_path);
    let release_result = lock::release_lock(&state::locks_dir(), &lock_id)
        .map_err(|e| format!("Failed to release landing lock {}: {}", lock_id, e));

    match merge_result {
        Ok(result) => {
            if let Err(e) = release_result {
                block_landing(item, by, &e, "landing_lock_release_failed")?;
                return Err(e);
            }
            approve_landing(item, by, result)?;
            Ok(())
        }
        Err(e) => {
            let _ = release_result;
            block_landing(item, by, &e, "landing_blocked")?;
            Err(e)
        }
    }
}

struct LandingResult {
    status: String,
    branch: Option<String>,
    commit: Option<String>,
    pre_landing_status: Option<String>,
    pre_landing_commit: Option<String>,
    pre_landing_committed_at: Option<String>,
}

fn merge_worktree(
    item: &brain::QueueItem,
    implementation_path: &Path,
    project_path: &Path,
) -> Result<LandingResult, String> {
    verify_git_worktree(project_path, "registered project checkout")?;
    verify_git_worktree(implementation_path, "implementation checkout")?;
    verify_same_repository(project_path, implementation_path)?;
    verify_registered_worktree(project_path, implementation_path)?;

    let target_branch = resolve_target_branch(project_path)?;
    run_git(project_path, &["checkout", target_branch.as_str()])?;

    let mut pre_landing_status = Some("clean".to_string());
    let mut pre_landing_commit = None;
    let mut pre_landing_committed_at = None;
    if is_dirty(project_path)? {
        run_git(project_path, &["add", "-A"])?;
        run_git(project_path, &["commit", "-m", PRE_LANDING_COMMIT_MESSAGE])?;
        pre_landing_status = Some("committed".to_string());
        pre_landing_commit = Some(current_commit(project_path)?);
        pre_landing_committed_at = Some(atomic::utc_now_iso());
    }

    if is_dirty(implementation_path)? {
        run_git(implementation_path, &["add", "-A"])?;
        let message = format!("brain: land {}", item.id);
        run_git(implementation_path, &["commit", "-m", message.as_str()])?;
    }

    let implementation_commit = current_commit(implementation_path)?;
    match run_git(project_path, &["merge", "--no-commit", "--no-ff", implementation_commit.as_str()]) {
        Ok(_) => {}
        Err(e) => {
            let _ = run_git(project_path, &["merge", "--abort"]);
            return Err(format!("Landing merge failed: {}", e));
        }
    }

    if is_dirty(project_path)? {
        let message = format!("brain: land {}", item.id);
        if let Err(e) = run_git(project_path, &["commit", "-m", message.as_str()]) {
            let _ = run_git(project_path, &["merge", "--abort"]);
            return Err(format!("Landing commit failed: {}", e));
        }
    }

    Ok(LandingResult {
        status: "landed".to_string(),
        branch: Some(target_branch),
        commit: Some(current_commit(project_path)?),
        pre_landing_status,
        pre_landing_commit,
        pre_landing_committed_at,
    })
}

fn approve_landing(
    mut item: brain::QueueItem,
    by: &str,
    result: LandingResult,
) -> Result<(), String> {
    let detail = match result.status.as_str() {
        "not_needed" => "Landing merge was not needed because implementation ran in the registered checkout.".to_string(),
        _ => format!(
            "Landed to {} at {}.",
            result.branch.as_deref().unwrap_or("unknown"),
            result.commit.as_deref().unwrap_or("unknown")
        ),
    };

    item.landing_status = Some(result.status.clone());
    item.landing_branch = result.branch;
    item.landed_at = Some(atomic::utc_now_iso());
    item.landed_by = Some(by.to_string());
    item.landed_commit = result.commit;
    item.landing_error = None;
    item.pre_landing_status = result.pre_landing_status;
    item.pre_landing_commit = result.pre_landing_commit;
    item.pre_landing_committed_at = result.pre_landing_committed_at;
    item.pre_landing_commit_message = item
        .pre_landing_commit
        .as_ref()
        .map(|_| PRE_LANDING_COMMIT_MESSAGE.to_string());
    item.last_error = None;
    item.waiting_reason = None;

    let event = if result.status == "not_needed" {
        "landing_not_needed"
    } else {
        "landed"
    };
    brain::update_queue_item_status(
        &mut item,
        "approved",
        by,
        Some(&detail),
        Some(event),
        Some(&detail),
    )
    .map_err(|e| format!("Failed to approve landed queue item: {}", e))?;
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write landed queue item: {}", e))?;
    sync_thread_from_item(&item);
    Ok(())
}

fn block_landing(
    mut item: brain::QueueItem,
    by: &str,
    detail: &str,
    event: &str,
) -> Result<(), String> {
    item.landing_status = Some("blocked".to_string());
    item.landing_error = Some(detail.to_string());
    item.last_error = Some(detail.to_string());
    item.waiting_reason = None;

    if item.status == "landing" {
        brain::update_queue_item_status(
            &mut item,
            "blocked",
            by,
            Some(detail),
            Some(event),
            Some(detail),
        )
        .map_err(|e| format!("Failed to block landing queue item: {}", e))?;
    } else {
        item.history.push(brain::QueueHistoryEntry {
            at: atomic::utc_now_iso(),
            by: by.to_string(),
            status: None,
            note: Some(detail.to_string()),
            event: Some(event.to_string()),
            detail: Some(detail.to_string()),
            review_path: None,
            active_handoff_path: None,
            handoff_path: None,
            agent: None,
        });
    }

    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write blocked landing queue item: {}", e))?;
    sync_thread_from_item(&item);
    Ok(())
}

fn record_merge_approval_wait(queue_item_id: &str, request_id: &str) -> Result<(), String> {
    let Some(mut item) = brain::read_queue_item(queue_item_id)
        .map_err(|e| format!("Failed to read queue item {}: {}", queue_item_id, e))?
    else {
        return Ok(());
    };

    if item.status != "landing" {
        return Ok(());
    }

    let detail = format!("Waiting for merge approval request {}.", request_id);
    if item.waiting_reason.as_deref() != Some(detail.as_str()) {
        item.waiting_reason = Some(detail.clone());
        item.history.push(brain::QueueHistoryEntry {
            at: atomic::utc_now_iso(),
            by: "brain-loop".to_string(),
            status: None,
            note: Some(detail.clone()),
            event: Some("merge_approval_requested".to_string()),
            detail: Some(request_id.to_string()),
            review_path: None,
            active_handoff_path: None,
            handoff_path: None,
            agent: None,
        });
        brain::write_queue_item(&item)
            .map_err(|e| format!("Failed to write merge approval wait state: {}", e))?;
        sync_thread_from_item(&item);
    }

    Ok(())
}

fn project_for_item(item: &brain::QueueItem) -> Result<crate::BrainProject, String> {
    crate::read_projects()?
        .into_iter()
        .find(|project| project.id == item.project_id || project.path == item.project_path)
        .ok_or_else(|| format!("Project not found for queue item {}", item.id))
}

fn execution_path(item: &brain::QueueItem) -> String {
    item.execution_path
        .as_ref()
        .or(item.worktree_path.as_ref())
        .cloned()
        .unwrap_or_else(|| item.project_path.clone())
}

fn acquire_landing_lock(lock_id: &str, item: &brain::QueueItem) -> Result<(), String> {
    let landing_lock = lock::BrainLock {
        id: lock_id.to_string(),
        lock_type: "landing".to_string(),
        holder: "brain-loop".to_string(),
        held_since: atomic::utc_now_iso(),
        expires_at: None,
        metadata: serde_json::json!({
            "queueItemId": item.id,
            "projectId": item.project_id,
        }),
    };

    lock::acquire_lock(&state::locks_dir(), &landing_lock)
        .map_err(|e| format!("Failed to acquire landing lock {}: {}", lock_id, e))
}

fn run_git(cwd: &Path, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("Failed to run git {} in {}: {}", args.join(" "), cwd.display(), e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Err(if stderr.is_empty() { stdout } else { stderr })
    }
}

fn verify_git_worktree(path: &Path, label: &str) -> Result<(), String> {
    run_git(path, &["rev-parse", "--is-inside-work-tree"])
        .map(|_| ())
        .map_err(|e| format!("{} is not a readable git worktree: {}", label, e))
}

fn git_common_dir(path: &Path) -> Result<PathBuf, String> {
    let raw = run_git(path, &["rev-parse", "--git-common-dir"])?;
    let raw_path = PathBuf::from(raw);
    let common_dir = if raw_path.is_absolute() {
        raw_path
    } else {
        path.join(raw_path)
    };
    common_dir
        .canonicalize()
        .map_err(|e| format!("Failed to canonicalize git common dir for {}: {}", path.display(), e))
}

fn verify_same_repository(project_path: &Path, implementation_path: &Path) -> Result<(), String> {
    let project_common = git_common_dir(project_path)?;
    let implementation_common = git_common_dir(implementation_path)?;
    if project_common == implementation_common {
        Ok(())
    } else {
        Err("Implementation checkout is not registered to the same git repository as the project checkout.".to_string())
    }
}

fn verify_registered_worktree(project_path: &Path, implementation_path: &Path) -> Result<(), String> {
    let implementation_root = implementation_path
        .canonicalize()
        .map_err(|e| format!("Failed to canonicalize implementation path: {}", e))?;
    let output = run_git(project_path, &["worktree", "list", "--porcelain"])?;
    let registered = output.lines().any(|line| {
        let Some(path) = line.strip_prefix("worktree ") else {
            return false;
        };
        PathBuf::from(path)
            .canonicalize()
            .map(|candidate| candidate == implementation_root)
            .unwrap_or(false)
    });

    if registered {
        Ok(())
    } else {
        Err("Implementation checkout is not listed as a registered project worktree.".to_string())
    }
}

fn resolve_target_branch(project_path: &Path) -> Result<String, String> {
    if run_git(project_path, &["rev-parse", "--verify", "refs/heads/main"]).is_ok() {
        return Ok("main".to_string());
    }
    if run_git(project_path, &["rev-parse", "--verify", "refs/heads/master"]).is_ok() {
        return Ok("master".to_string());
    }

    let current = current_branch(project_path)?;
    if current == "main" || current == "master" {
        Ok(current)
    } else {
        Err("Landing target branch must be local main or master.".to_string())
    }
}

fn current_branch(path: &Path) -> Result<String, String> {
    run_git(path, &["branch", "--show-current"])
}

fn current_commit(path: &Path) -> Result<String, String> {
    run_git(path, &["rev-parse", "HEAD"])
}

fn is_dirty(path: &Path) -> Result<bool, String> {
    Ok(!run_git(path, &["status", "--porcelain"])?.is_empty())
}

fn same_path(left: &Path, right: &Path) -> bool {
    match (left.canonicalize(), right.canonicalize()) {
        (Ok(left), Ok(right)) => left == right,
        _ => left == right,
    }
}

fn sanitize_lock_id(id: &str) -> String {
    id.chars()
        .map(|ch| if ch.is_ascii_alphanumeric() || ch == '-' { ch } else { '_' })
        .collect()
}

fn sync_thread_from_item(item: &brain::QueueItem) {
    if let Ok(value) = serde_json::to_value(item) {
        let _ = crate::agent_thread::upsert_from_queue_value(&value);
    }
}
