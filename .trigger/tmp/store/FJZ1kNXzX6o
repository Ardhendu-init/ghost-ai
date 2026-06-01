import {
  OpenRouter,
  external_exports,
  getLiveblocks,
  mutateFlow
} from "../../../../chunk-B73RTZ5U.mjs";
import {
  logger,
  schemaTask,
  tags,
  wait
} from "../../../../chunk-7WH5B5I6.mjs";
import "../../../../chunk-SZ6GL6S4.mjs";
import {
  __name,
  init_esm
} from "../../../../chunk-3VTTNDYQ.mjs";

// trigger/design-agent.ts
init_esm();

// types/ai.ts
init_esm();

// types/canvas.ts
init_esm();
var NODE_COLORS = [
  { bg: "#1F1F1F", text: "#EDEDED" },
  { bg: "#10233D", text: "#52A8FF" },
  { bg: "#2E1938", text: "#BF7AF0" },
  { bg: "#331B00", text: "#FF990A" },
  { bg: "#3C1618", text: "#FF6166" },
  { bg: "#3A1726", text: "#F75F8F" },
  { bg: "#0F2E18", text: "#62C073" },
  { bg: "#062822", text: "#0AC7B4" }
];

// types/ai.ts
var AI_PALETTE = {
  neutral: NODE_COLORS[0],
  blue: NODE_COLORS[1],
  purple: NODE_COLORS[2],
  orange: NODE_COLORS[3],
  red: NODE_COLORS[4],
  pink: NODE_COLORS[5],
  green: NODE_COLORS[6],
  teal: NODE_COLORS[7]
};
var PALETTE_NAMES = Object.keys(AI_PALETTE);
var ALLOWED_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon"
];
var SHAPE_DIMENSIONS = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 120, height: 120 },
  circle: { width: 96, height: 96 },
  pill: { width: 160, height: 64 },
  cylinder: { width: 100, height: 120 },
  hexagon: { width: 110, height: 110 }
};

// trigger/design-agent.ts
var MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";
var DesignAgentPayload = external_exports.object({
  prompt: external_exports.string().min(1),
  roomId: external_exports.string().min(1)
});
var flowClient = /* @__PURE__ */ __name(() => getLiveblocks(), "flowClient");
async function publishStatus(roomId, state, message, cursor = null) {
  const status = { state, message, cursor, updatedAt: Date.now() };
  try {
    await getLiveblocks().mutateStorage(roomId, ({ root }) => {
      root.set("ai", status);
    });
  } catch (err) {
    logger.warn("Failed to publish AI status", { err: String(err) });
  }
}
__name(publishStatus, "publishStatus");
async function clearStatus(roomId) {
  try {
    await getLiveblocks().mutateStorage(roomId, ({ root }) => {
      root.set("ai", null);
    });
  } catch (err) {
    logger.warn("Failed to clear AI status", { err: String(err) });
  }
}
__name(clearStatus, "clearStatus");
async function clearLater(roomId) {
  await wait.for({ seconds: 4 });
  await clearStatus(roomId);
}
__name(clearLater, "clearLater");
function buildSystemPrompt() {
  return [
    "You are Ghost AI, an expert software-architecture diagram generator.",
    "You translate a natural-language request into a structured set of edits for a collaborative diagram canvas.",
    "",
    "Respond with a SINGLE JSON object (no markdown, no prose) of the form:",
    '{ "summary": string, "actions": Action[] }',
    "",
    "Each Action is one of:",
    '- { "op": "addNode", "id": string, "label": string, "shape"?: Shape, "color"?: Color, "x"?: number, "y"?: number, "width"?: number, "height"?: number }',
    '- { "op": "moveNode", "id": string, "x": number, "y": number }',
    '- { "op": "resizeNode", "id": string, "width": number, "height": number }',
    '- { "op": "updateNode", "id": string, "label"?: string, "shape"?: Shape, "color"?: Color }',
    '- { "op": "deleteNode", "id": string }',
    '- { "op": "addEdge", "id": string, "source": string, "target": string, "label"?: string }',
    '- { "op": "deleteEdge", "id": string }',
    "",
    `Allowed Shape values: ${ALLOWED_SHAPES.join(", ")}.`,
    `Allowed Color values: ${PALETTE_NAMES.join(", ")}.`,
    "",
    "Shape semantics: rectangle = general component/service, pill = process/service,",
    "cylinder = database/storage, diamond = decision/gateway, circle = event/endpoint,",
    "hexagon = external system/boundary.",
    "",
    "Layout & spacing rules (MUST follow):",
    "- Place nodes on a grid. Columns are 260px apart on x, rows are 160px apart on y.",
    "- Flow direction is left-to-right or top-to-bottom; keep related nodes aligned.",
    "- Never overlap nodes; leave at least 80px of gap between any two nodes.",
    "- Start the layout near x=0, y=0 unless extending an existing diagram.",
    "- Give every new node a unique id (e.g. 'n1', 'n2'). Use those same ids in edges.",
    "- When adding edges, source/target must reference node ids that exist or that you are adding.",
    "- Pick colors meaningfully (e.g. databases teal, gateways blue, external systems purple).",
    "- Edge labels: only add a label when it conveys unique information not obvious from the nodes.",
    "- Limit labeled edges to at most 5-6 per diagram; prefer leaving most edges unlabeled.",
    "",
    "Keep designs focused: typically 4-12 nodes unless the user asks for more.",
    "Only emit delete/move/resize/update ops when the user explicitly asks to modify existing nodes."
  ].join("\n");
}
__name(buildSystemPrompt, "buildSystemPrompt");
function buildUserPrompt(prompt, existing) {
  if (existing.length === 0) {
    return `The canvas is currently empty.

Request: ${prompt}`;
  }
  const summary = existing.slice(0, 50).map(
    (n) => `- id="${n.id}" label="${n.data?.label ?? ""}" shape="${n.data?.shape ?? "rectangle"}" at (${Math.round(n.position.x)}, ${Math.round(n.position.y)})`
  ).join("\n");
  return `The canvas already contains these nodes:
${summary}

Request: ${prompt}`;
}
__name(buildUserPrompt, "buildUserPrompt");
function parsePlan(raw) {
  let text = raw.trim();
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  if (!text.startsWith("{")) {
    const brace = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (brace !== -1 && end !== -1) text = text.slice(brace, end + 1);
  }
  const parsed = JSON.parse(text);
  const actions = Array.isArray(parsed.actions) ? parsed.actions : [];
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "Updated the design.",
    actions
  };
}
__name(parsePlan, "parsePlan");
function safeShape(shape) {
  return ALLOWED_SHAPES.includes(shape) ? shape : "rectangle";
}
__name(safeShape, "safeShape");
function colorPair(color) {
  if (typeof color === "string" && color in AI_PALETTE) return AI_PALETTE[color];
  return AI_PALETTE.neutral;
}
__name(colorPair, "colorPair");
var designAgentTask = schemaTask({
  id: "design-agent",
  schema: DesignAgentPayload,
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1e3,
    maxTimeoutInMs: 3e4,
    randomize: true
  },
  run: /* @__PURE__ */ __name(async (payload, { ctx }) => {
    const { prompt, roomId } = payload;
    const client = flowClient();
    await tags.add([`design-agent:room:${roomId}`, "design-agent:started"]);
    logger.info("Design agent started", { roomId, prompt });
    await publishStatus(roomId, "thinking", "Ghost AI is reading your prompt…");
    let existingNodes = [];
    try {
      await mutateFlow({ client, roomId }, (flow) => {
        existingNodes = [...flow.nodes];
      });
    } catch (err) {
      logger.warn("Could not read existing canvas", { err: String(err) });
    }
    let plan;
    try {
      const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY / OPENAI_API_KEY");
      const openrouter = new OpenRouter({ apiKey });
      const completion = await openrouter.chat.send({
        chatRequest: {
          model: MODEL,
          temperature: 0.4,
          messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: buildUserPrompt(prompt, existingNodes) }
          ]
        }
      });
      const content = completion.choices?.[0]?.message?.content ?? "";
      plan = parsePlan(typeof content === "string" ? content : "");
      await tags.add("design-agent:planned");
      logger.info("Design plan generated", { actions: plan.actions.length });
    } catch (err) {
      logger.error("Design generation failed", { err: String(err) });
      await publishStatus(
        roomId,
        "error",
        "Ghost AI couldn't generate a design. Please try again."
      );
      await clearLater(roomId);
      throw err;
    }
    if (plan.actions.length === 0) {
      await publishStatus(roomId, "done", plan.summary || "Nothing to change.");
      await clearLater(roomId);
      return { roomId, applied: 0, summary: plan.summary };
    }
    await publishStatus(roomId, "working", "Ghost AI is drawing your design…");
    const tag = ctx.run.id;
    const idMap = /* @__PURE__ */ new Map();
    const resolveId = /* @__PURE__ */ __name((id) => idMap.get(id) ?? id, "resolveId");
    let gridIndex = 0;
    const nextGridPos = /* @__PURE__ */ __name(() => {
      const col = gridIndex % 4;
      const row = Math.floor(gridIndex / 4);
      gridIndex += 1;
      return { x: col * 260, y: row * 160 };
    }, "nextGridPos");
    const addActions = plan.actions.filter(
      (a) => a.op === "addNode"
    );
    const otherActions = plan.actions.filter((a) => a.op !== "addNode");
    let applied = 0;
    for (const action of addActions) {
      const shape = safeShape(action.shape);
      const dims = SHAPE_DIMENSIONS[shape];
      const width = Number.isFinite(action.width) && action.width > 0 ? action.width : dims.width;
      const height = Number.isFinite(action.height) && action.height > 0 ? action.height : dims.height;
      const pos = Number.isFinite(action.x) && Number.isFinite(action.y) ? { x: action.x, y: action.y } : nextGridPos();
      const canvasId = `ai-${tag}-${action.id}`;
      idMap.set(action.id, canvasId);
      const { bg, text } = colorPair(action.color);
      const node = {
        id: canvasId,
        type: "canvasNode",
        position: pos,
        data: {
          label: String(action.label ?? ""),
          shape,
          color: bg,
          textColor: text
        },
        style: { width, height }
      };
      await publishStatus(
        roomId,
        "working",
        `Adding "${node.data.label || shape}"…`,
        { x: pos.x + width / 2, y: pos.y + height / 2 }
      );
      try {
        await mutateFlow({ client, roomId }, (flow) => {
          flow.addNode(node);
        });
        applied += 1;
      } catch (err) {
        logger.warn("Failed to add node", { id: canvasId, err: String(err) });
      }
      await wait.for({ seconds: 1 });
    }
    if (otherActions.length > 0) {
      const LABEL_OFFSETS = [-30, 30, -15, 15, 0, -45, 45];
      let labeledEdgeCount = 0;
      try {
        await mutateFlow({ client, roomId }, (flow) => {
          for (const action of otherActions) {
            switch (action.op) {
              case "addEdge": {
                const labelOffsetY = action.label ? LABEL_OFFSETS[labeledEdgeCount++ % LABEL_OFFSETS.length] : void 0;
                const edge = {
                  id: `ai-${tag}-${action.id}`,
                  type: "canvasEdge",
                  source: resolveId(action.source),
                  target: resolveId(action.target),
                  data: action.label ? { label: String(action.label), labelOffsetY } : {}
                };
                flow.addEdge(edge);
                applied += 1;
                break;
              }
              case "moveNode": {
                flow.updateNode(resolveId(action.id), {
                  position: { x: action.x, y: action.y }
                });
                applied += 1;
                break;
              }
              case "resizeNode": {
                flow.updateNode(resolveId(action.id), {
                  width: action.width,
                  height: action.height,
                  style: { width: action.width, height: action.height }
                });
                applied += 1;
                break;
              }
              case "updateNode": {
                const data = {};
                if (action.label != null) data.label = String(action.label);
                if (action.shape) data.shape = safeShape(action.shape);
                if (action.color) {
                  const { bg, text } = colorPair(action.color);
                  data.color = bg;
                  data.textColor = text;
                }
                flow.updateNodeData(
                  resolveId(action.id),
                  data
                );
                applied += 1;
                break;
              }
              case "deleteNode": {
                const realId = resolveId(action.id);
                flow.removeNode(realId);
                for (const edge of flow.edges) {
                  if (edge.source === realId || edge.target === realId) {
                    flow.removeEdge(edge.id);
                  }
                }
                applied += 1;
                break;
              }
              case "deleteEdge": {
                flow.removeEdge(resolveId(action.id));
                applied += 1;
                break;
              }
            }
          }
        });
      } catch (err) {
        logger.error("Failed to apply edits", { err: String(err) });
        await publishStatus(
          roomId,
          "error",
          "Ghost AI hit an error while drawing. Some changes may be incomplete."
        );
        await clearLater(roomId);
        throw err;
      }
    }
    await tags.add("design-agent:complete");
    await publishStatus(roomId, "done", plan.summary || "Design complete.");
    logger.info("Design agent complete", { roomId, applied });
    await clearLater(roomId);
    return { roomId, applied, summary: plan.summary };
  }, "run")
});
export {
  designAgentTask
};
//# sourceMappingURL=design-agent.mjs.map
