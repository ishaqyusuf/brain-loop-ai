# ADR: Brain Loop State Root And Settings TOML

## Status
Accepted

## Date
2026-06-15

## Context
Brain Loop previously used `~/.codex/brain-project-manager` for durable orchestration state, including `settings.json`, project registry files, queue items, workspaces, logs, locks, and thread metadata. That tied an open-source product surface to a private Codex-specific folder and made settings harder to edit by hand.

## Decision
Brain Loop uses `~/.brain-loop` as the default durable state root.

The global settings file is `~/.brain-loop/settings.toml`. Project registry, queue items, workspace registry, thread metadata, locks, logs, and run metadata remain JSON files for compatibility with existing Brain automation contracts.

On startup or command access, the desktop app prepares `~/.brain-loop` and migrates missing non-worktree state from `~/.codex/brain-project-manager`. Legacy `settings.json` is converted to `settings.toml`. Legacy Git worktrees are not copied or moved automatically because moving worktrees can break Git metadata and active queue references.

## Consequences
- New Brain Loop installations write state under `~/.brain-loop`.
- Existing installations can continue from legacy projects, queues, logs, locks, threads, and workspaces after one-time migration.
- Existing queue/workspace records may still reference legacy worktree paths until those items complete or are explicitly repaired.
- Skills and docs must refer to `~/.brain-loop` and `settings.toml` for management state, while skill loader paths under `~/.codex/skills` remain unchanged.
