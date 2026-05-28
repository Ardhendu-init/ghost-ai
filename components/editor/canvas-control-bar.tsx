"use client";

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Trash2 } from "lucide-react";

interface ZoomControls {
  zoomIn: (opts?: { duration?: number }) => void;
  zoomOut: (opts?: { duration?: number }) => void;
  fitView: (opts?: { duration?: number }) => void;
}

interface CanvasControlBarProps {
  rfInstance: ZoomControls | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canClear: boolean;
}

function ControlButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
    >
      {children}
    </button>
  );
}

export function CanvasControlBar({
  rfInstance,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  canClear,
}: CanvasControlBarProps) {
  function handleClear() {
    if (!canClear) return;
    const ok = window.confirm(
      "Clear the canvas? This removes all nodes and edges. You can undo with Cmd/Ctrl+Z.",
    );
    if (ok) onClear();
  }

  return (
    <div className="flex items-center gap-0.5 px-2.5 py-1.5 bg-card border border-border rounded-full shadow-lg mb-2">
      <ControlButton
        title="Zoom out"
        onClick={() => rfInstance?.zoomOut({ duration: 200 })}
      >
        <ZoomOut className="w-4 h-4" />
      </ControlButton>
      <ControlButton
        title="Fit view"
        onClick={() => rfInstance?.fitView({ duration: 200 })}
      >
        <Maximize2 className="w-4 h-4" />
      </ControlButton>
      <ControlButton
        title="Zoom in"
        onClick={() => rfInstance?.zoomIn({ duration: 200 })}
      >
        <ZoomIn className="w-4 h-4" />
      </ControlButton>

      <div className="w-px h-5 bg-border mx-1" />

      <ControlButton
        title="Undo"
        onClick={onUndo}
        disabled={!canUndo}
      >
        <Undo2 className="w-4 h-4" />
      </ControlButton>
      <ControlButton
        title="Redo"
        onClick={onRedo}
        disabled={!canRedo}
      >
        <Redo2 className="w-4 h-4" />
      </ControlButton>

      <div className="w-px h-5 bg-border mx-1" />

      <ControlButton
        title="Clear canvas"
        onClick={handleClear}
        disabled={!canClear}
      >
        <Trash2 className="w-4 h-4" />
      </ControlButton>
    </div>
  );
}
