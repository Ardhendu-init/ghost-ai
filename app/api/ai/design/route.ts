import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
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

  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", { prompt, roomId });

  await prisma.taskRun.create({
    data: { runId: handle.id, projectId, userId },
  });

  const publicToken = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
  });

  return NextResponse.json({ runId: handle.id, publicToken }, { status: 201 });
}
