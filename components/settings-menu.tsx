"use client";

import { CircleHelp, Settings } from "lucide-react";
import { ChimeVolume } from "@/components/chime-volume";
import { HeaderPopover } from "@/components/header-popover";
import { OsNotificationToggle } from "@/components/os-notification-toggle";

interface Props {
  onOpenHelp: () => void;
}

/** The gear: every preference (chime, notifications) plus Help, in one panel. */
export function SettingsMenu({ onOpenHelp }: Props) {
  return (
    <HeaderPopover
      label="Settings"
      triggerLabel="Settings"
      trigger={<Settings size={20} strokeWidth={2.25} aria-hidden />}
      triggerClassName="flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill bg-surface text-ink shadow-soft transition-colors duration-150 hover:bg-surface-2"
    >
      {({ close }) => (
        <div className="flex flex-col gap-3">
          <p className="font-display text-lg font-semibold">Settings</p>
          <ChimeVolume />
          <OsNotificationToggle />
          <button
            type="button"
            onClick={() => {
              // close() puts focus back on the gear first, so the help dialog
              // remembers it and hands focus back there when it closes.
              close();
              onOpenHelp();
            }}
            className="flex min-h-[48px] w-full cursor-pointer items-center gap-2 rounded-pill bg-surface-2 px-4 font-display text-sm font-medium text-ink transition-colors duration-150 hover:bg-gum-lilac/40"
          >
            <CircleHelp size={18} strokeWidth={2.25} aria-hidden />
            Help and tips
          </button>
        </div>
      )}
    </HeaderPopover>
  );
}
