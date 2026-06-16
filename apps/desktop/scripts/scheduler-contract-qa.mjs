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
const scheduler = read("apps/desktop/src-tauri/src/scheduler.rs");
const runner = read("apps/desktop/src-tauri/src/runner.rs");
const worktree = read("apps/desktop/src-tauri/src/worktree.rs");
const agentThread = read("apps/desktop/src-tauri/src/agent_thread.rs");
const settingsPage = read("apps/desktop/src/components/settings/settings-page.tsx");
const brainTypes = read("packages/brain-core/src/types.ts");
const brainConstants = read("packages/brain-core/src/constants.ts");
const desktopPackage = JSON.parse(read("apps/desktop/package.json"));

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
  "Direct implementation-to-review handoff",
  includesAll(runner, [
    "item.status == \"started\"",
    "\"submitted\"",
    "should_request_review = true",
    "crate::run_review_once(app.clone())",
  ]),
  "A successful implementation runner should submit the queue item and ask the review pool to fill.",
  ["apps/desktop/src-tauri/src/runner.rs"],
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
  desktopPackage.scripts?.["scheduler:qa"] === "bun scripts/scheduler-contract-qa.mjs",
  "The desktop package should expose the scheduler contract QA command.",
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
