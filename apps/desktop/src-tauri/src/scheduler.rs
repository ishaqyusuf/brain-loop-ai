use std::sync::Mutex;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SchedulerState {
    Stopped,
    Running,
    Paused,
    Error,
}

impl SchedulerState {
    pub fn as_str(&self) -> &'static str {
        match self {
            SchedulerState::Stopped => "stopped",
            SchedulerState::Running => "running",
            SchedulerState::Paused => "paused",
            SchedulerState::Error => "error",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "running" => SchedulerState::Running,
            "paused" => SchedulerState::Paused,
            "stopped" => SchedulerState::Stopped,
            _ => SchedulerState::Error,
        }
    }
}

pub struct Scheduler {
    pub state: Mutex<SchedulerState>,
    pub last_tick: Mutex<String>,
    pub tick_count: Mutex<u64>,
    pub skipped_ticks: Mutex<u64>,
    pub last_error: Mutex<Option<String>>,
}

impl Scheduler {
    pub fn new() -> Self {
        Scheduler {
            state: Mutex::new(SchedulerState::Stopped),
            last_tick: Mutex::new(String::new()),
            tick_count: Mutex::new(0),
            skipped_ticks: Mutex::new(0),
            last_error: Mutex::new(None),
        }
    }

    pub fn start(&self) -> Result<String, String> {
        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        if *state == SchedulerState::Running {
            return Err("Scheduler is already running".to_string());
        }
        *state = SchedulerState::Running;
        Ok("started".to_string())
    }

    pub fn pause(&self) -> Result<String, String> {
        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        if *state == SchedulerState::Paused {
            return Err("Scheduler is already paused".to_string());
        }
        *state = SchedulerState::Paused;
        Ok("paused".to_string())
    }

    pub fn stop(&self) -> Result<String, String> {
        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        *state = SchedulerState::Stopped;
        Ok("stopped".to_string())
    }

    pub fn get_state(&self) -> Result<String, String> {
        let state = self.state.lock().map_err(|e| e.to_string())?;
        Ok(state.as_str().to_string())
    }

    pub fn can_launch_work(&self, active_count: usize, max_running: usize) -> bool {
        active_count < max_running
    }

    pub fn record_tick(&self, detail: &str) -> Result<(), String> {
        let mut count = self.tick_count.lock().map_err(|e| e.to_string())?;
        *count += 1;
        let mut last = self.last_tick.lock().map_err(|e| e.to_string())?;
        *last = crate::atomic::utc_now_iso();
        log_decision(&format!("TICK: {}", detail));
        Ok(())
    }

    pub fn record_skip(&self, reason: &str) -> Result<(), String> {
        let mut skipped = self.skipped_ticks.lock().map_err(|e| e.to_string())?;
        *skipped += 1;
        let mut err = self.last_error.lock().map_err(|e| e.to_string())?;
        *err = Some(reason.to_string());
        log_decision(&format!("SKIP: {}", reason));
        Ok(())
    }

    pub fn status(&self) -> Result<SchedulerStatus, String> {
        let state = self.state.lock().map_err(|e| e.to_string())?;
        let last_tick = self.last_tick.lock().map_err(|e| e.to_string())?;
        let tick_count = self.tick_count.lock().map_err(|e| e.to_string())?;
        let skipped_ticks = self.skipped_ticks.lock().map_err(|e| e.to_string())?;
        let last_error = self.last_error.lock().map_err(|e| e.to_string())?;
        let capacity = read_agent_capacity();
        let queue_counts = count_queue_capacity_state();

        Ok(SchedulerStatus {
            state: state.as_str().to_string(),
            last_tick: last_tick.clone(),
            tick_count: *tick_count,
            skipped_ticks: *skipped_ticks,
            active_implementation_agents: queue_counts.active_implementation_agents,
            max_implementation_agents: capacity.max_implementation_agents,
            waiting_implementation_items: queue_counts.waiting_implementation_items,
            active_review_agents: queue_counts.active_review_agents,
            max_review_agents: capacity.max_review_agents,
            waiting_review_items: queue_counts.waiting_review_items,
            last_error: last_error.clone(),
        })
    }
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SchedulerStatus {
    pub state: String,
    pub last_tick: String,
    pub tick_count: u64,
    pub skipped_ticks: u64,
    pub active_implementation_agents: usize,
    pub max_implementation_agents: usize,
    pub waiting_implementation_items: usize,
    pub active_review_agents: usize,
    pub max_review_agents: usize,
    pub waiting_review_items: usize,
    pub last_error: Option<String>,
}

use std::sync::LazyLock;
pub static SCHEDULER: LazyLock<Scheduler> = LazyLock::new(Scheduler::new);

pub fn count_active_processes() -> usize {
    count_queue_capacity_state().active_implementation_agents
}

pub fn count_active_review_processes() -> usize {
    count_queue_capacity_state().active_review_agents
}

#[derive(Debug, Clone, Copy)]
struct AgentCapacity {
    max_implementation_agents: usize,
    max_review_agents: usize,
}

#[derive(Debug, Clone, Copy)]
struct QueueCapacityState {
    active_implementation_agents: usize,
    waiting_implementation_items: usize,
    active_review_agents: usize,
    waiting_review_items: usize,
}

fn count_queue_capacity_state() -> QueueCapacityState {
    let queues_dir = crate::state::queues_dir();
    if !queues_dir.exists() {
        return QueueCapacityState {
            active_implementation_agents: 0,
            waiting_implementation_items: 0,
            active_review_agents: 0,
            waiting_review_items: 0,
        };
    }

    let mut state = QueueCapacityState {
        active_implementation_agents: 0,
        waiting_implementation_items: 0,
        active_review_agents: 0,
        waiting_review_items: 0,
    };

    if let Ok(entries) = std::fs::read_dir(&queues_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file()
                && path.extension().map_or(false, |ext| ext == "json")
            {
                if let Ok(content) = std::fs::read_to_string(&path) {
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                        if let Some(status) = json.get("status").and_then(|v| v.as_str()) {
                            match status {
                                "picked" | "started" => {
                                    state.active_implementation_agents += 1;
                                }
                                "queued" | "reviewed-fix-request" => {
                                    state.waiting_implementation_items += 1;
                                }
                                "reviewing" => {
                                    state.active_review_agents += 1;
                                }
                                "submitted" => {
                                    state.waiting_review_items += 1;
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
    }

    state
}

pub fn read_max_running_processes() -> usize {
    read_agent_capacity().max_implementation_agents
}

pub fn read_max_review_agents() -> usize {
    read_agent_capacity().max_review_agents
}

pub fn read_max_picked_minutes() -> i64 {
    if let Some(settings) = read_settings_value() {
        if let Some(minutes) = settings
            .get("maxPickedMinutes")
            .and_then(|v| v.as_integer())
        {
            return minutes.max(1);
        }
    }
    30
}

pub fn read_capacity_poll_interval_seconds() -> u64 {
    if let Some(settings) = read_settings_value() {
        if let Some(seconds) = settings
            .get("capacityPollIntervalSeconds")
            .and_then(|v| v.as_integer())
        {
            return seconds.clamp(1, 60) as u64;
        }
    }
    5
}

fn read_agent_capacity() -> AgentCapacity {
    if let Some(settings) = read_settings_value() {
        let legacy_max = settings
            .get("maxRunningProcesses")
            .and_then(|v| v.as_integer())
            .unwrap_or(1)
            .max(1) as usize;
        let max_implementation_agents = settings
            .get("maxImplementationAgents")
            .and_then(|v| v.as_integer())
            .map(|value| value.max(1) as usize)
            .unwrap_or(legacy_max);
        let max_loop_global = settings
            .get("maxLoopPolicy")
            .and_then(|policy| policy.get("globalMax"))
            .and_then(|value| value.as_integer())
            .map(|value| value.max(1) as usize)
            .unwrap_or(max_implementation_agents);
        let max_review_agents = settings
            .get("maxReviewAgents")
            .and_then(|v| v.as_integer())
            .map(|value| value.max(1) as usize)
            .unwrap_or(1);

        return AgentCapacity {
            max_implementation_agents: std::cmp::min(max_implementation_agents, max_loop_global),
            max_review_agents,
        };
    }
    AgentCapacity {
        max_implementation_agents: 1,
        max_review_agents: 1,
    }
}

pub fn read_implementation_interval() -> u64 {
    if let Some(settings) = read_settings_value() {
        if let Some(interval) = settings
            .get("defaultImplementationIntervalMinutes")
            .and_then(|v| v.as_integer())
        {
            return interval.max(1) as u64;
        }
    }
    2
}

fn read_settings_value() -> Option<toml::Value> {
    let _ = crate::state::ensure_state_root();
    let settings_path = crate::state::settings_path();
    let content = std::fs::read_to_string(settings_path).ok()?;
    toml::from_str::<toml::Value>(&content).ok()
}

pub fn log_decision(message: &str) {
    use std::io::Write;
    let log_file = crate::state::manager_root().join("logs").join("scheduler.log");
    if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(log_file) {
        let now = crate::atomic::utc_now_iso();
        let _ = writeln!(file, "[{}] {}", now, message);
    }
}
