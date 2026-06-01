"use client";

import { useRef, useState, useCallback, useEffect, KeyboardEvent } from "react";
import { Bot, X, Send, FileText, Download, Loader2, MessageSquare, Sparkles, RefreshCw } from "lucide-react";
import { LiveList } from "@liveblocks/client";
import { useStorage, useMutation, useSelf } from "@liveblocks/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { isAiStatusFeedPayload, isChatMessage, type ChatMessage } from "@/types/tasks";

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function AiSidebar({ isOpen, onClose, projectId }: AiSidebarProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const self = useSelf();
  const senderName = self?.info?.name ?? "You";

  // Shared generation state from Liveblocks storage — written by the background task.
  const aiState = useStorage((root) => root.ai?.state ?? null);
  const isRunActive = isSending || runId !== null || aiState === "thinking" || aiState === "working";

  // Latest status message from ai-status-feed.
  const feedRaw = useStorage((root) => root.aiStatusFeed ?? null);
  const feedText =
    isAiStatusFeedPayload(feedRaw) && typeof feedRaw?.text === "string"
      ? feedRaw.text
      : null;

  // ai-chat Liveblocks feed — collaborative, visible to all participants.
  const chatMessagesRaw = useStorage((root) =>
    root.aiChat ? [...root.aiChat].filter(isChatMessage) : []
  );
  const chatMessages = chatMessagesRaw ?? [];

  const postToChat = useMutation(({ storage }, msg: ChatMessage) => {
    const list = storage.get("aiChat");
    if (list) {
      list.push(msg);
    } else {
      storage.set("aiChat", new LiveList([msg]));
    }
  }, []);

  function scrollToBottom() {
    setTimeout(() => scrollEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function appendToChat(role: "user" | "assistant", content: string, displayName?: string) {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: role === "user" ? (displayName ?? senderName) : "Ghost AI",
      role,
      content,
      timestamp: Date.now(),
    };
    postToChat(msg);
    scrollToBottom();
  }

  function adjustTextareaHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "72px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending || runId !== null) return;

    appendToChat("user", trimmed);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "72px";
    setIsSending(true);

    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, roomId: projectId, projectId }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (typeof data.runId !== "string" || !data.runId || typeof data.publicToken !== "string" || !data.publicToken) {
        throw new Error("Invalid response: missing runId or publicToken");
      }
      setRunId(data.runId);
      setPublicToken(data.publicToken);
    } catch {
      appendToChat("assistant", "Sorry, I couldn't start the design. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
    <aside
      id="ai-panel"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={`fixed right-0 top-12 h-[calc(100vh-3rem)] w-80 z-40 flex flex-col bg-card border-l border-border transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border shrink-0">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-muted shrink-0">
          <Bot className="h-4 w-4 text-brand" />
          {isRunActive && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-card animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">AI Workspace</p>
          <p className="text-xs text-muted-foreground leading-snug">
            {isRunActive ? "Ghost AI is working…" : "Collaborate with Ghost AI"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={onClose}
          aria-label="Close AI sidebar"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="architect" className="flex-1 flex flex-col min-h-0">
        <TabsList
          variant="line"
          className="w-full justify-start gap-0.5 px-3 py-1 h-auto border-b border-border rounded-none"
        >
          <TabsTrigger
            value="architect"
            className="text-xs px-3 py-1.5 rounded-lg font-medium
              text-muted-foreground hover:text-foreground
              data-active:bg-brand/10! data-active:text-brand! data-active:shadow-none!
              after:hidden! cursor-pointer"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="text-xs px-3 py-1.5 rounded-lg font-medium
              text-muted-foreground hover:text-foreground
              data-active:bg-brand/10! data-active:text-brand! data-active:shadow-none!
              after:hidden! cursor-pointer"
          >
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="text-xs px-3 py-1.5 rounded-lg font-medium
              text-muted-foreground hover:text-foreground
              data-active:bg-brand/10! data-active:text-brand! data-active:shadow-none!
              after:hidden! cursor-pointer"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        {/* AI Architect tab */}
        <TabsContent value="architect" className="flex-1 flex flex-col min-h-0 mt-0 overflow-hidden">
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 flex flex-col gap-3">
              {chatMessages.length === 0 ? (
                <EmptyState onChipClick={sendMessage} />
              ) : (
                <>
                  {chatMessages.map((msg) => (
                    <ArchitectBubble key={msg.id} msg={msg} />
                  ))}
                  <div ref={scrollEndRef} />
                </>
              )}
            </div>
          </ScrollArea>

          {/* Status strip — only shown while a run is active */}
          {isRunActive && feedText && (
            <div className="flex items-center gap-2 px-3 py-1.5 border-t border-brand/20 bg-card shrink-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
              </span>
              <span className="text-[11px] text-brand truncate font-medium">{feedText}</span>
            </div>
          )}

          <div className="p-3 border-t border-border shrink-0">
            <div
              className={`flex flex-col gap-2 rounded-xl border bg-muted/30 px-3 pt-2.5 pb-2 transition-colors ${
                isRunActive ? "border-brand/30 bg-brand/5" : "border-border"
              }`}
            >
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  isRunActive ? "AI is working on the canvas…" : "Ask Ghost AI anything…"
                }
                disabled={isRunActive}
                className="min-h-18 max-h-40 resize-none border-0 bg-transparent p-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed"
                rows={1}
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  {isRunActive ? "Input disabled while AI works" : "Shift+Enter for newline"}
                </p>
                <Button
                  size="sm"
                  className="h-7 w-7 p-0 rounded-lg shrink-0 disabled:opacity-40"
                  style={
                    !isRunActive && input.trim()
                      ? { backgroundColor: "#62C073", color: "#000" }
                      : undefined
                  }
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isRunActive}
                  aria-label="Send message"
                >
                  {isSending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Realtime run tracker — mounts only while a run is in flight */}
          {runId && publicToken && (
            <RunTracker
              runId={runId}
              publicToken={publicToken}
              onComplete={(summary) => {
                appendToChat("assistant", summary);
                setRunId(null);
                setPublicToken(null);
              }}
            />
          )}
        </TabsContent>

        {/* Chat tab — room-scoped collaborative chat via ai-chat Liveblocks feed */}
        <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0 overflow-hidden">
          <RoomChatPanel />
        </TabsContent>

        {/* Specs tab */}
        <TabsContent value="specs" className="flex-1 flex flex-col min-h-0 mt-0 overflow-hidden">
          <SpecsPanel projectId={projectId} chatHistory={chatMessages} />
        </TabsContent>
      </Tabs>
    </aside>
    </>
  );
}

// ---- Room chat panel (ai-chat feed) ----------------------------------------

function RoomChatPanel() {
  const [chatInput, setChatInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatScrollEndRef = useRef<HTMLDivElement>(null);

  const self = useSelf();
  const senderName = self?.info?.name ?? "You";

  // Read the ai-chat feed — validated before rendering.
  const rawMessages = useStorage((root) => (root.aiChat ? [...root.aiChat] : []));
  const chatMessages = (rawMessages ?? []).filter(isChatMessage);

  // Append a message to the ai-chat LiveList, lazily initialising it if absent.
  const postMessage = useMutation(({ storage }, msg: ChatMessage) => {
    const list = storage.get("aiChat");
    if (list) {
      list.push(msg);
    } else {
      storage.set("aiChat", new LiveList([msg]));
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatScrollEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  function adjustHeight() {
    const el = chatInputRef.current;
    if (!el) return;
    el.style.height = "72px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function sendChatMessage() {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: senderName,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    try {
      postMessage(msg);
      setChatInput("");
      setSendError(null);
      if (chatInputRef.current) chatInputRef.current.style.height = "72px";
      scrollToBottom();
    } catch {
      setSendError("Failed to send. Please try again.");
    }
  }

  function handleChatKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  }

  return (
    <>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 flex flex-col gap-3">
          {chatMessages.length === 0 ? (
            <ChatEmptyState />
          ) : (
            <>
              {chatMessages.map((msg) => (
                <RoomChatBubble key={msg.id} msg={msg} isSelf={msg.sender === senderName} />
              ))}
              <div ref={chatScrollEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border shrink-0">
        {sendError && (
          <p className="text-[11px] text-destructive mb-2 px-1">{sendError}</p>
        )}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-3 pt-2.5 pb-2">
          <Textarea
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => {
              setChatInput(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleChatKeyDown}
            placeholder="Message the room…"
            className="min-h-18 max-h-40 resize-none border-0 bg-transparent p-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">Shift+Enter for newline</p>
            <Button
              size="sm"
              className="h-7 w-7 p-0 bg-brand hover:bg-brand/80 text-black rounded-lg shrink-0 disabled:opacity-50"
              onClick={sendChatMessage}
              disabled={!chatInput.trim()}
              aria-label="Send chat message"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-muted">
        <MessageSquare className="h-6 w-6 text-brand" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">Room Chat</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-47.5 mx-auto">
          Messages here are visible to everyone in this room in real time.
        </p>
      </div>
    </div>
  );
}

function RoomChatBubble({ msg, isSelf }: { msg: ChatMessage; isSelf: boolean }) {
  const time = new Date(msg.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSelf) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[10px] text-muted-foreground pr-1">{time}</span>
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 bg-brand/10 border-2 border-brand/40 text-foreground text-sm leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[10px] text-muted-foreground pl-1">
        {msg.sender} · {time}
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 bg-muted border border-border text-muted-foreground text-sm leading-relaxed">
        {msg.content}
      </div>
    </div>
  );
}

// ---- Run tracker (mounts while a Trigger.dev run is in flight) -------------

function RunTracker({
  runId,
  publicToken,
  onComplete,
}: {
  runId: string;
  publicToken: string;
  onComplete: (summary: string) => void;
}) {
  const { run } = useRealtimeRun(runId, { accessToken: publicToken });
  const calledRef = useRef(false);

  useEffect(() => {
    if (!run || calledRef.current) return;
    const terminal = ["COMPLETED", "FAILED", "CANCELED", "CRASHED", "TIMED_OUT", "SYSTEM_FAILURE"];
    if (terminal.includes(run.status)) {
      calledRef.current = true;
      const summary =
        run.status === "COMPLETED"
          ? "Done — the canvas has been updated with your design."
          : "The design run did not complete successfully. Please try again.";
      onComplete(summary);
    }
  }, [run, onComplete]);

  return null;
}

// ---- AI Architect helpers --------------------------------------------------

function EmptyState({ onChipClick }: { onChipClick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-muted">
        <Bot className="h-6 w-6 text-brand" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">Ghost AI Architect</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-47.5 mx-auto">
          Describe your system and I&apos;ll help design the architecture.
        </p>
      </div>
      {/* Horizontal scroll row of starter chips */}
      <div className="w-full overflow-x-auto pb-1 -mb-1">
        <div className="flex gap-2" style={{ width: "max-content" }}>
          {STARTER_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => onChipClick(chip)}
              className="flex-none px-3.5 py-2 rounded-full bg-secondary text-xs text-brand border border-border hover:bg-secondary/70 hover:border-brand/30 transition-colors whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Bubble used in the AI Architect tab — distinguishes user vs Ghost AI by sender name. */
function ArchitectBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender !== "Ghost AI";

  const time = new Date(msg.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[10px] text-muted-foreground pr-1">{time}</span>
        <div
          className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm leading-relaxed font-medium"
          style={{ backgroundColor: "#62C073", color: "#0d1117" }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-none flex items-center justify-center w-6 h-6 rounded-full bg-(--accent-ai) mt-5 shrink-0">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex flex-col items-start gap-0.5 min-w-0">
        <span className="text-[10px] text-muted-foreground pl-1">Ghost AI · {time}</span>
        <div className="max-w-full rounded-2xl rounded-tl-sm px-3 py-2 bg-muted border border-border text-foreground text-sm leading-relaxed overflow-x-auto
          [&_p]:mb-2 [&_p:last-child]:mb-0
          [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-0.5
          [&_li]:text-sm
          [&_h1]:text-sm [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1.5
          [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-2.5 [&_h2]:mb-1
          [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-0.5 [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-muted-foreground
          [&_strong]:font-semibold [&_em]:italic
          [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic
          [&_hr]:border-border [&_hr]:my-2
          [&_code]:bg-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-brand
          [&_pre]:bg-background [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-2 [&_pre]:border [&_pre]:border-border [&_pre]:text-xs [&_pre]:font-mono [&_pre]:whitespace-pre
          [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-background [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// ---- Specs panel ----------------------------------------------------------

type ProjectSpecMeta = {
  id: string;
  createdAt: string;
  filePath: string;
};

function getSpecFilename(spec: ProjectSpecMeta): string {
  const parts = spec.filePath.split("/");
  const last = parts[parts.length - 1];
  return last || `spec-${spec.id}.md`;
}

function SpecsPanel({
  projectId,
  chatHistory,
}: {
  projectId: string;
  chatHistory: ChatMessage[];
}) {
  const [specs, setSpecs] = useState<ProjectSpecMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<ProjectSpecMeta | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [specRunId, setSpecRunId] = useState<string | null>(null);
  const [specToken, setSpecToken] = useState<string | null>(null);

  const refreshSpecs = useCallback(() => {
    fetch(`/api/projects/${projectId}/specs`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        setSpecs(Array.isArray(data) ? data : []);
        setFetchError(false);
      })
      .catch(() => setFetchError(true));
  }, [projectId]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/specs`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        setSpecs(Array.isArray(data) ? data : []);
        setFetchError(false);
      })
      .catch(() => {
        setSpecs([]);
        setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  // Poll every 8 seconds while generating — fallback if realtime SSE misses the completion.
  useEffect(() => {
    if (!isGenerating) return;
    const id = setInterval(refreshSpecs, 8_000);
    return () => clearInterval(id);
  }, [isGenerating, refreshSpecs]);

  async function handleGenerateSpec() {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: projectId,
          chatHistory: chatHistory.map((m) => ({ role: m.role, content: m.content })),
          nodes: [],
          edges: [],
        }),
      });
      if (!res.ok) throw new Error(`Spec trigger failed (${res.status})`);
      const resBody = await res.json();
      const runId: string | undefined = typeof resBody?.runId === "string" && resBody.runId ? resBody.runId : undefined;
      if (!runId) {
        setIsGenerating(false);
        setSpecRunId(null);
        refreshSpecs();
        return;
      }
      setSpecRunId(runId);

      // Get a public read token for realtime tracking.
      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (tokenRes.ok) {
        const tokenBody = await tokenRes.json();
        const token: string | undefined = typeof tokenBody?.token === "string" && tokenBody.token ? tokenBody.token : undefined;
        if (token) {
          setSpecToken(token);
        } else {
          // Token missing from response — fall back to polling.
          setTimeout(() => {
            setIsGenerating(false);
            setSpecRunId(null);
            refreshSpecs();
          }, 60_000);
        }
      } else {
        // Fallback: refresh after a generous delay if realtime tracking is unavailable.
        setTimeout(() => {
          setIsGenerating(false);
          setSpecRunId(null);
          refreshSpecs();
        }, 60_000);
      }
    } catch {
      setIsGenerating(false);
    }
  }

  function handleDownload(specId: string) {
    const a = document.createElement("a");
    a.href = `/api/projects/${projectId}/specs/${specId}/download`;
    a.download = `spec-${specId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <>
      {/* Header row — always visible */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading…" : fetchError ? "Load failed" : `${specs.length} spec${specs.length !== 1 ? "s" : ""}`}
          </p>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={refreshSpecs}
            aria-label="Refresh specs"
            title="Refresh"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <Button
          size="sm"
          className="h-7 gap-1.5 text-xs px-2.5 disabled:opacity-50"
          style={!isGenerating ? { backgroundColor: "var(--accent-ai)", color: "#fff" } : undefined}
          onClick={handleGenerateSpec}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              Generate Spec
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : isGenerating && specs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center px-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-muted">
            <Sparkles className="h-6 w-6 text-(--accent-ai-text)" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-(--accent-ai) ring-2 ring-card animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">Generating Spec…</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ghost AI is reading your canvas and writing the technical specification.
            </p>
          </div>
        </div>
      ) : specs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center px-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-muted">
            <FileText className="h-6 w-6 text-brand" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">No Specs Yet</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Click &ldquo;Generate Spec&rdquo; to create a technical specification from your canvas.
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 flex flex-col gap-2">
            {isGenerating && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-(--accent-ai)/30 bg-(--accent-ai)/5 text-xs text-(--accent-ai-text)">
                <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                Generating new spec…
              </div>
            )}
            {specs.map((spec) => (
              <SpecListItem
                key={spec.id}
                spec={spec}
                filename={getSpecFilename(spec)}
                onPreview={() => setSelectedSpec(spec)}
                onDownload={() => handleDownload(spec.id)}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Realtime run tracker — mounts only while generation is in flight */}
      {specRunId && specToken && (
        <SpecRunTracker
          runId={specRunId}
          publicToken={specToken}
          onDone={(ok) => {
            setIsGenerating(false);
            setSpecRunId(null);
            setSpecToken(null);
            if (ok) refreshSpecs();
          }}
        />
      )}

      {selectedSpec && (
        <SpecPreviewModal
          projectId={projectId}
          spec={selectedSpec}
          filename={getSpecFilename(selectedSpec)}
          onClose={() => setSelectedSpec(null)}
          onDownload={() => handleDownload(selectedSpec.id)}
        />
      )}
    </>
  );
}

// ---- Spec run tracker --------------------------------------------------------

function SpecRunTracker({
  runId,
  publicToken,
  onDone,
}: {
  runId: string;
  publicToken: string;
  onDone: (ok: boolean) => void;
}) {
  const { run } = useRealtimeRun(runId, { accessToken: publicToken });
  const calledRef = useRef(false);

  useEffect(() => {
    if (!run || calledRef.current) return;
    const terminal = ["COMPLETED", "FAILED", "CANCELED", "CRASHED", "TIMED_OUT", "SYSTEM_FAILURE"];
    if (terminal.includes(run.status)) {
      calledRef.current = true;
      onDone(run.status === "COMPLETED");
    }
  }, [run, onDone]);

  return null;
}

function SpecListItem({
  spec,
  filename,
  onPreview,
  onDownload,
}: {
  spec: ProjectSpecMeta;
  filename: string;
  onPreview: () => void;
  onDownload: () => void;
}) {
  const date = new Date(spec.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/70 cursor-pointer transition-colors group w-full text-left"
      onClick={onPreview}
      onKeyDown={(e) => e.key === "Enter" && onPreview()}
    >
      <FileText className="h-4 w-4 text-brand shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{filename}</p>
        <p className="text-[10px] text-muted-foreground">{date}</p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onDownload();
        }}
        aria-label="Download spec"
      >
        <Download className="h-3 w-3" />
      </Button>
    </div>
  );
}

function SpecPreviewModal({
  projectId,
  spec,
  filename,
  onClose,
  onDownload,
}: {
  projectId: string;
  spec: ProjectSpecMeta;
  filename: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    fetch(`/api/projects/${projectId}/specs/${spec.id}/download`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.text();
      })
      .then(setContent)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [projectId, spec.id]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl w-[calc(100vw-2rem)] h-[88vh] flex flex-col gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-4 w-4 text-brand shrink-0" />
            <DialogTitle className="text-sm font-semibold truncate">{filename}</DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : loadError ? (
              <p className="text-sm text-destructive">Failed to load spec content.</p>
            ) : (
              <div className="prose-spec text-sm text-foreground leading-relaxed
                [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-foreground
                [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-foreground
                [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-foreground
                [&_h4]:text-sm [&_h4]:font-medium [&_h4]:mt-3 [&_h4]:mb-1
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-3
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-3
                [&_li]:text-sm [&_li]:leading-relaxed
                [&_p]:mb-3 [&_p:last-child]:mb-0 [&_p]:leading-relaxed
                [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-brand
                [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_pre]:border [&_pre]:border-border [&_pre]:text-xs [&_pre]:font-mono [&_pre]:whitespace-pre
                [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_blockquote]:mb-3
                [&_strong]:font-semibold [&_em]:italic
                [&_hr]:border-border [&_hr]:my-5
                [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:mb-4
                [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left
                [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2">
                <ReactMarkdown>{content!}</ReactMarkdown>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-3.5 border-t border-border rounded-b-xl shrink-0 flex-row items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-brand hover:bg-brand/80 text-black"
            onClick={onDownload}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
