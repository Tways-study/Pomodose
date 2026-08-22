"use client";
import { useEffect, useState } from "react";
import { getPermission, isEnabled, isSupported, requestPermission, setEnabled } from "@/lib/os-notification";

/**
 * Footer control for opting into OS-level completion notifications, sized
 * and weighted to sit beside <ChimeVolume /> without outcompeting it.
 * Renders nothing when the browser has no Notification API at all.
 */
export function OsNotificationToggle() {
  // Deterministic default (unsupported/off) so server and first client
  // render agree; the real state is read after mount, same pattern as
  // components/address-term-provider.tsx.
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(isSupported());
    setEnabledState(isEnabled());
  }, []);

  async function toggle() {
    if (enabled) {
      setEnabled(false);
      setEnabledState(false);
      return;
    }
    const permission = getPermission() === "granted" ? "granted" : await requestPermission();
    if (permission === "granted") {
      setEnabled(true);
      setEnabledState(true);
    }
  }

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      aria-pressed={enabled}
      className={`flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs transition-colors duration-150 ${
        enabled ? "bg-lilac/25 text-ink" : "bg-paper-2/70 text-ink-soft hover:text-ink"
      }`}
    >
      <span className="font-serif italic">Notify</span>
      <span>{enabled ? "On" : "Off"}</span>
    </button>
  );
}
