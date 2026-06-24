import { useEffect, useRef, useState } from "react";
import {
  getBrainStatus,
  getLaunchAgentInfo,
  getSchedulerStatus,
  getSettings,
  installLaunchAgent,
  listAgentThreads,
  listDirectModelRuntimeContract,
  listHarnessCapabilities,
  listOrchestrations,
  listProjects,
  listQueue,
  loadLaunchAgent,
  onHarnessEvent,
  pauseAutomation,
  removeLaunchAgent,
  runImplementationOnce,
  runQueueItemOnce,
  runReviewOnce,
  startAutomation,
  unloadLaunchAgent,
  updateSettings,
} from "@brain-loop/desktop-client";
import type {
  AgentThread,
  BrainProject,
  BrainStatus,
  DirectModelRuntimeContract,
  HarnessProviderCapability,
  LaunchAgentInfo,
  OrchestrationThread,
  QueueItem,
  QueueListResponse,
  SchedulerStatus,
  Settings,
} from "@brain-loop/brain-core";
import type { AutomationNotification } from "@/lib/notifications";

const fallbackStatus: BrainStatus = {
  implementationStatus: "unknown",
  reviewStatus: "unknown",
  activeRuns: 0,
  queuedItems: 0,
  submittedItems: 0,
  blockedItems: 0,
};

export type LaunchAgentAction = "install" | "load" | "unload" | "remove";

interface UseBrainLoopDataOptions {
  emitNotification: (notification: AutomationNotification) => void;
  refreshApprovals: () => void;
}

export function useBrainLoopData({
  emitNotification,
  refreshApprovals,
}: UseBrainLoopDataOptions) {
  const [status, setStatus] = useState<BrainStatus>(fallbackStatus);
  const [schedulerState, setSchedulerState] = useState<string>("unknown");
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [implResult, setImplResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [reviewResult, setReviewResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [queueStartResult, setQueueStartResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [queueStartBusyId, setQueueStartBusyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [laAgentInfo, setLaAgentInfo] = useState<LaunchAgentInfo | null>(null);
  const [laAgentAction, setLaAgentAction] = useState<{ ok: boolean; text: string } | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [agentThreads, setAgentThreads] = useState<AgentThread[]>([]);
  const [orchestrations, setOrchestrations] = useState<OrchestrationThread[]>([]);
  const [queueProjects, setQueueProjects] = useState<BrainProject[]>([]);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [orchestrationError, setOrchestrationError] = useState<string | null>(null);
  const [harnessCapabilities, setHarnessCapabilities] = useState<HarnessProviderCapability[]>([]);
  const [directModelRuntimeContract, setDirectModelRuntimeContract] = useState<DirectModelRuntimeContract | null>(null);
  const [brainSettings, setBrainSettings] = useState<Settings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const lastStatusRef = useRef<BrainStatus | null>(null);
  const lastSchedulerRef = useRef<string | null>(null);
  const lastQueueErrorRef = useRef<string | null>(null);

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

  function handleSchedulerStatus(nextStatus: SchedulerStatus) {
    setSchedulerStatus(nextStatus);
    handleSchedulerState(nextStatus.state);
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

  function handleQueueResponse(response: QueueListResponse) {
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

  function refreshQueue() {
    void listQueue()
      .then(handleQueueResponse)
      .catch((e) => {
        const nextError = `Unable to load queue items: ${String(e)}`;
        lastQueueErrorRef.current = nextError;
        setQueueError(nextError);
        setIsQueueLoading(false);
      });
  }

  async function refreshAgentThreads() {
    try {
      const threads = await listAgentThreads();
      setAgentThreads(threads);
      setThreadError(null);
    } catch (e) {
      setAgentThreads([]);
      setThreadError(`Unable to load agent threads: ${String(e)}`);
    }
  }

  async function refreshOrchestrations() {
    try {
      const threads = await listOrchestrations();
      setOrchestrations(threads);
      setOrchestrationError(null);
    } catch (e) {
      setOrchestrations([]);
      setOrchestrationError(`Unable to load orchestrations: ${String(e)}`);
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
        .then(handleSchedulerStatus)
        .catch(() => handleSchedulerState("error"));
      refreshQueue();
      void refreshAgentThreads();
      void refreshOrchestrations();
      void refreshProjects();
    }, 2000);

    void getBrainStatus().then(handleBrainStatus).catch(() => { setStatus(fallbackStatus); setStatusError(true); setIsLoading(false); });
    void getSchedulerStatus().then(handleSchedulerStatus).catch(() => handleSchedulerState("error"));
    void getLaunchAgentInfo().then(setLaAgentInfo).catch(() => setLaAgentInfo(null));
    refreshQueue();
    void refreshAgentThreads();
    void refreshOrchestrations();
    void refreshProjects();
    void refreshSettings();
    refreshHarnessCapabilities();
    refreshDirectModelRuntimeContract();
    refreshApprovals();

    return () => clearInterval(poll);
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

  function handleRunQueueItem(queueItemId: string) {
    setQueueStartBusyId(queueItemId);
    void runQueueItemOnce(queueItemId)
      .then((text) => setQueueStartResult({ ok: true, text }))
      .catch((e) => setQueueStartResult({ ok: false, text: `Error: ${e}` }))
      .finally(() => {
        void getBrainStatus().then(handleBrainStatus).catch(() => setStatusError(true));
        void getSchedulerStatus().then(handleSchedulerStatus).catch(() => handleSchedulerState("error"));
        refreshQueue();
        void refreshAgentThreads();
        setQueueStartBusyId(null);
      });
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

  function handleBrainSettingsChange(nextSettings: Settings) {
    void updateSettings(nextSettings)
      .then((saved) => {
        setBrainSettings(saved);
        setSettingsError(null);
      })
      .catch((e) => setSettingsError(String(e)));
  }

  function startScheduler() {
    void startAutomation().then(() => handleSchedulerState("running"));
  }

  function pauseScheduler() {
    void pauseAutomation().then(() => handleSchedulerState("paused"));
  }

  return {
    status,
    schedulerState,
    schedulerStatus,
    statusError,
    implResult,
    reviewResult,
    queueStartResult,
    queueStartBusyId,
    isLoading,
    laAgentInfo,
    laAgentAction,
    queueItems,
    agentThreads,
    orchestrations,
    queueProjects,
    projectError,
    isProjectsLoading,
    isQueueLoading,
    queueError,
    threadError,
    orchestrationError,
    harnessCapabilities,
    directModelRuntimeContract,
    brainSettings,
    settingsError,
    handleBrainSettingsChange,
    handleLaunchAgentAction,
    handleRunImplementation,
    handleRunQueueItem,
    handleRunReview,
    pauseScheduler,
    refreshAgentThreads,
    refreshLaunchAgent,
    refreshOrchestrations,
    refreshProjects,
    refreshQueue,
    setOrchestrations,
    setProjectError,
    setThreadError,
    startScheduler,
  };
}
