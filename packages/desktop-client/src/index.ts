import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { ApprovalRequest, ApprovalRequestInput, BrainStatus, BrainProject, QueueListResponse, QueueItem, LogSummary, LockResult, SchedulerStatus, LaunchAgentInfo } from "@brain-loop/brain-core";

export interface LogEvent {
  line: string;
  stream: string;
  runId: string;
}

export interface ProcessCompleteEvent {
  runId: string;
  exitCode: number | null;
  signal: string | null;
}

export interface PtyDataEvent {
  pid: number;
  chunk: string;
}

export interface PtySessionMetadata {
  pid: number;
  sessionId: string;
  runId: string;
  queueItemId: string | null;
  executionPath: string | null;
  logFilePath: string | null;
}

type NativeBrainStatus = {
  implementationStatus?: BrainStatus["implementationStatus"];
  reviewStatus?: BrainStatus["reviewStatus"];
  activeRuns?: number;
  queuedItems?: number;
  submittedItems?: number;
  blockedItems?: number;
  implementation_status?: BrainStatus["implementationStatus"];
  review_status?: BrainStatus["reviewStatus"];
  active_runs?: number;
  queued_items?: number;
  submitted_items?: number;
  blocked_items?: number;
};

const fallbackBrainStatus: BrainStatus = {
  implementationStatus: "unknown",
  reviewStatus: "unknown",
  activeRuns: 0,
  queuedItems: 0,
  submittedItems: 0,
  blockedItems: 0,
};

export async function getBrainStatus(): Promise<BrainStatus> {
  const status = (await invoke<NativeBrainStatus | null>("get_brain_status")) ?? {};

  return {
    implementationStatus:
      status.implementationStatus ??
      status.implementation_status ??
      fallbackBrainStatus.implementationStatus,
    reviewStatus:
      status.reviewStatus ??
      status.review_status ??
      fallbackBrainStatus.reviewStatus,
    activeRuns:
      status.activeRuns ??
      status.active_runs ??
      fallbackBrainStatus.activeRuns,
    queuedItems:
      status.queuedItems ??
      status.queued_items ??
      fallbackBrainStatus.queuedItems,
    submittedItems:
      status.submittedItems ??
      status.submitted_items ??
      fallbackBrainStatus.submittedItems,
    blockedItems:
      status.blockedItems ??
      status.blocked_items ??
      fallbackBrainStatus.blockedItems,
  };
}

export async function listProjects(): Promise<BrainProject[]> {
  return await invoke<BrainProject[]>("list_projects");
}

export async function createProject(project: BrainProject): Promise<BrainProject> {
  return await invoke<BrainProject>("create_project", { project });
}

export async function updateProject(project: BrainProject): Promise<BrainProject> {
  return await invoke<BrainProject>("update_project", { project });
}

export async function setProjectEnabled(
  projectId: string,
  enabled: boolean,
): Promise<BrainProject> {
  return await invoke<BrainProject>("set_project_enabled", { projectId, enabled });
}

export async function listApprovalRequests(): Promise<ApprovalRequest[]> {
  return await invoke<ApprovalRequest[]>("list_approval_requests");
}

export async function requestApproval(input: ApprovalRequestInput): Promise<ApprovalRequest> {
  return await invoke<ApprovalRequest>("request_approval", { input });
}

export async function approveRequest(
  requestId: string,
  by: string,
): Promise<ApprovalRequest> {
  return await invoke<ApprovalRequest>("approve_request", { requestId, by });
}

export async function denyRequest(
  requestId: string,
  by: string,
  reason?: string,
): Promise<ApprovalRequest> {
  return await invoke<ApprovalRequest>("deny_request", { requestId, by, reason: reason ?? null });
}

export async function expireRequest(
  requestId: string,
  by: string,
  reason?: string,
): Promise<ApprovalRequest> {
  return await invoke<ApprovalRequest>("expire_request", { requestId, by, reason: reason ?? null });
}

export async function onApprovalEvent(
  callback: (event: ApprovalRequest) => void,
): Promise<UnlistenFn[]> {
  const events = [
    "approval-requested",
    "approval-approved",
    "approval-denied",
    "approval-expired",
    "approval-resolved",
  ];

  return await Promise.all(
    events.map((eventName) =>
      listen<ApprovalRequest>(eventName, (event) => callback(event.payload)),
    ),
  );
}

export async function listQueue(): Promise<QueueListResponse> {
  return await invoke<QueueListResponse>("list_queue");
}

export async function listRecentLogs(): Promise<LogSummary[]> {
  return await invoke<LogSummary[]>("list_recent_logs");
}

export async function updateQueueItemStatus(
  itemId: string,
  newStatus: string,
  by: string,
  note?: string,
  event?: string,
  detail?: string,
): Promise<QueueItem> {
  return await invoke<QueueItem>("update_queue_item_status", {
    itemId,
    newStatus,
    by,
    note: note ?? null,
    event: event ?? null,
    detail: detail ?? null,
  });
}

export async function acquireBrainLock(
  lockId: string,
  lockType: string,
  holder: string,
): Promise<LockResult> {
  return await invoke<LockResult>("acquire_brain_lock", {
    lockId,
    lockType,
    holder,
  });
}

export async function releaseBrainLock(lockId: string): Promise<LockResult> {
  return await invoke<LockResult>("release_brain_lock", { lockId });
}

export async function checkBrainLock(lockId: string): Promise<boolean> {
  return await invoke<boolean>("check_brain_lock", { lockId });
}

export async function startAutomation(): Promise<string> {
  return await invoke<string>("start_automation");
}

export async function pauseAutomation(): Promise<string> {
  return await invoke<string>("pause_automation");
}

export async function stopAutomation(): Promise<string> {
  return await invoke<string>("stop_automation");
}

export async function getSchedulerStatus(): Promise<SchedulerStatus> {
  return await invoke<SchedulerStatus>("get_scheduler_status");
}

export async function runImplementationOnce(): Promise<string> {
  return await invoke<string>("run_implementation_once");
}

export async function runReviewOnce(): Promise<string> {
  return await invoke<string>("run_review_once");
}

export async function getLaunchAgentInfo(): Promise<LaunchAgentInfo> {
  return await invoke<LaunchAgentInfo>("get_launchagent_info");
}

export async function installLaunchAgent(): Promise<string> {
  return await invoke<string>("install_launchagent");
}

export async function loadLaunchAgent(): Promise<string> {
  return await invoke<string>("load_launchagent");
}

export async function unloadLaunchAgent(): Promise<string> {
  return await invoke<string>("unload_launchagent");
}

export async function removeLaunchAgent(): Promise<string> {
  return await invoke<string>("remove_launchagent");
}

export async function runProcess(
  command: string,
  args: string[],
  cwd: string | null,
  queueItemId: string | null,
  projectId: string | null,
  agent: string | null,
  runId: string
): Promise<string> {
  return await invoke<string>("run_process", { command, args, cwd, queueItemId, projectId, agent, runId });
}

export async function readLogFile(fileName: string): Promise<string> {
  return await invoke<string>("read_log_file", { fileName });
}

export async function onProcessLog(handler: (event: LogEvent) => void): Promise<() => void> {
  const unlisten = await listen<LogEvent>("process-log", (event) => handler(event.payload));
  return unlisten;
}

export async function onProcessComplete(handler: (event: ProcessCompleteEvent) => void): Promise<() => void> {
  const unlisten = await listen<ProcessCompleteEvent>("process-complete", (event) => handler(event.payload));
  return unlisten;
}

export async function spawnPty(
  runId: string,
  queueItemId: string | null,
  executionPath: string | null,
  command: string,
  args: string[],
  rows: number,
  cols: number
): Promise<PtySessionMetadata> {
  return await invoke<PtySessionMetadata>("spawn_pty", { runId, queueItemId, executionPath, command, args, rows, cols });
}

export async function writePty(pid: number, data: string): Promise<void> {
  await invoke<void>("write_pty", { pid, data });
}

export async function resizePty(pid: number, rows: number, cols: number): Promise<void> {
  await invoke<void>("resize_pty", { pid, rows, cols });
}

export async function closePty(pid: number): Promise<void> {
  await invoke<void>("close_pty", { pid });
}

export async function onPtyData(callback: (event: PtyDataEvent) => void): Promise<UnlistenFn> {
  return await listen<PtyDataEvent>("pty-data", (event) => {
    callback(event.payload);
  });
}
