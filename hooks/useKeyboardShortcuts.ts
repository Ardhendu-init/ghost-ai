"use client";

import { useEffect } from "react";

interface ZoomControls {
  zoomIn: (opts?: { duration?: number }) => void;
  zoomOut: (opts?: { duration?: number }) => void;
}

interface KeyboardShortcutsOptions {
  rfInstance: ZoomControls | null;
  undo: () => void;
  redo: () => void;
}

export function useKeyboardShortcuts({
  rfInstance,
  undo,
  redo,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || target.isContentEditable) {
        return;
      }

      const meta = e.metaKey || e.ctrlKey;

      const key = e.key.toLowerCase();
      if (meta && e.shiftKey && key === "z") {
        e.preventDefault();
        redo();
        return;
      }
      if (meta && !e.shiftKey && key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (meta && key === "y") {
        e.preventDefault();
        redo();
        return;
      }

      if (!meta && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        rfInstance?.zoomIn({ duration: 200 });
        return;
      }
      if (!meta && e.key === "-") {
        e.preventDefault();
        rfInstance?.zoomOut({ duration: 200 });
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rfInstance, undo, redo]);
}
