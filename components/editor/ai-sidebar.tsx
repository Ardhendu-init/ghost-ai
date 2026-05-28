"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { Bot, X, Send, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  function adjustTextareaHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "72px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: trimmed },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "72px";
    // Scroll after state update
    setTimeout(
      () => scrollEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    /*
     * absolute right-0 top-0 h-full — sits inside the relative content row in workspace-shell,
     * so it aligns perfectly below both navbars without hard-coding pixel offsets.
     */
    <aside
      id="ai-panel"
      className={`absolute right-0 top-0 h-full w-80 z-20 flex flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted shrink-0">
          <Bot className="h-4 w-4 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">
            AI Workspace
          </p>
          <p className="text-xs text-muted-foreground leading-snug">
            Collaborate with Ghost AI
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
        {/* line variant = transparent list background, no pill on active */}
        <TabsList
          variant="line"
          className="w-full justify-start gap-0.5 px-3 py-1  h-auto border-b border-border rounded-none"
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
        <TabsContent
          value="architect"
          className="flex-1 flex flex-col min-h-0 mt-0"
        >
          <ScrollArea className="flex-1">
            <div className="p-4 flex flex-col gap-3">
              {messages.length === 0 ? (
                <EmptyState onChipClick={sendMessage} />
              ) : (
                <>
                  {messages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}
                  <div ref={scrollEndRef} />
                </>
              )}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="p-3 border-t border-border shrink-0">
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-3 pt-2.5 pb-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI anything…"
                className="min-h-18 max-h-40 resize-none border-0 bg-transparent p-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={1}
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  Shift+Enter for newline
                </p>
                <Button
                  size="sm"
                  className="h-7 w-7 p-0 bg-brand hover:bg-brand/80 text-black rounded-lg shrink-0"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Specs tab */}
        <TabsContent
          value="specs"
          className="flex-1 flex flex-col min-h-0 mt-0"
        >
          <div className="p-4 flex flex-col gap-4">
            <Button className="w-full bg-brand hover:bg-brand/80 text-black font-medium h-9 rounded-xl">
              Generate Spec
            </Button>
            <DemoSpecCard />
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function EmptyState({ onChipClick }: { onChipClick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-muted">
        <Bot className="h-6 w-6 text-brand" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">
          Ghost AI Architect
        </p>
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

function ChatBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 bg-brand/10 border-2 border-brand/40 text-foreground text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 bg-muted border border-border text-muted-foreground text-sm leading-relaxed">
        {message.content}
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
