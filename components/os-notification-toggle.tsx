"use client";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { getPermission, isEnabled, isSupported, requestPermission, setEnabled } from "@/lib/os-notification";

/**
 * Settings-panel row for opting into OS-level completion notifications, styled
 * to match <ChimeVolume /> above it.
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
      className="flex min-h-[48px] w-full cursor-pointer items-center gap-2 rounded-pill bg-surface-2 px-4 text-ink transition-colors duration-150 hover:bg-gum-lilac/40"
    >
      {enabled ? <Bell size={18} strokeWidth={2.25} aria-hidden /> : <BellOff size={18} strokeWidth={2.25} aria-hidden />}
      <span className="font-display text-sm font-medium text-ink">Notify</span>
      <span
        className={`ml-auto rounded-pill px-2.5 py-0.5 font-display text-xs font-medium text-ink ${
          enabled ? "bg-gum-mint" : "bg-surface"
        }`}
      >
        {enabled ? "On" : "Off"}
      </span>
    </button>
  );
}
