import { NODE_COLORS, type NodeColorPair, type ShapeType } from "./canvas";

/**
 * Shared AI design-agent types.
 *
 * These types are consumed by both the Trigger.dev background task
 * (`trigger/design-agent.ts`) and the client overlay components, so they live
 * in a framework-agnostic module.
 */

/** Lifecycle state of the AI agent while a design run is in progress. */
export type AiState = "thinking" | "working" | "done" | "error";

/**
 * Shared AI status published into Liveblocks storage under the `ai` key so that
 * every participant in the room sees the same presence + progress feed.
 */
// NOTE: must be a `type`, not an `interface` — Liveblocks Storage values must be
// assignable to its JSON/LSON check, and interfaces lack the implicit index
// signature that satisfies it.
export type AiStatus = {
  /** Coarse lifecycle phase, drives the status banner styling. */
  state: AiState;
  /** Human-readable progress message shown to all collaborators. */
  message: string;
  /** Ghost cursor position in flow coordinates, or null when hidden. */
  cursor: { x: number; y: number } | null;
  /** Epoch ms of the last update (used to ignore stale writes on the client). */
  updatedAt: number;
};

/**
 * Palette names the model is allowed to choose from. Each maps to a fixed
 * `NodeColorPair` from the canvas palette so generated designs always stay on
 * the approved colors (see `context/ui-context.md`).
 */
export const AI_PALETTE: Record<string, NodeColorPair> = {
  neutral: NODE_COLORS[0],
  blue: NODE_COLORS[1],
  purple: NODE_COLORS[2],
  orange: NODE_COLORS[3],
  red: NODE_COLORS[4],
  pink: NODE_COLORS[5],
  green: NODE_COLORS[6],
  teal: NODE_COLORS[7],
};

export type PaletteName = keyof typeof AI_PALETTE;

export const PALETTE_NAMES = Object.keys(AI_PALETTE) as PaletteName[];

export const ALLOWED_SHAPES: ShapeType[] = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
];

/** Default node dimensions per shape (mirrors the shape panel defaults). */
export const SHAPE_DIMENSIONS: Record<ShapeType, { width: number; height: number }> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 120, height: 120 },
  circle: { width: 96, height: 96 },
  pill: { width: 160, height: 64 },
  cylinder: { width: 100, height: 120 },
  hexagon: { width: 110, height: 110 },
};

/**
 * Structured edit operations the model returns. Node ids referenced here are
 * model-local for newly added nodes (remapped to real canvas ids by the task)
 * and real canvas ids when editing existing nodes.
 */
export type DesignAction =
  | {
      op: "addNode";
      id: string;
      label: string;
      shape?: ShapeType;
      color?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }
  | { op: "moveNode"; id: string; x: number; y: number }
  | { op: "resizeNode"; id: string; width: number; height: number }
  | { op: "updateNode"; id: string; label?: string; shape?: ShapeType; color?: string }
  | { op: "deleteNode"; id: string }
  | { op: "addEdge"; id: string; source: string; target: string; label?: string }
  | { op: "deleteEdge"; id: string };

/** Full plan returned by the model. */
export interface DesignPlan {
  /** One-line summary of what was designed, surfaced in the status feed. */
  summary: string;
  actions: DesignAction[];
}
