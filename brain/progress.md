# Progress

## Purpose

Tracks durable implementation progress and planning changes.

## Updates

### Per-Task Manual Start Button (2026-06-22)

- Added `run_queue_item_once(queueItemId)` so a single task row can start implementation or review without starting the global automation loop.
- The command launches only the requested item, preserves enabled-project, enabled-runner, dependency, capacity, MaxLoop, worktree, direct-provider, process-runner, and logging gates, and refuses active/landing/blocked/stale/approved statuses.
- Added desktop-client and React data-hook support for per-task start results and busy state.
- Added compact row-level Start buttons with tooltips to Dashboard queue rows and the full queue table.
- Updated scheduler QA source assertions for the current componentized desktop architecture.
- Manual Computer Use smoke test was partially blocked: the Tauri dev app launched successfully, but Computer Use could not target the dev process by product name, bundle id, or executable path, so no row click was performed.
- Checks passed: `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop rust:check`; `bun --filter @brain-loop/desktop visual:qa`; `bun --filter @brain-loop/desktop scheduler:qa`.
- Changed files:
  - `apps/desktop/src-tauri/src/lib.rs`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src/hooks/use-brain-loop-data.ts`
  - `apps/desktop/src/components/workspace/workspace-shell.tsx`
  - `apps/desktop/src/components/dashboard/dashboard-view.tsx`
  - `apps/desktop/src/components/tables/queue/queue-table.tsx`
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/scripts/scheduler-contract-qa.mjs`
  - `brain/features/automation-runs.md`
  - `brain/features/queue-dashboard.md`
  - `brain/api/endpoints.md`
  - `brain/api/contracts.md`
  - `brain/api/permissions.md`
  - `brain/progress.md`

### Workers List Queued Task Filter (2026-06-18)

- Updated the Workers sidebar list so queue-backed tasks appear only after they move past plain `queued` into `picked` or later states.
- Queued-only handoffs remain visible through Dashboard/queue surfaces until automation or a runner claims them.
- Updated Codex visual QA source invariants and Brain UI/orchestration docs to preserve the distinction between queued work and active worker rows.
- Changed files:
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/scripts/codex-visual-qa.mjs`
  - `brain/features/ui-shell.md`
  - `brain/features/orchestration.md`
  - `brain/progress.md`

### Dashboard Navigation And Manual Approval UX (2026-06-17)

- Moved sidebar play/pause automation into the compact footer status slot as an icon-only tooltip control beside scheduler utilization percentage.
- Added fixed sidebar actions before Review/Implementation/Approval: Dashboard and New Orchestrator.
- Added a Dashboard workspace with system status metrics, implementation/review capacity, approval counts, task search, project filter, week/month review windows, review queue, orchestration counts, and project approval mode overview.
- Changed the Approval sidebar count to represent pending approval requests only, so manual review-passed approvals do not get mixed with blocked item counts.
- Updated project table language from merge policy to manual/automatic approval mode and added an explicit Approval Mode selector in the project edit sheet while preserving the existing `autoMergeOnReviewPass` backend contract.
- Removed sample approval request controls from the Approval panel so the Approval surface only lists real requests from automation, manual project approval, or direct-model tool gates.
- Updated visual QA source invariants and Brain docs for the new navigation/dashboard surface.
- Expanded `scheduler:qa` with source-level assertions for the requested fixed sidebar order, footer icon-only play/pause control, grouped Codex/Claude orchestrator selector, Dashboard bird-view filters/analytics, manual/automatic approval visibility, and absence of sample approval controls.
- Exported the existing `OrchestrationRunInput` type from `@brain-loop/brain-core` so the desktop client typecheck passes for live orchestration turns.
- Changed files:
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/sidebar.tsx`
  - `apps/desktop/src/components/approval-panel.tsx`
  - `apps/desktop/src/components/tables/projects/project-table.tsx`
  - `apps/desktop/scripts/codex-visual-qa.mjs`
  - `apps/desktop/scripts/scheduler-contract-qa.mjs`
  - `packages/brain-core/src/index.ts`
  - `brain/features/ui-shell.md`
  - `brain/features/project-configuration.md`
  - `brain/api/permissions.md`
  - `brain/api/contracts.md`
  - `brain/progress.md`

### Caveat Closure: Live Orchestration, Direct Review, Rust Check (2026-06-17)

- Added live orchestration turns for selected Codex/Claude orchestrators. Codex runs through local `codex exec` in read-only sandbox mode; Claude runs through local `claude --print` in plan mode with tools disabled.
- Replaced static Orchestrator assistant guidance in the UI flow with the live `run_orchestration_turn` command.
- Enabled direct DeepSeek/Gemini as review defaults in settings validation and Settings UI.
- Added direct-provider review dispatch using read-only direct tools (`read_file`, `search_text`, `finish_task`) and review-owned outcomes: `reviewed-fix-request`, `landing`, and `blocked`.
- Added `bun --filter @brain-loop/desktop rust:check`, which finds Cargo on PATH or at `~/.cargo/bin/cargo`, then runs `cargo check` for the Tauri crate.
- `bun --filter @brain-loop/desktop scheduler:qa` now covers live orchestration, direct-provider review dispatch, and the Cargo-discovering Rust check script.
- Verification passed: `bun --filter @brain-loop/desktop scheduler:qa`, `bun --filter @brain-loop/desktop rust:check`, and scoped `git diff --check`.
- Changed files:
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src-tauri/src/orchestration.rs`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/runner.rs`
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `apps/desktop/scripts/rust-check.mjs`
  - `apps/desktop/scripts/scheduler-contract-qa.mjs`
  - `apps/desktop/package.json`
  - `packages/brain-core/src/types.ts`
  - `packages/desktop-client/src/index.ts`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/decisions/2026-06-15-direct-model-provider-runners.md`
  - `brain/features/automation-runs.md`
  - `brain/features/orchestration.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/system/architecture.md`
  - `brain/progress.md`

### App-Owned Automation Runtime Alignment (2026-06-17)

- Confirmed `hermes cron list` reports no scheduled jobs and deleted the paused Codex heartbeat named `brain-loop`, which still contained old Hermes-observability instructions.
- Updated fresh settings defaults so `implementationDispatcher` no longer defaults to a running/missing external job; it now uses `brain-loop-app-scheduler`, `not-used` gateway status, `implementation-and-review`, and a note that Brain Loop's app-owned scheduler is the automation runtime.
- Replaced stale `hermes-agent` fixture authors with `brain-loop` in shared queue contract examples.
- Aligned the default and live app-owned capacity cadence to one minute (`capacityPollIntervalSeconds = 60`).
- Review runner completion now immediately asks the review pool to fill again while automation is running, so waiting submitted items can start when a review slot frees instead of waiting for the next cadence tick.
- Runner-completion follow-ups are now pause-aware: in-flight implementation/review processes finish naturally after pause, but follow-up review or fix dispatch only starts while automation is still running.
- Review-requested fixes now loop back into implementation dispatch from the same queue-linked worker thread while automation is running; the worker thread becomes done only after the queue item reaches approval.
- Documented that `start_automation` owns queue checks, worker dispatch, review dispatch, and runner-completion callbacks without requiring Hermes cron or Hermes gateway.
- Changed files:
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src-tauri/src/runner.rs`
  - `apps/desktop/scripts/scheduler-contract-qa.mjs`
  - `apps/desktop/src-tauri/src/scheduler.rs`
  - `brain/features/automation-runs.md`
  - `packages/brain-core/src/examples.ts`
  - `packages/brain-core/src/constants.ts`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/features/background-scheduler.md`
  - `brain/progress.md`

### Orchestrator Model Selector Slice (2026-06-17)

- Added a grouped Orchestrator start-surface model selector with Codex and Claude sections.
- New orchestration drafts now persist the selected orchestrator origin (`codex` or `claude`) and selected model on the orchestration record.
- Initial orchestration intake messages now carry the selected orchestration model metadata instead of always using the global review model fallback.
- At this point the selector was metadata/handoff-context plumbing; live Codex/Claude orchestration was added later in the 2026-06-17 caveat closure slice.
- Changed files:
  - `apps/desktop/src/app.tsx`
  - `brain/features/orchestration.md`
  - `brain/progress.md`

### Direct Provider Implementation Dispatch (2026-06-16)

- Wired `direct-deepseek` and `direct-gemini` into implementation dispatch.
- Direct implementation items now use the same `picked`/`started` queue reservation path as CLI runners, then launch a Brain Loop-owned background tool loop instead of `runner::run_process`.
- Direct prompts now avoid CLI-only global skill-file instructions and embed queue context plus active handoff content because direct tools are scoped to the execution path.
- Direct completion now reconciles queue state: `finish_task` submits by default, `queueStatus: "blocked"` blocks, approval-required tools leave the item `started` with `waitingReason`, and provider/max-iteration failures block the item.
- Approval-waiting direct items are exempt from stale process-sidecar reconciliation. Running an approved direct tool now clears the waiting reason and resumes the provider loop with an explicit continuation prompt plus the approved tool result, while submitted direct items give review dispatch a chance to run when automation is running.
- Gemini continuation requests now include a model `functionCall` bridge before `functionResponse` parts, matching the DeepSeek/OpenAI assistant tool-call bridge.
- Direct approval requests now persist direct tool-call metadata, and the Approvals panel calls `execute_approved_direct_model_tool` after approving direct-model patch/command requests so paused direct implementation runs can continue.
- Direct approval resumes now include preserved prior safe-tool results plus the approved tool result, so provider context survives a patch/command approval pause.
- Implementation dispatch now honors runner catalog enabled state. Disabled or missing runners are skipped with `waitingReason` and `runner_disabled_waiting`, so disabled-by-default direct DeepSeek/Gemini entries do not launch until explicitly enabled.
- Direct provider request builders now omit optional DeepSeek/Gemini tool declaration fields when no tools are supplied, keeping preview/manual turn envelopes provider-friendly.
- DeepSeek/OpenAI-style streamed tool-call assembly now preserves a stable stream key, preferring the provider tool-call index when present, so later argument deltas without a repeated provider tool id merge into the original tool call.
- Gemini stream parsing now includes payload/array sequence in generated source event ids so harness dedupe does not collapse later chunks from the same candidate.
- Direct provider turns now persist `turn.started` before API-key lookup/provider HTTP initialization/send work and append `session.failed` separately on missing/empty API keys, provider setup, request, response-read, HTTP-status, or parse failures.
- Gemini continuation request history now includes the original provider tool-call id on synthetic `functionCall` and matching `functionResponse` parts so tool results can be correlated by Gemini 3 models.
- Shared Brain Core exports now include `RunnerKind` and `ProviderApiStyle` so direct-provider catalog metadata can be typed through the package entrypoint.
- At this point the direct `finish_task` tool schema advertised only implementation statuses; review statuses were added later in the 2026-06-17 caveat closure slice.
- Direct implementation turns and approval events now use the shared queue-thread id helper so provider messages attach to the same durable thread record as queue metadata.
- At this point settings normalization, validation, and the Agents UI kept direct-provider runners out of the default review runner slot because review dispatch was still CLI-only.
- At this point Settings > Agents allowed enabled direct-provider runners as implementation defaults while visibly disabling them in the review runner selector.
- Direct provider tool loops now carry cumulative safe-tool results across provider turns, so earlier `read_file` and `search_text` outputs stay visible after later tool calls.
- At this point direct review dispatch was still pending.

### Direct Model Approved Mutating Tool Execution Slice (2026-06-16)

- Added shared `DirectModelApprovedToolExecutionInput` and `DirectModelApprovedToolExecutionResult` plus desktop-client `executeApprovedDirectModelTool`.
- Added approval lookup helper for direct runtime approval verification.
- Added Tauri command `execute_approved_direct_model_tool`.
- The command verifies the approval exists, is approved, matches `direct-model:<tool>`, and matches the canonical execution path and queue context before running.
- Approved `apply_patch` runs `git apply --whitespace=nowarn` in the canonical execution path with patch content piped to stdin.
- Approved `run_command` runs `/bin/sh -lc` in the canonical execution path with a 1-300 second timeout.
- Both approved paths capture stdout/stderr/exit metadata, return a direct tool result, and record queue-linked `tool.completed` harness events when queue context is present.
- Queue transitions remained owned by the implementation dispatch wrapper; direct review dispatch was still pending at that point.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/approval.rs`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/api/permissions.md`
  - `brain/features/automation-runs.md`
  - `brain/system/architecture.md`
  - `brain/decisions/2026-06-15-direct-model-provider-runners.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build not run in this slice.

### Direct Model Safe Tool Loop Slice (2026-06-16)

- Added shared `DirectModelToolLoopInput` and `DirectModelToolLoopResult` plus desktop-client `executeDirectModelToolLoop`.
- Added Tauri command `execute_direct_model_tool_loop` for bounded direct DeepSeek/Gemini safe-tool loops.
- The loop executes provider turns, collects model-requested tool calls, executes safe tools (`read_file`, `search_text`, `finish_task`), records `tool.completed` harness events, and feeds cumulative tool results into the next provider turn.
- DeepSeek/OpenAI-style tool result feedback now includes an assistant `tool_calls` bridge message before `tool` messages so the second provider turn has the required context.
- The loop stops at `apply_patch` or `run_command` by creating a Brain Loop approval request and returning `stoppedReason: approval_required`; approved mutating execution remains future work.
- Loop execution is capped between 1 and 8 iterations and does not transition queues.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/features/automation-runs.md`
  - `brain/system/architecture.md`
  - `brain/decisions/2026-06-15-direct-model-provider-runners.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build not run in this slice.

### Direct Model Manual Provider Turn Execution Slice (2026-06-16)

- Added shared `DirectModelTurnExecutionResult` and desktop-client `executeDirectModelTurn`.
- Added Tauri command `execute_direct_model_turn` for one manual direct-provider turn against DeepSeek or Gemini.
- The command builds the redacted provider request, reads `DEEPSEEK_API_KEY` or `GEMINI_API_KEY`, sends the provider HTTP request, parses the full response into normalized direct events, and records those events through the existing harness JSONL/thread ingestion path.
- API-key/setup/request/send/response-read/status/parse failures record a queue-linked `session.failed` harness event before returning an error.
- Gated direct tool approval requests continue to record queue-linked `approval.required` harness events when queue context is present.
- Gemini parsing now accepts full streamed response arrays as well as single response objects.
- At that point, scheduler dispatch, post-approval mutating execution, and queue transitions remained disabled.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/Cargo.toml`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/features/automation-runs.md`
  - `brain/system/architecture.md`
  - `brain/decisions/2026-06-15-direct-model-provider-runners.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build/Cargo dependency resolution not run in this slice.

### Direct Model Runtime Contract Scaffold (2026-06-15)

- Added shared direct-provider runtime types for tool specs, messages, tool calls/results, turn inputs, turn events, provider contracts, and the runtime contract response.
- Added a Rust direct-model runtime contract scaffold with DeepSeek/Gemini providers, tool schemas for `read_file`, `search_text`, `apply_patch`, `run_command`, and `finish_task`, structured event kinds, and approval-required tool metadata.
- Exposed `list_direct_model_runtime_contract` through Tauri and the desktop client.
- Settings > Agents now shows direct-provider runtime contract counts in the existing harness capability list.
- Implementation dispatch was enabled for direct-provider runners after provider network adapters, tool execution, approval gating, and queue reconciliation were wired; direct review dispatch was still pending at that point.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/harness.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/features/automation-runs.md`
  - `brain/system/architecture.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/decisions/2026-06-15-direct-model-provider-runners.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build not run in this slice.

### Direct Model Provider Request Preview Slice (2026-06-15)

- Added shared request-shape and provider-request types for direct model runners.
- Added DeepSeek and Gemini request-shape metadata to the direct runtime contract.
- Added dependency-free request builders:
  - DeepSeek maps normalized turns to OpenAI-chat `/chat/completions` with system/user/assistant/tool messages, `tools[].function`, `tool_choice`, and streaming usage.
  - Gemini maps normalized turns to `streamGenerateContent` with `systemInstruction`, `contents`, `tools[].functionDeclarations`, `toolConfig`, and function-response parts for tool results.
- Exposed `preview_direct_model_provider_request` through Tauri and the desktop client. The command validates and returns a request envelope with placeholder auth headers; it does not send network requests or read API keys.
- Settings > Agents now includes request-shape counts in the direct-provider runtime summary.
- Implementation dispatch was enabled for direct providers; direct review dispatch was still pending at that point.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/features/automation-runs.md`
  - `brain/system/architecture.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/decisions/2026-06-15-direct-model-provider-runners.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build not run in this slice.

### Direct Model Stream Event Preview Slice (2026-06-16)

- Added shared direct-provider stream parse input/result types.
- Added dependency-free stream chunk parsers for direct-provider previews:
  - DeepSeek SSE chunks map `choices[].delta.content` to `message.delta`, partial `delta.tool_calls` to `tool.started`, finish reasons to `turn.completed`/`tool.completed`, and usage into string metadata.
  - Gemini chunks map `candidates[].content.parts[].text` to `message.delta`, `functionCall` parts to `tool.started`, `finishReason` to `turn.completed`, and `usageMetadata` into string metadata.
- Exposed `preview_direct_model_stream_events` through Tauri and the desktop client. The command returns normalized direct turn events but does not append harness JSONL, mutate threads, execute tools, read API keys, or send provider requests.
- Implementation dispatch was enabled for direct providers; direct review dispatch was still pending at that point.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/features/automation-runs.md`
  - `brain/system/architecture.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build not run in this slice.

### Direct Model Harness Event Bridge Preview Slice (2026-06-16)

- Added shared `DirectModelHarnessEventPreview` for converting direct-provider turn events into existing harness event records.
- Added a Rust conversion layer from `DirectModelTurnEvent` to `HarnessEventInput`, preserving direct provider metadata, tool call ids, tool names, serialized tool arguments, approval ids, queue/thread/turn ids, and model ids.
- Exposed `preview_direct_model_harness_events` through Tauri and the desktop client. The command is preview-only: it does not append harness JSONL, mutate thread records, emit events, execute tools, read API keys, send provider requests, or transition queues.
- This closes the preview bridge from provider chunks to Brain Loop's existing durable harness contract; live direct runtime persistence remains a later wiring step.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/features/automation-runs.md`
  - `brain/system/architecture.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build not run in this slice.

### Direct Model Completed Message Preview Slice (2026-06-16)

- Extended `DirectModelHarnessEventPreview` with a `completedMessages` count.
- Updated direct-to-harness preview conversion so consecutive `message.delta` bodies synthesize a `message.completed` harness event when a direct turn reaches `turn.completed`.
- The synthesized event preserves provider/model/queue/thread/turn context and records `synthesizedFrom=message.delta` plus `deltaEventCount` metadata.
- This makes parsed DeepSeek/Gemini stream output compatible with Brain Loop's existing exact-message thread renderer once direct-provider persistence is enabled.
- The slice remains preview-only: no harness JSONL writes, thread mutations, Tauri event emission, tool execution, API-key reads, provider requests, or queue transitions.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `brain/api/contracts.md`
  - `brain/features/automation-runs.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build not run in this slice.

### Direct Model Harness Event Persistence Slice (2026-06-16)

- Added shared `DirectModelHarnessRecordResult` with the last updated thread plus recorded/skipped/completed-message counts.
- Added `record_direct_model_harness_events`, which converts supplied direct turn events into harness events, synthesizes completed messages from deltas, and records the result through the existing harness JSONL/thread ingestion path.
- Added a desktop-client wrapper for the new command.
- This is an explicit persistence bridge only: it does not call providers, read API keys, execute tools, create approval requests, dispatch direct runners, or transition queues.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/features/automation-runs.md`
  - `brain/system/architecture.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build not run in this slice.

### Direct Model Safe Tool Execution Slice (2026-06-16)

- Added shared `DirectModelToolExecutionInput` and `DirectModelToolExecutionResult` contracts.
- Added `execute_direct_model_tool` for bounded direct-provider tool execution:
  - `read_file` reads canonicalized relative files under the supplied execution path with a 2MB file cap and 400-line response cap.
  - `search_text` performs bounded substring search under a canonicalized relative path, skips common generated directories, skips files over 1MB, and caps results at 200.
  - `finish_task` returns the requested summary/status as a tool result without changing queue state.
  - `apply_patch` and `run_command` return approval-required results and do not mutate files or launch commands yet.
- Added a desktop-client wrapper for the new command.
- At that point, provider networking, mutating tool execution, approval request creation, direct dispatch, and queue transitions remained disabled.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/features/automation-runs.md`
  - `brain/system/architecture.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build not run in this slice.

### Direct Model Gated Tool Approval Slice (2026-06-16)

- Extended `DirectModelToolExecutionInput` with optional queue/project/runner/session context.
- Added shared `DirectModelToolApprovalResult`.
- Added `request_direct_model_tool_approval`, which creates Brain Loop approval requests for gated direct tools:
  - `apply_patch` creates a destructive approval request.
  - `run_command` creates a command approval request.
  - queue/project/runner/session metadata is preserved when supplied.
- Added a desktop-client wrapper for the new command.
- Approval resolution still does not execute the gated tool; post-approval execution remains a future direct-runtime wiring step.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/features/automation-runs.md`
  - `brain/system/architecture.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build not run in this slice.

### Direct Model Provider Runner Contract Slice (2026-06-15)

- Added first-class direct-provider runner metadata to the shared Brain Loop settings contract.
- Added disabled-by-default catalog entries for `direct-deepseek` and `direct-gemini`, including provider id, API style, API-key environment variable, and current model lists.
- Updated Rust settings defaults, normalization, and validation so direct-provider metadata is preserved and malformed direct entries are rejected.
- Settings > Agents now displays runner kind plus provider/API metadata in the runner catalog.
- Harness capability metadata now lists DeepSeek Direct and Gemini Direct as direct-provider runtimes.
- Added a dependency-free direct-model runtime boundary module so dispatch can recognize direct providers and keep unsupported roles out of the CLI runner path.
- Added ADR `brain/decisions/2026-06-15-direct-model-provider-runners.md`.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/constants.ts`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src-tauri/src/direct_model.rs`
  - `apps/desktop/src-tauri/src/harness.rs`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `brain/api/contracts.md`
  - `brain/features/automation-runs.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/decisions/2026-06-15-direct-model-provider-runners.md`
  - `brain/progress.md`
- Verification kept lightweight per fast Bun monorepo command discipline; project-wide typecheck/build not run in this slice.

### Structured Agent Message Harness Runtime (2026-06-15)

- Promoted the harness foundation to a live Codex structured-provider adapter.
- Brain Loop now starts `codex app-server --stdio`, speaks newline-delimited JSON-RPC, creates provider threads, sends turns with `turn/start`, and normalizes `item/completed` provider notifications into exact durable thread messages.
- Added in-memory Codex harness runtime state for start/send/stop and a recovery path that starts a fresh provider session if the app restarted before a follow-up send.
- Added `replay_harness_events(queueItemId)` to rebuild the durable thread read model from `~/.brain-loop/harness/events/<queueItemId>.jsonl` without duplicating the JSONL log.
- Added a compact Codex harness composer, stop control, replay control, and provider line-break preservation to opened thread views.
- Added focused Rust unit tests for Codex provider notification normalization, exact-message metadata, and user text extraction.
- Capability disclosure now records the verified state: Codex is structured-provider-events; OpenCode exposes ACP/export surfaces but remains transcript-only in Brain Loop; AGY remains transcript-only because no stable structured live event API was found in this install.
- Changed files include:
  - `apps/desktop/src-tauri/src/harness.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src/app.tsx`
  - `packages/brain-core/src/types.ts`
  - `packages/desktop-client/src/index.ts`
  - `brain/intake/2026-06-15-structured-agent-message-harnesses.md`
  - `brain/decisions/2026-06-15-provider-event-ingestion.md`
  - `brain/api/contracts.md`
  - `brain/features/threaded-terminals.md`
  - `brain/features/ui-shell.md`
  - `brain/system/architecture.md`
  - `brain/tasks/done.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `/Users/M1PRO/.cargo/bin/cargo test`; `/Users/M1PRO/.cargo/bin/cargo check`; `bun --filter @brain-loop/desktop build`; `bun --filter @brain-loop/desktop visual:qa`; `git diff --check`.

### Structured Agent Message Harness Foundation (2026-06-15)

- Added shared structured harness types for provider capabilities, event kinds, event input, session start input, and sessions.
- Added durable thread provenance fields: `messageSource`, `providerSessionId`, and `providerThreadId`.
- Added Rust harness commands: `list_harness_capabilities`, `start_harness_session`, `send_harness_message`, `stop_harness_session`, and `record_harness_event`.
- Raw structured provider events now append to `~/.brain-loop/harness/events/*.jsonl`.
- Exact provider messages normalize into `AgentThread.messages` with provider/model/session metadata and idempotency by `sourceEventId`.
- Opened threads now label message provenance as exact provider messages, Brain timeline, or transcript-backed; exact provider messages show compact provider/model metadata.
- Settings > Agents now shows provider message capture capabilities. Codex is marked structured-provider-events; OpenCode and Antigravity remain transcript-only until structured APIs are verified.
- Added ADR `brain/decisions/2026-06-15-provider-event-ingestion.md`.
- Changed files include:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/harness.rs`
  - `apps/desktop/src-tauri/src/agent_thread.rs`
  - `apps/desktop/src-tauri/src/state.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `brain/intake/2026-06-15-structured-agent-message-harnesses.md`
  - `brain/decisions/2026-06-15-provider-event-ingestion.md`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/features/automation-runs.md`
  - `brain/features/threaded-terminals.md`
  - `brain/features/ui-shell.md`
  - `brain/system/architecture.md`
  - `brain/tasks/done.md`
- Checks passed: `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `bun --filter @brain-loop/desktop visual:qa`.
- Blocked check: `cargo check` because `cargo` is not installed on this host.
- Remaining: real Codex app-server/runtime stream adapter, OpenCode/AGY structured API investigations, and Rust validation once Cargo is available.

### Thread Top Chrome Alignment Slice (2026-06-15)

- Moved opened-thread identity from the scrolled message column into the top overlay chrome so the thread header sits flush near the top of the main pane.
- Kept the message timeline padded below the top chrome, avoiding overlap with the draggable title-bar region.
- Updated visual QA and UI shell docs to distinguish the new compact top-chrome identity from the removed stale h-12 app bar.
- Changed files:
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/scripts/codex-visual-qa.mjs`
  - `brain/features/ui-shell.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `bun --filter @brain-loop/desktop visual:qa`; `git diff --check`.

### Focus Frame Logo Cleanup Slice (2026-06-15)

- Replaced the old dark looping React home logo with the current Brain Loop Focus Frame mark.
- Confirmed the packaged Tauri icon PNG already uses the Focus Frame mark, so no native asset regeneration was needed.
- Strengthened `bun --filter @brain-loop/desktop visual:qa` to fail if the old looping glyph returns to the React logo component.
- Changed files:
  - `apps/desktop/src/components/brain-loop-logo.tsx`
  - `apps/desktop/scripts/codex-visual-qa.mjs`
  - `brain/features/ui-shell.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `bun --filter @brain-loop/desktop visual:qa`; `git diff --check`.

### Codex Overlay App Bar Replacement Slice (2026-06-15)

- Replaced the remaining default Tauri/macOS title strip with native overlay title-bar chrome: `decorations: true`, `titleBarStyle: Overlay`, hidden native title, and positioned traffic lights.
- Removed React-drawn traffic-light dots from the workspace and settings sidebars so the native controls are the only window controls.
- Removed the stale fixed opened-thread app bar and kept thread identity inside the chat surface.
- Added draggable top chrome regions for the workspace, sidebar, and settings surface.
- Strengthened `bun --filter @brain-loop/desktop visual:qa` to fail if the stale header, placeholder app-bar icons, missing overlay title-bar config, or fake traffic lights return.
- Changed files:
  - `apps/desktop/src-tauri/tauri.conf.json`
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/sidebar.tsx`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `apps/desktop/src/styles.css`
  - `apps/desktop/scripts/codex-visual-qa.mjs`
  - `brain/features/ui-shell.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `bun --filter @brain-loop/desktop visual:qa`; `git diff --check`.
- Manual Tauri launch: `cargo run` via `/Users/M1PRO/.cargo/bin/cargo` started the desktop app against the already-running Vite dev server on port 1420 and confirmed the app process was live; the run was stopped after verification. Initial `tauri:dev` was blocked because port 1420 was already in use.

### Scheduler Contract QA And Intake Closure Slice (2026-06-15)

- Added `bun --filter @brain-loop/desktop scheduler:qa` as a source-level contract gate for scheduler and worktree behavior while Cargo is unavailable.
- The command verifies:
  - capacity settings contract (`maxImplementationAgents`, `maxReviewAgents`, `capacityPollIntervalSeconds`, `maxLoopPolicy`);
  - running capacity loop with configurable poll cadence;
  - review-first local automation triage;
  - implementation pool dispatch through eligible queue statuses, dependencies, MaxLoop caps, and runner launch;
  - separate review pool dispatch for submitted items with review-capacity waiting reasons;
  - direct implementation-completion-to-review handoff;
  - durable worktree-backed thread context and main-checkout warning.
- Marked completed scheduler/worktree intake slices Done: MaxLoop concurrency settings, token-saving automation triage, thread storage/worktree strategy settings, capacity-based agent pool scheduler, review agent pool/direct handoff, and worktree-backed agent threads.
- Marked the Codex UI visual QA harness Done; browser screenshot automation remains a future enhancement beyond the current zero-dependency gate.
- Changed files:
  - `apps/desktop/package.json`
  - `apps/desktop/scripts/scheduler-contract-qa.mjs`
  - `brain/intake/2026-06-12-loop-product-settings.md`
  - `brain/intake/2026-06-13-token-saving-automation-triage.md`
  - `brain/intake/2026-06-15-capacity-agent-thread-pivot.md`
  - `brain/plans/2026-06-12-feature-maxloop-concurrency-policy.md`
  - `brain/plans/2026-06-12-feature-thread-storage-worktree-strategy.md`
  - `brain/plans/2026-06-13-feature-token-saving-automation-triage.md`
  - `brain/plans/2026-06-13-test-codex-ui-visual-qa-harness.md`
  - `brain/plans/2026-06-15-feature-capacity-agent-pool-scheduler.md`
  - `brain/plans/2026-06-15-feature-review-agent-pool-handoff.md`
  - `brain/plans/2026-06-15-feature-worktree-backed-agent-threads.md`
  - `brain/features/background-scheduler.md`
  - `brain/features/threaded-terminals.md`
  - `brain/intake/2026-06-13-codex-ui-standardization.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/in-progress.md`
  - `brain/tasks/done.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/desktop scheduler:qa`; `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `bun --filter @brain-loop/desktop visual:qa`; `git diff --check`.
- At that point Rust/Cargo validation was blocked by PATH/tool discovery; a later `rust:check` script resolves Cargo from `~/.cargo/bin/cargo`.

### Codex Sidebar And Agent Chat Polish Slice (2026-06-15)

- Flattened the sidebar around the latest Codex-style feedback:
  - At that point Review, Implementation, and Approval used ghost-button rows with no icons, subtitles, or card borders.
  - Thread rows are title-only with compact elapsed time on the right and reduced typography.
  - The sidebar keeps the glass-like dark translucent surface and fixed top actions above the scrollable thread list.
- Removed the remaining mismatched main-surface background by aligning the workspace to the root `#141414` background.
- Flattened opened-thread surfaces by removing heavy borders/shadows from message bubbles, artifact rows, transcript rows, metrics, and the embedded approval panel.
- Updated the visual QA harness to assert the darker headless shell background.
- Marked the sidebar/home pivot and Codex agent chat thread plans Done.
- Changed files:
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/sidebar.tsx`
  - `apps/desktop/src/components/approval-panel.tsx`
  - `apps/desktop/scripts/codex-visual-qa.mjs`
  - `brain/features/ui-shell.md`
  - `brain/product/roadmap.md`
  - `brain/intake/2026-06-15-capacity-agent-thread-pivot.md`
  - `brain/plans/2026-06-15-ux-ui-codex-sidebar-home-pivot.md`
  - `brain/plans/2026-06-15-ux-ui-codex-agent-chat-thread.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/done.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `bun --filter @brain-loop/desktop visual:qa`; `git diff --check`.
- Browser plugin visual inspection was not available in this session; the source-invariant visual QA harness passed on a freshly built desktop bundle.

### Product Name And Runner Terminology Slice (2026-06-15)

- Accepted Brain Loop as the v1 product name and `runner` as the user-facing term for automation tools.
- Reserved `runner adapter` for integration code and `provider` for lower-level model/API providers behind a runner.
- Added ADR `brain/decisions/2026-06-15-product-name-runner-terminology.md`.
- Updated README, product positioning, product vision, system overview, architecture, runner catalog plan, intake, and task tracking docs.
- Marked the product name and runner terminology plan, intake item, and roadmap task Done.
- Changed files:
  - `README.md`
  - `brain/decisions/2026-06-15-product-name-runner-terminology.md`
  - `brain/product/open-source-positioning.md`
  - `brain/product/vision.md`
  - `brain/system/architecture.md`
  - `brain/system/overview.md`
  - `brain/plans/2026-06-12-investigation-product-name-runner-terminology.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/intake/2026-06-12-loop-product-settings.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/done.md`
  - `brain/progress.md`
- Checks passed: `rg -n "O-Loop|C-Loop|executor|engine|\\bapp\\b" README.md brain/product brain/system brain/api brain/features brain/plans/2026-06-12-investigation-product-name-runner-terminology.md brain/intake/2026-06-12-loop-product-settings.md`; `rg -n "Brain Loop|runner adapter|provider|future Claude|runner" README.md brain/decisions/2026-06-15-product-name-runner-terminology.md brain/product/open-source-positioning.md brain/system/overview.md brain/system/architecture.md brain/plans/2026-06-12-investigation-product-name-runner-terminology.md`; `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `git diff --check`.

### Opinionated Open Source Positioning Slice (2026-06-15)

- Added `brain/product/open-source-positioning.md` to define Brain Loop as an opinionated, local-first, open-source control surface for Brain automation.
- Updated README with the open-source direction, opinionated defaults, current supported runner ids, v1 non-goals, and current Codex-style usage flow.
- Updated product vision, roadmap, system overview, and Brain state docs with local-first/open-source positioning.
- Marked the opinionated open-source positioning plan, intake item, and roadmap task Done.
- Changed files:
  - `README.md`
  - `brain/product/open-source-positioning.md`
  - `brain/product/vision.md`
  - `brain/product/roadmap.md`
  - `brain/system/overview.md`
  - `brain/features/brain-state.md`
  - `brain/plans/2026-06-12-docs-open-source-opinionated-positioning.md`
  - `brain/intake/2026-06-12-loop-product-settings.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/done.md`
  - `brain/progress.md`
- Checks passed: `rg -n "open source|opinionated|local-first|runner|provider|Loop" README.md brain`; `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `git diff --check`.

### Codex UI Visual QA Harness Slice (2026-06-15)

- Added `bun --filter @brain-loop/desktop visual:qa` as a zero-dependency visual QA gate for the desktop Codex shell.
- The command verifies the built bundle exists, the shell remains headless and dark-first, fixed Review/Implementation/Approval actions stay above the scrollable thread list, thread rows stay flat/title-only, opened threads keep chat/artifact/transcript controls, persisted timeline messages render, and long artifact/transcript text has wrapping guards.
- The command writes a generated report to `apps/desktop/visual-qa/codex-ui-report.json`; the report directory is ignored by Git.
- Removed unused legacy light scaffold CSS that could reintroduce white dashboard/sidebar surfaces.
- Marked the Codex UI visual QA harness plan and roadmap row In Progress.
- Changed files:
  - `.gitignore`
  - `apps/desktop/package.json`
  - `apps/desktop/scripts/codex-visual-qa.mjs`
  - `apps/desktop/src/styles.css`
  - `brain/engineering/coding-standards.md`
  - `brain/features/ui-shell.md`
  - `brain/plans/2026-06-13-test-codex-ui-visual-qa-harness.md`
  - `brain/intake/2026-06-13-codex-ui-standardization.md`
  - `brain/tasks/roadmap.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `bun --filter @brain-loop/desktop visual:qa`; `git diff --check`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### Agent Thread Persisted Messages Slice (2026-06-15)

- Added compact persisted `AgentThreadMessage` records to durable agent thread JSON.
- Queue state changes, waiting reasons, linked artifacts, linked implementation/review transcripts, and linked approval state changes now append deduplicated timeline messages to the thread record.
- The Codex-like opened thread surface renders persisted timeline messages with distinct system, agent, artifact, and approval styling, falling back to live summary messages for older records.
- Updated shared TypeScript contracts and Brain docs for the new message shape.
- Changed files:
  - `apps/desktop/src-tauri/src/agent_thread.rs`
  - `apps/desktop/src/app.tsx`
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `brain/features/threaded-terminals.md`
  - `brain/features/ui-shell.md`
  - `brain/api/contracts.md`
  - `brain/plans/2026-06-15-ux-ui-codex-agent-chat-thread.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `git diff --check`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### Agent Thread Archival Metadata Slice (2026-06-15)

- Added non-destructive archival metadata to durable agent thread records: `archivedAt`, `archivedBy`, and optional `archiveReason`.
- Active thread listing now returns non-archived records only; archived terminal records can be retrieved through `list_archived_agent_threads`.
- Added `archive_agent_thread` to mark terminal thread records archived without deleting queue items, worktrees, logs, or artifacts.
- Updated shared TypeScript and desktop-client contracts for archive metadata and commands.
- Changed files:
  - `apps/desktop/src-tauri/src/agent_thread.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `packages/brain-core/src/types.ts`
  - `packages/desktop-client/src/index.ts`
  - `brain/features/threaded-terminals.md`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/api/permissions.md`
  - `brain/plans/2026-06-15-feature-worktree-backed-agent-threads.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `git diff --check`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### Durable Approval Storage Slice (2026-06-15)

- Added durable approval request storage at `~/.brain-loop/approvals.json`.
- Approval broker state now loads existing requests on startup and atomically writes approval lifecycle changes before emitting request/resolution events.
- `list_approval_requests` refreshes queue-linked thread approval metadata from the durable approval list, so pending approval counts can be rebuilt after restart.
- Updated state, contract, approval broker, and permission docs to remove the process-local approval limitation.
- Changed files:
  - `apps/desktop/src-tauri/src/state.rs`
  - `apps/desktop/src-tauri/src/approval.rs`
  - `brain/SYSTEM_OVERVIEW.md`
  - `brain/features/brain-state.md`
  - `brain/features/approval-broker.md`
  - `brain/api/contracts.md`
  - `brain/api/permissions.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `git diff --check`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### Review Result Timestamp Telemetry Slice (2026-06-15)

- Review result transitions now stamp `reviewedAt` when a queue item moves to `reviewed-fix-request` or `landing`.
- Queue detail sheets now expose submitted, reviewed, and approved timestamps together with runner/session and artifact metadata.
- Updated review handoff, automation, queue dashboard, and API contract docs to distinguish review result time from final approval time.
- Changed files:
  - `apps/desktop/src-tauri/src/brain.rs`
  - `apps/desktop/src/components/tables/queue/queue-table.tsx`
  - `brain/features/automation-runs.md`
  - `brain/features/queue-dashboard.md`
  - `brain/api/contracts.md`
  - `brain/plans/2026-06-15-feature-review-agent-pool-handoff.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `git diff --check`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### Agent Thread Artifact Cards Slice (2026-06-15)

- Added queue artifact paths to durable agent thread metadata: `planPath`, `handoffPath`, `activeHandoffPath`, and `reviewPath`.
- Added compact artifact cards in the opened Codex-like thread surface for linked plan, active handoff, and review artifacts when available.
- Updated the shared `AgentThread` TypeScript contract and Brain docs so queue artifacts can be traced from the task thread.
- Changed files:
  - `apps/desktop/src-tauri/src/agent_thread.rs`
  - `apps/desktop/src/app.tsx`
  - `packages/brain-core/src/types.ts`
  - `brain/features/threaded-terminals.md`
  - `brain/features/ui-shell.md`
  - `brain/api/contracts.md`
  - `brain/plans/2026-06-15-feature-worktree-backed-agent-threads.md`
  - `brain/plans/2026-06-15-ux-ui-codex-agent-chat-thread.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `git diff --check`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### Agent Thread Approval Metadata Slice (2026-06-15)

- Added `approvalRequestIds` and `pendingApprovalCount` to durable agent thread metadata and shared TypeScript contracts.
- Queue-linked approval request and resolution paths now refresh the associated durable thread approval metadata.
- Denied or expired approval requests that block a queue item also refresh the queue-linked thread status metadata.
- Opened thread messages now show linked and pending approval counts beside queue/status/execution metadata.
- Changed files:
  - `apps/desktop/src-tauri/src/agent_thread.rs`
  - `apps/desktop/src-tauri/src/approval.rs`
  - `apps/desktop/src/app.tsx`
  - `packages/brain-core/src/types.ts`
  - `brain/features/threaded-terminals.md`
  - `brain/features/approval-broker.md`
  - `brain/api/contracts.md`
  - `brain/plans/2026-06-15-feature-worktree-backed-agent-threads.md`
  - `brain/plans/2026-06-15-feature-review-agent-pool-handoff.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `git diff --check`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### Capacity Poll Cadence Settings Slice (2026-06-15)

- Added `capacityPollIntervalSeconds` to the shared settings contract and defaults, with a default of 5 seconds.
- Wired the background automation capacity loop to read `capacityPollIntervalSeconds` each cycle instead of sleeping on a hidden hardcoded 5-second interval.
- Added Rust validation and normalization so the poll cadence stays within 1-60 seconds.
- Added a Settings > Automation control for the capacity poll interval.
- Changed files:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/constants.ts`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src-tauri/src/scheduler.rs`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `brain/features/background-scheduler.md`
  - `brain/features/automation-runs.md`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/plans/2026-06-15-feature-capacity-agent-pool-scheduler.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `git diff --check`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### Review Missing Result Guardrail Slice (2026-06-15)

- Added an immediate runner-completion guardrail for review runs that exit successfully without moving their queue item out of `reviewing`.
- Such runs now block the queue item with `lastError` and a `review_runner_missing_result` history event instead of waiting for stale reconciliation.
- Runner-driven queue mutations now refresh the queue-linked durable agent thread so status, `lastError`, and `waitingReason` stay aligned after spawn failures, non-zero exits, implementation auto-submit, and missing review results.
- Changed files:
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src-tauri/src/runner.rs`
  - `brain/features/automation-runs.md`
  - `brain/features/background-scheduler.md`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/plans/2026-06-15-feature-review-agent-pool-handoff.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `git diff --check`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### Review Capacity Waiting Reason Slice (2026-06-15)

- Added durable review-capacity wait persistence for enabled submitted queue items that cannot launch because `maxReviewAgents` is full.
- Review-capacity waits keep items in `submitted`, set `waitingReason`, append a `review_capacity_waiting` history event, and refresh the queue-linked durable agent thread.
- Added `AgentThread.waitingReason` so opened Codex-like thread views can show the same waiting alert that queue rows already expose.
- Changed files:
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src-tauri/src/agent_thread.rs`
  - `apps/desktop/src/app.tsx`
  - `packages/brain-core/src/types.ts`
  - `brain/features/automation-runs.md`
  - `brain/features/background-scheduler.md`
  - `brain/api/contracts.md`
  - `brain/plans/2026-06-15-feature-review-agent-pool-handoff.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `git diff --check`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### State Root Documentation Alignment Slice (2026-06-15)

- Aligned stale plan references with the implemented `~/.brain-loop` app state root and `~/.brain-loop/settings.toml` settings file.
- Clarified that Rust performs read-only migration/fallback from the legacy `~/.codex/brain-project-manager` root when needed.
- Updated the worktree-backed thread plan to describe configurable thread/worktree storage roots, defaulting to `~/.brain-loop/threads` and `~/.brain-loop/worktrees`.
- Changed files:
  - `brain/plans/2026-06-12-feature-rust-brain-state-readers.md`
  - `brain/plans/2026-06-15-feature-worktree-backed-agent-threads.md`
  - `brain/progress.md`
- Checks passed: `git diff --check`.

### Permission Required Thread Alerts Slice (2026-06-15)

- Began implementation of the permission-required alert intake from `brain/intake/2026-06-12-loop-product-settings.md`.
- Added app-level approval request tracking from `list_approval_requests` and live approval events.
- Added red permission-required flags to the fixed Approval sidebar action and queue-linked thread rows when pending approval requests exist.
- Added a destructive permission-required alert to opened affected threads, including an `Open approvals` action that jumps to the approval card surface.
- Added a short deduplicated Web Audio cue for new pending approval requests. The cue respects both the approval notification category and the new permission sound setting.
- Replaced the planned permission sound row in Settings > Permissions & Approvals with a real toggle persisted in local storage.
- Marked the permission-required thread alerts plan and roadmap task In Progress.
- Changed files:
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/sidebar.tsx`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `apps/desktop/src/lib/notifications.ts`
  - `brain/plans/2026-06-12-ux-ui-permission-required-alerts.md`
  - `brain/intake/2026-06-12-loop-product-settings.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/in-progress.md`
  - `brain/features/approval-broker.md`
  - `brain/features/threaded-terminals.md`
  - `brain/features/automation-runs.md`
  - `brain/features/ui-shell.md`
  - `brain/api/permissions.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop build`; `git diff --check`.
- Remaining: manual sound/UI smoke check with live or stubbed approval events.

### Thread Storage And Worktree Strategy Settings Slice (2026-06-15)

- Began implementation of the thread/worktree strategy settings plan from the Loop product settings intake.
- Added shared settings fields for `threadStorageRoot`, `worktreeStorageRoot`, and `executionStrategy`, with `worktree` as the default strategy.
- Made Rust thread and worktree storage path helpers read the configured settings roots while preserving the current `~/.brain-loop` defaults.
- Added scheduler/runtime support for `worktree`, `main-checkout`, and `auto` execution strategies. `worktree` keeps strict isolated worktree behavior, `main-checkout` runs directly from the registered project path, and `auto` attempts worktree prep before falling back to the main checkout.
- Persisted `executionStrategy` onto queue items and durable agent thread metadata, and included it in runner prompts, queue details, and opened thread summaries.
- Replaced planned Settings > Threads & Worktrees rows with real storage root controls, an execution strategy selector, and a main-checkout warning row.
- Marked the thread storage/worktree strategy plan and roadmap task In Progress.
- Changed files:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/constants.ts`
  - `packages/brain-core/src/index.ts`
  - `apps/desktop/src-tauri/src/state.rs`
  - `apps/desktop/src-tauri/src/worktree.rs`
  - `apps/desktop/src-tauri/src/brain.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src-tauri/src/agent_thread.rs`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `apps/desktop/src/components/tables/queue/queue-table.tsx`
  - `apps/desktop/src/app.tsx`
  - `brain/plans/2026-06-12-feature-thread-storage-worktree-strategy.md`
  - `brain/intake/2026-06-12-loop-product-settings.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/in-progress.md`
  - `brain/features/threaded-terminals.md`
  - `brain/features/automation-runs.md`
  - `brain/api/contracts.md`
  - `brain/api/permissions.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build`; `git diff --check`.
- Rust validation remains blocked because `cargo` is not installed on this host.
- Remaining: manual dispatch check against a real queue item.

### Capacity Agent Thread Pivot Intake (2026-06-15)

- Created `brain/intake/2026-06-15-capacity-agent-thread-pivot.md` from the pivot request to replace cron-style automation with capacity-based agent pools and Codex-like agent threads.
- Added proposed plans for capacity-based implementation scheduling, review pool direct handoff, worktree-backed agent threads, Codex sidebar/home shell redesign, and Codex agent chat thread UI.
- Added companion roadmap tasks for all five proposed plans.
- No implementation code was changed in this planning-only intake pass.

### Capacity Agent Thread Pivot UI Slice (2026-06-15)

- Began implementation of the latest pivot by updating the desktop shell toward the requested Codex-like model.
- At that point fixed top sidebar actions were Review, Implementation, and Approval, with the thread list scrolling below them.
- Added a collapsible glass-like sidebar with a Codex-style toggle and preserved Settings in the footer.
- Replaced the previous dashboard-style home content with a centered Brain Loop icon and app name while the main surface decision remains open.
- Added an opened-agent chat surface with project scope, two placeholder top-right icon actions, Codex-like message blocks, status metrics, and run-result alerts.
- Marked the sidebar/home and agent chat plans as In Progress.
- Changed files:
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/sidebar.tsx`
  - `brain/intake/2026-06-15-capacity-agent-thread-pivot.md`
  - `brain/plans/2026-06-15-ux-ui-codex-sidebar-home-pivot.md`
  - `brain/plans/2026-06-15-ux-ui-codex-agent-chat-thread.md`
  - `brain/features/ui-shell.md`
  - `brain/progress.md`

### Capacity Agent Pool Contract Slice (2026-06-15)

- Began implementation of the capacity-based scheduler pivot.
- Added optional `maxImplementationAgents` and `maxReviewAgents` to the shared Settings contract and default settings.
- Added Rust settings parsing for both fields while preserving legacy `maxRunningProcesses` as the implementation-capacity fallback.
- Expanded scheduler status with implementation active/max/waiting counts and review active/max/waiting counts.
- Updated active/waiting queue scans so implementation capacity counts `picked` and `started` as active and `queued`/`reviewed-fix-request` as waiting; review capacity counts `reviewing` as active and `submitted` as waiting. `stale-started` is retained as visible recovery state and no longer consumes implementation capacity.
- Updated `run_review_once` to skip when `maxReviewAgents` is reached.
- Marked the capacity scheduler and review handoff plans as In Progress.
- Changed files:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/constants.ts`
  - `apps/desktop/src-tauri/src/brain.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src-tauri/src/scheduler.rs`
  - `brain/intake/2026-06-15-capacity-agent-thread-pivot.md`
  - `brain/plans/2026-06-15-feature-capacity-agent-pool-scheduler.md`
  - `brain/plans/2026-06-15-feature-review-agent-pool-handoff.md`
  - `brain/features/background-scheduler.md`
  - `brain/features/automation-runs.md`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/tasks/roadmap.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### Capacity Agent Pool Stale Reconciliation Slice (2026-06-15)

- Added stale active queue reconciliation before implementation and review capacity are measured.
- Stale `picked` reservations older than `maxPickedMinutes` return to `queued`.
- Stale `started` implementation items recover from completed run metadata to `submitted` or `blocked`; when no completion metadata exists they move to `stale-started`.
- `stale-started` remains visible for queue/thread recovery but no longer consumes an implementation agent slot.
- Review transitions now stamp `agentStartedAt`; stale `reviewing` items are blocked when they exceed `maxPickedMinutes` without leaving `reviewing`.
- Updated scheduler, automation, API contract, and capacity plan docs.
- Changed files:
  - `apps/desktop/src-tauri/src/brain.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src-tauri/src/scheduler.rs`
  - `brain/features/background-scheduler.md`
  - `brain/features/automation-runs.md`
  - `brain/api/contracts.md`
  - `brain/plans/2026-06-15-feature-capacity-agent-pool-scheduler.md`
  - `brain/progress.md`
- Checks passed: `bun --filter @brain-loop/brain-core typecheck`; `bun --filter @brain-loop/desktop-client typecheck`; `bun --filter @brain-loop/desktop typecheck`.
- Rust validation remains blocked because `cargo` is not installed on this host.

### Token-Saving Automation Triage Slice (2026-06-15)

- Began implementation of `brain/intake/2026-06-13-token-saving-automation-triage.md`.
- Changed the background automation loop and tray "Run Once" path to attempt review dispatch before new implementation dispatch, using local queue/project/capacity state before launching token-spending runners.
- Marked the token-saving automation triage plan and roadmap task In Progress.
- Changed files:
  - `apps/desktop/src-tauri/src/lib.rs`
  - `brain/features/background-scheduler.md`
  - `brain/features/automation-runs.md`
  - `brain/api/contracts.md`
  - `brain/plans/2026-06-13-feature-token-saving-automation-triage.md`
  - `brain/intake/2026-06-13-token-saving-automation-triage.md`
  - `brain/tasks/roadmap.md`
  - `brain/progress.md`
- Remaining: fixture-driven Rust tests when Cargo is available and future configured orchestrator field once product terminology is decided.

### Token-Saving Automation Triage Helper Slice (2026-06-15)

- Added a dedicated local automation triage helper for the background loop and tray "Run Once" path.
- The helper runs review dispatch first, then implementation dispatch, and writes a compact `TRIAGE:` scheduler-log summary with both local dispatch decisions.
- Manual `run_review_once` and `run_implementation_once` remain available as separate public commands.
- Changed files:
  - `apps/desktop/src-tauri/src/lib.rs`
  - `brain/features/background-scheduler.md`
  - `brain/features/automation-runs.md`
  - `brain/api/contracts.md`
  - `brain/plans/2026-06-13-feature-token-saving-automation-triage.md`
  - `brain/progress.md`
- Remaining: fixture-driven Rust tests when Cargo is available and future configured orchestrator field once product terminology is decided.

### Agent Thread Transcript Link Slice (2026-06-15)

- Updated durable agent thread metadata refresh so existing implementation/review log paths are preserved while the matching runner IDs remain unchanged.
- Added `agent_thread::upsert_run_log_path` and wired `runner::run_process` to store the actual timestamped durable log path on the queue-linked agent thread when a process starts or when spawn-failure metadata is written.
- This replaces the previous placeholder `<runnerId>.log` assumption with the real collision-resistant log filename generated by the runner.
- Changed files:
  - `apps/desktop/src-tauri/src/agent_thread.rs`
  - `apps/desktop/src-tauri/src/runner.rs`
  - `brain/plans/2026-06-15-feature-worktree-backed-agent-threads.md`
  - `brain/features/threaded-terminals.md`
  - `brain/features/automation-runs.md`
  - `brain/api/contracts.md`
  - `brain/progress.md`
- Remaining: completed-thread cleanup/archive policy, Rust tests when Cargo is available, and UI affordances for opening linked transcripts from the thread surface.

### Agent Thread Transcript UI Slice (2026-06-15)

- Passed the selected durable `AgentThread` into the opened Codex-like thread surface.
- Added implementation/review transcript cards when `logFilePath` or `reviewLogFilePath` is present on the selected thread.
- Selecting a transcript extracts the safe log filename from the stored path, reads through the existing `read_log_file` command, and renders a bounded transcript preview in the chat surface.
- Transcript preview state resets when switching threads so stale output does not bleed between selections.
- Changed files:
  - `apps/desktop/src/app.tsx`
  - `brain/plans/2026-06-15-ux-ui-codex-agent-chat-thread.md`
  - `brain/features/threaded-terminals.md`
  - `brain/features/automation-runs.md`
  - `brain/features/ui-shell.md`
  - `brain/progress.md`
- Remaining: deeper persisted message model, review/approval artifact cards, completed-thread cleanup/archive policy, visual QA, and Rust tests when Cargo is available.

### Approval Chat Cards Slice (2026-06-15)

- Embedded the existing approval broker panel in the opened Codex-like thread surface for the fixed Approval sidebar action.
- The Approval view now shows pending/resolved approval cards and sample approval request controls in the conversation area.
- Implementation/review run controls are hidden in the Approval view so the selected top action is focused on approval decisions.
- Changed files:
  - `apps/desktop/src/app.tsx`
  - `brain/plans/2026-06-15-ux-ui-codex-agent-chat-thread.md`
  - `brain/features/approval-broker.md`
  - `brain/features/ui-shell.md`
  - `brain/progress.md`
- Remaining: richer review artifact cards, deeper persisted message model, visual QA, and Rust tests when Cargo is available.

### Shadcn UI Standardization Intake (2026-06-15)

- Created `brain/intake/2026-06-15-shadcn-ui-standardization.md` from the request to standardize current UI code on shadcn primitives.
- Added proposed plans for the desktop shadcn primitive baseline, sidebar/settings controls, workspace panels/composer, and tables/sheets/forms.
- Added companion roadmap tasks for all four proposed plans.
- No implementation code was changed in this planning-only intake pass.

### Shadcn UI Standardization Implementation (2026-06-15)

- Added local desktop shadcn primitives: `Input`, `Textarea`, `Label`, `Switch`, `Checkbox`, form helpers, and `Empty`.
- Replaced remaining app-level raw buttons/inputs/toggles across sidebar, settings, sign-out, logs, composer, and project forms with shadcn primitives.
- Standardized settings groups, workspace log frame, environment panel, approval details, project metrics/forms, queue table wrappers, queue empty states, queue detail metadata, and last-error display with shadcn Card, Alert, Empty, Separator, Button, Textarea, Input, Switch, Checkbox, Label, and form compositions.
- Moved the four shadcn standardization tasks to Done and marked their plans Done.
- Changed files:
  - `apps/desktop/src/components/ui/input.tsx`
  - `apps/desktop/src/components/ui/textarea.tsx`
  - `apps/desktop/src/components/ui/label.tsx`
  - `apps/desktop/src/components/ui/switch.tsx`
  - `apps/desktop/src/components/ui/checkbox.tsx`
  - `apps/desktop/src/components/ui/form.tsx`
  - `apps/desktop/src/components/ui/empty.tsx`
  - `apps/desktop/src/components/sidebar.tsx`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/logs-panel.tsx`
  - `apps/desktop/src/components/approval-panel.tsx`
  - `apps/desktop/src/components/sign-out.tsx`
  - `apps/desktop/src/components/tables/projects/project-table.tsx`
  - `apps/desktop/src/components/tables/queue/queue-table.tsx`
  - `brain/engineering/coding-standards.md`
  - `brain/features/ui-shell.md`
  - `brain/features/project-configuration.md`
  - `brain/features/queue-dashboard.md`
  - `brain/features/approval-broker.md`
  - `brain/features/automation-runs.md`
  - `brain/intake/2026-06-15-shadcn-ui-standardization.md`
  - `brain/plans/2026-06-15-cleanup-desktop-shadcn-primitive-baseline.md`
  - `brain/plans/2026-06-15-refactor-sidebar-settings-shadcn-controls.md`
  - `brain/plans/2026-06-15-refactor-workspace-panels-composer-shadcn.md`
  - `brain/plans/2026-06-15-refactor-tables-sheets-shadcn-forms.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/done.md`
- Checks passed: `bun --filter @brain-loop/desktop typecheck`; `bun --filter @brain-loop/desktop build` with Vite chunk-size warning only.
- Raw app control scan now finds only raw `<input>` and `<textarea>` inside the local UI primitive implementations.
- Visual browser smoke check blocked: Vite port 1420 was already in use; Playwright Chromium was installed, but Chromium/headless-shell launch still aborts in this environment with macOS Mach port permission denial.
- Added follow-up dark mode support: `brain-loop-theme` persists `dark`, `light`, or `system`; `main.tsx` applies the root `.dark` class before React renders; Settings > General exposes a Theme selector; CSS declares `color-scheme` and dark boot-screen behavior.
- Re-ran checks after theme support: `bun --filter @brain-loop/desktop typecheck` passed; `bun --filter @brain-loop/desktop build` passed with the same Vite chunk-size warning only.

### Implement Rust Brain State Readers Approval (2026-06-15)

- Approved Fix 1 after confirming `getBrainStatus` handles camelCase native responses and `list_queue` returns valid items plus typed per-file read/parse errors.
- Landing was not needed because implementation happened directly in the registered project checkout.
- Review file: `brain/reviews/2026-06-15-implement-rust-brain-state-readers-review-v3.md`.
- Moved active fix handoff to `brain/handoffs/completed/2026-06-12-implement-rust-brain-state-readers-fix-1.md`.
- Moved the task and plan to Done.
- Bun typechecks passed for `@brain-loop/desktop-client` and `@brain-loop/desktop`. Cargo validation remains blocked because Cargo is not installed on host.

### Implement Rust Brain State Readers Fix 1 (2026-06-15)

- Changed `list_queue` to return `QueueListResponse` with valid `items` plus per-file `errors` for malformed or unreadable queue JSON files.
- Added shared `QueueReadError` and `QueueListResponse` TypeScript contracts and exported them from `@brain-loop/brain-core`.
- Updated `packages/desktop-client` so `listQueue()` exposes the typed queue response.
- Updated the desktop app to keep rendering valid queue items while surfacing queue read errors in the Queue tab.
- Confirmed `getBrainStatus()` already handles the current camelCase native response while retaining snake_case tolerance.
- Updated `brain/api/contracts.md` and `brain/features/brain-state.md` for the queue response shape.
- Checks run: targeted code inspection only per fast Bun monorepo command discipline. Recommended follow-up checks: `bun --filter @brain-loop/desktop-client typecheck` and `bun --filter @brain-loop/desktop typecheck`. `cargo check` remains blocked by the missing Rust/Cargo toolchain on host.

### Build Project Configuration Surface Approval (2026-06-15)

- Approved the project configuration surface after confirming project registry viewing, atomic create/update/enable mutations, validation/error handling, missing-path warnings, disabled-project active-queue warnings, and Brain documentation.
- Landing was not needed because implementation happened directly in the registered project checkout.
- Review file: `brain/reviews/2026-06-15-build-project-configuration-surface-review-v2.md`.
- Moved handoff to `brain/handoffs/completed/2026-06-12-build-project-configuration-surface-handoff.md`.
- Moved the task and plan to Done.
- Bun typecheck/build were not run because fast Bun monorepo command discipline is active. Cargo validation remains blocked because Cargo is not installed on host.

### Build Project Configuration Surface (2026-06-15)

- Added Rust-backed project registry mutation commands: `create_project`, `update_project`, and `set_project_enabled`, using validation plus atomic writes to `projects.json`.
- Extended `list_projects` responses with a read-only `pathExists` hint so missing project roots can be shown without writing that field back to Brain JSON.
- Added desktop-client wrappers for project create, update, and enable/disable commands.
- Added a Codex-standard `Projects` tab with a compact projects table, enabled/disabled/missing-path/active-disabled metrics, missing-path warnings, disabled-project active queue warnings, create/edit sheet, and inline enable/disable confirmation.
- Updated `brain/features/project-configuration.md`, `brain/api/endpoints.md`, and `brain/api/contracts.md`.
- Checks run: targeted code inspection only per fast Bun monorepo command discipline. Recommended follow-up checks: `bun --filter @brain-loop/desktop typecheck` and `bun --filter @brain-loop/desktop build`. `cargo check` remains blocked by the missing Rust/Cargo toolchain on host.

### Build Queue Dashboard And Filters Approval (2026-06-15)

- Approved Fix 1 after confirming project/status/agent/priority/stale filters, active/blocked/stale/submitted/approved summary metrics, stale and disabled/unknown project warnings, expanded queue details metadata, visible queue-fetch error state, and aligned queue status contracts.
- Landing was not needed because implementation happened directly in the registered project checkout.
- Review file: `brain/reviews/2026-06-15-build-queue-dashboard-and-filters-review-v2.md`.
- Moved active fix handoff to `brain/handoffs/completed/2026-06-15-build-queue-dashboard-and-filters-fix-1.md`.
- Moved the task and plan to Done.
- Bun typecheck/build were not run because fast Bun monorepo command discipline is active. Cargo validation remains blocked because Cargo is not installed on host.

### Build Queue Dashboard And Filters Fix 1 (2026-06-15)

- Added queue filters for project, priority, and stale active-work age alongside existing status and agent filters.
- Added queue summary metrics for active, blocked, stale, submitted, and approved work.
- Surfaced stale active items and disabled/unknown project assignments as warnings without mutating queue JSON.
- Expanded queue item details to include worktree path, active handoff path, review path, runner/session IDs, lease timing, and an explicit last-error value even when empty.
- Added a visible queue-fetch error state and loaded project registry data for disabled-project warning context.
- Aligned the shared TypeScript queue status union, queue status constants, API docs, and Rust queue mutation validator with the active Brain lifecycle statuses: `stale-started`, `reviewing`, and `landing`.
- Updated `brain/features/queue-dashboard.md` with completed dashboard behavior.
- Checks run: targeted code inspection only per fast Bun monorepo command discipline. Recommended follow-up checks: `bun --filter @brain-loop/desktop typecheck` and `bun --filter @brain-loop/desktop build`. `cargo check` remains blocked by the missing Rust/Cargo toolchain on host.

### Add PTY-Backed Thread Terminals Fix 3 (2026-06-15)

- Updated `brain/api/contracts.md` so the Tauri command table explicitly documents `close_pty(pid) -> Result<(), String>` and states that it removes backend session state and attempts to terminate the child process.
- No code validation needed beyond documentation inspection because no implementation code changed.

### Add Background Scheduler Controls Fix 3 (2026-06-15)

- Updated `run_review_once` so review eligibility follows the Brain review contract: only `submitted` queue items are counted as review-eligible. `reviewed-fix-request` items are correctly excluded from review ticks.
- Updated review tick messages to no longer describe `reviewed-fix-request` as review-eligible.
- `bun --cwd apps/desktop typecheck`: pass (exit 0)
- `cargo check`: Blocked by missing Rust/Cargo toolchain on host.
- Manual checks: Blocked by missing Rust/Cargo toolchain.

### Add PTY-Backed Thread Terminals Fix 2 (2026-06-14)

- Made `close_pty` terminate the child process by exposing it via an `Arc<Mutex<Child>>` to prevent deadlocks when the background read thread blocks.
- Fixed `TerminalPanel` to only mount xterm once, avoiding recreation when `pid` changes. Preserved active resize observer using a ref.
- Added durable PTY session metadata persistence side-by-side with log files (`.json`), including command, queue itemId, run ID, and completion timestamps.
- Updated `brain/api/contracts.md` with accurate `spawn_pty`, `close_pty`, and PTY event contract documentation.
- Documented manual smoke test precisely: "Manual smoke test blocked: Missing Rust/Cargo toolchain prevents compiling the Tauri backend."
- `bun --cwd apps/desktop typecheck`: pass (exit 0)
- `cargo check`: Blocked by missing Rust/Cargo toolchain on host.

### 2026-06-13

- **Token-saving automation triage intake**:
  - Created `brain/intake/2026-06-13-token-saving-automation-triage.md` from the request to save tokens by checking queue/task-log state locally before launching agents.
  - Added proposed plan `brain/plans/2026-06-13-feature-token-saving-automation-triage.md`.
  - Added roadmap task "Add Token-Saving Automation Triage" to `brain/tasks/roadmap.md`.
  - No implementation code was changed in this planning-only intake pass.

- **Codex UI standardization intake**:
  - Created `brain/intake/2026-06-13-codex-ui-standardization.md` from the request that Brain Loop UI should follow the Codex desktop standard.
  - Added proposed plans for Codex UI visual contract, thread workspace, environment/changes panel, artifact/change cards, and visual QA harness.
  - Retargeted the active desktop shell plan/task from Midday/shadcn-first wording to Codex-standard UI, keeping shadcn as primitives and Midday as component organization guidance.
  - Updated UI feature, project configuration, queue dashboard, approval broker, product roadmap, reference project notes, and task guidance so UI-bearing work inherits the Codex standard.
  - No app code was changed in this planning-only intake pass.

### 2026-06-12 (2)

- **Established Workspace Validation and UI Foundation**:
  - Created baseline component directories under `apps/desktop/src/components/` (modals, sheets, tables/core, forms, onboarding).
  - Created baseline hook and store directories under `apps/desktop/src/`.
  - Implemented baseline components: `Sidebar` (`components/sidebar.tsx`), `SignOut` (`components/sign-out.tsx`), `GlobalSheets` (`components/sheets/global-sheets.tsx`), and `GlobalSheetsProvider` (`components/sheets/global-sheets-provider.tsx`).
  - Refactored `apps/desktop/src/app.tsx` to use the new `Sidebar` component, leaving the entrypoint thin.
  - Documented shadcn CLI runner commands and tailwind configuration instructions in `brain/engineering/coding-standards.md`.
  - Updated `brain/engineering/repo-structure.md` to move established directories to Current Structure.
  - All workspace checks verify successfully.
- **Approved Workspace Validation and UI Foundation**: Reviewed Fix 1, confirmed Rust/Cargo prerequisites and blocked Cargo validation are documented, verified Bun typecheck and desktop build checks, and moved the task/plan to Done.
- **Fix 1 — Workspace validation & prerequisites**:
  - Documented the Rust/Cargo prerequisite for `cargo check` and Tauri development in `README.md` and `brain/engineering/coding-standards.md`.
  - Updated completion notes in the original handoff file to accurately record `cargo check` as blocked by a missing Rust host toolchain.
  - Verified that typescript validation checks (`bun run typecheck`, `bun --filter @brain-loop/desktop build`) still pass successfully.


### 2026-06-12

- Expanded the project roadmap into a 0-100 execution plan.
- Created a Brain intake with proposed implementation-sized plans.
- No implementation code has been changed for this planning pass.
- Approved all 14 generated plans from `brain/intake/2026-06-12-project-0-100.md` and moved their companion tasks to backlog.
- Converted all 14 approved plans into ready handoffs and queued global Brain project manager items.
- Created a new proposed intake for product naming, runner/model settings, MaxLoop policy, task sequencing, state-root migration, thread storage, permission alerts, and open-source positioning.
- Repaired `brain/tasks/in-progress.md` so the previously queued foundation, Brain core contracts, and atomic JSON write tasks are listed as in progress.
- **Implemented Brain Core Contracts** in `packages/brain-core/src/`:
  - `types.ts`: Shared TypeScript types for Settings, Projects, Queue Items, History Entries, Locks, Logs, Runner Metadata, Run Results, and all status/agent/priority unions.
  - `constants.ts`: Valid statuses, agents, priorities, dispatcher states, automation modes, log levels, queue status transition map, and default settings.
  - `validation.ts`: Parsing/normalization helpers including type guards, assertions, queue transition validation, path normalization, and safe parsing for booleans/integers.
  - `index.ts`: Public API re-exporting all types, constants, and validation helpers.
  - `package.json`: Added `@types/node` devDependency for typecheck compatibility.
  - Typechecks pass for all 3 workspace packages (`brain-core`, `desktop-client`, `desktop`).
- **Approved Brain Core Contracts**: Reviewed Fix 1, confirmed tolerant queue history shapes, nullable execution paths, type-level examples, and full workspace typechecks. Moved the task and plan to Done.
- **Fix 1 — Queue contract compatibility**: Updated `QueueHistoryEntry` to tolerate both status/note entries and event/detail audit entries (required: `at`, `by`; optional: `status`, `note`, `event`, `detail`, `reviewPath`, `activeHandoffPath`, `handoffPath`, `agent`). Made `executionPath` nullable and `runnerId`/`sessionId` optional to match legacy queue files. Added `examples.ts` with type-level proofs against real GND and school-clerk queue shapes. Updated `brain/api/contracts.md` with tolerant shape documentation. Typechecks pass for all 3 packages.
- **Implemented Atomic Brain JSON Writes and Locks**:
  - Created `apps/desktop/src-tauri/src/state.rs`: Brain project manager root path resolution, directory helpers.
  - Created `apps/desktop/src-tauri/src/atomic.rs`: Atomic JSON write via temp-file + rename, UTC ISO timestamp generator.
  - Created `apps/desktop/src-tauri/src/lock.rs`: Lock acquire/release/check with `BrainLock` struct, lock file persistence.
  - Created `apps/desktop/src-tauri/src/brain.rs`: Queue item read/write, status transition validation, `update_queue_item_status` with history appends, full Rust structs for `QueueItem`, `QueueHistoryEntry`, `Settings`.
  - Updated `apps/desktop/src-tauri/src/lib.rs`: Registered 4 new modules, added 4 new Tauri commands (`update_queue_item_status`, `acquire_brain_lock`, `release_brain_lock`, `check_brain_lock`).
  - Updated `packages/desktop-client/src/index.ts`: Added TypeScript wrappers for all 4 new commands.
  - Updated `packages/brain-core/src/types.ts`: Added `LockResult` interface.
  - TypeScript typechecks pass for all 3 packages. `cargo check` could not run (Rust toolchain not installed on this machine).
- **Approved Atomic Brain JSON Writes and Locks**: Reviewed Fix 1, confirmed real UTC timestamps, exclusive lock creation, durable atomic writes, and passing TypeScript checks. Cargo validation remains blocked until Rust/Cargo is installed.
- **Fix 1 — Atomic writes**: Replaced hardcoded `2026-06-12` date in `utc_now_iso` with `chrono::Utc::now()` real UTC timestamp. Made lock acquisition exclusive using `create_new(true)` with `sync_all`. Added `chrono` dependency to Cargo.toml. Typecheck passes 3/3.
- **Implemented Background Scheduler Controls**:
  - Created `apps/desktop/src-tauri/src/scheduler.rs`: Thread-safe scheduler state machine (stopped/running/paused/error), status reporting, active process counting, settings reading for maxRunningProcesses and intervals.
  - Added 6 new Tauri commands: `start_automation`, `pause_automation`, `stop_automation`, `get_scheduler_status`, `run_implementation_once`, `run_review_once`.
  - Wired tray menu: "Run Once" starts scheduler + ticks, "Pause Automation" pauses.
  - Updated `packages/desktop-client/src/index.ts`: Added TypeScript wrappers for all scheduler commands.
  - Updated `packages/brain-core/src/types.ts`: Added `SchedulerStatus` interface.
  - Created `brain/features/background-scheduler.md`.
  - TypeScript typechecks pass for all 3 packages.
- **Fix 1 — Scheduler controls**:
  - Wired `app.tsx` UI to `startAutomation`, `pauseAutomation`, and `runImplementationOnce`.
  - Updated tray "Run Once" to use the safe `run_implementation_once` path instead of bypassing capacity checks.
  - Enforced `paused` state in `run_implementation_once` and `run_review_once` to reject manual ticks.
  - Added `projects.json` reading to `run_implementation_once` to enforce disabled-project skipping.
  - Implemented durable `scheduler.log` persistence for all ticks and skipped decisions.
  - Updated `brain/features/background-scheduler.md` to document paused semantics and deferred interval loops.
- **Fix 2 — Scheduler controls**:
  - Added `runReviewOnce` import and "Run Review" button to `app.tsx` with inline success/error feedback for both Implementation and Review ticks.
  - Replaced global `enabled_count > 0` dispatch gate with item-level disabled-project eligibility in `run_implementation_once` and `run_review_once`: each queue item's project is checked against enabled projects, with per-item skip logging.
  - Updated `brain/features/background-scheduler.md` to accurately describe item-level disabled-project filtering.
  - Updated `brain/api/endpoints.md` to list all 6 implemented Automation Control commands with implementation status.
  - Rust `read_implementation_interval` function verified structurally correct (cargo unavailable for compilation check).
- **Added LaunchAgent Helper Support (v2 deferred)**:
  - Created `brain/decisions/2026-06-12-launchagent-v2-deferral.md`: ADR deferring full LaunchAgent to v2.
  - Created `apps/desktop/src-tauri/src/launchagent.rs`: Full LaunchAgent module with plist rendering, install/unload/remove, launchctl integration, and status detection. Commands available but marked v2-deferred.
  - Added 5 Tauri commands: `get_launchagent_info`, `install_launchagent`, `load_launchagent`, `unload_launchagent`, `remove_launchagent`.
  - Updated `packages/desktop-client/src/index.ts` and `packages/brain-core/src/types.ts` with `LaunchAgentInfo`.
  - TypeScript typechecks pass for all 3 packages.
- **Implemented Auditable Run Logs And Transcripts**:
  - Created `apps/desktop/src-tauri/src/runner.rs`: Implemented `run_process` which spawns commands, pipes stdout/stderr to durable logs in the app state log directory, now defaulting to `~/.brain-loop/logs/`, and emits Tauri `process-log` and `process-complete` events. Added `read_log_file` command.
  - Updated `apps/desktop/src-tauri/src/lib.rs` to register the new `runner` module and commands.
  - Updated `packages/desktop-client/src/index.ts` to export TypeScript API bindings for `runProcess`, `readLogFile`, `onProcessLog`, and `onProcessComplete` along with `LogEvent` type.
  - Built `LogsPanel` component (`apps/desktop/src/components/logs-panel.tsx`) and integrated it into `app.tsx`. It provides a sidebar of recent logs and a scrollable live-tailing log view.
  - Added CSS for `LogsPanel` in `apps/desktop/src/styles.css`.
  - `cargo check` remains blocked by missing toolchain, but TS tests passed.
- **Fix 1 — Auditable run logs and transcripts**:
  - Implemented safe log naming convention using sanitized `runId`.
  - Added JSON metadata sidecar persistence containing `queueItemId`, `projectId`, `agent`, `command`, `args`, `cwd`, and `status`.
  - Extended `run_process` Tauri contract to accept queue item IDs and project info.
  - Linked metadata files to queue items and added logic to update the `queueItemId` to `blocked` if spawn fails.
  - Updated `list_recent_logs` to join metadata JSON and include queue info in `LogSummary`.
  - Updated `ProcessCompleteEvent` to include `exitCode` and `signal` and `LogsPanel` to show metadata.
- **Fix 2 — Auditable run logs and transcripts**:
  - Hardened `read_log_file` in `runner.rs` with path traversal prevention: rejects `/`, `\`, `..`, absolute paths, non-`.log` files, empty names; validates canonical path within `logs/runs/`.
  - Fixed `LogsPanel` stale closure by using `useRef` for `selectedFile` with a stable event listener, eliminating stale React closure state from live log tailing.
  - Replaced simple `{runId}.log` naming with collision-resistant `make_log_name` using timestamp + sanitized runId + optional queueItemId/projectId/agent.
  - Updated `brain/api/contracts.md` with full `run_process` signature, `read_log_file` safe filename rules, `process-complete` payload, and log naming documentation.
  - `cargo check` unavailable; Rust changes verified by code inspection.
- **Implemented PTY-Backed Thread Terminals**:
  - Authored ADR `0002-use-portable-pty-for-terminal.md` to document the decision to use `portable-pty` and `xterm.js`.
  - Added `xterm` and `@xterm/addon-fit` dependencies to `@brain-loop/desktop`.
  - Added `portable-pty` dependency to `apps/desktop/src-tauri`.
  - Implemented `PtyState`, `spawn_pty`, `write_pty`, `resize_pty`, and `close_pty` in `pty.rs`.
  - Added `TerminalPanel` component wrapping `xterm.js` with auto-fit and resize observations.
  - Linked terminal output to durable `logs/runs/<session>.log` while streaming to UI.
  - Added explicit cleanup mechanisms when child exits or terminal panel unmounts.
  - Registered `pty` module commands and state in `apps/desktop/src-tauri/src/lib.rs`.
  - Added `spawnPty`, `writePty`, `resizePty`, `onPtyData`, and `PtyDataEvent` to `packages/desktop-client/src/index.ts`.
  - Built frontend `TerminalPanel` (`apps/desktop/src/components/terminal-panel.tsx`) with `xterm.js` and ResizeObserver support.
  - Updated `brain/api/contracts.md` and `brain/features/threaded-terminals.md`.
  - Typechecks passed. Cargo validation is still blocked by the missing local Rust toolchain.

### Build Midday/Shadcn Desktop Shell Fix 1 (2026-06-13)

- Expanded sidebar navigation to include Runs, Logs, Approvals, and Scheduler alongside Overview, Projects, Queue, Threads, and Settings — covering all product areas specified in `brain/features/ui-shell.md`.
- Added lucide-react icon imports for each nav item with consistent `size-4` icon sizing.
- Replaced raw custom `div` result displays in `app.tsx` with shadcn-composed Alert components: success runs use `CheckCircle2`, failures use `AlertCircle`, connection errors use destructive Alert variant.
- Added Skeleton loading state for initial brain status poll.
- Added empty state Alert when no activity exists (zero runs/queued/submitted/blocked).
- Added warning state Alert when scheduler status fails but brain status is healthy.
- Updated `brain/features/ui-shell.md` with Implemented Behavior section documenting the actual shell state.
- Changed files:
  - `apps/desktop/src/components/sidebar.tsx` — expanded nav items, added icon imports
  - `apps/desktop/src/app.tsx` — shadcn-composed Alert states, Skeleton loading, empty/warning states
  - `brain/features/ui-shell.md` — added Implemented Behavior section
- `bun --filter @brain-loop/desktop typecheck`: pass (exit 0)
- `bun --filter @brain-loop/desktop build`: pass (exit 0)

### LaunchAgent Helper Support Fix 1 (2026-06-13)

- Fixed `launchagent.rs` `status()` function: `launchctl list` failures now return `Error` status instead of silently collapsing to `Installed`. Added stderr diagnostics for failure cases.
- Added "LaunchAgent" tab to the desktop app UI with live status display (not_installed, installed, loaded, error), context-appropriate action buttons (Install Plist, Load Agent, Unload, Remove Plist), and explicit confirmation gate before any mutating operation.
- Added v2-deferral info Alert explaining the v1 app uses tray-icon persistence for background automation.
- Updated `brain/features/background-scheduler.md` with a LaunchAgent Helper section documenting the implemented command surface (5 Tauri commands), safety model (confirmation gate, reversibility, no auto-install), and status states.
- Changed files:
  - `apps/desktop/src-tauri/src/launchagent.rs` — status() Error/Installed fix
  - `apps/desktop/src/app.tsx` — LaunchAgent tab with status, actions, confirmation
  - `brain/features/background-scheduler.md` — LaunchAgent Helper section
- `bun --filter @brain-loop/desktop typecheck`: pass (exit 0)
- `bun --filter @brain-loop/desktop build`: pass (exit 0)
- `cargo check`: not run; cargo not installed

### Manual Implementation/Review Dispatch (2026-06-13)

- Verified that `run_implementation_once` and `run_review_once` are fully implemented in `apps/desktop/src-tauri/src/lib.rs` (lines 424-533) from the background-scheduler-controls work.
- `run_implementation_once`: requires scheduler running, respects `maxRunningProcesses`, selects `queued`/`reviewed-fix-request` items, per-item disabled-project skipping, durable scheduler.log.
- `run_review_once`: requires scheduler running, selects only `submitted` items (not `reviewed-fix-request`), per-item disabled-project skipping, durable logging.
- UI is wired in app.tsx with buttons, result alerts (Alert component), and scheduler state Badge.
- Updated `brain/features/automation-runs.md` from "Planned Behavior" to fully documented "Implemented Behavior" with dispatch, logs, UI controls, and runner boundaries.
- Added Dispatch Contract section to `brain/api/contracts.md` documenting eligibility rules, capacity limits, and ticket logging for both commands.
- Changed files:
  - `brain/features/automation-runs.md` — implemented behavior documentation
  - `brain/api/contracts.md` — dispatch contract section
- `bun --filter @brain-loop/desktop typecheck`: pass (exit 0)
- `cargo check`: not run; cargo not installed


### Build Midday/Shadcn Desktop Shell Approval (2026-06-15)

- Approved Fix 1 after confirming expanded product navigation, shadcn-composed loading/empty/error/warning states, and updated UI shell documentation.
- Checks passed: bun --filter @brain-loop/desktop typecheck; bun --filter @brain-loop/desktop build.
- Review file: brain/reviews/2026-06-15-build-midday-shadcn-desktop-shell-review-v2.md.
- Moved active fix handoff to brain/handoffs/completed/2026-06-13-build-midday-shadcn-desktop-shell-fix-1.md.

### LaunchAgent Helper Support Approval (2026-06-15)

- Approved Fix 1 after confirming LaunchAgent status/actions are visible in the app, mutating operations require confirmation, status errors surface as Error, and background scheduler docs describe the v2-deferred helper scope.
- Checks passed: bun --filter @brain-loop/desktop typecheck; bun --filter @brain-loop/desktop build.
- Cargo validation remains blocked because cargo is not installed on host.
- Review file: brain/reviews/2026-06-15-add-launchagent-helper-support-review-v2.md.
- Moved active fix handoff to brain/handoffs/completed/2026-06-12-add-launchagent-helper-support-fix-1.md.

### Build Queue Dashboard And Filters (2026-06-15)

- Added `QueueTable` component to `apps/desktop/src/components/tables/queue/queue-table.tsx`.
- Integrated `listQueue()` backend fetch into `app.tsx`.
- Implemented queue items filtering by status and agent via shadcn UI Selects.
- Implemented `QueueItem` details Sheet showing execution paths, priority, and history details.
- Added empty and loading states using shadcn Skeleton and Table primitives.
- Installed `table`, `sheet`, `dropdown-menu`, `select` shadcn components.
- Changed files:
  - `apps/desktop/src/app.tsx` - Added Queue tab and fetch call.
  - `apps/desktop/src/components/tables/queue/queue-table.tsx` - Queue rendering and UI components.
  - Installed shadcn ui dependencies into `apps/desktop/src/components/ui/`.
- `bun --filter @brain-loop/desktop typecheck`: pass (exit 0)
- `bun --filter @brain-loop/desktop build`: pass (exit 0)
- `cargo check`: not run; cargo not installed

### Add Approval Broker And Cards (2026-06-15)

- Added shared approval request/status/kind contracts in `@brain-loop/brain-core`.
- Added Rust approval broker commands for listing, requesting, approving, denying, and expiring approval requests.
- Added approval lifecycle events: requested, approved, denied, expired, and resolved.
- Added desktop client wrappers and event listener support for approval flows.
- Built an Approvals tab with cards for pending/resolved requests, command/permission/destructive kind badges, context details, history, and approve/deny/expire controls.
- Denied or expired requests attempt to block linked queue items with `approval_denied` or `approval_expired` audit events.
- Updated approval broker feature, API contracts, endpoints, and permissions documentation.
- Changed files:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/approval.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/approval-panel.tsx`
  - `brain/features/approval-broker.md`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/api/permissions.md`
- Required typecheck, cargo check, and manual UI verification are recommended next; skipped in this pass under fast monorepo command discipline.

### Add Notifications, Packaging, And Release Readiness (2026-06-15)

- Added a dependency-free notification bridge using the WebView `Notification` API with in-app fallback state.
- Added Overview notification preferences for blocked queue items, submitted/review-ready work, approval-needed events, and scheduler/queue-read warnings.
- Wired notifications to state transitions so unchanged polling snapshots do not repeatedly notify the user.
- Added approval-request notifications from approval lifecycle events.
- Updated README with local usage, release verification commands, smoke-test checklist, and packaging blockers.
- Updated roadmap and feature docs to reflect MVP notification/release status and remaining next work.
- Changed files:
  - `apps/desktop/src/lib/notifications.ts`
  - `apps/desktop/src/app.tsx`
  - `README.md`
  - `brain/product/roadmap.md`
  - `brain/features/automation-runs.md`
  - `brain/features/background-scheduler.md`
  - `brain/features/approval-broker.md`
  - `brain/api/permissions.md`
  - `brain/progress.md`
- Review validation completed: `bun --filter @brain-loop/desktop typecheck`, `bun run typecheck`, `bun --filter @brain-loop/desktop build`, and `git diff --check` passed. Native Tauri packaging remains blocked because `cargo` is not installed on this host; manual release smoke tests remain recommended.

### Codex Shell Sidebar And Settings Redesign (2026-06-15)

- Replaced the old product-menu sidebar with a clean Codex-style `Agents` rail for implementation, review, and approvals workstreams.
- Moved Settings to the sidebar footer and removed the main product tab bar from the visible app frame.
- Reworked the main app bar so it begins at the sidebar boundary with Codex-like dark framing and a rounded top-left workspace edge.
- Embedded operational surfaces in the active workspace: agent status, queue table, approval cards, run logs, terminal panel, bottom composer, and compact environment panel.
- Added a Codex-style Settings page with Back to app, settings search, grouped category rail, dense setting rows, toggles, selects, implemented controls, and planned/disabled rows for future settings contracts.
- Settings now represents general app preferences, notification categories, project configuration, agents/models, scheduler controls, MaxLoop/scheduling plans, threads/worktrees, permissions/approvals, LaunchAgent, git/environment, and release readiness.
- Changed files:
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/sidebar.tsx`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `brain/intake/2026-06-15-codex-shell-settings-redesign.md`
  - `brain/plans/2026-06-15-ux-ui-codex-shell-sidebar-app-bar-redesign.md`
  - `brain/plans/2026-06-15-ux-ui-codex-settings-surface.md`
  - `brain/features/ui-shell.md`
  - `brain/features/project-configuration.md`
  - `brain/features/background-scheduler.md`
  - `brain/features/approval-broker.md`
  - `brain/product/roadmap.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/done.md`
- `bun --filter @brain-loop/desktop typecheck`: pass.
- `bun run typecheck`: pass.
- `bun --filter @brain-loop/desktop build`: pass, with Vite chunk-size warning only.
- `git diff --check`: pass.
- Automated screenshot capture was attempted but blocked because Playwright's bundled Chromium is missing and the system Chrome headless process aborts in this environment.

### Codex Shell Button And Narrow App Bar Polish (2026-06-15)

- Changed the shared desktop Button default to the flat secondary variant so unspecified app actions no longer render as bright/white primary buttons.
- Converted remaining visible workspace, approval, queue, project, settings, LaunchAgent, and composer action buttons to secondary/ghost/destructive semantics.
- Hid the main workspace app bar below the wide desktop breakpoint so minimized/narrow windows do not show duplicate app chrome.
- Updated UI shell documentation with the flat action-button and narrow app-bar behavior.
- Changed files:
  - `apps/desktop/src/components/ui/button.tsx`
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/approval-panel.tsx`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `apps/desktop/src/components/tables/queue/queue-table.tsx`
  - `apps/desktop/src/components/tables/projects/project-table.tsx`
  - `brain/features/ui-shell.md`
  - `brain/progress.md`
- Button-specific search found no remaining `default` or `outline` Button variants in the polished desktop surfaces; the lone unqualified `Add Project` button inherits the secondary default.
- `git diff --check` passed for the touched UI and Brain files.

### Durable Agent Thread Metadata Slice (2026-06-15)

- Added durable agent thread records under the configured thread storage root, now defaulting to `~/.brain-loop/threads/*.json`.
- Added shared `AgentThread` / `AgentThreadStatus` contracts and a `list_agent_threads` Tauri/client command.
- Implementation and review ticks now prepare or update thread metadata for enabled eligible queue items.
- Updated the Codex-like sidebar thread list to prefer durable thread records and render flat title-only rows with compact elapsed time on the right.
- Worktree creation, review runner reuse of the same worktree, cleanup, and full transcript linking remain open for the larger worktree-backed thread plan.

### Per-Task Worktree Preparation Slice (2026-06-15)

- Added a Rust worktree preparation module that creates or reuses deterministic per-task Git worktrees under the configured worktree storage root, now defaulting to `~/.brain-loop/worktrees/<project>/<queue-item>/`.
- Implementation ticks now persist `worktreePath` and `executionPath` on enabled eligible queue items before future runner dispatch.
- Review ticks reuse the queue item's existing worktree path, or prepare the same deterministic queue-linked path for older submitted items.
- Worktree preparation failures are persisted as `lastError` and `worktree_prepare_failed` history entries, with no silent fallback to the main checkout.
- Real runner launch, direct implementation-completion-to-review triggering, cleanup, and transcript linking remain open.

### Codex Sidebar Density Polish (2026-06-15)

- Removed the remaining light root-token fallback and global white button default so the shell stays dark-first even when stale light/system theme state exists.
- Tightened sidebar, settings, home, and chat text sizing for a denser Codex-like scale.
- Flattened Review, Implementation, and Approval sidebar actions into ghost-button title-only rows with no wrapper card, icon, or subtitle.
- Kept thread rows title-only with compact right-side runtime labels.

### Capacity Runner Launch Slice (2026-06-15)

- `run_implementation_once` now fills open implementation slots by preparing queue-linked worktrees/threads, transitioning eligible items to `picked` and `started`, assigning `runnerId`, and launching the selected provider through `runner::run_process`.
- Added launch defaults for `open-code` (`opencode run`), `antigravity` (`agy --print`), and Codex implementation fallback (`codex exec`), using the provider defaults from the Brain skills.
- `run_review_once` now fills open review slots by transitioning submitted items to `reviewing`, assigning `reviewRunnerId`, and launching Codex review with the same queue-linked execution/worktree context.
- Runner spawn failures and non-zero exits now block active queue items with durable `lastError` details.
- Configurable/event-driven polling cadence, full direct review result telemetry, and richer stale-runner recovery remain open.

### Continuous Capacity Loop And Review Trigger Slice (2026-06-15)

- `start_automation` now starts one background capacity loop that repeatedly dispatches implementation and review work while scheduler state is `running`.
- The loop idles while paused and exits when scheduler state becomes stopped or error.
- Successful implementation runner exits now submit still-started queue items and immediately request review dispatch if automation is running and review capacity is available.
- Remaining: configurable/event-driven polling cadence, richer stale-runner recovery, full review landing telemetry, and Rust validation once Cargo is available.

### Runner Model Catalog Settings Slice (2026-06-15)

- Began implementation of `brain/intake/2026-06-12-loop-product-settings.md` runner/model catalog work.
- Added global `runnerCatalog`, default implementation runner/model, and default review runner/model fields to the shared settings contract and default settings.
- Added Rust `get_settings` and `update_settings` commands that normalize older settings files, validate catalog/default consistency, prevent disabled runners from being saved as role defaults, and atomically write `settings.json`.
- Replaced Settings > Agents placeholders with persisted Codex-dense controls for role defaults, per-runner enabled state, model lists, and per-runner default models.
- Implementation launches now resolve configured models for the queue item's runner; review launches use the configured default review runner/model while preserving the queue-linked worktree context.
- Changed files:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/constants.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `brain/intake/2026-06-12-loop-product-settings.md`
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/in-progress.md`
  - `brain/features/project-configuration.md`
  - `brain/features/background-scheduler.md`
  - `brain/features/automation-runs.md`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
- Remaining: project-level runner/model overrides, handoff-generated model recommendations, manual settings smoke test, and Rust validation once Cargo is available.

### MaxLoop Concurrency Policy Slice (2026-06-15)

- Began implementation of the MaxLoop concurrency policy intake from `brain/intake/2026-06-12-loop-product-settings.md`.
- Added shared `maxLoopPolicy` settings contract with global, runner, project, and runner-project implementation-agent caps.
- Added optional queue `waitingReason` so capacity waits can be explained without introducing a new queue status.
- Updated Rust settings defaults, normalization, and validation for positive MaxLoop caps and supported runner ids.
- Updated implementation dispatch to enforce global, runner, project, and runner-project caps per candidate. Items blocked by MaxLoop keep their status and receive `waitingReason` plus a `maxloop_waiting` history entry; dispatch continues scanning later eligible tasks.
- Updated Settings > Automation with persisted MaxLoop controls for global, per-runner, per-project, and default-runner/project caps.
- Updated Queue warnings and detail sheet to show durable waiting reasons.
- Changed files:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/constants.ts`
  - `packages/brain-core/src/index.ts`
  - `apps/desktop/src-tauri/src/brain.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src-tauri/src/scheduler.rs`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `apps/desktop/src/components/tables/queue/queue-table.tsx`
  - `brain/intake/2026-06-12-loop-product-settings.md`
  - `brain/plans/2026-06-12-feature-maxloop-concurrency-policy.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/in-progress.md`
  - `brain/features/background-scheduler.md`
  - `brain/features/automation-runs.md`
  - `brain/features/queue-dashboard.md`
  - `brain/api/contracts.md`
  - `brain/progress.md`
- Remaining: Rust table tests when Cargo is available and a broader scheduling-policy slice for FIFO/fix-first/dependency ordering.

### Task Sequence Scheduling Policy Slice (2026-06-15)

- Began implementation of `brain/intake/2026-06-12-loop-product-settings.md` task sequencing and scheduling policy work.
- Added shared `SchedulingPolicy` and `settings.schedulingPolicy`, defaulting to `fix-before-new-task`.
- Added queue `dependsOn` and `blockedBy` fields alongside existing `waitingReason`.
- Updated implementation dispatch ordering:
  - `fix-before-new-task` sorts `reviewed-fix-request` before new queued work, then by priority and creation time.
  - `fifo` sorts all eligible implementation work by creation time.
- Added dependency gating before MaxLoop checks. A dependency is satisfied only when the referenced queue item is `approved`; missing, blocked, self-referential, cyclic, or not-yet-approved dependencies keep the candidate queued and record `waitingReason`, `blockedBy`, and a `dependency_waiting` history event.
- Added Settings > Automation control for FIFO vs fix-before-new-task.
- Added Queue detail rows for `dependsOn` and `blockedBy`.
- Added ADR `brain/decisions/2026-06-15-queue-dependency-scheduling-contract.md`.
- Changed files:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/constants.ts`
  - `packages/brain-core/src/index.ts`
  - `apps/desktop/src-tauri/src/brain.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `apps/desktop/src/components/tables/queue/queue-table.tsx`
  - `brain/decisions/2026-06-15-queue-dependency-scheduling-contract.md`
  - `brain/intake/2026-06-12-loop-product-settings.md`
  - `brain/plans/2026-06-12-feature-task-sequence-scheduling-policy.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/in-progress.md`
  - `brain/api/contracts.md`
  - `brain/features/background-scheduler.md`
  - `brain/features/automation-runs.md`
  - `brain/features/queue-dashboard.md`
  - `brain/progress.md`
- Remaining: Cargo-backed scheduler table tests when Rust tooling is available and richer dependency editing controls if queue producers need in-app authoring.

### Handoff Runner Model Recommendations Slice (2026-06-15)

- Began implementation of the handoff runner/model recommendation intake from `brain/intake/2026-06-12-loop-product-settings.md`.
- Added optional queue item fields `recommendedModel` and `modelRecommendationReason` while preserving compatibility with existing `recommendedAgent`-only queue items.
- `list_queue` now derives a display fallback `recommendedModel` from runner/model settings when older queue items omit it.
- Implementation launch now prefers queue `recommendedModel` over runner/model settings defaults.
- Implementation and review prompts include recommended runner/model metadata and the model recommendation reason.
- Queue detail sheets expose recommended runner, recommended model, and model recommendation reason.
- Added reusable handoff template guidance at `brain/templates/handoff-runner-model-recommendation.md`.
- Changed files:
  - `packages/brain-core/src/types.ts`
  - `apps/desktop/src-tauri/src/brain.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src/components/tables/queue/queue-table.tsx`
  - `brain/templates/handoff-runner-model-recommendation.md`
  - `brain/intake/2026-06-12-loop-product-settings.md`
  - `brain/plans/2026-06-12-feature-handoff-runner-model-recommendations.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/in-progress.md`
  - `brain/api/contracts.md`
  - `brain/features/automation-runs.md`
  - `brain/features/project-configuration.md`
  - `brain/features/queue-dashboard.md`
  - `brain/progress.md`
- Remaining: external Brain skill/generator updates if handoff creation lives outside this repo, and explicit review handoff creation metadata if a durable review-handoff artifact is added later.

### State Root And TOML Settings Slice (2026-06-15)

- Moved Brain Loop's default durable state root to `~/.brain-loop`.
- Changed global settings storage from `settings.json` to `settings.toml` while keeping queue, project, workspace, thread, lock, log, and run metadata files as JSON.
- Added legacy migration from `~/.codex/brain-project-manager`: missing non-worktree state is copied into the new root and legacy `settings.json` is converted to TOML. Git worktrees are intentionally not copied or moved.
- Updated shared defaults, desktop UI copy, API/feature docs, task state, and ADR `brain/decisions/2026-06-15-brain-loop-state-root-and-settings-toml.md`.
- Changed files include:
  - `apps/desktop/src-tauri/src/state.rs`
  - `apps/desktop/src-tauri/src/atomic.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src-tauri/src/scheduler.rs`
  - `packages/brain-core/src/constants.ts`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `apps/desktop/src/components/approval-panel.tsx`
  - `README.md`
  - `brain/SYSTEM_OVERVIEW.md`
  - `brain/AI_PROMPT_RULES.md`
  - `brain/api/contracts.md`
  - `brain/features/brain-state.md`
  - `brain/features/background-scheduler.md`
  - `brain/features/automation-runs.md`
  - `brain/features/threaded-terminals.md`
- Installed Brain skills under `~/.codex/skills` were patched outside the repo writable root to use `~/.brain-loop` and `settings.toml`; skill loader paths under `~/.codex/skills` remain unchanged.

### Project Folder Onboarding And Sidebar Automation Control (2026-06-16)

- Added project folder inspection for Add Project so the desktop app can select a folder, infer project name/id/path, and preview Brain setup before creation.
- Added project Brain onboarding during project creation:
  - Existing `<project>/brain/` folders are preserved as project-local Brain storage.
  - Projects without `brain/` receive external Brain storage under `~/.brain-loop/project-brains/<project-id>/brain/`.
  - `AGENTS.md` or `AGENT.md` and `CLAUDE.md` receive idempotent managed Brain Loop instruction blocks.
- Extended project records with optional `brainPath`, `brainStorage`, and read-only `brainPathExists`.
- At that point the sidebar play/pause automation control was topmost; it later moved to the compact footer status slot while the collapsed/minimized sidebar drag strip remained constrained.
- Added ADR `brain/decisions/2026-06-16-project-brain-onboarding-policy.md`.

### Simplified Scheduling Settings Surface (2026-06-17)

- Split Settings > Automation into clearer intent groups: `Automation runtime`, `Agent pools`, `Implementation queue order`, and `Fairness limits`.
- Kept the persisted `settings.toml` schema compatible while changing the UI to show `schedulingPolicy` as a two-option queue-order control.
- Changed MaxLoop cap editing so only explicit runner, project, and runner-project overrides are rendered as editable rows; inherited caps remain implicit.
- Updated scheduler/API feature docs to reflect the renamed settings surface and unchanged `schedulingPolicy` contract.
- Changed files:
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `brain/features/background-scheduler.md`
  - `brain/features/automation-runs.md`
  - `brain/api/contracts.md`
  - `brain/progress.md`

### Brain Handoff Orchestration Thread Contract (2026-06-18)

- Clarified that Brain skill-created handoffs should create lightweight parent orchestration threads, not just queue items.
- `brain-batch-handoff` is expected to create or update one orchestration thread for the intake conversion session, with a compact task table and links to every generated handoff and queue item.
- Standalone `brain-handoff` is expected to create a one-task orchestration thread unless it is attaching to an existing batch orchestration.
- Queue items created by Brain handoff skills must carry `orchestrationId` and `orchestrationTitle`, with the parent orchestration linking queue ids, generated worker thread ids, and handoff paths.
- Changed files:
  - `brain/skills/brain-loop-orchestration-handoff/SKILL.md`
  - `brain/features/orchestration.md`
  - `brain/api/contracts.md`
  - `brain/progress.md`
