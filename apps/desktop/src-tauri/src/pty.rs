use portable_pty::{CommandBuilder, native_pty_system, PtySize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::thread;
use tauri::{AppHandle, Emitter, Manager, State};

pub struct PtySessionInfo {
    pub session_id: String,
    pub run_id: String,
    pub queue_item_id: Option<String>,
    pub execution_path: Option<String>,
    pub log_file_path: Option<String>,
    pub master: Box<dyn portable_pty::MasterPty + Send>,
    pub child: Arc<Mutex<Box<dyn portable_pty::Child + Send + Sync>>>,
}

pub struct PtyState {
    pub sessions: Mutex<HashMap<u32, PtySessionInfo>>,
}

impl PtyState {
    pub fn new() -> Self {
        PtyState {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PtySessionDurableMeta {
    pub session_id: String,
    pub run_id: String,
    pub queue_item_id: Option<String>,
    pub execution_path: Option<String>,
    pub command: String,
    pub args: Vec<String>,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub exit_code: Option<i32>,
    pub signal: Option<String>,
    pub log_file_path: Option<String>,
    pub status: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct PtyDataEvent {
    pid: u32,
    chunk: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PtySessionMetadata {
    pub pid: u32,
    pub session_id: String,
    pub run_id: String,
    pub queue_item_id: Option<String>,
    pub execution_path: Option<String>,
    pub log_file_path: Option<String>,
}

fn sanitize_id(id: &str) -> String {
    id.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' { c } else { '_' })
        .collect()
}

#[tauri::command]
pub fn spawn_pty(
    app: AppHandle,
    state: State<'_, PtyState>,
    run_id: String,
    queue_item_id: Option<String>,
    execution_path: Option<String>,
    command: String,
    args: Vec<String>,
    rows: u16,
    cols: u16,
) -> Result<PtySessionMetadata, String> {
    let pty_system = native_pty_system();
    
    let pair = pty_system.openpty(PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    }).map_err(|e| format!("Failed to open PTY: {}", e))?;
    
    let mut cmd = CommandBuilder::new(&command);
    cmd.args(&args);
    if let Some(ref path) = execution_path {
        cmd.cwd(path);
    }
    
    let child = pair.slave.spawn_command(cmd).map_err(|e| format!("Failed to spawn command: {}", e))?;
    let pid = child
        .process_id()
        .ok_or_else(|| "Failed to read spawned process id".to_string())?;
        
    let child_shared = Arc::new(Mutex::new(child));
    let child_for_thread = child_shared.clone();
    
    let reader = pair.master.try_clone_reader().map_err(|e| format!("Failed to clone PTY reader: {}", e))?;
    
    let session_id = format!("pty_{}_{}", sanitize_id(&run_id), pid);
    let log_file_name = format!("{}.log", session_id);
    let meta_file_name = format!("{}.json", session_id);
    let runs_dir = crate::state::manager_root().join("logs").join("runs");
    let _ = crate::state::ensure_dir(&runs_dir);
    let log_path = runs_dir.join(&log_file_name);
    let meta_path = runs_dir.join(&meta_file_name);
    
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|e| format!("Failed to open PTY log file: {}", e))?;
        
    let log_file_path = Some(log_path.to_string_lossy().into_owned());
    
    let started_at = chrono::Utc::now().to_rfc3339();
    let durable_meta = PtySessionDurableMeta {
        session_id: session_id.clone(),
        run_id: run_id.clone(),
        queue_item_id: queue_item_id.clone(),
        execution_path: execution_path.clone(),
        command: command.clone(),
        args: args.clone(),
        started_at,
        finished_at: None,
        exit_code: None,
        signal: None,
        log_file_path: log_file_path.clone(),
        status: "running".to_string(),
    };
    let _ = std::fs::write(&meta_path, serde_json::to_string_pretty(&durable_meta).unwrap_or_default());

    let metadata = PtySessionMetadata {
        pid,
        session_id: session_id.clone(),
        run_id: run_id.clone(),
        queue_item_id: queue_item_id.clone(),
        execution_path: execution_path.clone(),
        log_file_path: log_file_path.clone(),
    };

    state.sessions.lock().unwrap().insert(pid, PtySessionInfo {
        session_id,
        run_id: run_id.clone(),
        queue_item_id,
        execution_path,
        log_file_path,
        master: pair.master,
        child: child_shared,
    });
    
    let app_clone = app.clone();
    let mut durable_meta_clone = durable_meta.clone();
    let meta_path_clone = meta_path.clone();
    
    thread::spawn(move || {
        let mut reader = reader;
        let mut buf = [0u8; 1024];
        
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break, // EOF
                Ok(n) => {
                    let _ = file.write_all(&buf[..n]);
                    let chunk = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_clone.emit("pty-data", PtyDataEvent {
                        pid,
                        chunk,
                    });
                }
                Err(_) => break,
            }
        }
        
        let status = child_for_thread.lock().unwrap().wait().ok();
        let exit_code = status.map(|s| s.exit_code() as i32);
        
        durable_meta_clone.finished_at = Some(chrono::Utc::now().to_rfc3339());
        durable_meta_clone.exit_code = exit_code;
        durable_meta_clone.status = "completed".to_string();
        let _ = std::fs::write(&meta_path_clone, serde_json::to_string_pretty(&durable_meta_clone).unwrap_or_default());
        
        let _ = app_clone.emit("process-complete", crate::runner::ProcessCompleteEvent {
            run_id,
            exit_code,
            signal: None,
        });
        
        if let Some(state) = app_clone.try_state::<PtyState>() {
            state.sessions.lock().unwrap().remove(&pid);
        }
    });
    
    Ok(metadata)
}

#[tauri::command]
pub fn write_pty(
    state: State<'_, PtyState>,
    pid: u32,
    data: String,
) -> Result<(), String> {
    if let Some(info) = state.sessions.lock().unwrap().get_mut(&pid) {
        let mut writer = info.master.take_writer().map_err(|e| format!("Failed to take PTY writer: {}", e))?;
        writer.write_all(data.as_bytes()).map_err(|e| format!("Failed to write to PTY: {}", e))?;
        Ok(())
    } else {
        Err("PTY session not found".to_string())
    }
}

#[tauri::command]
pub fn resize_pty(
    state: State<'_, PtyState>,
    pid: u32,
    rows: u16,
    cols: u16,
) -> Result<(), String> {
    if let Some(info) = state.sessions.lock().unwrap().get_mut(&pid) {
        info.master.resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        }).map_err(|e| format!("Failed to resize PTY: {}", e))?;
        Ok(())
    } else {
        Err("PTY session not found".to_string())
    }
}

#[tauri::command]
pub fn close_pty(
    state: State<'_, PtyState>,
    pid: u32,
) -> Result<(), String> {
    if let Some(info) = state.sessions.lock().unwrap().remove(&pid) {
        let _ = info.child.lock().unwrap().kill();
        // MasterPty drops, which usually closes the session
        Ok(())
    } else {
        Err("PTY session not found".to_string())
    }
}
