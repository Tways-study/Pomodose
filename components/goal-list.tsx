"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { CircleAlert, Plus, Undo2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GoalItem } from "./goal-item";
import { useAddressTerm } from "@/components/address-term-provider";
import { api } from "@/convex/_generated/api";
import { todayKey } from "@/lib/date";
import { GOAL_EXAMPLES } from "@/lib/goal-examples";
import { EASE_OUT, SPRING_BOUNCY } from "@/lib/motion";
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
    <div>
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
          aria-label="Study goal"
          placeholder="e.g. Review ch.4 kinetics"
          className="min-w-0 flex-1 min-h-[48px] bg-surface-2 border-2 border-line-strong rounded-control px-4 py-3 text-base font-body text-ink placeholder:text-ink-soft focus:border-ink focus:ring-4 focus:ring-gum-lilac/60 outline-none transition-[border-color,box-shadow]"
        />
        <motion.button
          type="button"
          onClick={() => void add()}
          disabled={adding}
          aria-label="Add goal"
          whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
          transition={SPRING_BOUNCY}
          className="flex h-12 w-12 flex-none cursor-pointer items-center justify-center rounded-pill bg-ink text-surface shadow-pop transition-transform [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Plus size={20} strokeWidth={2.25} aria-hidden />
        </motion.button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex items-start gap-2 rounded-control border-2 border-alert bg-surface px-3 py-2 text-sm text-alert"
            role="alert"
          >
            <CircleAlert size={16} strokeWidth={2.25} className="mt-0.5 flex-none" aria-hidden />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Undo strip: a rose sticker, not a toast. */}
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
            className="mb-4 flex items-center justify-between gap-4 rounded-bubble bg-gum-rose px-4 py-2.5 text-ink shadow-gum"
          >
            <div className="min-w-0">
              <span className="block font-display text-sm font-semibold">Removed</span>
              <p className="font-body text-sm">Goal set aside, {name}.</p>
            </div>
            <motion.button
              type="button"
              onClick={undo}
              whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
              transition={SPRING_BOUNCY}
              className="flex min-h-[44px] flex-none cursor-pointer items-center gap-1.5 rounded-pill bg-surface px-4 font-display text-sm font-medium text-ink shadow-gum transition-colors duration-150 hover:bg-surface-2"
            >
              <Undo2 size={16} strokeWidth={2.25} aria-hidden />
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
              className="flex min-h-[56px] items-center gap-3 rounded-control bg-surface-2 px-3 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-7 w-7 flex-none rounded-pill bg-line-soft" />
              <div className="h-2.5 rounded-pill bg-line-soft" style={{ width: `${w}%` }} />
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
        <div className="py-4 text-center">
          <p className="font-display text-base font-semibold text-ink">Nothing on the list yet</p>
          <p className="mt-1 font-body text-sm text-ink-soft">
            Add a goal above, or start with an example.
          </p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2" aria-label="Example goals">
            {GOAL_EXAMPLES.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => {
                    setInput(example);
                    inputRef.current?.focus();
                  }}
                  className="flex min-h-[48px] cursor-pointer items-center gap-1.5 rounded-pill bg-surface-2 px-4 font-display text-sm font-medium text-ink shadow-gum transition-colors hover:bg-gum-lilac/40"
                >
                  <Plus size={16} strokeWidth={2.25} aria-hidden />
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Goal tally lives here, at the foot of the card */}
      <div className="mt-5">
        <p className="font-display text-sm font-medium text-ink">
          {doneCount} of {totalCount} done
        </p>
        <div
          className="mt-2 h-3 overflow-hidden rounded-pill bg-surface-2"
          role="progressbar"
          aria-label="Goals done"
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-valuenow={doneCount}
        >
          <motion.div
            className="h-full w-full origin-left rounded-pill bg-gum-mint"
            initial={false}
            animate={{ scaleX: totalCount > 0 ? doneCount / totalCount : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE_OUT }}
          />
        </div>
      </div>
    </div>
  );
}
