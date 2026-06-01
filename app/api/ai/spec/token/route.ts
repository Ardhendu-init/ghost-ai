import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth as triggerAuth } from "@trigger.dev/sdk/v3";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bodyOrNull = await request.json().catch(() => null);
  if (
    typeof bodyOrNull !== "object" ||
    bodyOrNull === null ||
    Array.isArray(bodyOrNull)
  ) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }
  const { runId } = bodyOrNull as Record<string, unknown>;

  if (!runId || typeof runId !== "string") {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({ where: { runId } });
  if (!taskRun || taskRun.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [runId] } },
    expirationTime: "1h",
  });

  return NextResponse.json({ token });
}
