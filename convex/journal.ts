import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthedUserId } from "./lib/auth";
import { isJournalTextTooLong, normalizeJournalText } from "../lib/journal";

const entryDoc = v.object({
  _id: v.id("journal"),
  _creationTime: v.number(),
  userId: v.id("users"),
  date: v.string(),
  text: v.string(),
  updatedAt: v.number(),
});

const MAX_RECENT = 30;

export const getForDate = query({
  args: { date: v.string() },
  returns: v.union(entryDoc, v.null()),
  handler: async (ctx, { date }) => {
    const userId = await getAuthedUserId(ctx);
    return ctx.db
      .query("journal")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(entryDoc),
  handler: async (ctx, { limit }) => {
    const userId = await getAuthedUserId(ctx);
    const take = Math.min(Math.max(Math.floor(limit ?? 14), 1), MAX_RECENT);
    return ctx.db
      .query("journal")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(take);
  },
});

// Upsert today's entry; empty text deletes it so "cleared" means "no entry".
export const save = mutation({
  args: { date: v.string(), text: v.string() },
  returns: v.null(),
  handler: async (ctx, { date, text }) => {
    const userId = await getAuthedUserId(ctx);
    if (isJournalTextTooLong(text)) {
      throw new Error("Journal entries can be up to 2000 characters.");
    }
    const trimmed = normalizeJournalText(text);
    const existing = await ctx.db
      .query("journal")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();

    if (!trimmed) {
      if (existing) await ctx.db.delete(existing._id);
      return null;
    }
    if (existing) {
      await ctx.db.patch(existing._id, { text: trimmed, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("journal", { userId, date, text: trimmed, updatedAt: Date.now() });
    }
    return null;
  },
});
