import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  archiveAgentThread,
  getBrainStatus,
  getLaunchAgentInfo,
  getSchedulerStatus,
  getSettings,
  installLaunchAgent,
  listApprovalRequests,
  listAgentThreads,
  listDirectModelRuntimeContract,
  listHarnessCapabilities,
  listProjects,
  listQueue,
  loadLaunchAgent,
  onApprovalEvent,
  onHarnessEvent,
  pauseAutomation,
  readLogFile,
  removeLaunchAgent,
  runImplementationOnce,
  runReviewOnce,
  replayHarnessEvents,
  sendHarnessMessage,
  startAutomation,
  startHarnessSession,
  stopHarnessSession,
  unloadLaunchAgent,
  updateSettings,
} from "@brain-loop/desktop-client";
import type {
  AgentThread,
  AgentThreadMessage as AgentThreadMessageRecord,
  ApprovalRequest,
  BrainProject,
  BrainStatus,
  DirectModelRuntimeContract,
  HarnessProviderCapability,
  LaunchAgentInfo,
  QueueItem,
  Settings,
} from "@brain-loop/brain-core";
import { ApprovalPanel } from "./components/approval-panel";
import { LogsPanel } from "./components/logs-panel";
import { SettingsPage } from "./components/settings/settings-page";
import { Sidebar, type AgentNavItem, type SidebarOrganization, type ThreadSort } from "./components/sidebar";
import { QueueTable } from "./components/tables/queue/queue-table";
import { TerminalPanel } from "./components/terminal-panel";
import {
  getNotificationPermission,
  loadPermissionSoundEnabled,
  loadNotificationPreferences,
  notifyAutomationEvent,
  playPermissionRequiredCue,
  requestNotificationPermission,
  savePermissionSoundEnabled,
  saveNotificationPreferences,
  type AutomationNotification,
  type NotificationCategory,
  type NotificationPreferences,
} from "./lib/notifications";
import { loadThemePreference, saveThemePreference, type ThemePreference } from "./lib/theme";
import { BrainLoopLogo } from "@/components/brain-loop-logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Code2,
  FileText,
  GitBranch,
  Info,
  ShieldCheck,
  Sparkles,
  Flag,
  Play,
  Send,
  Square,
} from "lucide-react";

const fallbackStatus: BrainStatus = {
  implementationStatus: "unknown",
  reviewStatus: "unknown",
  activeRuns: 0,
  queuedItems: 0,
  submittedItems: 0,
  blockedItems: 0,
};

const archivableThreadStatuses = new Set(["done", "landing", "blocked", "unknown"]);
const taskBackedThreadStatuses = new Set([
  "started",
  "stale-started",
  "submitted",
  "reviewing",
  "reviewed-fix-request",
  "landing",
  "approved",
  "blocked",
]);

type AppView = "workspace" | "settings";
type LaunchAgentAction = "install" | "load" | "unload" | "remove";
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

export function App() {
  const [view, setView] = useState<AppView>("workspace");
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOrganization, setSidebarOrganization] = useState<SidebarOrganization>("chronological-list");
  const [threadSort, setThreadSort] = useState<ThreadSort>("updatedAt");
  const [status, setStatus] = useState<BrainStatus>(fallbackStatus);
  const [schedulerState, setSchedulerState] = useState<string>("unknown");
  const [statusError, setStatusError] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [implResult, setImplResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [reviewResult, setReviewResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [laAgentInfo, setLaAgentInfo] = useState<LaunchAgentInfo | null>(null);
  const [laAgentAction, setLaAgentAction] = useState<{ ok: boolean; text: string } | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [agentThreads, setAgentThreads] = useState<AgentThread[]>([]);
  const [queueProjects, setQueueProjects] = useState<BrainProject[]>([]);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() => loadNotificationPreferences());
  const [permissionSoundEnabled, setPermissionSoundEnabled] = useState(() => loadPermissionSoundEnabled());
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [harnessCapabilities, setHarnessCapabilities] = useState<HarnessProviderCapability[]>([]);
  const [directModelRuntimeContract, setDirectModelRuntimeContract] = useState<DirectModelRuntimeContract | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(() => getNotificationPermission());
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => loadThemePreference());
  const [brainSettings, setBrainSettings] = useState<Settings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<{ title: string; body: string; result: string } | null>(null);
  const [unreadCompletedThreadIds, setUnreadCompletedThreadIds] = useState<Set<string>>(() => new Set());
  const notificationPrefsRef = useRef(notificationPrefs);
  const activeAgentIdRef = useRef(activeAgentId);
  const knownCompletedThreadIdsRef = useRef<Set<string>>(new Set());
  const completedThreadBaselineReadyRef = useRef(false);
  const lastStatusRef = useRef<BrainStatus | null>(null);
  const lastSchedulerRef = useRef<string | null>(null);
  const lastQueueErrorRef = useRef<string | null>(null);
  const soundedApprovalIdsRef = useRef<Set<string>>(new Set());
  const permissionSoundEnabledRef = useRef(permissionSoundEnabled);

  const pendingApprovalRequests = useMemo(
    () => approvalRequests.filter((request) => request.status === "pending"),
    [approvalRequests],
  );
  const pendingApprovalByQueueId = useMemo(() => {
    const map = new Map<string, ApprovalRequest[]>();
    for (const request of pendingApprovalRequests) {
      if (!request.queueItemId) {
        continue;
      }
      const existing = map.get(request.queueItemId) ?? [];
      existing.push(request);
      map.set(request.queueItemId, existing);
    }
    return map;
  }, [pendingApprovalRequests]);

  const agents = useMemo<AgentNavItem[]>(
    () => [
      {
        id: "codex-review",
        name: "Review",
        description: `${status.submittedItems} review-ready`,
        status: status.reviewStatus,
        count: status.submittedItems,
        kind: "review",
      },
      {
        id: "implementation",
        name: "Implementation",
        description: `${status.queuedItems} queued`,
        status: status.implementationStatus,
        count: status.queuedItems,
        kind: "implementation",
      },
      {
        id: "approvals",
        name: "Approval",
        description: `${status.blockedItems} blocked`,
        status: status.blockedItems > 0 ? "attention" : "clear",
        count: pendingApprovalRequests.length || status.blockedItems,
        kind: "approval",
        alert: pendingApprovalRequests.length > 0 ? {
          label: `${pendingApprovalRequests.length} pending`,
          title: "Permission required",
        } : undefined,
      },
    ],
    [pendingApprovalRequests.length, status],
  );
  const projectById = useMemo(() => {
    return new Map(queueProjects.map((project) => [project.id, project]));
  }, [queueProjects]);
  const threadByQueueId = useMemo(() => {
    return new Map(agentThreads.map((thread) => [thread.queueItemId, thread]));
  }, [agentThreads]);
  const visibleAgentThreads = useMemo(() => {
    return agentThreads.filter((thread) => isTaskBackedThreadStatus(thread.implementationStatus));
  }, [agentThreads]);
  const threadItems = useMemo<AgentNavItem[]>(() => {
    const durableThreads = visibleAgentThreads.map((thread) => {
      const project = projectById.get(thread.projectId);
      const id = `thread:${thread.queueItemId}`;
      const completed = thread.status === "done";
      const projectName = thread.projectName ?? project?.name ?? thread.projectId;
      const workspaceLabel = formatWorkspaceLabel(thread.executionStrategy);
      return {
        id,
        name: thread.title,
        description: `${projectName} · ${thread.status}`,
        status: thread.status,
        count: thread.runnerId || thread.reviewRunnerId ? 1 : 0,
        projectName,
        timeLabel: formatCompactElapsed(thread.updatedAt || thread.createdAt),
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        threadId: thread.id,
        queueItemId: thread.queueItemId,
        workspaceLabel,
        groupLabel: groupLabelForThread(sidebarOrganization, projectName, workspaceLabel),
        archivable: archivableThreadStatuses.has(thread.status),
        completed,
        unread: unreadCompletedThreadIds.has(id),
        kind: "thread" as const,
        alert: pendingApprovalByQueueId.has(thread.queueItemId) ? {
          label: "Permission",
          title: "Permission required",
        } : undefined,
      };
    });
    const taskThreads = queueItems
      .filter((item) => isTaskBackedThreadStatus(item.status) && !threadByQueueId.has(item.id))
      .map((item) => {
        const project = projectById.get(item.projectId);
        const projectName = project?.name ?? item.projectId;
        const workspaceLabel = formatWorkspaceLabel(item.executionStrategy);
        const updatedAt = queueItemDisplayTimestamp(item);
        return {
          id: `thread:${item.id}`,
          name: formatQueueThreadTitle(item),
          description: `${projectName} · ${item.status}`,
          status: item.status,
          count: item.runnerId || item.reviewRunnerId ? 1 : 0,
          projectName,
          timeLabel: formatCompactElapsed(updatedAt),
          createdAt: item.createdAt,
          updatedAt,
          queueItemId: item.id,
          workspaceLabel,
          groupLabel: groupLabelForThread(sidebarOrganization, projectName, workspaceLabel),
          archivable: false,
          completed: item.status === "approved",
          unread: false,
          kind: "thread" as const,
          alert: pendingApprovalByQueueId.has(item.id) ? {
            label: "Permission",
            title: "Permission required",
          } : undefined,
        };
      });

    return sortThreadNavItems([...durableThreads, ...taskThreads], sidebarOrganization, threadSort);
  }, [pendingApprovalByQueueId, projectById, queueItems, sidebarOrganization, threadByQueueId, threadSort, unreadCompletedThreadIds, visibleAgentThreads]);
  const activeAgent = [...agents, ...threadItems].find((agent) => agent.id === activeAgentId) ?? null;
  const activeThread = activeAgentId?.startsWith("thread:")
    ? visibleAgentThreads.find((thread) => `thread:${thread.queueItemId}` === activeAgentId) ?? null
    : null;

  useEffect(() => {
    activeAgentIdRef.current = activeAgentId;
    if (activeAgentId?.startsWith("thread:")) {
      setUnreadCompletedThreadIds((current) => {
        if (!current.has(activeAgentId)) {
          return current;
        }
        const next = new Set(current);
        next.delete(activeAgentId);
        return next;
      });
    }
  }, [activeAgentId]);

  useEffect(() => {
    notificationPrefsRef.current = notificationPrefs;
    saveNotificationPreferences(notificationPrefs);
  }, [notificationPrefs]);

  useEffect(() => {
    permissionSoundEnabledRef.current = permissionSoundEnabled;
    savePermissionSoundEnabled(permissionSoundEnabled);
  }, [permissionSoundEnabled]);

  useEffect(() => {
    saveThemePreference(themePreference);
  }, [themePreference]);

  useEffect(() => {
    if (themePreference !== "system" || typeof window === "undefined" || !("matchMedia" in window)) {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => saveThemePreference("system");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [themePreference]);

  function emitNotification(notification: AutomationNotification) {
    const result = notifyAutomationEvent(notification, notificationPrefsRef.current);
    if (result !== "disabled") {
      setLastNotification({ title: notification.title, body: notification.body, result });
    }
  }

  function refreshApprovals() {
    void listApprovalRequests()
      .then(setApprovalRequests)
      .catch(() => setApprovalRequests([]));
  }

  function handleApprovalSignal(request: ApprovalRequest) {
    setApprovalRequests((current) => {
      const index = current.findIndex((candidate) => candidate.id === request.id);
      if (index === -1) {
        return [request, ...current];
      }
      const next = [...current];
      next[index] = request;
      return next;
    });

    if (request.status !== "pending") {
      soundedApprovalIdsRef.current.delete(request.id);
      return;
    }

    emitNotification({
      category: "approval",
      title: "Approval needed",
      body: request.title,
      tag: `brain-loop-approval-${request.id}`,
    });

    if (
      permissionSoundEnabledRef.current &&
      notificationPrefsRef.current.approval &&
      !soundedApprovalIdsRef.current.has(request.id)
    ) {
      soundedApprovalIdsRef.current.add(request.id);
      playPermissionRequiredCue();
    }
  }

  function handleBrainStatus(nextStatus: BrainStatus) {
    const previous = lastStatusRef.current;

    if (previous && nextStatus.blockedItems > previous.blockedItems) {
      emitNotification({
        category: "blocked",
        title: "Queue item blocked",
        body: `${nextStatus.blockedItems} queue item${nextStatus.blockedItems === 1 ? "" : "s"} blocked.`,
        tag: "brain-loop-blocked",
      });
    }

    if (previous && nextStatus.submittedItems > previous.submittedItems) {
      emitNotification({
        category: "submitted",
        title: "Work submitted for review",
        body: `${nextStatus.submittedItems} queue item${nextStatus.submittedItems === 1 ? "" : "s"} waiting for review.`,
        tag: "brain-loop-submitted",
      });
    }

    lastStatusRef.current = nextStatus;
    setStatus(nextStatus);
    setStatusError(false);
    setIsLoading(false);
  }

  function handleSchedulerState(nextState: string) {
    if (lastSchedulerRef.current && nextState === "error" && lastSchedulerRef.current !== "error") {
      emitNotification({
        category: "scheduler",
        title: "Scheduler error",
        body: "Scheduler status could not be determined.",
        tag: "brain-loop-scheduler-error",
      });
    }

    lastSchedulerRef.current = nextState;
    setSchedulerState(nextState);
  }

  async function refreshProjects() {
    try {
      const projects = await listProjects();
      setQueueProjects(projects);
      setProjectError(null);
    } catch (e) {
      setQueueProjects([]);
      setProjectError(`Unable to load projects: ${String(e)}`);
    } finally {
      setIsProjectsLoading(false);
    }
  }

  function reconcileCompletedThreadRows(rows: Array<{ id: string; completed: boolean }>) {
    const completedIds = new Set(rows.filter((row) => row.completed).map((row) => row.id));

    if (!completedThreadBaselineReadyRef.current) {
      knownCompletedThreadIdsRef.current = completedIds;
      completedThreadBaselineReadyRef.current = true;
      setUnreadCompletedThreadIds(new Set());
      return;
    }

    const activeId = activeAgentIdRef.current;
    const knownCompletedIds = knownCompletedThreadIdsRef.current;
    const newlyCompletedIds = [...completedIds].filter((id) => !knownCompletedIds.has(id));
    const noLongerCompletedIds = [...knownCompletedIds].filter((id) => !completedIds.has(id));

    if (newlyCompletedIds.length === 0 && noLongerCompletedIds.length === 0) {
      return;
    }

    for (const id of newlyCompletedIds) {
      knownCompletedIds.add(id);
    }
    for (const id of noLongerCompletedIds) {
      knownCompletedIds.delete(id);
    }

    setUnreadCompletedThreadIds((current) => {
      const next = new Set(current);
      for (const id of newlyCompletedIds) {
        if (id !== activeId) {
          next.add(id);
        }
      }
      for (const id of noLongerCompletedIds) {
        next.delete(id);
      }
      return next;
    });
  }

  function handleQueueResponse(response: Awaited<ReturnType<typeof listQueue>>) {
    setQueueItems(response.items);
    const nextError = response.errors.length > 0
      ? `${response.errors.length} queue files could not be read. ${response.errors[0]?.fileName}: ${response.errors[0]?.message}`
      : null;

    if (nextError && lastQueueErrorRef.current !== nextError) {
      emitNotification({
        category: "scheduler",
        title: "Queue read warning",
        body: nextError,
        tag: "brain-loop-queue-read-warning",
      });
    }

    lastQueueErrorRef.current = nextError;
    setQueueError(nextError);
    setIsQueueLoading(false);
  }

  async function refreshAgentThreads() {
    try {
      const threads = await listAgentThreads();
      reconcileCompletedThreadRows(threads.map((thread) => ({
        id: `thread:${thread.queueItemId}`,
        completed: thread.status === "done",
      })));
      setAgentThreads(threads);
      setThreadError(null);
    } catch (e) {
      setAgentThreads([]);
      setThreadError(`Unable to load agent threads: ${String(e)}`);
    }
  }

  async function refreshSettings() {
    try {
      const settings = await getSettings();
      setBrainSettings(settings);
      setSettingsError(null);
    } catch (e) {
      setSettingsError(`Unable to load settings: ${String(e)}`);
    }
  }

  function refreshHarnessCapabilities() {
    void listHarnessCapabilities()
      .then(setHarnessCapabilities)
      .catch(() => setHarnessCapabilities([]));
  }

  function refreshDirectModelRuntimeContract() {
    void listDirectModelRuntimeContract()
      .then(setDirectModelRuntimeContract)
      .catch(() => setDirectModelRuntimeContract(null));
  }

  useEffect(() => {
    const poll = setInterval(() => {
      void getBrainStatus()
        .then(handleBrainStatus)
        .catch(() => { setStatus(fallbackStatus); setStatusError(true); setIsLoading(false); });
      void getSchedulerStatus()
        .then((s) => handleSchedulerState(s.state))
        .catch(() => handleSchedulerState("error"));
      void listQueue()
        .then(handleQueueResponse)
        .catch((e) => {
          const nextError = `Unable to load queue items: ${String(e)}`;
          lastQueueErrorRef.current = nextError;
          setQueueError(nextError);
          setIsQueueLoading(false);
        });
      void refreshAgentThreads();
      void refreshProjects();
    }, 2000);

    void getBrainStatus().then(handleBrainStatus).catch(() => { setStatus(fallbackStatus); setStatusError(true); setIsLoading(false); });
    void getSchedulerStatus().then((s) => handleSchedulerState(s.state)).catch(() => handleSchedulerState("error"));
    void getLaunchAgentInfo().then(setLaAgentInfo).catch(() => setLaAgentInfo(null));
    void listQueue().then(handleQueueResponse).catch((e) => {
      const nextError = `Unable to load queue items: ${String(e)}`;
      lastQueueErrorRef.current = nextError;
      setQueueError(nextError);
      setIsQueueLoading(false);
    });
    void refreshAgentThreads();
    void refreshProjects();
    void refreshSettings();
    refreshHarnessCapabilities();
    refreshDirectModelRuntimeContract();
    refreshApprovals();

    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    let unlisten: (() => void)[] = [];
    void onApprovalEvent(handleApprovalSignal).then((listeners) => {
      unlisten = listeners;
    });

    return () => {
      unlisten.forEach((stop) => stop());
    };
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    void onHarnessEvent(() => {
      void refreshAgentThreads();
    }).then((listener) => {
      unlisten = listener;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  function handleRunImplementation() {
    void runImplementationOnce()
      .then((text) => setImplResult({ ok: true, text }))
      .catch((e) => setImplResult({ ok: false, text: `Error: ${e}` }));
  }

  function handleRunReview() {
    void runReviewOnce()
      .then((text) => setReviewResult({ ok: true, text }))
      .catch((e) => setReviewResult({ ok: false, text: `Error: ${e}` }));
  }

  function refreshLaunchAgent() {
    void getLaunchAgentInfo().then(setLaAgentInfo).catch(() => setLaAgentInfo(null));
  }

  function handleLaunchAgentAction(action: LaunchAgentAction) {
    const actionMap = {
      install: installLaunchAgent,
      load: loadLaunchAgent,
      unload: unloadLaunchAgent,
      remove: removeLaunchAgent,
    };

    void actionMap[action]()
      .then((text) => {
        setLaAgentAction({ ok: true, text });
        refreshLaunchAgent();
      })
      .catch((e) => setLaAgentAction({ ok: false, text: String(e) }));
  }

  function toggleNotification(category: NotificationCategory) {
    setNotificationPrefs((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  function requestNotifications() {
    void requestNotificationPermission().then((permission) => setNotificationPermission(permission));
  }

  function handleBrainSettingsChange(nextSettings: Settings) {
    void updateSettings(nextSettings)
      .then((saved) => {
        setBrainSettings(saved);
        setSettingsError(null);
      })
      .catch((e) => setSettingsError(String(e)));
  }

  function handleArchiveThread(item: AgentNavItem) {
    if (!item.threadId || !item.archivable) {
      return;
    }

    void archiveAgentThread(
      item.threadId,
      "desktop-user",
      "Archived from sidebar hover action",
    )
      .then(() => {
        setThreadError(null);
        if (activeAgentIdRef.current === item.id) {
          setActiveAgentId(null);
        }
        void refreshAgentThreads();
      })
      .catch((e) => {
        setThreadError(`Unable to archive thread: ${String(e)}`);
      });
  }

  function handleArchiveAllThreads() {
    const archivableThreads = threadItems.filter((item) => item.threadId && item.archivable);
    if (archivableThreads.length === 0) {
      setThreadError(null);
      return;
    }

    void (async () => {
      try {
        for (const item of archivableThreads) {
          await archiveAgentThread(
            item.threadId ?? "",
            "desktop-user",
            "Archived from thread more menu",
          );
        }
        setThreadError(null);
        if (activeAgentIdRef.current && archivableThreads.some((item) => item.id === activeAgentIdRef.current)) {
          setActiveAgentId(null);
        }
        void refreshAgentThreads();
      } catch (e) {
        setThreadError(`Unable to archive all threads: ${String(e)}`);
      }
    })();
  }

  function handleAgentSelect(agentId: string) {
    setActiveAgentId(agentId);
    if (agentId.startsWith("thread:")) {
      void refreshAgentThreads();
    }
  }

  if (view === "settings") {
    return (
      <SettingsPage
        status={status}
        schedulerState={schedulerState}
        projects={queueProjects}
        queueItems={queueItems}
        isProjectsLoading={isProjectsLoading}
        projectError={projectError}
        notificationPreferences={notificationPrefs}
        permissionSoundEnabled={permissionSoundEnabled}
        notificationPermission={notificationPermission}
        themePreference={themePreference}
        brainSettings={brainSettings}
        settingsError={settingsError}
        lastNotification={lastNotification}
        launchAgentInfo={laAgentInfo}
        launchAgentAction={laAgentAction}
        harnessCapabilities={harnessCapabilities}
        directModelRuntimeContract={directModelRuntimeContract}
        onBack={() => setView("workspace")}
        onProjectsChanged={refreshProjects}
        onToggleNotification={toggleNotification}
        onTogglePermissionSound={() => setPermissionSoundEnabled((enabled) => !enabled)}
        onThemePreferenceChange={setThemePreference}
        onBrainSettingsChange={handleBrainSettingsChange}
        onRequestNotifications={requestNotifications}
        onStartAutomation={() => void startAutomation().then(() => handleSchedulerState("running"))}
        onPauseAutomation={() => void pauseAutomation().then(() => handleSchedulerState("paused"))}
        onRunImplementation={handleRunImplementation}
        onRunReview={handleRunReview}
        onLaunchAgentAction={handleLaunchAgentAction}
        onRefreshLaunchAgent={refreshLaunchAgent}
      />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#141414] font-sans text-zinc-100 antialiased">
      <Sidebar
        status={status}
        agents={agents}
        threads={threadItems}
        activeAgentId={activeAgent?.id ?? null}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
        onAgentSelect={handleAgentSelect}
        onArchiveThread={handleArchiveThread}
        onArchiveAllThreads={handleArchiveAllThreads}
        onOpenSettings={() => setView("settings")}
        sidebarOrganization={sidebarOrganization}
        onSidebarOrganizationChange={setSidebarOrganization}
        threadSort={threadSort}
        onThreadSortChange={setThreadSort}
      />
      <main className="relative flex h-screen min-w-0 flex-1 overflow-hidden bg-[#141414]">
        <ThreadIdentity
          agent={activeAgent}
          projectName={activeAgent?.projectName ?? "All projects"}
          thread={activeThread}
        />
        {activeAgent ? (
          <AgentThreadView
            agent={activeAgent}
            thread={activeThread}
            status={status}
            schedulerState={schedulerState}
            statusError={statusError}
            queueError={queueError ?? threadError}
            implResult={implResult}
            reviewResult={reviewResult}
            pendingApprovals={
              activeAgent.kind === "approval"
                ? pendingApprovalRequests
                : activeThread
                  ? pendingApprovalByQueueId.get(activeThread.queueItemId) ?? []
                  : activeAgent.queueItemId
                    ? pendingApprovalByQueueId.get(activeAgent.queueItemId) ?? []
                  : []
            }
            onOpenApprovals={() => setActiveAgentId("approvals")}
            onStartAutomation={() => void startAutomation().then(() => handleSchedulerState("running"))}
            onPauseAutomation={() => void pauseAutomation().then(() => handleSchedulerState("paused"))}
            onRunImplementation={handleRunImplementation}
            onRunReview={handleRunReview}
            harnessModel={brainSettings?.defaultReviewModel ?? "gpt-5-codex"}
          />
        ) : (
          <EmptyHome />
        )}
      </main>
    </div>
  );
}

function RunResultAlert({ label, result }: { label: string; result: { ok: boolean; text: string } }) {
  return (
    <Alert variant={result.ok ? "default" : "destructive"}>
      {result.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
      <AlertTitle>{label} run {result.ok ? "completed" : "failed"}</AlertTitle>
      <AlertDescription className="font-mono break-all">{result.text}</AlertDescription>
    </Alert>
  );
}

function EmptyHome() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrainLoopLogo size={72} className="shadow-[0_24px_80px_rgba(83,166,255,0.20)]" />
        <div>
          <h1 className="text-base font-semibold tracking-tight text-zinc-100">Brain Loop</h1>
        </div>
      </div>
    </div>
  );
}

function AgentThreadView({
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
          <h2 className="text-sm font-medium text-zinc-100">Thread not found for task</h2>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
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
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
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
                className="h-7 gap-1.5 px-2 text-[11px] text-zinc-400"
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
                  <div className="truncate text-xs font-medium text-zinc-200">{selectedTranscript.label}</div>
                  <div className="truncate text-[11px] text-zinc-500">{selectedTranscript.fileName}</div>
                </div>
              </div>
              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words p-3.5 font-mono text-[11px] leading-5 text-zinc-300">
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
                <div className="mb-2 rounded-sm bg-red-500/10 px-2.5 py-1.5 text-[11px] leading-4 text-red-100">
                  {harnessError}
                </div>
              )}
              <div className="flex items-end gap-2">
                <Textarea
                  value={harnessDraft}
                  onChange={(event) => setHarnessDraft(event.target.value)}
                  placeholder={hasCodexProviderSession ? "Message Codex" : "Start exact Codex thread"}
                  className="min-h-[46px] resize-none border-white/[0.08] bg-black/20 text-xs text-zinc-100 placeholder:text-zinc-600"
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

function ThreadIdentity({
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
        <h1 className="truncate text-[12px] font-medium leading-none text-zinc-100">{agent.name}</h1>
        <span className="size-1 rounded-full bg-zinc-700" aria-hidden="true" />
        <p className="truncate text-[11px] leading-none text-zinc-500">{projectName}</p>
      </div>
      <div className="shrink-0 rounded-full bg-white/[0.055] px-2 py-0.5 text-[11px] leading-none text-zinc-500">
        {thread?.status ?? agent.status}
      </div>
    </div>
  );
}

function ArtifactCard({ label, path }: { label: string; path: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.035] px-3.5 py-2.5">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
        <FileText className="size-3.5 shrink-0 text-zinc-500" />
        {label}
      </div>
      <div className="mt-1 break-all font-mono text-[11px] leading-4 text-zinc-500">{path}</div>
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
        <span className="block truncate text-xs font-medium">{label}</span>
        <span className="block truncate text-[11px] text-zinc-500">{runnerId ?? logFileNameFromPath(path) ?? path}</span>
      </span>
    </Button>
  );
}

function ThreadMessage({
  role,
  label,
  body,
  createdAt,
  exactProviderMessage,
  provider,
  model,
}: {
  role?: AgentThreadMessageRecord["role"];
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
          {createdAt && <span className="text-[11px] font-normal text-zinc-600">{formatCompactTimestamp(createdAt)}</span>}
          {exactProviderMessage && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-normal text-emerald-200">
              exact{provider ? ` · ${provider}` : ""}{model ? ` · ${model}` : ""}
            </span>
          )}
        </div>
        <div className={`mt-1 whitespace-pre-wrap rounded-md px-3.5 py-2.5 text-[12px] leading-5 ${bubbleClass}`}>
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
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

function formatCompactElapsed(timestamp: string | null | undefined) {
  if (!timestamp) {
    return undefined;
  }

  const startedAt = new Date(timestamp).getTime();
  if (!Number.isFinite(startedAt)) {
    return undefined;
  }

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - startedAt) / 60000));
  if (elapsedMinutes < 1) {
    return "now";
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h`;
  }

  return `${Math.floor(elapsedHours / 24)}d`;
}

function groupLabelForThread(
  organization: SidebarOrganization,
  projectName: string,
  workspaceLabel: string,
) {
  if (organization === "by-projects") {
    return projectName;
  }
  if (organization === "worktree") {
    return workspaceLabel;
  }
  return undefined;
}

function sortThreadNavItems(
  items: AgentNavItem[],
  organization: SidebarOrganization,
  sort: ThreadSort,
) {
  const dateField = sort === "createdAt" ? "createdAt" : "updatedAt";
  return [...items].sort((a, b) => {
    if (organization !== "chronological-list") {
      const groupComparison = (a.groupLabel ?? "").localeCompare(b.groupLabel ?? "");
      if (groupComparison !== 0) {
        return groupComparison;
      }
    }

    const bTime = new Date(b[dateField] ?? b.timeLabel ?? 0).getTime();
    const aTime = new Date(a[dateField] ?? a.timeLabel ?? 0).getTime();
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

function isTaskBackedThreadStatus(status: string | null | undefined) {
  return Boolean(status && taskBackedThreadStatuses.has(status));
}

function queueItemDisplayTimestamp(item: QueueItem) {
  return item.approvedAt
    ?? item.reviewedAt
    ?? item.submittedAt
    ?? item.blockedAt
    ?? item.agentStartedAt
    ?? item.pickedAt
    ?? item.createdAt;
}

function formatWorkspaceLabel(strategy: string | null | undefined) {
  if (!strategy) {
    return "workspace";
  }

  if (strategy === "main-checkout") {
    return "main checkout";
  }

  return strategy;
}

function formatQueueThreadTitle(item: QueueItem) {
  const candidates = [
    item.handoffPath,
    item.planPath,
    item.activeHandoffPath,
    item.id,
  ];

  for (const candidate of candidates) {
    const title = cleanThreadTitle(candidate, item.projectId);
    if (title) {
      return title;
    }
  }

  return item.id;
}

function cleanThreadTitle(value: string | null | undefined, projectId?: string) {
  if (!value) {
    return "";
  }

  const fileName = value.split(/[\\/]/).pop() ?? value;
  const withoutExtension = fileName.replace(/\.(md|json)$/i, "");
  const withoutDate = withoutExtension.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/^-+|-+$/g, "");
  const withoutProject = projectId && withoutDate.startsWith(`${projectId}-`)
    ? withoutDate.slice(projectId.length + 1)
    : withoutDate;
  const withoutSuffix = withoutProject
    .replace(/-handoff$/i, "")
    .replace(/-fix$/i, "");

  return withoutSuffix
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function logFileNameFromPath(path: string | null | undefined) {
  if (!path) {
    return null;
  }
  const fileName = path.split(/[\\/]/).pop();
  if (!fileName?.endsWith(".log")) {
    return null;
  }
  return fileName;
}
