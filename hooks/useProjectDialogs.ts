import { useState } from "react";

export type DialogType = "create" | "rename" | "delete" | null;

interface ProjectDialogState {
  type: DialogType;
  projectId?: string;
  projectName?: string;
}

interface FormState {
  name: string;
  slug: string;
}

export function useProjectDialogs() {
  const [dialog, setDialog] = useState<ProjectDialogState>({ type: null });
  const [formState, setFormState] = useState<FormState>({ name: "", slug: "" });
  const [isLoading, setIsLoading] = useState(false);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormState({
      name,
      slug: generateSlug(name),
    });
  };

  const openCreateDialog = () => {
    setFormState({ name: "", slug: "" });
    setDialog({ type: "create" });
  };

  const openRenameDialog = (projectId: string, projectName: string) => {
    setFormState({ name: projectName, slug: generateSlug(projectName) });
    setDialog({ type: "rename", projectId, projectName });
  };

  const openDeleteDialog = (projectId: string, projectName: string) => {
    setDialog({ type: "delete", projectId, projectName });
  };

  const closeDialog = () => {
    setDialog({ type: null });
    setFormState({ name: "", slug: "" });
  };

  return {
    dialog,
    formState,
    isLoading,
    setIsLoading,
    handleNameChange,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
  };
}
