import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const workspaceRoot = path.resolve(root, "../..");
const checks = [];

function read(relativePath) {
  return readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

function addCheck(name, ok, detail, evidence = []) {
  checks.push({ name, ok, detail, evidence });
}

function includesAll(content, terms) {
  return terms.every((term) => content.includes(term));
}

function appearsBefore(content, first, second) {
  const firstIndex = content.indexOf(first);
  const secondIndex = content.indexOf(second);
  return firstIndex !== -1 && secondIndex !== -1 && firstIndex < secondIndex;
}

const lib = read("apps/desktop/src-tauri/src/lib.rs");
const orchestration = read("apps/desktop/src-tauri/src/orchestration.rs");
const landing = read("apps/desktop/src-tauri/src/landing.rs");
const scheduler = read("apps/desktop/src-tauri/src/scheduler.rs");
const runner = read("apps/desktop/src-tauri/src/runner.rs");
const worktree = read("apps/desktop/src-tauri/src/worktree.rs");
const agentThread = read("apps/desktop/src-tauri/src/agent_thread.rs");
const settingsPage = read("apps/desktop/src/components/settings/settings-page.tsx");
const sidebar = read("apps/desktop/src/components/sidebar.tsx");
const projectTable = read("apps/desktop/src/components/tables/projects/project-table.tsx");
const approvalPanel = read("apps/desktop/src/components/approval-panel.tsx");
const appShell = read("apps/desktop/src/app.tsx");
const orchestrationActions = read("apps/desktop/src/hooks/use-orchestration-actions.ts");
const orchestrationDisplay = read("apps/desktop/src/lib/orchestration-display.ts");
const orchestrationStartView = read("apps/desktop/src/components/orchestration/orchestration-start-view.tsx");
const sidebarViewModel = read("apps/desktop/src/hooks/use-sidebar-view-model.ts");
const dashboardView = read("apps/desktop/src/components/dashboard/dashboard-view.tsx");
const desktopClient = read("packages/desktop-client/src/index.ts");
const brainTypes = read("packages/brain-core/src/types.ts");
const brainConstants = read("packages/brain-core/src/constants.ts");
const desktopPackage = JSON.parse(read("apps/desktop/package.json"));
const schedulerDefaultSources = `${brainConstants}\n${lib}`;

addCheck(
  "Capacity settings contract",
  includesAll(brainTypes, [
    "maxImplementationAgents",
    "maxReviewAgents",
    "capacityPollIntervalSeconds",
    "maxLoopPolicy",
  ]) &&
    includesAll(brainConstants, [
      "maxImplementationAgents",
      "maxReviewAgents",
      "capacityPollIntervalSeconds",
      "maxLoopPolicy",
    ]) &&
    includesAll(scheduler, [
      "read_capacity_poll_interval_seconds",
      "read_max_review_agents",
      "read_max_running_processes",
    ]),
  "Settings must expose implementation capacity, review capacity, poll cadence, and MaxLoop policy.",
  ["packages/brain-core/src/types.ts", "packages/brain-core/src/constants.ts", "apps/desktop/src-tauri/src/scheduler.rs"],
);

addCheck(
  "Running automation uses capacity loop",
  includesAll(lib, ["fn ensure_automation_loop", "run_local_automation_triage", "read_capacity_poll_interval_seconds"]) &&
    lib.includes("state == \"running\"") &&
    lib.includes("std::thread::sleep(Duration::from_secs"),
  "Automation should keep checking local queue state while running, with a configurable poll cadence.",
  ["apps/desktop/src-tauri/src/lib.rs"],
);

addCheck(
  "Local triage is review-first",
  includesAll(lib, ["fn run_local_automation_triage", "TRIAGE:", "run_review_once", "run_implementation_once"]) &&
    appearsBefore(lib, "let review_result = match run_review_once", "let implementation_result = match run_implementation_once"),
  "Token-saving triage should inspect local state and attempt submitted review work before new implementation work.",
  ["apps/desktop/src-tauri/src/lib.rs"],
);

addCheck(
  "Implementation pool dispatch",
  includesAll(lib, [
    "fn run_implementation_once",
    "item.status == \"queued\" || item.status == \"reviewed-fix-request\"",
    "MaxLoopRuntimeState::from_queue",
    "max_loop_waiting_reason",
    "record_dependency_wait",
    "launch_implementation_item",
  ]),
  "Implementation dispatch should select eligible local queue work, respect dependencies and MaxLoop caps, and launch only through the runner path.",
  ["apps/desktop/src-tauri/src/lib.rs"],
);

addCheck(
  "Review pool dispatch",
  includesAll(lib, [
    "#[tauri::command]\nfn run_review_once",
    "count_active_review_processes",
    "read_max_review_agents",
    "record_review_capacity_wait",
    "launch_review_item",
  ]) && /item\.status\s*==\s*"submitted"/.test(lib),
  "Review dispatch should use a separate review pool, select submitted items, and persist review-capacity wait reasons.",
  ["apps/desktop/src-tauri/src/lib.rs"],
);

addCheck(
  "Direct-provider review dispatch",
  includesAll(lib, [
    "fn direct_review_spec",
    "fn spawn_direct_review_runner",
    "fn apply_direct_review_result",
    "direct_review_tool_specs",
    "direct_review_runner_launch",
    "run_implementation_once(followup_app.clone())",
  ]) &&
    includesAll(settingsPage, [
      "setRoleRunner(\"review\"",
      "disabled={!runner.enabled}",
    ]) &&
    !lib.includes(["Default review runner", "CLI runner"].join(" must be a ")),
  "Direct DeepSeek/Gemini runners should be selectable for review and dispatch through the Brain Loop direct runtime.",
  ["apps/desktop/src-tauri/src/lib.rs", "apps/desktop/src/components/settings/settings-page.tsx"],
);

addCheck(
  "Live orchestration runtime",
  includesAll(orchestration, [
    "pub fn run_live_turn",
    "run_codex_orchestrator",
    "run_claude_orchestrator",
    "live-orchestration-turn",
    "--sandbox",
    "read-only",
    "--permission-mode",
    "plan",
  ]) &&
    includesAll(lib, ["fn run_orchestration_turn", "run_orchestration_turn,"]) &&
    includesAll(desktopClient, ["runOrchestrationTurn", "\"run_orchestration_turn\""]) &&
    includesAll(orchestrationActions, ["runOrchestrationTurn({ orchestrationId: updated.id })"]) &&
    !orchestrationActions.includes("function orchestrationAssistantResponse") &&
    !appShell.includes("function orchestrationAssistantResponse"),
  "Orchestrator chat responses should come from the selected local Codex/Claude runtime, not static UI guidance.",
  [
    "apps/desktop/src-tauri/src/orchestration.rs",
    "apps/desktop/src-tauri/src/lib.rs",
    "packages/desktop-client/src/index.ts",
    "apps/desktop/src/app.tsx",
  ],
);

addCheck(
  "Grouped orchestrator model selector",
  includesAll(`${orchestrationDisplay}\n${orchestrationStartView}`, [
    "const orchestratorModelGroups",
    "provider: \"codex\"",
    "label: \"Codex\"",
    "provider: \"claude\"",
    "label: \"Claude\"",
    "function OrchestratorModelDropdown",
    "DropdownMenuLabel",
    "group.models.map",
  ]) &&
    appearsBefore(orchestrationDisplay, "provider: \"codex\"", "provider: \"claude\""),
  "New orchestration should expose a grouped orchestrator dropdown with Codex models first and Claude models second.",
  ["apps/desktop/src/app.tsx"],
);

addCheck(
  "Requested sidebar navigation and footer play control",
  includesAll(sidebarViewModel, [
    "id: \"dashboard\"",
    "name: \"Dashboard\"",
    "id: \"new-orchestrator\"",
    "name: \"New Orchestrator\"",
    "id: \"codex-review\"",
    "id: \"implementation\"",
    "id: \"approvals\"",
  ]) &&
    appearsBefore(sidebarViewModel, "id: \"dashboard\"", "id: \"new-orchestrator\"") &&
    appearsBefore(sidebarViewModel, "id: \"new-orchestrator\"", "id: \"codex-review\"") &&
    appearsBefore(sidebarViewModel, "id: \"codex-review\"", "id: \"implementation\"") &&
    appearsBefore(sidebarViewModel, "id: \"implementation\"", "id: \"approvals\"") &&
    includesAll(sidebar, [
      "automationUsagePercent(schedulerStatus, status)}%",
      "function AutomationIconToggle",
      "TooltipContent>{label}</TooltipContent>",
      "size=\"icon-sm\"",
    ]) &&
    !sidebar.includes("function AutomationToggle"),
  "The fixed sidebar actions should be Dashboard, New Orchestrator, Review, Implementation, Approval, and play/pause should be an icon-only tooltip control beside the footer percentage.",
  ["apps/desktop/src/app.tsx", "apps/desktop/src/components/sidebar.tsx"],
);

addCheck(
  "App-owned scheduler defaults",
  includesAll(brainConstants, [
    "jobName: \"brain-loop-app-scheduler\"",
    "lastGatewayStatus: \"not-used\"",
    "codexAutomationMode: \"implementation-and-review\"",
    "External dispatcher is not used",
  ]) &&
    includesAll(lib, [
      "\"brain-loop-app-scheduler\".to_string()",
      "\"not-used\".to_string()",
      "\"implementation-and-review\".to_string()",
      "External dispatcher is not used",
    ]) &&
    !schedulerDefaultSources.includes("\"brain-implementation-dispatcher\"") &&
    !schedulerDefaultSources.includes("Legacy external dispatcher is stopped"),
  "Fresh settings defaults should point at Brain Loop's app-owned scheduler, not an external Hermes-shaped dispatcher.",
  ["packages/brain-core/src/constants.ts", "apps/desktop/src-tauri/src/lib.rs"],
);

addCheck(
  "Dashboard bird-view surface",
  includesAll(dashboardView, [
    "function DashboardView",
    "Operations",
    "Dashboard",
    "Search tasks, status, project, handoff",
    "projectFilter",
    "reviewWindow",
    "Week review",
    "Month review",
    "Approval Policy",
    "Project Policy",
    "Review Queue",
    "manualLandingItems",
  ]),
  "Dashboard should provide overview analytics, task list/search, project filtering, week/month review, approval mode, and review queue surfaces.",
  ["apps/desktop/src/app.tsx"],
);

addCheck(
  "Manual approval policy visibility",
  includesAll(projectTable, [
    "Approval Mode",
    "SelectItem value=\"manual\"",
    "SelectItem value=\"automatic\"",
    "autoMergeOnReviewPass: value === \"automatic\"",
    "Manual keeps review-passed work in approvals",
  ]) &&
    includesAll(sidebarViewModel, [
      "description: `${pendingApprovalRequests.length} pending`",
      "count: pendingApprovalRequests.length",
    ]) &&
    includesAll(dashboardView, [
      "manualLandingItems",
    ]) &&
    includesAll(landing, [
      "if project.auto_merge_on_review_pass",
      "request_merge_approval",
      "record_merge_approval_wait",
      "land_queue_item_by_id",
    ]) &&
    includesAll(approvalPanel, [
      "listApprovalRequests",
      "approveRequest",
      "executeApprovedDirectModelTool",
    ]) &&
    !approvalPanel.includes("Stub Command") &&
    !approvalPanel.includes("manual-stub") &&
    !approvalPanel.includes("sampleRequests") &&
    !sidebarViewModel.includes("pendingApprovalRequests.length || status.blockedItems"),
  "Projects should expose Manual/Automatic approval mode, manual review-passed work should create approval requests, and the Approval sidebar count should reflect pending approvals.",
  [
    "apps/desktop/src/components/tables/projects/project-table.tsx",
    "apps/desktop/src/app.tsx",
    "apps/desktop/src-tauri/src/landing.rs",
    "apps/desktop/src/components/approval-panel.tsx",
  ],
);

addCheck(
  "Direct implementation-to-review handoff",
  includesAll(runner, [
    "item.status == \"started\"",
    "\"submitted\"",
    "should_request_review = true",
    "automation_running",
    "crate::run_review_once(app.clone())",
  ]),
  "A successful implementation runner should submit the queue item and ask the review pool to fill only while automation is still running.",
  ["apps/desktop/src-tauri/src/runner.rs"],
);

addCheck(
  "Review fix requests loop back to implementation",
  includesAll(runner, [
    "item.status == \"reviewed-fix-request\"",
    "is_review_runner",
    "should_request_fix_implementation = true",
    "crate::run_implementation_once(app.clone())",
  ]) &&
    includesAll(agentThread, [
      "\"queued\" | \"reviewed-fix-request\" => \"waiting\"",
      "\"approved\" => \"done\"",
    ]),
  "A review-requested fix should keep the queue-linked worker thread open, request implementation capacity again, and only mark the thread done after approval.",
  ["apps/desktop/src-tauri/src/runner.rs", "apps/desktop/src-tauri/src/agent_thread.rs"],
);

addCheck(
  "Worktree-backed thread context",
  includesAll(worktree, [
    "ensure_task_worktree",
    "\"worktree\"",
    "\"main-checkout\"",
    "\"auto\"",
    "worktree_path",
    "execution_path",
  ]) &&
    includesAll(agentThread, [
      "upsert_from_queue_value",
      "worktreePath",
      "executionPath",
      "list_agent_threads",
    ]),
  "Each queue task should get durable thread metadata and a configured execution path/worktree strategy.",
  ["apps/desktop/src-tauri/src/worktree.rs", "apps/desktop/src-tauri/src/agent_thread.rs"],
);

addCheck(
  "Main checkout warning is visible",
  includesAll(settingsPage, [
    "executionStrategy",
    "main-checkout",
    "Main checkout warning",
    "Shared checkout",
  ]),
  "Settings must visibly warn when execution is configured to run directly in the main project checkout.",
  ["apps/desktop/src/components/settings/settings-page.tsx"],
);

addCheck(
  "Scheduler QA script is wired",
  desktopPackage.scripts?.["scheduler:qa"] === "bun scripts/scheduler-contract-qa.mjs" &&
    desktopPackage.scripts?.["rust:check"] === "bun scripts/rust-check.mjs",
  "The desktop package should expose scheduler contract QA and a Cargo-discovering Rust check command.",
  ["apps/desktop/package.json"],
);

const report = {
  generatedAt: new Date().toISOString(),
  command: "bun --filter @brain-loop/desktop scheduler:qa",
  checks,
  summary: {
    passed: checks.filter((check) => check.ok).length,
    failed: checks.filter((check) => !check.ok).length,
  },
};

const reportDir = path.join(root, "visual-qa");
mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, "scheduler-contract-report.json");
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

for (const check of checks) {
  const mark = check.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${check.name}: ${check.detail}`);
}
console.log(`Report: ${path.relative(root, reportPath)}`);

if (report.summary.failed > 0) {
  process.exitCode = 1;
}
