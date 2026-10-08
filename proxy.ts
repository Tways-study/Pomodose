import { NextResponse } from "next/server";
import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { resolveAuthed, type Verdict } from "@/lib/auth-gate";

const VERIFY_TIMEOUT_MS = 4000;

// Asks Convex whether the token is good. Convex Auth's own `isAuthenticated()` folds
// every failure (timeout, network blip, cold start) into `false`, which used to send a
// signed-in user to /login on a random refresh. Here a failure is "unknown" instead.
async function verifyToken(token: string): Promise<Verdict> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const ok = await Promise.race([
      fetchQuery(api.auth.isAuthenticated, {}, { token }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("isAuthenticated timed out")), VERIFY_TIMEOUT_MS);
      }),
    ]);
    return ok ? "yes" : "no";
  } catch (error) {
    console.warn("Pomodose: could not verify the session with Convex", error);
    return "unknown";
  } finally {
    clearTimeout(timer);
  }
}

// Runs on the Node.js runtime (Next.js 16 default for Proxy). Convex Auth keeps the
// session in cookies and refreshes them in its middleware before this handler runs, so
// this only needs to read the token and route accordingly.
export const proxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const { pathname } = request.nextUrl;
  const authed = await resolveAuthed(await convexAuth.getToken(), verifyToken, Date.now());

  if (pathname === "/login") {
    return authed ? NextResponse.redirect(new URL("/", request.url)) : undefined;
  }

  if (authed) return undefined;

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  return nextjsMiddlewareRedirect(request, "/login");
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|opengraph-image.png|twitter-image.png|manifest.webmanifest).*)"],
};
