import { useEffect, useState } from "react";
import type { ApprovalRequest } from "@brain-loop/brain-core";
import {
  approveRequest,
  denyRequest,
  executeApprovedDirectModelTool,
  expireRequest,
  listApprovalRequests,
  onApprovalEvent,
} from "@brain-loop/desktop-client";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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

  async function resolveRequest(request: ApprovalRequest, action: "approve" | "deny" | "expire") {
    try {
      if (action === "approve") {
        const approved = await approveRequest(request.id, "desktop-user");
        if (approved.command?.startsWith("direct-model:")) {
          await executeApprovedDirectModelTool({ approvalRequestId: approved.id });
        }
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

      {requests.length === 0 ? (
        <Alert>
          <Clock className="size-4" />
          <AlertTitle>No approval requests</AlertTitle>
          <AlertDescription>Sensitive runner actions will appear here before they continue.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <section key={request.id} className="rounded-md bg-white/[0.035] px-3.5 py-3">
              <div className="pb-2">
                <h3 className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-zinc-100">
                  {request.title}
                  <Badge variant={request.status === "pending" ? "default" : "secondary"}>
                    {request.status}
                  </Badge>
                  <Badge variant={request.kind === "destructive" ? "destructive" : "outline"}>
                    {request.kind}
                  </Badge>
                </h3>
              </div>
              <div className="space-y-3 text-[13px]">
                <p className="text-zinc-400">{request.description}</p>
                <Alert className="rounded-md border-transparent bg-white/[0.04] p-3 text-xs">
                  <AlertDescription className="space-y-1 text-xs">
                    <div><span className="font-medium">Risk:</span> {request.risk}</div>
                    {request.command && <div><span className="font-medium">Command:</span> {request.command}</div>}
                    {request.path && <div className="break-all"><span className="font-medium">Path:</span> {request.path}</div>}
                    {request.queueItemId && <div><span className="font-medium">Queue:</span> {request.queueItemId}</div>}
                    {request.runnerId && <div><span className="font-medium">Runner:</span> {request.runnerId}</div>}
                    {request.sessionId && <div><span className="font-medium">Session:</span> {request.sessionId}</div>}
                  </AlertDescription>
                </Alert>

                <Separator />
                <div className="space-y-1 border-l border-white/10 pl-3 text-xs">
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
                    <Button size="sm" variant="secondary" onClick={() => void resolveRequest(request, "expire")}>
                      Expire
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => void resolveRequest(request, "deny")}>
                      Deny
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => void resolveRequest(request, "approve")}>
                      {request.command?.startsWith("direct-model:") ? "Approve & Run" : "Approve"}
                    </Button>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
