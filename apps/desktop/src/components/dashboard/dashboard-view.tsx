import { useState, type ReactNode } from "react";
import type { ApprovalRequest, BrainProject, BrainStatus, OrchestrationThread, QueueItem, SchedulerStatus } from "@brain-loop/brain-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatCompactElapsed, formatQueueThreadTitle, isWithinReviewWindow, queueItemDisplayTimestamp } from "@/lib/queue-display";
import { Circle, Code2, Flag, LayoutDashboard, Play, Search, ShieldCheck, Sparkles } from "lucide-react";

export function DashboardView({
  status,
  schedulerStatus,
  schedulerState,
  queueItems,
  projects,
  approvalRequests,
  orchestrations,
  queueStartBusyId,
  queueStartResult,
  onOpenApprovals,
  onOpenQueueItem,
  onRunQueueItem,
  onNewOrchestrator,
}: {
  status: BrainStatus;
  schedulerStatus: SchedulerStatus | null;
  schedulerState: string;
  queueItems: QueueItem[];
  projects: BrainProject[];
  approvalRequests: ApprovalRequest[];
  orchestrations: OrchestrationThread[];
  queueStartBusyId: string | null;
  queueStartResult: { ok: boolean; text: string } | null;
  onOpenApprovals: () => void;
  onOpenQueueItem: (queueItemId: string) => void;
  onRunQueueItem: (queueItemId: string) => void;
  onNewOrchestrator: () => void;
}) {
  const [projectFilter, setProjectFilter] = useState("all");
  const [reviewWindow, setReviewWindow] = useState<"week" | "month">("week");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredQueue = queueItems
    .filter((item) => projectFilter === "all" || item.projectId === projectFilter || item.projectPath === projectFilter)
    .filter((item) => {
      if (!normalizedQuery) {
        return true;
      }
      return [item.id, item.status, item.projectId, item.taskName, item.threadTitle, item.handoffPath, item.activeHandoffPath]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    })
    .sort((a, b) => queueItemDisplayTimestamp(b).localeCompare(queueItemDisplayTimestamp(a)));
  const activeItems = queueItems.filter((item) => ["picked", "started", "reviewing", "landing"].includes(item.status));
  const reviewItems = queueItems.filter((item) => ["submitted", "reviewing", "reviewed-fix-request", "landing", "approved"].includes(item.status));
  const reviewedInWindow = reviewItems.filter((item) => isWithinReviewWindow(item.reviewedAt ?? item.approvedAt, reviewWindow));
  const attentionItems = queueItems.filter((item) => item.status === "blocked" || item.status === "stale-started" || Boolean(item.waitingReason));
  const manualProjects = projects.filter((project) => !project.autoMergeOnReviewPass);
  const automaticProjects = projects.filter((project) => project.autoMergeOnReviewPass);
  const manualLandingItems = queueItems.filter((item) => {
    const project = projects.find((candidate) => candidate.id === item.projectId || candidate.path === item.projectPath);
    return item.status === "landing" && project && !project.autoMergeOnReviewPass;
  });
  const implementationCapacity = schedulerStatus
    ? `${schedulerStatus.activeImplementationAgents}/${schedulerStatus.maxImplementationAgents}`
    : `${status.activeRuns}`;
  const reviewCapacity = schedulerStatus
    ? `${schedulerStatus.activeReviewAgents}/${schedulerStatus.maxReviewAgents}`
    : status.reviewStatus;
  const schedulerUsage = schedulerStatus
    ? `${schedulerStatus.activeImplementationAgents + schedulerStatus.activeReviewAgents}/${schedulerStatus.maxImplementationAgents + schedulerStatus.maxReviewAgents}`
    : `${status.activeRuns} active`;

  return (
    <section className="flex min-h-screen min-w-0 flex-1 flex-col bg-[#141414]">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-12 lg:px-7">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[13px] font-medium text-zinc-300">
                <LayoutDashboard className="size-3.5 text-zinc-500" />
                Operations
              </div>
              <h2 className="mt-1 text-[22px] font-semibold leading-7 tracking-tight text-zinc-50">Dashboard</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={onNewOrchestrator} className="gap-2 text-zinc-300">
                <Sparkles className="size-3.5" />
                New Orchestrator
              </Button>
              <Button
                type="button"
                size="sm"
                variant={approvalRequests.length > 0 ? "destructive" : "secondary"}
                onClick={onOpenApprovals}
                className="gap-2"
              >
                <ShieldCheck className="size-3.5" />
                Approvals
              </Button>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-md border border-white/[0.075] bg-white/[0.075] md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetric title="Scheduler" value={schedulerState} detail={`${schedulerUsage} capacity`} icon={Circle} tone={schedulerState === "error" ? "danger" : schedulerState === "running" ? "success" : "neutral"} />
            <DashboardMetric title="Implementation" value={implementationCapacity} detail={`${status.queuedItems} queued`} icon={Code2} />
            <DashboardMetric title="Review Pool" value={reviewCapacity} detail={`${status.submittedItems} waiting`} icon={ShieldCheck} />
            <DashboardMetric title="Needs Attention" value={(approvalRequests.length + attentionItems.length).toString()} detail={`${approvalRequests.length} approvals`} icon={Flag} tone={approvalRequests.length + attentionItems.length > 0 ? "danger" : "neutral"} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <DashboardPanel
              title="Queue Focus"
              action={`${filteredQueue.length}/${queueItems.length}`}
              className="min-h-[520px]"
            >
              <div className="mb-3 grid gap-2 lg:grid-cols-[minmax(220px,1fr)_210px_150px]">
                <div className="relative min-w-0">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search tasks, status, project, handoff"
                    className="h-8 rounded-md border-white/[0.08] bg-black/20 pl-8 text-[13px] text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="h-8 w-full rounded-md border-white/[0.08] bg-black/20 text-[13px] text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/[0.08] bg-[#252525] text-zinc-100">
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={reviewWindow} onValueChange={(value) => setReviewWindow(value as "week" | "month")}>
                  <SelectTrigger className="h-8 w-full rounded-md border-white/[0.08] bg-black/20 text-[13px] text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/[0.08] bg-[#252525] text-zinc-100">
                    <SelectItem value="week">Week review</SelectItem>
                    <SelectItem value="month">Month review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {queueStartResult && (
                <div className={cn(
                  "mb-3 rounded-md border px-3 py-2 text-xs",
                  queueStartResult.ok
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : "border-red-500/20 bg-red-500/10 text-red-200",
                )}>
                  {queueStartResult.text}
                </div>
              )}

              <div className="overflow-hidden rounded-md border border-white/[0.06] bg-black/[0.14]">
                {filteredQueue.slice(0, 10).map((item) => (
                  <DashboardQueueRow
                    key={item.id}
                    item={item}
                    projects={projects}
                    schedulerStatus={schedulerStatus}
                    busy={queueStartBusyId === item.id}
                    onClick={() => onOpenQueueItem(item.id)}
                    onStart={() => onRunQueueItem(item.id)}
                  />
                ))}
                {filteredQueue.length === 0 && (
                  <div className="py-10 text-center text-sm text-zinc-500">No tasks match the current filters.</div>
                )}
              </div>
            </DashboardPanel>

            <div className="grid content-start gap-3">
              <DashboardPanel title="Workload" action={reviewedInWindow.length.toString()}>
                <DashboardLine label="Queued" value={status.queuedItems.toString()} />
                <DashboardLine label="Active" value={activeItems.length.toString()} />
                <DashboardLine label="Review-ready" value={status.submittedItems.toString()} />
                <DashboardLine label="Blocked" value={status.blockedItems.toString()} />
              </DashboardPanel>
              <DashboardPanel title="Approval Policy">
                <DashboardLine label="Manual projects" value={manualProjects.length.toString()} />
                <DashboardLine label="Automatic projects" value={automaticProjects.length.toString()} />
                <DashboardLine label="Pending approvals" value={approvalRequests.length.toString()} />
                <DashboardLine label="Reviewed/manual landing" value={manualLandingItems.length.toString()} />
              </DashboardPanel>
              <DashboardPanel title="Orchestration">
                <DashboardLine label="Threads" value={orchestrations.length.toString()} />
                <DashboardLine label="Handed off" value={orchestrations.filter((thread) => thread.status === "handed-off").length.toString()} />
                <DashboardLine label="Draft/refining" value={orchestrations.filter((thread) => thread.status !== "handed-off").length.toString()} />
              </DashboardPanel>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardPanel title="Project Policy" action={`${projects.length} projects`}>
              <div className="-mx-2">
                {projects.slice(0, 8).map((project) => (
                  <div key={project.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-white/[0.035]">
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-zinc-200">{project.name}</span>
                      <span className="block truncate text-xs text-zinc-500">{project.enabled ? "enabled" : "disabled"} · {project.id}</span>
                    </span>
                    <Badge variant="outline" className={cn("shrink-0 border-transparent", project.autoMergeOnReviewPass ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300")}>
                      {project.autoMergeOnReviewPass ? "Automatic" : "Manual"}
                    </Badge>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="px-2 py-6 text-center text-sm text-zinc-500">No projects registered.</div>
                )}
              </div>
            </DashboardPanel>
            <DashboardPanel title="Review Queue" action={`${reviewItems.length} items`}>
              <div className="-mx-2">
                {reviewItems.slice(0, 8).map((item) => (
                  <DashboardReviewRow key={item.id} item={item} onClick={() => onOpenQueueItem(item.id)} />
                ))}
                {reviewItems.length === 0 && (
                  <div className="py-6 text-center text-sm text-zinc-500">No review items yet.</div>
                )}
              </div>
            </DashboardPanel>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMetric({
  title,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof LayoutDashboard;
  tone?: "neutral" | "danger" | "success";
}) {
  return (
    <div className={cn("min-w-0 bg-[#181818] p-3.5", tone === "danger" && "bg-red-950/20", tone === "success" && "bg-emerald-950/10")}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">{title}</div>
        <Icon className={cn("size-3.5 shrink-0 text-zinc-600", tone === "danger" && "text-red-300", tone === "success" && "text-emerald-300")} />
      </div>
      <div className="mt-2 truncate text-xl font-semibold leading-6 tracking-tight text-zinc-50">{value}</div>
      <div className="mt-1 truncate text-xs text-zinc-500">{detail}</div>
    </div>
  );
}

function DashboardPanel({ title, action, className, children }: { title: string; action?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("min-w-0 rounded-md border border-white/[0.065] bg-[#181818] p-3.5 shadow-[0_18px_60px_rgba(0,0,0,0.16)]", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">{title}</div>
        {action && <div className="shrink-0 text-xs text-zinc-500">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function DashboardLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/[0.055] py-2 first:border-t-0">
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono text-[13px] font-medium text-zinc-200">{value}</span>
    </div>
  );
}

function DashboardQueueRow({
  item,
  projects,
  schedulerStatus,
  busy,
  onClick,
  onStart,
}: {
  item: QueueItem;
  projects: BrainProject[];
  schedulerStatus: SchedulerStatus | null;
  busy: boolean;
  onClick: () => void;
  onStart: () => void;
}) {
  const elapsed = formatCompactElapsed(queueItemDisplayTimestamp(item));
  const startState = getQueueStartState(item, projects, schedulerStatus, busy);
  return (
    <div className="flex items-stretch gap-1 border-b border-white/[0.055] px-1.5 py-1.5 last:border-b-0 hover:bg-white/[0.035]">
      <Button
        type="button"
        variant="ghost"
        onClick={onClick}
        className="h-auto min-w-0 flex-1 justify-start rounded-md px-1.5 py-1 text-left font-normal shadow-none hover:bg-transparent"
      >
        <span className="grid min-w-0 flex-1 gap-1 md:grid-cols-[minmax(0,1fr)_140px_116px] md:items-center">
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium leading-5 text-zinc-200">{formatQueueThreadTitle(item)}</span>
            <span className="block truncate text-xs leading-5 text-zinc-600">{item.projectId ?? "Global"} · {item.id}</span>
          </span>
          <span className="hidden min-w-0 truncate text-xs text-zinc-500 md:block">{item.agent ?? "unassigned"}</span>
          <span className="flex items-center justify-start gap-2 md:justify-end">
            <DashboardStatusBadge status={item.status} />
            {elapsed && <span className="hidden w-8 text-right text-xs text-zinc-600 sm:inline">{elapsed}</span>}
          </span>
        </span>
      </Button>
      <QueueStartButton state={startState} onStart={onStart} />
    </div>
  );
}

function QueueStartButton({
  state,
  onStart,
}: {
  state: QueueStartState;
  onStart: () => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="self-center">
            <Button
              type="button"
              size="sm"
              variant={state.canStart ? "secondary" : "ghost"}
              disabled={!state.canStart || state.busy}
              onClick={(event) => {
                event.stopPropagation();
                onStart();
              }}
              className="h-7 gap-1.5 px-2 text-xs"
            >
              <Play className="size-3" />
              {state.busy ? "Starting" : "Start"}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="left">{state.reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type QueueStartState = {
  canStart: boolean;
  busy: boolean;
  reason: string;
};

function getQueueStartState(
  item: QueueItem,
  projects: BrainProject[],
  schedulerStatus: SchedulerStatus | null,
  busy: boolean,
): QueueStartState {
  if (busy) {
    return { canStart: false, busy: true, reason: "Starting this task now." };
  }

  const project = projects.find((candidate) => candidate.id === item.projectId || candidate.path === item.projectPath);
  if (project?.enabled === false) {
    return { canStart: false, busy: false, reason: "Project is disabled." };
  }
  if (projects.length > 0 && !project) {
    return { canStart: false, busy: false, reason: "Project is not registered." };
  }
  if (!item.agent) {
    return { canStart: false, busy: false, reason: "Task has no runner." };
  }
  if (item.waitingReason) {
    return { canStart: false, busy: false, reason: item.waitingReason };
  }

  if (item.status === "queued" || item.status === "reviewed-fix-request") {
    if (
      schedulerStatus &&
      schedulerStatus.activeImplementationAgents >= schedulerStatus.maxImplementationAgents
    ) {
      return { canStart: false, busy: false, reason: "Implementation capacity is full." };
    }
    return { canStart: true, busy: false, reason: "Start implementation for this task only." };
  }

  if (item.status === "submitted") {
    if (schedulerStatus && schedulerStatus.activeReviewAgents >= schedulerStatus.maxReviewAgents) {
      return { canStart: false, busy: false, reason: "Review capacity is full." };
    }
    return { canStart: true, busy: false, reason: "Start review for this task only." };
  }

  if (item.status === "landing") {
    return { canStart: false, busy: false, reason: "Landing or approval flow owns this task." };
  }
  if (item.status === "approved") {
    return { canStart: false, busy: false, reason: "Task is already approved." };
  }
  if (item.status === "picked" || item.status === "started" || item.status === "reviewing") {
    return { canStart: false, busy: false, reason: "Task is already active." };
  }
  if (item.status === "blocked" || item.status === "stale-started") {
    return { canStart: false, busy: false, reason: "Move this task back to queued or submitted before starting." };
  }

  return { canStart: false, busy: false, reason: `Status ${item.status} cannot be manually started.` };
}

function DashboardReviewRow({ item, onClick }: { item: QueueItem; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="h-auto w-full justify-between gap-3 rounded-md px-2 py-2 text-left font-normal text-zinc-200 shadow-none hover:bg-white/[0.035]"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm">{formatQueueThreadTitle(item)}</span>
        <span className="block truncate text-xs text-zinc-500">{item.projectId ?? "Global"}</span>
      </span>
      <DashboardStatusBadge status={item.status} />
    </Button>
  );
}

function DashboardStatusBadge({ status }: { status: string }) {
  const tone = status === "approved"
    ? "bg-emerald-500/10 text-emerald-300"
    : status === "blocked" || status === "stale-started"
      ? "bg-red-500/10 text-red-300"
      : status === "submitted" || status === "reviewing"
        ? "bg-sky-500/10 text-sky-300"
        : status === "landing" || status === "reviewed-fix-request"
          ? "bg-amber-500/10 text-amber-300"
          : "bg-white/[0.055] text-zinc-400";

  return (
    <Badge variant="outline" className={cn("shrink-0 border-transparent font-mono", tone)}>
      {status}
    </Badge>
  );
}
