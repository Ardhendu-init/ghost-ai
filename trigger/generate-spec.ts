import { task, logger, metadata } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { OpenRouter } from "@openrouter/sdk";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { mutateFlow } from "@liveblocks/react-flow/node";
import type { Node, Edge } from "@xyflow/react";
import { getLiveblocks } from "../lib/liveblocks";

const chatMessageSchema = z.object({
  role: z.string(),
  content: z.string(),
});

const nodeDataSchema = z
  .object({
    label: z.string().default(""),
    shape: z.string().optional(),
    color: z.string().optional(),
    textColor: z.string().optional(),
  })
  .passthrough();

const nodeSchema = z
  .object({
    id: z.string(),
    type: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: nodeDataSchema,
  })
  .passthrough();

const edgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    data: z
      .object({ label: z.string().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

const payloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).default([]),
  nodes: z.array(nodeSchema).default([]),
  edges: z.array(edgeSchema).default([]),
});

type GenerateSpecPayload = z.infer<typeof payloadSchema>;
type NodeEntry = z.infer<typeof nodeSchema>;
type EdgeEntry = z.infer<typeof edgeSchema>;

const MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

function buildSystemPrompt(): string {
  return [
    "You are Ghost AI, a technical documentation expert.",
    "You generate comprehensive Markdown technical specifications from software architecture diagrams.",
    "",
    "Given a canvas diagram (nodes and edges) and optional chat context, produce a detailed technical specification in Markdown.",
    "",
    "The specification MUST include these sections:",
    "1. **Overview** — high-level summary of the architecture and its purpose",
    "2. **Components** — each node/service described with purpose, responsibilities, and technology hints",
    "3. **Data Flow** — how data moves between components based on the connections",
    "4. **Integration Points** — external systems, APIs, and system boundaries",
    "5. **Technical Considerations** — scalability, reliability, and implementation notes",
    "",
    "Format rules:",
    "- Output clean Markdown only — no preamble, no closing remarks",
    "- Use ## for sections, ### for subsections, and bullet points for lists",
    "- Use code blocks only for concrete config snippets or API contracts",
    "- Base the spec strictly on what is shown in the diagram and chat context",
    "- Do not invent components not present in the diagram",
    "- Keep the spec technical but readable; aim for 400-800 words",
    "- If the canvas is empty, write a brief placeholder spec noting no components exist yet",
  ].join("\n");
}

function buildUserPrompt(
  nodes: NodeEntry[],
  edges: EdgeEntry[],
  chatHistory: GenerateSpecPayload["chatHistory"],
): string {
  if (nodes.length === 0) {
    return "The canvas is empty. Generate a placeholder spec noting that no components have been added yet.";
  }

  const parts: string[] = ["## Canvas Nodes\n"];
  for (const node of nodes) {
    const shape = node.data.shape ?? "rectangle";
    const label = node.data.label || "(unlabeled)";
    parts.push(
      `- **${label}** — shape: ${shape}, position: (${Math.round(node.position.x)}, ${Math.round(node.position.y)})`,
    );
  }

  if (edges.length > 0) {
    parts.push("\n## Canvas Connections\n");
    for (const edge of edges) {
      const src = nodes.find((n) => n.id === edge.source)?.data.label || edge.source;
      const tgt = nodes.find((n) => n.id === edge.target)?.data.label || edge.target;
      const edgeLabel = edge.data?.label ? ` — "${edge.data.label}"` : "";
      parts.push(`- ${src} → ${tgt}${edgeLabel}`);
    }
  }

  if (chatHistory.length > 0) {
    parts.push("\n## Chat Context (last 10 messages)\n");
    for (const msg of chatHistory.slice(-10)) {
      const role = msg.role === "user" ? "User" : "AI";
      parts.push(`**${role}:** ${msg.content}`);
    }
  }

  parts.push("\n\nGenerate the technical specification based on the diagram above.");
  return parts.join("\n");
}

export const generateSpec = task({
  id: "generate-spec",
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
    randomize: true,
  },
  run: async (payload: GenerateSpecPayload) => {
    const validated = payloadSchema.safeParse(payload);
    if (!validated.success) {
      throw new Error(`Invalid payload: ${validated.error.message}`);
    }
    const { projectId, roomId, chatHistory } = validated.data;
    let { nodes, edges } = validated.data;

    // If the caller sent an empty canvas, read the live state from Liveblocks
    // so the spec always reflects the current diagram.
    if (nodes.length === 0) {
      const flowClient = getLiveblocks() as unknown as Parameters<typeof mutateFlow>[0]["client"];
      try {
        await mutateFlow<Node, Edge>({ client: flowClient, roomId }, (flow) => {
          nodes = [...flow.nodes] as unknown as NodeEntry[];
          edges = [...flow.edges] as unknown as EdgeEntry[];
        });
        logger.info("Canvas read from Liveblocks", {
          nodeCount: nodes.length,
          edgeCount: edges.length,
        });
      } catch (err) {
        logger.warn("Could not read canvas from Liveblocks, proceeding with empty canvas", {
          err: String(err),
        });
      }
    }

    logger.info("Spec generation started", {
      projectId,
      roomId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });

    metadata.set("status", "generating").set("nodeCount", nodes.length);

    const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY / OPENAI_API_KEY");

    const openrouter = new OpenRouter({ apiKey });

    let rawContent: string;
    try {
      const completion = await openrouter.chat.send({
        chatRequest: {
          model: MODEL,
          temperature: 0.3,
          messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: buildUserPrompt(nodes, edges, chatHistory) },
          ],
        },
      });
      rawContent = completion.choices?.[0]?.message?.content ?? "";
      if (typeof rawContent !== "string") rawContent = "";
    } catch (err) {
      logger.error("AI call failed during spec generation", { err: String(err) });
      metadata.set("status", "error");
      throw err;
    }

    // Strip reasoning traces emitted by thinking models before returning.
    const spec = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    logger.info("Spec generation complete", { projectId, specLength: spec.length });
    metadata.set("status", "saving");

    // Upload to Vercel Blob first — only create the DB record if the upload succeeds.
    // Using a UUID path so we don't need a pre-created record id.
    const { randomUUID } = await import("node:crypto");
    const blobKey = `specs/${projectId}/${randomUUID()}.md`;

    const blob = await put(blobKey, spec, {
      access: "private",
      contentType: "text/markdown",
      allowOverwrite: true,
    });

    const specRecord = await prisma.projectSpec.create({
      data: { projectId, filePath: blob.url },
    });

    logger.info("Spec persisted", { specId: specRecord.id, url: blob.url });
    metadata.set("status", "complete").set("specLength", spec.length).set("specId", specRecord.id);

    return { spec, projectId, nodeCount: nodes.length, specId: specRecord.id };
  },
});
