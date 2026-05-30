"use client";

import { useStorage } from "@liveblocks/react";
import { ViewportPortal } from "@xyflow/react";
import { Bot, Loader2, Check, AlertTriangle, Sparkles } from "lucide-react";
import type { AiState } from "@/types/ai";

const AI_COLOR = "#8b82ff";

/**
 * Ghost AI cursor rendered in flow coordinates so it pans/zooms with the
 * canvas. Driven by the shared `ai` status the background task writes into
 * Liveblocks storage, so every participant sees the same cursor.
 */
export function AiCursor() {
  const ai = useStorage((root) => root.ai ?? null);
  if (!ai || !ai.cursor) return null;

  return (
    <ViewportPortal>
      <div
        className="pointer-events-none absolute z-50"
        style={{
          transform: `translate(${ai.cursor.x}px, ${ai.cursor.y}px)`,
        }}
      >
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          <span
            className="absolute inline-flex h-8 w-8 animate-ping rounded-full opacity-40"
            style={{ backgroundColor: AI_COLOR }}
          />
          <div
            className="relative flex h-7 w-7 items-center justify-center rounded-full shadow-lg"
            style={{ backgroundColor: AI_COLOR }}
          >
            <Bot className="h-4 w-4 text-black" />
          </div>
          <span
            className="absolute left-8 top-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium text-black shadow"
            style={{ backgroundColor: AI_COLOR }}
          >
            Ghost AI
          </span>
        </div>
      </div>
    </ViewportPortal>
  );
}

const STATE_META: Record<
  AiState,
  { Icon: typeof Loader2; tint: string; spin?: boolean }
> = {
  thinking: { Icon: Sparkles, tint: "text-accent-ai-text", spin: false },
  working: { Icon: Loader2, tint: "text-accent-ai-text", spin: true },
  done: { Icon: Check, tint: "text-state-success" },
  error: { Icon: AlertTriangle, tint: "text-state-error" },
};

/**
 * Floating status banner reflecting the AI's current step. Visible to all
 * participants. Render inside a React Flow `<Panel>`.
 */
export function AiStatusBanner() {
  const ai = useStorage((root) => root.ai ?? null);
  if (!ai) return null;

  const meta = STATE_META[ai.state] ?? STATE_META.working;
  const { Icon } = meta;

  return (
    <div className="flex items-center gap-2 rounded-full border border-surface-border bg-surface/90 px-3 py-1.5 shadow-lg backdrop-blur-sm">
      <Icon className={`h-4 w-4 ${meta.tint} ${meta.spin ? "animate-spin" : ""}`} />
      <span className="text-xs font-medium text-copy-secondary">{ai.message}</span>
    </div>
  );
}
