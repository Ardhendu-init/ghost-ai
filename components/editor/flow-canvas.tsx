"use client";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Panel,
} from "@xyflow/react";
import type { ReactFlowInstance } from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react";
import { CanvasNodeComponent } from "./canvas-node";
import { CanvasEdgeComponent } from "./canvas-edge";
import { ShapePanel } from "./shape-panel";
import { CanvasControlBar } from "./canvas-control-bar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
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

export interface FlowCanvasHandle {
  loadTemplate: (template: CanvasTemplate) => void;
}

export const FlowCanvas = forwardRef<FlowCanvasHandle>(function FlowCanvas(_, ref) {
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
    CanvasNode,
    CanvasEdge
  > | null>(null);

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts({ rfInstance, undo, redo });

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

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
          item: { ...node, data: { ...node.data, color: bg, textColor: text } },
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
      // Clear existing canvas first, then add template in a separate tick
      // so Liveblocks commits the removes before processing the adds.
      if (nodes.length > 0) {
        onNodesChange(nodes.map((node) => ({ type: "remove" as const, id: node.id })));
      }
      if (edges.length > 0) {
        onEdgesChange(edges.map((edge) => ({ type: "remove" as const, id: edge.id })));
      }
      setTimeout(() => {
        onNodesChange(template.nodes.map((node) => ({ type: "add" as const, item: node })));
        onEdgesChange(template.edges.map((edge) => ({ type: "add" as const, item: edge })));
        setTimeout(() => rfInstance?.fitView({ duration: 300 }), 50);
      }, 50);
    },
    [nodes, edges, onNodesChange, onEdgesChange, rfInstance],
  );

  // Keep the latest loadTemplate in a ref so the handle stays stable
  const loadTemplateFnRef = useRef(loadTemplate);
  useEffect(() => {
    loadTemplateFnRef.current = loadTemplate;
  });

  useImperativeHandle(ref, () => ({
    loadTemplate: (template: CanvasTemplate) => loadTemplateFnRef.current(template),
  }), []);

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
          <div className="w-full h-full" onDragOver={onDragOver} onDrop={onDrop}>
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
              fitView
              onInit={setRfInstance}
            >
              <Background variant={BackgroundVariant.Dots} />
              <Cursors />
              <Panel position="bottom-left">
                <CanvasControlBar
                  rfInstance={rfInstance}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onUndo={undo}
                  onRedo={redo}
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
});
