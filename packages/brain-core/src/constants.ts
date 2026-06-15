import type {
  Priority,
  ProjectAgent,
  QueueStatus,
  DispatcherStatus,
  CodexAutomationMode,
  LogLevel,
  LogCategory,
  Settings,
} from "./types";

export const brainProjectManagerRoot = "~/.codex/brain-project-manager";

export const VALID_PRIORITIES: readonly Priority[] = ["high", "medium", "low"] as const;

export const VALID_PROJECT_AGENTS: readonly ProjectAgent[] = [
  "open-code",
  "antigravity",
  "codex",
] as const;

export const VALID_QUEUE_STATUSES: readonly QueueStatus[] = [
  "queued",
  "picked",
  "started",
  "stale-started",
  "submitted",
  "reviewing",
  "blocked",
  "reviewed-fix-request",
  "landing",
  "approved",
] as const;

export const VALID_DISPATCHER_STATUSES: readonly DispatcherStatus[] = [
  "running",
  "paused",
  "stopped",
  "missing",
  "unknown",
  "error",
] as const;

export const VALID_CODEX_AUTOMATION_MODES: readonly CodexAutomationMode[] = [
  "implementation-and-review",
  "implementation-only",
  "review-only",
] as const;

export const VALID_LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"] as const;

export const VALID_LOG_CATEGORIES: readonly LogCategory[] = [
  "implementation",
  "review",
  "dispatch",
  "lock",
  "scheduler",
  "system",
] as const;

export const QUEUE_STATUS_TRANSITIONS: Record<QueueStatus, readonly QueueStatus[]> = {
  queued: ["picked", "blocked"],
  picked: ["started", "blocked", "queued"],
  started: ["stale-started", "submitted", "blocked"],
  "stale-started": ["queued", "started", "submitted", "blocked"],
  submitted: ["reviewing", "reviewed-fix-request", "landing", "blocked"],
  reviewing: ["reviewed-fix-request", "landing", "blocked"],
  blocked: ["queued", "picked", "started"],
  "reviewed-fix-request": ["picked", "started", "blocked"],
  landing: ["approved", "blocked"],
  approved: [],
};

export const TILDE_PREFIX = "~";
export const DEFAULT_HOME_DIR = "/Users";

export const DEFAULT_SETTINGS: Settings = {
  defaultReviewIntervalMinutes: 2,
  defaultImplementationIntervalMinutes: 2,
  maxRunningProcesses: 1,
  maxPickedMinutes: 30,
  implementationDispatcher: {
    jobName: "brain-implementation-dispatcher",
    desiredStatus: "running",
    lastKnownStatus: "missing",
    lastCheckedAt: new Date(0).toISOString(),
    lastUpdatedBy: "system",
    lastGatewayStatus: "not-loaded",
    codexAutomationMode: "review-only",
    lastError: null,
  },
};
