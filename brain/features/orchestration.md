# Feature: Orchestration Threads

## Purpose

Capture intake, refinement, and planning chats as first-class Brain Loop records, then connect those orchestration records to the queued worker tasks and agent threads they produce.

## Implemented Behavior

- Brain Loop stores orchestration chats as JSON under `~/.brain-loop/orchestrations/*.json`.
- Orchestration records include project identity, origin agent, status, model, messages, linked queue item ids, linked worker thread ids, and linked handoff artifact paths.
- Queue items created from an orchestration carry `orchestrationId` and `orchestrationTitle`.
- Worker thread records mirror `orchestrationId` when derived from linked queue items.
- The desktop sidebar has text-only `Workers` and `Orchestrator` tabs. Workers shows implementation/review thread rows after a queue item is picked or later; queued-only handoffs stay in Dashboard/queue surfaces until claimed. Orchestrator shows orchestration chats.
- Switching to the `Orchestrator` tab without an active orchestration shows a Codex-style start surface with a centered intake composer, project selector, model display, and recent orchestration shortcuts.
- The Orchestrator start surface includes a grouped orchestrator/model dropdown with Codex and Claude sections. New orchestration drafts persist the selected origin agent and model on the orchestration record, and the first intake message carries the selected model metadata.
- The orchestration workspace supports persisted intake messages, linked queue task rows, and a top-right Handoff action.
- Submitting from the Orchestrator start surface creates a persisted orchestration draft and appends the first intake turn with Brain Loop prompt-context metadata.
- The Orchestrator start surface exposes the same project dropdown from the title project name and the composer project control. The dropdown supports search, selected-state checks, and `Add new project` actions for `Start from scratch` and `Use an existing folder`.
- Linked queue task rows open their worker thread view and switch the sidebar back to `Workers`.
- The Orchestrator New action opens the start surface; native orchestration records are persisted when the user submits the first intake message.
- The orchestration workspace includes a registered-project selector; changing it persists project id/name/path on the orchestration before handoff.
- Native Brain Loop handoff requires a registered project selection before creating queue items. External-agent imports may auto-register missing projects disabled by default.
- User orchestration messages carry automatic Brain Loop intake/handoff prompt-context metadata so later handoff generation keeps the right project and queue-linking rules attached.
- Native orchestration chat turns call the selected local orchestrator runtime after each user intake/refinement message and persist the assistant response on the orchestration thread.
- Codex orchestration runs through the local Codex CLI in a read-only sandbox. Claude orchestration runs through the local Claude CLI in print/plan mode with tools disabled. Both are planning-only and persist their output before handoff.
- Generated handoff bodies exclude Brain Loop's own `orchestration-intake-guidance` assistant messages, so worker tasks receive user/external-agent intake instead of UI guidance.
- Handoff creates markdown plan/handoff artifacts under the orchestration folder, creates queued handoff JSON files, links queue/thread ids back to the orchestration, and marks the orchestration `handed-off`.
- Newly created queued handoffs stay in Dashboard/queue surfaces until picked. Once picked or later, handoffs appear in the `Workers` list as implementation/review worker rows.
- External agents can use `brain/skills/brain-loop-orchestration-handoff/SKILL.md` to create orchestration chats and linked queue items in Brain Loop's durable format.
- If an external handoff references an unregistered project, Brain Loop can register it automatically with `enabled: false`; automation will skip queued work until the user enables the project.
- Brain skill-created handoffs use the same parent orchestration record shape: `brain-batch-handoff` creates or updates one lightweight orchestration thread for the intake conversion session, and standalone `brain-handoff` creates a one-task orchestration thread unless attaching to an existing batch thread.
- Intake-derived orchestration threads store compact summary messages with a markdown task table covering task title, plan path, handoff path, queue item path/id, recommended agent/model, and queued status. They do not copy full Codex or runner chat transcripts.
- Queue items created by Brain handoff skills carry `orchestrationId` and `orchestrationTitle`, and the orchestration record is updated with `linkedQueueItemIds`, generated `linkedThreadIds`, `linkedHandoffPaths`, and `status: handed-off`.

## Storage Contract

```text
~/.brain-loop/
  orchestrations/*.json
  orchestrations/<orchestration-id>/handoffs/*-plan.md
  orchestrations/<orchestration-id>/handoffs/*-handoff.md
  queues/handoffs/*.json
```

## UI Notes

- The tab treatment is intentionally minimal: active tab text is bolder/brighter, with no heavy tab frame.
- The sidebar More menu includes a Projects submenu with checkbox rows for enabling/disabling scheduler eligibility.
- Orchestrator start requires a project selection before intake submission. There is no no-project mode in the project dropdown.
- The orchestrator/model selector invokes the selected local Codex or Claude planning runtime for orchestration chat responses.
- Imported disabled projects appear immediately in Brain Loop and can be enabled from the sidebar without visiting Settings.

## Brain Docs To Keep Updated

- `brain/api/contracts.md`
- `brain/api/endpoints.md`
- `brain/features/project-configuration.md`
- `brain/features/ui-shell.md`
