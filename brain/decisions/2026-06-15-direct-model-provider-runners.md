# ADR: Direct Model Provider Runners

## Status

Accepted

## Context

Brain Loop originally launched automation through external runner CLIs such as OpenCode, Antigravity, and Codex. That preserves compatibility, but it leaves exact model messages, tool calls, approval boundaries, cost telemetry, and file-edit discipline partly outside Brain Loop.

The product direction now needs first-class direct model providers, starting with DeepSeek and Gemini, while preserving existing CLI runners.

## Decision

Brain Loop will model runner catalog entries as either `cli` or `direct-provider`.

Initial direct-provider entries:

- `direct-deepseek`
  - Provider id: `deepseek`
  - API style: `openai-chat`
  - API key env: `DEEPSEEK_API_KEY`
  - Models: `deepseek-v4-pro`, `deepseek-v4-flash`
- `direct-gemini`
  - Provider id: `gemini`
  - API style: `gemini-generate-content`
  - API key env: `GEMINI_API_KEY`
  - Models: `gemini-3.5-flash`, `gemini-3.1-pro`, `gemini-3-flash`

These entries are represented in the runner catalog and can be used for implementation dispatch once enabled by settings or queue recommendation. They can also be selected as the default review runner once enabled; direct review uses a read-only tool subset and reconciles only review-owned queue outcomes.

Brain Loop exposes the direct runtime boundary through normalized direct providers, request-shape metadata, tool schemas for file read/search, patch application, command execution, and task completion, plus the structured event kinds that feed the existing harness/thread ingestion path.

Request construction is allowed independently from dispatch. Brain Loop may validate a normalized direct-provider turn and preview the provider-specific JSON request envelope for DeepSeek OpenAI-chat or Gemini generateContent without reading API keys.

Direct-provider turn execution is allowed when it uses provider-specific environment variables, returns only redacted request metadata, normalizes provider output into harness events, and records provider/parse failures as thread-visible events.

Bounded direct-provider safe-tool loops may execute read/search/finish tools, record tool-completion harness events, and feed safe tool results back to the provider. They must stop at the first gated mutating tool request by creating a Brain Loop approval request.

Approved direct-provider mutating tools are allowed only when Brain Loop verifies the approval request is approved, command-scoped to the direct tool, and path/queue matched to the original tool input. Approved patch execution uses `git apply` inside the canonical execution path; approved command execution uses a bounded shell command inside the canonical execution path. These commands still do not transition queues directly; direct implementation dispatch owns queue reconciliation.

Direct-provider implementation dispatch is enabled for `direct-deepseek` and `direct-gemini`. The scheduler must transition eligible implementation items through the same `picked`/`started` states as CLI runners, then launch the Brain Loop-owned direct tool loop in a background runtime. Direct implementation prompts embed the active handoff content because direct tools are execution-path scoped. `finish_task` submits or blocks, approval-required mutating tools leave the item started with a waiting reason, and provider failures/max-iteration stops block the item.

Direct-provider review dispatch is enabled for `direct-deepseek` and `direct-gemini` through the default review runner setting. The scheduler transitions submitted items to `reviewing`, then launches a Brain Loop-owned direct review loop with read/search/finish tools only. `finish_task.queueStatus` may request `reviewed-fix-request`, `landing`, or `blocked`; landing still flows through the registered project landing policy.

## Consequences

- Existing queue, project, and thread JSON compatibility remains intact.
- CLI runners remain supported and continue to be the default dispatch path.
- Settings can represent direct model targets and use them for implementation dispatch without treating them as CLI commands.
- The direct runtime can be implemented incrementally behind the existing harness event and durable thread contracts.
- Scheduler dispatch must not silently treat direct-provider runners as CLI commands.
- UI can show the direct-provider tool/event contract as active for implementation and review dispatch while preserving the stricter read-only review tool boundary.
- Provider payload preview can be tested separately from manual provider networking and approval execution.
