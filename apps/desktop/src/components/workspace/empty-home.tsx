import { BrainLoopLogo } from "@/components/brain-loop-logo";

export function EmptyHome() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrainLoopLogo size={72} className="drop-shadow-[0_24px_42px_rgba(83,166,255,0.20)]" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Brain Loop</h1>
        </div>
      </div>
    </div>
  );
}
