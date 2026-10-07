"use client";

import { useRef, useState } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { useAddressTerm } from "@/components/address-term-provider";
import { DoseyRig } from "@/components/dosey/dosey-rig";
import { useDoseyMood } from "@/components/dosey/use-dosey-mood";
import { DoseyDioramaSlot } from "@/components/three/scenes";
import { ADDRESS_TOKEN } from "@/lib/address-terms";
import { DIZZY_LINE, MOOD_LINES, POKE_LINES, nextPokeLine } from "@/lib/dosey-lines";
import { gsap, useGSAP, withMotion } from "@/lib/gsap";
import type { Phase, TimerStatus } from "@/types";

interface MeetDoseyProps {
  phase: Phase;
  status: TimerStatus;
  onAskDosey: () => void;
}

export function MeetDosey({ phase, status, onAskDosey }: MeetDoseyProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const name = useAddressTerm();
  const mood = useDoseyMood(phase, status);
  const [pokeIndex, setPokeIndex] = useState(-1);
  const [dizzy, setDizzy] = useState(false);

  const line = dizzy
    ? DIZZY_LINE
    : pokeIndex >= 0
      ? POKE_LINES[pokeIndex].replaceAll(ADDRESS_TOKEN, name)
      : MOOD_LINES[mood];

  const handlePoke = (isDizzy: boolean) => {
    setDizzy(isDizzy);
    if (!isDizzy) setPokeIndex((prev) => nextPokeLine(prev));
  };

  useGSAP(
    () => {
      const mm = withMotion(() => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            end: "top 35%",
            scrub: 0.6,
          },
        });
        tl.from('[data-dosey="body"]', { y: 40, transformOrigin: "50% 100%", duration: 1 }, 0)
          .from(
            '[data-dosey="sprout"]',
            { scaleY: 0, transformOrigin: "50% 100%", duration: 0.7 },
            0.15,
          )
          .from(
            '[data-dosey="leaves"] > *',
            { scale: 0, transformOrigin: "50% 50%", duration: 0.3, stagger: 0.12 },
            0.45,
          )
          .from(
            '[data-dosey="tomatoes"] > *',
            { scale: 0, transformOrigin: "50% 50%", duration: 0.3, stagger: 0.12 },
            0.7,
          );
        // The bubble carries readable (aria-live) text, so it plays once instead
        // of scrubbing — it must never sit hidden at a resting scroll position.
        gsap.from('[data-meet="bubble"]', {
          x: 16,
          autoAlpha: 0,
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: { trigger: cardRef.current, start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: cardRef },
  );

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-bubble border border-line-soft bg-surface text-ink shadow-soft"
    >
      <div className="flex items-center gap-3 rounded-t-bubble bg-gum-lilac/25 px-5 py-3.5 sm:px-6">
        <span className="grid h-9 w-9 place-items-center rounded-pill bg-gum-lilac shadow-gum">
          <Sparkles size={18} strokeWidth={2.25} className="text-ink" aria-hidden="true" />
        </span>
        <h2 className="font-display text-lg font-semibold text-ink">Meet Dosey</h2>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-6">
        {/*
          Corner crop maths (full rig: viewBox 200x250, body 140/200 of width,
          centred). At size 300 the svg is 300w x 375h. Stage is min 340px
          tall and ~270px wide (desktop) to ~330px (mobile).
          bottom -20% = -68px  -> svg top sits at 340 - (375 - 68) = +33px,
          so the sprout is never clipped by the stage top.
          left -52px (fixed, not a % of the stage, so it is the same on every
          width) -> the body spans x 45..255 in the svg, i.e. about -7..203: its
          left edge is cropped by the corner, while the left cheek (svg x 43,
          i.e. 64px - 52px = 12px) and the left eye stay fully inside.
        */}
        <div className="relative min-h-[340px] overflow-hidden rounded-control bg-gum-lilac/35">
          <DoseyDioramaSlot />
          <DoseyRig
            interactive
            size={300}
            mood={mood}
            onPoke={handlePoke}
            className="absolute -bottom-[20%] -left-[52px]"
          />
        </div>

        <div className="flex flex-col justify-center gap-5 py-1 md:pr-2">
          <div
            data-meet="bubble"
            aria-live="polite"
            className="relative rounded-control border border-line-soft bg-surface-2 px-4 py-3 font-body text-base text-ink"
          >
            {line}
            <span
              aria-hidden="true"
              className="absolute -top-[7px] left-8 h-3 w-3 rotate-45 border-l border-t border-line-soft bg-surface-2 md:-left-[7px] md:top-6 md:-rotate-45"
            />
          </div>

          <p className="font-body text-sm text-ink-soft">
            Your study companion. Poke for a pep talk, or ask a quick question.
          </p>

          <div>
            <button
              type="button"
              onClick={onAskDosey}
              className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-pill bg-ink px-6 py-3 font-display text-base font-medium text-surface shadow-pop transition-transform duration-150 active:scale-95 [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5"
            >
              <MessageCircle size={18} strokeWidth={2.25} aria-hidden="true" />
              Ask Dosey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
