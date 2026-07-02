import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import type { EmailConfig } from "@convex-dev/auth/server";
import { z } from "zod";
import type { DataModel } from "./_generated/dataModel";
import { createGmailOtp } from "./GmailOtp";

const verifyEmail = createGmailOtp("verify");
const resetEmail = createGmailOtp("reset");

const emailSchema = z.string().trim().toLowerCase().email();

// The client's <input type="email"> only enforces format in the browser —
// calling this Convex mutation directly bypasses it entirely. Since the
// validated email ends up as nodemailer's `to` address (see GmailOtp.ts /
// sendOtpEmail.ts), rejecting anything that isn't a well-formed address here
// also rules out control characters (CR/LF) reaching nodemailer, closing off
// header-injection surface from known unpatched nodemailer CVEs.
function validateEmail(rawEmail: unknown): string {
  const result = emailSchema.safeParse(rawEmail);
  if (!result.success) {
    throw new Error("Invalid email address.");
  }
  return result.data;
}

const PasswordWithProfile = Password<DataModel>({
  profile(params) {
    return {
      email: validateEmail(params.email),
      name: (params.name as string | undefined) || undefined,
    };
  },
  verify: verifyEmail as EmailConfig,
  reset: resetEmail as EmailConfig,
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordWithProfile],
});
