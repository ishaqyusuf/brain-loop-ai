import type { BrainProject, BrainStatus, SchedulerStatus } from "@brain-loop/brain-core";
import { Fragment, useEffect, useRef, useState, type FocusEvent, type MouseEvent, type PointerEvent } from "react";
import {
  AlertCircle,
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CirclePlus,
  Clock,
  Flag,
  Folder,
  FolderPlus,
  GitBranch,
  MessageSquareText,
  MoreHorizontal,
  Pause,
  PenLine,
  Play,
  LayoutDashboard,
  Settings,
  SquarePen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const sidebarGhostButtonClass =
  "w-full rounded-md border-transparent bg-transparent text-zinc-300 shadow-none hover:bg-white/[0.055] hover:text-zinc-50 focus-visible:bg-white/[0.055] data-[active=true]:bg-white/[0.075] data-[active=true]:text-zinc-50";
const sidebarIconGhostButtonClass =
  "rounded-md border-transparent bg-transparent text-zinc-400 shadow-none hover:bg-transparent hover:text-zinc-50 focus-visible:bg-transparent";
const initialThreadDisplayCount = 10;

export interface AgentNavItem {
  id: string;
  name: string;
  description: string;
  status: string;
  count: number;
  projectName?: string;
  timeLabel?: string;
  threadId?: string;
  queueItemId?: string;
  workspaceLabel?: string;
  groupLabel?: string;
  createdAt?: string;
  updatedAt?: string;
  archivable?: boolean;
  completed?: boolean;
  unread?: boolean;
  alert?: {
    label: string;
    title: string;
  };
  kind?: "dashboard" | "implementation" | "review" | "approval" | "thread" | "orchestration" | "new-orchestrator";
}

export type SidebarOrganization = "by-projects" | "chronological-list" | "worktree";
export type ThreadSort = "createdAt" | "updatedAt";
export type SidebarThreadTab = "workers" | "orchestrator";

interface SidebarProps {
  status: BrainStatus;
  agents: AgentNavItem[];
  threads: AgentNavItem[];
  orchestrations: AgentNavItem[];
  projects: BrainProject[];
  activeAgentId: string | null;
  activeThreadTab: SidebarThreadTab;
  collapsed: boolean;
  schedulerState: string;
  schedulerStatus: SchedulerStatus | null;
  onToggleCollapsed: () => void;
  onStartAutomation: () => void;
  onPauseAutomation: () => void;
  onAgentSelect: (agentId: string) => void;
  onThreadTabChange: (tab: SidebarThreadTab) => void;
  onNewOrchestration: () => void;
  onArchiveThread: (item: AgentNavItem) => void;
  onArchiveAllThreads: () => void;
  onToggleProjectEnabled: (project: BrainProject, enabled: boolean) => void;
  onOpenSettings: () => void;
  sidebarOrganization: SidebarOrganization;
  onSidebarOrganizationChange: (organization: SidebarOrganization) => void;
  threadSort: ThreadSort;
  onThreadSortChange: (sort: ThreadSort) => void;
}

export function Sidebar({
  status,
  agents,
  threads,
  orchestrations,
  projects,
  activeAgentId,
  activeThreadTab,
  collapsed,
  schedulerState,
  schedulerStatus,
  onToggleCollapsed,
  onStartAutomation,
  onPauseAutomation,
  onAgentSelect,
  onThreadTabChange,
  onNewOrchestration,
  onArchiveThread,
  onArchiveAllThreads,
  onToggleProjectEnabled,
  onOpenSettings,
  sidebarOrganization,
  onSidebarOrganizationChange,
  threadSort,
  onThreadSortChange,
}: SidebarProps) {
  const sidebarWidth = collapsed ? "w-[68px]" : "w-[326px]";
  const [visibleThreadCount, setVisibleThreadCount] = useState(initialThreadDisplayCount);
  const activeList = activeThreadTab === "workers" ? threads : orchestrations;
  const visibleThreads = activeList.slice(0, visibleThreadCount);
  const hasMoreThreads = visibleThreads.length < activeList.length;

  useEffect(() => {
    setVisibleThreadCount(initialThreadDisplayCount);
  }, [activeThreadTab, sidebarOrganization, threadSort]);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "relative flex h-screen shrink-0 flex-col border-r border-white/[0.075] bg-[#1f1f1f]/78 text-zinc-100 shadow-[inset_-1px_0_0_rgba(255,255,255,0.035)] backdrop-blur-2xl transition-[width] duration-200",
          sidebarWidth,
        )}
      >
        <div className={cn("shrink-0 px-3", collapsed ? "h-[44px]" : "h-[60px]")}>
          <div
            data-tauri-drag-region
            className={cn("w-full", collapsed ? "h-[15px]" : "h-full")}
            aria-hidden="true"
          />
          {collapsed ? (
            <div className="flex h-[29px] items-center justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onToggleCollapsed}
                    className="rounded-md border-transparent bg-transparent text-zinc-400 shadow-none hover:bg-white/[0.06] hover:text-zinc-50"
                  >
                    {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            null
          )}
        </div>

        <div className="shrink-0 space-y-0.5 px-3 pb-3">
          {agents.map((agent) => (
            <SidebarItem
              key={agent.id}
              item={agent}
              active={activeAgentId === agent.id}
              collapsed={collapsed}
              onSelect={() => onAgentSelect(agent.id)}
              fixed
            />
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col pl-3 pb-3">
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-1">
            <div className={cn("mb-1 flex h-8 shrink-0 items-center gap-2 px-3", collapsed && "hidden")}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ThreadTabButton
                  label="Workers"
                  active={activeThreadTab === "workers"}
                  onSelect={() => onThreadTabChange("workers")}
                />
                <ThreadTabButton
                  label="Orchestrator"
                  active={activeThreadTab === "orchestrator"}
                  onSelect={() => onThreadTabChange("orchestrator")}
                />
              </div>
              <SidebarHeaderActions
                activeThreadTab={activeThreadTab}
                organization={sidebarOrganization}
                onOrganizationChange={onSidebarOrganizationChange}
                sort={threadSort}
                onSortChange={onThreadSortChange}
                onArchiveAllThreads={onArchiveAllThreads}
                onOpenSettings={onOpenSettings}
                projects={projects}
                onToggleProjectEnabled={onToggleProjectEnabled}
                onOpenImplementation={() => onAgentSelect("implementation")}
                onNewOrchestration={onNewOrchestration}
              />
            </div>
            {activeList.length === 0 ? (
              <div className={cn("rounded-md px-3 py-2 text-sm text-zinc-500", collapsed && "hidden")}>
                {activeThreadTab === "workers"
                  ? "Agent threads will appear here."
                  : "Orchestration chats will appear here."}
              </div>
            ) : (
              visibleThreads.map((thread, index) => {
                const showGroupLabel = !collapsed
                  && Boolean(thread.groupLabel)
                  && thread.groupLabel !== visibleThreads[index - 1]?.groupLabel;

                return (
                  <Fragment key={thread.id}>
                    {showGroupLabel && (
                      <div className="px-3 pb-1 pt-2 text-xs font-medium leading-none text-zinc-600">
                        {thread.groupLabel}
                      </div>
                    )}
                    <SidebarItem
                      item={thread}
                      active={activeAgentId === thread.id}
                      collapsed={collapsed}
                      onSelect={() => onAgentSelect(thread.id)}
                      onArchiveThread={onArchiveThread}
                    />
                  </Fragment>
                );
              })
            )}
            {hasMoreThreads && !collapsed && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setVisibleThreadCount((count) => Math.min(count + initialThreadDisplayCount, activeList.length))}
                className="mt-1 h-8 w-full justify-start gap-2 rounded-md border-transparent bg-transparent px-3 text-sm font-medium leading-none text-zinc-500 shadow-none hover:bg-white/[0.055] hover:text-zinc-300 focus-visible:bg-white/[0.055]"
              >
                <span className="min-w-0 flex-1 truncate text-left">Show more</span>
                <ChevronDown className="size-3.5 shrink-0" />
              </Button>
            )}
          </div>
        </div>

        <div className="shrink-0 p-3">
          <div className={cn("flex items-center gap-1.5", collapsed && "flex-col")}>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onOpenSettings}
              className={cn(
                sidebarGhostButtonClass,
                "h-8 min-w-0 flex-1 justify-start gap-3 px-3 text-[13px] font-normal",
                collapsed && "w-full justify-center px-0",
              )}
            >
              <Settings className="size-4" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Settings</span>
                  <span className="text-xs text-zinc-500">{automationUsagePercent(schedulerStatus, status)}%</span>
                </>
              )}
            </Button>
            <AutomationIconToggle
              schedulerState={schedulerState}
              onStartAutomation={onStartAutomation}
              onPauseAutomation={onPauseAutomation}
            />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function AutomationIconToggle({
  schedulerState,
  onStartAutomation,
  onPauseAutomation,
}: {
  schedulerState: string;
  onStartAutomation: () => void;
  onPauseAutomation: () => void;
}) {
  const running = schedulerState === "running";
  const Icon = running ? Pause : Play;
  const label = running ? "Pause automation" : "Start automation";
  const tone = running ? "text-emerald-300" : schedulerState === "error" ? "text-red-300" : "text-zinc-300";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={running ? onPauseAutomation : onStartAutomation}
          className="size-8 shrink-0 rounded-md border-transparent bg-transparent text-zinc-400 shadow-none hover:bg-white/[0.06] hover:text-zinc-50"
          aria-label={label}
        >
          <Icon className={cn("size-4", tone)} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function automationUsagePercent(schedulerStatus: SchedulerStatus | null, status: BrainStatus) {
  if (!schedulerStatus) {
    const total = status.activeRuns + status.queuedItems + status.submittedItems + status.blockedItems;
    return total > 0 ? Math.min(100, Math.round((status.activeRuns / total) * 100)) : 0;
  }

  const active = schedulerStatus.activeImplementationAgents + schedulerStatus.activeReviewAgents;
  const capacity = schedulerStatus.maxImplementationAgents + schedulerStatus.maxReviewAgents;
  if (capacity <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((active / capacity) * 100));
}

function ThreadTabButton({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={onSelect}
      className={cn(
        "h-auto min-w-0 rounded-none border-transparent bg-transparent p-0 text-sm font-normal leading-none text-zinc-500 shadow-none transition-colors hover:bg-transparent hover:text-zinc-300 focus-visible:bg-transparent focus-visible:text-zinc-200",
        active && "font-semibold text-zinc-100",
      )}
    >
      {label}
    </Button>
  );
}

function SidebarItem({
  item,
  active,
  collapsed,
  fixed,
  onSelect,
  onArchiveThread,
}: {
  item: AgentNavItem;
  active: boolean;
  collapsed: boolean;
  fixed?: boolean;
  onSelect: () => void;
  onArchiveThread?: (item: AgentNavItem) => void;
}) {
  if (item.kind === "thread" || item.kind === "orchestration") {
    return (
      <ThreadSidebarItem
        item={item}
        active={active}
        collapsed={collapsed}
        onSelect={onSelect}
        onArchiveThread={onArchiveThread}
      />
    );
  }

  if (fixed) {
    return (
      <ActionSidebarItem
        item={item}
        active={active}
        collapsed={collapsed}
        onSelect={onSelect}
      />
    );
  }

  const button = (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      data-active={active ? "true" : undefined}
      onClick={onSelect}
      className={cn(
        sidebarGhostButtonClass,
        "h-auto min-h-8 justify-start gap-2.5 px-2.5 py-1.5 text-left text-[13px] font-normal",
        collapsed && "justify-center px-0",
      )}
    >
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{item.name}</span>
            <span className="block truncate text-xs text-zinc-500">{item.description}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
            {item.alert && <PermissionFlag title={item.alert.title} />}
            {item.count}
          </span>
        </>
      )}
    </Button>
  );

  if (!collapsed) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{item.name}</TooltipContent>
    </Tooltip>
  );
}

function ActionSidebarItem({
  item,
  active,
  collapsed,
  onSelect,
}: {
  item: AgentNavItem;
  active: boolean;
  collapsed: boolean;
  onSelect: () => void;
}) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      data-active={active ? "true" : undefined}
      onClick={onSelect}
      className={cn(
        sidebarGhostButtonClass,
        "h-8 justify-start gap-2 px-3 text-left text-[13px] font-normal",
        collapsed && "justify-center px-0",
      )}
    >
      {collapsed ? (
        item.kind === "dashboard" ? (
          <LayoutDashboard className="size-4" />
        ) : item.kind === "new-orchestrator" ? (
          <SquarePen className="size-4" />
        ) : (
          <span className="text-xs font-medium">{item.name.slice(0, 1)}</span>
        )
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
            {item.alert && <PermissionFlag title={item.alert.title} />}
            {item.count > 0 ? item.count : ""}
          </span>
        </>
      )}
    </Button>
  );

  if (!collapsed) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{item.name}</TooltipContent>
    </Tooltip>
  );
}

function ThreadSidebarItem({
  item,
  active,
  collapsed,
  onSelect,
  onArchiveThread,
}: {
  item: AgentNavItem;
  active: boolean;
  collapsed: boolean;
  onSelect: () => void;
  onArchiveThread?: (item: AgentNavItem) => void;
}) {
  const state = getThreadState(item, active);
  const hoverPreviewTimerRef = useRef<number | null>(null);
  const [rowHovered, setRowHovered] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    return () => {
      clearPreviewDelay();
    };
  }, []);

  function clearPreviewDelay() {
    if (hoverPreviewTimerRef.current) {
      window.clearTimeout(hoverPreviewTimerRef.current);
      hoverPreviewTimerRef.current = null;
    }
  }

  function showPreview(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const previewTop = Math.min(Math.max(rect.top, 8), Math.max(window.innerHeight - 132, 8));
    setPreviewPosition({
      top: previewTop,
      left: rect.right + 6,
    });
  }

  function schedulePreview(target: HTMLElement) {
    clearPreviewDelay();
    hoverPreviewTimerRef.current = window.setTimeout(() => {
      showPreview(target);
      hoverPreviewTimerRef.current = null;
    }, 1500);
  }

  function hidePreview() {
    clearPreviewDelay();
    setRowHovered(false);
    setPreviewPosition(null);
  }

  function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
    setRowHovered(true);
    schedulePreview(event.currentTarget);
  }

  function handlePointerLeave() {
    hidePreview();
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    setRowHovered(true);
    schedulePreview(event.currentTarget);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      hidePreview();
    }
  }

  const button = (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      data-active={active ? "true" : undefined}
      onClick={onSelect}
      className={cn(
        sidebarGhostButtonClass,
        "h-[34px] justify-start gap-2 px-3 pr-4 text-left text-[13px] font-normal",
        rowHovered && "pr-14",
        collapsed && "justify-center px-0",
      )}
    >
      {collapsed ? (
        <MessageSquareText className="size-3.5" />
      ) : (
        <>
          {state.blocked && (
            <AlertCircle className="size-4 shrink-0 text-red-400" />
          )}
          <span className="min-w-0 flex-1 truncate text-[13px] leading-none text-zinc-200">
            {item.name}
          </span>
          {state.showPill && <ThreadStatePill state={state} hidden={rowHovered} />}
          {state.hasRightIndicator && (
            <span
              className={cn(
                "flex shrink-0 items-center justify-end gap-1 text-xs leading-none text-zinc-500",
                rowHovered && "hidden",
              )}
            >
              {item.alert && <PermissionFlag title={item.alert.title} />}
              <ThreadRightIndicator state={state} timeLabel={item.timeLabel} />
            </span>
          )}
        </>
      )}
    </Button>
  );

  if (!collapsed) {
    return (
      <div
        className="relative"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {button}
        <ThreadHoverActions
          item={item}
          visible={rowHovered}
          onOpen={onSelect}
          onArchive={onArchiveThread}
        />
        {previewPosition && (
          <div
            className="pointer-events-none fixed z-50 w-[320px] rounded-md border border-white/[0.08] bg-[#272727]/95 p-0 text-zinc-100 shadow-[0_18px_55px_rgba(0,0,0,0.42)] backdrop-blur-xl"
            style={{ top: previewPosition.top, left: previewPosition.left }}
          >
            <ThreadHoverPreview item={item} />
          </div>
        )}
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{item.name}</TooltipContent>
    </Tooltip>
  );
}

function ThreadHoverActions({
  item,
  visible,
  onOpen,
  onArchive,
}: {
  item: AgentNavItem;
  visible: boolean;
  onOpen: () => void;
  onArchive?: (item: AgentNavItem) => void;
}) {
  const canArchive = Boolean(item.threadId && item.archivable);

  function handleOpen(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onOpen();
  }

  function handleArchive(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!canArchive || !onArchive) {
      return;
    }
    onArchive(item);
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute right-1.5 top-1/2 z-10 -translate-y-1/2 items-center gap-0.5",
        visible ? "flex" : "hidden",
      )}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        type="button"
        aria-label="Thread"
        onClick={handleOpen}
        className="pointer-events-auto size-5 rounded-[5px] border-transparent bg-transparent text-zinc-400 shadow-none transition-colors hover:bg-transparent hover:text-zinc-100 focus-visible:bg-transparent focus-visible:ring-2 focus-visible:ring-sky-500/40"
      >
        <MessageSquareText className="size-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        type="button"
        aria-label={canArchive ? "Archive" : "Archive unavailable"}
        aria-disabled={!canArchive}
        onClick={handleArchive}
        className={cn(
          "pointer-events-auto size-5 rounded-[5px] border-transparent bg-transparent text-zinc-400 shadow-none transition-colors hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-2 focus-visible:ring-sky-500/40",
          canArchive
            ? "hover:text-zinc-100"
            : "cursor-default opacity-40",
        )}
      >
        <Archive className="size-3" />
      </Button>
    </div>
  );
}

function ThreadHoverPreview({ item }: { item: AgentNavItem }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <div className="flex min-w-0 items-baseline gap-2">
        <div className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-zinc-50">
          {item.name}
        </div>
        {item.timeLabel && (
          <div className="shrink-0 text-xs tabular-nums leading-none text-zinc-500">
            {item.timeLabel}
          </div>
        )}
      </div>
      <div className="mt-3 space-y-2">
        <ThreadHoverPreviewRow icon="folder" label={item.projectName ?? "All projects"} />
        <ThreadHoverPreviewRow icon="branch" label={item.workspaceLabel ?? "workspace"} />
      </div>
    </div>
  );
}

function ThreadHoverPreviewRow({
  icon,
  label,
}: {
  icon: "folder" | "branch";
  label: string;
}) {
  const Icon = icon === "folder" ? Folder : GitBranch;
  return (
    <div className="flex min-w-0 items-center gap-2 text-[13px] leading-none text-zinc-300">
      <Icon className="size-3.5 shrink-0 text-zinc-500" />
      <span className="min-w-0 truncate">{label}</span>
    </div>
  );
}

function SidebarHeaderActions({
  activeThreadTab,
  organization,
  onOrganizationChange,
  sort,
  onSortChange,
  onArchiveAllThreads,
  onOpenImplementation,
  onNewOrchestration,
  onOpenSettings,
  projects,
  onToggleProjectEnabled,
}: {
  activeThreadTab: SidebarThreadTab;
  organization: SidebarOrganization;
  onOrganizationChange: (organization: SidebarOrganization) => void;
  sort: ThreadSort;
  onSortChange: (sort: ThreadSort) => void;
  onArchiveAllThreads: () => void;
  onOpenImplementation: () => void;
  onNewOrchestration: () => void;
  onOpenSettings: () => void;
  projects: BrainProject[];
  onToggleProjectEnabled: (project: BrainProject, enabled: boolean) => void;
}) {
  const menuItemClass = "h-9 gap-2.5 px-2.5 text-[13px] text-zinc-200 focus:bg-white/[0.08] focus:text-zinc-50 [&_svg]:text-zinc-400";
  const menuRadioClass = "h-9 gap-2.5 px-2.5 pr-8 text-[13px] text-zinc-200 focus:bg-white/[0.08] focus:text-zinc-50 [&_svg]:text-zinc-400";
  const subContentClass = "min-w-[210px] border border-white/[0.08] bg-[#252525]/98 p-1 text-zinc-200 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl";

  return (
    <div className="flex shrink-0 items-center gap-1 text-zinc-500">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="More"
            className={sidebarIconGhostButtonClass}
          >
            <MoreHorizontal className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[236px] border border-white/[0.08] bg-[#252525]/98 p-1 text-zinc-200 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <DropdownMenuItem className={menuItemClass} onSelect={onArchiveAllThreads}>
            <Archive className="size-4" />
            <span>Archive all threads</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/[0.08]" />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={menuItemClass}>
              <Folder className="size-4" />
              <span>Active projects</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={subContentClass}>
              {projects.length === 0 ? (
                <DropdownMenuItem className={menuItemClass} disabled>
                  <span>No projects</span>
                </DropdownMenuItem>
              ) : (
                projects.map((project) => (
                  <DropdownMenuCheckboxItem
                    key={project.id}
                    className={menuRadioClass}
                    checked={project.enabled}
                    onCheckedChange={(checked) => onToggleProjectEnabled(project, Boolean(checked))}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <span className="min-w-0 flex-1 truncate">{project.name}</span>
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={menuItemClass}>
              <Folder className="size-4" />
              <span>Organize sidebar</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={subContentClass}>
              <DropdownMenuRadioGroup
                value={organization}
                onValueChange={(value) => onOrganizationChange(value as SidebarOrganization)}
              >
                <DropdownMenuRadioItem className={menuRadioClass} value="by-projects">
                  <Folder className="size-4" />
                  <span>By Projects</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem className={menuRadioClass} value="chronological-list">
                  <Clock className="size-4" />
                  <span>Chronological List</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem className={menuRadioClass} value="worktree">
                  <GitBranch className="size-4" />
                  <span>WorkTree</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={menuItemClass}>
              <Clock className="size-4" />
              <span>Sort by</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={subContentClass}>
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={(value) => onSortChange(value as ThreadSort)}
              >
                <DropdownMenuRadioItem className={menuRadioClass} value="createdAt">
                  <CirclePlus className="size-4" />
                  <span>Created At</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem className={menuRadioClass} value="updatedAt">
                  <PenLine className="size-4" />
                  <span>Updated At</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onOpenSettings}
            className={sidebarIconGhostButtonClass}
          >
            <FolderPlus className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Projects</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={activeThreadTab === "orchestrator" ? onNewOrchestration : onOpenImplementation}
            className={sidebarIconGhostButtonClass}
          >
            <SquarePen className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{activeThreadTab === "orchestrator" ? "New orchestration" : "New implementation"}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function PermissionFlag({ title }: { title: string }) {
  return (
    <span title={title} aria-label={title} className="inline-flex size-4 items-center justify-center rounded-full bg-red-500/15 text-red-300">
      <Flag className="size-3 fill-red-400/20" />
    </span>
  );
}

type ThreadStateTone = "neutral" | "running" | "success" | "warning" | "danger";

interface ThreadState {
  label: string;
  tone: ThreadStateTone;
  busy: boolean;
  done: boolean;
  unread: boolean;
  blocked: boolean;
  showPill: boolean;
  hasRightIndicator: boolean;
}

function getThreadState(item: AgentNavItem, active: boolean): ThreadState {
  const status = item.status;
  const awaitingResponse = Boolean(item.alert);
  const running = ["implementing", "reviewing", "picked", "started", "stale-started", "running"].includes(status);
  const done = item.completed ?? ["done", "approved"].includes(status);
  const unread = done && Boolean(item.unread) && !active;
  const blocked = ["blocked", "attention", "error"].includes(status);
  const waitingReview = ["waiting-review", "submitted"].includes(status);
  const landing = status === "landing";

  if (awaitingResponse) {
    return {
      label: "Awaiting response",
      tone: "running",
      busy: true,
      done: false,
      unread: false,
      blocked: false,
      showPill: false,
      hasRightIndicator: true,
    };
  }

  if (running) {
    return {
      label: "Running",
      tone: "running",
      busy: true,
      done: false,
      unread: false,
      blocked: false,
      showPill: false,
      hasRightIndicator: true,
    };
  }

  if (blocked) {
    return {
      label: "Needs attention",
      tone: "danger",
      busy: false,
      done: false,
      unread: false,
      blocked: true,
      showPill: false,
      hasRightIndicator: true,
    };
  }

  if (done) {
    return {
      label: "",
      tone: "success",
      busy: false,
      done: true,
      unread,
      blocked: false,
      showPill: false,
      hasRightIndicator: unread || Boolean(item.timeLabel),
    };
  }

  if (landing) {
    return {
      label: "Landing",
      tone: "warning",
      busy: true,
      done: false,
      unread: false,
      blocked: false,
      showPill: false,
      hasRightIndicator: true,
    };
  }

  if (waitingReview) {
    return {
      label: "",
      tone: "warning",
      busy: false,
      done: false,
      unread: false,
      blocked: false,
      showPill: false,
      hasRightIndicator: Boolean(item.timeLabel),
    };
  }

  return {
    label: "",
    tone: "neutral",
    busy: false,
    done: false,
    unread: false,
    blocked: false,
    showPill: false,
    hasRightIndicator: Boolean(item.timeLabel),
  };
}

function ThreadStatePill({ state, hidden }: { state: ThreadState; hidden?: boolean }) {
  return (
    <span
      className={cn(
        "max-w-[154px] shrink-0 truncate rounded-full px-2 py-1 text-[13px] font-medium leading-none",
        hidden && "hidden",
        state.tone === "running" && "bg-emerald-500/20 text-emerald-300",
        state.tone === "success" && "bg-sky-500/15 text-sky-300",
        state.tone === "warning" && "bg-amber-500/15 text-amber-300",
        state.tone === "danger" && "bg-red-500/15 text-red-300",
        state.tone === "neutral" && "bg-white/[0.07] text-zinc-400",
      )}
      title={state.label}
    >
      {state.label}
    </span>
  );
}

function ThreadRightIndicator({ state, timeLabel }: { state: ThreadState; timeLabel?: string }) {
  if (state.busy) {
    return <Circle className="size-4 animate-spin fill-transparent text-zinc-500" />;
  }

  if (state.done && state.unread) {
    return <span className="size-2 rounded-full bg-sky-400" aria-label="Completed" />;
  }

  if (state.blocked) {
    return timeLabel ? <span className="tabular-nums">{timeLabel}</span> : null;
  }

  return timeLabel ? <span className="tabular-nums">{timeLabel}</span> : null;
}
