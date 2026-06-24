import type { QueueItem } from "@brain-loop/brain-core";
import type { AgentNavItem, SidebarOrganization, ThreadSort } from "@/components/sidebar";

export function formatCompactElapsed(timestamp: string | null | undefined) {
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

export function isWithinReviewWindow(timestamp: string | null | undefined, window: "week" | "month") {
  if (!timestamp) {
    return false;
  }
  const time = new Date(timestamp).getTime();
  if (!Number.isFinite(time)) {
    return false;
  }
  const days = window === "week" ? 7 : 30;
  return Date.now() - time <= days * 24 * 60 * 60 * 1000;
}

export function groupLabelForThread(
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

export function sortThreadNavItems(
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

export function queueItemDisplayTimestamp(item: QueueItem) {
  return item.approvedAt
    ?? item.reviewedAt
    ?? item.submittedAt
    ?? item.blockedAt
    ?? item.agentStartedAt
    ?? item.pickedAt
    ?? item.createdAt;
}

export function formatWorkspaceLabel(strategy: string | null | undefined) {
  if (!strategy) {
    return "workspace";
  }

  if (strategy === "main-checkout") {
    return "main checkout";
  }

  return strategy;
}

export function formatQueueThreadTitle(item: QueueItem) {
  const candidates = [
    item.threadTitle,
    item.threadName,
    item.taskName,
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

export function cleanThreadTitle(value: string | null | undefined, projectId?: string) {
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
