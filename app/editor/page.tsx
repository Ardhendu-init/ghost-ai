"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectDialogsContext } from "@/hooks/project-dialogs-context";

export default function EditorPage() {
  const dialogs = useProjectDialogsContext();

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Create a project or open an existing one
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
        <Button
          size="lg"
          onClick={dialogs.openCreateDialog}
          className="gap-2 bg-brand hover:bg-brand/90 text-background font-medium"
        >
          <Plus className="h-5 w-5" />
          New project
        </Button>
      </div>
    </div>
  );
}
