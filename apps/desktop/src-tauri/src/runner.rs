use crate::state;
use std::fs::OpenOptions;
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};
use std::thread;
use tauri::{AppHandle, Emitter};

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEvent {
    pub line: String,
    pub stream: String,
    pub run_id: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessCompleteEvent {
    pub run_id: String,
    pub exit_code: Option<i32>,
    pub signal: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunMetadata {
    pub queue_item_id: Option<String>,
    pub project_id: Option<String>,
    pub agent: Option<String>,
    pub command: String,
    pub args: Vec<String>,
    pub cwd: Option<String>,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub exit_code: Option<i32>,
    pub signal: Option<String>,
    pub log_file_path: String,
    pub status: String,
    pub error: Option<String>,
}

fn sanitize_id(id: &str) -> String {
    id.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' { c } else { '_' })
        .collect()
}

fn make_log_name(run_id: &str, queue_item_id: &Option<String>, project_id: &Option<String>, agent: &Option<String>) -> String {
    let safe_run = if run_id.is_empty() { "unknown".to_string() } else { sanitize_id(run_id) };
    let ts = chrono::Utc::now().format("%Y%m%dT%H%M%S").to_string();
    
    let mut parts = vec![ts, safe_run];
    
    if let Some(ref qid) = queue_item_id {
        let short_qid = if qid.len() > 40 { format!("{}", sanitize_id(&qid[..40])) } else { sanitize_id(qid) };
        parts.push(short_qid);
    }
    if let Some(ref pid) = project_id {
        parts.push(sanitize_id(pid));
    }
    if let Some(ref a) = agent {
        parts.push(sanitize_id(a));
    }
    
    format!("{}.log", parts.join("_"))
}

#[tauri::command]
pub fn run_process(
    app: AppHandle,
    command: String,
    args: Vec<String>,
    cwd: Option<String>,
    queue_item_id: Option<String>,
    project_id: Option<String>,
    agent: Option<String>,
    run_id: String,
) -> Result<String, String> {
    let log_file_name = make_log_name(&run_id, &queue_item_id, &project_id, &agent);
    let meta_file_name = log_file_name.replace(".log", ".json");

    let runs_dir = state::manager_root().join("logs").join("runs");
    if let Err(e) = state::ensure_dir(&runs_dir) {
        return Err(format!("Failed to create runs dir: {}", e));
    }

    let log_path = runs_dir.join(&log_file_name);
    let meta_path = runs_dir.join(&meta_file_name);

    let mut cmd = Command::new(&command);
    cmd.args(&args)
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());

    if let Some(ref d) = cwd {
        cmd.current_dir(d);
    }

    let started_at = crate::atomic::utc_now_iso();

    match cmd.spawn() {
        Ok(mut child) => {
            let stdout = child.stdout.take().unwrap();
            let stderr = child.stderr.take().unwrap();

            let file = OpenOptions::new()
                .create(true)
                .append(true)
                .open(&log_path)
                .map_err(|e| e.to_string())?;

            let file_err = file.try_clone().map_err(|e| e.to_string())?;

            let mut initial_meta = RunMetadata {
                queue_item_id: queue_item_id.clone(),
                project_id: project_id.clone(),
                agent: agent.clone(),
                command: command.clone(),
                args: args.clone(),
                cwd: cwd.clone(),
                started_at: started_at.clone(),
                finished_at: None,
                exit_code: None,
                signal: None,
                log_file_path: log_path.to_string_lossy().into_owned(),
                status: "started".to_string(),
                error: None,
            };
            let _ = std::fs::write(&meta_path, serde_json::to_string(&initial_meta).unwrap());

            let app_clone = app.clone();
            let run_id_clone = run_id.clone();
            thread::spawn(move || {
                let reader = BufReader::new(stdout);
                let mut f = file;
                for line in reader.lines() {
                    if let Ok(l) = line {
                        let _ = writeln!(f, "{}", l);
                        let _ = app_clone.emit(
                            "process-log",
                            LogEvent {
                                line: l,
                                stream: "stdout".to_string(),
                                run_id: run_id_clone.clone(),
                            },
                        );
                    }
                }
            });

            let app_clone2 = app.clone();
            let run_id_clone2 = run_id.clone();
            thread::spawn(move || {
                let reader = BufReader::new(stderr);
                let mut f = file_err;
                for line in reader.lines() {
                    if let Ok(l) = line {
                        let _ = writeln!(f, "{}", l);
                        let _ = app_clone2.emit(
                            "process-log",
                            LogEvent {
                                line: l,
                                stream: "stderr".to_string(),
                                run_id: run_id_clone2.clone(),
                            },
                        );
                    }
                }
            });

            thread::spawn(move || {
                let status_res = child.wait();
                let finished_at = crate::atomic::utc_now_iso();
                let mut exit_code = None;
                
                if let Ok(status) = status_res {
                    exit_code = status.code();
                }

                initial_meta.finished_at = Some(finished_at);
                initial_meta.exit_code = exit_code;
                initial_meta.status = "completed".to_string();

                let _ = std::fs::write(&meta_path, serde_json::to_string(&initial_meta).unwrap());

                let _ = app.emit("process-complete", ProcessCompleteEvent {
                    run_id,
                    exit_code,
                    signal: None,
                });
            });

            Ok("Process started".to_string())
        }
        Err(e) => {
            let error_msg = format!("Failed to spawn process: {}", e);
            let meta = RunMetadata {
                queue_item_id: queue_item_id.clone(),
                project_id: project_id.clone(),
                agent: agent.clone(),
                command: command.clone(),
                args: args.clone(),
                cwd: cwd.clone(),
                started_at,
                finished_at: Some(crate::atomic::utc_now_iso()),
                exit_code: None,
                signal: None,
                log_file_path: log_path.to_string_lossy().into_owned(),
                status: "blocked".to_string(),
                error: Some(error_msg.clone()),
            };
            let _ = std::fs::write(&meta_path, serde_json::to_string(&meta).unwrap());

            if let Some(qid) = &queue_item_id {
                if let Ok(Some(mut item)) = crate::brain::read_queue_item(qid) {
                    let _ = crate::brain::update_queue_item_status(
                        &mut item,
                        "blocked",
                        "runner",
                        Some(&error_msg),
                        Some("spawn_failed"),
                        Some(&error_msg),
                    );
                    let _ = crate::brain::write_queue_item(&item);
                }
            }

            Err(error_msg)
        }
    }
}

#[tauri::command]
pub fn read_log_file(file_name: String) -> Result<String, String> {
    if file_name.contains('/') || file_name.contains('\\') {
        return Err("Invalid file name: path separators not allowed".to_string());
    }
    if file_name.contains("..") {
        return Err("Invalid file name: parent traversal not allowed".to_string());
    }
    if file_name.starts_with('/') || file_name.starts_with('\\') {
        return Err("Invalid file name: absolute paths not allowed".to_string());
    }
    if !file_name.ends_with(".log") {
        return Err("Invalid file name: only .log files can be read".to_string());
    }
    if file_name.is_empty() {
        return Err("Invalid file name: empty".to_string());
    }

    let runs_dir = state::manager_root().join("logs").join("runs");
    let log_path = runs_dir.join(&file_name);

    let canonical = log_path.canonicalize()
        .map_err(|_| format!("Log file not found or inaccessible: {}", file_name))?;

    let canonical_runs = runs_dir.canonicalize()
        .map_err(|_| "Runs directory not accessible".to_string())?;

    if !canonical.starts_with(&canonical_runs) {
        return Err(format!("Access denied: file outside runs directory"));
    }

    std::fs::read_to_string(&canonical)
        .map_err(|e| format!("Failed to read log file: {}", e))
}
