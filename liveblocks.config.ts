import { LiveList } from "@liveblocks/client";
import type { AiStatus } from "./types/ai";
import type { AiStatusFeedPayload, ChatMessage } from "./types/tasks";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {
      // Shared AI design-agent presence + status, written by the background
      // task and read by every participant via AiCursor / AiStatusBanner.
      ai?: AiStatus | null;
      // Generic AI status feed — latest message from any AI generation step.
      // Written by background tasks, subscribed to by the AI sidebar.
      aiStatusFeed?: AiStatusFeedPayload | null;
      // Room-scoped collaborative chat feed, separate from ai-status-feed.
      aiChat?: LiveList<ChatMessage> | null;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    RoomEvent: {};

    ThreadMetadata: {};

    RoomInfo: {};
  }
}

export {};
