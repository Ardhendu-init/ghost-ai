import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string }> };

async function getOwnedProject(userId: string, projectId: string) {
  return prisma.project.findUnique({ where: { id: projectId, ownerId: userId } });
}

export async function PATCH(request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const exists = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (exists.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined;
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const updated = await prisma.project.update({ where: { id: projectId }, data: { name } });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const exists = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (exists.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.project.delete({ where: { id: projectId } });
  return new NextResponse(null, { status: 204 });
}
