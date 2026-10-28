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
        d="M19 86V35a31 31 0 0 1 62 0v51L50 108 19 86Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M25 82V35a25 25 0 0 1 50 0v47L50 100 25 82Z"
        stroke="currentColor"
        strokeWidth=".6"
      />
      <path
        d="M33 34h17v29c0 11-5 17-13 17-5 0-8-3-8-7M46 42l7 32 10-22 9 22 7-32"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M68 30c-8-5-19 1-19 13 0 14 10 23 20 17"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M44 91h12M46 16h8M50 12v8M12 42v26m76-26v26"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
