"use client";

import { useEffect, useState } from "react";
import { useLatestNotification } from "@/components/notification-provider";
import { doseyMoodFor, type DoseyMood } from "@/lib/dosey-mood";
import type { NotificationEvent, Phase, TimerStatus } from "@/types";

const PROUD_MS = 4000;

const COMPLETION_EVENTS: readonly NotificationEvent[] = [
  "focus-complete",
  "short-complete",
  "long-complete",
  "cycle-complete",
];

export function useDoseyMood(phase: Phase, status: TimerStatus): DoseyMood {
  const latest = useLatestNotification();
  const [expiredId, setExpiredId] = useState<number | null>(null);

  const latestId = latest?.id ?? null;
  const isCompletion = latest !== null && COMPLETION_EVENTS.includes(latest.event);
  const justCompleted = isCompletion && latestId !== expiredId;

  useEffect(() => {
    if (latestId === null || !isCompletion) return;
    const timeout = window.setTimeout(() => setExpiredId(latestId), PROUD_MS);
    return () => window.clearTimeout(timeout);
  }, [latestId, isCompletion]);

  return doseyMoodFor({ phase, status, justCompleted });
}
