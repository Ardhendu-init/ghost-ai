"use client";

import { DialogPattern } from "./dialog-pattern";
import { Button } from "@/components/ui/button";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  isLoading: boolean;
}

export function DeleteProjectDialog({
  isOpen,
  onClose,
  projectName,
  isLoading,
}: DeleteProjectDialogProps) {
  const handleDelete = () => {
    console.log("Deleting project:", projectName);
    onClose();
  };

  return (
    <DialogPattern
      isOpen={isOpen}
      onOpenChange={onClose}
      title="Delete Project"
      description={`Are you sure you want to delete "${projectName}"? This action cannot be undone.`}
    >
      <div className="flex gap-2 justify-end py-4">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isLoading}
        >
          Delete
        </Button>
      </div>
    </DialogPattern>
  );
}
