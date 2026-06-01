"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";
import { CreateProjectDialog } from "./create-project-dialog";
import { RenameProjectDialog } from "./rename-project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { useProjectActions } from "@/hooks/useProjectActions";
import { ProjectDialogsContext } from "@/hooks/project-dialogs-context";
import { EditorSidebarContext } from "@/hooks/editor-sidebar-context";
import type { ProjectData } from "@/lib/projects";

interface EditorClientProps {
  ownedProjects: ProjectData[];
  sharedProjects: ProjectData[];
  children: React.ReactNode;
}

export function EditorClient({ ownedProjects, sharedProjects, children }: EditorClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const actions = useProjectActions();
  const pathname = usePathname();
  const isWorkspace = pathname !== "/editor" && pathname.startsWith("/editor/");

  const sidebarCtx = { isSidebarOpen, onToggleSidebar: () => setIsSidebarOpen(!isSidebarOpen) };

  return (
    <EditorSidebarContext.Provider value={sidebarCtx}>
    <ProjectDialogsContext.Provider value={actions}>
      <div className="min-h-screen flex flex-col bg-background">
        {!isWorkspace && (
          <EditorNavbar
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isWorkspace={false}
          />
        )}
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewProject={actions.openCreateDialog}
          onRenameProject={actions.openRenameDialog}
          onDeleteProject={actions.openDeleteDialog}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          isWorkspace={isWorkspace}
        />

        <CreateProjectDialog
          isOpen={actions.dialog.type === "create"}
          onClose={actions.closeDialog}
          formState={actions.formState}
          onNameChange={actions.handleNameChange}
          onSubmit={actions.submitCreate}
          isLoading={actions.isLoading}
        />

        <RenameProjectDialog
          isOpen={actions.dialog.type === "rename"}
          onClose={actions.closeDialog}
          projectName={actions.dialog.projectName}
          formState={actions.formState}
          onNameChange={actions.handleNameChange}
          onSubmit={actions.submitRename}
          isLoading={actions.isLoading}
        />

        <DeleteProjectDialog
          isOpen={actions.dialog.type === "delete"}
          onClose={actions.closeDialog}
          projectName={actions.dialog.projectName}
          onSubmit={actions.submitDelete}
          isLoading={actions.isLoading}
        />

        <main className={`flex-1 flex flex-col${isWorkspace ? "" : " pt-16"}`}>{children}</main>
      </div>
    </ProjectDialogsContext.Provider>
    </EditorSidebarContext.Provider>
  );
}
