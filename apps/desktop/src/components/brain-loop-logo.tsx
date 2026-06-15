interface BrainLoopLogoProps {
  className?: string;
  size?: number;
}

export function BrainLoopLogo({ className, size = 36 }: BrainLoopLogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      height={size}
      viewBox="0 0 64 64"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#111318" height="64" rx="16" width="64" />
      <path
        d="M32 11c-10-5-22 3-22 17 0 8 5 14 13 15-8 6-3 15 8 15 8 0 13-6 11-13 9-1 15-8 13-17-2-13-13-22-23-17 11 6 11 18 0 24s-10 17 0 23"
        fill="none"
        stroke="url(#brain-loop-stroke)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4.5"
      />
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="brain-loop-stroke"
          x1="14"
          x2="50"
          y1="12"
          y2="58"
        >
          <stop stopColor="#BEEBFF" />
          <stop offset="0.45" stopColor="#9DE2FF" />
          <stop offset="1" stopColor="#5AA7FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
