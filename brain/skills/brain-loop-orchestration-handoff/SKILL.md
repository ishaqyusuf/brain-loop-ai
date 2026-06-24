---
name: brain-loop-orchestration-handoff
description: Create Brain Loop orchestration chats and linked queue handoffs from external agents such as Codex or Claude.
---

# Brain Loop Orchestration Handoff

Use this skill when an external agent is ready to hand planning or intake work to Brain Loop.

This is also the canonical orchestration-parent shape for Brain skill-created handoffs. `brain-batch-handoff` should create one parent orchestration thread for the converted intake session, and standalone `brain-handoff` should create one parent orchestration thread for the single handoff unless it is attaching to an existing batch orchestration.

## Required Behavior

1. Create or update one orchestration chat JSON file under `~/.brain-loop/orchestrations/`.
2. Create one queue item per handoff task under `~/.brain-loop/queues/handoffs/`.
3. Set `orchestrationId` and `orchestrationTitle` on every generated queue item.
4. Update the orchestration JSON with `linkedQueueItemIds`, `linkedThreadIds`, `linkedHandoffPaths`, and `status: "handed-off"`.
5. If the project is missing from `~/.brain-loop/projects.json`, append it with `enabled: false`.
6. Never enable a newly imported project automatically. The user must enable it from Brain Loop before automation can run.
7. Do not copy a full Codex, Claude, or other agent transcript into the orchestration. Store a compact intake/handoff summary and a task table with durable links.

## Write Order

1. Resolve the absolute project path. If it is unknown, stop and ask.
2. Read `~/.brain-loop/projects.json`; if missing, treat it as an empty array.
3. Register the project if missing, always with `enabled: false`.
4. Write plan and handoff markdown artifacts under `~/.brain-loop/orchestrations/<orchestration-id>/handoffs/`.
5. Write queue item JSON files under `~/.brain-loop/queues/handoffs/`.
6. Write the orchestration JSON with links to the queue items and handoff files.

Use atomic writes where possible: write a temp file in the same directory, then rename it into place.

## Orchestration JSON Shape

```json
{
  "id": "2026-06-16-project-feature",
  "title": "Project feature",
  "projectId": "project",
  "projectName": "Project",
  "projectPath": "/absolute/path/to/project",
  "originAgent": "codex",
  "status": "handed-off",
  "model": "gpt-5-codex",
  "messages": [
    {
      "id": "message-1",
      "role": "user",
      "body": "Original intake or refined plan.",
      "createdAt": "2026-06-16T00:00:00.000Z",
      "agent": "codex",
      "model": "gpt-5-codex"
    }
  ],
  "linkedQueueItemIds": ["2026-06-16-project-feature"],
  "linkedThreadIds": ["thread-2026-06-16-project-feature"],
  "linkedHandoffPaths": ["/Users/example/.brain-loop/orchestrations/2026-06-16-project-feature/handoffs/2026-06-16-project-feature-handoff.md"],
  "createdAt": "2026-06-16T00:00:00.000Z",
  "updatedAt": "2026-06-16T00:00:00.000Z"
}
```

For intake or batch handoff sessions, include at least one message whose body contains a compact markdown table:

```md
| Task | Plan | Handoff | Queue Item | Agent | Model | Status |
|------|------|---------|------------|-------|-------|--------|
| Project feature task | brain/plans/...md | brain/handoffs/ready/...md | ~/.brain-loop/queues/handoffs/...json | open-code | deepseek v4 pro | queued |
```

The table should summarize the current handoff session result, not the full chat history.

## Queue Link Fields

Every queue item created from this skill must include:

```json
{
  "orchestrationId": "2026-06-16-project-feature",
  "orchestrationTitle": "Project feature"
}
```

Keep the rest of the queue item compatible with the Brain handoff contract: `status: "queued"`, valid `agent`, valid `recommendedAgent`, `planPath`, `handoffPath`, `activeHandoffPath`, timestamps, and history.

## Queue JSON Shape

Use this complete shape for each generated queue file:

```json
{
  "id": "2026-06-16-project-feature",
  "orchestrationId": "2026-06-16-project-feature-parent",
  "orchestrationTitle": "Project feature parent",
  "threadTitle": "Project feature task",
  "taskName": "Project feature task",
  "projectId": "project",
  "projectPath": "/absolute/path/to/project",
  "worktreePath": null,
  "executionPath": null,
  "planPath": "/Users/example/.brain-loop/orchestrations/2026-06-16-project-feature-parent/handoffs/2026-06-16-project-feature-plan.md",
  "handoffPath": "/Users/example/.brain-loop/orchestrations/2026-06-16-project-feature-parent/handoffs/2026-06-16-project-feature-handoff.md",
  "activeHandoffPath": "/Users/example/.brain-loop/orchestrations/2026-06-16-project-feature-parent/handoffs/2026-06-16-project-feature-handoff.md",
  "reviewPath": null,
  "status": "queued",
  "agent": "open-code",
  "recommendedAgent": "open-code",
  "recommendationReason": "Created by external Brain Loop orchestration handoff.",
  "recommendedModel": "deepseek v4 pro",
  "modelRecommendationReason": "Default external handoff recommendation.",
  "priority": "medium",
  "attempt": 1,
  "createdBy": "codex",
  "pickedBy": null,
  "createdAt": "2026-06-16T00:00:00.000Z",
  "pickedAt": null,
  "agentStartedAt": null,
  "startedBy": null,
  "runnerId": null,
  "reviewRunnerId": null,
  "sessionId": null,
  "submittedAt": null,
  "blockedAt": null,
  "reviewedAt": null,
  "approvedAt": null,
  "lastError": null,
  "waitingReason": null,
  "history": [
    {
      "at": "2026-06-16T00:00:00.000Z",
      "by": "codex",
      "status": "queued",
      "event": "orchestration_handoff_created",
      "detail": "Linked to orchestration 2026-06-16-project-feature-parent",
      "activeHandoffPath": "/Users/example/.brain-loop/orchestrations/2026-06-16-project-feature-parent/handoffs/2026-06-16-project-feature-handoff.md",
      "handoffPath": "/Users/example/.brain-loop/orchestrations/2026-06-16-project-feature-parent/handoffs/2026-06-16-project-feature-handoff.md",
      "agent": "open-code"
    }
  ]
}
```

`linkedThreadIds` in the orchestration record should use `thread-<queue-id>` with non-alphanumeric characters in the queue id replaced by `_`.

## Missing Project Registration

When the project is not already present in `~/.brain-loop/projects.json`, append a project record like:

```json
{
  "id": "project",
  "name": "Project",
  "path": "/absolute/path/to/project",
  "enabled": false,
  "defaultAgent": "open-code",
  "reviewIntervalMinutes": 2,
  "implementationIntervalMinutes": 2,
  "priority": "medium",
  "autoMergeOnReviewPass": false
}
```

If you cannot safely determine the project path, stop and ask for it. Do not create queue items with a guessed project path.

Do not start automation after registering a missing project. The disabled project state is the safety boundary.

## Completion Output

Report:

- Orchestration id and file path.
- Queue item ids and file paths.
- Whether the project was newly registered.
- Whether the project is enabled or disabled.
