import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { z } from "zod";
import type { DataModel } from "./_generated/dataModel";

const emailSchema = z.string().trim().toLowerCase().email();

// The client's <input type="email"> only enforces format in the browser —
// calling this Convex mutation directly bypasses it entirely, so re-validate
// the email server-side before it's stored as the account identifier.
function validateEmail(rawEmail: unknown): string {
  const result = emailSchema.safeParse(rawEmail);
  if (!result.success) {
    throw new Error("Invalid email address.");
  }
  return result.data;
}

// Password-only auth: no email verification or reset flow, so no external mail
// provider is needed. Accounts are created and signed in immediately.
const PasswordWithProfile = Password<DataModel>({
  profile(params) {
    return {
      email: validateEmail(params.email),
      name: (params.name as string | undefined) || undefined,
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordWithProfile],
});
