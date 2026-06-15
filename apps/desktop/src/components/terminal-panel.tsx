import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";
import { spawnPty, writePty, resizePty, closePty, onPtyData } from "@brain-loop/desktop-client";

export function TerminalPanel(props: { 
  runId?: string; 
  command?: string; 
  args?: string[];
  queueItemId?: string;
  executionPath?: string;
}) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [pid, setPid] = useState<number | null>(null);
  const pidRef = useRef<number | null>(null);

  useEffect(() => {
    pidRef.current = pid;
  }, [pid]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: "#09090b",
        foreground: "#d4d4d4",
      },
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 13,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      if (pidRef.current) {
        void resizePty(pidRef.current, term.rows, term.cols);
      }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (!props.runId || !props.command || !xtermRef.current) return;

    const term = xtermRef.current;
    let unlistenData: (() => void) | undefined;
    let currentPid: number | null = null;

    async function init() {
      try {
        const metadata = await spawnPty(
          props.runId!, 
          props.queueItemId || null,
          props.executionPath || null,
          props.command!, 
          props.args || [], 
          term.rows, 
          term.cols
        );
        const spawnedPid = metadata.pid;
        setPid(spawnedPid);
        currentPid = spawnedPid;

        unlistenData = await onPtyData((data) => {
          if (data.pid === spawnedPid) {
            term.write(data.chunk);
          }
        });

        term.onData((data) => {
          void writePty(spawnedPid, data);
        });

      } catch (err) {
        term.write(`\r\n\x1b[31mFailed to start terminal: ${err}\x1b[0m\r\n`);
      }
    }

    void init();

    return () => {
      unlistenData?.();
      if (currentPid) {
        void closePty(currentPid).catch(() => {});
      }
    };
  }, [props.runId, props.command, props.args, props.queueItemId, props.executionPath]);

  return (
    <div className="w-full h-full overflow-hidden p-2">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}
