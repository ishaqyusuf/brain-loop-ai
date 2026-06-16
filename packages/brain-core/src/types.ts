export type Priority = "high" | "medium" | "low";

export type ProjectAgent =
  | "open-code"
  | "antigravity"
  | "codex"
  | "direct-deepseek"
  | "direct-gemini";

export type RunnerKind = "cli" | "direct-provider";

export type ProviderApiStyle =
  | "openai-chat"
  | "openai-responses"
  | "anthropic"
  | "gemini-generate-content";

export type DirectModelToolName =
  | "read_file"
  | "search_text"
  | "apply_patch"
  | "run_command"
  | "finish_task";

export type DirectModelApprovalPolicy = "never" | "on-risky-action" | "always";

export type DirectModelMessageRole = "system" | "user" | "assistant" | "tool";

export interface DirectModelToolSpec {
  name: DirectModelToolName;
  title: string;
  description: string;
  approvalPolicy: DirectModelApprovalPolicy;
  inputSchema: Record<string, unknown>;
}

export interface DirectModelProviderContract {
  runnerId: ProjectAgent;
  providerId: string;
  apiStyle: ProviderApiStyle;
  apiKeyEnv: string;
  defaultModel: string;
}

export interface DirectModelProviderRequestShape {
  runnerId: ProjectAgent;
  providerId: string;
  apiStyle: ProviderApiStyle;
  method: "POST";
  endpointTemplate: string;
  apiKeyEnv: string;
  apiKeyHeader: string;
  streaming: boolean;
  toolDeclarationPath: string;
  toolResultPath: string;
}

export interface DirectModelProviderRequest {
  runnerId: ProjectAgent;
  providerId: string;
  apiStyle: ProviderApiStyle;
  method: "POST";
  endpoint: string;
  apiKeyEnv: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

export interface DirectModelProviderStreamParseInput {
  runnerId: ProjectAgent;
  providerId: string;
  apiStyle: ProviderApiStyle;
  model: string;
  rawChunk: string;
  queueItemId?: string | null;
  threadId?: string | null;
  turnId?: string | null;
}

export interface DirectModelProviderStreamParseResult {
  events: DirectModelTurnEvent[];
  done: boolean;
  usage?: Record<string, string>;
}

export interface DirectModelHarnessEventPreview {
  events: HarnessEventInput[];
  skippedEvents: number;
  completedMessages: number;
}

export interface DirectModelHarnessRecordResult {
  thread?: AgentThread | null;
  recordedEvents: number;
  skippedEvents: number;
  completedMessages: number;
}

export interface DirectModelRuntimeContract {
  providers: DirectModelProviderContract[];
  requestShapes: DirectModelProviderRequestShape[];
  tools: DirectModelToolSpec[];
  eventKinds: HarnessEventKind[];
  approvalRequiredToolNames: DirectModelToolName[];
  pendingRuntime: boolean;
}

export interface DirectModelMessage {
  role: DirectModelMessageRole;
  content: string;
  providerMessageId?: string | null;
  createdAt?: string | null;
  metadata?: Record<string, string>;
}

export interface DirectModelToolCall {
  id: string;
  name: DirectModelToolName | string;
  arguments: Record<string, unknown>;
}

export interface DirectModelToolResult {
  toolCallId: string;
  name: DirectModelToolName | string;
  ok: boolean;
  content: string;
  metadata?: Record<string, string>;
}

export interface DirectModelToolExecutionInput {
  executionPath: string;
  toolCall: DirectModelToolCall;
  approvalPolicy?: DirectModelApprovalPolicy;
  queueItemId?: string | null;
  projectId?: string | null;
  runnerId?: string | null;
  sessionId?: string | null;
}

export interface DirectModelToolExecutionResult {
  toolResult: DirectModelToolResult;
  approvalRequired: boolean;
  approvalKind?: ApprovalKind | null;
  approvalReason?: string | null;
}

export interface DirectModelToolApprovalResult {
  approvalRequest: ApprovalRequest;
  toolExecutionResult: DirectModelToolExecutionResult;
  harnessEvent?: HarnessEventInput | null;
  thread?: AgentThread | null;
}

export interface DirectModelTurnInput {
  runnerId: ProjectAgent;
  providerId: string;
  apiStyle: ProviderApiStyle;
  model: string;
  queueItemId: string;
  threadId: string;
  executionPath: string;
  systemPrompt: string;
  messages: DirectModelMessage[];
  tools: DirectModelToolSpec[];
  toolResults?: DirectModelToolResult[];
  approvalPolicy: DirectModelApprovalPolicy;
}

export interface DirectModelTurnEvent {
  kind: HarnessEventKind;
  sourceEventId: string;
  provider: ProjectAgent | string;
  model?: string | null;
  queueItemId?: string | null;
  threadId?: string | null;
  turnId?: string | null;
  role?: AgentThreadMessageRole | string | null;
  body?: string | null;
  toolCall?: DirectModelToolCall | null;
  approvalRequestId?: string | null;
  metadata?: Record<string, string>;
}

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

export type CodexAutomationMode =
  | "implementation-and-review"
  | "implementation-only"
  | "review-only";

export type SchedulingPolicy = "fix-before-new-task" | "fifo";

export type ExecutionStrategy = "worktree" | "main-checkout" | "auto";

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

export interface RunnerCatalogEntry {
  id: ProjectAgent;
  label: string;
  enabled: boolean;
  models: string[];
  defaultModel: string;
  kind?: RunnerKind;
  providerId?: string;
  apiStyle?: ProviderApiStyle;
  apiKeyEnv?: string;
}

export interface MaxLoopConcurrencyPolicy {
  globalMax: number;
  runnerCaps: Partial<Record<ProjectAgent, number>>;
  projectCaps: Record<string, number>;
  runnerProjectCaps: Record<string, Partial<Record<ProjectAgent, number>>>;
}

export interface Settings {
  defaultReviewIntervalMinutes: number;
  defaultImplementationIntervalMinutes: number;
  capacityPollIntervalSeconds: number;
  maxRunningProcesses: number;
  maxImplementationAgents?: number;
  maxReviewAgents?: number;
  maxPickedMinutes: number;
  maxLoopPolicy: MaxLoopConcurrencyPolicy;
  schedulingPolicy: SchedulingPolicy;
  threadStorageRoot: string;
  worktreeStorageRoot: string;
  executionStrategy: ExecutionStrategy;
  runnerCatalog: RunnerCatalogEntry[];
  defaultImplementationRunner: ProjectAgent;
  defaultImplementationModel: string;
  defaultReviewRunner: ProjectAgent;
  defaultReviewModel: string;
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
  autoMergeOnReviewPass?: boolean;
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
  threadTitle?: string;
  threadName?: string;
  taskName?: string;
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
  recommendedModel?: string | null;
  modelRecommendationReason?: string | null;
  priority: Priority;
  attempt: number;
  createdBy: string;
  pickedBy: string | null;
  createdAt: string;
  pickedAt: string | null;
  agentStartedAt: string | null;
  startedBy: string | null;
  runnerId?: string | null;
  reviewRunnerId?: string | null;
  sessionId?: string | null;
  submittedAt: string | null;
  blockedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  landingStatus?: string | null;
  landingBranch?: string | null;
  landedAt?: string | null;
  landedBy?: string | null;
  landedCommit?: string | null;
  landingError?: string | null;
  preLandingStatus?: string | null;
  preLandingCommit?: string | null;
  preLandingCommittedAt?: string | null;
  preLandingCommitMessage?: string | null;
  lastError: string | null;
  waitingReason?: string | null;
  executionStrategy?: ExecutionStrategy | null;
  dependsOn?: string[];
  blockedBy?: string[];
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

export type AgentThreadStatus =
  | "waiting"
  | "implementing"
  | "waiting-review"
  | "reviewing"
  | "landing"
  | "done"
  | "blocked"
  | "unknown";

export type AgentThreadMessageRole =
  | "system"
  | "user"
  | "agent"
  | "approval"
  | "artifact";

export type AgentThreadMessageSource =
  | "structured-provider-events"
  | "brain-timeline"
  | "transcript-only";

export type HarnessEventKind =
  | "session.started"
  | "turn.started"
  | "message.delta"
  | "message.completed"
  | "tool.started"
  | "tool.completed"
  | "approval.required"
  | "file.changed"
  | "run.log"
  | "turn.completed"
  | "session.failed"
  | "session.completed";

export type HarnessCapabilityMode =
  | "structured-provider-events"
  | "transcript-only"
  | "unsupported";

export interface HarnessProviderCapability {
  provider: ProjectAgent | string;
  label: string;
  mode: HarnessCapabilityMode;
  exactMessages: boolean;
  details: string;
  eventKinds: HarnessEventKind[];
}

export interface HarnessEventInput {
  kind: HarnessEventKind;
  sourceEventId: string;
  provider: ProjectAgent | string;
  model?: string | null;
  queueItemId?: string | null;
  threadId?: string | null;
  runId?: string | null;
  providerSessionId?: string | null;
  providerThreadId?: string | null;
  turnId?: string | null;
  role?: AgentThreadMessageRole | string | null;
  title?: string | null;
  body?: string | null;
  createdAt?: string | null;
  metadata?: Record<string, string>;
}

export interface HarnessSessionStartInput {
  queueItemId: string;
  provider: ProjectAgent | string;
  model: string;
  prompt: string;
  executionPath?: string | null;
}

export interface HarnessSession {
  sessionId: string;
  queueItemId: string;
  threadId: string;
  providerThreadId?: string | null;
  provider: ProjectAgent | string;
  model: string;
  messageSource: AgentThreadMessageSource;
  startedAt: string;
}

export interface AgentThreadMessage {
  id: string;
  role: AgentThreadMessageRole | string;
  kind: string;
  title: string;
  body: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

export interface AgentThread {
  id: string;
  queueItemId: string;
  projectId: string;
  projectName?: string | null;
  projectPath: string;
  worktreePath?: string | null;
  executionPath?: string | null;
  executionStrategy?: ExecutionStrategy | null;
  planPath?: string | null;
  handoffPath?: string | null;
  activeHandoffPath?: string | null;
  reviewPath?: string | null;
  title: string;
  status: AgentThreadStatus;
  implementationStatus: QueueStatus | string;
  reviewStatus?: string | null;
  runnerId?: string | null;
  reviewRunnerId?: string | null;
  messageSource?: AgentThreadMessageSource | string | null;
  providerSessionId?: string | null;
  providerThreadId?: string | null;
  logFilePath?: string | null;
  reviewLogFilePath?: string | null;
  createdAt: string;
  updatedAt: string;
  lastError?: string | null;
  waitingReason?: string | null;
  approvalRequestIds?: string[];
  pendingApprovalCount?: number;
  messages?: AgentThreadMessage[];
  archivedAt?: string | null;
  archivedBy?: string | null;
  archiveReason?: string | null;
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
  activeImplementationAgents: number;
  maxImplementationAgents: number;
  waitingImplementationItems: number;
  activeReviewAgents: number;
  maxReviewAgents: number;
  waitingReviewItems: number;
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

export type LogCategory =
  | "implementation"
  | "review"
  | "dispatch"
  | "lock"
  | "scheduler"
  | "system";

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
