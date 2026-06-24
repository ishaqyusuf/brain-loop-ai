import { useEffect, useState, type FormEvent } from "react";
import {
  readLogFile,
  replayHarnessEvents,
  sendHarnessMessage,
  startHarnessSession,
  stopHarnessSession,
} from "@brain-loop/desktop-client";
import type {
  AgentThread,
  AgentThreadMessage as AgentThreadMessageRecord,
  ApprovalRequest,
  BrainStatus,
} from "@brain-loop/brain-core";
import { ApprovalPanel } from "@/components/approval-panel";
import type { AgentNavItem } from "@/components/sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { logFileNameFromPath } from "@/lib/log-display";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Code2,
  FileText,
  Flag,
  GitBranch,
  Info,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
} from "lucide-react";

type ThreadDisplayMessage = {
  id: string;
  role: AgentThreadMessageRecord["role"];
  label: string;
  body: string;
  createdAt?: string;
  exactProviderMessage?: boolean;
  provider?: string;
  model?: string;
};

function RunResultAlert({ label, result }: { label: string; result: { ok: boolean; text: string } }) {
  return (
    <Alert variant={result.ok ? "default" : "destructive"}>
      {result.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
      <AlertTitle>{label} run {result.ok ? "completed" : "failed"}</AlertTitle>
      <AlertDescription className="font-mono break-all">{result.text}</AlertDescription>
    </Alert>
  );
}

export function AgentThreadView({
  agent,
  thread,
  status,
  schedulerState,
  statusError,
  queueError,
  implResult,
  reviewResult,
  pendingApprovals,
  onOpenApprovals,
  onStartAutomation,
  onPauseAutomation,
  onRunImplementation,
  onRunReview,
  harnessModel,
}: {
  agent: AgentNavItem;
  thread: AgentThread | null;
  status: BrainStatus;
  schedulerState: string;
  statusError: boolean;
  queueError: string | null;
  implResult: { ok: boolean; text: string } | null;
  reviewResult: { ok: boolean; text: string } | null;
  pendingApprovals: ApprovalRequest[];
  onOpenApprovals: () => void;
  onStartAutomation: () => void;
  onPauseAutomation: () => void;
  onRunImplementation: () => void;
  onRunReview: () => void;
  harnessModel: string;
}) {
  const [selectedTranscript, setSelectedTranscript] = useState<{
    label: string;
    fileName: string;
    content: string;
    error: string | null;
  } | null>(null);
  const [harnessDraft, setHarnessDraft] = useState("");
  const [harnessBusy, setHarnessBusy] = useState(false);
  const [harnessError, setHarnessError] = useState<string | null>(null);
  const isApprovalThread = agent.kind === "approval";
  const missingTaskThread = agent.kind === "thread" && !thread;
  const projectName = agent.projectName ?? "All projects";
  const canUseCodexHarness = Boolean(thread && !isApprovalThread);
  const hasCodexProviderSession = Boolean(thread?.providerSessionId && thread?.providerThreadId);
  const artifacts = thread ? [
    { id: "plan", label: "Plan", path: thread.planPath },
    { id: "handoff", label: "Handoff", path: thread.activeHandoffPath ?? thread.handoffPath },
    { id: "review", label: "Review artifact", path: thread.reviewPath },
  ].filter((item) => item.path) : [];
  const transcripts = thread ? [
    {
      id: "implementation",
      label: "Implementation transcript",
      path: thread.logFilePath,
      runnerId: thread.runnerId,
    },
    {
      id: "review",
      label: "Review transcript",
      path: thread.reviewLogFilePath,
      runnerId: thread.reviewRunnerId,
    },
  ].filter((item) => item.path) : [];

  useEffect(() => {
    setSelectedTranscript(null);
    setHarnessDraft("");
    setHarnessError(null);
  }, [thread?.id, agent.id]);

  if (missingTaskThread) {
    return (
      <section className="flex min-h-screen min-w-0 flex-1 items-center justify-center px-6 pt-10">
        <div className="max-w-[360px] text-center">
          <h2 className="text-base font-medium text-zinc-100">Thread not found for task</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            This task is visible because it has already started or completed, but no durable thread record exists for it yet.
          </p>
        </div>
      </section>
    );
  }

  const liveMessages: ThreadDisplayMessage[] = [
    {
      id: "system",
      role: "system",
      label: "Brain Loop",
      body: `${agent.name} is scoped to ${projectName}. Agent capacity, worktree, and review handoff details will stream here as runs progress.`,
    },
    {
      id: "status",
      role: "system",
      label: "Status",
      body: `Implementation ${status.implementationStatus}; review ${status.reviewStatus}; ${status.activeRuns} active run${status.activeRuns === 1 ? "" : "s"}.`,
    },
    ...(thread ? [{
      id: "thread",
      role: "system",
      label: "Thread",
    body: `Queue ${thread.queueItemId}; status ${thread.status}; strategy ${thread.executionStrategy ?? "worktree"}; approvals ${thread.pendingApprovalCount ?? 0} pending / ${thread.approvalRequestIds?.length ?? 0} linked; execution ${thread.executionPath ?? thread.projectPath}.`,
    }] : []),
  ];
  const persistedMessages = thread?.messages?.length
    ? thread.messages.map((message) => ({
      id: message.id,
      role: message.role,
      label: message.title,
      body: message.body,
      createdAt: message.createdAt,
      exactProviderMessage: message.metadata?.isExactProviderMessage === "true",
      provider: message.metadata?.provider,
      model: message.metadata?.model,
    } satisfies ThreadDisplayMessage))
    : [];
  const messages = persistedMessages.length > 0 ? persistedMessages : liveMessages;
  const messageSource = thread?.messageSource ?? (transcripts.length > 0 ? "transcript-only" : "brain-timeline");

  function openTranscript(label: string, path: string) {
    const fileName = logFileNameFromPath(path);
    if (!fileName) {
      setSelectedTranscript({ label, fileName: "", content: "", error: "Transcript path is not a readable log file." });
      return;
    }

    setSelectedTranscript({ label, fileName, content: "Loading transcript...", error: null });
    void readLogFile(fileName)
      .then((content) => {
        setSelectedTranscript({
          label,
          fileName,
          content: content.trim() ? content : "Transcript is empty.",
          error: null,
        });
      })
      .catch((e) => {
        setSelectedTranscript({
          label,
          fileName,
          content: "",
          error: `Unable to read transcript: ${String(e)}`,
        });
      });
  }

  function handleHarnessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = harnessDraft.trim();
    if (!thread || !prompt) {
      return;
    }

    setHarnessBusy(true);
    setHarnessError(null);
    const action = hasCodexProviderSession
      ? sendHarnessMessage(thread.id, prompt)
      : startHarnessSession({
        queueItemId: thread.queueItemId,
        provider: "codex",
        model: harnessModel,
        prompt,
        executionPath: thread.executionPath ?? thread.projectPath,
      });

    void action
      .then(() => {
        setHarnessDraft("");
      })
      .catch((e) => {
        setHarnessError(String(e));
      })
      .finally(() => {
        setHarnessBusy(false);
      });
  }

  function handleHarnessStop() {
    if (!thread) {
      return;
    }
    setHarnessBusy(true);
    setHarnessError(null);
    void stopHarnessSession(thread.id)
      .catch((e) => setHarnessError(String(e)))
      .finally(() => setHarnessBusy(false));
  }

  function handleHarnessReplay() {
    if (!thread) {
      return;
    }
    setHarnessBusy(true);
    setHarnessError(null);
    void replayHarnessEvents(thread.queueItemId)
      .catch((e) => setHarnessError(String(e)))
      .finally(() => setHarnessBusy(false));
  }

  return (
    <section className="flex min-h-screen min-w-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 pt-12">
        <div className="mx-auto flex max-w-[820px] flex-col gap-4">
          {statusError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Connection lost</AlertTitle>
              <AlertDescription>Unable to reach the Brain automation service.</AlertDescription>
            </Alert>
          )}

          {queueError && (
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Queue read warning</AlertTitle>
              <AlertDescription>{queueError}</AlertDescription>
            </Alert>
          )}

          {implResult && <RunResultAlert label="Implementation" result={implResult} />}
          {reviewResult && <RunResultAlert label="Review" result={reviewResult} />}

          {pendingApprovals.length > 0 && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
              <Flag className="size-4" />
              <AlertTitle>Permission required</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  {pendingApprovals.length === 1
                    ? pendingApprovals[0]?.title
                    : `${pendingApprovals.length} approval requests are waiting.`}
                </span>
                {!isApprovalThread && (
                  <Button size="sm" variant="destructive" onClick={onOpenApprovals}>
                    Open approvals
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {thread?.waitingReason && (
            <Alert className="border-amber-500/20 bg-amber-500/10">
              <Info className="size-4" />
              <AlertTitle>Waiting</AlertTitle>
              <AlertDescription>{thread.waitingReason}</AlertDescription>
            </Alert>
          )}

          {thread && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded-full bg-white/[0.055] px-2 py-1 text-zinc-400">
                {messageSource === "structured-provider-events"
                  ? "Exact provider messages"
                  : messageSource === "transcript-only"
                    ? "Transcript-backed"
                    : "Brain timeline"}
              </span>
              {thread.providerSessionId && (
                <span className="truncate font-mono">session {thread.providerSessionId}</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs text-zinc-400"
                onClick={handleHarnessReplay}
                disabled={harnessBusy}
              >
                <Play className="size-3" />
                Replay
              </Button>
            </div>
          )}

          <div className="space-y-5">
            {messages.map((message) => (
              <ThreadMessage
                key={message.id}
                role={message.role}
                label={message.label}
                body={message.body}
                createdAt={message.createdAt}
                exactProviderMessage={message.exactProviderMessage}
                provider={message.provider}
                model={message.model}
              />
            ))}
          </div>

          {artifacts.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {artifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  label={artifact.label}
                  path={artifact.path ?? ""}
                />
              ))}
            </div>
          )}

          {transcripts.length > 0 && (
            <div className="space-y-2">
              {transcripts.map((transcript) => (
                <TranscriptCard
                  key={transcript.id}
                  label={transcript.label}
                  path={transcript.path ?? ""}
                  runnerId={transcript.runnerId ?? null}
                  active={selectedTranscript?.fileName === logFileNameFromPath(transcript.path ?? "")}
                  onOpen={() => openTranscript(transcript.label, transcript.path ?? "")}
                />
              ))}
            </div>
          )}

          {selectedTranscript && (
            <div className="rounded-md bg-white/[0.035]">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3.5 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-200">{selectedTranscript.label}</div>
                  <div className="truncate text-xs text-zinc-500">{selectedTranscript.fileName}</div>
                </div>
              </div>
              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words p-3.5 font-mono text-xs leading-5 text-zinc-300">
                {selectedTranscript.error ?? selectedTranscript.content}
              </pre>
            </div>
          )}

          {isApprovalThread && (
            <div className="rounded-md bg-transparent">
              <ApprovalPanel />
            </div>
          )}

          <div className="grid gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-4">
            <ThreadMetric icon={Code2} label="Queued" value={status.queuedItems.toString()} />
            <ThreadMetric icon={ShieldCheck} label="Review" value={status.submittedItems.toString()} />
            <ThreadMetric icon={Circle} label="Blocked" value={status.blockedItems.toString()} />
            <ThreadMetric icon={GitBranch} label="Scheduler" value={schedulerState} />
          </div>

          {!isApprovalThread && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {schedulerState === "running" ? (
                <Button variant="secondary" size="sm" onClick={onPauseAutomation}>Pause automation</Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={onStartAutomation}>Start automation</Button>
              )}
              <Button variant="secondary" size="sm" onClick={onRunImplementation}>Run implementation</Button>
              <Button variant="secondary" size="sm" onClick={onRunReview}>Run review</Button>
            </div>
          )}

          {canUseCodexHarness && (
            <form onSubmit={handleHarnessSubmit} className="sticky bottom-0 mt-2 rounded-md border border-white/[0.06] bg-[#191919]/95 p-2.5 shadow-[0_-18px_40px_rgba(0,0,0,0.24)] backdrop-blur">
              {harnessError && (
                <div className="mb-2 rounded-sm bg-red-500/10 px-2.5 py-1.5 text-xs leading-5 text-red-100">
                  {harnessError}
                </div>
              )}
              <div className="flex items-end gap-2">
                <Textarea
                  value={harnessDraft}
                  onChange={(event) => setHarnessDraft(event.target.value)}
                  placeholder={hasCodexProviderSession ? "Message Codex" : "Start exact Codex thread"}
                  className="min-h-[46px] resize-none border-white/[0.08] bg-black/20 text-sm text-zinc-100 placeholder:text-zinc-600"
                  disabled={harnessBusy}
                />
                <div className="flex shrink-0 gap-1">
                  {hasCodexProviderSession && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 text-zinc-400"
                      onClick={handleHarnessStop}
                      disabled={harnessBusy}
                      title="Stop Codex harness"
                    >
                      <Square className="size-4" />
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="icon"
                    className="size-9"
                    disabled={harnessBusy || !harnessDraft.trim()}
                    title={hasCodexProviderSession ? "Send to Codex" : "Start Codex harness"}
                  >
                    {hasCodexProviderSession ? <Send className="size-4" /> : <Play className="size-4" />}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export function ThreadIdentity({
  agent,
  projectName,
  thread,
}: {
  agent: AgentNavItem | null;
  projectName: string;
  thread: AgentThread | null;
}) {
  if (!agent) {
    return (
      <div
        data-tauri-drag-region
        className="absolute inset-x-0 top-0 z-20 h-10 bg-[#141414]/80"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      data-tauri-drag-region
      className="absolute inset-x-0 top-0 z-20 flex h-10 min-w-0 items-center justify-between gap-4 border-b border-white/[0.045] bg-[#141414]/88 px-5 backdrop-blur-xl"
    >
      <div data-tauri-drag-region className="flex min-w-0 items-baseline gap-2">
        <h1 className="truncate text-[13px] font-medium leading-none text-zinc-100">{agent.name}</h1>
        <span className="size-1 rounded-full bg-zinc-700" aria-hidden="true" />
        <p className="truncate text-xs leading-none text-zinc-500">{projectName}</p>
      </div>
      <div className="shrink-0 rounded-full bg-white/[0.055] px-2 py-0.5 text-xs leading-none text-zinc-500">
        {thread?.status ?? agent.status}
      </div>
    </div>
  );
}

function ArtifactCard({ label, path }: { label: string; path: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.035] px-3.5 py-2.5">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
        <FileText className="size-3.5 shrink-0 text-zinc-500" />
        {label}
      </div>
      <div className="mt-1 break-all font-mono text-xs leading-5 text-zinc-500">{path}</div>
    </div>
  );
}

function TranscriptCard({
  label,
  path,
  runnerId,
  active,
  onOpen,
}: {
  label: string;
  path: string;
  runnerId: string | null;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onOpen}
      className={`h-auto w-full justify-start gap-3 rounded-md border-transparent bg-white/[0.035] px-3.5 py-2.5 text-left shadow-none hover:bg-white/[0.07] ${
        active ? "text-zinc-50" : "text-zinc-300"
      }`}
    >
      <FileText className="size-4 shrink-0 text-zinc-500" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="block truncate text-xs text-zinc-500">{runnerId ?? logFileNameFromPath(path) ?? path}</span>
      </span>
    </Button>
  );
}

export function ThreadMessage({
  role,
  label,
  body,
  createdAt,
  exactProviderMessage,
  provider,
  model,
}: {
  role?: AgentThreadMessageRecord["role"] | string;
  label: string;
  body: string;
  createdAt?: string;
  exactProviderMessage?: boolean;
  provider?: string;
  model?: string;
}) {
  const Icon = role === "approval" ? Flag : role === "artifact" ? FileText : role === "agent" ? Code2 : Sparkles;
  const bubbleClass = role === "approval"
    ? "bg-red-500/10 text-red-100"
    : role === "artifact"
      ? "bg-sky-500/10 text-sky-100"
      : role === "agent"
        ? "bg-emerald-500/10 text-emerald-100"
        : "bg-white/[0.045] text-zinc-300";
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-zinc-200">
          <span>{label}</span>
          {createdAt && <span className="text-xs font-normal text-zinc-600">{formatCompactTimestamp(createdAt)}</span>}
          {exactProviderMessage && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-normal text-emerald-200">
              exact{provider ? ` · ${provider}` : ""}{model ? ` · ${model}` : ""}
            </span>
          )}
        </div>
        <div className={`mt-1 whitespace-pre-wrap rounded-md px-3.5 py-2.5 text-sm leading-6 ${bubbleClass}`}>
          {body}
        </div>
      </div>
    </div>
  );
}

function formatCompactTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) {
    return undefined;
  }
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) {
    return undefined;
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function ThreadMetric({ icon: Icon, label, value }: { icon: typeof Code2; label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.035] p-3">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-2 truncate text-base font-semibold text-zinc-100">{value}</div>
    </div>
  );
}
