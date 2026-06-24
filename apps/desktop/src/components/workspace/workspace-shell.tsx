import type {
  AgentThread,
  ApprovalRequest,
  BrainProject,
  BrainStatus,
  OrchestrationThread,
  QueueItem,
  SchedulerStatus,
} from "@brain-loop/brain-core";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { OrchestrationStartView } from "@/components/orchestration/orchestration-start-view";
import { OrchestrationThreadView } from "@/components/orchestration/orchestration-thread-view";
import { Sidebar, type AgentNavItem, type SidebarOrganization, type SidebarThreadTab, type ThreadSort } from "@/components/sidebar";
import { AgentThreadView, ThreadIdentity } from "@/components/thread-workspace/thread-workspace";
import { EmptyHome } from "@/components/workspace/empty-home";
import type { OrchestratorModelOption } from "@/lib/orchestration-display";

interface WorkspaceShellProps {
  activeAgent: AgentNavItem | null;
  activeOrchestration: OrchestrationThread | null;
  activeThread: AgentThread | null;
  activeThreadTab: SidebarThreadTab;
  agents: AgentNavItem[];
  brainSettingsDefaultModel?: string | null;
  implResult: { ok: boolean; text: string } | null;
  orchestrationItems: AgentNavItem[];
  orchestrations: OrchestrationThread[];
  pendingApprovalByQueueId: Map<string, ApprovalRequest[]>;
  pendingApprovalRequests: ApprovalRequest[];
  projects: BrainProject[];
  queueError: string | null;
  queueItems: QueueItem[];
  queueItemsByOrchestrationId: Map<string, QueueItem[]>;
  queueStartBusyId: string | null;
  queueStartResult: { ok: boolean; text: string } | null;
  reviewResult: { ok: boolean; text: string } | null;
  schedulerState: string;
  schedulerStatus: SchedulerStatus | null;
  sidebarCollapsed: boolean;
  sidebarOrganization: SidebarOrganization;
  status: BrainStatus;
  statusError: boolean;
  threadError: string | null;
  threadItems: AgentNavItem[];
  threadSort: ThreadSort;
  onAgentSelect: (agentId: string) => void;
  onAppendOrchestrationMessage: (thread: OrchestrationThread, body: string) => Promise<OrchestrationThread>;
  onArchiveAllThreads: () => void;
  onArchiveThread: (item: AgentNavItem) => void;
  onCreateProjectFromFolder: (mode: "scratch" | "existing") => Promise<BrainProject | null>;
  onHandoffOrchestration: (thread: OrchestrationThread, taskTitle: string, taskBody: string) => Promise<unknown>;
  onNewOrchestration: () => void;
  onOpenSettings: () => void;
  onPauseAutomation: () => void;
  onRunImplementation: () => void;
  onRunQueueItem: (queueItemId: string) => void;
  onRunReview: () => void;
  onSidebarOrganizationChange: (organization: SidebarOrganization) => void;
  onStartAutomation: () => void;
  onStartOrchestration: (body: string, projectId: string, orchestrator: OrchestratorModelOption) => Promise<OrchestrationThread>;
  onThreadSortChange: (sort: ThreadSort) => void;
  onThreadTabChange: (tab: SidebarThreadTab) => void;
  onToggleProjectEnabled: (project: BrainProject, enabled: boolean) => void;
  onToggleSidebarCollapsed: () => void;
  onUpdateOrchestrationProject: (thread: OrchestrationThread, projectId: string) => Promise<OrchestrationThread>;
}

export function WorkspaceShell({
  activeAgent,
  activeOrchestration,
  activeThread,
  activeThreadTab,
  agents,
  brainSettingsDefaultModel,
  implResult,
  orchestrationItems,
  orchestrations,
  pendingApprovalByQueueId,
  pendingApprovalRequests,
  projects,
  queueError,
  queueItems,
  queueItemsByOrchestrationId,
  queueStartBusyId,
  queueStartResult,
  reviewResult,
  schedulerState,
  schedulerStatus,
  sidebarCollapsed,
  sidebarOrganization,
  status,
  statusError,
  threadError,
  threadItems,
  threadSort,
  onAgentSelect,
  onAppendOrchestrationMessage,
  onArchiveAllThreads,
  onArchiveThread,
  onCreateProjectFromFolder,
  onHandoffOrchestration,
  onNewOrchestration,
  onOpenSettings,
  onPauseAutomation,
  onRunImplementation,
  onRunQueueItem,
  onRunReview,
  onSidebarOrganizationChange,
  onStartAutomation,
  onStartOrchestration,
  onThreadSortChange,
  onThreadTabChange,
  onToggleProjectEnabled,
  onToggleSidebarCollapsed,
  onUpdateOrchestrationProject,
}: WorkspaceShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#141414] font-sans text-zinc-100 antialiased">
      <Sidebar
        status={status}
        agents={agents}
        threads={threadItems}
        orchestrations={orchestrationItems}
        projects={projects}
        activeAgentId={activeAgent?.id ?? null}
        activeThreadTab={activeThreadTab}
        collapsed={sidebarCollapsed}
        schedulerState={schedulerState}
        schedulerStatus={schedulerStatus}
        onToggleCollapsed={onToggleSidebarCollapsed}
        onStartAutomation={onStartAutomation}
        onPauseAutomation={onPauseAutomation}
        onAgentSelect={onAgentSelect}
        onThreadTabChange={onThreadTabChange}
        onNewOrchestration={onNewOrchestration}
        onArchiveThread={onArchiveThread}
        onArchiveAllThreads={onArchiveAllThreads}
        onToggleProjectEnabled={onToggleProjectEnabled}
        onOpenSettings={onOpenSettings}
        sidebarOrganization={sidebarOrganization}
        onSidebarOrganizationChange={onSidebarOrganizationChange}
        threadSort={threadSort}
        onThreadSortChange={onThreadSortChange}
      />
      <main className="relative flex h-screen min-w-0 flex-1 overflow-hidden bg-[#141414]">
        <ThreadIdentity
          agent={activeAgent}
          projectName={activeAgent?.projectName ?? "All projects"}
          thread={activeThread}
        />
        {activeAgent?.kind === "dashboard" ? (
          <DashboardView
            status={status}
            schedulerStatus={schedulerStatus}
            schedulerState={schedulerState}
            queueItems={queueItems}
            projects={projects}
            approvalRequests={pendingApprovalRequests}
            orchestrations={orchestrations}
            queueStartBusyId={queueStartBusyId}
            queueStartResult={queueStartResult}
            onOpenApprovals={() => onAgentSelect("approvals")}
            onOpenQueueItem={(queueItemId) => onAgentSelect(`thread:${queueItemId}`)}
            onRunQueueItem={onRunQueueItem}
            onNewOrchestrator={onNewOrchestration}
          />
        ) : activeOrchestration ? (
          <OrchestrationThreadView
            orchestration={activeOrchestration}
            linkedQueueItems={queueItemsByOrchestrationId.get(activeOrchestration.id) ?? []}
            queueError={queueError}
            projects={projects}
            onAppendMessage={onAppendOrchestrationMessage}
            onUpdateProject={onUpdateOrchestrationProject}
            onHandoff={onHandoffOrchestration}
            onOpenWorker={(queueItemId) => onAgentSelect(`thread:${queueItemId}`)}
          />
        ) : activeAgent ? (
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
            onOpenApprovals={() => onAgentSelect("approvals")}
            onStartAutomation={onStartAutomation}
            onPauseAutomation={onPauseAutomation}
            onRunImplementation={onRunImplementation}
            onRunReview={onRunReview}
            harnessModel={brainSettingsDefaultModel ?? "gpt-5-codex"}
          />
        ) : activeThreadTab === "orchestrator" ? (
          <OrchestrationStartView
            projects={projects}
            defaultModel={brainSettingsDefaultModel ?? undefined}
            recentOrchestrations={orchestrations}
            onStart={onStartOrchestration}
            onCreateProject={onCreateProjectFromFolder}
            onOpenOrchestration={(orchestrationId) => onAgentSelect(`orchestration:${orchestrationId}`)}
          />
        ) : (
          <EmptyHome />
        )}
      </main>
    </div>
  );
}
