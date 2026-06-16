import { useMemo, useState } from "react";
import type { BrainProject, QueueItem } from "@brain-loop/brain-core";
import {
  createProject,
  setProjectEnabled,
  updateProject,
} from "@brain-loop/desktop-client";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EditableProject = Omit<BrainProject, "pathExists">;

interface ProjectTableProps {
  projects: BrainProject[];
  queueItems: QueueItem[];
  isLoading: boolean;
  error?: string | null;
  onChanged: () => Promise<void> | void;
}

const activeQueueStatuses = new Set([
  "picked",
  "started",
  "stale-started",
  "submitted",
  "reviewing",
  "reviewed-fix-request",
  "landing",
]);

const emptyProject: EditableProject = {
  id: "",
  name: "",
  path: "",
  enabled: true,
  defaultAgent: "open-code",
  reviewIntervalMinutes: 2,
  implementationIntervalMinutes: 2,
  priority: "medium",
  autoMergeOnReviewPass: false,
};

function toEditableProject(project: BrainProject): EditableProject {
  return {
    id: project.id,
    name: project.name,
    path: project.path,
    enabled: project.enabled,
    defaultAgent: project.defaultAgent,
    reviewIntervalMinutes: project.reviewIntervalMinutes,
    implementationIntervalMinutes: project.implementationIntervalMinutes,
    priority: project.priority,
    autoMergeOnReviewPass: project.autoMergeOnReviewPass ?? false,
  };
}

function countActiveQueue(project: BrainProject, queueItems: QueueItem[]) {
  return queueItems.filter((item) => {
    return (
      activeQueueStatuses.has(item.status as string) &&
      (item.projectId === project.id || item.projectPath === project.path)
    );
  }).length;
}

function validateProject(project: EditableProject) {
  if (!project.id.trim()) return "Project id is required.";
  if (!project.name.trim()) return "Project name is required.";
  if (!project.path.trim()) return "Project path is required.";
  if (
    project.reviewIntervalMinutes < 1 ||
    project.implementationIntervalMinutes < 1
  ) {
    return "Intervals must be at least 1 minute.";
  }
  return null;
}

export function ProjectTable({
  projects,
  queueItems,
  isLoading,
  error,
  onChanged,
}: ProjectTableProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<EditableProject>(emptyProject);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmProject, setConfirmProject] = useState<BrainProject | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const summary = useMemo(() => {
    return {
      enabled: projects.filter((project) => project.enabled).length,
      disabled: projects.filter((project) => !project.enabled).length,
      missingPaths: projects.filter((project) => project.pathExists === false)
        .length,
      activeDisabled: projects.filter(
        (project) =>
          !project.enabled && countActiveQueue(project, queueItems) > 0,
      ).length,
    };
  }, [projects, queueItems]);

  function openCreateSheet() {
    setMode("create");
    setForm(emptyProject);
    setFormError(null);
    setActionError(null);
    setSheetOpen(true);
  }

  function openEditSheet(project: BrainProject) {
    setMode("edit");
    setForm(toEditableProject(project));
    setFormError(null);
    setActionError(null);
    setSheetOpen(true);
  }

  async function submitForm() {
    const validationError = validateProject(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setActionError(null);

    try {
      if (mode === "create") {
        await createProject(form);
      } else {
        await updateProject(form);
      }
      setSheetOpen(false);
      await onChanged();
    } catch (e) {
      setFormError(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleProject(project: BrainProject) {
    setIsSaving(true);
    setActionError(null);

    try {
      await setProjectEnabled(project.id, !project.enabled);
      setConfirmProject(null);
      await onChanged();
    } catch (e) {
      setActionError(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-md" />
          ))}
        </div>
        <Card className="gap-0 overflow-hidden rounded-md py-0 shadow-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Landing</TableHead>
                <TableHead>Path</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-52" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Projects unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Project update failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {summary.missingPaths > 0 || summary.activeDisabled > 0 ? (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>Project warnings</AlertTitle>
          <AlertDescription>
            {summary.missingPaths > 0 && (
              <span>{summary.missingPaths} project paths are missing. </span>
            )}
            {summary.activeDisabled > 0 && (
              <span>
                {summary.activeDisabled} disabled projects still have active
                queue items.
              </span>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProjectMetric title="Enabled" value={summary.enabled} />
        <ProjectMetric title="Disabled" value={summary.disabled} />
        <ProjectMetric title="Missing Paths" value={summary.missingPaths} />
        <ProjectMetric title="Active Disabled" value={summary.activeDisabled} />
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={openCreateSheet}>
          Add Project
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden rounded-md py-0 shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Intervals</TableHead>
              <TableHead>Landing</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Warnings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No registered projects found.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => {
                const activeCount = countActiveQueue(project, queueItems);
                const isConfirming = confirmProject?.id === project.id;

                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {project.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={project.enabled ? "default" : "secondary"}
                      >
                        {project.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.defaultAgent}</TableCell>
                    <TableCell>{project.priority}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        Review {project.reviewIntervalMinutes}m
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Implementation {project.implementationIntervalMinutes}m
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          project.autoMergeOnReviewPass
                            ? "default"
                            : "secondary"
                        }
                      >
                        {project.autoMergeOnReviewPass
                          ? "Auto merge"
                          : "Request merge"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] break-all text-xs">
                      {project.path}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {project.pathExists === false && (
                          <Badge variant="destructive">Missing path</Badge>
                        )}
                        {!project.enabled && activeCount > 0 && (
                          <Badge variant="outline">
                            Active queue {activeCount}
                          </Badge>
                        )}
                        {project.pathExists !== false &&
                          (project.enabled || activeCount === 0) && (
                            <Badge variant="outline">
                              <CheckCircle2 className="mr-1 size-3" />
                              Clear
                            </Badge>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isConfirming ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isSaving}
                            onClick={() => void toggleProject(project)}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isSaving}
                            onClick={() => setConfirmProject(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEditSheet(project)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              project.enabled ? "destructive" : "secondary"
                            }
                            onClick={() => setConfirmProject(project)}
                          >
                            {project.enabled ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[420px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {mode === "create" ? "Add Project" : "Edit Project"}
            </SheetTitle>
            <SheetDescription>
              Update the project registry stored in Brain JSON.
            </SheetDescription>
          </SheetHeader>

          <Form
            className="space-y-4 px-4 pb-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitForm();
            }}
          >
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Validation failed</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <ProjectField
              label="Project ID"
              value={form.id}
              disabled={mode === "edit"}
              onChange={(value) =>
                setForm((current) => ({ ...current, id: value }))
              }
            />
            <ProjectField
              label="Name"
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
            />
            <ProjectField
              label="Path"
              value={form.path}
              onChange={(value) =>
                setForm((current) => ({ ...current, path: value }))
              }
            />

            <FormItem>
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Default Agent
              </Label>
              <Select
                value={form.defaultAgent}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    defaultAgent: value as BrainProject["defaultAgent"],
                  }))
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="open-code">Open Code</SelectItem>
                  <SelectItem value="antigravity">Antigravity</SelectItem>
                  <SelectItem value="codex">Codex</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Priority
              </Label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    priority: value as BrainProject["priority"],
                  }))
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            <div className="grid gap-3 sm:grid-cols-2">
              <ProjectField
                label="Review Interval"
                type="number"
                value={String(form.reviewIntervalMinutes)}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    reviewIntervalMinutes: Number(value),
                  }))
                }
              />
              <ProjectField
                label="Implementation Interval"
                type="number"
                value={String(form.implementationIntervalMinutes)}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    implementationIntervalMinutes: Number(value),
                  }))
                }
              />
            </div>

            <Label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.enabled}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    enabled: checked === true,
                  }))
                }
              />
              Enabled for automation
            </Label>

            <Label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.autoMergeOnReviewPass ?? false}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    autoMergeOnReviewPass: checked === true,
                  }))
                }
              />
              Auto merge when review passes
            </Label>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                onClick={() => setSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="secondary" disabled={isSaving}>
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProjectMetric({ title, value }: { title: string; value: number }) {
  return (
    <Card className="rounded-md py-3 shadow-none">
      <CardHeader className="px-3 pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-0">
        <div className="text-xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function ProjectField({
  label,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <FormItem>
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <FormControl>
        <Input
          disabled={disabled}
          min={type === "number" ? 1 : undefined}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </FormControl>
    </FormItem>
  );
}
