# Brain Handoff: Establish Workspace Validation And UI Foundation

## Status
Ready

## Source Plan
brain/plans/2026-06-12-cleanup-workspace-validation-ui-foundation.md

## Task
- Task Title: Establish Workspace Validation And UI Foundation
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: open-code
- Reason: Scaffolding, package scripts, and validation setup are focused implementation work.

## Goal
Make the repo reliable to install, typecheck, lint, build, and extend with Midday-style package boundaries and shadcn UI setup.

## Context To Read First
- brain/plans/2026-06-12-cleanup-workspace-validation-ui-foundation.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Inspect current package scripts and Tauri/Vite/Rust config.
2. Add missing baseline source folders that match `brain/engineering/repo-structure.md`.
3. Initialize or document shadcn usage with the project package runner and keep generated components in the desktop UI boundary unless a shared UI package is introduced intentionally.
4. Confirm `apps/desktop/src/main.tsx` and `apps/desktop/src/app.tsx` remain thin entrypoints.
5. Add or refine validation scripts only where they map to real checks.

## Acceptance Criteria
- Workspace install and narrow validation commands are documented and runnable.
- Desktop UI has a clear Midday-style folder baseline for components, sheets, forms, tables, sidebar, and shell layout.
- shadcn usage is initialized or explicitly documented as pending with the exact runner command.
- No unrelated product behavior is implemented in this foundation task.

## Files Or Areas Likely Involved
- `package.json`
- `turbo.json`
- `apps/desktop/package.json`
- `apps/desktop/src`
- `apps/desktop/src-tauri`
- `components.json` if shadcn is initialized
- `brain/engineering/repo-structure.md`
- `brain/engineering/coding-standards.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `bun run typecheck`
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- `cargo check` from `apps/desktop/src-tauri`

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-establish-workspace-validation-and-ui-foundation.json

## Brain Update Contract
After implementation, update only the relevant files:

- `brain/progress.md`: summarize completed implementation work.
- `brain/features/<feature>.md`: update if user-visible behavior changed.
- `brain/api/endpoints.md`: update if API routes changed.
- `brain/api/contracts.md`: update if request/response shapes changed.
- `brain/api/permissions.md`: update if auth or permissions changed.
- `brain/database/schema.md`: update if schema changed.
- `brain/database/migrations.md`: update if migrations changed.
- `brain/decisions/`: add an ADR only if an architecture decision was made.
- `brain/tasks/in-progress.md`: keep the task in progress.

Plan-specific Brain update requirements:
- Update `brain/engineering/repo-structure.md` if folders or package boundaries change.
- Update `brain/engineering/coding-standards.md` if validation or shadcn setup rules change.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes
Fill this in after implementation:

- Changed files:
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/sidebar.tsx`
  - `apps/desktop/src/components/sign-out.tsx`
  - `apps/desktop/src/components/sheets/global-sheets.tsx`
  - `apps/desktop/src/components/sheets/global-sheets-provider.tsx`
  - `apps/desktop/src/components/modals/.gitkeep`
  - `apps/desktop/src/components/tables/core/.gitkeep`
  - `apps/desktop/src/components/forms/.gitkeep`
  - `apps/desktop/src/components/onboarding/.gitkeep`
  - `apps/desktop/src/hooks/.gitkeep`
  - `apps/desktop/src/store/.gitkeep`
- Checks run:
  - `bun run typecheck --force` (all 3 workspaces compiled cleanly)
  - `bun --filter @brain-loop/desktop build` (vite build successfully generated dist/)
  - `cargo check` (command not found on host machine, skipped/blocked)
- Brain docs updated:
  - `brain/progress.md`
  - `brain/engineering/repo-structure.md`
  - `brain/engineering/coding-standards.md`
- Unresolved issues:
  - `cargo check` from `apps/desktop/src-tauri` is blocked because the Rust/Cargo toolchain is not installed on the host development environment.

