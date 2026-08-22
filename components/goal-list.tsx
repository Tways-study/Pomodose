"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GoalItem } from "./goal-item";
import { api } from "@/convex/_generated/api";
import { todayKey } from "@/lib/date";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  onProgressChange?: (done: number, total: number) => void;
}

export function GoalList({ onProgressChange }: Props) {
  const reduceMotion = useReducedMotion();
  const { isAuthenticated } = useConvexAuth();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const date = todayKey();

  // Skip while unauthenticated (including the moment sign-out clears the
  // token but this component hasn't unmounted yet) — otherwise this reactive
  // query re-fires, the server throws "Not authenticated", and Convex's
  // useQuery re-throws that during render, crashing into the error boundary.
  const goalsResult = useQuery(api.goals.list, isAuthenticated ? { date } : "skip");
  const isLoading = goalsResult === undefined;
  const goals = useMemo(() => goalsResult ?? [], [goalsResult]);
  const addGoal = useMutation(api.goals.add);
  const toggleGoal = useMutation(api.goals.toggle);
  const removeGoal = useMutation(api.goals.remove);

  const doneCount = useMemo(() => goals.filter((g) => g.done).length, [goals]);
  const totalCount = goals.length;

  // Report aggregate progress up to the parent whenever the live query updates.
  useEffect(() => {
    onProgressChange?.(doneCount, totalCount);
  }, [doneCount, totalCount, onProgressChange]);

  function add() {
    const text = input.trim();
    if (!text || text.length > 80) return;
    void addGoal({ text, date });
    setInput("");
    inputRef.current?.focus();
  }

  function toggle(id: string) {
    void toggleGoal({ id: id as Id<"goals"> });
  }

  function remove(id: string) {
    void removeGoal({ id: id as Id<"goals"> });
  }

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
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="e.g. Review pharmacokinetics ch.4"
          className="flex-1 bg-paper-2 border border-line-strong rounded-xl px-3.5 py-2.5 text-sm placeholder:text-ink-soft focus:border-lilac-deep focus:ring-2 focus:ring-lilac/30 outline-none transition-[border-color,box-shadow]"
        />
        <motion.button
          onClick={add}
          aria-label="Add goal"
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className="flex-none w-10 rounded-xl bg-lilac text-ink text-xl font-medium hover:bg-lilac-deep hover:text-paper transition-colors duration-200"
        >
          +
        </motion.button>
      </div>

      {/* List */}
      <ul className="flex flex-col gap-2">
        {isLoading ? (
          [58, 75, 42].map((w, i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-3.5 py-3 bg-paper-2 border border-line rounded-xl animate-pulse"
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
