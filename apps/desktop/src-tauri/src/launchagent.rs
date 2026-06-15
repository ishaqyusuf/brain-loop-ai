use std::io;
use std::path::PathBuf;

const LAUNCH_AGENTS_DIR: &str = "Library/LaunchAgents";
const PLIST_LABEL: &str = "dev.brain-loop.helper";
const PLIST_FILENAME: &str = "dev.brain-loop.helper.plist";

#[derive(Debug, Clone, Copy, PartialEq, serde::Serialize)]
#[serde(rename_all = "snake_case")]
pub enum LaunchAgentStatus {
    NotInstalled,
    Installed,
    Loaded,
    Error,
}

impl LaunchAgentStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            LaunchAgentStatus::NotInstalled => "not_installed",
            LaunchAgentStatus::Installed => "installed",
            LaunchAgentStatus::Loaded => "loaded",
            LaunchAgentStatus::Error => "error",
        }
    }
}

fn home_dir() -> PathBuf {
    PathBuf::from(std::env::var("HOME").unwrap_or_else(|_| "/Users/unknown".to_string()))
}

fn launch_agents_dir() -> PathBuf {
    home_dir().join(LAUNCH_AGENTS_DIR)
}

fn plist_path() -> PathBuf {
    launch_agents_dir().join(PLIST_FILENAME)
}

fn render_plist() -> String {
    let helper_path = std::env::current_exe()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|_| "/Applications/Brain Loop.app/Contents/MacOS/brain-loop-desktop".to_string());

    format!(
        r###"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>{label}</string>
    <key>ProgramArguments</key>
    <array>
        <string>{helper_path}</string>
        <string>--background</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>{log_dir}/launchagent-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>{log_dir}/launchagent-stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>BRAIN_LOOP_BACKGROUND</key>
        <string>1</string>
    </dict>
</dict>
</plist>"###,
        label = PLIST_LABEL,
        helper_path = helper_path,
        log_dir = crate::state::logs_dir().to_string_lossy(),
    )
}

pub fn status() -> LaunchAgentStatus {
    let plist = plist_path();
    if !plist.exists() {
        return LaunchAgentStatus::NotInstalled;
    }

    match std::process::Command::new("launchctl")
        .args(["list", PLIST_LABEL])
        .output()
    {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if stdout.contains("PID") {
                LaunchAgentStatus::Loaded
            } else {
                LaunchAgentStatus::Installed
            }
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            eprintln!("launchctl list {} failed: {}", PLIST_LABEL, stderr);
            LaunchAgentStatus::Error
        }
        Err(e) => {
            eprintln!("launchctl list {} error: {}", PLIST_LABEL, e);
            LaunchAgentStatus::Error
        }
    }
}

pub fn install_plist() -> io::Result<String> {
    let dir = launch_agents_dir();
    if !dir.exists() {
        std::fs::create_dir_all(&dir)?;
    }

    let plist_content = render_plist();
    let plist = plist_path();
    std::fs::write(&plist, plist_content.as_bytes())?;

    Ok(format!("LaunchAgent plist installed at {}", plist.display()))
}

pub fn load_agent() -> io::Result<String> {
    let plist = plist_path();
    if !plist.exists() {
        install_plist()?;
    }

    let output = std::process::Command::new("launchctl")
        .args(["load", "-w"])
        .arg(&plist)
        .output()?;

    if output.status.success() {
        Ok("LaunchAgent loaded".to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(io::Error::new(
            io::ErrorKind::Other,
            format!("launchctl load failed: {}", stderr),
        ))
    }
}

pub fn unload_agent() -> io::Result<String> {
    let plist = plist_path();
    if !plist.exists() {
        return Ok("LaunchAgent not installed; nothing to unload".to_string());
    }

    let output = std::process::Command::new("launchctl")
        .args(["unload", "-w"])
        .arg(&plist)
        .output()?;

    if output.status.success() {
        Ok("LaunchAgent unloaded".to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(io::Error::new(
            io::ErrorKind::Other,
            format!("launchctl unload failed: {}", stderr),
        ))
    }
}

pub fn remove_plist() -> io::Result<String> {
    let plist = plist_path();
    if plist.exists() {
        let _ = unload_agent();
        std::fs::remove_file(&plist)?;
        Ok("LaunchAgent plist removed".to_string())
    } else {
        Ok("No LaunchAgent plist to remove".to_string())
    }
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LaunchAgentInfo {
    pub status: String,
    pub status_label: String,
    pub plist_path: String,
    pub v2_deferred: bool,
    pub message: String,
}

pub fn info() -> LaunchAgentInfo {
    let current_status = status();
    LaunchAgentInfo {
        status: current_status.as_str().to_string(),
        status_label: match current_status {
            LaunchAgentStatus::NotInstalled => "Not Installed".to_string(),
            LaunchAgentStatus::Installed => "Installed (not running)".to_string(),
            LaunchAgentStatus::Loaded => "Installed & Loaded".to_string(),
            LaunchAgentStatus::Error => "Error".to_string(),
        },
        plist_path: plist_path().to_string_lossy().into_owned(),
        v2_deferred: true,
        message: "LaunchAgent helper is deferred to v2. Install, load, unload, and remove operations are available as Tauri commands but the v1 desktop app relies on tray-icon persistence for background automation.".to_string(),
    }
}
