import type {
  Priority,
  ProjectAgent,
  QueueStatus,
  DispatcherStatus,
  CodexAutomationMode,
  LogLevel,
  LogCategory,
} from "./types";
import {
  VALID_PRIORITIES,
  VALID_PROJECT_AGENTS,
  VALID_QUEUE_STATUSES,
  VALID_DISPATCHER_STATUSES,
  VALID_CODEX_AUTOMATION_MODES,
  VALID_LOG_LEVELS,
  VALID_LOG_CATEGORIES,
  QUEUE_STATUS_TRANSITIONS,
  TILDE_PREFIX,
  DEFAULT_HOME_DIR,
} from "./constants";

export function isValidPriority(value: unknown): value is Priority {
  return typeof value === "string" && (VALID_PRIORITIES as readonly string[]).includes(value);
}

export function assertPriority(value: unknown): Priority {
  if (!isValidPriority(value)) {
    throw new Error(
      `Invalid priority: "${String(value)}". Expected one of: ${VALID_PRIORITIES.join(", ")}`,
    );
  }
  return value;
}

export function isValidProjectAgent(value: unknown): value is ProjectAgent {
  return typeof value === "string" && (VALID_PROJECT_AGENTS as readonly string[]).includes(value);
}

export function assertProjectAgent(value: unknown): ProjectAgent {
  if (!isValidProjectAgent(value)) {
    throw new Error(
      `Invalid agent: "${String(value)}". Expected one of: ${VALID_PROJECT_AGENTS.join(", ")}`,
    );
  }
  return value;
}

export function isValidQueueStatus(value: unknown): value is QueueStatus {
  return typeof value === "string" && (VALID_QUEUE_STATUSES as readonly string[]).includes(value);
}

export function assertQueueStatus(value: unknown): QueueStatus {
  if (!isValidQueueStatus(value)) {
    throw new Error(
      `Invalid queue status: "${String(value)}". Expected one of: ${VALID_QUEUE_STATUSES.join(", ")}`,
    );
  }
  return value;
}

export function isValidDispatcherStatus(value: unknown): value is DispatcherStatus {
  return (
    typeof value === "string" &&
    (VALID_DISPATCHER_STATUSES as readonly string[]).includes(value)
  );
}

export function assertDispatcherStatus(value: unknown): DispatcherStatus {
  if (!isValidDispatcherStatus(value)) {
    throw new Error(
      `Invalid dispatcher status: "${String(value)}". Expected one of: ${VALID_DISPATCHER_STATUSES.join(", ")}`,
    );
  }
  return value;
}

export function isValidCodexAutomationMode(value: unknown): value is CodexAutomationMode {
  return (
    typeof value === "string" &&
    (VALID_CODEX_AUTOMATION_MODES as readonly string[]).includes(value)
  );
}

export function assertCodexAutomationMode(value: unknown): CodexAutomationMode {
  if (!isValidCodexAutomationMode(value)) {
    throw new Error(
      `Invalid automation mode: "${String(value)}". Expected one of: ${VALID_CODEX_AUTOMATION_MODES.join(", ")}`,
    );
  }
  return value;
}

export function isValidLogLevel(value: unknown): value is LogLevel {
  return typeof value === "string" && (VALID_LOG_LEVELS as readonly string[]).includes(value);
}

export function isValidLogCategory(value: unknown): value is LogCategory {
  return typeof value === "string" && (VALID_LOG_CATEGORIES as readonly string[]).includes(value);
}

export function isValidQueueTransition(
  current: QueueStatus,
  next: QueueStatus,
): boolean {
  const allowed = QUEUE_STATUS_TRANSITIONS[current];
  return allowed.includes(next);
}

export function assertQueueTransition(
  current: QueueStatus,
  next: QueueStatus,
): void {
  if (!isValidQueueTransition(current, next)) {
    const allowed = QUEUE_STATUS_TRANSITIONS[current].join(", ");
    throw new Error(
      `Invalid queue transition: "${current}" -> "${next}". Allowed transitions from "${current}": ${allowed || "none"}`,
    );
  }
}

export function normalizePath(raw: string, homeDir: string = DEFAULT_HOME_DIR): string {
  if (raw.startsWith(TILDE_PREFIX)) {
    return homeDir + raw.slice(TILDE_PREFIX.length);
  }
  return raw;
}

export function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true" || lower === "1" || lower === "yes") return true;
    if (lower === "false" || lower === "0" || lower === "no") return false;
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
}

export function parseIntSafe(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value);
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}
