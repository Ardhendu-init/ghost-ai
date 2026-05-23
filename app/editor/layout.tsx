import { auth, currentUser } from "@clerk/nextjs/server";
import { EditorClient } from "@/components/editor/editor-client";
import { getOwnedProjects, getSharedProjects } from "@/lib/projects";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  const [ownedProjects, sharedProjects] = await Promise.all([
    userId ? getOwnedProjects(userId) : Promise.resolve([]),
    email ? getSharedProjects(email) : Promise.resolve([]),
  ]);

  return (
    <EditorClient ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
      {children}
    </EditorClient>
  );
}
