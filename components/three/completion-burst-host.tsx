"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useLatestNotification } from "@/components/notification-provider";
import { SilentBoundary } from "@/components/silent-boundary";
import { toneForEvent } from "@/lib/three/burst";
import type { Tone } from "@/lib/three/palette";
import type { TimerStatus } from "@/types";
import { useThreeEnabled } from "./use-three-enabled";

// three lives only in this lazy chunk, never in the page's first-load JS.
const GelcapBurst = dynamic(() => import("./gelcap-burst"), { ssr: false });

interface ActiveBurst {
  id: number;
  tone: Tone;
}

/**
 * Listens for completion notifications and mounts a one-shot gelcap burst over the
 * vial. Renders nothing at rest. Tiny on purpose: everything heavy is lazy.
 */
export function CompletionBurstHost({ status }: { status: TimerStatus }) {
  const enabled = useThreeEnabled();
  const latest = useLatestNotification();
  const [seenId, setSeenId] = useState<number | null>(null);
  const [burst, setBurst] = useState<ActiveBurst | null>(null);

  // Warm the chunk once a session is running so the first burst is not delayed.
  useEffect(() => {
    if (enabled && status === "running") void import("./gelcap-burst");
  }, [enabled, status]);

  // A new completion notification starts a burst (derived during render, not in an effect).
  if (latest && latest.id !== seenId) {
    setSeenId(latest.id);
    const tone = toneForEvent(latest.event);
    if (tone && enabled && !document.hidden) setBurst({ id: latest.id, tone });
  }

  const handleDone = useCallback(() => setBurst(null), []);

  if (!burst) return null;
  return (
    <SilentBoundary key={burst.id} fallback={null}>
      <GelcapBurst tone={burst.tone} onDone={handleDone} />
    </SilentBoundary>
  );
}
