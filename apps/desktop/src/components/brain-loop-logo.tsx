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
      width={size}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(92 92) scale(0.8203125)">
        <rect fill="#FFFFFF" height="1024" rx="233" width="1024" />
        <rect fill="none" height="1016" rx="229" stroke="#DFE2E5" strokeWidth="8" width="1016" x="4" y="4" />
        <path
          d="M344 333H259V418"
          fill="none"
          stroke="#17191D"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="63"
        />
        <path
          d="M680 333H765V418"
          fill="none"
          stroke="#17191D"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="63"
        />
        <path
          d="M344 691H259V606"
          fill="none"
          stroke="#17191D"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="63"
        />
        <path
          d="M680 691H765V606"
          fill="none"
          stroke="#17191D"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="63"
        />
        <rect fill="url(#focus-frame-accent)" height="244" rx="74" width="244" x="390" y="390" />
        <circle cx="512" cy="512" fill="#FFFFFF" r="34" />
      </g>
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="focus-frame-accent"
          x1="245"
          x2="814"
          y1="239"
          y2="853"
        >
          <stop stopColor="#17191D" />
          <stop offset="0.62" stopColor="#1D6268" />
          <stop offset="1" stopColor="#5FB9A4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
