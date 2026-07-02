import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthedUserId } from "./lib/auth";

export const list = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await getAuthedUserId(ctx);
    return ctx.db
      .query("goals")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
      .collect();
  },
});

// Mirrors the UI's own limit (goal-list.tsx's <input maxLength={80}> and its
// add() guard) — that's client-side only, so callers hitting this mutation
// directly (bypassing the form) need the same cap enforced here.
const MAX_GOAL_TEXT_LENGTH = 80;

export const add = mutation({
  args: { text: v.string(), date: v.string() },
  handler: async (ctx, { text, date }) => {
    const userId = await getAuthedUserId(ctx);
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_GOAL_TEXT_LENGTH) {
      throw new Error("Goal text must be between 1 and 80 characters.");
    }
    return ctx.db.insert("goals", {
      userId,
      text: trimmed,
      date,
      done: false,
      createdAt: Date.now(),
    });
  },
});

export const toggle = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthedUserId(ctx);
    const goal = await ctx.db.get(id);
    if (!goal || goal.userId !== userId) throw new Error("Goal not found");
    await ctx.db.patch(id, { done: !goal.done });
  },
});

export const remove = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthedUserId(ctx);
    const goal = await ctx.db.get(id);
    if (!goal || goal.userId !== userId) throw new Error("Goal not found");
    await ctx.db.delete(id);
  },
});
