import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { checkProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ projectId: string; specId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, specId } = await params;

  const { hasAccess } = await checkProjectAccess(projectId);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { id: true, projectId: true, filePath: true },
  });

  if (!spec) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  if (spec.projectId !== projectId)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  if (!spec.filePath)
    return NextResponse.json({ error: "Not Found" }, { status: 404 });

  try {
    const result = await get(spec.filePath, { access: "private" });
    if (!result) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    if (result.statusCode !== 200)
      return NextResponse.json({ error: "Not Found" }, { status: 404 });

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to retrieve spec" }, { status: 502 });
  }
}
