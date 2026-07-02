"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQuery } from "convex/react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { trimHistory } from "@/lib/chat-history";
import { loadRateLimit, saveRateLimit } from "@/lib/rate-limit-storage";
import { todayKey } from "@/lib/date";
import { api } from "@/convex/_generated/api";
import type { ChatMessage, ChatRateLimitError, DoseyStats } from "@/types";

interface Props {
  stats: DoseyStats;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const SUGGESTIONS = [
  "How focused was I today?",
  "What should I focus on next?",
  "Quiz me on pharmacokinetics",
];

function formatResetTime(resetAt: string): string {
  return new Date(resetAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Dosey the capsule: purple top + cream bottom, smiley face, tomato sprout.
// A crisp vector version of the mascot, matching the illustration in the panel.
// The eyes blink periodically to make every Dosey mark feel alive.
function DoseyMark({ size = 22 }: { size?: number }) {
  const clip = useId();
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={(size * 44) / 40} viewBox="0 0 40 44" fill="none" aria-hidden>
      {/* sprout */}
      <path d="M20 11 C 19 7 17.5 6 16.6 3.8" stroke="#5F9A4F" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 10.5 C 21.6 8.5 23.8 8.2 25 6.6" stroke="#5F9A4F" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="14.9" cy="4.4" rx="2.5" ry="1.3" transform="rotate(-38 14.9 4.4)" fill="#6FA85C" stroke="#2E2433" strokeWidth="1" />
      <ellipse cx="25.6" cy="6.6" rx="2.3" ry="1.2" transform="rotate(26 25.6 6.6)" fill="#6FA85C" stroke="#2E2433" strokeWidth="1" />
      <circle cx="24.9" cy="4.4" r="2" fill="#D9604F" stroke="#2E2433" strokeWidth="1" />
      {/* capsule body */}
      <defs>
        <clipPath id={clip}>
          <rect x="12" y="10" width="16" height="30" rx="8" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="12" y="10" width="16" height="15" fill="#C9B6E4" />
        <rect x="12" y="25" width="16" height="15" fill="#F1EADC" />
      </g>
      <rect x="12" y="10" width="16" height="30" rx="8" stroke="#2E2433" strokeWidth="2" />
      <line x1="12" y1="25" x2="28" y2="25" stroke="#2E2433" strokeWidth="2" />
      {/* face */}
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1] }}
        transition={
          reduce
            ? undefined
            : { duration: 0.6, times: [0, 0.9, 0.95, 1], repeat: Infinity, repeatDelay: 3.6, ease: "easeInOut" }
        }
      >
        <circle cx="17" cy="20" r="1.15" fill="#2E2433" />
        <circle cx="23" cy="20" r="1.15" fill="#2E2433" />
      </motion.g>
      <path d="M17.5 22.4 Q20 24.6 22.5 22.4" stroke="#2E2433" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function DoseyChat({ stats }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitedUntil, setLimitedUntil] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const goals = useQuery(api.goals.list, { date: todayKey() }) ?? [];

  // Reads the persisted "Dosey is resting" state and syncs it into local
  // state. Doubles as the entire "notify when back" mechanism: loadRateLimit
  // already returns null once resetAt has passed, so calling this on mount
  // and on every reopen is enough to silently clear a stale limit — no
  // polling/timers/push infra needed.
  function refreshLimitState(): string | null {
    const stored = loadRateLimit();
    setLimitedUntil(stored?.resetAt ?? null);
    return stored?.resetAt ?? null;
  }

  // Keep the transcript pinned to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshLimitState();
  }, []);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshLimitState();
      inputRef.current?.focus();
    }
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    if (refreshLimitState()) return; // belt-and-suspenders; composer is already disabled

    const history: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    // Add the user turn plus an empty model placeholder we stream into.
    setMessages([...history, { role: "model", content: "" }]);
    setInput("");
    setError(null);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: trimHistory(history),
          stats,
          goals: goals.map((g) => ({ id: g._id, text: g.text, done: g.done, createdAt: g.createdAt })),
        }),
      });

      if (!res.ok || !res.body) {
        if (res.status === 429) {
          const data = (await res.json().catch(() => null)) as ChatRateLimitError | null;
          const resetAt = data?.resetAt ?? new Date(Date.now() + 86_400_000).toISOString();
          saveRateLimit(resetAt);
          setLimitedUntil(resetAt);
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Dosey ran into a problem.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "model", content: acc };
          return next;
        });
      }

      if (!acc.trim()) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "model", content: "…(no response)" };
          return next;
        });
      }
    } catch (err) {
      // Drop the placeholder model turn and surface the error inline.
      setMessages((prev) => prev.slice(0, -1));
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Dosey" : "Ask Dosey"}
        aria-expanded={open}
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-lilac px-4 py-3 text-ink shadow-[0_8px_26px_-12px_rgba(46,36,51,.45)] hover:bg-lilac-deep hover:text-paper transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lilac-deep focus:ring-offset-2 focus:ring-offset-paper"
      >
        <motion.span
          className="flex h-7 w-7 items-center justify-center rounded-full bg-paper"
          animate={reduceMotion || open ? undefined : { y: [0, -2, 0] }}
          transition={reduceMotion || open ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <DoseyMark size={18} />
        </motion.span>
        <span className="font-serif font-medium text-sm">{open ? "Close" : "Ask Dosey"}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Dosey chat"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="fixed bottom-24 right-6 z-50 flex h-[520px] max-h-[calc(100vh-8rem)] w-[360px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-card border border-line bg-paper shadow-[0_1px_0_white_inset,0_18px_50px_-24px_rgba(46,36,51,.35)]"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
              <motion.span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-2"
                animate={!reduceMotion && isStreaming ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={
                  !reduceMotion && isStreaming
                    ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 }
                }
              >
                <DoseyMark size={22} />
              </motion.span>
              <div className="leading-tight">
                <p className="font-serif font-semibold text-sm">Dosey</p>
                <p className="text-[11px] text-ink-soft">Your study companion</p>
              </div>
            </div>

            {/* Transcript */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="pt-1">
                  <div className="mb-3 flex justify-center">
                    <motion.div
                      animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                      transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      whileHover={reduceMotion ? undefined : { scale: 1.03, rotate: -1 }}
                    >
                      <Image
                        src="/dosey-transparent.png"
                        alt="Dosey, a friendly capsule with a tomato sprout"
                        width={240}
                        height={133}
                        priority
                        className="h-auto w-[220px]"
                      />
                    </motion.div>
                  </div>
                  {limitedUntil ? (
                    <p className="text-center text-sm text-ink-soft" role="status">
                      Dosey&apos;s tapped out for today, Doc — free questions refill at{" "}
                      <b className="text-ink">{formatResetTime(limitedUntil)}</b>. Go log a dose
                      or two and I&apos;ll see you then!
                    </p>
                  ) : (
                    <>
                      <p className="text-center text-sm text-ink-soft">
                        Hi, Doc. Ask me about your progress today, or a quick study question.
                      </p>
                      <div className="mt-4 flex flex-col gap-2">
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => send(s)}
                            className="rounded-xl border border-line bg-paper-2 px-3 py-2 text-left text-sm text-ink hover:border-lilac-deep transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[80%] rounded-2xl rounded-br-sm bg-lilac px-3.5 py-2 text-sm text-ink"
                        : "max-w-[85%] rounded-2xl rounded-bl-sm bg-paper-2 px-3.5 py-2 text-sm text-ink whitespace-pre-wrap"
                    }
                  >
                    {m.content || (
                      <span className="inline-flex gap-1 text-ink-soft" aria-label="Dosey is typing">
                        <span className="animate-pulse">●</span>
                        <span className="animate-pulse [animation-delay:150ms]">●</span>
                        <span className="animate-pulse [animation-delay:300ms]">●</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {limitedUntil && messages.length > 0 && (
                <p className="rounded-xl bg-lilac/25 px-3 py-2 text-sm text-ink" role="status">
                  Dosey&apos;s tapped out for today, Doc — free questions refill at{" "}
                  <b>{formatResetTime(limitedUntil)}</b>.
                </p>
              )}

              {error && (
                <p className="rounded-xl bg-clay/25 px-3 py-2 text-sm text-ink" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-line p-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  maxLength={4000}
                  disabled={isStreaming || !!limitedUntil}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send(input)}
                  placeholder={limitedUntil ? "Dosey's resting…" : "Ask Dosey…"}
                  className="flex-1 rounded-xl border border-line bg-paper-2 px-3.5 py-2.5 text-sm placeholder:text-ink-soft focus:border-lilac-deep focus:ring-2 focus:ring-lilac/30 outline-none transition-all disabled:opacity-60"
                />
                <button
                  onClick={() => send(input)}
                  disabled={isStreaming || !!limitedUntil || !input.trim()}
                  aria-label="Send message"
                  className="flex-none rounded-xl bg-lilac px-4 text-ink font-medium hover:bg-lilac-deep hover:text-paper transition-colors duration-200 disabled:opacity-40 disabled:hover:bg-lilac disabled:hover:text-ink"
                >
                  ↑
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-ink-soft">
                Dosey is a study aid, not clinical advice — verify against official sources.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
