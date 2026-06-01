import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";
import { tasks } from "@trigger.dev/sdk/v3";
import type { generateSpec } from "@/trigger/generate-spec";

const bodySchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z
    .array(z.object({ role: z.string(), content: z.string() }))
    .default([]),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: z.array(z.any()).default([]),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges: z.array(z.any()).default([]),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;

  // Resolve project from roomId — do not trust a client-supplied projectId.
  // In this app, roomId === projectId (Prisma record id).
  const { project, hasAccess } = await checkProjectAccess(roomId);
  if (!project || !hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
    projectId: project.id,
    roomId,
    chatHistory,
    nodes,
    edges,
  });

  await prisma.taskRun.create({
    data: { runId: handle.id, projectId: project.id, userId },
  });

  return NextResponse.json({ runId: handle.id }, { status: 201 });
}
