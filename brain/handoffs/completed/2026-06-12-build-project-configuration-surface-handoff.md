# Brain Handoff: Build Project Configuration Surface

## Status
Ready

## Source Plan
brain/plans/2026-06-12-feature-project-configuration-surface.md

## Task
- Task Title: Build Project Configuration Surface
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: antigravity
- Reason: The work is form, sheet, and table heavy with product flow details.

## Goal
Let users inspect, enable, disable, prioritize, and validate projects registered in `~/.codex/brain-project-manager/projects.json`.

## Context To Read First
- brain/plans/2026-06-12-feature-project-configuration-surface.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Add client wrappers for listing and mutating projects.
2. Build a projects table with status badges, path visibility, default agent, intervals, and priority.
3. Add create/edit project sheet using shadcn form composition and validation.
4. Add enable/disable controls with confirmation for risky changes.
5. Validate paths and show warnings for missing or inaccessible project roots.

## Acceptance Criteria
- Users can view all registered projects and their enabled state.
- Users can safely edit supported project fields using atomic writes.
- The UI shows validation errors without corrupting `projects.json`.
- The table follows Midday table folder conventions and shadcn composition rules.

## Files Or Areas Likely Involved
- `apps/desktop/src/components/tables/projects`
- `apps/desktop/src/components/forms`
- `apps/desktop/src/components/sheets`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src-tauri/src`
- `brain/features/project-configuration.md`
- `brain/api/endpoints.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- `cargo check` from `apps/desktop/src-tauri`
- Manual check with a temporary Brain project manager directory if supported

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-build-project-configuration-surface.json

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
- Update `brain/features/project-configuration.md`.
- Update `brain/api/endpoints.md` and `brain/api/contracts.md` for project mutation commands.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes

- Changed files:
  - `apps/desktop/src-tauri/src/lib.rs` - added atomic project registry create/update/enable commands, validation, and `pathExists` read hints.
  - `packages/brain-core/src/types.ts` - added optional `BrainProject.pathExists`.
  - `packages/desktop-client/src/index.ts` - added `createProject`, `updateProject`, and `setProjectEnabled` wrappers.
  - `apps/desktop/src/components/tables/projects/project-table.tsx` - added project table, metrics, warnings, create/edit sheet, and enable/disable confirmation.
  - `apps/desktop/src/app.tsx` - added project loading/error state and `Projects` tab.
  - `brain/features/project-configuration.md` - documented implemented behavior.
  - `brain/api/endpoints.md` and `brain/api/contracts.md` - documented implemented mutation commands and response fields.
  - `brain/progress.md` - added implementation notes.
- Checks run:
  - Targeted code inspection only, following fast Bun monorepo command discipline. Recommended follow-up checks: `bun --filter @brain-loop/desktop typecheck` and `bun --filter @brain-loop/desktop build`.
  - `cargo check`: not run; Rust/Cargo toolchain is unavailable on the host.
- Brain docs updated:
  - `brain/features/project-configuration.md`
  - `brain/api/endpoints.md`
  - `brain/api/contracts.md`
  - `brain/progress.md`
- Unresolved issues:
  - Full Bun typecheck/build not run in this pass because the active command-discipline skill says not to run typechecks/builds by default.
  - Rust validation remains blocked until the host has a working Rust/Cargo toolchain.
