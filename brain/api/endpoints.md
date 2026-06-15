# API Endpoints

## Purpose

Tracks API and command endpoints.

## Tauri Commands

Planned command groups:

### Brain State

- `get_brain_status` (Implemented)
- `list_projects` (Implemented)
- `list_queue` (Implemented)
- `list_recent_logs` (Implemented)

### Project Configuration

- `create_project` (Implemented)
- `update_project` (Implemented)
- `set_project_enabled` (Implemented)

### Automation Control

- `start_automation` (Implemented)
- `pause_automation` (Implemented)
- `stop_automation` (Implemented)
- `get_scheduler_status` (Implemented)
- `run_implementation_once` (Implemented)
- `run_review_once` (Implemented)

### Logs And Threads

- `get_run_log`
- `open_thread_terminal`
- `send_terminal_input`
- `resize_terminal`
- `stop_thread_terminal`

### Approvals

- `list_approval_requests` (Implemented)
- `request_approval` (Implemented)
- `approve_request` (Implemented)
- `deny_request` (Implemented)
- `expire_request` (Implemented)

### LaunchAgent

- `get_launchagent_status`
- `install_launchagent`
- `uninstall_launchagent`

## Planning Notes

The exact command set may be refined during implementation, but commands should stay grouped by these product areas and documented when added.
