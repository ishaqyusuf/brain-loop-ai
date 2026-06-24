import { open as openDialog } from "@tauri-apps/plugin-dialog";
import type { Dispatch, SetStateAction } from "react";
import {
  appendOrchestrationMessage,
  createOrchestration,
  createProject,
  handoffOrchestration,
  inspectProjectFolder,
  runOrchestrationTurn,
  setProjectEnabled,
  updateOrchestrationProject,
} from "@brain-loop/desktop-client";
import type { BrainProject, OrchestrationThread, Settings } from "@brain-loop/brain-core";
import {
  defaultCliProjectAgent,
  orchestrationPromptContext,
  replaceOrchestration,
  titleFromIntake,
  type OrchestratorModelOption,
} from "@/lib/orchestration-display";

interface UseOrchestrationActionsOptions {
  brainSettings: Settings | null;
  queueProjects: BrainProject[];
  refreshAgentThreads: () => void;
  refreshOrchestrations: () => void;
  refreshProjects: () => void;
  refreshQueue: () => void;
  setActiveAgentId: (activeAgentId: string | null) => void;
  setActiveThreadTab: (tab: "workers" | "orchestrator") => void;
  setOrchestrations: Dispatch<SetStateAction<OrchestrationThread[]>>;
  setProjectError: (error: string | null) => void;
}

export function useOrchestrationActions({
  brainSettings,
  queueProjects,
  refreshAgentThreads,
  refreshOrchestrations,
  refreshProjects,
  refreshQueue,
  setActiveAgentId,
  setActiveThreadTab,
  setOrchestrations,
  setProjectError,
}: UseOrchestrationActionsOptions) {
  function handleStartOrchestration(body: string, projectId: string, orchestrator: OrchestratorModelOption) {
    const project = queueProjects.find((candidate) => candidate.id === projectId) ?? queueProjects[0];
    const title = titleFromIntake(body);
    return createOrchestration({
      title,
      projectId: project?.id ?? "unassigned",
      projectName: project?.name ?? "Unassigned project",
      projectPath: project?.path ?? "",
      originAgent: orchestrator.provider,
      model: orchestrator.model,
      initialMessage: null,
    }).then((thread) => {
      setActiveThreadTab("orchestrator");
      setActiveAgentId(`orchestration:${thread.id}`);
      setOrchestrations((current) => replaceOrchestration(current, thread));
      return handleAppendOrchestrationMessage(thread, body);
    }).then((thread) => {
      void refreshOrchestrations();
      return thread;
    });
  }

  function handleCreateProjectFromFolder(mode: "scratch" | "existing") {
    return (async () => {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: mode === "scratch" ? "Choose folder for new project" : "Choose existing project folder",
      });
      if (typeof selected !== "string") {
        return null;
      }

      const inspection = await inspectProjectFolder({
        path: selected,
        existingProjectIds: queueProjects.map((project) => project.id),
      });
      const project: BrainProject = {
        id: inspection.id,
        name: inspection.name,
        path: inspection.path,
        enabled: true,
        defaultAgent: defaultCliProjectAgent(brainSettings?.defaultImplementationRunner),
        reviewIntervalMinutes: brainSettings?.defaultReviewIntervalMinutes ?? 2,
        implementationIntervalMinutes: brainSettings?.defaultImplementationIntervalMinutes ?? 2,
        priority: "medium",
        autoMergeOnReviewPass: false,
        brainPath: inspection.brainPath,
        brainStorage: inspection.brainStorage,
      };
      const created = await createProject(project);
      await refreshProjects();
      return created;
    })();
  }

  function handleToggleProjectEnabled(project: BrainProject, enabled: boolean) {
    void setProjectEnabled(project.id, enabled)
      .then(() => {
        void refreshProjects();
        refreshQueue();
      })
      .catch((e) => setProjectError(`Unable to update project ${project.name}: ${String(e)}`));
  }

  function handleAppendOrchestrationMessage(thread: OrchestrationThread, body: string) {
    return appendOrchestrationMessage({
      orchestrationId: thread.id,
      role: "user",
      body,
      agent: "desktop-user",
      model: thread.model ?? brainSettings?.defaultReviewModel ?? "gpt-5-codex",
      metadata: {
        autoPromptContext: orchestrationPromptContext(thread),
      },
    }).then((updated) => {
      setOrchestrations((current) => replaceOrchestration(current, updated));
      return runOrchestrationTurn({ orchestrationId: updated.id });
    }).then((updated) => {
      setOrchestrations((current) => replaceOrchestration(current, updated));
      return updated;
    });
  }

  function handleUpdateOrchestrationProject(thread: OrchestrationThread, projectId: string) {
    return updateOrchestrationProject({
      orchestrationId: thread.id,
      projectId,
    }).then((updated) => {
      setOrchestrations((current) => replaceOrchestration(current, updated));
      return updated;
    });
  }

  function handleHandoffOrchestration(thread: OrchestrationThread, taskTitle: string, taskBody: string) {
    return handoffOrchestration({
      orchestrationId: thread.id,
      sourceAgent: "brain-loop",
      registerProjectIfMissing: true,
      importedProjectEnabled: false,
      tasks: [
        {
          title: taskTitle,
          body: taskBody,
          priority: "medium",
          agent: brainSettings?.defaultImplementationRunner ?? "open-code",
          recommendedAgent: brainSettings?.defaultImplementationRunner ?? "open-code",
          recommendedModel: brainSettings?.defaultImplementationModel ?? "deepseek v4 pro",
        },
      ],
    }).then((result) => {
      setOrchestrations((current) => replaceOrchestration(current, result.orchestration));
      void refreshProjects();
      refreshQueue();
      void refreshAgentThreads();
      return result;
    });
  }

  return {
    handleAppendOrchestrationMessage,
    handleCreateProjectFromFolder,
    handleHandoffOrchestration,
    handleStartOrchestration,
    handleToggleProjectEnabled,
    handleUpdateOrchestrationProject,
  };
}
