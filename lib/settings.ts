export const SETTINGS = {
  FOCUS_DURATION:      25 * 60,   // seconds
  SHORT_BREAK:          5 * 60,
  LONG_BREAK:          15 * 60,
  CYCLE_LENGTH:         4,         // focus sessions before long break
  QUOTE_IDLE_MS:       12_000,

  // --- Notification timing / thresholds ---
  BREAK_NUDGE_MS:      2 * 60_000,        // nudge when a queued break sits idle this long
  PAUSE_NUDGE_MS:      10 * 60_000,       // nudge when paused this long
  NOTE_DISMISS_MS:     10_000,            // auto-dismiss for core/milestone counter notes
  BURNOUT_DOSES_WARN:  3,                 // "no-antidote" threshold
  BURNOUT_DOSES_ALERT: 5,                 // "overdose" threshold
  LONG_STRETCH_MS:     4 * 60 * 60_000,   // "long-stretch" threshold since firstDoseAt
  LATE_HOUR_START:     23,                // "late-hour" window start (local hour, inclusive)
  LATE_HOUR_END:        4,                // "late-hour" window end (local hour, exclusive)
} as const;
