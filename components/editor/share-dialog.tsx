"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, UserPlus, Trash2, Loader2 } from "lucide-react";
import { DialogPattern } from "./dialog-pattern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Collaborator {
  email: string;
  name: string;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
}

function CollaboratorAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-medium text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}

export function ShareDialog({ open, onOpenChange, projectId, isOwner }: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  const loadCollaborators = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (res.ok) setCollaborators(await res.json());
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) loadCollaborators();
  }, [open, loadCollaborators]);

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const newCollab: Collaborator = await res.json();
        setCollaborators((prev) => [...prev, newCollab]);
        setInviteEmail("");
      } else {
        const data = await res.json();
        setInviteError(data.error ?? "Failed to invite");
      }
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(email: string) {
    setRemovingEmail(email);
    try {
      await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setCollaborators((prev) => prev.filter((c) => c.email !== email));
    } finally {
      setRemovingEmail(null);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DialogPattern
      isOpen={open}
      onOpenChange={onOpenChange}
      title="Share project"
      description={isOwner ? "Invite collaborators by email." : "People with access to this project."}
    >
      <div className="space-y-4">
        {isOwner && (
          <div className="space-y-1">
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                disabled={inviting}
                className="flex-1"
              />
              <Button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                size="sm"
                className="shrink-0"
              >
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
            {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
          </div>
        )}

        <div className="max-h-56 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No collaborators yet.
            </p>
          ) : (
            collaborators.map((c) => (
              <div
                key={c.email}
                className="flex items-center gap-3 py-2 px-1 rounded-xl hover:bg-muted/50"
              >
                <CollaboratorAvatar name={c.name} avatarUrl={c.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  {c.name !== c.email && (
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  )}
                </div>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    onClick={() => handleRemove(c.email)}
                    disabled={removingEmail === c.email}
                  >
                    {removingEmail === c.email ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Input
            readOnly
            value={pageUrl}
            className="flex-1 text-xs text-muted-foreground"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0 gap-1.5"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>
    </DialogPattern>
  );
}
