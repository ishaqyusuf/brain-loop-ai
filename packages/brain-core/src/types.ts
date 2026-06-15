export type Priority = "high" | "medium" | "low";

export type ProjectAgent = "open-code" | "antigravity" | "codex";

export type QueueStatus =
  | "queued"
  | "picked"
  | "started"
  | "stale-started"
  | "submitted"
  | "reviewing"
  | "blocked"
  | "reviewed-fix-request"
  | "landing"
  | "approved";

export type DispatcherStatus =
  | "running"
  | "paused"
  | "stopped"
  | "missing"
  | "unknown"
  | "error";

export type CodexAutomationMode = "implementation-and-review" | "implementation-only" | "review-only";

export interface ImplementationDispatcher {
  jobName: string;
  desiredStatus: DispatcherStatus;
  lastKnownStatus: DispatcherStatus;
  lastCheckedAt: string;
  lastUpdatedBy: string;
  lastGatewayStatus: string;
  codexAutomationMode: CodexAutomationMode;
  lastError: string | null;
}

export interface Settings {
  defaultReviewIntervalMinutes: number;
  defaultImplementationIntervalMinutes: number;
  maxRunningProcesses: number;
  maxPickedMinutes: number;
  implementationDispatcher: ImplementationDispatcher;
}

export interface BrainProject {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  defaultAgent: ProjectAgent;
  reviewIntervalMinutes: number;
  implementationIntervalMinutes: number;
  priority: Priority;
  pathExists?: boolean;
}

export interface QueueHistoryEntry {
  at: string;
  by: string;
  status?: string;
  note?: string;
  event?: string;
  detail?: string;
  reviewPath?: string;
  activeHandoffPath?: string;
  handoffPath?: string;
  agent?: string;
}

export interface QueueItem {
  id: string;
  projectId: string;
  projectPath: string;
  worktreePath: string | null;
  executionPath: string | null;
  planPath: string;
  handoffPath: string;
  activeHandoffPath: string;
  reviewPath: string | null;
  status: QueueStatus;
  agent: ProjectAgent;
  recommendedAgent: ProjectAgent;
  recommendationReason: string;
  priority: Priority;
  attempt: number;
  createdBy: string;
  pickedBy: string | null;
  createdAt: string;
  pickedAt: string | null;
  agentStartedAt: string | null;
  startedBy: string | null;
  runnerId?: string | null;
  sessionId?: string | null;
  submittedAt: string | null;
  blockedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  lastError: string | null;
  history: QueueHistoryEntry[];
}

export interface QueueReadError {
  fileName: string;
  path: string;
  message: string;
}

export interface QueueListResponse {
  items: QueueItem[];
  errors: QueueReadError[];
}

export interface BrainStatus {
  implementationStatus: DispatcherStatus;
  reviewStatus: DispatcherStatus;
  activeRuns: number;
  queuedItems: number;
  submittedItems: number;
  blockedItems: number;
}

export interface LockFile {
  id: string;
  type: "implementation" | "review" | "mutation";
  holder: string;
  heldSince: string;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
}

export interface LockResult {
  success: boolean;
  message: string;
}

export interface SchedulerStatus {
  state: string;
  lastTick: string;
  tickCount: number;
  skippedTicks: number;
  lastError: string | null;
}

export interface LaunchAgentInfo {
  status: string;
  statusLabel: string;
  plistPath: string;
  v2Deferred: boolean;
  message: string;
}

export type ApprovalKind = "command" | "permission" | "destructive";

export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";

export interface ApprovalHistoryEntry {
  at: string;
  by: string;
  event: string;
  note?: string;
}

export interface ApprovalRequest {
  id: string;
  kind: ApprovalKind;
  status: ApprovalStatus;
  title: string;
  description: string;
  risk: string;
  command?: string | null;
  path?: string | null;
  queueItemId?: string | null;
  projectId?: string | null;
  runnerId?: string | null;
  sessionId?: string | null;
  requestedBy: string;
  requestedAt: string;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  history: ApprovalHistoryEntry[];
}

export interface ApprovalRequestInput {
  kind: ApprovalKind;
  title: string;
  description: string;
  risk: string;
  command?: string | null;
  path?: string | null;
  queueItemId?: string | null;
  projectId?: string | null;
  runnerId?: string | null;
  sessionId?: string | null;
  requestedBy?: string | null;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogCategory = "implementation" | "review" | "dispatch" | "lock" | "scheduler" | "system";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  runnerId: string | null;
  projectId: string | null;
  queueItemId: string | null;
  metadata: Record<string, unknown>;
}

export interface RunnerMetadata {
  agent: ProjectAgent;
  command: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  timeoutMs: number | null;
}

export interface RunResult {
  runnerId: string;
  queueItemId: string;
  agent: ProjectAgent;
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
}

export interface LogSummary {
  fileName: string;
  lastModified: string;
  sizeBytes: number;
  queueItemId?: string | null;
  projectId?: string | null;
  agent?: string | null;
  status?: string | null;
}
