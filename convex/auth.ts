import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { z } from "zod";
import type { DataModel } from "./_generated/dataModel";
import { BrevoOTPPasswordReset } from "./BrevoOTPPasswordReset";

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

// Password auth with a scaffolded reset flow: accounts are created and
// signed in immediately (no email verification on signUp/signIn). Password
// reset sends a Brevo transactional email OTP (see ./BrevoOTPPasswordReset.ts)
// — it's wired end-to-end but fails gracefully with a distinct error message
// until BREVO_API_KEY/BREVO_SENDER_EMAIL are configured on the deployment.
const PasswordWithProfile = Password<DataModel>({
  profile(params) {
    return {
      email: validateEmail(params.email),
      name: (params.name as string | undefined) || undefined,
    };
  },
  reset: BrevoOTPPasswordReset,
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordWithProfile],
});
