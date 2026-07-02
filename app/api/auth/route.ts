import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  createSessionToken,
  hasAccessCode,
  registerAccessCode,
  verifyAccessCode,
} from "@/lib/auth";

const registerSchema = z.object({
  action: z.literal("register"),
  code: z.string().min(4, "Access codes need at least 4 characters.").max(64),
  confirmCode: z.string().min(1).max(64),
});

const loginSchema = z.object({
  action: z.literal("login"),
  code: z.string().min(1, "Enter your access code.").max(64),
});

const bodySchema = z.union([registerSchema, loginSchema]);

function withSession(): NextResponse {
  // Only called right after a successful register/verify, so a registered
  // access code always exists at this point and createSessionToken() will
  // not return null — but its signature is honest about the general case.
  const token = createSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (parsed.data.action === "register") {
    if (hasAccessCode()) {
      return NextResponse.json(
        { error: "An access code is already set for Pomodose." },
        { status: 409 },
      );
    }
    if (parsed.data.code !== parsed.data.confirmCode) {
      return NextResponse.json(
        { error: "Those two codes don't match. Give it another try, Doc." },
        { status: 400 },
      );
    }
    registerAccessCode(parsed.data.code);
    return withSession();
  }

  if (!hasAccessCode() || !verifyAccessCode(parsed.data.code)) {
    return NextResponse.json(
      { error: "That code doesn't match. Try again." },
      { status: 401 },
    );
  }
  return withSession();
}
