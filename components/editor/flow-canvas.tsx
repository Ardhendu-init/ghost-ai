"use client";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Panel,
} from "@xyflow/react";
import type { ReactFlowInstance } from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import type { CursorsCursorProps } from "@liveblocks/react-flow";
import { useUndo, useRedo, useCanUndo, useCanRedo, useMyPresence, useOther } from "@liveblocks/react";
import { Loader2 } from "lucide-react";
import { CanvasNodeComponent } from "./canvas-node";
import { CanvasEdgeComponent } from "./canvas-edge";
import { ShapePanel } from "./shape-panel";
import { CanvasControlBar } from "./canvas-control-bar";
import { PresenceAvatars } from "./presence-avatars";
import { AiCursor, AiStatusBanner } from "./ai-overlay";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCanvasAutoSave } from "@/hooks/useCanvasAutoSave";
import type { SaveStatus } from "@/hooks/useCanvasAutoSave";
import type { CanvasNode, CanvasEdge, DragPayload } from "@/types/canvas";
import type { CanvasTemplate } from "./starter-templates";
import {
  NodeLabelContext,
  NodeColorContext,
  EdgeLabelContext,
} from "@/contexts/canvas-actions";

const nodeTypes = { canvasNode: CanvasNodeComponent };
const edgeTypes = { canvasEdge: CanvasEdgeComponent };
const defaultEdgeOptions = { type: "canvasEdge" };

/** Custom cursor — adds a spinning indicator when the user's presence has `thinking: true`. */
function ThinkingCursor({ connectionId }: CursorsCursorProps) {
  const data = useOther(connectionId, (o) => ({
    thinking: o.presence.thinking,
    name: o.info?.name ?? "",
    color: o.info?.color ?? "#6366f1",
  }));

  if (!data) return null;

  return (
    <div className="pointer-events-none select-none">
      {/* Cursor SVG */}
      <svg
        width="18"
        height="22"
        viewBox="0 0 18 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <path
          d="M1 1L1 18L5.5 13.5L8 21L11 20L8.5 12.5H16L1 1Z"
          fill={data.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {/* Name badge with optional thinking spinner */}
      {data.name && (
        <div
          className="absolute left-3.5 top-4 flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-white whitespace-nowrap shadow-sm"
          style={{ backgroundColor: data.color }}
        >
          {data.thinking && (
            <Loader2 className="h-2.5 w-2.5 animate-spin shrink-0" />
          )}
          {data.name}
        </div>
      )}
    </div>
  );
}

const cursorsComponents = { Cursor: ThinkingCursor };

const IMPORT_GAP = 80;
const DEFAULT_NODE_W = 120;
const DEFAULT_NODE_H = 60;

function nodesBounds(
  nodes: readonly CanvasNode[],
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (nodes.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const styleW =
      typeof node.style?.width === "number" ? node.style.width : undefined;
    const styleH =
      typeof node.style?.height === "number" ? node.style.height : undefined;
    const w = node.measured?.width ?? node.width ?? styleW ?? DEFAULT_NODE_W;
    const h = node.measured?.height ?? node.height ?? styleH ?? DEFAULT_NODE_H;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }
  return { minX, minY, maxX, maxY };
}

export interface FlowCanvasHandle {
  loadTemplate: (template: CanvasTemplate) => void;
  clearCanvas: () => void;
  saveNow: () => void;
}

interface FlowCanvasProps {
  projectId: string;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

export const FlowCanvas = forwardRef<FlowCanvasHandle, FlowCanvasProps>(
  function FlowCanvas({ projectId, onSaveStatusChange }, ref) {
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
      CanvasNode,
      CanvasEdge
    > | null>(null);
    const rfInstanceRef = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);

    const undo = useUndo();
    const redo = useRedo();
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();
    const [, updateMyPresence] = useMyPresence();

    useKeyboardShortcuts({ rfInstance, undo, redo });

    const onCanvasMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!rfInstance) return;
        const pos = rfInstance.screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });
        updateMyPresence({ cursor: pos });
      },
      [rfInstance, updateMyPresence],
    );

    const onCanvasMouseLeave = useCallback(() => {
      updateMyPresence({ cursor: null });
    }, [updateMyPresence]);

    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
      useLiveblocksFlow<CanvasNode, CanvasEdge>({
        suspense: true,
        nodes: { initial: [] },
        edges: { initial: [] },
      });

    // Delete / Backspace — remove selected nodes and edges via Liveblocks
    useEffect(() => {
      function handleDelete(e: KeyboardEvent) {
        if (e.key !== "Delete" && e.key !== "Backspace") return;
        const target = e.target as HTMLElement;
        const tag = target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || target.isContentEditable) return;

        const selectedNodes = nodes.filter((n) => n.selected);
        const selectedEdges = edges.filter((ed) => ed.selected);
        if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

        e.preventDefault();
        onDelete({ nodes: selectedNodes, edges: selectedEdges });
      }

      document.addEventListener("keydown", handleDelete);
      return () => document.removeEventListener("keydown", handleDelete);
    }, [nodes, edges, onDelete]);

    // Autosave
    const { save: saveNowFn } = useCanvasAutoSave(projectId, nodes, edges, onSaveStatusChange);

    // Load saved canvas on initial mount if the Liveblocks room is empty.
    // useLiveblocksFlow with suspense:true resolves before the first render,
    // so nodes/edges here already reflect true room state.
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    nodesRef.current = nodes;
    edgesRef.current = edges;

    useEffect(() => {
      if (nodesRef.current.length > 0 || edgesRef.current.length > 0) return;

      const controller = new AbortController();

      fetch(`/api/projects/${projectId}/canvas`, { signal: controller.signal })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (controller.signal.aborted) return;
          if (!data?.canvas) return;
          // Re-check: another client may have populated the room while the fetch was in flight.
          if (nodesRef.current.length > 0 || edgesRef.current.length > 0) return;
          const { nodes: savedNodes, edges: savedEdges } = data.canvas as {
            nodes: CanvasNode[];
            edges: CanvasEdge[];
          };
          if (!savedNodes?.length) return;
          onNodesChange(savedNodes.map((item) => ({ type: "add" as const, item })));
          if (savedEdges?.length) {
            onEdgesChange(savedEdges.map((item) => ({ type: "add" as const, item })));
          }
          if (!controller.signal.aborted) {
            setTimeout(() => {
              rfInstanceRef.current?.fitView({ padding: 0.15, duration: 300 });
            }, 50);
          }
        })
        .catch(() => {});

      return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateLabel = useCallback(
      (id: string, label: string) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return;
        onNodesChange([
          {
            type: "replace",
            id: node.id,
            item: { ...node, data: { ...node.data, label } },
          },
        ]);
      },
      [nodes, onNodesChange],
    );

    const updateColor = useCallback(
      (id: string, bg: string, text: string) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return;
        onNodesChange([
          {
            type: "replace",
            id: node.id,
            item: {
              ...node,
              data: { ...node.data, color: bg, textColor: text },
            },
          },
        ]);
      },
      [nodes, onNodesChange],
    );

    const updateEdgeLabel = useCallback(
      (id: string, label: string) => {
        const edge = edges.find((e) => e.id === id);
        if (!edge) return;
        onEdgesChange([
          {
            type: "replace",
            id: edge.id,
            item: { ...edge, data: { ...edge.data, label } },
          },
        ]);
      },
      [edges, onEdgesChange],
    );

    const loadTemplate = useCallback(
      (template: CanvasTemplate) => {
        if (template.nodes.length === 0) return;

        const incoming = nodesBounds(template.nodes);
        const existing = nodesBounds(nodes);
        let dx = 0;
        let dy = 0;
        if (existing && incoming) {
          dx = existing.maxX + IMPORT_GAP - incoming.minX;
          dy = existing.minY - incoming.minY;
        }

        const importTag = crypto.randomUUID().slice(0, 8);
        const idMap = new Map<string, string>();

        const newNodes: CanvasNode[] = template.nodes.map((node) => {
          const newId = `${template.id}-${importTag}-${node.id}`;
          idMap.set(node.id, newId);
          return {
            ...node,
            id: newId,
            position: { x: node.position.x + dx, y: node.position.y + dy },
            selected: true,
          };
        });

        const newEdges: CanvasEdge[] = template.edges.map((edge) => ({
          ...edge,
          id: `${template.id}-${importTag}-${edge.id}`,
          source: idMap.get(edge.source) ?? edge.source,
          target: idMap.get(edge.target) ?? edge.target,
        }));

        const deselectChanges = nodes
          .filter((node) => node.selected)
          .map((node) => ({
            type: "select" as const,
            id: node.id,
            selected: false,
          }));

        onNodesChange([
          ...deselectChanges,
          ...newNodes.map((item) => ({ type: "add" as const, item })),
        ]);
        if (newEdges.length > 0) {
          onEdgesChange(
            newEdges.map((item) => ({ type: "add" as const, item })),
          );
        }

        const focusIds = newNodes.map((node) => ({ id: node.id }));
        setTimeout(() => {
          rfInstance?.fitView({ nodes: focusIds, padding: 0.2, duration: 300 });
        }, 50);
      },
      [nodes, onNodesChange, onEdgesChange, rfInstance],
    );

    const clearCanvas = useCallback(() => {
      if (nodes.length === 0 && edges.length === 0) return;
      // Liveblocks ignores `type: "remove"` node/edge changes — deletes must
      // go through onDelete, which mutates storage directly.
      onDelete({ nodes, edges });
    }, [nodes, edges, onDelete]);

    // Keep latest closures in refs so the imperative handle stays stable
    const loadTemplateFnRef = useRef(loadTemplate);
    const clearCanvasFnRef = useRef(clearCanvas);
    const saveNowFnRef = useRef(saveNowFn);
    useEffect(() => {
      loadTemplateFnRef.current = loadTemplate;
      clearCanvasFnRef.current = clearCanvas;
      saveNowFnRef.current = saveNowFn;
    });

    useImperativeHandle(
      ref,
      () => ({
        loadTemplate: (template: CanvasTemplate) =>
          loadTemplateFnRef.current(template),
        clearCanvas: () => clearCanvasFnRef.current(),
        saveNow: () => saveNowFnRef.current(),
      }),
      [],
    );

    const onDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        if (!rfInstance) return;

        const raw = e.dataTransfer.getData("application/canvas-shape");
        if (!raw) return;

        let payload: DragPayload;
        try {
          payload = JSON.parse(raw) as DragPayload;
        } catch {
          return;
        }
        if (
          !payload?.shape ||
          !Number.isFinite(payload.width) ||
          !Number.isFinite(payload.height) ||
          payload.width <= 0 ||
          payload.height <= 0
        ) {
          return;
        }
        const position = rfInstance.screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });

        const id = `${payload.shape}-${crypto.randomUUID()}`;
        const newNode: CanvasNode = {
          id,
          type: "canvasNode",
          position: {
            x: position.x - payload.width / 2,
            y: position.y - payload.height / 2,
          },
          data: { label: "", shape: payload.shape },
          style: { width: payload.width, height: payload.height },
        };

        onNodesChange([{ type: "add", item: newNode }]);
      },
      [rfInstance, onNodesChange],
    );

    return (
      <EdgeLabelContext.Provider value={updateEdgeLabel}>
        <NodeColorContext.Provider value={updateColor}>
          <NodeLabelContext.Provider value={updateLabel}>
            <div
              className="w-full h-full"
              onDragOver={onDragOver}
              onDrop={onDrop}
              onMouseMove={onCanvasMouseMove}
              onMouseLeave={onCanvasMouseLeave}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDelete={onDelete}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                connectionMode={ConnectionMode.Loose}
                deleteKeyCode={null}
                onInit={(instance) => {
                  setRfInstance(instance);
                  rfInstanceRef.current = instance;
                  // Only fit on init if nodes already exist in the room.
                  // Skipping fitView here prevents auto-zoom when the first
                  // node is dropped onto an empty canvas.
                  if (nodesRef.current.length > 0) {
                    instance.fitView({ padding: 0.15, duration: 0 });
                  }
                }}
              >
                <Background variant={BackgroundVariant.Dots} />
                <Cursors components={cursorsComponents} />
                <AiCursor />
                <Panel position="top-center">
                  <AiStatusBanner />
                </Panel>
                <Panel position="top-right">
                  <PresenceAvatars />
                </Panel>
                <Panel position="bottom-left">
                  <CanvasControlBar
                    rfInstance={rfInstance}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={undo}
                    onRedo={redo}
                    onClear={clearCanvas}
                    canClear={nodes.length > 0 || edges.length > 0}
                  />
                </Panel>
                <Panel position="bottom-center">
                  <ShapePanel />
                </Panel>
              </ReactFlow>
            </div>
          </NodeLabelContext.Provider>
        </NodeColorContext.Provider>
      </EdgeLabelContext.Provider>
    );
  },
);
