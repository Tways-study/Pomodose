"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useConvexAuth, useQuery } from "convex/react";
import { DoseyRig } from "@/components/dosey/dosey-rig";
import type { DoseyMood } from "@/lib/dosey-mood";
import { ArrowUp, ArrowUpRight, CircleAlert, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { trimHistory } from "@/lib/chat-history";
import { loadRateLimit, saveRateLimit } from "@/lib/rate-limit-storage";
import { renderChatText } from "@/lib/render-chat-text";
import { todayKey } from "@/lib/date";
import { api } from "@/convex/_generated/api";
import { useAddressTerm } from "@/components/address-term-provider";
import { useLatestNotification } from "@/components/notification-provider";
import { EASE_OUT, SPRING_BOUNCY, SPRING_SOFT } from "@/lib/motion";
import type { ChatMessage, ChatRateLimitError, DoseyStats } from "@/types";

interface Props {
  stats: DoseyStats;
  /** Controlled open state. When omitted the chat manages its own. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Mood of the mascot marks; the chat itself does not know timer state. */
  mood?: DoseyMood;
}

const SUGGESTIONS = [
  "Quiz me on drug classes",
  "Explain first-order kinetics simply",
  "Walk me through a dosage calculation",
  "Plan my study blocks for today",
];

function formatResetTime(resetAt: string): string {
  return new Date(resetAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function DoseyChat({ stats, open: openProp, onOpenChange, mood = "relaxed" }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const value = typeof next === "function" ? next(open) : next;
      if (openProp === undefined) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [open, openProp, onOpenChange],
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitedUntil, setLimitedUntil] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const name = useAddressTerm();
  const { isAuthenticated } = useConvexAuth();
  const latestNotification = useLatestNotification();

  const [isPhone, setIsPhone] = useState(false);
  // The mascot only bobs briefly (on load, and when a new note arrives) to draw
  // the eye once — a permanent idle loop is peripheral noise on a page that
  // stays open for hours.
  const [attention, setAttention] = useState(true);

  const fabRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const appendedNotificationIdRef = useRef<number | null>(null);
  // Skip while unauthenticated (including the moment sign-out clears the
  // token but this component hasn't unmounted yet) — otherwise this reactive
  // query re-fires, the server throws "Not authenticated", and Convex's
  // useQuery re-throws that during render, crashing into the error boundary.
  const goals = useQuery(api.goals.list, isAuthenticated ? { date: todayKey() } : "skip") ?? [];

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

  // Escape closes the panel and hands focus back to the trigger.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      fabRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  // Phones get a bottom sheet (layout is in the panel's classes; this only
  // picks the matching entrance motion).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const notificationId = latestNotification?.id;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttention(true);
    const timer = window.setTimeout(() => setAttention(false), 6000);
    return () => window.clearTimeout(timer);
  }, [notificationId]);

  // Surfaces themed notifications (timer completions, break nudges, burnout
  // alerts, milestones) as a Dosey chat line. Skipped while a response is
  // streaming — appending here would otherwise clobber the in-flight
  // assistant message the streaming loop above is still writing into the
  // last array slot. If a notification lands mid-stream it isn't lost: this
  // effect re-runs (and appends) the moment isStreaming flips back to false.
  useEffect(() => {
    if (!latestNotification || isStreaming) return;
    if (appendedNotificationIdRef.current === latestNotification.id) return;
    appendedNotificationIdRef.current = latestNotification.id;
    setMessages((prev) => [...prev, { role: "model", content: latestNotification.variant.note }]);
  }, [latestNotification, isStreaming]);

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
        ref={fabRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Dosey" : "Ask Dosey"}
        aria-expanded={open}
        whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
        transition={SPRING_BOUNCY}
        className={`fixed bottom-6 right-6 z-modal flex min-h-[44px] cursor-pointer items-center gap-2 rounded-pill bg-gum-lilac py-2 pl-2 pr-4 text-ink shadow-pop transition-opacity duration-200${
          open ? " max-sm:pointer-events-none max-sm:opacity-0" : ""
        }`}
      >
        <motion.span
          className="flex h-8 w-8 items-center justify-center"
          animate={reduceMotion || open || !attention ? { y: 0 } : { y: [0, -2, 0] }}
          transition={reduceMotion || open || !attention ? { duration: 0.2 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <DoseyRig mood={mood} size={28} />
        </motion.span>
        <span className="font-display text-base font-semibold">{open ? "Close" : "Ask Dosey"}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Dosey chat"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : isPhone
                  ? { opacity: 0, y: 32 }
                  : { opacity: 0, y: 16, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : isPhone
                  ? { opacity: 0, y: 24, transition: { duration: 0.18, ease: EASE_OUT } }
                  : { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.18, ease: EASE_OUT } }
            }
            transition={reduceMotion ? { duration: 0.2 } : SPRING_SOFT}
            style={{ originX: 1, originY: 1 }}
            className="fixed inset-x-0 bottom-0 z-modal flex h-[min(80dvh,560px)] flex-col overflow-hidden rounded-t-bubble border border-line-soft bg-surface pb-[env(safe-area-inset-bottom)] text-ink shadow-soft sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[520px] sm:max-h-[calc(100dvh-8rem)] sm:w-[360px] sm:rounded-bubble sm:pb-0"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-line-soft px-4 py-3">
              <motion.span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gum-lilac"
                animate={!reduceMotion && isStreaming ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={
                  !reduceMotion && isStreaming
                    ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 }
                }
              >
                <DoseyRig mood={mood} size={36} thinking={isStreaming} />
              </motion.span>
              <div className="flex-1 leading-tight">
                <p className="font-display text-lg font-semibold">Dosey</p>
                <p className="font-body text-sm text-ink-soft">Your study companion</p>
              </div>
              <motion.button
                onClick={() => {
                  setOpen(false);
                  fabRef.current?.focus();
                }}
                aria-label="Close Dosey"
                whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
                transition={SPRING_BOUNCY}
                className="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill text-ink-soft transition-colors duration-150 hover:bg-surface-2 hover:text-ink sm:hidden"
              >
                <X size={20} strokeWidth={2.25} aria-hidden />
              </motion.button>
            </div>

            {/* Transcript */}
            <div
              ref={scrollRef}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.length === 0 && (
                <div className="pt-1">
                  <div className="mb-3 flex justify-center">
                    <motion.div
                      className="flex h-24 w-24 items-center justify-center rounded-full bg-gum-lilac"
                      animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                      transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <DoseyRig mood={mood} size={72} />
                    </motion.div>
                  </div>
                  {limitedUntil ? (
                    <p className="text-center font-body text-sm text-ink-soft" role="status">
                      Dosey&apos;s tapped out for today, {name} — free questions refill at{" "}
                      <b className="text-ink">{formatResetTime(limitedUntil)}</b>. Go log a dose
                      or two and I&apos;ll see you then!
                    </p>
                  ) : (
                    <>
                      <p className="text-center font-body text-sm text-ink-soft">
                        Hi, {name}. Ask about today&apos;s progress, or get help with a study topic.
                      </p>
                      <div className="mt-4 flex flex-col gap-2">
                        {SUGGESTIONS.map((s) => (
                          <motion.button
                            key={s}
                            onClick={() => send(s)}
                            whileTap={{ scale: reduceMotion ? 1 : 0.96 }}
                            transition={SPRING_BOUNCY}
                            className="flex min-h-[44px] cursor-pointer items-center justify-between gap-2 rounded-pill bg-surface-2 px-4 py-2 text-left font-display text-sm font-medium text-ink shadow-gum transition-colors hover:bg-gum-lilac/40"
                          >
                            <span>{s}</span>
                            <ArrowUpRight size={16} strokeWidth={2.25} aria-hidden className="flex-none" />
                          </motion.button>
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
                        ? "max-w-[80%] rounded-bubble rounded-br-control bg-gum-lilac px-4 py-2.5 font-body text-sm text-ink"
                        : "max-w-[85%] rounded-bubble rounded-bl-control bg-surface-2 px-4 py-2.5 font-body text-sm text-ink"
                    }
                  >
                    {m.role === "model" && m.content ? renderChatText(m.content) : m.content || (reduceMotion ? (
                      <span className="text-ink-soft">Dosey is typing…</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 py-1" role="img" aria-label="Dosey is typing">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-ink-soft" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-ink-soft [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-ink-soft [animation-delay:300ms]" />
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {limitedUntil && messages.length > 0 && (
                <p className="rounded-control bg-gum-butter px-3.5 py-2.5 font-body text-sm text-ink" role="status">
                  Dosey&apos;s tapped out for today, {name} — free questions refill at{" "}
                  <b>{formatResetTime(limitedUntil)}</b>.
                </p>
              )}

              {error && (
                <p className="flex items-start gap-2 rounded-control border-2 border-alert bg-surface px-3.5 py-2.5 font-body text-sm text-alert" role="alert">
                  <CircleAlert size={16} strokeWidth={2.25} aria-hidden className="mt-0.5 flex-none" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-line-soft p-3">
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
                  className="min-w-0 flex-1 rounded-control border-2 border-line-strong bg-surface-2 px-4 py-3 font-body text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-soft focus:border-ink focus:ring-4 focus:ring-gum-lilac/60 disabled:opacity-60 sm:text-sm"
                />
                <motion.button
                  onClick={() => send(input)}
                  whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
                  transition={SPRING_BOUNCY}
                  disabled={isStreaming || !!limitedUntil || !input.trim()}
                  aria-label="Send message"
                  className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-pill bg-ink text-surface shadow-pop disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp size={18} strokeWidth={2.25} aria-hidden />
                </motion.button>
              </div>
              <p className="mt-2 text-center font-body text-xs text-ink-soft">
                Dosey is a study aid, not clinical advice — verify against official sources.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
