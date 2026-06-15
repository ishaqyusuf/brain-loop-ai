import { useEffect, useState, useRef } from "react";
import { onProcessLog, readLogFile, listRecentLogs } from "@brain-loop/desktop-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export function LogsPanel() {
  const [logs, setLogs] = useState<{ 
    fileName: string; 
    lastModified: string; 
    sizeBytes: number;
    queueItemId?: string | null;
    projectId?: string | null;
    status?: string | null;
  }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const endRef = useRef<HTMLDivElement>(null);
  const selectedFileRef = useRef<string | null>(null);

  useEffect(() => {
    selectedFileRef.current = selectedFile;
  }, [selectedFile]);

  useEffect(() => {
    void listRecentLogs().then(setLogs);
  }, []);

  useEffect(() => {
    if (selectedFile) {
      void readLogFile(selectedFile).then(setContent);
    } else {
      setContent("Select a log file to view its content or watch for live runs.");
    }
  }, [selectedFile]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void onProcessLog((event) => {
      const current = selectedFileRef.current;
      if (current && event.runId && current.includes(event.runId)) {
        setContent((prev) => prev + event.line + "\n");
      }
    }).then((unsub) => {
      unlisten = unsub;
    });
    return () => unlisten?.();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [content]);

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      <div className="w-72 flex-none border-r flex flex-col overflow-hidden bg-muted/20">
        <div className="p-4 border-b font-medium text-sm shrink-0">
          Run Logs
        </div>
        <ScrollArea className="flex-1 w-full">
          {logs.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No logs found.</div>
          ) : (
            <div className="p-2 space-y-1">
              {logs.map((log) => (
                <button
                  key={log.fileName}
                  type="button"
                  onClick={() => setSelectedFile(log.fileName)}
                  className={`w-full flex flex-col items-start gap-1 p-3 rounded-md text-left transition-colors hover:bg-muted ${
                    selectedFile === log.fileName ? "bg-muted font-medium" : "text-muted-foreground"
                  }`}
                >
                  <span className="text-sm truncate w-full text-foreground">
                    {log.projectId ? log.projectId : log.fileName}
                  </span>
                  <span className="text-xs truncate w-full opacity-70">
                    {log.status ? `[${log.status}] ` : ""}
                    {log.queueItemId ? log.queueItemId.replace(".json", "").substring(0, 20) + "..." : log.lastModified}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      <div className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm overflow-auto p-4 relative">
        <pre className="whitespace-pre-wrap break-all m-0">{content}</pre>
        <div ref={endRef} />
      </div>
    </div>
  );
}
