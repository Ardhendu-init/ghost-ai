"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getSmoothStepPath, EdgeLabelRenderer } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import type { CanvasEdge } from "@/types/canvas";
import { useUpdateEdgeLabel } from "@/contexts/canvas-actions";

export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<CanvasEdge>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);
  const updateEdgeLabel = useUpdateEdgeLabel();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
  });

  const label = data?.label ?? "";
  const isHighlighted = selected || isHovered;
  const strokeColor = selected
    ? "var(--primary)"
    : isHovered
      ? "var(--foreground)"
      : "var(--muted-foreground)";
  const opacity = isHighlighted ? 1 : 0.5;
  const markerId = `arrow-${id}`;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const save = useCallback(
    (value: string) => {
      setIsEditing(false);
      if (!cancelRef.current) {
        updateEdgeLabel(id, value.trim());
      }
      cancelRef.current = false;
    },
    [id, updateEdgeLabel],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => save(e.target.value),
    [save],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        save(e.currentTarget.value);
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelRef.current = true;
        e.currentTarget.blur();
      }
    },
    [save],
  );

  const inputWidth = Math.max((label.length + 2) * 7.5, 56);

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Wide transparent path for easier hover/click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
      />

      {/* Visible edge line */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={opacity}
        markerEnd={`url(#${markerId})`}
        style={{ pointerEvents: "none", transition: "opacity 0.15s, stroke 0.15s" }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + (data?.labelOffsetY ?? 0)}px)`,
            pointerEvents: "all",
          }}
          className="absolute nodrag nopan"
          onDoubleClick={handleDoubleClick}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              defaultValue={label}
              placeholder="Label"
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="nodrag nopan bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground outline-none focus:border-primary"
              style={{ width: inputWidth }}
            />
          ) : label ? (
            <span className="bg-card border border-border rounded-full px-2 py-0.5 text-xs text-muted-foreground cursor-pointer select-none">
              {label}
            </span>
          ) : (
            isHighlighted && (
              <span className="text-[10px] text-muted-foreground/30 select-none cursor-text">
                +label
              </span>
            )
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
