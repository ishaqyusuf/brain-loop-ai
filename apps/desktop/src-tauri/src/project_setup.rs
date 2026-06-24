use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

const MANAGED_START: &str = "<!-- brain-loop:start -->";
const MANAGED_END: &str = "<!-- brain-loop:end -->";

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectFolderInspectionInput {
    pub path: String,
    #[serde(default)]
    pub existing_project_ids: Vec<String>,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectFolderInspection {
    pub path: String,
    pub name: String,
    pub id: String,
    pub has_project_brain: bool,
    pub brain_path: String,
    pub brain_storage: String,
    pub instruction_files: Vec<String>,
}

pub(crate) fn inspect_project_folder(
    input: ProjectFolderInspectionInput,
) -> Result<ProjectFolderInspection, String> {
    let project_path = canonical_project_path(input.path.as_str())?;
    let name = infer_project_name(&project_path);
    let existing = input
        .existing_project_ids
        .into_iter()
        .map(|id| id.trim().to_string())
        .filter(|id| !id.is_empty())
        .collect::<HashSet<_>>();
    let id = unique_project_id(&slugify(&name), &existing);
    let (brain_path, brain_storage, has_project_brain) =
        resolve_brain_path(&project_path, id.as_str());
    let instruction_files = instruction_file_targets(&project_path)
        .into_iter()
        .map(|path| path.display().to_string())
        .collect();

    Ok(ProjectFolderInspection {
        path: project_path.display().to_string(),
        name,
        id,
        has_project_brain,
        brain_path: brain_path.display().to_string(),
        brain_storage,
        instruction_files,
    })
}

pub(crate) fn prepare_project_brain(
    project_id: &str,
    project_name: &str,
    project_path: &str,
) -> Result<(String, String), String> {
    let project_path = canonical_project_path(project_path)?;
    let (brain_path, brain_storage, has_project_brain) =
        resolve_brain_path(&project_path, project_id);

    if !has_project_brain {
        seed_external_brain(
            &brain_path,
            project_id,
            project_name,
            project_path.as_path(),
        )?;
    }

    upsert_instruction_files(
        &project_path,
        &brain_path,
        brain_storage.as_str(),
        project_name,
    )?;

    Ok((brain_path.display().to_string(), brain_storage))
}

pub(crate) fn infer_brain_fields(
    project_id: &str,
    project_path: &str,
    stored_brain_path: Option<&str>,
    stored_brain_storage: Option<&str>,
) -> (Option<String>, Option<String>, Option<bool>) {
    let project_path = match canonical_project_path(project_path) {
        Ok(path) => path,
        Err(_) => {
            return (
                stored_brain_path.map(str::to_string),
                stored_brain_storage.map(str::to_string),
                None,
            )
        }
    };

    let (inferred_path, inferred_storage, _) = resolve_brain_path(&project_path, project_id);
    let brain_path = stored_brain_path
        .filter(|path| !path.trim().is_empty())
        .map(PathBuf::from)
        .unwrap_or(inferred_path);
    let brain_storage = stored_brain_storage
        .filter(|storage| !storage.trim().is_empty())
        .map(str::to_string)
        .unwrap_or(inferred_storage);
    let exists = brain_path.exists();

    (
        Some(brain_path.display().to_string()),
        Some(brain_storage),
        Some(exists),
    )
}

fn canonical_project_path(path: &str) -> Result<PathBuf, String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("Project path is required.".to_string());
    }
    fs::canonicalize(trimmed)
        .map_err(|e| format!("Failed to resolve project folder {}: {}", trimmed, e))
}

fn resolve_brain_path(project_path: &Path, project_id: &str) -> (PathBuf, String, bool) {
    let project_brain = project_path.join("brain");
    if project_brain.is_dir() {
        return (project_brain, "project".to_string(), true);
    }

    (
        crate::state::manager_root()
            .join("project-brains")
            .join(safe_path_segment(project_id))
            .join("brain"),
        "external".to_string(),
        false,
    )
}

fn seed_external_brain(
    brain_path: &Path,
    project_id: &str,
    project_name: &str,
    project_path: &Path,
) -> Result<(), String> {
    crate::state::ensure_dir(brain_path)
        .map_err(|e| format!("Failed to create project Brain folder: {}", e))?;
    crate::state::ensure_dir(&brain_path.join("tasks"))
        .map_err(|e| format!("Failed to create project Brain tasks folder: {}", e))?;

    write_if_missing(
        &brain_path.join("BRAIN.md"),
        &format!(
            "# Brain\n\n## Project\n{}\n\n## Project ID\n{}\n\n## Source Project Path\n{}\n\n## Purpose\nDurable project memory for Brain Loop-managed planning, implementation, review, and brain-related tasks.\n",
            project_name,
            project_id,
            project_path.display()
        ),
    )?;
    write_if_missing(&brain_path.join("tasks").join("backlog.md"), "# Backlog\n")?;
    write_if_missing(&brain_path.join("tasks").join("in-progress.md"), "# In Progress\n")?;
    write_if_missing(&brain_path.join("tasks").join("done.md"), "# Done\n")?;
    write_if_missing(&brain_path.join("tasks").join("roadmap.md"), "# Roadmap\n")?;

    Ok(())
}

fn write_if_missing(path: &Path, content: &str) -> Result<(), String> {
    if path.exists() {
        return Ok(());
    }
    crate::atomic::atomic_write_string(path, content)
        .map_err(|e| format!("Failed to write {}: {}", path.display(), e))
}

fn upsert_instruction_files(
    project_path: &Path,
    brain_path: &Path,
    brain_storage: &str,
    project_name: &str,
) -> Result<(), String> {
    let instruction = managed_instruction_block(brain_path, brain_storage, project_name);
    for target in instruction_file_targets(project_path) {
        upsert_managed_block(&target, instruction.as_str())?;
    }
    Ok(())
}

fn instruction_file_targets(project_path: &Path) -> Vec<PathBuf> {
    let agents = project_path.join("AGENTS.md");
    let agent = project_path.join("AGENT.md");
    let mut targets = Vec::new();

    if agents.exists() {
        targets.push(agents);
    }
    if agent.exists() {
        targets.push(agent);
    }
    if targets.is_empty() {
        targets.push(project_path.join("AGENTS.md"));
    }
    targets.push(project_path.join("CLAUDE.md"));
    targets
}

fn managed_instruction_block(brain_path: &Path, brain_storage: &str, project_name: &str) -> String {
    let brain_path_text = if brain_storage == "project" {
        "brain/".to_string()
    } else {
        brain_path.display().to_string()
    };
    let scope = if brain_storage == "project" {
        "Before any meaningful task in this project, read the relevant files in `brain/`; after code, API, database, auth, permission, or product behavior changes, update the relevant Brain docs before finishing."
    } else {
        "For Brain Loop-managed, brain-related, planning, handoff, implementation, or review tasks, read and update this external Brain path. For ordinary work that is not brain-related, preserve the existing project workflow unless the user or project instructions say otherwise."
    };

    format!(
        "{start}\n## Brain Loop Project Memory\n\nProject: {project_name}\nBrain path: `{brain_path}`\nBrain storage: `{brain_storage}`\n\n{scope}\n{end}",
        start = MANAGED_START,
        project_name = project_name,
        brain_path = brain_path_text,
        brain_storage = brain_storage,
        scope = scope,
        end = MANAGED_END,
    )
}

fn upsert_managed_block(path: &Path, block: &str) -> Result<(), String> {
    let existing = fs::read_to_string(path).unwrap_or_default();
    let next = replace_or_append_block(existing.as_str(), block);
    crate::atomic::atomic_write_string(path, next.as_str())
        .map_err(|e| format!("Failed to update {}: {}", path.display(), e))
}

fn replace_or_append_block(existing: &str, block: &str) -> String {
    if let Some(start) = existing.find(MANAGED_START) {
        if let Some(end_offset) = existing[start..].find(MANAGED_END) {
            let end = start + end_offset + MANAGED_END.len();
            let mut next = String::new();
            next.push_str(existing[..start].trim_end());
            if !next.is_empty() {
                next.push_str("\n\n");
            }
            next.push_str(block);
            let trailing = existing[end..].trim_start();
            if !trailing.is_empty() {
                next.push_str("\n\n");
                next.push_str(trailing);
            }
            next.push('\n');
            return next;
        }
    }

    let mut next = existing.trim_end().to_string();
    if !next.is_empty() {
        next.push_str("\n\n");
    }
    next.push_str(block);
    next.push('\n');
    next
}

fn infer_project_name(project_path: &Path) -> String {
    package_json_name(project_path)
        .or_else(|| cargo_toml_name(project_path))
        .unwrap_or_else(|| {
            project_path
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("project")
                .to_string()
        })
}

fn package_json_name(project_path: &Path) -> Option<String> {
    let content = fs::read_to_string(project_path.join("package.json")).ok()?;
    let json = serde_json::from_str::<serde_json::Value>(&content).ok()?;
    json.get("name")
        .and_then(|name| name.as_str())
        .map(|name| name.trim_start_matches('@').replace('/', "-"))
        .filter(|name| !name.trim().is_empty())
}

fn cargo_toml_name(project_path: &Path) -> Option<String> {
    let content = fs::read_to_string(project_path.join("Cargo.toml")).ok()?;
    let value = toml::from_str::<toml::Value>(&content).ok()?;
    value
        .as_table()
        .and_then(|table| table.get("package"))
        .and_then(|package| package.as_table())
        .and_then(|package| package.get("name"))
        .and_then(|name| name.as_str())
        .map(str::to_string)
        .filter(|name| !name.trim().is_empty())
}

fn slugify(value: &str) -> String {
    let mut slug = String::new();
    let mut previous_dash = false;
    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() {
            slug.push(ch.to_ascii_lowercase());
            previous_dash = false;
        } else if !previous_dash {
            slug.push('-');
            previous_dash = true;
        }
    }
    let slug = slug.trim_matches('-').to_string();
    if slug.is_empty() {
        "project".to_string()
    } else {
        slug
    }
}

fn unique_project_id(base: &str, existing: &HashSet<String>) -> String {
    if !existing.contains(base) {
        return base.to_string();
    }

    for index in 2.. {
        let candidate = format!("{}-{}", base, index);
        if !existing.contains(candidate.as_str()) {
            return candidate;
        }
    }

    base.to_string()
}

fn safe_path_segment(value: &str) -> String {
    let segment = value
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.') {
                ch
            } else {
                '-'
            }
        })
        .collect::<String>()
        .trim_matches('-')
        .to_string();

    if segment.is_empty() {
        "project".to_string()
    } else {
        segment
    }
}
