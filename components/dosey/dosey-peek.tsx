"use client";

import { DoseyRig } from "@/components/dosey/dosey-rig";
import type { DoseyMood } from "@/lib/dosey-mood";

/**
 * Decorative head-only Dosey that peeks over the top edge of a card. Fills an
 * absolutely-positioned slot (120x96) that sits directly above the card.
 */
export function DoseyPeek({ mood }: { mood: DoseyMood }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-end justify-center"
    >
      <DoseyRig variant="peek" size={120} mood={mood} trackPointer />
    </div>
  );
}
