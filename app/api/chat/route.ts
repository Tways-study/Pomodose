import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { DOSEY_SYSTEM_PROMPT, buildContextBlock } from "@/lib/dosey";
import { trimHistory } from "@/lib/chat-history";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ChatRateLimitError } from "@/types";

// Validate the client payload. Mirrors ChatMessage / DoseyStats / Goal in @/types.
const messageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string().min(1).max(4000),
});

const statsSchema = z.object({
  dailyDoses: z.number(),
  cyclePosition: z.number(),
  cycleLength: z.number(),
  phase: z.enum(["focus", "short", "long"]),
  status: z.enum(["idle", "running", "paused", "complete"]),
});

const goalSchema = z.object({
  id: z.string(),
  text: z.string().max(80),
  done: z.boolean(),
  createdAt: z.number(),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  stats: statsSchema,
  goals: z.array(goalSchema).max(100),
});

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Dosey isn't configured yet — add GEMINI_API_KEY to .env.local." },
      { status: 500 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const rateLimit = consumeRateLimit(ip);
  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: "Dosey's used up her free questions for today. She'll be back tomorrow!",
        resetAt: rateLimit.resetAt,
      } satisfies ChatRateLimitError,
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((new Date(rateLimit.resetAt).getTime() - Date.now()) / 1000)),
          ),
        },
      },
    );
  }

  const { messages, stats, goals } = parsed.data;
  const systemInstruction = `${DOSEY_SYSTEM_PROMPT}\n\n${buildContextBlock(stats, goals)}`;
  const contents = trimHistory(messages).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const ai = new GoogleGenAI({ apiKey });

  let result: Awaited<ReturnType<typeof ai.models.generateContentStream>>;
  try {
    result = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: { systemInstruction, maxOutputTokens: 800 },
    });
  } catch (err) {
    console.error("Dosey: Gemini request failed", err);
    return Response.json({ error: "Dosey couldn't reach Gemini." }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result) {
          if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
        }
        controller.close();
      } catch (err) {
        console.error("Dosey: streaming failed", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
