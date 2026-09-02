import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthedUserId } from "./lib/auth";

const phaseValidator = v.union(v.literal("focus"), v.literal("short"), v.literal("long"));

const sessionDoc = v.object({
  _id: v.id("sessions"),
  _creationTime: v.number(),
  userId: v.id("users"),
  phase: phaseValidator,
  durationSeconds: v.number(),
  completedAt: v.number(),
  date: v.string(),
});

// Sanity bound on a logged session, mirroring the way convex/goals.ts caps
// text length: the mutation is reachable directly, bypassing the timer, so the
// duration can't be trusted to be a real phase length. One day is far above any
// SETTINGS duration and far below anything that would corrupt a day's totals.
const MAX_DURATION_SECONDS = 24 * 60 * 60;

export const log = mutation({
  args: { phase: phaseValidator, durationSeconds: v.number(), date: v.string() },
  returns: v.id("sessions"),
  handler: async (ctx, { phase, durationSeconds, date }) => {
    const userId = await getAuthedUserId(ctx);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > MAX_DURATION_SECONDS) {
      throw new Error("Session duration is out of range.");
    }
    return ctx.db.insert("sessions", {
      userId,
      phase,
      durationSeconds,
      date,
      completedAt: Date.now(),
    });
  },
});

export const listForDate = query({
  args: { date: v.string() },
  returns: v.array(sessionDoc),
  handler: async (ctx, { date }) => {
    const userId = await getAuthedUserId(ctx);
    return ctx.db
      .query("sessions")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
      .collect();
  },
});
