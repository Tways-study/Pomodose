const ZS = [
  { x: 140, y: 80, size: 24 },
  { x: 148, y: 78, size: 30 },
  { x: 156, y: 76, size: 36 },
];

const SPARKLES = [
  { x: 46, y: 52, tone: "fill-dosey-tomato" },
  { x: 156, y: 56, tone: "fill-dosey-blush" },
  { x: 24, y: 100, tone: "fill-dosey-blush" },
  { x: 178, y: 104, tone: "fill-dosey-tomato" },
  { x: 100, y: 10, tone: "fill-dosey-blush" },
];

const BREEZES = [
  { x: 6, y: 100 },
  { x: 166, y: 126 },
];

const SPARKLE_PATH = "M0 -9 Q1.6 -1.6 9 0 Q1.6 1.6 0 9 Q-1.6 1.6 -9 0 Q-1.6 -1.6 0 -9 Z";
const BREEZE_PATH = "M0 0 Q7 -5 14 0 T28 0";

/**
 * Decorative extras (Zzz, sparkles, breeze). Everything starts invisible; only
 * the idle and moment hooks animate it. Hidden from assistive tech via the
 * parent svg's aria-hidden.
 */
export function DoseyFx() {
  return (
    <g data-rig="fx" pointerEvents="none">
      {ZS.map((z, i) => (
        <text
          key={i}
          data-fx="z"
          x={z.x}
          y={z.y}
          fontSize={z.size}
          className="fill-ink font-display"
          style={{ opacity: 0 }}
        >
          z
        </text>
      ))}
      {SPARKLES.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y})`}>
          <path data-fx="sparkle" d={SPARKLE_PATH} className={s.tone} style={{ opacity: 0 }} />
        </g>
      ))}
      {BREEZES.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y})`}>
          <path
            data-fx="breeze"
            d={BREEZE_PATH}
            className="fill-none stroke-dosey-sprout"
            strokeWidth={3}
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />
        </g>
      ))}
    </g>
  );
}
