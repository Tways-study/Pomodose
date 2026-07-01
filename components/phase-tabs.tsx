"use client";
import type { Phase } from "@/types";

const PHASES: { id: Phase; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "short", label: "Short break" },
  { id: "long",  label: "Long break" },
];

interface Props {
  active: Phase;
  onChange: (phase: Phase) => void;
}

export function PhaseTabs({ active, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Session type"
      className="inline-flex bg-paper-2 border border-line rounded-full p-1 gap-0.5"
    >
      {PHASES.map(({ id, label }) => (
        <button
          key={id}
          aria-pressed={active === id}
          onClick={() => onChange(id)}
          className={[
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            active === id
              ? "bg-paper text-ink shadow-sm"
              : "text-ink-soft hover:text-ink",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
