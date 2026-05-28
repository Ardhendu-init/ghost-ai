"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 2000;

export function useCanvasAutoSave(
  projectId: string,
  nodes: unknown[],
  edges: unknown[],
  onStatusChange?: (status: SaveStatus) => void,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef({ nodes, edges });

  const updateStatus = useCallback(
    (s: SaveStatus) => {
      setStatus(s);
      onStatusChange?.(s);
    },
    [onStatusChange],
  );

  useEffect(() => {
    latestDataRef.current = { nodes, edges };
  });

  const save = useCallback(async () => {
    updateStatus("saving");
    try {
      const res = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latestDataRef.current),
      });
      if (!res.ok) throw new Error("Save failed");
      updateStatus("saved");
    } catch {
      updateStatus("error");
    }
  }, [projectId, updateStatus]);

  // Debounce on nodes/edges changes (skip the very first mount render)
  const isMountRef = useRef(true);
  useEffect(() => {
    if (isMountRef.current) {
      isMountRef.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // nodes/edges identity changes captured via latestDataRef; save is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  return { status, save };
}
