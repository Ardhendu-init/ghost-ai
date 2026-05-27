import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export type CanvasTemplate = {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

function n(
  id: string,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  shape: CanvasNode["data"]["shape"],
  color: string,
  textColor: string,
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, shape, color, textColor },
    style: { width: w, height: h },
  };
}

function e(id: string, source: string, target: string, label?: string): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    data: label ? { label } : {},
  };
}

// ─── Microservices Architecture ───────────────────────────────────────────────

const microservicesNodes: CanvasNode[] = [
  n("ms-gw",    "API Gateway",      340,  40, 160, 60, "rectangle", "#10233D", "#52A8FF"),
  n("ms-auth",  "Auth Service",      60, 180, 140, 60, "rectangle", "#2E1938", "#BF7AF0"),
  n("ms-user",  "User Service",     260, 180, 140, 60, "rectangle", "#2E1938", "#BF7AF0"),
  n("ms-order", "Order Service",    460, 180, 140, 60, "rectangle", "#2E1938", "#BF7AF0"),
  n("ms-pay",   "Payment Service",  660, 180, 140, 60, "rectangle", "#2E1938", "#BF7AF0"),
  n("ms-db1",   "Auth DB",           60, 340, 100, 80, "cylinder",  "#062822", "#0AC7B4"),
  n("ms-db2",   "User DB",          260, 340, 100, 80, "cylinder",  "#062822", "#0AC7B4"),
  n("ms-db3",   "Order DB",         460, 340, 100, 80, "cylinder",  "#062822", "#0AC7B4"),
  n("ms-db4",   "Payment DB",       660, 340, 100, 80, "cylinder",  "#062822", "#0AC7B4"),
];

const microservicesEdges: CanvasEdge[] = [
  e("ms-e1", "ms-gw",    "ms-auth"),
  e("ms-e2", "ms-gw",    "ms-user"),
  e("ms-e3", "ms-gw",    "ms-order"),
  e("ms-e4", "ms-gw",    "ms-pay"),
  e("ms-e5", "ms-auth",  "ms-db1"),
  e("ms-e6", "ms-user",  "ms-db2"),
  e("ms-e7", "ms-order", "ms-db3"),
  e("ms-e8", "ms-pay",   "ms-db4"),
];

// ─── CI/CD Pipeline ───────────────────────────────────────────────────────────

const cicdNodes: CanvasNode[] = [
  n("ci-code",   "Code Commit",    40,  160, 130, 56, "rectangle", "#1F1F1F", "#EDEDED"),
  n("ci-build",  "Build",         220,  160, 110, 56, "rectangle", "#0F2E18", "#62C073"),
  n("ci-test",   "Unit Tests",    380,  160, 110, 56, "rectangle", "#0F2E18", "#62C073"),
  n("ci-docker", "Docker Build",  540,  160, 130, 56, "rectangle", "#10233D", "#52A8FF"),
  n("ci-reg",    "Registry",      720,  140, 110, 80, "cylinder",  "#10233D", "#52A8FF"),
  n("ci-stg",    "Deploy Staging",880,   60, 140, 56, "rectangle", "#331B00", "#FF990A"),
  n("ci-e2e",    "E2E Tests",    1080,   60, 110, 56, "rectangle", "#0F2E18", "#62C073"),
  n("ci-prod",   "Deploy Prod",  1080,  220, 130, 56, "rectangle", "#331B00", "#FF990A"),
];

const cicdEdges: CanvasEdge[] = [
  e("ci-e1", "ci-code",   "ci-build"),
  e("ci-e2", "ci-build",  "ci-test"),
  e("ci-e3", "ci-test",   "ci-docker"),
  e("ci-e4", "ci-docker", "ci-reg"),
  e("ci-e5", "ci-reg",    "ci-stg"),
  e("ci-e6", "ci-stg",    "ci-e2e"),
  e("ci-e7", "ci-e2e",    "ci-prod"),
];

// ─── Event-Driven System ──────────────────────────────────────────────────────

const eventDrivenNodes: CanvasNode[] = [
  n("ev-prod", "Producer",          140, 200, 120, 120, "diamond",   "#2E1938", "#BF7AF0"),
  n("ev-bus",  "Event Bus",         360, 155, 130, 130, "hexagon",   "#062822", "#0AC7B4"),
  n("ev-ca",   "Consumer A",        580,  60, 130,  56, "rectangle", "#0F2E18", "#62C073"),
  n("ev-cb",   "Consumer B",        580, 180, 130,  56, "rectangle", "#0F2E18", "#62C073"),
  n("ev-cc",   "Consumer C",        580, 300, 130,  56, "rectangle", "#0F2E18", "#62C073"),
  n("ev-dlq",  "Dead Letter Queue", 580, 400, 140,  70, "cylinder",  "#3C1618", "#FF6166"),
];

const eventDrivenEdges: CanvasEdge[] = [
  e("ev-e1", "ev-prod", "ev-bus"),
  e("ev-e2", "ev-bus",  "ev-ca"),
  e("ev-e3", "ev-bus",  "ev-cb"),
  e("ev-e4", "ev-bus",  "ev-cc"),
  e("ev-e5", "ev-bus",  "ev-dlq", "on failure"),
];

// ─── Exports ──────────────────────────────────────────────────────────────────

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "API gateway routing to isolated services, each backed by its own database.",
    nodes: microservicesNodes,
    edges: microservicesEdges,
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "Commit-to-production flow with build, test, containerise, push, and deploy stages.",
    nodes: cicdNodes,
    edges: cicdEdges,
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description:
      "Producer emitting events to an event bus, fanned out to multiple consumers with a dead-letter queue.",
    nodes: eventDrivenNodes,
    edges: eventDrivenEdges,
  },
];
