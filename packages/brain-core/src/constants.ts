import type {
  Priority,
  ProjectAgent,
  QueueStatus,
  DispatcherStatus,
  CodexAutomationMode,
  ExecutionStrategy,
  LogLevel,
  LogCategory,
  Settings,
} from "./types";

export const brainProjectManagerRoot = "~/.brain-loop";

export const VALID_PRIORITIES: readonly Priority[] = ["high", "medium", "low"] as const;

export const VALID_PROJECT_AGENTS: readonly ProjectAgent[] = [
  "open-code",
  "antigravity",
  "codex",
  "direct-deepseek",
  "direct-gemini",
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

export const VALID_EXECUTION_STRATEGIES: readonly ExecutionStrategy[] = [
  "worktree",
  "main-checkout",
  "auto",
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
export const defaultThreadStorageRoot = "~/.brain-loop/threads";
export const defaultWorktreeStorageRoot = "~/.brain-loop/worktrees";

export const DEFAULT_SETTINGS: Settings = {
  defaultReviewIntervalMinutes: 2,
  defaultImplementationIntervalMinutes: 2,
  capacityPollIntervalSeconds: 5,
  maxRunningProcesses: 1,
  maxImplementationAgents: 1,
  maxReviewAgents: 1,
  maxPickedMinutes: 30,
  maxLoopPolicy: {
    globalMax: 1,
    runnerCaps: {},
    projectCaps: {},
    runnerProjectCaps: {},
  },
  schedulingPolicy: "fix-before-new-task",
  threadStorageRoot: defaultThreadStorageRoot,
  worktreeStorageRoot: defaultWorktreeStorageRoot,
  executionStrategy: "worktree",
  runnerCatalog: [
    {
      id: "open-code",
      label: "OpenCode",
      enabled: true,
      models: ["deepseek v4 pro"],
      defaultModel: "deepseek v4 pro",
      kind: "cli",
    },
    {
      id: "antigravity",
      label: "Antigravity",
      enabled: true,
      models: ["3.1 pro"],
      defaultModel: "3.1 pro",
      kind: "cli",
    },
    {
      id: "codex",
      label: "Codex",
      enabled: true,
      models: ["gpt-5-codex"],
      defaultModel: "gpt-5-codex",
      kind: "cli",
    },
    {
      id: "direct-deepseek",
      label: "DeepSeek Direct",
      enabled: false,
      models: ["deepseek-v4-pro", "deepseek-v4-flash"],
      defaultModel: "deepseek-v4-pro",
      kind: "direct-provider",
      providerId: "deepseek",
      apiStyle: "openai-chat",
      apiKeyEnv: "DEEPSEEK_API_KEY",
    },
    {
      id: "direct-gemini",
      label: "Gemini Direct",
      enabled: false,
      models: ["gemini-3.5-flash", "gemini-3.1-pro", "gemini-3-flash"],
      defaultModel: "gemini-3.5-flash",
      kind: "direct-provider",
      providerId: "gemini",
      apiStyle: "gemini-generate-content",
      apiKeyEnv: "GEMINI_API_KEY",
    },
  ],
  defaultImplementationRunner: "open-code",
  defaultImplementationModel: "deepseek v4 pro",
  defaultReviewRunner: "codex",
  defaultReviewModel: "gpt-5-codex",
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
