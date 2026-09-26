export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// Spring presets. UI is for press/hover and small indicators (snappy, no
// overshoot); SOFT is for panels and larger surfaces entering or resizing.
export const SPRING_UI = { type: "spring", stiffness: 400, damping: 30 } as const;
export const SPRING_SOFT = { type: "spring", stiffness: 260, damping: 26 } as const;
