"use client";

import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNode } from "@/types/canvas";

export function CanvasNodeComponent({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div
      className={`w-full h-full flex items-center justify-center rounded-md bg-card border ${
        selected ? "border-primary" : "border-border"
      }`}
      style={data.color ? { backgroundColor: data.color } : undefined}
    >
      <span className="text-xs text-foreground px-2 text-center break-words leading-tight select-none">
        {data.label}
      </span>
      <Handle type="source" position={Position.Top} />
      <Handle type="source" position={Position.Right} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} />
    </div>
  );
}
