import { z } from "zod";

/**
 * Shared task/feed payload types used by both the Trigger.dev background
 * tasks and the Liveblocks feed subscriptions on the client.
 */

/** Payload stored in the `aiStatusFeed` Liveblocks Storage key. */
// Must be a `type`, not `interface`, to satisfy Liveblocks LSON constraint.
export type AiStatusFeedPayload = {
  text?: string;
};

/** Runtime guard — validates an unknown value is a well-formed feed payload. */
export function isAiStatusFeedPayload(value: unknown): value is AiStatusFeedPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if ("text" in v && v.text !== undefined && typeof v.text !== "string") return false;
  return true;
}

// --- ai-chat feed ---

/** Schema for a single message in the ai-chat Liveblocks feed. */
export const chatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  role: z.literal("user"),
  content: z.string().min(1),
  timestamp: z.number(),
});

// Must be a `type`, not `interface`, for Liveblocks LSON compatibility.
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** Runtime guard — validates an unknown value before rendering it as a chat message. */
export function isChatMessage(value: unknown): value is ChatMessage {
  return chatMessageSchema.safeParse(value).success;
}
