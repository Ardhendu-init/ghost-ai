import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { put, head } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

async function getAuthorizedProject(projectId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized", status: 401 as const };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true, canvasBlobUrl: true },
  });

  if (!project) return { error: "Not Found", status: 404 as const };
  if (project.ownerId !== userId)
    return { error: "Forbidden", status: 403 as const };

  return { project, userId };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const result = await getAuthorizedProject(projectId);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  const canvasJson = await req.json();
  const blob = await put(
    `canvas/${projectId}.json`,
    JSON.stringify(canvasJson),
    {
      access: "private",
      contentType: "application/json",
      allowOverwrite: true,
    },
  );

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasBlobUrl: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const result = await getAuthorizedProject(projectId);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  const { project } = result;
  if (!project.canvasBlobUrl) {
    return NextResponse.json({ canvas: null });
  }

  try {
    const { downloadUrl } = await head(project.canvasBlobUrl);
    const res = await fetch(downloadUrl);
    if (!res.ok) return NextResponse.json({ canvas: null });
    const canvas = await res.json();
    return NextResponse.json({ canvas });
  } catch {
    return NextResponse.json({ canvas: null });
  }
}
