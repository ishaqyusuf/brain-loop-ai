# Brain Fix Handoff: Implement Rust Brain State Readers

## Status
Ready

## Source Review
brain/reviews/2026-06-12-implement-rust-brain-state-readers-review.md

## Original Handoff
brain/handoffs/ready/2026-06-12-implement-rust-brain-state-readers-handoff.md

## Source Plan
brain/plans/2026-06-12-feature-rust-brain-state-readers.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-implement-rust-brain-state-readers.json

## Goal
Fix only the blocking read-command contract issues found in review.

## Fix Items
1. Fix `packages/desktop-client/src/index.ts` so `getBrainStatus` matches the actual Tauri response casing, or change the Rust serialization contract and docs consistently. Prefer keeping the public `BrainStatus` shape camelCase and making the native response type match it.
2. Change `list_queue` to report malformed queue files in a typed response without breaking valid queue items. One acceptable shape is `{ items: QueueItem[]; errors: QueueReadError[] }`, with filename/path and parse error message.
3. Update `packages/brain-core/src/types.ts`, exports, `packages/desktop-client/src/index.ts`, `brain/api/contracts.md`, and `brain/features/brain-state.md` to document and expose the queue response/error shape.
4. Update `brain/progress.md` with fix completion notes.
5. Run required checks. If Cargo is still unavailable, clearly record `cargo check` as blocked by missing Cargo rather than passed.

## Context To Read First
- brain/reviews/2026-06-12-implement-rust-brain-state-readers-review.md
- brain/handoffs/ready/2026-06-12-implement-rust-brain-state-readers-handoff.md
- brain/plans/2026-06-12-feature-rust-brain-state-readers.md
- apps/desktop/src-tauri/src/lib.rs
- packages/desktop-client/src/index.ts
- packages/brain-core/src/types.ts
- brain/api/contracts.md
- brain/features/brain-state.md

## Acceptance Criteria
- `getBrainStatus` returns defined `implementationStatus`, `reviewStatus`, and count fields when Rust returns the current camelCase response.
- `listQueue` callers can see valid queue items and parse/read errors for invalid queue files.
- Response shapes are documented in Brain docs.
- TypeScript checks pass.
- `cargo check` is run if Cargo is available; otherwise the missing Cargo blocker is explicitly recorded.

## Do Not Change
- Do not broaden the original scope.
- Do not move the task to done.
- Do not implement queue mutation features in this fix.
- Do not normalize or rewrite existing global queue files.

## Required Checks
- `bun --filter @brain-loop/desktop-client typecheck`
- `bun --filter @brain-loop/desktop typecheck`
- `cargo check` from `apps/desktop/src-tauri`, or explicit blocked note if Cargo is unavailable

## Brain Update Contract
- Update `brain/progress.md` with fix completion notes.
- Update `brain/api/contracts.md` and `brain/features/brain-state.md` for response shape changes.
- Keep the task in `brain/tasks/in-progress.md`.

## Completion Notes

- Changed files:
  - `apps/desktop/src-tauri/src/lib.rs` - changed `list_queue` to return `QueueListResponse { items, errors }`, reporting malformed/unreadable queue files without dropping valid items.
  - `packages/brain-core/src/types.ts` - added `QueueReadError` and `QueueListResponse`.
  - `packages/brain-core/src/index.ts` - exported queue response/error types.
  - `packages/desktop-client/src/index.ts` - changed `listQueue()` to return `QueueListResponse`.
  - `apps/desktop/src/app.tsx` - updated queue loading to render valid items and surface queue read errors.
  - `brain/api/contracts.md` - documented queue read error and response shape.
  - `brain/features/brain-state.md` - documented tolerant queue response behavior.
  - `brain/progress.md` - added Fix 1 completion notes.
- Checks run:
  - Targeted code inspection only, following fast Bun monorepo command discipline. Recommended follow-up checks: `bun --filter @brain-loop/desktop-client typecheck` and `bun --filter @brain-loop/desktop typecheck`.
  - `cargo check`: not run; Rust/Cargo toolchain is unavailable on the host.
- Brain docs updated:
  - `brain/api/contracts.md`
  - `brain/features/brain-state.md`
  - `brain/progress.md`
- Unresolved issues:
  - Full Bun typechecks not run in this pass because the active command-discipline skill says not to run typechecks by default.
  - Rust validation remains blocked until the host has a working Rust/Cargo toolchain.
