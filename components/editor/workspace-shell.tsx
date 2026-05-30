"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Share2,
  Bot,
  LayoutTemplate,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import type { SaveStatus } from "@/hooks/useCanvasAutoSave";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/editor/share-dialog";
import { CanvasWrapper } from "@/components/editor/canvas-wrapper";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import type { FlowCanvasHandle } from "@/components/editor/flow-canvas";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { useEditorSidebar } from "@/hooks/editor-sidebar-context";

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
  const { isSidebarOpen, onToggleSidebar } = useEditorSidebar();
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
      {/* Unified single navbar */}
      <div className="relative z-50 h-14 flex items-center  justify-between px-3 border-b border-border bg-card shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>

        <div className="text-sm font-semibold text-foreground truncate max-w-45 shrink-0 text-center">
          {projectName}
        </div>

        {/* <div className="flex-1" /> */}

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            className={`min-w-14 text-xs font-medium ${
              saveStatus === "saved"
                ? "text-(--state-success)"
                : saveStatus === "error"
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={handleManualSave}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            {saveButtonLabel}
          </Button>

          <div className="w-px h-4 bg-border mx-1 shrink-0" />

          <Button
            variant="outline"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setIsTemplatesOpen(true)}
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Button>
          <Button
            variant="outline"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            className={
              isAiOpen
                ? "bg-brand/10 text-brand hover:bg-brand/20"
                : "text-muted-foreground hover:text-foreground"
            }
            onClick={() => setIsAiOpen(!isAiOpen)}
            aria-pressed={isAiOpen}
            aria-controls="ai-panel"
          >
            <Bot className="h-4 w-4" />
            AI
          </Button>

          <div className="w-px h-4 bg-border mx-1 shrink-0" />

          <UserButton />
        </div>
      </div>

      {/* Content row — relative so AiSidebar can be absolute within it */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas fills the full area; AiSidebar passed as child so it sits
            inside the RoomProvider and can use Liveblocks hooks. */}
        <div className="absolute inset-0 bg-background">
          <CanvasWrapper
            roomId={projectId}
            canvasRef={canvasRef}
            onSaveStatusChange={handleSaveStatusChange}
          >
            <AiSidebar
              isOpen={isAiOpen}
              onClose={() => setIsAiOpen(false)}
              projectId={projectId}
            />
          </CanvasWrapper>
        </div>
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
