"use client";
import { DoseJarSlot } from "@/components/three/scenes";
import { SETTINGS } from "@/lib/settings";
import type { Phase } from "@/types";

interface Props {
  cyclePosition: number;   // 0–3 (focus sessions completed in current cycle)
  dailyDoses: number;
  phase: Phase;
  isRunning: boolean;
  isFocusRunning: boolean;
}

interface Segment {
  kind: "focus" | "short" | "long";
  grow: number;
  // Index of the focus session this segment belongs to (focus) or follows (breaks).
  index: number;
}

// Segments sized by true duration so the strip reads as a real timeline.
const SEGMENTS: Segment[] = Array.from({ length: SETTINGS.CYCLE_LENGTH }, (_, i): Segment[] => {
  const last = i === SETTINGS.CYCLE_LENGTH - 1;
  return [
    { kind: "focus", grow: SETTINGS.FOCUS_DURATION / 60, index: i },
    last
      ? { kind: "long", grow: SETTINGS.LONG_BREAK / 60, index: i }
      : { kind: "short", grow: SETTINGS.SHORT_BREAK / 60, index: i },
  ];
}).flat();

export function RegimenProgress({
  cyclePosition, dailyDoses, phase, isRunning, isFocusRunning,
}: Props) {
  return (
    <div>
      {/* Cycle strip: widths are the real durations */}
      <div className="flex h-9 gap-1.5" role="img" aria-label={`${cyclePosition} of ${SETTINGS.CYCLE_LENGTH} doses toward the antidote`}>
        {SEGMENTS.map((seg) => {
          const isFocus = seg.kind === "focus";
          const done = isFocus && seg.index < cyclePosition;
          const current = isFocus && isFocusRunning && seg.index === cyclePosition;
          const currentBreak =
            !isFocus && isRunning && phase === seg.kind && seg.index === (cyclePosition === 0 ? SETTINGS.CYCLE_LENGTH - 1 : cyclePosition - 1);
          const breakColor = seg.kind === "long" ? "bg-gum-apricot" : "bg-gum-mint";
          return (
            <div
              key={`${seg.kind}-${seg.index}`}
              style={{ flexGrow: seg.grow, flexBasis: 0 }}
              className={[
                "min-w-0 rounded-pill transition-[background-color,box-shadow] duration-200",
                isFocus
                  ? done ? "bg-gum-sky" : "bg-surface-2"
                  : breakColor,
                current || currentBreak ? "ring-4 ring-ink/15" : "",
              ].join(" ")}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-end gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap justify-between gap-x-4 gap-y-1 font-body text-sm text-ink-soft">
          <span>{cyclePosition} of {SETTINGS.CYCLE_LENGTH} doses to your antidote</span>
          <span>{dailyDoses} doses today</span>
        </div>
        <DoseJarSlot dailyDoses={dailyDoses} />
      </div>
    </div>
  );
}
