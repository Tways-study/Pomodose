interface Props {
  size?: number;
}

export function VialMark({ size = 34 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden>
      <rect x="11" y="2" width="12" height="6" rx="2" className="fill-lilac stroke-ink" strokeWidth="2" />
      <path
        d="M13 8v5l-5 14a4 4 0 0 0 3.7 5.5h10.6A4 4 0 0 0 26 27L21 13V8"
        className="stroke-ink fill-lilac/35"
        strokeWidth="2"
      />
      <path d="M9.2 24h15.6" className="stroke-lilac-deep" strokeWidth="2" />
    </svg>
  );
}
