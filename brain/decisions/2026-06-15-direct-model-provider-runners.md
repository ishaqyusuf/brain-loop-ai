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

These entries start disabled by default until the direct Brain Loop tool-loop runtime can safely execute model tool calls, apply patches, run commands through approval gates, persist structured events, and complete queue transitions without relying on an external coding CLI.

Brain Loop will expose the direct runtime boundary before enabling dispatch. The read-only runtime contract includes normalized direct providers, request-shape metadata, tool schemas for file read/search, patch application, command execution, and task completion, plus the structured event kinds that will feed the existing harness/thread ingestion path.

Request construction is allowed before network execution. Brain Loop may validate a normalized direct-provider turn and preview the provider-specific JSON request envelope for DeepSeek OpenAI-chat or Gemini generateContent, but it must not send provider requests, read API keys, execute tools, or transition queues until the direct runtime approval and execution loop is complete.

## Consequences

- Existing queue, project, and thread JSON compatibility remains intact.
- CLI runners remain supported and continue to be the default dispatch path.
- Settings can represent direct model targets before they are dispatch-enabled.
- The direct runtime can be implemented incrementally behind the existing harness event and durable thread contracts.
- Scheduler dispatch must not silently treat direct-provider runners as CLI commands.
- UI can show the planned direct-provider tool/event contract without implying that provider dispatch is active.
- Provider payload preview can be tested separately from provider networking and approval execution.
