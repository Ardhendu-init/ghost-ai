"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Share2, Bot, LayoutTemplate, Loader2 } from "lucide-react";
import type { SaveStatus } from "@/hooks/useCanvasAutoSave";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/editor/share-dialog";
import { CanvasWrapper } from "@/components/editor/canvas-wrapper";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import type { FlowCanvasHandle } from "@/components/editor/flow-canvas";
import type { CanvasTemplate } from "@/components/editor/starter-templates";

const RESET_DELAY_MS = 2000;

interface WorkspaceShellProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  ownerName: string;
  ownerEmail: string;
  ownerAvatarUrl: string | null;
}

export function WorkspaceShell({
  projectId,
  projectName,
  isOwner,
  ownerName,
  ownerEmail,
  ownerAvatarUrl,
}: WorkspaceShellProps) {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const canvasRef = useRef<FlowCanvasHandle>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSaveStatusChange = useCallback((status: SaveStatus) => {
    setSaveStatus(status);
  }, []);

  // Auto-reset "saved" and "error" back to "idle" after a brief display
  useEffect(() => {
    if (saveStatus !== "saved" && saveStatus !== "error") return;
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setSaveStatus("idle");
    }, RESET_DELAY_MS);
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [saveStatus]);

  function handleImportTemplate(template: CanvasTemplate) {
    canvasRef.current?.loadTemplate(template);
  }

  function handleManualSave() {
    canvasRef.current?.saveNow();
  }

  const saveButtonLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Error"
          : "Save";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Workspace navbar */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
        <span className="text-sm font-semibold text-foreground truncate max-w-xs">
          {projectName}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 min-w-16"
            onClick={handleManualSave}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            {saveButtonLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setIsTemplatesOpen(true)}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            Templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          <Button
            variant={isAiOpen ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setIsAiOpen(!isAiOpen)}
            aria-pressed={isAiOpen}
            aria-controls="ai-panel"
          >
            <Bot className="h-3.5 w-3.5" />
            AI
          </Button>
        </div>
      </div>

      {/* Content row — relative so AiSidebar can be absolute within it */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas fills the full area */}
        <div className="absolute inset-0 bg-background">
          <CanvasWrapper
            roomId={projectId}
            canvasRef={canvasRef}
            onSaveStatusChange={handleSaveStatusChange}
          />
        </div>

        <AiSidebar isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      </div>

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        projectId={projectId}
        isOwner={isOwner}
        ownerName={ownerName}
        ownerEmail={ownerEmail}
        ownerAvatarUrl={ownerAvatarUrl}
      />

      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onImport={handleImportTemplate}
      />
    </div>
  );
}
