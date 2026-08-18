"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { QUOTES, shuffledOrder } from "@/lib/quotes";
import { SETTINGS } from "@/lib/settings";
import { ADDRESS_TOKEN } from "@/lib/address-terms";
import { useAddressTerm } from "@/components/address-term-provider";

interface Props {
  /** Increment this whenever a session completes to force an immediate advance. */
  advanceSignal?: number;
  /** Pause idle cycling while the timer is running. */
  paused?: boolean;
}

export function QuoteCard({ advanceSignal = 0, paused = false }: Props) {
  const reduceMotion = useReducedMotion();
  // Shuffle bag + cursor live in state so nothing reads a ref during render.
  // The first quote is deterministic (index 0) so the server and client render the
  // same thing on hydration; the remainder is shuffled so advancing stays random.
  const [bag, setBag] = useState(() => {
    const rest = shuffledOrder(QUOTES.length).filter(i => i !== 0);
    return { order: [0, ...rest], cursor: 0 };
  });
  const index = bag.order[bag.cursor];

  const next = useCallback(() => {
    setBag(prev => {
      const cursor = prev.cursor + 1;
      if (cursor >= prev.order.length) {
        return { order: shuffledOrder(QUOTES.length), cursor: 0 };
      }
      return { order: prev.order, cursor };
    });
  }, []);

  // Idle auto-cycle — paused while timer runs
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(next, SETTINGS.QUOTE_IDLE_MS);
    return () => window.clearInterval(id);
  }, [paused, next]);

  // Advance on session completion
  const prevSignal = useRef(advanceSignal);
  useEffect(() => {
    if (advanceSignal !== prevSignal.current) {
      prevSignal.current = advanceSignal;
      next();
    }
  }, [advanceSignal, next]);

  const quote = QUOTES[index];
  const name = useAddressTerm();
  const author = quote.author.replaceAll(ADDRESS_TOKEN, name);

  // Directional blur-lift: exits up, enters from below
  const variants = reduceMotion
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter:  { opacity: 0, y: 8,  filter: "blur(4px)" },
        center: { opacity: 1, y: 0,  filter: "blur(0px)" },
        exit:   { opacity: 0, y: -8, filter: "blur(4px)" },
      };

  return (
    <figure className="max-w-sm mt-12">
      <span className="font-serif italic text-xs tracking-widest uppercase text-lilac-deep block mb-2.5">
        Rx — Take as needed
      </span>

      {/* min-h prevents layout jump between quote lengths */}
      <div className="min-h-[84px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.blockquote
            key={index}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-serif text-lg leading-snug">{quote.text}</p>
            <cite className="block mt-2 not-italic text-sm text-ink-soft">{author}</cite>
          </motion.blockquote>
        </AnimatePresence>
      </div>
    </figure>
  );
}
