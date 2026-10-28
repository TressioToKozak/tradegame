export default function Brand({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={`brand-mark ${small ? "small" : ""}`}
      viewBox="0 0 100 112"
      fill="none"
      role="img"
      aria-label="Monogram JWC"
    >
      <path
        d="M50 3 92 27v50L50 109 8 77V27L50 3Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m50 11 34 20v42l-34 26-34-26V31l34-20Z"
        stroke="currentColor"
        strokeWidth=".7"
      />
      <path
        d="M36 30h16v34c0 12-7 19-17 15-5-2-7-6-6-10m20-29 7 29 9-23 9 23 7-29M64 34c-12-7-23 1-23 14 0 14 12 23 23 15"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m44 88 6 4 6-4M27 22l23-13 23 13" stroke="currentColor" />
    </svg>
  );
}
