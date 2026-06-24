import { useEffect, useState, type FormEvent } from "react";
import type { BrainProject, OrchestrationThread } from "@brain-loop/brain-core";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  AlertCircle,
  Folder,
  FolderOpen,
  FileText,
  GitBranch,
  Laptop,
  Mic,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  defaultOrchestratorModel,
  findOrchestratorModel,
  orchestratorModelGroups,
  orchestratorModelOptions,
  type OrchestratorModelOption,
} from "@/lib/orchestration-display";

export function OrchestrationStartView({
  projects,
  defaultModel,
  recentOrchestrations,
  onStart,
  onCreateProject,
  onOpenOrchestration,
}: {
  projects: BrainProject[];
  defaultModel?: string;
  recentOrchestrations: OrchestrationThread[];
  onStart: (body: string, projectId: string, orchestrator: OrchestratorModelOption) => Promise<OrchestrationThread>;
  onCreateProject: (mode: "scratch" | "existing") => Promise<BrainProject | null>;
  onOpenOrchestration: (orchestrationId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "unassigned");
  const [orchestratorModel, setOrchestratorModel] = useState(() =>
    findOrchestratorModel(defaultModel)?.model ?? defaultOrchestratorModel,
  );
  const [busy, setBusy] = useState(false);
  const [projectBusy, setProjectBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedProject = projects.find((project) => project.id === projectId) ?? projects[0];
  const selectedOrchestrator = findOrchestratorModel(orchestratorModel) ?? orchestratorModelOptions[0];
  const recentItems = recentOrchestrations.slice(0, 3);
  const suggestions = recentItems.length > 0
    ? recentItems.map((item) => ({
      id: item.id,
      label: item.title,
      detail: `${item.projectName} · ${item.status}`,
      onSelect: () => onOpenOrchestration(item.id),
    }))
    : [
      {
        id: "sidebar-regression",
        label: "Catch sidebar regressions before hover and ghost bugs come back",
        detail: "brain-loop · suggested",
        onSelect: () => setDraft("Catch sidebar regressions before hover and ghost bugs come back."),
      },
      {
        id: "provider-dispatch",
        label: "Smoke-test direct provider dispatch before queue state drifts",
        detail: "brain-loop · suggested",
        onSelect: () => setDraft("Smoke-test direct provider dispatch before queue state drifts."),
      },
      {
        id: "external-handoff",
        label: "Connect external handoffs to orchestration-linked workers",
        detail: "brain-loop · suggested",
        onSelect: () => setDraft("Connect external handoffs to orchestration-linked workers."),
      },
    ];

  useEffect(() => {
    if (projects.length === 0) {
      setProjectId("unassigned");
      return;
    }
    if (!projects.some((project) => project.id === projectId)) {
      setProjectId(projects[0]?.id ?? "unassigned");
    }
  }, [projectId, projects]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) {
      return;
    }
    if (!selectedProject) {
      setError("Choose or add a project before starting orchestration.");
      return;
    }
    setBusy(true);
    setError(null);
    void onStart(body, selectedProject.id, selectedOrchestrator)
      .then(() => setDraft(""))
      .catch((e) => setError(String(e)))
      .finally(() => setBusy(false));
  }

  function handleCreateProject(mode: "scratch" | "existing") {
    setProjectBusy(true);
    setError(null);
    void onCreateProject(mode)
      .then((project) => {
        if (project) {
          setProjectId(project.id);
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setProjectBusy(false));
  }

  return (
    <section className="flex min-h-screen min-w-0 flex-1 flex-col bg-[#141414] px-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[780px] flex-col justify-center pb-[14vh] pt-20">
        <h1 className="flex flex-wrap items-center justify-center gap-x-2 text-center text-[32px] font-normal leading-tight text-zinc-100">
          <span>What should we build in</span>
          <ProjectDropdown
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={setProjectId}
            onCreateProject={handleCreateProject}
            disabled={busy || projectBusy}
            trigger="title"
          />
          <span>?</span>
        </h1>

        <form onSubmit={handleSubmit} className="mt-10 overflow-hidden rounded-[18px] bg-[#272928] shadow-[0_24px_80px_rgba(0,0,0,0.34)] ring-1 ring-white/[0.045]">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Do anything"
            className="min-h-[92px] resize-none border-0 bg-transparent px-4 pt-4 text-base text-zinc-100 shadow-none outline-none placeholder:text-zinc-500 focus-visible:ring-0"
            disabled={busy}
          />
          <div className="flex min-h-12 items-center gap-2 px-3 pb-3 text-zinc-400">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full border-transparent bg-transparent text-zinc-400 shadow-none hover:bg-white/[0.055] hover:text-zinc-100"
            >
              <Plus className="size-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-full border-transparent bg-transparent px-2.5 text-sm font-normal text-zinc-400 shadow-none hover:bg-white/[0.055] hover:text-zinc-100"
            >
              <ShieldCheck className="size-4" />
              Ask for approval
              <ChevronDown className="size-3.5" />
            </Button>
            <div className="min-w-0 flex-1" />
            <OrchestratorModelDropdown
              selected={selectedOrchestrator}
              onSelect={setOrchestratorModel}
              disabled={busy}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full border-transparent bg-transparent text-zinc-400 shadow-none hover:bg-white/[0.055] hover:text-zinc-100"
            >
              <Mic className="size-4" />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={busy || !draft.trim() || !selectedProject}
              className="size-10 rounded-full bg-zinc-200 text-zinc-950 shadow-none hover:bg-zinc-50 disabled:bg-zinc-600 disabled:text-zinc-400"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <div className="flex min-h-12 flex-wrap items-center gap-2 bg-[#222423] px-3 py-2 text-sm text-zinc-400">
            <ProjectDropdown
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={setProjectId}
              onCreateProject={handleCreateProject}
              disabled={busy || projectBusy}
              trigger="pill"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-full border-transparent bg-transparent px-2.5 text-sm font-normal text-zinc-400 shadow-none hover:bg-white/[0.055] hover:text-zinc-100"
            >
              <Laptop className="size-4" />
              Work locally
              <ChevronDown className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-full border-transparent bg-transparent px-2.5 text-sm font-normal text-zinc-400 shadow-none hover:bg-white/[0.055] hover:text-zinc-100"
            >
              <GitBranch className="size-4" />
              main
              <ChevronDown className="size-3.5" />
            </Button>
          </div>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not start orchestration</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-7 divide-y divide-white/[0.055]">
          {suggestions.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              onClick={item.onSelect}
              className="h-auto w-full justify-start gap-3 rounded-none border-transparent bg-transparent px-4 py-3 text-left text-sm font-normal text-zinc-500 shadow-none hover:bg-white/[0.025] hover:text-zinc-300"
            >
              <FileText className="size-4 shrink-0 text-zinc-600" />
              <span className="min-w-0">
                <span className="block truncate">{item.label}</span>
                <span className="mt-1 block truncate text-xs text-zinc-700">{item.detail}</span>
              </span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

function OrchestratorModelDropdown({
  selected,
  onSelect,
  disabled,
}: {
  selected: OrchestratorModelOption;
  onSelect: (model: string) => void;
  disabled?: boolean;
}) {
  const contentClass = "w-[288px] border border-white/[0.08] bg-[#252625]/98 p-2 text-zinc-200 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl";
  const itemClass = "h-9 gap-2.5 rounded-md px-2.5 text-[13px] text-zinc-200 focus:bg-white/[0.08] focus:text-zinc-50 [&_svg]:text-zinc-500";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 max-w-[250px] gap-2 rounded-full border-transparent bg-transparent px-2.5 text-sm font-normal text-zinc-400 shadow-none hover:bg-white/[0.055] hover:text-zinc-100"
        >
          <Sparkles className="size-4 shrink-0" />
          <span className="min-w-0 truncate">{selected.label}</span>
          <ChevronDown className="size-3.5 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={contentClass}>
        {orchestratorModelGroups.map((group, index) => (
          <div key={group.provider}>
            {index > 0 && <DropdownMenuSeparator className="my-2 bg-white/[0.08]" />}
            <DropdownMenuLabel className="px-2 py-1 text-[11px] font-medium uppercase tracking-normal text-zinc-500">
              {group.label}
            </DropdownMenuLabel>
            {group.models.map((model) => {
              const active = selected.model === model.value;
              return (
                <DropdownMenuItem
                  key={`${group.provider}-${model.value}`}
                  className={cn(itemClass, active && "bg-white/[0.08] text-zinc-50")}
                  onSelect={() => onSelect(model.value)}
                >
                  <Sparkles className="size-4" />
                  <span className="min-w-0 flex-1 truncate">{model.label}</span>
                  {active && <Check className="size-4 text-zinc-300" />}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectDropdown({
  projects,
  selectedProject,
  onSelectProject,
  onCreateProject,
  disabled,
  trigger,
}: {
  projects: BrainProject[];
  selectedProject?: BrainProject;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (mode: "scratch" | "existing") => void;
  disabled?: boolean;
  trigger: "title" | "pill";
}) {
  const [query, setQuery] = useState("");
  const filteredProjects = projects.filter((project) => {
    const haystack = `${project.name} ${project.id} ${project.path}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const contentClass = "w-[312px] border border-white/[0.08] bg-[#252625]/98 p-2 text-zinc-200 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl";
  const itemClass = "h-9 gap-2.5 rounded-md px-2.5 text-[13px] text-zinc-200 focus:bg-white/[0.08] focus:text-zinc-50 [&_svg]:text-zinc-500";
  const subContentClass = "min-w-[244px] border border-white/[0.08] bg-[#252625]/98 p-1 text-zinc-200 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl";
  const triggerClass = trigger === "title"
    ? "h-auto rounded-xl border-transparent bg-white/[0.055] px-2 py-1 text-[32px] font-normal leading-none text-zinc-100 shadow-none hover:bg-white/[0.08] hover:text-zinc-50 focus-visible:bg-white/[0.08]"
    : "h-8 gap-2 rounded-full border-transparent bg-white/[0.055] px-3 text-sm font-normal text-zinc-300 shadow-none hover:bg-white/[0.075] hover:text-zinc-100";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={trigger === "title" ? "sm" : "sm"}
          disabled={disabled}
          className={triggerClass}
        >
          {trigger === "pill" && <Folder className="size-4 text-zinc-500" />}
          <span className="max-w-[300px] truncate">
            {selectedProject?.name ?? "Select project"}
          </span>
          <ChevronDown className={trigger === "title" ? "size-4 text-zinc-500" : "size-3.5 text-zinc-500"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={contentClass}>
        <div className="flex h-9 items-center gap-2 rounded-md px-2 text-zinc-500">
          <Search className="size-4 shrink-0" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            placeholder="Search projects"
            className="h-8 border-0 bg-transparent px-0 text-sm text-zinc-200 shadow-none placeholder:text-zinc-500 focus-visible:ring-0"
          />
        </div>
        <div className="mt-1 max-h-[210px] overflow-y-auto">
          {filteredProjects.length === 0 ? (
            <DropdownMenuItem className={itemClass} disabled>
              <span>No projects found</span>
            </DropdownMenuItem>
          ) : (
            filteredProjects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                className={cn(itemClass, project.id === selectedProject?.id && "bg-white/[0.08] text-zinc-50")}
                onSelect={() => onSelectProject(project.id)}
              >
                <Folder className="size-4" />
                <span className="min-w-0 flex-1 truncate">
                  {project.name}
                </span>
                {project.id === selectedProject?.id && <Check className="size-4 text-zinc-300" />}
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="my-2 bg-white/[0.08]" />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={itemClass}>
            <FolderOpen className="size-4" />
            <span>Add new project</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className={subContentClass}>
            <DropdownMenuItem
              className={itemClass}
              onSelect={() => onCreateProject("scratch")}
            >
              <Plus className="size-4" />
              <span>Start from scratch</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className={itemClass}
              onSelect={() => onCreateProject("existing")}
            >
              <FolderOpen className="size-4" />
              <span>Use an existing folder</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
