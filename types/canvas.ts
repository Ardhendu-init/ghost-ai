import type { Node, Edge } from "@xyflow/react";

export type ShapeType =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon";

export type NodeData = {
  label: string;
  color?: string;
  shape?: ShapeType;
};

export type CanvasNode = Node<NodeData, "canvasNode">;
export type CanvasEdge = Edge<Record<string, never>, "canvasEdge">;

export type DragPayload = {
  shape: ShapeType;
  width: number;
  height: number;
};
