# System Overview

## Purpose

Summarizes the Brain Loop system at a high level.

## Summary

Brain Loop is a local macOS desktop orchestrator for the global Brain automation system. It should provide a Codex-like control surface with threads, embedded terminals, run logs, approvals, project configuration, queue inspection, implementation dispatch, and review automation.

## Source Of Truth

The app reads and writes:

```text
~/.brain-loop/
  settings.toml
  projects.json
  approvals.json
  queues/handoffs/*.json
  orchestrations/*.json
  threads/*.json
  worktrees/
  locks/
  logs/
```

`settings.toml` is the only TOML state file. Queue items, projects, approvals, threads, locks, workspaces, and run metadata remain JSON for compatibility with Brain automation skills.

## Initial Product Shape

- Tauri v2 desktop shell.
- React/Vite control console.
- Rust orchestration core.
- Midday-style monorepo organization.
- Runners for `opencode`, `agy`, and Codex review.
