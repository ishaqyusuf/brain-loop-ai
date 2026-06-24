# ADR: Project Brain Onboarding Policy

## Status
Accepted

## Date
2026-06-16

## Context
Many existing projects already have a `brain/` folder and agent instructions that require reading and updating Brain docs for meaningful work. New Brain Loop users may not have that workflow, and creating a `brain/` folder directly in their project could disrupt current project conventions.

## Decision
When creating a project from the desktop app, Brain Loop first checks the selected project folder for an existing `brain/` directory.

If `brain/` exists, the project is treated as project-local Brain storage. Brain Loop records that path and adds managed instruction blocks telling agents to read and update `brain/` for meaningful project tasks.

If `brain/` does not exist, Brain Loop creates external project Brain storage at:

```text
~/.brain-loop/project-brains/<project-id>/brain/
```

The app seeds minimal Brain and task files there, records the external path on the project record, and updates `AGENTS.md` or `AGENT.md` plus `CLAUDE.md` with managed instructions scoped to Brain Loop-managed, brain-related, planning, handoff, implementation, and review tasks. Ordinary non-Brain work should continue using the project's existing workflow unless the user or project instructions say otherwise.

Instruction file updates are idempotent and bounded by `<!-- brain-loop:start -->` and `<!-- brain-loop:end -->` markers so user-authored content is preserved.

## Consequences
- Existing Brain-native projects keep their current `brain/` folder as the source of truth.
- New projects can use Brain Loop without adding a `brain/` folder to the checkout.
- `projects.json` can persist optional `brainPath` and `brainStorage` metadata while remaining compatible with older records.
- Project creation now has explicit permission to write managed instruction blocks in selected project roots.
