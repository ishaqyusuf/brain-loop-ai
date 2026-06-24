import type { QueueItem, QueueHistoryEntry } from "./types";

function assertTakesQueueItem(_item: QueueItem): void {}
function assertTakesHistoryEntry(_entry: QueueHistoryEntry): void {}

const gndApprovedItem: QueueItem = {
  id: "2026-06-12-gnd-pending-01-inventory-to-dyke-fix-1",
  projectId: "gnd",
  projectPath: "/Users/M1PRO/Documents/code/_turbo/gnd",
  planPath: "brain/features/inventory-backed-sales-fulfillment.md",
  handoffPath: "brain/handoffs/fixes/2026-06-12-inventory-to-dyke-sync-pending-01-fix-1.md",
  activeHandoffPath: "brain/handoffs/completed/2026-06-12-inventory-to-dyke-sync-pending-01-fix-2.md",
  reviewPath: "brain/reviews/2026-06-12-inventory-to-dyke-sync-pending-01-review-v4.md",
  status: "approved",
  agent: "open-code",
  recommendedAgent: "open-code",
  recommendationReason: "Focused implementation of Pending 01 fix handoff; lower-model-safe with explicit guard rails.",
  priority: "high",
  attempt: 2,
  createdBy: "codex",
  pickedBy: "opencode-manual-fix",
  startedBy: "opencode-manual-fix",
  createdAt: "2026-06-12T09:31:48.902Z",
  pickedAt: "2026-06-12T15:55:16Z",
  agentStartedAt: "2026-06-12T15:55:16Z",
  submittedAt: "2026-06-12T15:58:31Z",
  reviewedAt: "2026-06-12T16:09:10.797Z",
  approvedAt: "2026-06-12T16:09:10.797Z",
  blockedAt: null,
  worktreePath: null,
  executionPath: null,
  lastError: null,
  history: [
    {
      at: "2026-06-12T09:31:48.902Z",
      by: "codex",
      event: "manually_queued_fix_handoff",
      handoffPath: "brain/handoffs/fixes/2026-06-12-inventory-to-dyke-sync-pending-01-fix-1.md",
      reviewPath: "brain/reviews/2026-06-12-inventory-to-dyke-sync-pending-01-review-v2.md",
    },
    {
      at: "2026-06-12T10:35:00.000Z",
      by: "brain-loop",
      event: "picked_for_implementation",
      agent: "open-code",
    },
    {
      status: "picked",
      at: "2026-06-12T15:55:16Z",
      by: "opencode-manual-fix",
      note: "Manual OpenCode fix worker picked fix-2.",
    },
    {
      at: "2026-06-12T16:09:10.797Z",
      by: "codex",
      event: "approved",
      reviewPath: "brain/reviews/2026-06-12-inventory-to-dyke-sync-pending-01-review-v4.md",
      activeHandoffPath: "brain/handoffs/completed/2026-06-12-inventory-to-dyke-sync-pending-01-fix-2.md",
      detail: "Fix 2 passed review.",
    },
  ],
};
assertTakesQueueItem(gndApprovedItem);

const statusNoteEntry: QueueHistoryEntry = {
  status: "picked",
  at: "2026-06-12T15:55:16Z",
  by: "opencode-manual-fix",
  note: "Manual OpenCode fix worker picked fix-2.",
};
assertTakesHistoryEntry(statusNoteEntry);

const eventDetailEntry: QueueHistoryEntry = {
  at: "2026-06-12T10:36:00.000Z",
  by: "brain-loop",
  event: "blocked_macos_tcc",
  detail: "Cannot access brain/ directory.",
};
assertTakesHistoryEntry(eventDetailEntry);

const eventWithExtras: QueueHistoryEntry = {
  at: "2026-06-12T16:09:10.797Z",
  by: "codex",
  event: "approved",
  reviewPath: "brain/reviews/example-review.md",
  activeHandoffPath: "brain/handoffs/completed/example-handoff.md",
  detail: "Fix passed review.",
  agent: "open-code",
};
assertTakesHistoryEntry(eventWithExtras);

const minimalEntry: QueueHistoryEntry = {
  at: "2026-06-12T00:00:00Z",
  by: "system",
};
assertTakesHistoryEntry(minimalEntry);
