import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

// Simple access gate: no accounts, no database — one shared access code for
// this single-user app. Runs on the Node.js runtime (Next.js 16 default for
// Proxy), so lib/auth.ts's use of Node's crypto module works here directly.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authed = isValidSession(token);
  const { pathname } = request.nextUrl;

  if (pathname === "/gate") {
    return authed ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }

  if (authed) return NextResponse.next();

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/gate", request.url));
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.png).*)"],
};
