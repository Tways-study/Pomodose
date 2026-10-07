import type { DoseyMood } from "@/lib/dosey-mood";

/**
 * The animated groups of the rig, resolved once per setup. Ownership nests:
 * lean (hover) > squash (poke) > react (moments, dizzy) > move (idle loops) > body.
 * Leaves: sway (idle loops) > perk (moments, poke). Gaze wraps each pupil.
 */
export interface RigParts {
  lean: SVGElement[];
  squash: SVGElement[];
  react: SVGElement[];
  move: SVGElement[];
  sway: SVGElement[];
  perk: SVGElement[];
  gaze: SVGElement[];
  lids: SVGElement[];
  pupils: SVGElement[];
  spirals: SVGElement[];
  blush: SVGElement[];
  zs: SVGElement[];
  sparkles: SVGElement[];
  breezes: SVGElement[];
}

function all(root: Element, selector: string): SVGElement[] {
  return Array.from(root.querySelectorAll<SVGElement>(selector));
}

export function getRigParts(root: Element): RigParts {
  const rig = (name: string) => all(root, `[data-rig="${name}"]`);
  return {
    lean: rig("lean"),
    squash: rig("squash"),
    react: rig("react"),
    move: rig("move"),
    sway: rig("sway"),
    perk: rig("perk"),
    gaze: rig("gaze"),
    lids: rig("lid"),
    pupils: rig("pupil"),
    spirals: rig("spiral"),
    blush: rig("blush"),
    zs: all(root, '[data-fx="z"]'),
    sparkles: all(root, '[data-fx="sparkle"]'),
    breezes: all(root, '[data-fx="breeze"]'),
  };
}

export function mouthOf(root: Element, mood: DoseyMood): SVGElement[] {
  return all(root, `[data-mouth="${mood}"]`);
}

/** Cheap viewport check so offscreen rigs skip one-shot moments. */
export function isOnScreen(el: Element | null): boolean {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}
