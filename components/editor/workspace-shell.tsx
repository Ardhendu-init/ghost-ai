"use client";

import { useState } from "react";
import { Share2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/editor/share-dialog";

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

      {/* Content row */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas placeholder */}
        <div className="flex-1 bg-background flex items-center justify-center">
          <p className="text-sm text-muted-foreground select-none">
            Canvas coming soon
          </p>
        </div>

        {/* AI sidebar placeholder */}
        {isAiOpen && (
          <aside
            id="ai-panel"
            className="w-80 shrink-0 border-l border-border bg-card flex items-center justify-center"
          >
            <p className="text-sm text-muted-foreground select-none">
              AI chat coming soon
            </p>
          </aside>
        )}
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
    </div>
  );
}
