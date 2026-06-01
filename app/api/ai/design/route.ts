import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { tasks, auth as triggerAuth } from "@trigger.dev/sdk/v3";
import type { designAgentTask } from "@/trigger/design-agent";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { prompt, roomId, projectId } = body;

  if (!prompt || !roomId || !projectId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const idempotencyKey = createHash("sha256")
    .update(`${userId}:${roomId}:${prompt}`)
    .digest("hex");

  const handle = await tasks.trigger<typeof designAgentTask>(
    "design-agent",
    { prompt, roomId },
    { idempotencyKey, idempotencyKeyTTL: "24h" },
  );

  await prisma.taskRun.upsert({
    where: { runId: handle.id },
    create: { runId: handle.id, projectId, userId },
    update: {},
  });

  const publicToken = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
  });

  return NextResponse.json({ runId: handle.id, publicToken }, { status: 201 });
}
