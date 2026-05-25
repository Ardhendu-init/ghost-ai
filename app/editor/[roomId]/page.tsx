import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
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

  return (
    <WorkspaceShell
      projectId={project.id}
      projectName={project.name}
      isOwner={project.ownerId === userId}
    />
  );
}
