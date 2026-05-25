import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { checkProjectAccess } from "@/lib/project-access";
import { AccessDenied } from "@/components/editor/access-denied";
import { WorkspaceShell } from "@/components/editor/workspace-shell";

type Props = { params: Promise<{ roomId: string }> };

export default async function WorkspacePage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { roomId } = await params;
  const { project, hasAccess } = await checkProjectAccess(roomId);

  if (!project || !hasAccess) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <AccessDenied />
      </div>
    );
  }

  let ownerEmail = "";
  let ownerName = "";
  let ownerAvatarUrl: string | null = null;

  try {
    const client = await clerkClient();
    const ownerUser = await client.users.getUser(project.ownerId);
    ownerEmail =
      ownerUser.emailAddresses.find((e) => e.id === ownerUser.primaryEmailAddressId)
        ?.emailAddress ?? "";
    ownerName =
      [ownerUser.firstName, ownerUser.lastName].filter(Boolean).join(" ") || ownerEmail;
    ownerAvatarUrl = ownerUser.imageUrl ?? null;
  } catch {
    // Owner account may have been deleted from Clerk; render with empty fallbacks
  }

  return (
    <WorkspaceShell
      projectId={project.id}
      projectName={project.name}
      isOwner={project.ownerId === userId}
      ownerName={ownerName}
      ownerEmail={ownerEmail}
      ownerAvatarUrl={ownerAvatarUrl}
    />
  );
}
