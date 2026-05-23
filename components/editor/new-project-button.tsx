"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectDialogsContext } from "@/hooks/project-dialogs-context";

export function NewProjectButton() {
  const { openCreateDialog } = useProjectDialogsContext();

  return (
    <Button
      size="lg"
      onClick={openCreateDialog}
      className="gap-2 bg-brand hover:bg-brand/90 text-background font-medium"
    >
      <Plus className="h-5 w-5" />
      New project
    </Button>
  );
}
