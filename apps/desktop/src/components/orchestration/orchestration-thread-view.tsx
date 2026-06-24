import { useEffect, useState, type FormEvent } from "react";
import type { BrainProject, OrchestrationThread, QueueItem } from "@brain-loop/brain-core";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ThreadMessage } from "@/components/thread-workspace/thread-workspace";
import { formatQueueThreadTitle } from "@/lib/queue-display";
import { orchestrationHandoffBody } from "@/lib/orchestration-display";
import { AlertCircle, CornerDownRight, FileText, Info, Send, Sparkles } from "lucide-react";

export function OrchestrationThreadView({
  orchestration,
  linkedQueueItems,
  queueError,
  projects,
  onAppendMessage,
  onUpdateProject,
  onHandoff,
  onOpenWorker,
}: {
  orchestration: OrchestrationThread;
  linkedQueueItems: QueueItem[];
  queueError: string | null;
  projects: BrainProject[];
  onAppendMessage: (thread: OrchestrationThread, body: string) => Promise<OrchestrationThread>;
  onUpdateProject: (thread: OrchestrationThread, projectId: string) => Promise<OrchestrationThread>;
  onHandoff: (thread: OrchestrationThread, taskTitle: string, taskBody: string) => Promise<unknown>;
  onOpenWorker: (queueItemId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [taskTitle, setTaskTitle] = useState(orchestration.title);
  const [handoffBusy, setHandoffBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);
  const [projectBusy, setProjectBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const project = projects.find((candidate) => candidate.id === orchestration.projectId);
  const hasRegisteredProject = Boolean(project);
  const canHandoff = hasRegisteredProject && Boolean(orchestration.projectPath.trim());
  const handoffBody = orchestrationHandoffBody(orchestration);

  useEffect(() => {
    setDraft("");
    setTaskTitle(orchestration.title);
    setError(null);
  }, [orchestration.id, orchestration.title]);

  function handleMessageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) {
      return;
    }
    setMessageBusy(true);
    setError(null);
    void onAppendMessage(orchestration, body)
      .then(() => setDraft(""))
      .catch((e) => setError(String(e)))
      .finally(() => setMessageBusy(false));
  }

  function handleHandoff() {
    if (!canHandoff) {
      setError("Select a registered project before handing off this orchestration.");
      return;
    }
    const title = taskTitle.trim() || orchestration.title;
    const body = handoffBody || `Implement the work described by orchestration ${orchestration.title}.`;
    setHandoffBusy(true);
    setError(null);
    void onHandoff(orchestration, title, body)
      .catch((e) => setError(String(e)))
      .finally(() => setHandoffBusy(false));
  }

  function handleProjectChange(projectId: string) {
    if (projectId === orchestration.projectId) {
      return;
    }
    setProjectBusy(true);
    setError(null);
    void onUpdateProject(orchestration, projectId)
      .catch((e) => setError(String(e)))
      .finally(() => setProjectBusy(false));
  }

  return (
    <section className="flex min-h-screen min-w-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 pt-12">
        <div className="mx-auto flex max-w-[820px] flex-col gap-4">
          {queueError && (
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Orchestration warning</AlertTitle>
              <AlertDescription>{queueError}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Orchestration action failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-zinc-100">{orchestration.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>{orchestration.projectName}</span>
                <span>·</span>
                <span>{orchestration.originAgent}</span>
                <span>·</span>
                <span>{orchestration.status}</span>
                {project && !project.enabled && (
                  <>
                    <span>·</span>
                    <span className="text-amber-300">project disabled</span>
                  </>
                )}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleHandoff}
              disabled={handoffBusy || !canHandoff}
              className="gap-2"
            >
              <CornerDownRight className="size-4" />
              Handoff
            </Button>
          </div>

          <div className="rounded-md border border-white/[0.06] bg-white/[0.025] p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
              <Input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                className="h-9 border-white/[0.08] bg-black/20 text-sm text-zinc-100"
                placeholder="Task title for handoff"
              />
              <Select
                value={orchestration.projectId}
                onValueChange={handleProjectChange}
                disabled={projectBusy || projects.length === 0}
              >
                <SelectTrigger className="h-9 min-w-[190px] border-white/[0.08] bg-black/20 text-sm text-zinc-100">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-[#252525] text-zinc-100">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}{project.enabled ? "" : " (disabled)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{linkedQueueItems.length} queued</span>
              </div>
            </div>
            {!hasRegisteredProject && (
              <div className="mt-2 text-xs leading-5 text-amber-300">
                Select a registered project before handoff. External-agent imports can register missing projects disabled by default.
              </div>
            )}
          </div>

          <div className="space-y-5">
            {orchestration.messages.length === 0 ? (
              <ThreadMessage
                role="system"
                label="Brain Loop"
                body="Add intake notes here, then hand off when the plan is ready."
              />
            ) : (
              orchestration.messages.map((message) => (
                <ThreadMessage
                  key={message.id}
                  role={message.role}
                  label={message.role === "user" ? "You" : message.agent ?? "Orchestrator"}
                  body={message.body}
                  createdAt={message.createdAt}
                  provider={message.agent ?? orchestration.originAgent}
                  model={message.model ?? orchestration.model ?? undefined}
                />
              ))
            )}
          </div>

          {linkedQueueItems.length > 0 && (
            <div className="space-y-2">
              {linkedQueueItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  type="button"
                  onClick={() => onOpenWorker(item.id)}
                  className="h-auto w-full justify-between gap-3 rounded-md border-transparent bg-white/[0.035] px-3.5 py-3 text-left text-sm font-normal text-zinc-200 shadow-none transition-colors hover:bg-white/[0.06] hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-sky-500/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{formatQueueThreadTitle(item)}</span>
                    <span className="mt-1 block truncate text-xs text-zinc-500">{item.status} · {item.id}</span>
                  </span>
                  <FileText className="size-4 shrink-0 text-zinc-500" />
                </Button>
              ))}
            </div>
          )}

          <form onSubmit={handleMessageSubmit} className="sticky bottom-0 mt-2 rounded-md border border-white/[0.06] bg-[#191919]/95 p-2.5 shadow-[0_-18px_40px_rgba(0,0,0,0.24)] backdrop-blur">
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Refine intake or add implementation notes"
                className="min-h-[46px] resize-none border-white/[0.08] bg-black/20 text-sm text-zinc-100 placeholder:text-zinc-600"
                disabled={messageBusy}
              />
              <Button
                type="submit"
                size="icon"
                className="size-9 shrink-0"
                disabled={messageBusy || !draft.trim()}
                title="Add orchestration message"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
