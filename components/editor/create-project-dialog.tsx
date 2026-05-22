"use client";

import { DialogPattern } from "./dialog-pattern";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formState: { name: string; slug: string };
  onNameChange: (name: string) => void;
  isLoading: boolean;
}

export function CreateProjectDialog({
  isOpen,
  onClose,
  formState,
  onNameChange,
  isLoading,
}: CreateProjectDialogProps) {
  const handleCreate = () => {
    if (!formState.name.trim()) return;
    console.log("Creating project:", formState);
    onClose();
  };

  return (
    <DialogPattern
      isOpen={isOpen}
      onOpenChange={onClose}
      title="Create Project"
      description="Give your project a name to get started"
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="project-name" className="text-sm font-medium">
            Project Name
          </label>
          <Input
            id="project-name"
            placeholder="My Architecture"
            value={formState.name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">URL Slug</label>
          <div className="px-3 py-2 bg-muted rounded-lg border border-input">
            <p className="text-sm text-muted-foreground font-mono">
              /editor/{formState.slug || "your-project-slug"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={isLoading || !formState.name.trim()}
        >
          Create
        </Button>
      </div>
    </DialogPattern>
  );
}
