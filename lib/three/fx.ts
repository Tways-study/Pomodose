/** Counts, timings and physical constants for the three.js gelcap scenes. */
export const THREE_FX = {
  // --- Completion burst ---
  BURST_COUNT: 36,
  BURST_DURATION: 2.4,        // seconds, longest particle life
  BURST_FADE_START: 0.7,      // fraction of life after which the capsule shrinks away
  BURST_GRAVITY: 1500,        // px/s^2 (the burst scene is orthographic, 1 unit = 1px)
  BURST_SPEED_MIN: 420,       // px/s
  BURST_SPEED_MAX: 980,
  BURST_SPREAD: 1.15,         // radians either side of straight up
  BURST_SPIN_MAX: 9,          // rad/s
  BURST_CAPSULE_RADIUS: 9,    // px
  BURST_CAPSULE_LENGTH: 18,

  // --- Dose jar ---
  JAR_MAX_VISIBLE: 12,
  JAR_PER_LAYER: 3,
  JAR_DROP_SECONDS: 0.7,
  JAR_POP_SECONDS: 0.9,
  JAR_DROP_HEIGHT: 3,

  // --- Login capsules ---
  LOGIN_TILT_RAD: 0.07,       // about four degrees
  LOGIN_TILT_RATE: 3,         // easing rate (1/s)

  // --- Dosey diorama ---
  DIORAMA_PARALLAX: 0.3,      // world units either way
  DIORAMA_RATE: 2.5,
} as const;
