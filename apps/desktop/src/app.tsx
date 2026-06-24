import { useEffect, useState } from "react";
import { SettingsPage } from "@/components/settings/settings-page";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { useAutomationNotifications } from "@/hooks/use-automation-notifications";
import { useBrainLoopData } from "@/hooks/use-brain-loop-data";
import { useOrchestrationActions } from "@/hooks/use-orchestration-actions";
import { useSidebarViewModel } from "@/hooks/use-sidebar-view-model";
import { loadThemePreference, saveThemePreference, type ThemePreference } from "@/lib/theme";

type AppView = "workspace" | "settings";

export function App() {
  const [view, setView] = useState<AppView>("workspace");
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => loadThemePreference());
  const notifications = useAutomationNotifications();
  const data = useBrainLoopData({
    emitNotification: notifications.emitNotification,
    refreshApprovals: notifications.refreshApprovals,
  });
  const sidebar = useSidebarViewModel({
    status: data.status,
    schedulerState: data.schedulerState,
    queueItems: data.queueItems,
    queueProjects: data.queueProjects,
    agentThreads: data.agentThreads,
    orchestrations: data.orchestrations,
    pendingApprovalRequests: notifications.pendingApprovalRequests,
    pendingApprovalByQueueId: notifications.pendingApprovalByQueueId,
    refreshAgentThreads: data.refreshAgentThreads,
    refreshOrchestrations: data.refreshOrchestrations,
    setThreadError: data.setThreadError,
  });
  const orchestrationActions = useOrchestrationActions({
    brainSettings: data.brainSettings,
    queueProjects: data.queueProjects,
    refreshAgentThreads: data.refreshAgentThreads,
    refreshOrchestrations: data.refreshOrchestrations,
    refreshProjects: data.refreshProjects,
    refreshQueue: data.refreshQueue,
    setActiveAgentId: sidebar.setActiveAgentId,
    setActiveThreadTab: sidebar.setActiveThreadTab,
    setOrchestrations: data.setOrchestrations,
    setProjectError: data.setProjectError,
  });

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

  if (view === "settings") {
    return (
      <SettingsPage
        status={data.status}
        schedulerState={data.schedulerState}
        projects={data.queueProjects}
        queueItems={data.queueItems}
        isProjectsLoading={data.isProjectsLoading}
        projectError={data.projectError}
        notificationPreferences={notifications.notificationPrefs}
        permissionSoundEnabled={notifications.permissionSoundEnabled}
        notificationPermission={notifications.notificationPermission}
        themePreference={themePreference}
        brainSettings={data.brainSettings}
        settingsError={data.settingsError}
        lastNotification={notifications.lastNotification}
        launchAgentInfo={data.laAgentInfo}
        launchAgentAction={data.laAgentAction}
        harnessCapabilities={data.harnessCapabilities}
        directModelRuntimeContract={data.directModelRuntimeContract}
        onBack={() => setView("workspace")}
        onProjectsChanged={data.refreshProjects}
        onToggleNotification={notifications.toggleNotification}
        onTogglePermissionSound={() => notifications.setPermissionSoundEnabled((enabled) => !enabled)}
        onThemePreferenceChange={setThemePreference}
        onBrainSettingsChange={data.handleBrainSettingsChange}
        onRequestNotifications={notifications.requestNotifications}
        onStartAutomation={data.startScheduler}
        onPauseAutomation={data.pauseScheduler}
        onRunImplementation={data.handleRunImplementation}
        onRunReview={data.handleRunReview}
        onLaunchAgentAction={data.handleLaunchAgentAction}
        onRefreshLaunchAgent={data.refreshLaunchAgent}
      />
    );
  }

  return (
    <WorkspaceShell
      activeAgent={sidebar.activeAgent}
      activeOrchestration={sidebar.activeOrchestration}
      activeThread={sidebar.activeThread}
      activeThreadTab={sidebar.activeThreadTab}
      agents={sidebar.agents}
      brainSettingsDefaultModel={data.brainSettings?.defaultReviewModel}
      implResult={data.implResult}
      orchestrationItems={sidebar.orchestrationItems}
      orchestrations={data.orchestrations}
      pendingApprovalByQueueId={notifications.pendingApprovalByQueueId}
      pendingApprovalRequests={notifications.pendingApprovalRequests}
      projects={data.queueProjects}
      queueError={data.queueError ?? data.orchestrationError}
      queueItems={data.queueItems}
      queueItemsByOrchestrationId={sidebar.queueItemsByOrchestrationId}
      queueStartBusyId={data.queueStartBusyId}
      queueStartResult={data.queueStartResult}
      reviewResult={data.reviewResult}
      schedulerState={data.schedulerState}
      schedulerStatus={data.schedulerStatus}
      sidebarCollapsed={sidebar.sidebarCollapsed}
      sidebarOrganization={sidebar.sidebarOrganization}
      status={data.status}
      statusError={data.statusError}
      threadError={data.threadError}
      threadItems={sidebar.threadItems}
      threadSort={sidebar.threadSort}
      onAgentSelect={sidebar.handleAgentSelect}
      onAppendOrchestrationMessage={orchestrationActions.handleAppendOrchestrationMessage}
      onArchiveAllThreads={sidebar.handleArchiveAllThreads}
      onArchiveThread={sidebar.handleArchiveThread}
      onCreateProjectFromFolder={orchestrationActions.handleCreateProjectFromFolder}
      onHandoffOrchestration={orchestrationActions.handleHandoffOrchestration}
      onNewOrchestration={sidebar.handleNewOrchestration}
      onOpenSettings={() => setView("settings")}
      onPauseAutomation={data.pauseScheduler}
      onRunImplementation={data.handleRunImplementation}
      onRunQueueItem={data.handleRunQueueItem}
      onRunReview={data.handleRunReview}
      onSidebarOrganizationChange={sidebar.setSidebarOrganization}
      onStartAutomation={data.startScheduler}
      onStartOrchestration={orchestrationActions.handleStartOrchestration}
      onThreadSortChange={sidebar.setThreadSort}
      onThreadTabChange={sidebar.handleThreadTabChange}
      onToggleProjectEnabled={orchestrationActions.handleToggleProjectEnabled}
      onToggleSidebarCollapsed={() => sidebar.setSidebarCollapsed((collapsed) => !collapsed)}
      onUpdateOrchestrationProject={orchestrationActions.handleUpdateOrchestrationProject}
    />
  );
}
