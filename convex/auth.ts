import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import type { DataModel } from "./_generated/dataModel";
import { createGmailOtp } from "./GmailOtp";

const verifyEmail = createGmailOtp("verify");
const resetEmail = createGmailOtp("reset");

const PasswordWithProfile = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: (params.name as string | undefined) || undefined,
    };
  },
  verify: verifyEmail,
  reset: resetEmail,
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordWithProfile],
});
