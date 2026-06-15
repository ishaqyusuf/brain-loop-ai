import { useEffect, useRef, useState } from "react";
import { getBrainStatus, startAutomation, pauseAutomation, runImplementationOnce, runReviewOnce, getSchedulerStatus, getLaunchAgentInfo, installLaunchAgent, loadLaunchAgent, unloadLaunchAgent, removeLaunchAgent, listProjects, listQueue, onApprovalEvent } from "@brain-loop/desktop-client";
import type { BrainProject, BrainStatus, LaunchAgentInfo, QueueItem } from "@brain-loop/brain-core";
import { Sidebar } from "./components/sidebar";
import { ApprovalPanel } from "./components/approval-panel";
import { LogsPanel } from "./components/logs-panel";
import { TerminalPanel } from "./components/terminal-panel";
import { ProjectTable } from "./components/tables/projects/project-table";
import { QueueTable } from "./components/tables/queue/queue-table";
import {
  getNotificationPermission,
  loadNotificationPreferences,
  notifyAutomationEvent,
  requestNotificationPermission,
  saveNotificationPreferences,
  type AutomationNotification,
  type NotificationCategory,
  type NotificationPreferences,
} from "./lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";

const fallbackStatus: BrainStatus = {
  implementationStatus: "unknown",
  reviewStatus: "unknown",
  activeRuns: 0,
  queuedItems: 0,
  submittedItems: 0,
  blockedItems: 0,
};

export function App() {
  const [status, setStatus] = useState<BrainStatus>(fallbackStatus);
  const [schedulerState, setSchedulerState] = useState<string>("unknown");
  const [statusError, setStatusError] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [implResult, setImplResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [reviewResult, setReviewResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [laAgentInfo, setLaAgentInfo] = useState<LaunchAgentInfo | null>(null);
  const [laAgentAction, setLaAgentAction] = useState<{ ok: boolean; text: string } | null>(null);
  const [laAgentConfirm, setLaAgentConfirm] = useState<string | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueProjects, setQueueProjects] = useState<BrainProject[]>([]);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() => loadNotificationPreferences());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(() => getNotificationPermission());
  const [lastNotification, setLastNotification] = useState<{ title: string; body: string; result: string } | null>(null);
  const notificationPrefsRef = useRef(notificationPrefs);
  const lastStatusRef = useRef<BrainStatus | null>(null);
  const lastSchedulerRef = useRef<string | null>(null);
  const lastQueueErrorRef = useRef<string | null>(null);

  useEffect(() => {
    notificationPrefsRef.current = notificationPrefs;
    saveNotificationPreferences(notificationPrefs);
  }, [notificationPrefs]);

  function emitNotification(notification: AutomationNotification) {
    const result = notifyAutomationEvent(notification, notificationPrefsRef.current);
    if (result !== "disabled") {
      setLastNotification({ title: notification.title, body: notification.body, result });
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
    void refreshProjects();

    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    let unlisten: (() => void)[] = [];
    void onApprovalEvent((request) => {
      if (request.status === "pending") {
        emitNotification({
          category: "approval",
          title: "Approval needed",
          body: request.title,
          tag: `brain-loop-approval-${request.id}`,
        });
      }
    }).then((listeners) => {
      unlisten = listeners;
    });

    return () => {
      unlisten.forEach((stop) => stop());
    };
  }, []);

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans antialiased overflow-hidden">
      <Sidebar status={status} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="flex items-center justify-between px-8 py-6 border-b shrink-0">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Local automation</p>
            <h2 className="text-2xl font-semibold tracking-tight">Brain control center</h2>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={schedulerState === "running" ? "default" : "secondary"} className="h-6 px-2 text-xs">
              {schedulerState}
            </Badge>
            {schedulerState === "running" ? (
              <Button variant="outline" size="sm" onClick={() => void pauseAutomation()}>Pause</Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => void startAutomation()}>Start</Button>
            )}
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" onClick={() => void runImplementationOnce().then(t => setImplResult({ ok: true, text: t })).catch(e => setImplResult({ ok: false, text: `Error: ${e}` }))}>Run Implementation</Button>
            <Button variant="outline" size="sm" onClick={() => void runReviewOnce().then(t => setReviewResult({ ok: true, text: t })).catch(e => setReviewResult({ ok: false, text: `Error: ${e}` }))}>Run Review</Button>
            <Button variant={terminalOpen ? "secondary" : "outline"} size="sm" onClick={() => setTerminalOpen(!terminalOpen)}>
              Terminal
            </Button>
          </div>
        </header>

        {terminalOpen && (
          <div className="h-72 border-b bg-zinc-950 shrink-0">
            <TerminalPanel runId="manual-session" command="/bin/zsh" />
          </div>
        )}

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="queue">Queue</TabsTrigger>
                <TabsTrigger value="approvals">Approvals</TabsTrigger>
                <TabsTrigger value="logs">Run Logs</TabsTrigger>
                <TabsTrigger value="launchagent">LaunchAgent</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Status error alert */}
                {statusError && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Connection lost</AlertTitle>
                    <AlertDescription>
                      Unable to reach the Brain automation service. Check that the desktop app is running and the backend is reachable.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Manual run results */}
                {implResult && (
                  <Alert variant={implResult.ok ? "default" : "destructive"}>
                    {implResult.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                    <AlertTitle>Implementation run {implResult.ok ? "completed" : "failed"}</AlertTitle>
                    <AlertDescription className="font-mono break-all">{implResult.text}</AlertDescription>
                  </Alert>
                )}
                {reviewResult && (
                  <Alert variant={reviewResult.ok ? "default" : "destructive"}>
                    {reviewResult.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                    <AlertTitle>Review run {reviewResult.ok ? "completed" : "failed"}</AlertTitle>
                    <AlertDescription className="font-mono break-all">{reviewResult.text}</AlertDescription>
                  </Alert>
                )}

                {/* Scheduler state warning */}
                {schedulerState === "error" && !statusError && (
                  <Alert>
                    <Info className="size-4" />
                    <AlertTitle>Scheduler unavailable</AlertTitle>
                    <AlertDescription>
                      Scheduler status could not be determined. Automation controls are still available.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!isLoading && !statusError && status.activeRuns === 0 && status.queuedItems === 0 && status.submittedItems === 0 && status.blockedItems === 0 && (
                  <Alert>
                    <Info className="size-4" />
                    <AlertTitle>No activity yet</AlertTitle>
                    <AlertDescription>
                      The Brain is idle. Start automation or run a manual implementation/review to begin processing queue items.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Status cards */}
                {!isLoading && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatusCard title="Implementation" value={status.implementationStatus} />
                    <StatusCard title="Review" value={status.reviewStatus} />
                    <StatusCard title="Active runs" value={status.activeRuns.toString()} />
                    <StatusCard title="Queued" value={status.queuedItems.toString()} />
                    <StatusCard title="Submitted" value={status.submittedItems.toString()} />
                    <StatusCard title="Blocked" value={status.blockedItems.toString()} />
                  </div>
                )}

                <NotificationPreferencesCard
                  preferences={notificationPrefs}
                  permission={notificationPermission}
                  lastNotification={lastNotification}
                  onToggle={(category) =>
                    setNotificationPrefs((current) => ({
                      ...current,
                      [category]: !current[category],
                    }))
                  }
                  onEnable={() => {
                    void requestNotificationPermission().then((permission) => setNotificationPermission(permission));
                  }}
                />
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                <ProjectTable
                  projects={queueProjects}
                  queueItems={queueItems}
                  isLoading={isProjectsLoading}
                  error={projectError}
                  onChanged={refreshProjects}
                />
              </TabsContent>

              <TabsContent value="queue" className="space-y-6">
                <QueueTable items={queueItems} projects={queueProjects} isLoading={isQueueLoading} error={queueError} />
              </TabsContent>

              <TabsContent value="approvals" className="space-y-6">
                <ApprovalPanel />
              </TabsContent>

              <TabsContent value="logs" className="h-[600px] border rounded-md overflow-hidden bg-background">
                <LogsPanel />
              </TabsContent>

              <TabsContent value="launchagent" className="space-y-6">
                {/* Confirmation gate */}
                {laAgentConfirm && (
                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertTitle>
                      {laAgentConfirm === "install" ? "Install LaunchAgent plist?" : laAgentConfirm === "load" ? "Load LaunchAgent?" : laAgentConfirm === "unload" ? "Unload LaunchAgent?" : "Remove LaunchAgent plist?"}
                    </AlertTitle>
                    <AlertDescription className="flex items-center gap-2 pt-2">
                      <Button size="sm" onClick={() => {
                        const action = laAgentConfirm;
                        setLaAgentConfirm(null);
                        const fn = action === "install" ? installLaunchAgent : action === "load" ? loadLaunchAgent : action === "unload" ? unloadLaunchAgent : removeLaunchAgent;
                        void fn().then(r => { setLaAgentAction({ ok: true, text: r }); void getLaunchAgentInfo().then(setLaAgentInfo).catch(() => setLaAgentInfo(null)); }).catch(e => setLaAgentAction({ ok: false, text: String(e) }));
                      }}>
                        Confirm
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setLaAgentConfirm(null)}>
                        Cancel
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert variant="default">
                  <Info className="size-4" />
                  <AlertTitle>LaunchAgent helper is deferred to v2</AlertTitle>
                  <AlertDescription>
                    The v1 desktop app relies on tray-icon persistence for background automation. Install, load, unload, and remove operations are available below for testing.
                  </AlertDescription>
                </Alert>

                {laAgentInfo ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Helper Status
                        <Badge variant={laAgentInfo.status === "loaded" ? "default" : laAgentInfo.status === "installed" ? "secondary" : laAgentInfo.status === "error" ? "destructive" : "outline"}>
                          {laAgentInfo.statusLabel}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Plist path: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{laAgentInfo.plistPath}</code></p>
                        <p>{laAgentInfo.message}</p>
                      </div>

                      {laAgentAction && (
                        <Alert variant={laAgentAction.ok ? "default" : "destructive"}>
                          {laAgentAction.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                          <AlertTitle>Operation {laAgentAction.ok ? "completed" : "failed"}</AlertTitle>
                          <AlertDescription className="font-mono break-all">{laAgentAction.text}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {laAgentInfo.status === "not_installed" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setLaAgentConfirm("install")}
                          >
                            Install Plist
                          </Button>
                        )}
                        {laAgentInfo.status === "installed" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setLaAgentConfirm("load")}
                          >
                            Load Agent
                          </Button>
                        )}
                        {laAgentInfo.status === "loaded" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLaAgentConfirm("unload")}
                          >
                            Unload
                          </Button>
                        )}
                        {laAgentInfo.status !== "not_installed" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setLaAgentConfirm("remove")}
                          >
                            Remove Plist
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { void getLaunchAgentInfo().then(setLaAgentInfo).catch(() => setLaAgentInfo(null)); setLaAgentAction(null); }}
                        >
                          Refresh Status
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertTitle>LaunchAgent unavailable</AlertTitle>
                    <AlertDescription>
                      Could not read LaunchAgent status. The backend may not support this feature or cargo is not installed.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="p-4 pb-2 space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function NotificationPreferencesCard({
  preferences,
  permission,
  lastNotification,
  onToggle,
  onEnable,
}: {
  preferences: NotificationPreferences;
  permission: NotificationPermission | "unsupported";
  lastNotification: { title: string; body: string; result: string } | null;
  onToggle: (category: NotificationCategory) => void;
  onEnable: () => void;
}) {
  const categories: Array<{ id: NotificationCategory; label: string }> = [
    { id: "blocked", label: "Blocked" },
    { id: "submitted", label: "Submitted" },
    { id: "approval", label: "Approvals" },
    { id: "scheduler", label: "Scheduler" },
  ];

  return (
    <Card className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center justify-between gap-3 text-sm">
          Notifications
          <Badge variant={permission === "granted" ? "default" : permission === "denied" ? "destructive" : "secondary"}>
            {permission}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {permission === "default" && (
            <Button size="sm" onClick={onEnable}>
              Enable
            </Button>
          )}
          {categories.map((category) => (
            <Button
              key={category.id}
              size="sm"
              variant={preferences[category.id] ? "default" : "outline"}
              onClick={() => onToggle(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>
        {lastNotification && (
          <Alert>
            <Info className="size-4" />
            <AlertTitle>{lastNotification.title}</AlertTitle>
            <AlertDescription>
              {lastNotification.body} ({lastNotification.result})
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
