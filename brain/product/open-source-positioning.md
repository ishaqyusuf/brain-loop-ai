# Open Source Positioning

## Purpose

Defines how Brain Loop should present itself as an opinionated open-source product.

## Position

Brain Loop is an opinionated, local-first desktop orchestrator for Brain automation. It is built for developers who want Codex-like visibility and control over implementation and review agents without moving project memory, queue state, approvals, logs, or worktree state into a hosted service.

The project should be open source in the sense that the control surface, state contracts, runner orchestration, and safety model are inspectable and forkable. It should stay opinionated in the sense that v1 chooses a narrow path for reliability instead of becoming a generic automation dashboard.

## Opinionated Defaults

- **Local-first state**: Durable state lives under `~/.brain-loop`. Global settings use `settings.toml`; queues, projects, approvals, threads, locks, worktrees, and run metadata remain JSON for Brain skill compatibility.
- **Queue-driven automation**: Work starts from Brain queue items, not free-form hidden agent prompts. Supported queue statuses and transitions stay explicit.
- **Capacity before cadence**: Automation fills available implementation and review agent slots from eligible local queue state instead of spending tokens on empty orchestration.
- **Separate implementation and review pools**: Implementation and review use separate capacity settings and run through distinct queue transitions.
- **Worktree isolation by default**: Task execution defaults to isolated per-task Git worktrees, with explicit settings for main-checkout or auto fallback behavior.
- **Auditable output**: Runner stdout/stderr streams to the UI and durable logs. Thread metadata links queue items, worktrees, approvals, artifacts, and transcripts.
- **Explicit approval**: Sensitive actions should request approval through the desktop broker and preserve approve/deny/expire history.
- **Codex-like UI**: The app favors a dark, dense, thread-oriented control surface over broad dashboard navigation.
- **Configurable, bounded runners**: Supported runners are currently `open-code`, `antigravity`, and `codex`; model lists and role defaults are configurable through settings.

## Extension Boundaries

Brain Loop should make it straightforward to add runner adapters, model defaults, and state readers without weakening the core contract. Extensions should preserve:

- local state ownership;
- explicit queue status transitions;
- durable logs and thread metadata;
- visible approval boundaries;
- safe disabled-project and capacity behavior.

New integrations should not bypass the approval broker, hide runner output, mutate unsupported queue statuses, or silently run in the main checkout when isolated execution is required.

## Not Supported In V1

- Hosted orchestration or remote state sync.
- Multi-user collaboration, organization accounts, or cloud permissions.
- Generic workflow automation unrelated to Brain queue items.
- Silent destructive actions by runner adapters.
- Automatic deletion of per-task worktrees, logs, queue items, or artifacts.
- Moving legacy Git worktrees from `.codex` into `~/.brain-loop`.
- Treating a successful review process exit as approval unless the review workflow writes a supported queue transition.
- Pixel-perfect screenshot automation as the only UI gate; current visual QA is a source/dist invariant harness plus manual review.

## Terminology Notes

`Brain Loop` and `runner` are the accepted product and execution terminology for v1. OpenCode, Antigravity, Codex, and future Claude support should be described as runners. Integration code that invokes those tools is a runner adapter. Provider is reserved for lower-level model/API providers behind a runner.

See ADR `brain/decisions/2026-06-15-product-name-runner-terminology.md`.

## Contributor Guidance

Contributors should prefer changes that strengthen the local-first, queue-first, auditable model. A feature is aligned when a user can answer:

- What queue item is this automation handling?
- Which runner/model/worktree is being used?
- What state file changed?
- Where is the transcript?
- Was user approval required, granted, denied, or expired?
- Can the user pause or inspect the system before more work launches?
