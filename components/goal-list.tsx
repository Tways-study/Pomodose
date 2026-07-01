"use client";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { GoalItem } from "./goal-item";
import { loadGoals, saveGoals } from "@/lib/storage";
import type { Goal } from "@/types";

interface Props {
  onProgressChange?: (done: number, total: number) => void;
}

export function GoalList({ onProgressChange }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage on mount (client only). This must run after mount:
  // the server has no localStorage, so a lazy initializer would cause a hydration
  // mismatch. Reading persisted state here is the intended pattern.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGoals(loadGoals());
  }, []);

  // Persist + notify parent on every change
  const update = useCallback((next: Goal[]) => {
    setGoals(next);
    saveGoals(next);
    onProgressChange?.(next.filter(g => g.done).length, next.length);
  }, [onProgressChange]);

  function add() {
    const text = input.trim();
    if (!text || text.length > 80) return;
    const goal: Goal = {
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: Date.now(),
    };
    update([...goals, goal]);
    setInput("");
    inputRef.current?.focus();
  }

  function toggle(id: string) {
    update(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  }

  function remove(id: string) {
    update(goals.filter(g => g.id !== id));
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
          className="flex-1 bg-paper-2 border border-line rounded-xl px-3.5 py-2.5 text-sm placeholder:text-ink-soft focus:border-lilac-deep focus:ring-2 focus:ring-lilac/30 outline-none transition-all"
        />
        <button
          onClick={add}
          aria-label="Add goal"
          className="flex-none w-10 rounded-xl bg-lilac text-ink text-xl font-medium hover:bg-lilac-deep hover:text-paper transition-colors duration-200"
        >
          +
        </button>
      </div>

      {/* List */}
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {goals.map(g => (
            <GoalItem key={g.id} goal={g} onToggle={toggle} onDelete={remove} />
          ))}
        </AnimatePresence>
      </ul>

      {goals.length === 0 && (
        <p className="text-center text-sm italic text-ink-soft py-4">
          No goals prescribed yet. Add one above.
        </p>
      )}
    </section>
  );
}
