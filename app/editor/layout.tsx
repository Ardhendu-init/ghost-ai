"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { useProjectDialogs } from "@/hooks/useProjectDialogs";
import { ProjectDialogsContext } from "@/hooks/project-dialogs-context";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dialogs = useProjectDialogs();

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <ProjectDialogsContext.Provider value={dialogs}>
      <div className="min-h-screen flex flex-col bg-background">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          onNewProject={dialogs.openCreateDialog}
          onRenameProject={dialogs.openRenameDialog}
          onDeleteProject={dialogs.openDeleteDialog}
        />

        <CreateProjectDialog
          isOpen={dialogs.dialog.type === "create"}
          onClose={dialogs.closeDialog}
          formState={dialogs.formState}
          onNameChange={dialogs.handleNameChange}
          isLoading={dialogs.isLoading}
        />

        <RenameProjectDialog
          isOpen={dialogs.dialog.type === "rename"}
          onClose={dialogs.closeDialog}
          projectName={dialogs.dialog.projectName}
          formState={dialogs.formState}
          onNameChange={dialogs.handleNameChange}
          isLoading={dialogs.isLoading}
        />

        <DeleteProjectDialog
          isOpen={dialogs.dialog.type === "delete"}
          onClose={dialogs.closeDialog}
          projectName={dialogs.dialog.projectName}
          isLoading={dialogs.isLoading}
        />

        <main className="flex-1 pt-16 flex flex-col">{children}</main>
      </div>
    </ProjectDialogsContext.Provider>
  );
}
