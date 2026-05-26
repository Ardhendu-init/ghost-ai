"use client";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Panel,
} from "@xyflow/react";
import type { ReactFlowInstance } from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { CanvasNodeComponent } from "./canvas-node";
import { ShapePanel } from "./shape-panel";
import type { CanvasNode, CanvasEdge, DragPayload } from "@/types/canvas";

const nodeTypes = { canvasNode: CanvasNodeComponent };

let nodeCounter = 0;

export function FlowCanvas() {
  const [rfInstance, setRfInstance] =
    useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

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

      const payload = JSON.parse(raw) as DragPayload;
      const position = rfInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const id = `${payload.shape}-${Date.now()}-${++nodeCounter}`;
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
    [rfInstance, onNodesChange]
  );

  return (
    <div
      className="w-full h-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        onInit={setRfInstance}
      >
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} />
        <Cursors />
        <Panel position="bottom-center">
          <ShapePanel />
        </Panel>
      </ReactFlow>
    </div>
  );
}
