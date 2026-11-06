// Ilustración geométrica plana (sin degradados): la sierra en capas, el sol y una cabaña de perfil.
// Los colores salen de los tokens de globals.css.

export function Sierra({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 50 1440 170">
      <circle className="fill-accent" cx="1130" cy="104" r="40" />
      <path className="fill-sierra-200" d="M0 220V120L170 62l150 68 120-60 190 100 160-80 200 110 170-70 280 90v40z" />
      <path className="fill-sierra-300" d="M0 220V160l130-50 110 60 170-80 150 90 190-50 170 70 160-60 160 70 200-40v100z" />
      <path className="fill-brand" d="M0 220v-30l190-30 120 40 200-50 160 60 220-40 190 40 160-30 200 30v40z" />
      <path className="fill-paper" d="M0 220v-12l190-14 140 24 190-26 150 28 230-22 190 20 160-14 190 14v22z" />
      {/* cabaña */}
      <g transform="translate(560 140)">
        <path className="fill-paper" d="M0 40V14L28 -8l28 22v26z" />
        <path className="fill-accent" d="M-4 16L28 -12l32 28-3 3L28 -6 -1 19z" />
        <rect className="fill-brand" height="14" width="9" x="23" y="26" />
      </g>
    </svg>
  );
}

export function Marca({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 32 32">
      <rect className="fill-brand" height="32" rx="3" width="32" />
      <path className="fill-sierra-300" d="M0 32V22l9-8 8 8 6-5 9 8v7z" />
      <path className="fill-sierra-100" d="M0 32v-5l9-7 8 7 6-4 9 6v3z" />
      <circle className="fill-accent" cx="23" cy="9" r="4" />
    </svg>
  );
}

/** Glifo de cabaña: la Familiar es más ancha y alta que la Compacta. */
export function Glifo({ grande, className = '' }: { grande?: boolean; className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 96 56">
      {grande ? (
        <>
          <path className="fill-sierra-300" d="M6 54V24L48 2l42 22v30z" />
          <path className="fill-brand" d="M0 26L48 -2l48 28-4 5L48 6 4 31z" />
          <rect className="fill-paper" height="14" width="14" x="18" y="30" />
          <rect className="fill-paper" height="14" width="14" x="64" y="30" />
          <rect className="fill-accent" height="22" width="12" x="42" y="32" />
        </>
      ) : (
        <>
          <path className="fill-sierra-300" d="M20 54V26L48 8l28 18v28z" />
          <path className="fill-brand" d="M14 28L48 4l34 24-4 5L48 11 18 33z" />
          <rect className="fill-paper" height="12" width="12" x="27" y="33" />
          <rect className="fill-accent" height="20" width="11" x="52" y="34" />
        </>
      )}
      <rect className="fill-brand" height="2" width="96" y="54" />
    </svg>
  );
}
