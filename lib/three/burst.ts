import type { NotificationEvent } from "@/types";
import { THREE_FX } from "./fx";
import type { Tone } from "./palette";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  sz: number;
  age: number;
  life: number;
  size: number;
}

/** The gelcap half color follows the completed phase; other events do not burst. */
export function toneForEvent(event: NotificationEvent): Tone | null {
  switch (event) {
    case "focus-complete":
      return "sky";
    case "short-complete":
      return "mint";
    case "long-complete":
    case "cycle-complete":
      return "apricot";
    default:
      return null;
  }
}

/** Particles start at the origin (0, 0), y up, and fly up and out. */
export function initParticles(count: number, rand: () => number): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.PI / 2 + (rand() - 0.5) * 2 * THREE_FX.BURST_SPREAD;
    const speed = THREE_FX.BURST_SPEED_MIN + rand() * (THREE_FX.BURST_SPEED_MAX - THREE_FX.BURST_SPEED_MIN);
    const spin = () => (rand() - 0.5) * 2 * THREE_FX.BURST_SPIN_MAX;
    return {
      x: 0,
      y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rx: rand() * Math.PI * 2,
      ry: rand() * Math.PI * 2,
      rz: rand() * Math.PI * 2,
      sx: spin(),
      sy: spin(),
      sz: spin(),
      age: 0,
      life: THREE_FX.BURST_DURATION * (0.85 + rand() * 0.15),
      size: 0.8 + rand() * 0.4,
    };
  });
}

/** Semi-implicit Euler step under gravity, with no floor. Returns a new particle. */
export function stepParticle(p: Particle, dt: number): Particle {
  const vy = p.vy - THREE_FX.BURST_GRAVITY * dt;
  return {
    ...p,
    vy,
    x: p.x + p.vx * dt,
    y: p.y + vy * dt,
    rx: p.rx + p.sx * dt,
    ry: p.ry + p.sy * dt,
    rz: p.rz + p.sz * dt,
    age: p.age + dt,
  };
}

/** Pop in over the first moments, shrink to nothing over the last 30% of life. */
export function particleScale(p: Particle): number {
  const t = p.age / p.life;
  if (t >= 1) return 0;
  const popIn = Math.min(1, p.age / 0.08);
  const fade = t > THREE_FX.BURST_FADE_START ? 1 - (t - THREE_FX.BURST_FADE_START) / (1 - THREE_FX.BURST_FADE_START) : 1;
  return popIn * fade * p.size;
}

export function isDone(p: Particle): boolean {
  return p.age >= p.life;
}
