import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getCurrentIdentity() {
  const { userId } = await auth();
  const user = await currentUser();

  let email = "";
  if (user) {
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;
    if (primary) {
      email = primary.trim().toLowerCase();
    } else {
      const verified = user.emailAddresses.find(
        (e) => e.verification?.status === "verified"
      )?.emailAddress;
      email = (verified ?? user.emailAddresses[0]?.emailAddress ?? "")
        .trim()
        .toLowerCase();
    }
  }

  return { userId, email };
}

export async function checkProjectAccess(projectId: string): Promise<{
  project: { id: string; name: string; ownerId: string } | null;
  hasAccess: boolean;
  userId: string | null;
}> {
  const { userId, email } = await getCurrentIdentity();

  if (!userId) return { project: null, hasAccess: false, userId: null };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, ownerId: true },
  });

  if (!project) return { project: null, hasAccess: false, userId };

  if (project.ownerId === userId) return { project, hasAccess: true, userId };

  const collab = await prisma.projectCollaborator.findFirst({
    where: { projectId, collaboratorEmail: email },
    select: { id: true },
  });

  return { project, hasAccess: !!collab, userId };
}
