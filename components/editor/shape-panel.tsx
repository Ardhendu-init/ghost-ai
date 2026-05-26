"use client";

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

function ShapeButton({
  shape,
  label,
  Icon,
}: {
  shape: ShapeType;
  label: string;
  Icon: LucideIcon;
}) {
  const { width, height } = SHAPE_DEFAULTS[shape];

  const handleDragStart = (e: React.DragEvent) => {
    const payload: DragPayload = { shape, width, height };
    e.dataTransfer.setData("application/canvas-shape", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      title={label}
      className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-grab active:cursor-grabbing"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export function ShapePanel() {
  return (
    <div className="flex items-center gap-0.5 px-2.5 py-1.5 bg-card border border-border rounded-full shadow-lg">
      {SHAPE_CONFIG.map(({ shape, label, Icon }) => (
        <ShapeButton key={shape} shape={shape} label={label} Icon={Icon} />
      ))}
    </div>
  );
}
