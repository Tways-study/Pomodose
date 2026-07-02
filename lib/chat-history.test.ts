import { describe, expect, it } from "vitest";
import { HISTORY_MESSAGE_LIMIT, trimHistory } from "./chat-history";
import type { ChatMessage } from "@/types";

function turns(n: number): ChatMessage[] {
  return Array.from({ length: n }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "model",
    content: `message ${i}`,
  }));
}

describe("trimHistory", () => {
  it("returns the array unchanged when at or under the limit", () => {
    const messages = turns(HISTORY_MESSAGE_LIMIT);
    expect(trimHistory(messages)).toBe(messages);
  });

  it("returns the array unchanged when well under the limit", () => {
    const messages = turns(4);
    expect(trimHistory(messages)).toEqual(messages);
  });

  it("trims to the last HISTORY_MESSAGE_LIMIT messages, preserving order", () => {
    const messages = turns(HISTORY_MESSAGE_LIMIT + 5); // starts on "user" (index 5 is odd -> model)
    const result = trimHistory(messages);
    expect(result.length).toBeLessThanOrEqual(HISTORY_MESSAGE_LIMIT);
    expect(result[result.length - 1]).toEqual(messages[messages.length - 1]);
  });

  it("shifts the window forward by one when the naive slice would start on a model message", () => {
    // 21 messages, alternating starting with "user": index 1 (the naive
    // start = 21-20 = 1) is "model" — the window must shift to start at index 2 ("user").
    const messages = turns(HISTORY_MESSAGE_LIMIT + 1);
    expect(messages[1].role).toBe("model");
    const result = trimHistory(messages);
    expect(result[0].role).toBe("user");
    expect(result[0]).toEqual(messages[2]);
    expect(result.length).toBe(HISTORY_MESSAGE_LIMIT - 1);
  });

  it("does not mutate the input array", () => {
    const messages = turns(HISTORY_MESSAGE_LIMIT + 10);
    const copy = [...messages];
    trimHistory(messages);
    expect(messages).toEqual(copy);
  });
});
