"use client";

import { NodeToolbar, Position } from "@xyflow/react";
import { NODE_COLORS } from "@/types/canvas";
import { useUpdateNodeColor } from "@/contexts/canvas-actions";

interface NodeColorToolbarProps {
  id: string;
  selected: boolean;
  activeBg?: string;
}

export function NodeColorToolbar({ id, selected, activeBg }: NodeColorToolbarProps) {
  const updateColor = useUpdateNodeColor();

  return (
    <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
      <div
        className="flex gap-1.5 items-center rounded-xl px-2.5 py-1.5 shadow-xl border border-border"
        style={{ background: "var(--card)" }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {NODE_COLORS.map(({ bg, text }) => (
          <Swatch
            key={bg}
            bg={bg}
            text={text}
            isActive={activeBg === bg}
            onSelect={() => updateColor(id, bg, text)}
          />
        ))}
      </div>
    </NodeToolbar>
  );
}

function Swatch({
  bg,
  text,
  isActive,
  onSelect,
}: {
  bg: string;
  text: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Set node color ${bg}`}
      title={`Set node color ${bg}`}
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        backgroundColor: bg,
        border: `2px solid ${isActive ? text : "transparent"}`,
        boxShadow: isActive ? `0 0 0 1px ${text}60` : "none",
        cursor: "pointer",
        padding: 0,
        outline: "2px solid transparent",
        outlineOffset: 2,
        flexShrink: 0,
        transition: "border-color 0.12s, box-shadow 0.12s",
      }}
      onFocus={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = `0 0 0 2px ${text}AA`;
      }}
      onBlur={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = isActive ? `0 0 0 1px ${text}60` : "none";
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = `0 0 5px 1px ${text}50`;
        if (!isActive) el.style.borderColor = `${text}55`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = isActive ? `0 0 0 1px ${text}60` : "none";
        el.style.borderColor = isActive ? text : "transparent";
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    />
  );
}
