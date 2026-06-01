import { NextRequest, NextResponse } from "next/server";
import { checkProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;

  const { hasAccess } = await checkProjectAccess(projectId);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const specs = await prisma.projectSpec.findMany({
    where: { projectId, filePath: { not: "" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, filePath: true },
  });

  return NextResponse.json(specs);
}
