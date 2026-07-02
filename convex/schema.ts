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
});
