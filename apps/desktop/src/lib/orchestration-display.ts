import type { BrainProject, OrchestrationThread, Settings } from "@brain-loop/brain-core";

export type OrchestratorProvider = "codex" | "claude";

export type OrchestratorModelOption = {
  provider: OrchestratorProvider;
  providerLabel: string;
  model: string;
  label: string;
};

export const orchestratorModelGroups: Array<{
  provider: OrchestratorProvider;
  label: string;
  models: Array<{ value: string; label: string }>;
}> = [
  {
    provider: "codex",
    label: "Codex",
    models: [
      { value: "gpt-5.5", label: "GPT-5.5" },
      { value: "gpt-5.4", label: "GPT-5.4" },
      { value: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
      { value: "gpt-5.3-codex-spark", label: "GPT-5.3 Codex Spark" },
    ],
  },
  {
    provider: "claude",
    label: "Claude",
    models: [
      { value: "claude-fable-5", label: "Claude Fable 5" },
      { value: "claude-opus-4-8", label: "Claude Opus 4.8" },
      { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    ],
  },
];

export const defaultOrchestratorModel = orchestratorModelGroups[0].models[0].value;

export const orchestratorModelOptions = orchestratorModelGroups.flatMap((group) =>
  group.models.map((model) => ({
    provider: group.provider,
    providerLabel: group.label,
    model: model.value,
    label: model.label,
  })),
);

export function findOrchestratorModel(model?: string | null): OrchestratorModelOption | undefined {
  return orchestratorModelOptions.find((option) => option.model === model);
}

export function replaceOrchestration(
  current: OrchestrationThread[],
  nextThread: OrchestrationThread,
) {
  const index = current.findIndex((thread) => thread.id === nextThread.id);
  if (index === -1) {
    return [nextThread, ...current];
  }
  const next = [...current];
  next[index] = nextThread;
  return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function orchestrationPromptContext(thread: OrchestrationThread) {
  return [
    "Brain Loop orchestration intake context:",
    "- Refine the user's feature request into implementation-ready handoff tasks.",
    "- Preserve project identity and link future queue items to this orchestration.",
    "- Prefer Brain Loop handoff artifacts and queue JSON compatibility.",
    "- Missing external projects must be registered disabled until the user enables them.",
    `- Orchestration: ${thread.id}`,
    `- Project: ${thread.projectName} (${thread.projectId})`,
  ].join("\n");
}

export function orchestrationHandoffBody(thread: OrchestrationThread) {
  return thread.messages
    .filter((message) => message.metadata?.responseKind !== "orchestration-intake-guidance")
    .map((message) => `${message.role}: ${message.body}`)
    .join("\n\n")
    .trim();
}

export function titleFromIntake(body: string) {
  const normalized = body
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.?!].*$/, "");
  if (!normalized) {
    return "New orchestration";
  }
  return normalized.length > 72
    ? `${normalized.slice(0, 69)}...`
    : normalized;
}

export function defaultCliProjectAgent(agent: Settings["defaultImplementationRunner"] | undefined): BrainProject["defaultAgent"] {
  return agent === "antigravity" || agent === "codex" ? agent : "open-code";
}
