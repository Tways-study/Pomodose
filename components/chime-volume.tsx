"use client";
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
    <div className="flex items-center gap-3 bg-paper-2/70 border border-line rounded-full px-4 py-2">
      <span className="font-serif italic text-xs text-ink-soft/80 select-none shrink-0">Chime</span>

      <button
        onClick={toggleMute}
        aria-label={muted ? "Unmute chime" : "Mute chime"}
        className="text-ink-soft hover:text-ink transition-colors duration-150 shrink-0"
      >
        {muted ? <BellOffIcon /> : <BellIcon />}
      </button>

      <div className="flex flex-col gap-1">
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
        {/* Tick marks echoing the graduated cylinder's measurement lines */}
        <div className="flex justify-between" style={{ width: 140, paddingInline: 5 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="w-px h-1 bg-ink-soft/30" />
          ))}
        </div>
      </div>

      <button
        onClick={playPickupBell}
        aria-label="Preview chime"
        className="font-serif italic text-xs text-ink-soft hover:text-ink transition-colors duration-150 select-none shrink-0"
      >
        ring
      </button>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BellOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18.63 13A17.9 17.9 0 0 1 18 8" />
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <path d="M18 8a6 6 0 0 0-9.33-5" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
