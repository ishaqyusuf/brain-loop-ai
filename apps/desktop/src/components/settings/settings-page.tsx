import { useMemo, useState, type ReactNode } from "react";
import type {
  BrainProject,
  BrainStatus,
  DirectModelRuntimeContract,
  HarnessProviderCapability,
  LaunchAgentInfo,
  ProjectAgent,
  QueueItem,
  Settings as BrainSettings,
} from "@brain-loop/brain-core";
import {
  ArrowLeft,
  Bell,
  Bot,
  CheckCircle2,
  Code2,
  FolderKanban,
  GitBranch,
  Globe,
  Info,
  Play,
  Search,
  Settings,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { ApprovalPanel } from "@/components/approval-panel";
import { ProjectTable } from "@/components/tables/projects/project-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  NotificationCategory,
  NotificationPreferences,
} from "@/lib/notifications";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

type SettingsCategory =
  | "general"
  | "projects"
  | "agents"
  | "automation"
  | "threads"
  | "permissions"
  | "integrations"
  | "environment"
  | "release";

type LaunchAgentAction = "install" | "load" | "unload" | "remove";

interface SettingsPageProps {
  status: BrainStatus;
  schedulerState: string;
  projects: BrainProject[];
  queueItems: QueueItem[];
  isProjectsLoading: boolean;
  projectError: string | null;
  notificationPreferences: NotificationPreferences;
  permissionSoundEnabled: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  themePreference: ThemePreference;
  brainSettings: BrainSettings | null;
  settingsError: string | null;
  lastNotification: { title: string; body: string; result: string } | null;
  launchAgentInfo: LaunchAgentInfo | null;
  launchAgentAction: { ok: boolean; text: string } | null;
  harnessCapabilities: HarnessProviderCapability[];
  directModelRuntimeContract: DirectModelRuntimeContract | null;
  onBack: () => void;
  onProjectsChanged: () => void;
  onToggleNotification: (category: NotificationCategory) => void;
  onTogglePermissionSound: () => void;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  onBrainSettingsChange: (settings: BrainSettings) => void;
  onRequestNotifications: () => void;
  onStartAutomation: () => void;
  onPauseAutomation: () => void;
  onRunImplementation: () => void;
  onRunReview: () => void;
  onLaunchAgentAction: (action: LaunchAgentAction) => void;
  onRefreshLaunchAgent: () => void;
}

const categories: Array<{
  id: SettingsCategory;
  group: "Personal" | "Automation" | "Integrations" | "Coding" | "Release";
  label: string;
  icon: typeof Settings;
}> = [
  { id: "general", group: "Personal", label: "General", icon: Settings },
  {
    id: "projects",
    group: "Automation",
    label: "Projects",
    icon: FolderKanban,
  },
  { id: "agents", group: "Automation", label: "Agents", icon: Bot },
  { id: "automation", group: "Automation", label: "Automation", icon: Timer },
  { id: "threads", group: "Coding", label: "Threads & Worktrees", icon: Code2 },
  {
    id: "permissions",
    group: "Coding",
    label: "Permissions & Approvals",
    icon: ShieldCheck,
  },
  {
    id: "integrations",
    group: "Integrations",
    label: "Integrations",
    icon: Globe,
  },
  {
    id: "environment",
    group: "Coding",
    label: "Git & Environment",
    icon: GitBranch,
  },
  {
    id: "release",
    group: "Release",
    label: "Release Readiness",
    icon: CheckCircle2,
  },
];

const notificationLabels: Array<{ id: NotificationCategory; label: string }> = [
  { id: "blocked", label: "Blocked items" },
  { id: "submitted", label: "Submitted work" },
  { id: "approval", label: "Approval requests" },
  { id: "scheduler", label: "Scheduler warnings" },
];

export function SettingsPage({
  status,
  schedulerState,
  projects,
  queueItems,
  isProjectsLoading,
  projectError,
  notificationPreferences,
  permissionSoundEnabled,
  notificationPermission,
  themePreference,
  brainSettings,
  settingsError,
  lastNotification,
  launchAgentInfo,
  launchAgentAction,
  harnessCapabilities,
  directModelRuntimeContract,
  onBack,
  onProjectsChanged,
  onToggleNotification,
  onTogglePermissionSound,
  onThemePreferenceChange,
  onBrainSettingsChange,
  onRequestNotifications,
  onStartAutomation,
  onPauseAutomation,
  onRunImplementation,
  onRunReview,
  onLaunchAgentAction,
  onRefreshLaunchAgent,
}: SettingsPageProps) {
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>("general");
  const [query, setQuery] = useState("");
  const [workMode, setWorkMode] = useState("coding");
  const [openDestination, setOpenDestination] = useState("vscode");
  const [language, setLanguage] = useState("auto");
  const [confirmAction, setConfirmAction] = useState<LaunchAgentAction | null>(
    null,
  );

  const visibleCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return categories;
    }
    return categories.filter((category) =>
      `${category.group} ${category.label}`.toLowerCase().includes(normalized),
    );
  }, [query]);

  const active =
    categories.find((category) => category.id === activeCategory) ??
    categories[0];
  const enabledRunners =
    brainSettings?.runnerCatalog.filter((runner) => runner.enabled) ?? [];

  function updateCatalogEntry(
    runnerId: ProjectAgent,
    patch: Partial<BrainSettings["runnerCatalog"][number]>,
  ) {
    if (!brainSettings) {
      return;
    }
    onBrainSettingsChange({
      ...brainSettings,
      runnerCatalog: brainSettings.runnerCatalog.map((runner) =>
        runner.id === runnerId ? { ...runner, ...patch } : runner,
      ),
    });
  }

  function setRoleRunner(
    role: "implementation" | "review",
    runnerId: ProjectAgent,
  ) {
    if (!brainSettings) {
      return;
    }
    const runner = brainSettings.runnerCatalog.find(
      (entry) => entry.id === runnerId,
    );
    if (!runner || !runner.enabled) {
      return;
    }
    const model = runner.models.includes(runner.defaultModel)
      ? runner.defaultModel
      : runner.models[0];
    onBrainSettingsChange(
      role === "implementation"
        ? {
            ...brainSettings,
            defaultImplementationRunner: runnerId,
            defaultImplementationModel: model,
          }
        : {
            ...brainSettings,
            defaultReviewRunner: runnerId,
            defaultReviewModel: model,
          },
    );
  }

  function setRoleModel(role: "implementation" | "review", model: string) {
    if (!brainSettings) {
      return;
    }
    onBrainSettingsChange(
      role === "implementation"
        ? { ...brainSettings, defaultImplementationModel: model }
        : { ...brainSettings, defaultReviewModel: model },
    );
  }

  function updateRunnerModels(runnerId: ProjectAgent, rawModels: string) {
    if (!brainSettings) {
      return;
    }
    const models = rawModels
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean);
    const runner = brainSettings.runnerCatalog.find(
      (entry) => entry.id === runnerId,
    );
    if (!runner || models.length === 0) {
      return;
    }
    const defaultModel = models.includes(runner.defaultModel)
      ? runner.defaultModel
      : models[0];
    const nextSettings: BrainSettings = {
      ...brainSettings,
      runnerCatalog: brainSettings.runnerCatalog.map((entry) =>
        entry.id === runnerId ? { ...entry, models, defaultModel } : entry,
      ),
    };
    if (
      nextSettings.defaultImplementationRunner === runnerId &&
      !models.includes(nextSettings.defaultImplementationModel)
    ) {
      nextSettings.defaultImplementationModel = defaultModel;
    }
    if (
      nextSettings.defaultReviewRunner === runnerId &&
      !models.includes(nextSettings.defaultReviewModel)
    ) {
      nextSettings.defaultReviewModel = defaultModel;
    }
    onBrainSettingsChange(nextSettings);
  }

  function updateMaxLoopPolicy(policy: BrainSettings["maxLoopPolicy"]) {
    if (!brainSettings) {
      return;
    }
    onBrainSettingsChange({ ...brainSettings, maxLoopPolicy: policy });
  }

  function setMaxLoopGlobal(value: number) {
    if (!brainSettings || value < 1) {
      return;
    }
    updateMaxLoopPolicy({ ...brainSettings.maxLoopPolicy, globalMax: value });
  }

  function setRunnerCap(runnerId: ProjectAgent, value: number) {
    if (!brainSettings || value < 1) {
      return;
    }
    updateMaxLoopPolicy({
      ...brainSettings.maxLoopPolicy,
      runnerCaps: {
        ...brainSettings.maxLoopPolicy.runnerCaps,
        [runnerId]: value,
      },
    });
  }

  function setProjectCap(projectId: string, value: number) {
    if (!brainSettings || value < 1) {
      return;
    }
    updateMaxLoopPolicy({
      ...brainSettings.maxLoopPolicy,
      projectCaps: {
        ...brainSettings.maxLoopPolicy.projectCaps,
        [projectId]: value,
      },
    });
  }

  function setRunnerProjectCap(
    projectId: string,
    runnerId: ProjectAgent,
    value: number,
  ) {
    if (!brainSettings || value < 1) {
      return;
    }
    updateMaxLoopPolicy({
      ...brainSettings.maxLoopPolicy,
      runnerProjectCaps: {
        ...brainSettings.maxLoopPolicy.runnerProjectCaps,
        [projectId]: {
          ...(brainSettings.maxLoopPolicy.runnerProjectCaps[projectId] ?? {}),
          [runnerId]: value,
        },
      },
    });
  }

  function setSchedulingPolicy(policy: BrainSettings["schedulingPolicy"]) {
    if (!brainSettings) {
      return;
    }
    onBrainSettingsChange({ ...brainSettings, schedulingPolicy: policy });
  }

  function setCapacityPollIntervalSeconds(value: number) {
    if (!brainSettings || value < 1 || value > 60) {
      return;
    }
    onBrainSettingsChange({
      ...brainSettings,
      capacityPollIntervalSeconds: value,
    });
  }

  function setMaxImplementationAgents(value: number) {
    if (!brainSettings || value < 1) {
      return;
    }
    onBrainSettingsChange({
      ...brainSettings,
      maxImplementationAgents: value,
      maxRunningProcesses: value,
    });
  }

  function setMaxReviewAgents(value: number) {
    if (!brainSettings || value < 1) {
      return;
    }
    onBrainSettingsChange({ ...brainSettings, maxReviewAgents: value });
  }

  function setThreadStorageRoot(value: string) {
    if (!brainSettings || !value.trim()) {
      return;
    }
    onBrainSettingsChange({
      ...brainSettings,
      threadStorageRoot: value.trim(),
    });
  }

  function setWorktreeStorageRoot(value: string) {
    if (!brainSettings || !value.trim()) {
      return;
    }
    onBrainSettingsChange({
      ...brainSettings,
      worktreeStorageRoot: value.trim(),
    });
  }

  function setExecutionStrategy(strategy: BrainSettings["executionStrategy"]) {
    if (!brainSettings) {
      return;
    }
    onBrainSettingsChange({ ...brainSettings, executionStrategy: strategy });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#141414] text-zinc-100">
      <aside className="flex h-screen w-[286px] shrink-0 flex-col border-r border-white/10 bg-[#202020] px-3 py-3">
        <div data-tauri-drag-region className="h-10 shrink-0 px-2" aria-hidden="true" />
        <Button
          variant="ghost"
          type="button"
          onClick={onBack}
          className="mt-3 h-auto w-fit gap-2 rounded-md border-0 bg-transparent px-2 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" />
          Back to app
        </Button>
        <div className="relative mt-4">
          <Label htmlFor="settings-search" className="sr-only">
            Search settings
          </Label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            id="settings-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search settings..."
            className="h-8 border-white/10 bg-white/[0.05] pl-8 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {["Personal", "Automation", "Integrations", "Coding", "Release"].map(
            (group) => {
              const groupItems = visibleCategories.filter(
                (category) => category.group === group,
              );
              if (groupItems.length === 0) {
                return null;
              }
              return (
                <div key={group} className="mb-4">
                  <div className="px-2 pb-1 text-[11px] font-medium text-zinc-500">
                    {group}
                  </div>
                  <div className="space-y-1">
                    {groupItems.map((category) => (
                      <Button
                        variant="ghost"
                        type="button"
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={cn(
                          "h-auto w-full justify-start gap-2.5 rounded-md border-0 bg-transparent px-2.5 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-50",
                          activeCategory === category.id &&
                            "bg-white/10 text-zinc-50",
                        )}
                      >
                        <category.icon className="size-3.5" />
                        {category.label}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </aside>

      <main className="relative min-w-0 flex-1 overflow-y-auto">
        <div
          data-tauri-drag-region
          className="absolute inset-x-0 top-0 z-20 h-10 bg-[#141414]/80"
          aria-hidden="true"
        />
        <div className="mx-auto w-full max-w-[940px] px-8 pb-10 pt-14">
          <h1 className="text-lg font-semibold tracking-tight">
            {active.label}
          </h1>
          <div className="mt-8">{renderCategory()}</div>
        </div>
      </main>
    </div>
  );

  function renderCategory() {
    switch (activeCategory) {
      case "general":
        return (
          <div className="space-y-8">
            <SettingsSection
              title="Work mode"
              description="Choose how much technical detail Brain Loop shows"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ModeCard
                  active={workMode === "coding"}
                  icon={Code2}
                  title="For coding"
                  description="More technical responses and automation control"
                  onClick={() => setWorkMode("coding")}
                />
                <ModeCard
                  active={workMode === "daily"}
                  icon={Bot}
                  title="For everyday work"
                  description="Same queue power, less technical detail"
                  onClick={() => setWorkMode("daily")}
                />
              </div>
            </SettingsSection>

            <SettingsSection title="Notifications">
              <SettingsGroup>
                <SettingRow
                  title="Desktop notifications"
                  description="Use the WebView notification API when permission is granted."
                  action={
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          notificationPermission === "granted"
                            ? "default"
                            : notificationPermission === "denied"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {notificationPermission}
                      </Badge>
                      {notificationPermission === "default" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={onRequestNotifications}
                        >
                          Enable
                        </Button>
                      )}
                    </div>
                  }
                />
                {notificationLabels.map((notification) => (
                  <SettingRow
                    key={notification.id}
                    title={notification.label}
                    description="Notify only when this state changes."
                    action={
                      <ToggleButton
                        active={notificationPreferences[notification.id]}
                        onClick={() => onToggleNotification(notification.id)}
                      />
                    }
                  />
                ))}
                {lastNotification && (
                  <SettingRow
                    title={lastNotification.title}
                    description={`${lastNotification.body} (${lastNotification.result})`}
                    action={<Bell className="size-4 text-zinc-400" />}
                  />
                )}
              </SettingsGroup>
            </SettingsSection>

            <SettingsSection title="General">
              <SettingsGroup>
                <SettingRow
                  title="Default open destination"
                  description="Where files and folders open by default."
                  action={
                    <Select
                      value={openDestination}
                      onValueChange={setOpenDestination}
                    >
                      <SelectTrigger className="w-48 bg-white/[0.06]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vscode">VS Code</SelectItem>
                        <SelectItem value="finder">Finder</SelectItem>
                        <SelectItem value="terminal">Terminal</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
                <SettingRow
                  title="Language"
                  description="Language for the app UI."
                  action={
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-48 bg-white/[0.06]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto Detect</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
                <SettingRow
                  title="Theme"
                  description="Control the shadcn color mode used by the desktop shell."
                  action={
                    <Select
                      value={themePreference}
                      onValueChange={(value) =>
                        onThemePreferenceChange(value as ThemePreference)
                      }
                    >
                      <SelectTrigger className="w-48 bg-white/[0.06]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
                <SettingRow
                  title="Show in menu bar"
                  description="Keep Brain Loop accessible while the app window is closed."
                  action={<ToggleButton active />}
                />
              </SettingsGroup>
            </SettingsSection>
          </div>
        );
      case "projects":
        return (
          <SettingsSection
            title="Registered projects"
            description="Manage Brain project roots, defaults, and enabled state."
          >
            <ProjectTable
              projects={projects}
              queueItems={queueItems}
              isLoading={isProjectsLoading}
              error={projectError}
              onChanged={onProjectsChanged}
            />
          </SettingsSection>
        );
      case "agents":
        return (
          <div className="space-y-8">
            <SettingsSection
              title="Agent defaults"
              description="Choose the runner and model used when Brain Loop needs a default implementation or review target."
            >
              <SettingsGroup>
                {settingsError && (
                  <SettingRow
                    title="Settings save failed"
                    description={settingsError}
                    action={<Badge variant="destructive">Error</Badge>}
                  />
                )}
                <SettingRow
                  title="Default implementation runner"
                  description="Used for new implementation work when a project or queue item does not override the runner."
                  action={
                    brainSettings ? (
                      <Select
                        value={brainSettings.defaultImplementationRunner}
                        onValueChange={(value) =>
                          setRoleRunner("implementation", value as ProjectAgent)
                        }
                      >
                        <SelectTrigger className="w-48 bg-white/[0.06]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {brainSettings.runnerCatalog.map((runner) => (
                            <SelectItem
                              key={runner.id}
                              value={runner.id}
                              disabled={!runner.enabled}
                            >
                              {runner.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">Loading</Badge>
                    )
                  }
                />
                <SettingRow
                  title="Default implementation model"
                  description="Model passed to the selected implementation runner when it launches."
                  action={
                    brainSettings ? (
                      <ModelSelect
                        value={brainSettings.defaultImplementationModel}
                        models={
                          brainSettings.runnerCatalog.find(
                            (runner) =>
                              runner.id ===
                              brainSettings.defaultImplementationRunner,
                          )?.models ?? []
                        }
                        onChange={(model) =>
                          setRoleModel("implementation", model)
                        }
                      />
                    ) : (
                      <Badge variant="secondary">Loading</Badge>
                    )
                  }
                />
                <SettingRow
                  title="Default review runner"
                  description="Review dispatch uses this runner and the same task worktree as implementation."
                  action={
                    brainSettings ? (
                      <Select
                        value={brainSettings.defaultReviewRunner}
                        onValueChange={(value) =>
                          setRoleRunner("review", value as ProjectAgent)
                        }
                      >
                        <SelectTrigger className="w-48 bg-white/[0.06]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {brainSettings.runnerCatalog.map((runner) => (
                            <SelectItem
                              key={runner.id}
                              value={runner.id}
                              disabled={!runner.enabled}
                            >
                              {runner.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">Loading</Badge>
                    )
                  }
                />
                <SettingRow
                  title="Default review model"
                  description="Model passed to the selected review runner when review dispatch starts."
                  action={
                    brainSettings ? (
                      <ModelSelect
                        value={brainSettings.defaultReviewModel}
                        models={
                          brainSettings.runnerCatalog.find(
                            (runner) =>
                              runner.id === brainSettings.defaultReviewRunner,
                          )?.models ?? []
                        }
                        onChange={(model) => setRoleModel("review", model)}
                      />
                    ) : (
                      <Badge variant="secondary">Loading</Badge>
                    )
                  }
                />
              </SettingsGroup>
            </SettingsSection>

            <SettingsSection
              title="Runner catalog"
              description="Enabled runners can be selected as role defaults. Model lists are comma-separated and user-defined."
            >
              <SettingsGroup>
                {brainSettings ? (
                  brainSettings.runnerCatalog.map((runner) => {
                    const usedAsDefault =
                      runner.id === brainSettings.defaultImplementationRunner ||
                      runner.id === brainSettings.defaultReviewRunner;
                    return (
                      <RunnerCatalogRow
                        key={runner.id}
                        runner={runner}
                        usedAsDefault={usedAsDefault}
                        onToggle={() =>
                          updateCatalogEntry(runner.id, {
                            enabled: !runner.enabled,
                          })
                        }
                        onDefaultModelChange={(model) =>
                          updateCatalogEntry(runner.id, { defaultModel: model })
                        }
                        onModelsChange={(models) =>
                          updateRunnerModels(runner.id, models)
                        }
                      />
                    );
                  })
                ) : (
                  <SettingRow
                    title="Runner catalog"
                    description="Loading settings from the Brain project manager state root."
                    action={<Badge variant="secondary">Loading</Badge>}
                  />
                )}
                {brainSettings && enabledRunners.length === 0 && (
                  <SettingRow
                    title="No enabled runners"
                    description="At least one runner must stay enabled before settings can be saved."
                    action={<Badge variant="destructive">Invalid</Badge>}
                  />
                )}
              </SettingsGroup>
            </SettingsSection>

            <SettingsSection
              title="Harness message capture"
              description="Shows which runners can provide exact structured model messages versus transcript-only audit output."
            >
              <SettingsGroup>
                {harnessCapabilities.length > 0 ? (
                  harnessCapabilities.map((capability) => {
                    const directContractSummary =
                      capability.provider.startsWith("direct-") &&
                      directModelRuntimeContract
                        ? ` Contract: ${directModelRuntimeContract.tools.length} tools, ${directModelRuntimeContract.eventKinds.length} events, ${directModelRuntimeContract.requestShapes.length} request shapes.`
                        : "";
                    return (
                      <SettingRow
                        key={capability.provider}
                        title={capability.label}
                        description={`${capability.details}${directContractSummary}`}
                        action={
                          <Badge
                            variant={
                              capability.mode === "structured-provider-events"
                                ? "default"
                                : capability.mode === "transcript-only"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {capability.exactMessages ? "Exact messages" : capability.mode}
                          </Badge>
                        }
                      />
                    );
                  })
                ) : (
                  <SettingRow
                    title="Harness capabilities"
                    description="Capability metadata is unavailable."
                    action={<Badge variant="secondary">Unknown</Badge>}
                  />
                )}
              </SettingsGroup>
            </SettingsSection>
          </div>
        );
      case "automation":
        return (
          <div className="space-y-10">
            <SettingsSection title="Scheduler">
              <SettingsGroup>
                <SettingRow
                  title="Scheduler state"
                  description="Manual automation ticks only run when scheduler is running."
                  action={
                    <Badge
                      variant={
                        schedulerState === "running" ? "default" : "secondary"
                      }
                    >
                      {schedulerState}
                    </Badge>
                  }
                />
                <SettingRow
                  title="Start or pause automation"
                  description="Control whether implementation and review ticks are allowed."
                  action={
                    schedulerState === "running" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={onPauseAutomation}
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={onStartAutomation}
                      >
                        Start
                      </Button>
                    )
                  }
                />
                <SettingRow
                  title="Capacity poll interval"
                  description="How often the running automation loop checks for open agent slots and waiting queue work."
                  action={
                    brainSettings ? (
                      <NumberSetting
                        value={brainSettings.capacityPollIntervalSeconds}
                        min={1}
                        max={60}
                        onChange={setCapacityPollIntervalSeconds}
                      />
                    ) : (
                      <Badge variant="secondary">Loading</Badge>
                    )
                  }
                />
                <SettingRow
                  title="Maximum implementation agents"
                  description="Maximum implementation agents the capacity loop may run at once, before MaxLoop caps are applied."
                  action={
                    brainSettings ? (
                      <NumberSetting
                        value={
                          brainSettings.maxImplementationAgents ??
                          brainSettings.maxRunningProcesses
                        }
                        min={1}
                        onChange={setMaxImplementationAgents}
                      />
                    ) : (
                      <Badge variant="secondary">Loading</Badge>
                    )
                  }
                />
                <SettingRow
                  title="Maximum review agents"
                  description="Maximum review agents the review pool may run at once."
                  action={
                    brainSettings ? (
                      <NumberSetting
                        value={brainSettings.maxReviewAgents ?? 1}
                        min={1}
                        onChange={setMaxReviewAgents}
                      />
                    ) : (
                      <Badge variant="secondary">Loading</Badge>
                    )
                  }
                />
                <SettingRow
                  title="Run one implementation tick"
                  description={`${status.queuedItems} queued item${status.queuedItems === 1 ? "" : "s"} visible.`}
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={onRunImplementation}
                    >
                      Run
                    </Button>
                  }
                />
                <SettingRow
                  title="Run one review tick"
                  description={`${status.submittedItems} submitted item${status.submittedItems === 1 ? "" : "s"} visible.`}
                  action={
                    <Button size="sm" variant="secondary" onClick={onRunReview}>
                      Run
                    </Button>
                  }
                />
              </SettingsGroup>
            </SettingsSection>
            <SettingsSection title="Scheduling policy">
              <SettingsGroup>
                <SettingRow
                  title="MaxLoop global cap"
                  description="Hard ceiling for implementation agents. Runner, project, and runner-project caps are also enforced when configured."
                  action={
                    brainSettings ? (
                      <NumberSetting
                        value={brainSettings.maxLoopPolicy.globalMax}
                        min={1}
                        onChange={setMaxLoopGlobal}
                      />
                    ) : (
                      <Badge variant="secondary">Loading</Badge>
                    )
                  }
                />
                {brainSettings?.runnerCatalog.map((runner) => (
                  <SettingRow
                    key={`runner-cap-${runner.id}`}
                    title={`${runner.label} runner cap`}
                    description={`Maximum active implementation agents using ${runner.label}.`}
                    action={
                      <NumberSetting
                        value={
                          brainSettings.maxLoopPolicy.runnerCaps[runner.id] ??
                          brainSettings.maxLoopPolicy.globalMax
                        }
                        min={1}
                        onChange={(value) => setRunnerCap(runner.id, value)}
                      />
                    }
                  />
                ))}
                {projects.map((project) => (
                  <SettingRow
                    key={`project-cap-${project.id}`}
                    title={`${project.name} project cap`}
                    description="Maximum active implementation agents for this project."
                    action={
                      brainSettings ? (
                        <NumberSetting
                          value={
                            brainSettings.maxLoopPolicy.projectCaps[
                              project.id
                            ] ?? brainSettings.maxLoopPolicy.globalMax
                          }
                          min={1}
                          onChange={(value) => setProjectCap(project.id, value)}
                        />
                      ) : (
                        <Badge variant="secondary">Loading</Badge>
                      )
                    }
                  />
                ))}
                {brainSettings &&
                  projects.map((project) => (
                    <SettingRow
                      key={`runner-project-cap-${project.id}-${brainSettings.defaultImplementationRunner}`}
                      title={`${project.name} ${brainSettings.defaultImplementationRunner} cap`}
                      description="Most specific cap for the default implementation runner in this project."
                      action={
                        <NumberSetting
                          value={
                            brainSettings.maxLoopPolicy.runnerProjectCaps[
                              project.id
                            ]?.[brainSettings.defaultImplementationRunner] ??
                            brainSettings.maxLoopPolicy.projectCaps[
                              project.id
                            ] ??
                            brainSettings.maxLoopPolicy.runnerCaps[
                              brainSettings.defaultImplementationRunner
                            ] ??
                            brainSettings.maxLoopPolicy.globalMax
                          }
                          min={1}
                          onChange={(value) =>
                            setRunnerProjectCap(
                              project.id,
                              brainSettings.defaultImplementationRunner,
                              value,
                            )
                          }
                        />
                      }
                    />
                  ))}
                <SettingRow
                  title="Queue selection policy"
                  description="Choose whether reviewed fix requests jump ahead of new queued work, or whether all implementation work follows FIFO order."
                  action={
                    brainSettings ? (
                      <Select
                        value={brainSettings.schedulingPolicy}
                        onValueChange={(value) =>
                          setSchedulingPolicy(
                            value as BrainSettings["schedulingPolicy"],
                          )
                        }
                      >
                        <SelectTrigger className="w-52 bg-white/[0.06]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fix-before-new-task">
                            Fix before new task
                          </SelectItem>
                          <SelectItem value="fifo">FIFO</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">Loading</Badge>
                    )
                  }
                />
                <SettingRow
                  title="Waiting reasons"
                  description="Queue warnings show MaxLoop and dependency wait reasons."
                  action={<Badge variant="secondary">Implemented</Badge>}
                />
              </SettingsGroup>
            </SettingsSection>
          </div>
        );
      case "threads":
        return (
          <SettingsSection title="Threads and worktrees">
            <SettingsGroup>
              <SettingRow
                title="Thread storage root"
                description="Where Codex-style durable agent thread metadata is stored."
                action={
                  brainSettings ? (
                    <PathSetting
                      value={brainSettings.threadStorageRoot}
                      onChange={setThreadStorageRoot}
                    />
                  ) : (
                    <Badge variant="secondary">Loading</Badge>
                  )
                }
              />
              <SettingRow
                title="Worktree storage root"
                description="Where isolated per-task Git worktrees are created when worktree execution is selected."
                action={
                  brainSettings ? (
                    <PathSetting
                      value={brainSettings.worktreeStorageRoot}
                      onChange={setWorktreeStorageRoot}
                    />
                  ) : (
                    <Badge variant="secondary">Loading</Badge>
                  )
                }
              />
              <SettingRow
                title="Execution strategy"
                description="Choose isolated worktrees, explicit main-checkout execution, or automatic fallback to the main checkout when worktree prep fails."
                action={
                  brainSettings ? (
                    <Select
                      value={brainSettings.executionStrategy}
                      onValueChange={(value) =>
                        setExecutionStrategy(
                          value as BrainSettings["executionStrategy"],
                        )
                      }
                    >
                      <SelectTrigger className="w-52 bg-white/[0.06]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="worktree">
                          Isolated worktree
                        </SelectItem>
                        <SelectItem value="auto">Auto fallback</SelectItem>
                        <SelectItem value="main-checkout">
                          Main checkout
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">Loading</Badge>
                  )
                }
              />
              {brainSettings?.executionStrategy === "main-checkout" && (
                <SettingRow
                  title="Main checkout warning"
                  description="Agents will run directly in the project checkout, so their edits can collide with local work."
                  action={<Badge variant="destructive">Shared checkout</Badge>}
                />
              )}
              <SettingRow
                title="Terminal sessions"
                description="PTY sessions are available from the active workspace."
                action={<Badge variant="secondary">Implemented</Badge>}
              />
            </SettingsGroup>
          </SettingsSection>
        );
      case "permissions":
        return (
          <div className="space-y-10">
            <SettingsSection title="Permissions">
              <SettingsGroup>
                <SettingRow
                  title="Default workspace permissions"
                  description="Brain Loop reads and writes only through supported local Brain contracts."
                  action={<ToggleButton active />}
                />
                <SettingRow
                  title="Approval broker"
                  description="Sensitive runner requests surface as approval cards before continuing."
                  action={<Badge variant="secondary">Implemented</Badge>}
                />
                <SettingRow
                  title="Permission-required sound"
                  description="Play one short cue when a new pending approval request appears. The approval notification category can disable both notifications and cues."
                  action={
                    <ToggleButton
                      active={permissionSoundEnabled}
                      disabled={!notificationPreferences.approval}
                      onClick={onTogglePermissionSound}
                    />
                  }
                />
              </SettingsGroup>
            </SettingsSection>
            <SettingsSection title="Approval requests">
              <ApprovalPanel />
            </SettingsSection>
          </div>
        );
      case "integrations":
        return (
          <SettingsSection title="Integrations">
            <SettingsGroup>
              <SettingRow
                title="LaunchAgent helper"
                description={
                  launchAgentInfo?.message ??
                  "LaunchAgent information is unavailable."
                }
                action={
                  <Badge
                    variant={
                      launchAgentInfo?.status === "loaded"
                        ? "default"
                        : launchAgentInfo?.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {launchAgentInfo?.statusLabel ?? "Unavailable"}
                  </Badge>
                }
              />
              {launchAgentAction && (
                <SettingRow
                  title={
                    launchAgentAction.ok
                      ? "Last operation completed"
                      : "Last operation failed"
                  }
                  description={launchAgentAction.text}
                  action={
                    launchAgentAction.ok ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <Info className="size-4 text-amber-400" />
                    )
                  }
                />
              )}
              <SettingRow
                title="LaunchAgent actions"
                description={
                  confirmAction
                    ? `Confirm ${confirmAction} action.`
                    : "Install, load, unload, remove, or refresh helper state."
                }
                action={
                  <div className="flex flex-wrap justify-end gap-2">
                    {confirmAction ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            onLaunchAgentAction(confirmAction);
                            setConfirmAction(null);
                          }}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setConfirmAction(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        {launchAgentInfo?.status === "not_installed" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setConfirmAction("install")}
                          >
                            Install
                          </Button>
                        )}
                        {launchAgentInfo?.status === "installed" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setConfirmAction("load")}
                          >
                            Load
                          </Button>
                        )}
                        {launchAgentInfo?.status === "loaded" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setConfirmAction("unload")}
                          >
                            Unload
                          </Button>
                        )}
                        {launchAgentInfo &&
                          launchAgentInfo.status !== "not_installed" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setConfirmAction("remove")}
                            >
                              Remove
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={onRefreshLaunchAgent}
                        >
                          Refresh
                        </Button>
                      </>
                    )}
                  </div>
                }
              />
              <SettingRow
                title="Browser"
                description="Browser integration is planned as a future explicit permission surface."
                action={<PlannedBadge />}
              />
              <SettingRow
                title="Computer use"
                description="Computer-use integrations must be explicit and permission-gated."
                action={<PlannedBadge />}
              />
            </SettingsGroup>
          </SettingsSection>
        );
      case "environment":
        return (
          <SettingsSection title="Git and environment">
            <SettingsGroup>
              <SettingRow
                title="State root"
                description="Current source of truth: ~/.brain-loop."
                action={<Badge variant="secondary">Local</Badge>}
              />
              <SettingRow
                title="Branch context"
                description="Main checkout and worktree display defaults are planned."
                action={<PlannedBadge />}
              />
              <SettingRow
                title="Commit or push readiness"
                description="Environment panel support is planned for active threads."
                action={<PlannedBadge />}
              />
              <SettingRow
                title="Legacy migration"
                description="Legacy .codex state is copied into ~/.brain-loop when the new root is missing."
                action={<Badge variant="secondary">Implemented</Badge>}
              />
            </SettingsGroup>
          </SettingsSection>
        );
      case "release":
        return (
          <SettingsSection title="Release readiness">
            <SettingsGroup>
              <SettingRow
                title="Typecheck"
                description="Run before release: bun run typecheck."
                action={<Badge variant="secondary">Checklist</Badge>}
              />
              <SettingRow
                title="Desktop build"
                description="Run before release: bun --filter @brain-loop/desktop build."
                action={<Badge variant="secondary">Checklist</Badge>}
              />
              <SettingRow
                title="Tauri build"
                description="Requires Rust/Cargo and platform packaging prerequisites."
                action={<Badge variant="secondary">Host-dependent</Badge>}
              />
              <SettingRow
                title="Smoke tests"
                description="Empty state, sample queue, runner missing/success, approval, scheduler pause, and notifications."
                action={<Badge variant="secondary">Manual</Badge>}
              />
            </SettingsGroup>
          </SettingsSection>
        );
      default:
        return null;
    }
  }
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function SettingsGroup({ children }: { children: ReactNode }) {
  return (
    <Card className="gap-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] py-0 shadow-none ring-0">
      {children}
    </Card>
  );
}

function SettingRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-16 items-center gap-4 border-b border-white/10 px-4 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-zinc-100">{title}</div>
        <div className="mt-1 max-w-[660px] text-xs leading-5 text-zinc-500">
          {description}
        </div>
      </div>
      {action && (
        <div className="flex shrink-0 items-center justify-end">{action}</div>
      )}
    </div>
  );
}

function ToggleButton({
  active,
  disabled,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Switch
      disabled={disabled}
      checked={active}
      onCheckedChange={() => onClick?.()}
      aria-label="Toggle setting"
    />
  );
}

function ModeCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof Settings;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={onClick}
      className={cn(
        "h-auto min-h-16 w-full justify-start gap-3 whitespace-normal rounded-lg border px-3 py-2.5 text-left",
        active
          ? "border-white/10 bg-white/10"
          : "border-white/10 bg-transparent hover:bg-white/[0.04]",
      )}
    >
      <Icon className="size-4 text-zinc-300" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-zinc-100">{title}</span>
        <span className="mt-1 block text-xs text-zinc-500">{description}</span>
      </span>
      <span
        className={cn(
          "size-4 rounded-full border",
          active
            ? "border-sky-400 bg-sky-400 ring-4 ring-sky-400/20"
            : "border-zinc-600",
        )}
      />
    </Button>
  );
}

function ModelSelect({
  value,
  models,
  onChange,
}: {
  value: string;
  models: string[];
  onChange: (model: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48 bg-white/[0.06]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model} value={model}>
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RunnerCatalogRow({
  runner,
  usedAsDefault,
  onToggle,
  onDefaultModelChange,
  onModelsChange,
}: {
  runner: BrainSettings["runnerCatalog"][number];
  usedAsDefault: boolean;
  onToggle: () => void;
  onDefaultModelChange: (model: string) => void;
  onModelsChange: (models: string) => void;
}) {
  return (
    <div className="grid gap-3 border-b border-white/10 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-zinc-100">
            {runner.label}
          </div>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            {runner.kind === "direct-provider" ? "Direct model" : "CLI"}
          </Badge>
          <Badge
            variant={runner.enabled ? "secondary" : "outline"}
            className="border-zinc-700 text-zinc-400"
          >
            {runner.enabled ? "Enabled" : "Disabled"}
          </Badge>
          {usedAsDefault && <Badge variant="secondary">Default</Badge>}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {runner.id}
          {runner.providerId ? ` · ${runner.providerId}` : ""}
          {runner.apiStyle ? ` · ${runner.apiStyle}` : ""}
          {runner.apiKeyEnv ? ` · ${runner.apiKeyEnv}` : ""}
        </div>
        <Label
          htmlFor={`${runner.id}-models`}
          className="mt-3 block text-[11px] text-zinc-500"
        >
          Models
        </Label>
        <Input
          key={runner.models.join("|")}
          id={`${runner.id}-models`}
          defaultValue={runner.models.join(", ")}
          onBlur={(event) => onModelsChange(event.target.value)}
          className="mt-1 border-white/10 bg-white/[0.05] text-xs"
        />
      </div>
      <div className="flex flex-col items-end justify-between gap-3">
        <Switch
          checked={runner.enabled}
          disabled={usedAsDefault}
          onCheckedChange={onToggle}
          aria-label={`Toggle ${runner.label}`}
        />
        <ModelSelect
          value={runner.defaultModel}
          models={runner.models}
          onChange={onDefaultModelChange}
        />
      </div>
    </div>
  );
}

function NumberSetting({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Input
      type="number"
      min={min}
      max={max}
      defaultValue={value}
      onBlur={(event) => {
        const nextValue = Number.parseInt(event.target.value, 10);
        if (
          Number.isFinite(nextValue) &&
          nextValue >= min &&
          (max === undefined || nextValue <= max)
        ) {
          onChange(nextValue);
        }
      }}
      className="w-24 border-white/10 bg-white/[0.05] text-xs"
    />
  );
}

function PathSetting({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      key={value}
      defaultValue={value}
      onBlur={(event) => onChange(event.target.value)}
      className="w-80 border-white/10 bg-white/[0.05] text-xs"
    />
  );
}

function PlannedBadge() {
  return (
    <Badge variant="outline" className="border-zinc-700 text-zinc-400">
      Planned
    </Badge>
  );
}
