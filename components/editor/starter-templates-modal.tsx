"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";
import type { CanvasNode, CanvasEdge, ShapeType } from "@/types/canvas";

// ─── SVG preview helpers ─────────────────────────────────────────────────────

const PREVIEW_W = 240;
const PREVIEW_H = 150;
const PAD = 10;

function getNodeCenter(node: CanvasNode) {
  const w = (node.style?.width as number | undefined) ?? 120;
  const h = (node.style?.height as number | undefined) ?? 60;
  return { cx: node.position.x + w / 2, cy: node.position.y + h / 2, w, h };
}

function calcTransform(nodes: CanvasNode[]): {
  tx: number;
  ty: number;
  scale: number;
} {
  if (nodes.length === 0) return { tx: 0, ty: 0, scale: 1 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const node of nodes) {
    const { cx, cy, w, h } = getNodeCenter(node);
    minX = Math.min(minX, cx - w / 2);
    minY = Math.min(minY, cy - h / 2);
    maxX = Math.max(maxX, cx + w / 2);
    maxY = Math.max(maxY, cy + h / 2);
  }
  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const scale = Math.min(
    (PREVIEW_W - PAD * 2) / bw,
    (PREVIEW_H - PAD * 2) / bh,
  );
  const tx = PAD + (PREVIEW_W - PAD * 2 - bw * scale) / 2 - minX * scale;
  const ty = PAD + (PREVIEW_H - PAD * 2 - bh * scale) / 2 - minY * scale;
  return { tx, ty, scale };
}

function PreviewNode({
  node,
  tx,
  ty,
  scale,
}: {
  node: CanvasNode;
  tx: number;
  ty: number;
  scale: number;
}) {
  const { cx, cy, w, h } = getNodeCenter(node);
  const sx = cx * scale + tx;
  const sy = cy * scale + ty;
  const sw = w * scale;
  const sh = h * scale;
  const shape: ShapeType = node.data.shape ?? "rectangle";
  const fill = node.data.color ?? "#1F1F1F";
  const strokeColor = "#444";
  const sw_ = 0.8;

  if (shape === "diamond") {
    const pts = `${sx},${sy - sh / 2} ${sx + sw / 2},${sy} ${sx},${sy + sh / 2} ${sx - sw / 2},${sy}`;
    return (
      <polygon
        points={pts}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={sw_}
      />
    );
  }
  if (shape === "hexagon") {
    const r = Math.min(sw, sh) / 2;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${sx + r * Math.cos(a)},${sy + r * Math.sin(a)}`;
    }).join(" ");
    return (
      <polygon
        points={pts}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={sw_}
      />
    );
  }
  if (shape === "cylinder") {
    const ry = sh * 0.18;
    return (
      <g>
        <rect
          x={sx - sw / 2}
          y={sy - sh / 2 + ry}
          width={sw}
          height={sh - ry * 2}
          fill={fill}
          stroke="none"
        />
        <ellipse
          cx={sx}
          cy={sy - sh / 2 + ry}
          rx={sw / 2}
          ry={ry}
          fill={fill}
          stroke={strokeColor}
          strokeWidth={sw_}
        />
        <ellipse
          cx={sx}
          cy={sy + sh / 2 - ry}
          rx={sw / 2}
          ry={ry}
          fill={fill}
          stroke={strokeColor}
          strokeWidth={sw_}
        />
      </g>
    );
  }
  if (shape === "circle" || shape === "pill") {
    return (
      <ellipse
        cx={sx}
        cy={sy}
        rx={sw / 2}
        ry={sh / 2}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={sw_}
      />
    );
  }
  // rectangle (default)
  return (
    <rect
      x={sx - sw / 2}
      y={sy - sh / 2}
      width={sw}
      height={sh}
      rx={2}
      ry={2}
      fill={fill}
      stroke={strokeColor}
      strokeWidth={sw_}
    />
  );
}

function PreviewEdge({
  edge,
  nodesById,
  tx,
  ty,
  scale,
}: {
  edge: CanvasEdge;
  nodesById: Map<string, CanvasNode>;
  tx: number;
  ty: number;
  scale: number;
}) {
  const src = nodesById.get(edge.source);
  const tgt = nodesById.get(edge.target);
  if (!src || !tgt) return null;
  const { cx: scx, cy: scy } = getNodeCenter(src);
  const { cx: tcx, cy: tcy } = getNodeCenter(tgt);
  return (
    <line
      x1={scx * scale + tx}
      y1={scy * scale + ty}
      x2={tcx * scale + tx}
      y2={tcy * scale + ty}
      stroke="#4a4a4a"
      strokeWidth={0.9}
      strokeDasharray="2 1.5"
    />
  );
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { tx, ty, scale } = calcTransform(template.nodes);
  const nodesById = new Map(template.nodes.map((node) => [node.id, node]));
  return (
    <svg
      width={PREVIEW_W}
      height={PREVIEW_H}
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      className="w-full h-full"
      style={{ background: "var(--background)" }}
    >
      {template.edges.map((edge) => (
        <PreviewEdge
          key={edge.id}
          edge={edge}
          nodesById={nodesById}
          tx={tx}
          ty={ty}
          scale={scale}
        />
      ))}
      {template.nodes.map((node) => (
        <PreviewNode key={node.id} node={node} tx={tx} ty={ty} scale={scale} />
      ))}
    </svg>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full min-w-[35vw]">
        <DialogHeader>
          <DialogTitle>Starter Templates</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh] py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CANVAS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="flex flex-col rounded-lg border border-border bg-card overflow-hidden"
              >
                <div
                  className="overflow-hidden bg-background"
                  style={{ aspectRatio: `${PREVIEW_W}/${PREVIEW_H}` }}
                >
                  <TemplatePreview template={template} />
                </div>
                <div className="flex flex-col gap-1.5 p-3">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {template.name}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {template.description}
                  </p>
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => {
                      onImport(template);
                      onOpenChange(false);
                    }}
                  >
                    Import
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
