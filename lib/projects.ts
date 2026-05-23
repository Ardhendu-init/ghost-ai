import { prisma } from "./prisma";

export type ProjectData = { id: string; name: string };

export async function getOwnedProjects(ownerId: string): Promise<ProjectData[]> {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
}

export async function getSharedProjects(email: string): Promise<ProjectData[]> {
  return prisma.project.findMany({
    where: { collaborators: { some: { collaboratorEmail: email } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
}
