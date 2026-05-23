"use client";

import { DialogPattern } from "./dialog-pattern";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

interface RenameProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  formState: { name: string; roomId: string };
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function RenameProjectDialog({
  isOpen,
  onClose,
  projectName,
  formState,
  onNameChange,
  onSubmit,
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
    if (e.key === "Enter" && !isLoading) onSubmit();
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
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading || !formState.name.trim()}
        >
          {isLoading ? "Renaming…" : "Rename"}
        </Button>
      </div>
    </DialogPattern>
  );
}
