import { describe, expect, it } from "vitest";
import { NOTIFICATION_COPY, NOTIFICATION_PRIORITY, nextVariant, type NotificationBag } from "./notification-copy";
import { ADDRESS_TOKEN } from "./address-terms";
import type { NotificationEvent } from "@/types";

const EVENTS = Object.keys(NOTIFICATION_COPY) as NotificationEvent[];

// The longest address term — headlines must fit the tab title after this
// substitution, the worst case for length.
const LONGEST_NAME = "Pill Whisperer";

describe("NOTIFICATION_COPY", () => {
  it("has at least one variant for every notification event", () => {
    for (const event of EVENTS) {
      expect(NOTIFICATION_COPY[event].length).toBeGreaterThan(0);
    }
  });

  it("keeps every headline at or under 28 chars after %NAME% substitution", () => {
    for (const event of EVENTS) {
      for (const variant of NOTIFICATION_COPY[event]) {
        const rendered = variant.headline.replaceAll(ADDRESS_TOKEN, LONGEST_NAME);
        expect(rendered.length, `${event}: "${variant.headline}" -> "${rendered}"`).toBeLessThanOrEqual(28);
      }
    }
  });

  it("never leaves %NAME% unsubstituted once rendered", () => {
    for (const event of EVENTS) {
      for (const variant of NOTIFICATION_COPY[event]) {
        const headline = variant.headline.replaceAll(ADDRESS_TOKEN, LONGEST_NAME);
        const note = variant.note.replaceAll(ADDRESS_TOKEN, LONGEST_NAME);
        expect(headline).not.toContain(ADDRESS_TOKEN);
        expect(note).not.toContain(ADDRESS_TOKEN);
      }
    }
  });

  it("has a priority entry for every event", () => {
    for (const event of EVENTS) {
      expect(NOTIFICATION_PRIORITY[event]).toBeTypeOf("number");
    }
  });
});

describe("nextVariant", () => {
  it("exhausts every variant of an event before repeating any of them", () => {
    const event: NotificationEvent = "focus-complete";
    const total = NOTIFICATION_COPY[event].length;
    const seen: string[] = [];
    let bag: NotificationBag = {};
    for (let i = 0; i < total; i++) {
      const result = nextVariant(event, bag);
      bag = result.bag;
      seen.push(result.variant.headline);
    }
    // All variants shown exactly once, in some order.
    const expectedHeadlines = NOTIFICATION_COPY[event].map((v) => v.headline).sort();
    expect(seen.slice().sort()).toEqual(expectedHeadlines);
  });

  it("reshuffles once a bag is exhausted rather than returning undefined", () => {
    const event: NotificationEvent = "short-complete";
    const total = NOTIFICATION_COPY[event].length;
    let bag: NotificationBag = {};
    for (let i = 0; i < total; i++) {
      bag = nextVariant(event, bag).bag;
    }
    // Bag for this event is now empty; the next call must still produce a variant.
    const { variant, bag: nextBag } = nextVariant(event, bag);
    expect(variant).toBeDefined();
    expect(NOTIFICATION_COPY[event]).toContain(variant);
    expect(nextBag[event]?.length).toBe(total - 1);
  });

  it("does not disturb other events' bags", () => {
    let bag: NotificationBag = {};
    bag = nextVariant("focus-complete", bag).bag;
    const before = bag["short-complete"];
    bag = nextVariant("focus-complete", bag).bag;
    expect(bag["short-complete"]).toBe(before);
  });
});
