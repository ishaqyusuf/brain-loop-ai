import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function addCheck(name, ok, detail, evidence = []) {
  checks.push({
    name,
    ok,
    detail,
    evidence,
  });
}

function includesAll(content, terms) {
  return terms.every((term) => content.includes(term));
}

const appSource = read("src/app.tsx");
const logoSource = read("src/components/brain-loop-logo.tsx");
const sidebarSource = read("src/components/sidebar.tsx");
const dashboardSource = read("src/components/dashboard/dashboard-view.tsx");
const orchestrationStartSource = read("src/components/orchestration/orchestration-start-view.tsx");
const threadWorkspaceSource = read("src/components/thread-workspace/thread-workspace.tsx");
const workspaceSource = read("src/components/workspace/workspace-shell.tsx");
const sidebarViewModelSource = read("src/hooks/use-sidebar-view-model.ts");
const dropdownMenuSource = read("src/components/ui/dropdown-menu.tsx");
const settingsSource = read("src/components/settings/settings-page.tsx");
const styles = read("src/styles.css");
const packageJson = JSON.parse(read("package.json"));
const tauriConfig = JSON.parse(read("src-tauri/tauri.conf.json"));
const mainWindowConfig = tauriConfig.app?.windows?.find((windowConfig) => windowConfig.label === "main");
const distIndexPath = path.join(root, "dist/index.html");
const distIndexExists = existsSync(distIndexPath);
const distIndex = distIndexExists ? readFileSync(distIndexPath, "utf8") : "";

addCheck(
  "Built desktop bundle exists",
  distIndexExists && distIndex.includes("<div id=\"root\">"),
  "Run `bun --filter @brain-loop/desktop build` before visual QA.",
  ["dist/index.html"],
);

addCheck(
  "Headless Codex shell",
  workspaceSource.includes("<EmptyHome />") &&
    workspaceSource.includes("relative flex h-screen min-w-0 flex-1 overflow-hidden bg-[#141414]") &&
    threadWorkspaceSource.includes("data-tauri-drag-region") &&
    !workspaceSource.includes("Overview") &&
    dashboardSource.includes("function DashboardView"),
  "The workspace should render as a headless shell with draggable overlay chrome and the requested operational dashboard surface, not the old product tab frame.",
  [
    "src/components/workspace/workspace-shell.tsx",
    "src/components/thread-workspace/thread-workspace.tsx",
    "src/components/dashboard/dashboard-view.tsx",
  ],
);

addCheck(
  "Native overlay title bar",
  mainWindowConfig?.decorations === true &&
    mainWindowConfig?.titleBarStyle === "Overlay" &&
    mainWindowConfig?.hiddenTitle === true &&
    mainWindowConfig?.trafficLightPosition?.x === 16 &&
    mainWindowConfig?.trafficLightPosition?.y === 18,
  "The main Tauri window should hide the native title while keeping overlayed macOS traffic lights.",
  ["src-tauri/tauri.conf.json"],
);

addCheck(
  "Fixed top sidebar actions",
  sidebarSource.includes("agents.map((agent)") &&
    sidebarSource.includes("ActionSidebarItem") &&
    sidebarSource.includes("new-orchestrator") &&
    sidebarSource.includes("automationUsagePercent") &&
    sidebarSource.includes("fixed") &&
    sidebarSource.includes("data-tauri-drag-region") &&
    sidebarSource.includes("overflow-y-auto"),
  "Dashboard, New Orchestrator, Review, Implementation, and Approval should remain fixed below the draggable native chrome area, with play/pause in the compact footer status slot.",
  ["src/components/sidebar.tsx"],
);

addCheck(
  "No fake traffic lights",
  !sidebarSource.includes("bg-[#ff5f57]") &&
    !sidebarSource.includes("bg-[#febc2e]") &&
    !sidebarSource.includes("bg-[#28c840]") &&
    !settingsSource.includes("bg-[#ff5f57]") &&
    !settingsSource.includes("bg-[#febc2e]") &&
    !settingsSource.includes("bg-[#28c840]"),
  "The React shell should reserve space for native macOS controls instead of drawing duplicate traffic-light dots.",
  ["src/components/sidebar.tsx", "src/components/settings/settings-page.tsx"],
);

addCheck(
  "Current Focus Frame logo",
  logoSource.includes("focus-frame-accent") &&
    logoSource.includes("M344 333H259V418") &&
    logoSource.includes("#5FB9A4") &&
    !logoSource.includes("brain-loop-stroke") &&
    !logoSource.includes("M32 11c-10-5"),
  "The React app logo should use the current Focus Frame mark, not the old looping glyph.",
  ["src/components/brain-loop-logo.tsx"],
);

addCheck(
  "Flat thread list rows",
  sidebarSource.includes("function ThreadSidebarItem") &&
    sidebarSource.includes("item.timeLabel") &&
    sidebarSource.includes("flex-1 truncate") &&
    sidebarSource.includes("1500") &&
    sidebarSource.includes("initialThreadDisplayCount = 10") &&
    sidebarSource.includes("visibleThreads = activeList.slice(0, visibleThreadCount)") &&
    sidebarSource.includes("Show more") &&
    sidebarViewModelSource.includes("taskBackedThreadStatuses") &&
    sidebarViewModelSource.includes("\"picked\"") &&
    !sidebarViewModelSource.includes("\"queued\",\n  \"picked\"") &&
    sidebarViewModelSource.includes("isTaskBackedThreadStatus(item.status)") &&
    threadWorkspaceSource.includes("Thread not found for task") &&
    sidebarViewModelSource.includes("return sortThreadNavItems([...durableThreads, ...taskThreads], sidebarOrganization, threadSort)") &&
    !sidebarViewModelSource.includes("queueItems.slice(0, 50).map") &&
    !sidebarSource.includes("rounded-xl border"),
  "Thread rows should stay flat title-only rows with compact runtime labels, delayed hover details, and queue-backed worker rows only after work is picked or later.",
  [
    "src/components/sidebar.tsx",
    "src/hooks/use-sidebar-view-model.ts",
    "src/components/thread-workspace/thread-workspace.tsx",
  ],
);

addCheck(
  "Thread more menu actions",
  includesAll(sidebarSource, [
    "Archive all threads",
    "Active projects",
    "Organize sidebar",
    "By Projects",
    "Chronological List",
    "WorkTree",
    "Sort by",
    "Created At",
    "Updated At",
  ]) &&
    !sidebarSource.includes("Collapse sidebar</DropdownMenuItem>") &&
    !sidebarSource.includes(">Approvals</DropdownMenuItem>"),
  "The thread More menu should stay scoped to archive, project eligibility, organize, and sort actions.",
  ["src/components/sidebar.tsx"],
);

addCheck(
  "Minimal Workers and Orchestrator tabs",
  sidebarSource.includes("type SidebarThreadTab = \"workers\" | \"orchestrator\"") &&
    sidebarSource.includes("label=\"Workers\"") &&
    sidebarSource.includes("label=\"Orchestrator\"") &&
    sidebarSource.includes("active && \"font-semibold text-zinc-100\"") &&
    sidebarSource.includes("onNewOrchestration") &&
    sidebarViewModelSource.includes("function handleNewOrchestration()") &&
    sidebarViewModelSource.includes("setActiveThreadTab(\"orchestrator\")") &&
    sidebarViewModelSource.includes("setActiveAgentId(null)"),
  "The sidebar should use simple text tabs and New in Orchestrator should open the Codex-like start composer.",
  ["src/components/sidebar.tsx", "src/hooks/use-sidebar-view-model.ts"],
);

addCheck(
  "Codex-like Orchestrator project dropdown",
  orchestrationStartSource.includes("function ProjectDropdown") &&
    orchestrationStartSource.includes("trigger: \"title\" | \"pill\"") &&
    orchestrationStartSource.includes("placeholder=\"Search projects\"") &&
    orchestrationStartSource.includes("Add new project") &&
    orchestrationStartSource.includes("Start from scratch") &&
    orchestrationStartSource.includes("Use an existing folder") &&
    orchestrationStartSource.includes("onKeyDown={(event) => event.stopPropagation()}") &&
    !orchestrationStartSource.includes("Don't work in a project") &&
    !orchestrationStartSource.includes("Don’t work in a project"),
  "The Orchestrator start project selector should be available from the title and composer, support add-project actions, and omit no-project mode.",
  ["src/components/orchestration/orchestration-start-view.tsx"],
);

addCheck(
  "Simple thread loading and error states",
  sidebarSource.includes("{state.blocked && (") &&
    sidebarSource.includes("<AlertCircle className=\"size-4 shrink-0 text-red-400\" />") &&
    sidebarSource.includes("return <Circle className=\"size-4 animate-spin fill-transparent text-zinc-500\" />") &&
    sidebarSource.includes("showPill: false") &&
    sidebarSource.includes("return timeLabel ? <span className=\"tabular-nums\">{timeLabel}</span> : null;"),
  "Thread rows should keep loading/error treatment simple: spinner on the right, red error icon on the left, elapsed time on the right.",
  ["src/components/sidebar.tsx"],
);

addCheck(
  "Thread submenu flyouts escape parent menu",
  dropdownMenuSource.includes("function DropdownMenuSubContent") &&
    dropdownMenuSource.includes("<DropdownMenuPrimitive.Portal>") &&
    dropdownMenuSource.includes("data-slot=\"dropdown-menu-sub-content\""),
  "Nested thread menu flyouts should be portaled so Organize sidebar and Sort by are not clipped by the parent dropdown.",
  ["src/components/ui/dropdown-menu.tsx"],
);

addCheck(
  "Dark-first background",
  styles.includes("background: #141414") &&
    styles.includes("--background: oklch(0.145 0 0)") &&
    styles.includes("--sidebar: oklch(0.205 0 0)") &&
    !styles.includes("background: #ffffff") &&
    !styles.includes("background: #fff") &&
    !styles.includes("--background: #fff") &&
    !styles.includes("--background: white"),
  "The shell should not regress to a light or white default background.",
  ["src/styles.css"],
);

addCheck(
  "Codex-like opened thread surface",
  threadWorkspaceSource.includes("function AgentThreadView") &&
    threadWorkspaceSource.includes("function ThreadIdentity") &&
    threadWorkspaceSource.includes("items-baseline") &&
    threadWorkspaceSource.includes("ThreadMessage") &&
    threadWorkspaceSource.includes("TranscriptCard") &&
    threadWorkspaceSource.includes("ArtifactCard") &&
    !threadWorkspaceSource.includes("<header className=\"flex h-12") &&
    !threadWorkspaceSource.includes("PanelRight") &&
    !threadWorkspaceSource.includes("MoreHorizontal"),
  "Opened threads should keep identity in top chrome and render chat, transcript, and artifact surfaces without the stale h-12 app bar.",
  ["src/components/thread-workspace/thread-workspace.tsx"],
);

addCheck(
  "Persisted timeline messages render",
  threadWorkspaceSource.includes("thread.messages") &&
    threadWorkspaceSource.includes("persistedMessages") &&
    includesAll(threadWorkspaceSource, ["role === \"approval\"", "role === \"artifact\"", "role === \"agent\""]),
  "The chat timeline should render persisted thread messages with distinct role styling.",
  ["src/components/thread-workspace/thread-workspace.tsx"],
);

addCheck(
  "Artifact and transcript text can wrap",
  threadWorkspaceSource.includes("break-all font-mono") &&
    threadWorkspaceSource.includes("whitespace-pre-wrap break-words"),
  "Long paths and transcript output must not overflow narrow thread surfaces.",
  ["src/components/thread-workspace/thread-workspace.tsx"],
);

addCheck(
  "Visual QA script is wired",
  packageJson.scripts?.["visual:qa"] === "bun scripts/codex-visual-qa.mjs",
  "The desktop package should expose the visual QA command.",
  ["package.json"],
);

const report = {
  generatedAt: new Date().toISOString(),
  command: "bun --filter @brain-loop/desktop visual:qa",
  checks,
  summary: {
    passed: checks.filter((check) => check.ok).length,
    failed: checks.filter((check) => !check.ok).length,
  },
};

const reportDir = path.join(root, "visual-qa");
mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, "codex-ui-report.json");
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

for (const check of checks) {
  const mark = check.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${check.name}: ${check.detail}`);
}
console.log(`Report: ${path.relative(root, reportPath)}`);

if (report.summary.failed > 0) {
  process.exitCode = 1;
}
