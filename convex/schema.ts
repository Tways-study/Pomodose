import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  goals: defineTable({
    userId: v.id("users"),
    text: v.string(),
    done: v.boolean(),
    createdAt: v.number(),
    date: v.string(), // "YYYY-MM-DD", client-computed local day
  }).index("by_user_and_date", ["userId", "date"]),
  // One row per completed timer session. Exists so dailyDoses/focusCycle can
  // survive a page reload — the timer reducer holds them in page state only.
  // Same client-computed `date` bucketing as goals (lib/date.ts's todayKey).
  sessions: defineTable({
    userId: v.id("users"),
    phase: v.union(v.literal("focus"), v.literal("short"), v.literal("long")),
    durationSeconds: v.number(),
    completedAt: v.number(),
    date: v.string(), // "YYYY-MM-DD", client-computed local day
  }).index("by_user_and_date", ["userId", "date"]),
});
