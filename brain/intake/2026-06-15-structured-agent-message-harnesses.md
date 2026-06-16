# Intake: Structured Agent Message Harnesses

## User Need

Show exact agent/model messages directly in Brain Loop threads, following the T3 Code-style control-plane concept instead of scraping terminal transcripts.

## Scope

- Add canonical structured provider event contracts.
- Add a runner harness ingestion path beside transcript capture.
- Persist exact provider messages into durable thread records.
- Label provider message provenance in the thread UI.
- Show provider capability modes in settings.

## Implementation Slice Completed

- Added shared harness event and capability types.
- Added Rust harness commands for capability listing, live Codex session start/send/stop, event replay, and raw event ingestion.
- Added a Codex `app-server --stdio` adapter using newline-delimited JSON-RPC. Brain Loop starts provider threads, sends `turn/start`, and consumes provider notifications.
- Added durable event append logs under `~/.brain-loop/harness/events/`.
- Added normalized exact provider-message persistence into `AgentThread.messages`, idempotent by `sourceEventId`.
- Added thread provenance fields: `messageSource`, `providerSessionId`, and `providerThreadId`.
- Updated the opened thread UI to label exact provider messages and transcript-backed threads, preserve provider message line breaks, and offer a compact Codex harness composer.
- Updated Settings > Agents with provider message capture capabilities.
- Added replay recovery from JSONL without duplicating the event log.
- Added focused Rust tests for Codex provider notification normalization and exact-message metadata.

## Remaining Follow-Up

- Wire approval/tool/file-change provider events into richer UI cards beyond raw event capture.
- Promote OpenCode from transcript-only after a live ACP/session stream is verified; this install exposes `opencode acp`, `opencode serve`, and `opencode export`.
- Promote Antigravity/AGY from transcript-only only if a stable structured session/event API is found; this install exposes CLI conversation/log-file flags but no verified structured live stream.
