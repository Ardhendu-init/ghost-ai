import { task, logger } from "@trigger.dev/sdk/v3";
import { OpenRouter } from "@openrouter/sdk";
import { mutateFlow } from "@liveblocks/react-flow/node";
import type { Node, Edge } from "@xyflow/react";
import { getLiveblocks } from "../lib/liveblocks";
import {
  AI_PALETTE,
  ALLOWED_SHAPES,
  PALETTE_NAMES,
  SHAPE_DIMENSIONS,
  type AiState,
  type AiStatus,
  type DesignAction,
  type DesignPlan,
} from "../types/ai";
import type { CanvasNode, CanvasEdge, NodeData, ShapeType } from "../types/canvas";

/**
 * Model served through OpenRouter. Swap the id here to use a different model.
 * NVIDIA Nemotron 3 Nano Omni (free) — a reasoning model, so we parse the JSON
 * out of its output rather than forcing a `json_object` response format.
 */
const MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

type DesignAgentPayload = { prompt: string; roomId: string };

// The react-flow storage helper takes a minimal Liveblocks client interface;
// our node client satisfies it structurally.
const flowClient = () =>
  getLiveblocks() as unknown as Parameters<typeof mutateFlow>[0]["client"];

/* ------------------------------------------------------------------ */
/* Shared AI status feed (Liveblocks storage `ai` key)                 */
/* ------------------------------------------------------------------ */

/** Publish the AI presence + status so every participant sees progress. */
async function publishStatus(
  roomId: string,
  state: AiState,
  message: string,
  cursor: { x: number; y: number } | null = null,
): Promise<void> {
  const status: AiStatus = { state, message, cursor, updatedAt: Date.now() };
  try {
    await getLiveblocks().mutateStorage(roomId, ({ root }) => {
      root.set("ai", status);
    });
  } catch (err) {
    // Status updates are best-effort — never let them fail the run.
    logger.warn("Failed to publish AI status", { err: String(err) });
  }
}

/** Remove the AI presence entirely once the run is finished. */
async function clearStatus(roomId: string): Promise<void> {
  try {
    await getLiveblocks().mutateStorage(roomId, ({ root }) => {
      root.set("ai", null);
    });
  } catch (err) {
    logger.warn("Failed to clear AI status", { err: String(err) });
  }
}

/** Hold the final status briefly so users see it, then clear AI presence. */
async function clearLater(roomId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 3500));
  await clearStatus(roomId);
}

/* ------------------------------------------------------------------ */
/* Prompt construction + model call                                    */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(): string {
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
    "",
    "Keep designs focused: typically 4-12 nodes unless the user asks for more.",
    "Only emit delete/move/resize/update ops when the user explicitly asks to modify existing nodes.",
  ].join("\n");
}

function buildUserPrompt(prompt: string, existing: CanvasNode[]): string {
  if (existing.length === 0) {
    return `The canvas is currently empty.\n\nRequest: ${prompt}`;
  }
  const summary = existing
    .slice(0, 50)
    .map(
      (n) =>
        `- id="${n.id}" label="${n.data?.label ?? ""}" shape="${
          n.data?.shape ?? "rectangle"
        }" at (${Math.round(n.position.x)}, ${Math.round(n.position.y)})`,
    )
    .join("\n");
  return `The canvas already contains these nodes:\n${summary}\n\nRequest: ${prompt}`;
}

/** Parse the model output into a DesignPlan, tolerating markdown fences. */
function parsePlan(raw: string): DesignPlan {
  let text = raw.trim();
  // Reasoning models often emit a <think>...</think> trace before the answer.
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Strip ```json ... ``` fences if the model added them anyway.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  // Fall back to the first {...} block if there is surrounding prose.
  if (!text.startsWith("{")) {
    const brace = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (brace !== -1 && end !== -1) text = text.slice(brace, end + 1);
  }

  const parsed = JSON.parse(text) as Partial<DesignPlan>;
  const actions = Array.isArray(parsed.actions) ? parsed.actions : [];
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "Updated the design.",
    actions: actions as DesignAction[],
  };
}

/* ------------------------------------------------------------------ */
/* Action sanitisation helpers                                         */
/* ------------------------------------------------------------------ */

function safeShape(shape: unknown): ShapeType {
  return ALLOWED_SHAPES.includes(shape as ShapeType)
    ? (shape as ShapeType)
    : "rectangle";
}

function colorPair(color: unknown): { bg: string; text: string } {
  if (typeof color === "string" && color in AI_PALETTE) return AI_PALETTE[color];
  return AI_PALETTE.neutral;
}

/* ------------------------------------------------------------------ */
/* The task                                                            */
/* ------------------------------------------------------------------ */

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const { prompt, roomId } = payload;
    const client = flowClient();

    logger.info("Design agent started", { roomId, prompt });
    await publishStatus(roomId, "thinking", "Ghost AI is reading your prompt…");

    // 1. Read the current canvas for context.
    let existingNodes: CanvasNode[] = [];
    try {
      await mutateFlow<Node, Edge>({ client, roomId }, (flow) => {
        existingNodes = [...flow.nodes] as unknown as CanvasNode[];
      });
    } catch (err) {
      logger.warn("Could not read existing canvas", { err: String(err) });
    }

    // 2. Ask Gemini for a structured plan.
    let plan: DesignPlan;
    try {
      const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY / OPENAI_API_KEY");

      // The model is instructed to return a single JSON object; `parsePlan`
      // strips reasoning traces / fences and extracts the first `{...}` block.
      const openrouter = new OpenRouter({ apiKey });
      const completion = await openrouter.chat.send({
        chatRequest: {
          model: MODEL,
          temperature: 0.4,
          messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: buildUserPrompt(prompt, existingNodes) },
          ],
        },
      });

      const content = completion.choices?.[0]?.message?.content ?? "";
      plan = parsePlan(typeof content === "string" ? content : "");
      logger.info("Design plan generated", { actions: plan.actions.length });
    } catch (err) {
      logger.error("Design generation failed", { err: String(err) });
      await publishStatus(
        roomId,
        "error",
        "Ghost AI couldn't generate a design. Please try again.",
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

    // 3. Apply the plan to the collaborative canvas.
    const tag = ctx.run.id;
    const idMap = new Map<string, string>();
    const resolveId = (id: string) => idMap.get(id) ?? id;

    // Grid fallback for nodes the model left without coordinates.
    let gridIndex = 0;
    const nextGridPos = () => {
      const col = gridIndex % 4;
      const row = Math.floor(gridIndex / 4);
      gridIndex += 1;
      return { x: col * 260, y: row * 160 };
    };

    const addActions = plan.actions.filter(
      (a): a is Extract<DesignAction, { op: "addNode" }> => a.op === "addNode",
    );
    const otherActions = plan.actions.filter((a) => a.op !== "addNode");

    let applied = 0;

    // 3a. Animate node creation — move the ghost cursor, then add the node, so
    // collaborators "watch it appear".
    for (const action of addActions) {
      const shape = safeShape(action.shape);
      const dims = SHAPE_DIMENSIONS[shape];
      const width =
        Number.isFinite(action.width) && (action.width as number) > 0
          ? (action.width as number)
          : dims.width;
      const height =
        Number.isFinite(action.height) && (action.height as number) > 0
          ? (action.height as number)
          : dims.height;
      const pos =
        Number.isFinite(action.x) && Number.isFinite(action.y)
          ? { x: action.x as number, y: action.y as number }
          : nextGridPos();

      const canvasId = `ai-${tag}-${action.id}`;
      idMap.set(action.id, canvasId);

      const { bg, text } = colorPair(action.color);
      const node: CanvasNode = {
        id: canvasId,
        type: "canvasNode",
        position: pos,
        data: {
          label: String(action.label ?? ""),
          shape,
          color: bg,
          textColor: text,
        },
        style: { width, height },
      };

      // Move the ghost cursor to the node's centre before placing it.
      await publishStatus(
        roomId,
        "working",
        `Adding "${node.data.label || shape}"…`,
        { x: pos.x + width / 2, y: pos.y + height / 2 },
      );

      try {
        await mutateFlow<Node, Edge>({ client, roomId }, (flow) => {
          flow.addNode(node as unknown as Node);
        });
        applied += 1;
      } catch (err) {
        logger.warn("Failed to add node", { id: canvasId, err: String(err) });
      }

      // Small beat so the animation reads as deliberate.
      await new Promise((r) => setTimeout(r, 220));
    }

    // 3b. Apply the remaining edits (edges, moves, resizes, updates, deletes)
    // in a single atomic mutation.
    if (otherActions.length > 0) {
      try {
        await mutateFlow<Node, Edge>({ client, roomId }, (flow) => {
          for (const action of otherActions) {
            switch (action.op) {
              case "addEdge": {
                const edge: CanvasEdge = {
                  id: `ai-${tag}-${action.id}`,
                  type: "canvasEdge",
                  source: resolveId(action.source),
                  target: resolveId(action.target),
                  data: action.label ? { label: String(action.label) } : {},
                };
                flow.addEdge(edge as unknown as Edge);
                applied += 1;
                break;
              }
              case "moveNode": {
                flow.updateNode(resolveId(action.id), {
                  position: { x: action.x, y: action.y },
                } as Partial<Node>);
                applied += 1;
                break;
              }
              case "resizeNode": {
                flow.updateNode(resolveId(action.id), {
                  width: action.width,
                  height: action.height,
                  style: { width: action.width, height: action.height },
                } as unknown as Partial<Node>);
                applied += 1;
                break;
              }
              case "updateNode": {
                const data: Partial<NodeData> = {};
                if (action.label != null) data.label = String(action.label);
                if (action.shape) data.shape = safeShape(action.shape);
                if (action.color) {
                  const { bg, text } = colorPair(action.color);
                  data.color = bg;
                  data.textColor = text;
                }
                flow.updateNodeData(
                  resolveId(action.id),
                  data as Record<string, unknown>,
                );
                applied += 1;
                break;
              }
              case "deleteNode": {
                const realId = resolveId(action.id);
                flow.removeNode(realId);
                // Remove dangling edges connected to the deleted node.
                for (const edge of flow.edges as unknown as Edge[]) {
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
          "Ghost AI hit an error while drawing. Some changes may be incomplete.",
        );
        await clearLater(roomId);
        throw err;
      }
    }

    // 4. Done — show a final message, then clear presence.
    await publishStatus(roomId, "done", plan.summary || "Design complete.");
    logger.info("Design agent complete", { roomId, applied });
    await clearLater(roomId);

    return { roomId, applied, summary: plan.summary };
  },
});
