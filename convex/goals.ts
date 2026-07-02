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

export const add = mutation({
  args: { text: v.string(), date: v.string() },
  handler: async (ctx, { text, date }) => {
    const userId = await getAuthedUserId(ctx);
    return ctx.db.insert("goals", {
      userId,
      text,
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
