"use client";

import { DialogPattern } from "./dialog-pattern";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formState: { name: string; roomId: string };
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function CreateProjectDialog({
  isOpen,
  onClose,
  formState,
  onNameChange,
  onSubmit,
  isLoading,
}: CreateProjectDialogProps) {
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
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Room ID</label>
          <div className="px-3 py-2 bg-muted rounded-lg border border-input">
            <p className="text-sm text-muted-foreground font-mono">
              {formState.roomId || "your-project-room-id"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Creating…" : "Create"}
        </Button>
      </div>
    </DialogPattern>
  );
}
