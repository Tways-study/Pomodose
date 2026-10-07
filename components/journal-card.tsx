"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { QuoteCard } from "@/components/quote-card";
import { useAddressTerm } from "@/components/address-term-provider";
import { todayKey } from "@/lib/date";
import { MAX_JOURNAL_TEXT_LENGTH, previewLine } from "@/lib/journal";

const AUTOSAVE_MS = 800;
const COUNTER_FROM = MAX_JOURNAL_TEXT_LENGTH - 200;

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface Props {
  /** Forwarded to the quote prompt: increment when a session completes. */
  advanceSignal?: number;
  /** Forwarded to the quote prompt: pause idle cycling while the timer runs. */
  paused?: boolean;
}

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function JournalCard({ advanceSignal = 0, paused = false }: Props) {
  const name = useAddressTerm();
  const { isAuthenticated } = useConvexAuth();
  const date = todayKey();
  // Skip while signed out so sign-out doesn't make the server throw mid-render.
  const entry = useQuery(api.journal.getForDate, isAuthenticated ? { date } : "skip");
  const recent = useQuery(api.journal.listRecent, isAuthenticated ? { limit: 14 } : "skip");
  const save = useMutation(api.journal.save);

  // `draft` stays null until the first keystroke; after that it owns the text, so a
  // slow or late write can never clobber what's being typed.
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const loading = isAuthenticated && entry === undefined;
  const value = draft ?? entry?.text ?? "";

  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<string | null>(null);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(async () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const text = pendingRef.current;
    if (text === null) return;
    pendingRef.current = null;
    setStatus("saving");
    try {
      await saveRef.current({ date: todayKey(), text });
      setStatus("saved");
    } catch (err) {
      console.error("Journal save failed", err);
      setStatus("error");
    }
  }, []);

  // Don't lose a pending edit if the card unmounts (e.g. sign-out).
  useEffect(() => {
    return () => {
      if (pendingRef.current !== null) {
        void saveRef.current({ date: todayKey(), text: pendingRef.current }).catch((err) => {
          console.error("Journal save failed", err);
        });
      }
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  function onChange(text: string) {
    setDraft(text);
    setStatus("idle");
    pendingRef.current = text;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void flush(), AUTOSAVE_MS);
  }

  const pastEntries = (recent ?? []).filter((e) => e.date !== date);

  return (
    <div className="space-y-4">
      <QuoteCard advanceSignal={advanceSignal} paused={paused} />

      <div>
        <label htmlFor="journal-entry" className="sr-only">
          Today&apos;s journal entry
        </label>
        {loading ? (
          <div className="h-[132px] animate-pulse rounded-control bg-surface-2" aria-hidden />
        ) : (
          <textarea
            id="journal-entry"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => void flush()}
            maxLength={MAX_JOURNAL_TEXT_LENGTH}
            rows={5}
            placeholder={`How did today's dose go, ${name}?`}
            className="min-h-[132px] w-full resize-y rounded-control border-2 border-line-strong bg-surface-2 px-4 py-3 font-body text-base text-ink placeholder:text-ink-soft focus:border-ink focus:outline-none focus:ring-4 focus:ring-gum-lilac/60"
          />
        )}
        <div className="mt-1.5 flex items-center justify-between font-body text-sm text-ink-soft">
          <span role="status" aria-live="polite">
            {status === "saving" && "Saving…"}
            {status === "saved" && "Saved"}
          </span>
          {value.length >= COUNTER_FROM && (
            <span className="digits">
              {value.length}/{MAX_JOURNAL_TEXT_LENGTH}
            </span>
          )}
        </div>
        {status === "error" && (
          <p
            role="alert"
            className="mt-2 rounded-control border-2 border-alert px-3 py-2 font-body text-sm text-alert"
          >
            Couldn&apos;t save that, {name} — your note is still here. Try again.
          </p>
        )}
      </div>

      {pastEntries.length > 0 && (
        <details className="group rounded-control bg-surface-2 px-4 py-3">
          <summary className="cursor-pointer font-display text-base font-semibold text-ink">
            Past entries
          </summary>
          <ul className="mt-3 space-y-2">
            {pastEntries.map((e) => (
              <li key={e._id}>
                <details className="rounded-control bg-surface px-3 py-2">
                  <summary className="cursor-pointer font-body text-sm text-ink">
                    <span className="font-semibold">{formatDay(e.date)}</span>
                    <span className="text-ink-soft"> · {previewLine(e.text)}</span>
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap font-body text-base text-ink">{e.text}</p>
                </details>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
