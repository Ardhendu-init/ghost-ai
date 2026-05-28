"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ShapeType, DragPayload } from "@/types/canvas";

const SHAPE_DEFAULTS: Record<ShapeType, { width: number; height: number }> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 120, height: 120 },
  circle: { width: 96, height: 96 },
  pill: { width: 160, height: 64 },
  cylinder: { width: 100, height: 120 },
  hexagon: { width: 110, height: 110 },
};

const SHAPE_CONFIG: { shape: ShapeType; label: string; Icon: LucideIcon }[] = [
  { shape: "rectangle", label: "Rectangle", Icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", Icon: Diamond },
  { shape: "circle", label: "Circle", Icon: Circle },
  { shape: "pill", label: "Pill", Icon: Pill },
  { shape: "cylinder", label: "Cylinder", Icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", Icon: Hexagon },
];

type DragState = {
  shape: ShapeType;
  width: number;
  height: number;
  x: number;
  y: number;
};

function ShapeGhost({ shape }: { shape: ShapeType }) {
  const s = "var(--primary)";
  const sw = 1.5;

  if (shape === "rectangle") {
    return <div className="w-full h-full rounded-md border border-primary bg-card opacity-75" />;
  }
  if (shape === "pill" || shape === "circle") {
    return <div className="w-full h-full rounded-full border border-primary bg-card opacity-75" />;
  }
  if (shape === "diamond") {
    return (
      <svg className="w-full h-full opacity-75" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points="50,2 98,50 50,98 2,50" style={{ fill: "var(--card)", stroke: s, strokeWidth: sw }} />
      </svg>
    );
  }
  if (shape === "hexagon") {
    return (
      <svg className="w-full h-full opacity-75" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" style={{ fill: "var(--card)", stroke: s, strokeWidth: sw }} />
      </svg>
    );
  }
  // cylinder
  return (
    <svg className="w-full h-full opacity-75" viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x="4" y="20" width="92" height="62" style={{ fill: "var(--card)", stroke: "none" }} />
      <line x1="4" y1="20" x2="4" y2="82" stroke={s} strokeWidth={sw} />
      <line x1="96" y1="20" x2="96" y2="82" stroke={s} strokeWidth={sw} />
      <ellipse cx="50" cy="20" rx="46" ry="18" style={{ fill: "var(--card)", stroke: s, strokeWidth: sw }} />
      <ellipse cx="50" cy="82" rx="46" ry="18" style={{ fill: "none", stroke: s, strokeWidth: sw }} />
    </svg>
  );
}

function ShapePreview({ dragState }: { dragState: DragState }) {
  const SCALE = 0.6;
  const w = dragState.width * SCALE;
  const h = dragState.height * SCALE;

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: dragState.x - w / 2,
        top: dragState.y - h / 2,
        width: w,
        height: h,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <ShapeGhost shape={dragState.shape} />
    </div>,
    document.body,
  );
}

function ShapeButton({
  shape,
  label,
  Icon,
  onSetDragState,
}: {
  shape: ShapeType;
  label: string;
  Icon: LucideIcon;
  onSetDragState: (state: DragState | null) => void;
}) {
  const { width, height } = SHAPE_DEFAULTS[shape];

  const handleDragStart = (e: React.DragEvent) => {
    const payload: DragPayload = { shape, width, height };
    e.dataTransfer.setData("application/canvas-shape", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";

    // Replace the browser's native ghost with a 1×1 transparent canvas
    const ghost = document.createElement("canvas");
    ghost.width = 1;
    ghost.height = 1;
    ghost.style.cssText = "position:fixed;top:-10px;left:-10px;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);

    onSetDragState({ shape, width, height, x: e.clientX, y: e.clientY });
  };

  const handleDrag = (e: React.DragEvent) => {
    // (0, 0) means cursor has left the viewport — skip to avoid jumping
    if (e.clientX === 0 && e.clientY === 0) return;
    onSetDragState({ shape, width, height, x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    onSetDragState(null);
  };

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      title={label}
      className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-grab active:cursor-grabbing"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export function ShapePanel() {
  const [dragState, setDragState] = useState<DragState | null>(null);

  return (
    <>
      <div className="flex items-center gap-0.5 px-2.5 py-1.5 bg-card border border-border rounded-full shadow-lg">
        {SHAPE_CONFIG.map(({ shape, label, Icon }) => (
          <ShapeButton
            key={shape}
            shape={shape}
            label={label}
            Icon={Icon}
            onSetDragState={setDragState}
          />
        ))}
      </div>
      {dragState && <ShapePreview dragState={dragState} />}
    </>
  );
}
