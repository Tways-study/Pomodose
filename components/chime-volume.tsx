"use client";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getChimeVolume, playPickupBell, setChimeVolume } from "@/lib/chime";

export function ChimeVolume() {
  // Start at default; sync from localStorage after mount to avoid SSR mismatch.
  const [volume, setVolume] = useState(0.7);
  const prevVolumeRef = useRef(0.7);

  useEffect(() => {
    const stored = getChimeVolume();
    // Intentional: syncs from localStorage after mount to avoid SSR mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVolume(stored);
    if (stored > 0) prevVolumeRef.current = stored;
  }, []);

  function handleChange(v: number) {
    if (v > 0) prevVolumeRef.current = v;
    setVolume(v);
    setChimeVolume(v);
  }

  function toggleMute() {
    if (volume === 0) {
      handleChange(prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.7);
    } else {
      prevVolumeRef.current = volume;
      handleChange(0);
    }
  }

  const muted = volume === 0;

  return (
    <div className="flex min-h-[48px] w-full items-center gap-2 rounded-pill bg-surface px-4 text-ink shadow-soft sm:w-auto sm:gap-3">
      <span className="shrink-0 select-none font-display text-sm font-medium text-ink">Chime</span>

      <button
        onClick={toggleMute}
        aria-label={muted ? "Unmute chime" : "Mute chime"}
        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center text-ink transition-colors duration-150 hover:text-ink-soft"
      >
        {muted ? <VolumeX size={18} strokeWidth={2.25} aria-hidden /> : <Volume2 size={18} strokeWidth={2.25} aria-hidden />}
      </button>

      {/* Fluid on phones (never wider than the chip), 140px from sm up. The input is
          44px tall for touch; the 6px track is drawn on its track pseudo-element. */}
      <div className="relative min-w-[72px] flex-1 sm:w-[140px] sm:flex-none">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={e => handleChange(Number(e.target.value))}
          aria-label="Chime volume"
          className="chime-slider"
          style={{ "--fill": `${Math.round(volume * 100)}%` } as React.CSSProperties}
        />
        {/* Tick marks echoing the graduated cylinder's measurement lines; inset by
            the thumb radius so they line up with 0, 25, 50, 75 and 100%. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-3 top-[calc(50%+7px)] flex justify-between">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-1 w-px bg-ink-soft/40" />
          ))}
        </div>
      </div>

      <button
        onClick={playPickupBell}
        aria-label="Preview chime"
        className="min-h-[44px] min-w-[44px] shrink-0 cursor-pointer select-none rounded-pill px-2 font-display text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-2"
      >
        Ring
      </button>
    </div>
  );
}
