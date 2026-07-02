import type { ChatMessage } from "@/types";

export const HISTORY_MESSAGE_LIMIT = 20; // last 10 user/model turns

/**
 * Keeps only the most recent HISTORY_MESSAGE_LIMIT messages, so token cost
 * per request stays bounded regardless of how long a session runs. Avoids
 * starting the window on an orphaned "model" reply (Gemini expects turns to
 * read naturally starting from a user message) — assumes messages already
 * alternate user/model, which holds for every message list this app builds.
 */
export function trimHistory(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= HISTORY_MESSAGE_LIMIT) return messages;
  let start = messages.length - HISTORY_MESSAGE_LIMIT;
  if (messages[start]?.role === "model") start += 1;
  return messages.slice(start);
}
