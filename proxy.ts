import { NextResponse } from "next/server";
import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// Runs on the Node.js runtime (Next.js 16 default for Proxy). Convex Auth
// stores its session token client-side (not a cookie we manage ourselves),
// so this only needs to read that state and route accordingly.
export const proxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const { pathname } = request.nextUrl;
  const authed = await convexAuth.isAuthenticated();

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
