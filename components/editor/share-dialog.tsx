"use client";

import { useState, useEffect, useCallback } from "react";
import { Link2, Mail, Trash2, Loader2, Check } from "lucide-react";
import { DialogPattern } from "./dialog-pattern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Collaborator {
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
  ownerName: string;
  ownerEmail: string;
  ownerAvatarUrl: string | null;
}

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  isOwner,
  ownerName,
  ownerEmail,
  ownerAvatarUrl,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  // initialize lazily to avoid setting state synchronously inside an effect
  const [pageUrl, setPageUrl] = useState<string>(() =>
    typeof window !== "undefined" ? window.location.href : ""
  );

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
    if (!open) return;
    // schedule async load to avoid calling setState synchronously within the effect
    const t = setTimeout(() => {
      void loadCollaborators();
    }, 0);
    return () => clearTimeout(t);
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
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setCollaborators((prev) => prev.filter((c) => c.email !== email));
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to remove collaborator:", data.error ?? res.status);
      }
    } catch (err) {
      console.error("Failed to remove collaborator:", err);
    } finally {
      setRemovingEmail(null);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalCount = 1 + collaborators.length;

  return (
    <DialogPattern
      isOpen={open}
      onOpenChange={onOpenChange}
      title="Share project"
      description="Invite collaborators, copy the workspace link, and manage access."
    >
      <div className="space-y-4">
        {/* Workspace link card */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border bg-muted/30">
          <div className="flex items-start gap-2.5 min-w-0">
            <Link2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Workspace link</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Share a direct link with teammates after you grant them access.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0 gap-1.5"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>

        {/* Invite input — owner only */}
        {isOwner && (
          <div className="space-y-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="teammate@company.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  disabled={inviting}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="shrink-0"
              >
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
              </Button>
            </div>
            {inviteError && (
              <p className="text-xs text-destructive">{inviteError}</p>
            )}
          </div>
        )}

        {/* People with access */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">People with access</p>
            <span className="text-xs text-muted-foreground">{totalCount} total</span>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {/* Owner row */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/20">
              <UserAvatar name={ownerName} avatarUrl={ownerAvatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{ownerName}</p>
                  <span className="shrink-0 text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400">
                    OWNER
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{ownerEmail}</p>
              </div>
            </div>

            {/* Collaborator rows */}
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              collaborators.map((c) => (
                <div
                  key={c.email}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-muted/20"
                >
                  <UserAvatar name={c.name} avatarUrl={c.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <span className="shrink-0 text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        COLLABORATOR
                      </span>
                    </div>
                    {c.name !== c.email && (
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    )}
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(c.email)}
                      disabled={removingEmail === c.email}
                      aria-label={
                        removingEmail === c.email
                          ? `Removing ${c.email}`
                          : `Remove collaborator ${c.email}`
                      }
                    >
                      {removingEmail === c.email ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DialogPattern>
  );
}
