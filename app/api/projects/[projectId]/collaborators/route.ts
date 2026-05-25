import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

type Params = { params: Promise<{ projectId: string }> };

interface EnrichedCollaborator {
  email: string;
  name: string;
  avatarUrl: string | null;
}

async function enrichEmails(emails: string[]): Promise<EnrichedCollaborator[]> {
  if (!emails.length) return [];

  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ emailAddress: emails });

  const map = new Map<string, { name: string; avatarUrl: string }>();
  for (const u of users) {
    const email = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress;
    if (email) {
      map.set(email, {
        name: [u.firstName, u.lastName].filter(Boolean).join(" ") || email,
        avatarUrl: u.imageUrl,
      });
    }
  }

  return emails.map((email) => ({
    email,
    name: map.get(email)?.name ?? email,
    avatarUrl: map.get(email)?.avatarUrl ?? null,
  }));
}

export async function GET(_req: Request, { params }: Params) {
  const { projectId } = await params;
  const { hasAccess, userId } = await checkProjectAccess(projectId);

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { collaboratorEmail: true },
  });

  const emails = rows.map((r) => r.collaboratorEmail);
  const enriched = await enrichEmails(emails);
  return NextResponse.json(enriched);
}

export async function POST(request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@"))
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });

  try {
    await prisma.projectCollaborator.create({
      data: { projectId, collaboratorEmail: email },
    });
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2002")
      return NextResponse.json({ error: "Already a collaborator" }, { status: 409 });
    throw err;
  }

  const [enriched] = await enrichEmails([email]);
  return NextResponse.json(enriched, { status: 201 });
}

export async function DELETE(request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const deleted = await prisma.projectCollaborator.deleteMany({
    where: { projectId, collaboratorEmail: email },
  });

  if (deleted.count === 0)
    return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
