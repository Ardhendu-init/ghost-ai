"use client";

import { DialogPattern } from "./dialog-pattern";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

interface RenameProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  formState: { name: string; slug: string };
  onNameChange: (name: string) => void;
  isLoading: boolean;
}

export function RenameProjectDialog({
  isOpen,
  onClose,
  projectName,
  formState,
  onNameChange,
  isLoading,
}: RenameProjectDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleRename();
    }
  };

  const handleRename = () => {
    if (!formState.name.trim()) return;
    console.log("Renaming project to:", formState.name);
    onClose();
  };

  return (
    <DialogPattern
      isOpen={isOpen}
      onOpenChange={onClose}
      title="Rename Project"
      description={`Current name: ${projectName}`}
    >
      <div className="space-y-4 py-4">
        <Input
          ref={inputRef}
          placeholder="New project name"
          value={formState.name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <div className="space-y-1.5">
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
          onClick={handleRename}
          disabled={isLoading || !formState.name.trim()}
        >
          Rename
        </Button>
      </div>
    </DialogPattern>
  );
}
