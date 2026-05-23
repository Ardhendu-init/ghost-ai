"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export type DialogType = "create" | "rename" | "delete" | null;

interface ProjectDialogState {
  type: DialogType;
  projectId?: string;
  projectName?: string;
}

interface FormState {
  name: string;
  roomId: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function shortSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function useProjectActions() {
  const router = useRouter();
  const pathname = usePathname();
  const suffixRef = useRef<string>("");

  const [dialog, setDialog] = useState<ProjectDialogState>({ type: null });
  const [formState, setFormState] = useState<FormState>({
    name: "",
    roomId: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (name: string) => {
    const slug = slugify(name);
    setFormState({
      name,
      roomId: slug ? `${slug}-${suffixRef.current}` : "",
    });
  };

  const openCreateDialog = () => {
    suffixRef.current = shortSuffix();
    setFormState({ name: "", roomId: "" });
    setDialog({ type: "create" });
  };

  const openRenameDialog = (projectId: string, projectName: string) => {
    setFormState({ name: projectName, roomId: "" });
    setDialog({ type: "rename", projectId, projectName });
  };

  const openDeleteDialog = (projectId: string, projectName: string) => {
    setDialog({ type: "delete", projectId, projectName });
  };

  const closeDialog = () => {
    setDialog({ type: null });
    setFormState({ name: "", roomId: "" });
  };

  const submitCreate = async () => {
    setIsLoading(true);
    const name = formState.name.trim() || "Untitled Project";
    const roomId = formState.roomId || `${slugify(name)}-${suffixRef.current}`;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, roomId }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const project = await res.json();
      closeDialog();
      router.push(`/editor/${project.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitRename = async () => {
    if (!dialog.projectId || !formState.name.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${dialog.projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formState.name.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename project");
      closeDialog();
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitDelete = async () => {
    if (!dialog.projectId) return;
    const targetId = dialog.projectId;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${targetId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      closeDialog();
      if (pathname === `/editor/${targetId}`) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dialog,
    formState,
    isLoading,
    handleNameChange,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  };
}
