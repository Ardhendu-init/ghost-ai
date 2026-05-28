import { Loader2 } from "lucide-react";

export default function EditorRoomLoading() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 flex items-center px-4 border-b border-border bg-card shrink-0">
        <div className="h-3.5 w-40 rounded-md bg-muted/50 animate-pulse" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-background relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--text-faint) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
          <p className="text-xs uppercase tracking-wider font-semibold">
            Opening project
          </p>
        </div>
      </div>
    </div>
  );
}
