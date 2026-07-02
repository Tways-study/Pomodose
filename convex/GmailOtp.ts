import { Email } from "@convex-dev/auth/providers/Email";
import type { EmailConfig, EmailUserConfig, GenericActionCtxWithAuthConfig } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { generateOtpCode } from "./lib/generateOtpCode";

type Purpose = "verify" | "reset";

export function createGmailOtp(purpose: Purpose): EmailConfig<any> {
  // `generateVerificationToken` is only declared on Convex Auth's PhoneConfig
  // type, but the runtime checks it generically for any provider — see
  // node_modules/@convex-dev/auth/dist/server/implementation/signIn.js. Widen
  // the type here (on a variable, not an inline object literal) so TS doesn't
  // flag it as an excess property.
  //
  // `EmailUserConfig<DataModel>` derives from `Partial<EmailConfig>`, which makes
  // `sendVerificationRequest` optional (`(...) => Awaitable<void> | undefined`) on
  // the variable's static type regardless of what's assigned. `Email()` requires
  // `Pick<EmailConfig, "sendVerificationRequest">` (non-optional), so intersect that
  // in explicitly to force the property back to required in the merged type.
  const config: EmailUserConfig<DataModel> &
    Pick<EmailConfig<DataModel>, "sendVerificationRequest"> & {
      generateVerificationToken?: () => Promise<string>;
    } = {
    id: purpose === "verify" ? "gmail-otp-verify" : "gmail-otp-reset",
    maxAge: 60 * 15, // 15 minutes
    generateVerificationToken: async () => generateOtpCode(),
    async sendVerificationRequest({ identifier, token }: { identifier: string; token: string }, ctx?: GenericActionCtxWithAuthConfig<DataModel>) {
      if (!ctx) throw new Error("Missing action context for sendVerificationRequest.");
      await ctx.runAction(internal.lib.sendOtpEmail.send, {
        to: identifier,
        code: token,
        purpose,
      });
    },
  };
  return Email(config);
}
