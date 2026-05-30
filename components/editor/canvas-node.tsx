"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNode, ShapeType } from "@/types/canvas";
import { useUpdateNodeLabel } from "@/contexts/canvas-actions";
import { NodeColorToolbar } from "./node-color-toolbar";

// ─── SVG shapes ─────────────────────────────────────────────────────────────

const SW = 1.5;
const SW_SEL = 2;

function stroke(selected: boolean) {
  return selected ? "var(--primary)" : "var(--border)";
}

function DiamondSVG({ selected, fill }: { selected: boolean; fill: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polygon
        points="50,2 98,50 50,98 2,50"
        style={{ fill, stroke: stroke(selected), strokeWidth: selected ? SW_SEL : SW }}
      />
    </svg>
  );
}

function HexagonSVG({ selected, fill }: { selected: boolean; fill: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <polygon
        points="50,4 90,27 90,73 50,96 10,73 10,27"
        style={{ fill, stroke: stroke(selected), strokeWidth: selected ? SW_SEL : SW }}
      />
    </svg>
  );
}

function CylinderSVG({ selected, fill }: { selected: boolean; fill: string }) {
  const s = stroke(selected);
  const sw = selected ? SW_SEL : SW;
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <rect x="4" y="20" width="92" height="62" fill={fill} stroke="none" />
      <line x1="4" y1="20" x2="4" y2="82" stroke={s} strokeWidth={sw} />
      <line x1="96" y1="20" x2="96" y2="82" stroke={s} strokeWidth={sw} />
      <ellipse cx="50" cy="20" rx="46" ry="18" fill={fill} stroke={s} strokeWidth={sw} />
      <ellipse cx="50" cy="82" rx="46" ry="18" fill={fill} stroke={s} strokeWidth={sw} />
    </svg>
  );
}

// ─── Resize handle styling ───────────────────────────────────────────────────

const RESIZER_LINE_STYLE: React.CSSProperties = {
  borderColor: "var(--primary)",
  opacity: 0.4,
};

const RESIZER_HANDLE_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  backgroundColor: "var(--card)",
  borderColor: "var(--primary)",
  borderWidth: 1.5,
  borderRadius: 2,
};

// ─── Inline label editor ─────────────────────────────────────────────────────

function NodeLabel({
  id,
  label,
  textColor,
}: {
  id: string;
  label: string;
  textColor?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef(false);
  const updateLabel = useUpdateNodeLabel();
  const colorStyle = textColor ? { color: textColor } : undefined;

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  const startEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsEditing(false);
      if (!cancelRef.current) {
        updateLabel(id, e.target.value);
      }
      cancelRef.current = false;
    },
    [id, updateLabel],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelRef.current = true;
        e.currentTarget.blur();
      }
    },
    [],
  );

  return (
    <div
      className="absolute inset-0 flex items-center justify-center cursor-text"
      onDoubleClick={startEdit}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          defaultValue={label}
          placeholder="Label"
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          rows={2}
          className="nodrag nowheel nopan w-full bg-transparent border-none outline-none text-xs text-center leading-tight resize-none overflow-hidden px-2"
          style={colorStyle}
        />
      ) : (
        <span
          className="text-xs px-2 text-center wrap-break-word leading-tight select-none pointer-events-none"
          style={colorStyle ?? { color: "var(--foreground)" }}
        >
          {label || (
            <span className="opacity-30 italic">Label</span>
          )}
        </span>
      )}
    </div>
  );
}

// ─── Node component ──────────────────────────────────────────────────────────

export function CanvasNodeComponent({ id, data, selected }: NodeProps<CanvasNode>) {
  const shape: ShapeType = data.shape ?? "rectangle";
  const sel = !!selected;
  const nodeBg = data.color ?? "var(--card)";

  // Visible source handles — white dots, fade in on node hover
  const handleClass =
    "w-2.5! h-2.5! bg-white! border-2! border-neutral-900! rounded-full! opacity-0! group-hover:opacity-100! transition-opacity! duration-150!";
  // Invisible target handles — zero-size, present only so React Flow snaps
  // incoming connections to the nearest side instead of always defaulting to Top
  const targetStyle: React.CSSProperties = {
    width: 0,
    height: 0,
    minWidth: 0,
    minHeight: 0,
    opacity: 0,
    pointerEvents: "none",
  };

  const handles = (
    <>
      <Handle type="target" id="top-in"    position={Position.Top}    style={targetStyle} />
      <Handle type="target" id="right-in"  position={Position.Right}  style={targetStyle} />
      <Handle type="target" id="bottom-in" position={Position.Bottom} style={targetStyle} />
      <Handle type="target" id="left-in"   position={Position.Left}   style={targetStyle} />
      <Handle type="source" id="top"    position={Position.Top}    className={handleClass} />
      <Handle type="source" id="right"  position={Position.Right}  className={handleClass} />
      <Handle type="source" id="bottom" position={Position.Bottom} className={handleClass} />
      <Handle type="source" id="left"   position={Position.Left}   className={handleClass} />
    </>
  );

  if (shape === "diamond" || shape === "hexagon" || shape === "cylinder") {
    return (
      <div className="group relative w-full h-full">
        <NodeColorToolbar id={id} selected={sel} activeBg={data.color} />
        <NodeResizer
          isVisible={sel}
          minWidth={60}
          minHeight={60}
          lineStyle={RESIZER_LINE_STYLE}
          handleStyle={RESIZER_HANDLE_STYLE}
        />
        {shape === "diamond" && <DiamondSVG selected={sel} fill={nodeBg} />}
        {shape === "hexagon" && <HexagonSVG selected={sel} fill={nodeBg} />}
        {shape === "cylinder" && <CylinderSVG selected={sel} fill={nodeBg} />}
        <NodeLabel id={id} label={data.label} textColor={data.textColor} />
        {handles}
      </div>
    );
  }

  // CSS shapes: rectangle, pill, circle
  const radius = shape === "rectangle" ? "rounded-md" : "rounded-full";

  return (
    <div
      className={`group relative w-full h-full border ${
        sel ? "border-primary" : "border-border"
      } ${radius}`}
      style={{ backgroundColor: nodeBg }}
    >
      <NodeColorToolbar id={id} selected={sel} activeBg={data.color} />
      <NodeResizer
        isVisible={sel}
        minWidth={60}
        minHeight={40}
        lineStyle={RESIZER_LINE_STYLE}
        handleStyle={RESIZER_HANDLE_STYLE}
      />
      <NodeLabel id={id} label={data.label} textColor={data.textColor} />
      {handles}
    </div>
  );
}
