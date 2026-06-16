# System Overview

## Purpose

Tracks the core system concept and durable operating model.

## How To Use

- Update when the orchestration model changes.
- Link to deeper architecture notes when details grow.

## Template

### System Boundary

Brain Loop controls local automation and displays run state. It does not replace the Brain project manager JSON contract.

Brain Loop is local-first and opinionated: it uses `~/.brain-loop` as the state root, keeps settings in TOML, preserves operational records as JSON, and treats Brain queue items as the workflow contract.

### Primary Users

- Local developer running Brain automation.
- AI agents reading Brain docs before implementation.

### Product Boundary

Brain Loop is not a hosted orchestration service, generic automation dashboard, or replacement for project-specific Brain docs. Runner integrations must preserve local state, visible logs, explicit queue transitions, and approval boundaries.

### Terminology

- Product name: Brain Loop.
- Automation tools such as OpenCode, Antigravity, Codex, and future Claude support are runners.
- Integration code for invoking a runner is a runner adapter.
