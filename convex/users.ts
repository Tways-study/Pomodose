import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

// Who is signed in, for the header's profile bubble. Returns null (not an error)
// when signed out or the row is gone, so a query that fires while a sign-out is
// clearing the token never throws into the UI.
export const me = query({
  args: {},
  returns: v.union(v.object({ email: v.union(v.string(), v.null()) }), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return { email: user.email ?? null };
  },
});
