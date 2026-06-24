import { useEffect, useMemo, useRef, useState } from "react";
import { archiveAgentThread } from "@brain-loop/desktop-client";
import type { AgentThread, BrainProject, BrainStatus, OrchestrationThread, QueueItem } from "@brain-loop/brain-core";
import type { ApprovalRequest } from "@brain-loop/brain-core";
import type { AgentNavItem, SidebarOrganization, SidebarThreadTab, ThreadSort } from "@/components/sidebar";
import {
  formatCompactElapsed,
  formatQueueThreadTitle,
  formatWorkspaceLabel,
  groupLabelForThread,
  queueItemDisplayTimestamp,
  sortThreadNavItems,
} from "@/lib/queue-display";

const archivableThreadStatuses = new Set(["done", "landing", "blocked", "unknown"]);
const taskBackedThreadStatuses = new Set([
  "picked",
  "started",
  "stale-started",
  "submitted",
  "reviewing",
  "reviewed-fix-request",
  "landing",
  "approved",
  "blocked",
]);

interface UseSidebarViewModelOptions {
  status: BrainStatus;
  schedulerState: string;
  queueItems: QueueItem[];
  queueProjects: BrainProject[];
  agentThreads: AgentThread[];
  orchestrations: OrchestrationThread[];
  pendingApprovalRequests: ApprovalRequest[];
  pendingApprovalByQueueId: Map<string, ApprovalRequest[]>;
  refreshAgentThreads: () => void;
  refreshOrchestrations: () => void;
  setThreadError: (error: string | null) => void;
}

export function useSidebarViewModel({
  status,
  schedulerState,
  queueItems,
  queueProjects,
  agentThreads,
  orchestrations,
  pendingApprovalRequests,
  pendingApprovalByQueueId,
  refreshAgentThreads,
  refreshOrchestrations,
  setThreadError,
}: UseSidebarViewModelOptions) {
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeThreadTab, setActiveThreadTab] = useState<SidebarThreadTab>("workers");
  const [sidebarOrganization, setSidebarOrganization] = useState<SidebarOrganization>("chronological-list");
  const [threadSort, setThreadSort] = useState<ThreadSort>("updatedAt");
  const [unreadCompletedThreadIds, setUnreadCompletedThreadIds] = useState<Set<string>>(() => new Set());
  const activeAgentIdRef = useRef(activeAgentId);
  const knownCompletedThreadIdsRef = useRef<Set<string>>(new Set());
  const completedThreadBaselineReadyRef = useRef(false);

  const agents = useMemo<AgentNavItem[]>(
    () => [
      {
        id: "dashboard",
        name: "Dashboard",
        description: `${queueItems.length} tasks · ${queueProjects.length} projects`,
        status: schedulerState,
        count: status.activeRuns,
        kind: "dashboard",
      },
      {
        id: "new-orchestrator",
        name: "New Orchestrator",
        description: "Start a planning thread",
        status: "ready",
        count: orchestrations.length,
        kind: "new-orchestrator",
      },
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
        description: `${pendingApprovalRequests.length} pending`,
        status: pendingApprovalRequests.length > 0 ? "attention" : "clear",
        count: pendingApprovalRequests.length,
        kind: "approval",
        alert: pendingApprovalRequests.length > 0 ? {
          label: `${pendingApprovalRequests.length} pending`,
          title: "Permission required",
        } : undefined,
      },
    ],
    [orchestrations.length, pendingApprovalRequests.length, queueItems.length, queueProjects.length, schedulerState, status],
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

  const queueItemsByOrchestrationId = useMemo(() => {
    const map = new Map<string, QueueItem[]>();
    for (const item of queueItems) {
      if (!item.orchestrationId) {
        continue;
      }
      const existing = map.get(item.orchestrationId) ?? [];
      existing.push(item);
      map.set(item.orchestrationId, existing);
    }
    return map;
  }, [queueItems]);

  const orchestrationItems = useMemo<AgentNavItem[]>(() => {
    return orchestrations.map((thread) => {
      const linkedQueue = queueItemsByOrchestrationId.get(thread.id) ?? [];
      return {
        id: `orchestration:${thread.id}`,
        name: thread.title,
        description: `${thread.projectName} · ${thread.status}`,
        status: thread.status,
        count: linkedQueue.length || thread.linkedQueueItemIds.length,
        projectName: thread.projectName,
        timeLabel: formatCompactElapsed(thread.updatedAt || thread.createdAt),
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        workspaceLabel: thread.originAgent,
        groupLabel: groupLabelForThread(sidebarOrganization, thread.projectName, thread.originAgent),
        archivable: false,
        completed: thread.status === "handed-off",
        unread: false,
        kind: "orchestration" as const,
      };
    });
  }, [orchestrations, queueItemsByOrchestrationId, sidebarOrganization]);

  const activeAgent = [...agents, ...threadItems, ...orchestrationItems].find((agent) => agent.id === activeAgentId) ?? null;
  const activeThread = activeAgentId?.startsWith("thread:")
    ? visibleAgentThreads.find((thread) => `thread:${thread.queueItemId}` === activeAgentId) ?? null
    : null;
  const activeOrchestration = activeAgentId?.startsWith("orchestration:")
    ? orchestrations.find((thread) => `orchestration:${thread.id}` === activeAgentId) ?? null
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
    reconcileCompletedThreadRows(visibleAgentThreads.map((thread) => ({
      id: `thread:${thread.queueItemId}`,
      completed: thread.status === "done",
    })));
  }, [visibleAgentThreads]);

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

  function handleNewOrchestration() {
    setActiveThreadTab("orchestrator");
    setActiveAgentId(null);
  }

  function handleAgentSelect(agentId: string) {
    if (agentId === "new-orchestrator") {
      handleNewOrchestration();
      return;
    }
    setActiveAgentId(agentId);
    if (agentId.startsWith("thread:")) {
      setActiveThreadTab("workers");
      void refreshAgentThreads();
    } else if (agentId.startsWith("orchestration:")) {
      setActiveThreadTab("orchestrator");
      void refreshOrchestrations();
    }
  }

  function handleThreadTabChange(tab: SidebarThreadTab) {
    setActiveThreadTab(tab);
    if (tab === "orchestrator" && !activeAgentIdRef.current?.startsWith("orchestration:")) {
      setActiveAgentId(null);
      return;
    }
    if (tab === "workers" && activeAgentIdRef.current?.startsWith("orchestration:")) {
      setActiveAgentId(null);
    }
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

  return {
    activeAgent,
    activeAgentId,
    activeOrchestration,
    activeThread,
    activeThreadTab,
    agents,
    handleAgentSelect,
    handleArchiveAllThreads,
    handleArchiveThread,
    handleNewOrchestration,
    handleThreadTabChange,
    orchestrationItems,
    queueItemsByOrchestrationId,
    setActiveAgentId,
    setActiveThreadTab,
    setSidebarCollapsed,
    setSidebarOrganization,
    setThreadSort,
    sidebarCollapsed,
    sidebarOrganization,
    threadItems,
    threadSort,
  };
}

function isTaskBackedThreadStatus(status: string | null | undefined) {
  return Boolean(status && taskBackedThreadStatuses.has(status));
}
