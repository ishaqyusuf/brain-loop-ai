# AI Rules

## Purpose

Gives AI agents project-specific working rules.

## Rules

- Read Brain docs before implementation.
- Preserve Brain queue/project/thread JSON compatibility with existing skills while using `~/.brain-loop/settings.toml` for global settings.
- Keep app automation behavior aligned with `brain-loop`, `brain-project-manager`, `brain-work-from-handoff`, and `brain-review-handoff`.
- Do not move queue items to unsupported statuses without updating the Brain contract.
- Do not hide runner output; every run should be auditable.
