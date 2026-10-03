"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { LogOut, User } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { HeaderPopover } from "@/components/header-popover";
import { SilentBoundary } from "@/components/silent-boundary";
import { api } from "@/convex/_generated/api";
import { SPRING_BOUNCY } from "@/lib/motion";

interface MenuProps {
  /** undefined = still loading, null = not available. */
  email: string | null | undefined;
  onSignOut: () => void;
  signingOut: boolean;
  signOutError: string | null;
}

function ProfileMenu({ email, onSignOut, signingOut, signOutError }: MenuProps) {
  const reduceMotion = useReducedMotion();
  const initial = email ? email.charAt(0).toUpperCase() : null;

  return (
    <HeaderPopover
      label="Account"
      rootClassName="min-w-0 flex-1 sm:flex-none"
      triggerLabel={email ? `Account menu, signed in as ${email}` : "Account menu"}
      trigger={
        <>
          <span className="grid h-8 w-8 flex-none place-items-center rounded-pill bg-gum-lilac font-display text-sm font-semibold text-ink">
            {initial ?? <User size={16} strokeWidth={2.25} aria-hidden />}
          </span>
          {email === undefined ? (
            <span aria-hidden className="h-3 w-24 animate-pulse rounded-pill bg-surface-2" />
          ) : (
            <span className="min-w-0 truncate text-left font-body text-sm sm:max-w-[15rem]">{email ?? "Account"}</span>
          )}
        </>
      }
      triggerClassName="flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-pill bg-surface py-1.5 pl-1.5 pr-4 sm:w-auto text-ink shadow-soft transition-colors duration-150 hover:bg-surface-2"
    >
      {() => (
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-body text-sm text-ink-soft">Signed in as</p>
            <p className="break-all font-display text-base font-semibold">{email ?? "your account"}</p>
          </div>
          <motion.button
            type="button"
            onClick={onSignOut}
            disabled={signingOut}
            whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
            transition={SPRING_BOUNCY}
            className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-pill bg-surface-2 px-4 font-display text-sm font-medium text-ink transition-colors duration-150 hover:bg-gum-lilac/40 disabled:opacity-60"
          >
            <LogOut size={16} strokeWidth={2.25} aria-hidden />
            {signingOut ? "Signing out…" : "Sign out"}
          </motion.button>
          {signOutError && (
            <p role="alert" className="rounded-control border-2 border-alert bg-surface px-3 py-2 text-xs text-alert">
              {signOutError}
            </p>
          )}
        </div>
      )}
    </HeaderPopover>
  );
}

function ProfileMenuWithEmail(props: Omit<MenuProps, "email">) {
  const { isAuthenticated } = useConvexAuth();
  // Skipped while signed out (including the moment sign-out clears the token), the
  // same guard the goals queries use.
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  return <ProfileMenu {...props} email={me === undefined ? undefined : (me?.email ?? null)} />;
}

/**
 * The profile bubble: shows which account is signed in and holds Sign out. If the
 * email lookup fails (e.g. the backend function is not deployed yet) the bubble
 * falls back to a generic "Account" label, and Sign out still works.
 */
export function ProfileMenuConnected(props: Omit<MenuProps, "email">) {
  return (
    <SilentBoundary fallback={<ProfileMenu {...props} email={null} />}>
      <ProfileMenuWithEmail {...props} />
    </SilentBoundary>
  );
}
