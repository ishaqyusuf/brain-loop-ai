import { useEffect, useState } from "react";
import type { ApprovalKind, ApprovalRequest } from "@brain-loop/brain-core";
import {
  approveRequest,
  denyRequest,
  expireRequest,
  listApprovalRequests,
  onApprovalEvent,
  requestApproval,
} from "@brain-loop/desktop-client";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const sampleRequests: Record<ApprovalKind, Omit<Parameters<typeof requestApproval>[0], "kind">> = {
  command: {
    title: "Run escalated command",
    description: "Allow a runner to execute a command that needs explicit user approval.",
    risk: "The command may change files or system state outside normal automation.",
    command: "example --requires-approval",
    path: "/Users/M1PRO/Documents/code/brain-loop",
    requestedBy: "manual-stub",
  },
  permission: {
    title: "Use authenticated browser fallback",
    description: "Allow a runner to use a permission-sensitive fallback for an authenticated workflow.",
    risk: "The action may depend on local user session state.",
    path: "/Users/M1PRO/Documents/code/brain-loop",
    requestedBy: "manual-stub",
  },
  destructive: {
    title: "Override queue status",
    description: "Allow a destructive queue-state override requested by automation.",
    risk: "The action can block or replace a queue item state.",
    path: "/Users/M1PRO/.codex/brain-project-manager/queues/handoffs",
    requestedBy: "manual-stub",
  },
};

export function ApprovalPanel() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function refresh() {
    try {
      setRequests(await listApprovalRequests());
      setMessage(null);
    } catch (e) {
      setMessage({ ok: false, text: `Unable to load approvals: ${String(e)}` });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    let unlisten: (() => void)[] = [];
    void onApprovalEvent(() => void refresh()).then((listeners) => {
      unlisten = listeners;
    });
    return () => {
      unlisten.forEach((stop) => stop());
    };
  }, []);

  async function createSample(kind: ApprovalKind) {
    try {
      await requestApproval({ kind, ...sampleRequests[kind] });
      await refresh();
    } catch (e) {
      setMessage({ ok: false, text: String(e) });
    }
  }

  async function resolveRequest(request: ApprovalRequest, action: "approve" | "deny" | "expire") {
    try {
      if (action === "approve") {
        await approveRequest(request.id, "desktop-user");
      } else if (action === "deny") {
        await denyRequest(request.id, "desktop-user", "Denied from the desktop approval card.");
      } else {
        await expireRequest(request.id, "desktop-user", "Expired from the desktop approval card.");
      }
      await refresh();
    } catch (e) {
      setMessage({ ok: false, text: String(e) });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.ok ? "default" : "destructive"}>
          {message.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          <AlertTitle>{message.ok ? "Approval updated" : "Approval error"}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => void createSample("command")}>
          Stub Command
        </Button>
        <Button size="sm" variant="outline" onClick={() => void createSample("permission")}>
          Stub Permission
        </Button>
        <Button size="sm" variant="outline" onClick={() => void createSample("destructive")}>
          Stub Destructive
        </Button>
      </div>

      {requests.length === 0 ? (
        <Alert>
          <Clock className="size-4" />
          <AlertTitle>No approval requests</AlertTitle>
          <AlertDescription>Sensitive runner actions will appear here before they continue.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
                  {request.title}
                  <Badge variant={request.status === "pending" ? "default" : "secondary"}>
                    {request.status}
                  </Badge>
                  <Badge variant={request.kind === "destructive" ? "destructive" : "outline"}>
                    {request.kind}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0 text-sm">
                <p className="text-muted-foreground">{request.description}</p>
                <div className="rounded-md bg-muted p-3 text-xs">
                  <div><span className="font-medium">Risk:</span> {request.risk}</div>
                  {request.command && <div><span className="font-medium">Command:</span> {request.command}</div>}
                  {request.path && <div className="break-all"><span className="font-medium">Path:</span> {request.path}</div>}
                  {request.queueItemId && <div><span className="font-medium">Queue:</span> {request.queueItemId}</div>}
                  {request.runnerId && <div><span className="font-medium">Runner:</span> {request.runnerId}</div>}
                  {request.sessionId && <div><span className="font-medium">Session:</span> {request.sessionId}</div>}
                </div>

                <div className="space-y-1 border-l-2 pl-3 text-xs">
                  {request.history.map((entry, index) => (
                    <div key={`${entry.at}-${index}`}>
                      <span className="text-muted-foreground">{new Date(entry.at).toLocaleString()}</span>
                      <span className="ml-2 font-medium">{entry.event}</span>
                      <span className="ml-1 text-muted-foreground">by {entry.by}</span>
                      {entry.note && <span className="ml-1 text-muted-foreground">- {entry.note}</span>}
                    </div>
                  ))}
                </div>

                {request.status === "pending" && (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => void resolveRequest(request, "expire")}>
                      Expire
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => void resolveRequest(request, "deny")}>
                      Deny
                    </Button>
                    <Button size="sm" onClick={() => void resolveRequest(request, "approve")}>
                      Approve
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
