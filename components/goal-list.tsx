"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GoalItem } from "./goal-item";
import { useAddressTerm } from "@/components/address-term-provider";
import { api } from "@/convex/_generated/api";
import { todayKey } from "@/lib/date";
import { EASE_OUT, SPRING_UI } from "@/lib/motion";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  onProgressChange?: (done: number, total: number) => void;
}

// How long a removed goal stays recoverable before the delete is sent.
const UNDO_WINDOW_MS = 5000;

export function GoalList({ onProgressChange }: Props) {
  const reduceMotion = useReducedMotion();
  const name = useAddressTerm();
  const { isAuthenticated } = useConvexAuth();
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [lastRemoved, setLastRemoved] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const date = todayKey();

  // Skip while unauthenticated (including the moment sign-out clears the
  // token but this component hasn't unmounted yet) — otherwise this reactive
  // query re-fires, the server throws "Not authenticated", and Convex's
  // useQuery re-throws that during render, crashing into the error boundary.
  const goalsResult = useQuery(api.goals.list, isAuthenticated ? { date } : "skip");
  const isLoading = goalsResult === undefined;
  const goals = useMemo(
    () => (goalsResult ?? []).filter((g) => !hidden.has(g._id)),
    [goalsResult, hidden],
  );
  const addGoal = useMutation(api.goals.add);
  const toggleGoal = useMutation(api.goals.toggle);
  const removeGoal = useMutation(api.goals.remove);

  const doneCount = useMemo(() => goals.filter((g) => g.done).length, [goals]);
  const totalCount = goals.length;

  // Report aggregate progress up to the parent whenever the live query updates.
  useEffect(() => {
    onProgressChange?.(doneCount, totalCount);
  }, [doneCount, totalCount, onProgressChange]);

  // Flush any still-pending deletes on unmount so a reload or sign-out inside
  // the undo window doesn't resurrect a goal the user already removed.
  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      for (const [id, timer] of pending) {
        clearTimeout(timer);
        removeGoal({ id: id as Id<"goals"> }).catch((err) => {
          console.error("Failed to flush pending goal removal", err);
        });
      }
      pending.clear();
    };
  }, [removeGoal]);

  function unhide(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function add() {
    const text = input.trim();
    if (!text || text.length > 80 || adding) return;
    setAdding(true);
    try {
      await addGoal({ text, date });
      setInput("");
      setError(null);
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to add goal", err);
      setError(`Couldn't save that, ${name} — your goal is still here. Try again.`);
    } finally {
      setAdding(false);
    }
  }

  async function toggle(id: string) {
    try {
      await toggleGoal({ id: id as Id<"goals"> });
      setError(null);
    } catch (err) {
      console.error("Failed to toggle goal", err);
      setError(`Couldn't update that goal, ${name} — try again.`);
    }
  }

  function remove(id: string) {
    setHidden((prev) => new Set(prev).add(id));
    setLastRemoved(id);
    const timer = setTimeout(async () => {
      pendingRef.current.delete(id);
      try {
        await removeGoal({ id: id as Id<"goals"> });
      } catch (err) {
        console.error("Failed to remove goal", err);
        unhide(id);
        setError(`Couldn't remove that goal, ${name} — try again.`);
      } finally {
        setLastRemoved((current) => (current === id ? null : current));
      }
    }, UNDO_WINDOW_MS);
    pendingRef.current.set(id, timer);
  }

  function undo() {
    if (!lastRemoved) return;
    const timer = pendingRef.current.get(lastRemoved);
    if (timer) clearTimeout(timer);
    pendingRef.current.delete(lastRemoved);
    unhide(lastRemoved);
    setLastRemoved(null);
  }

  const noteVariants = reduceMotion
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter: { opacity: 0, y: -8, filter: "blur(4px)" },
        center: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -8, filter: "blur(4px)" },
      };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-semibold text-lg tracking-tight">Today&apos;s regimen</h2>
        <span className="text-xs tracking-widest uppercase text-ink-soft">Goals</span>
      </div>

      {/* Input row */}
      <div className="flex gap-2 mb-4">
        <input
          ref={inputRef}
          type="text"
          maxLength={80}
          value={input}
          onChange={e => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={e => e.key === "Enter" && void add()}
          placeholder="e.g. Review pharmacokinetics ch.4"
          className="flex-1 bg-paper-2 border border-line-strong rounded-control px-3.5 py-2.5 text-base sm:text-sm placeholder:text-ink-soft focus:border-lilac-deep focus:ring-[3px] focus:ring-lilac/25 outline-none transition-[border-color,box-shadow]"
        />
        <motion.button
          onClick={() => void add()}
          disabled={adding}
          aria-label="Add goal"
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          transition={SPRING_UI}
          className="flex-none w-10 rounded-control bg-lilac text-ink text-xl font-medium hover:bg-lilac-deep hover:text-paper transition-colors duration-200 disabled:opacity-60"
        >
          +
        </motion.button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4 rounded-xl border border-clay-deep bg-clay/60 px-3 py-2 text-sm text-ink"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Undo strip — same paper-strip register as CounterNote, not a toast. */}
      <AnimatePresence>
        {lastRemoved && (
          <motion.div
            key={lastRemoved}
            variants={noteVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0.2 : 0.45, ease: EASE_OUT }}
            role="status"
            className="mb-4 flex items-center justify-between gap-4 rounded-card border border-line bg-paper-2 px-4 py-2.5"
          >
            <div className="min-w-0">
              <span className="block font-serif italic text-xs tracking-widest uppercase text-lilac-deep">
                Rx — Removed
              </span>
              <p className="font-serif italic text-sm text-ink">Goal set aside, {name}.</p>
            </div>
            <motion.button
              onClick={undo}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              transition={SPRING_UI}
              className="flex-none rounded-full px-3 py-2 text-sm font-medium text-lilac-deep hover:underline underline-offset-2"
            >
              Undo
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <ul className="flex flex-col gap-2">
        {isLoading ? (
          [58, 75, 42].map((w, i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-3.5 py-3 bg-paper-2 border border-line rounded-control animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex-none w-5 h-5 rounded-md bg-line" />
              <div className="h-2.5 rounded-full bg-line" style={{ width: `${w}%` }} />
            </li>
          ))
        ) : (
          <AnimatePresence initial={false}>
            {goals.map(g => (
              <GoalItem key={g._id} goal={{ id: g._id, text: g.text, done: g.done, createdAt: g.createdAt }} onToggle={toggle} onDelete={remove} />
            ))}
          </AnimatePresence>
        )}
      </ul>

      {!isLoading && goals.length === 0 && (
        <p className="text-center text-sm italic text-ink-soft py-4">
          No goals prescribed yet. Add one above.
        </p>
      )}
    </section>
  );
}
