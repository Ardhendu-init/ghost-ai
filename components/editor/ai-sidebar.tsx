"use client";

import { useRef, useState, useCallback, useEffect, KeyboardEvent } from "react";
import { Bot, X, Send, FileText, Download, Loader2, MessageSquare } from "lucide-react";
import { LiveList } from "@liveblocks/client";
import { useStorage, useMutation, useSelf } from "@liveblocks/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      role: "user", // ChatMessage only has "user" role per schema; sender distinguishes AI
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
        <TabsContent value="architect" className="flex-1 flex flex-col min-h-0 mt-0">
          <ScrollArea className="flex-1">
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
        <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0">
          <RoomChatPanel />
        </TabsContent>

        {/* Specs tab */}
        <TabsContent value="specs" className="flex-1 flex flex-col min-h-0 mt-0">
          <div className="p-4 flex flex-col gap-4">
            <Button className="w-full bg-brand hover:bg-brand/80 text-black font-medium h-9 rounded-xl">
              Generate Spec
            </Button>
            <DemoSpecCard />
          </div>
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
      <ScrollArea className="flex-1">
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
      <div className="flex flex-col gap-2 w-full">
        {STARTER_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onChipClick(chip)}
            className="w-full text-left px-3.5 py-2.5 rounded-xl bg-secondary text-xs text-brand border border-border hover:bg-secondary/70 hover:border-brand/30 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Bubble used in the AI Architect tab — distinguishes user vs Ghost AI by sender name. */
function ArchitectBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender !== "Ghost AI";

  if (isUser) {
    return (
      <div className="flex justify-end">
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
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 bg-muted border border-border text-foreground text-sm leading-relaxed">
        {msg.content}
      </div>
    </div>
  );
}

function DemoSpecCard() {
  return (
    <div className="rounded-2xl border border-border bg-secondary p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted shrink-0 mt-0.5">
          <FileText className="h-4 w-4 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            Microservices Architecture
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
            API gateway with 4 downstream services, PostgreSQL databases, and
            async event bus for inter-service communication.
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs opacity-50 cursor-not-allowed"
          disabled
        >
          <Download className="h-3 w-3" />
          Download
        </Button>
      </div>
    </div>
  );
}
