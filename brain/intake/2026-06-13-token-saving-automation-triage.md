# Brain Intake: Token-Saving Automation Triage

## Status
Proposed

## Created Date
2026-06-13

## Last Updated
2026-06-13

## Raw Input
When automation runs, save token usage by first doing what can be checked manually/local in code. The automation should inspect task logs or queue state for statuses such as submitted and queued. If submitted work exists, a Codex thread or the configured user orchestrator should run. If queued work exists, the relevant implementation agent should spin off. The goal is to avoid spending tokens on agent orchestration when simple local state inspection can decide the next action.

## Generated Plans
- [ ] Add Token-Saving Automation Triage - `brain/plans/2026-06-13-feature-token-saving-automation-triage.md` - Status: Proposed

## Recommended Execution Order
1. Add Token-Saving Automation Triage - It builds on the existing scheduler, queue readers, run logs, and manual dispatch work without requiring a broad UI redesign.

## Agent Recommendations
- Add Token-Saving Automation Triage: open-code - This is focused Rust scheduler/queue selection work with contract and doc updates.

## Merged Items
- Local task-log inspection, submitted-work dispatch, queued-work dispatch, and token-saving automation policy were merged because they describe one scheduler decision layer.

## Duplicate Or Existing Items
- Adjacent but not duplicate: `brain/plans/2026-06-12-feature-background-scheduler-controls.md` covers start/pause/tick controls.
- Adjacent but not duplicate: `brain/plans/2026-06-12-feature-manual-run-dispatch.md` covers one-shot runner dispatch.
- Adjacent but not duplicate: `brain/plans/2026-06-12-feature-task-sequence-scheduling-policy.md` covers FIFO/fix-first/dependency ordering.

## Needs Clarification
- TODO: Confirm the exact configurable field name for the user-selected orchestrator option if it should be something other than the current runner/default-agent settings.
- TODO: Confirm whether "task logs" means only queue item JSON history, run metadata/log sidecars, or both.

## Skipped Items
- None

## Approval Notes
- None

## Handoff Notes
- Use `brain-batch-handoff` to convert approved plans into handoffs and queue items.
