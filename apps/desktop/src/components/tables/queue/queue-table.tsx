import { useState, useMemo } from "react";
import type { BrainProject, QueueItem } from "@brain-loop/brain-core";
import { AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RuntimeQueueItem = QueueItem & {
  lease?: {
    owner?: string | null;
    sessionId?: string | null;
    pid?: number | null;
    startedAt?: string | null;
    lastHeartbeatAt?: string | null;
    expiresAt?: string | null;
  };
};

interface QueueTableProps {
  items: QueueItem[];
  projects: BrainProject[];
  isLoading: boolean;
  error?: string | null;
}

const staleActiveMinutes = 30;
const activeStatuses = new Set(["picked", "started", "stale-started"]);

function getTimestampMs(value: string | null | undefined) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function getAgeMinutes(value: string | null | undefined) {
  const ms = getTimestampMs(value);
  if (ms === null) return null;
  return Math.floor((Date.now() - ms) / 60000);
}

function isStaleCandidate(item: QueueItem) {
  const status = item.status as string;
  if (status === "stale-started") return true;
  if (!activeStatuses.has(status)) return false;

  const ageMinutes = getAgeMinutes(item.agentStartedAt ?? item.pickedAt ?? item.createdAt);
  return ageMinutes !== null && ageMinutes >= staleActiveMinutes;
}

function getItemProject(item: QueueItem, projects: BrainProject[]) {
  return projects.find(
    (project) => project.id === item.projectId || project.path === item.projectPath,
  );
}

function fieldValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "None";
  return String(value);
}

function formatAge(item: QueueItem) {
  const ageMinutes = getAgeMinutes(item.agentStartedAt ?? item.pickedAt ?? item.createdAt);
  if (ageMinutes === null) return "Unknown";
  if (ageMinutes < 60) return `${ageMinutes}m`;
  return `${Math.floor(ageMinutes / 60)}h ${ageMinutes % 60}m`;
}

export function QueueTable({ items, projects, isLoading, error }: QueueTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [staleFilter, setStaleFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);

  const projectOptions = useMemo(() => {
    const ids = new Set(items.map((item) => item.projectId).filter(Boolean));
    return Array.from(ids).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (agentFilter !== "all" && item.agent !== agentFilter) return false;
      if (projectFilter !== "all" && item.projectId !== projectFilter) return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      if (staleFilter === "stale" && !isStaleCandidate(item)) return false;
      if (staleFilter === "fresh" && isStaleCandidate(item)) return false;
      return true;
    });
  }, [items, statusFilter, agentFilter, projectFilter, priorityFilter, staleFilter]);

  const summary = useMemo(() => {
    return {
      active: items.filter((item) => activeStatuses.has(item.status as string)).length,
      blocked: items.filter((item) => item.status === "blocked").length,
      stale: items.filter(isStaleCandidate).length,
      submitted: items.filter((item) => item.status === "submitted").length,
      approved: items.filter((item) => item.status === "approved").length,
    };
  }, [items]);

  const warnings = useMemo(() => {
    return items
      .map((item) => {
        const project = getItemProject(item, projects);
        const stale = isStaleCandidate(item);
        const disabled = project?.enabled === false;
        const unknownProject = projects.length > 0 && !project;

        if (!stale && !disabled && !unknownProject) return null;

        return {
          id: item.id,
          label: item.projectId ?? item.id,
          stale,
          disabled,
          unknownProject,
          age: formatAge(item),
        };
      })
      .filter((warning): warning is NonNullable<typeof warning> => warning !== null);
  }, [items, projects]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-md" />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Queue unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <QueueMetric title="Active" value={summary.active} />
        <QueueMetric title="Blocked" value={summary.blocked} />
        <QueueMetric title="Stale" value={summary.stale} />
        <QueueMetric title="Submitted" value={summary.submitted} />
        <QueueMetric title="Approved" value={summary.approved} />
      </div>

      {warnings.length > 0 && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>Queue warnings</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {warnings.slice(0, 5).map((warning) => (
                <div key={warning.id} className="text-xs">
                  <span className="font-medium">{warning.label}</span>
                  {warning.stale && <span> has stale active work ({warning.age})</span>}
                  {warning.disabled && <span> is assigned to a disabled project</span>}
                  {warning.unknownProject && <span> is not matched to a registered project</span>}
                </div>
              ))}
              {warnings.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  {warnings.length - 5} more warnings hidden by the compact view.
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="picked">Picked</SelectItem>
            <SelectItem value="started">Started</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="reviewed-fix-request">Fix Request</SelectItem>
            <SelectItem value="landing">Landing</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="stale-started">Stale Started</SelectItem>
          </SelectContent>
        </Select>

        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            <SelectItem value="open-code">Open Code</SelectItem>
            <SelectItem value="antigravity">Antigravity</SelectItem>
            <SelectItem value="codex">Codex</SelectItem>
          </SelectContent>
        </Select>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projectOptions.map((projectId) => (
              <SelectItem key={projectId} value={projectId}>
                {projectId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={staleFilter} onValueChange={setStaleFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Stale work" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ages</SelectItem>
            <SelectItem value="stale">Stale Active</SelectItem>
            <SelectItem value="fresh">Not Stale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Warning</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No queue items found.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.projectId ?? "Global"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      item.status === "approved" ? "default" :
                      item.status === "blocked" ? "destructive" :
                      item.status === "queued" ? "secondary" : "outline"
                    }>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.agent}</TableCell>
                  <TableCell>{item.priority}</TableCell>
                  <TableCell>{formatAge(item)}</TableCell>
                  <TableCell>
                    {isStaleCandidate(item) && (
                      <Badge variant="outline">Stale</Badge>
                    )}
                    {getItemProject(item, projects)?.enabled === false && (
                      <Badge variant="destructive">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                          Details
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Queue Item Details</SheetTitle>
                          <SheetDescription>
                            {item.id}
                          </SheetDescription>
                        </SheetHeader>
                        {selectedItem && selectedItem.id === item.id && (
                          <div className="mt-6 space-y-4 text-sm">
                            <div className="grid grid-cols-3 gap-2 border-b pb-4">
                              <div className="font-semibold">Project ID</div>
                              <div className="col-span-2">{fieldValue(item.projectId)}</div>
                              <div className="font-semibold">Project Path</div>
                              <div className="col-span-2 break-all">{fieldValue(item.projectPath)}</div>
                              <div className="font-semibold">Execution Path</div>
                              <div className="col-span-2 break-all">{fieldValue(item.executionPath)}</div>
                              <div className="font-semibold">Worktree Path</div>
                              <div className="col-span-2 break-all">{fieldValue(item.worktreePath)}</div>
                              <div className="font-semibold">Handoff Path</div>
                              <div className="col-span-2 break-all">{fieldValue(item.handoffPath)}</div>
                              <div className="font-semibold">Active Handoff Path</div>
                              <div className="col-span-2 break-all">{fieldValue(item.activeHandoffPath)}</div>
                              <div className="font-semibold">Review Path</div>
                              <div className="col-span-2 break-all">{fieldValue(item.reviewPath)}</div>
                              <div className="font-semibold">Plan Path</div>
                              <div className="col-span-2 break-all">{fieldValue(item.planPath)}</div>
                              <div className="font-semibold">Runner</div>
                              <div className="col-span-2 break-all">{fieldValue(item.runnerId)}</div>
                              <div className="font-semibold">Session</div>
                              <div className="col-span-2 break-all">{fieldValue(item.sessionId)}</div>
                              <div className="font-semibold">Lease</div>
                              <div className="col-span-2 break-all">
                                {formatLease(item as RuntimeQueueItem)}
                              </div>
                              <div className="font-semibold">Last Error</div>
                              <div className="col-span-2 break-all">{fieldValue(item.lastError)}</div>
                            </div>
                            
                            {item.lastError ? (
                              <div className="text-destructive">
                                <div className="font-semibold mb-1">Last Error</div>
                                <div className="bg-destructive/10 p-2 rounded whitespace-pre-wrap font-mono text-xs">
                                  {item.lastError}
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground">
                                <div className="font-semibold mb-1">Last Error</div>
                                <div className="bg-muted p-2 rounded font-mono text-xs">None</div>
                              </div>
                            )}

                            <div>
                              <div className="font-semibold mb-2">History</div>
                              <div className="space-y-3">
                                {item.history?.map((h, i) => (
                                  <div key={i} className="text-xs border-l-2 pl-3 py-1">
                                    <div className="text-muted-foreground">{new Date(h.at).toLocaleString()}</div>
                                    <div className="font-medium">{h.status || h.event} <span className="font-normal text-muted-foreground">by {h.by}</span></div>
                                    {h.note && <div className="mt-1">{h.note}</div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function QueueMetric({ title, value }: { title: string; value: number }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="text-xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function formatLease(item: RuntimeQueueItem) {
  if (!item.lease) return "None";

  const parts = [
    `owner: ${fieldValue(item.lease.owner)}`,
    `session: ${fieldValue(item.lease.sessionId)}`,
    `pid: ${fieldValue(item.lease.pid)}`,
    `started: ${fieldValue(item.lease.startedAt)}`,
    `heartbeat: ${fieldValue(item.lease.lastHeartbeatAt)}`,
    `expires: ${fieldValue(item.lease.expiresAt)}`,
  ];

  return parts.join(" | ");
}
