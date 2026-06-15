import type { BrainStatus } from "@brain-loop/brain-core";
import { BrainLoopLogo } from "./brain-loop-logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  ListOrdered,
  Play,
  ScrollText,
  CheckCircle,
  Timer,
  MessageSquare,
  Settings,
} from "lucide-react";

interface SidebarProps {
  status: BrainStatus;
}

const navItems = [
  { href: "#overview", label: "Overview", icon: LayoutDashboard },
  { href: "#projects", label: "Projects", icon: FolderKanban },
  { href: "#queue", label: "Queue", icon: ListOrdered },
  { href: "#runs", label: "Runs", icon: Play },
  { href: "#logs", label: "Logs", icon: ScrollText },
  { href: "#approvals", label: "Approvals", icon: CheckCircle },
  { href: "#scheduler", label: "Scheduler", icon: Timer },
  { href: "#threads", label: "Threads", icon: MessageSquare },
  { href: "#settings", label: "Settings", icon: Settings },
];

export function Sidebar({ status }: SidebarProps) {
  return (
    <aside className="w-64 border-r bg-muted/10 flex flex-col h-screen shrink-0">
      <div className="p-6 flex items-center gap-3">
        <BrainLoopLogo className="h-8 w-8 shadow-sm rounded-lg flex-none" />
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-tight">Brain Loop</h1>
          <span className="text-xs text-muted-foreground block truncate">Agent console</span>
        </div>
      </div>
      <nav className="flex-1 px-4 flex flex-col gap-0.5 overflow-auto">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors",
              item.href === "#overview"
                ? "text-foreground font-medium"
                : "text-muted-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </a>
        ))}
      </nav>
      <div className="p-4 mt-auto border-t">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-teal-500 ring-4 ring-teal-500/20" />
          <span>{status.activeRuns} active runs</span>
        </div>
      </div>
    </aside>
  );
}
