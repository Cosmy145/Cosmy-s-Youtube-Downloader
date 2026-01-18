"use client";

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Cosmy's YouTube Downloader Logo SVG Component
 */
export const Logo = ({ size = 32, className }: LogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M30 20V80L80 50L30 20Z"
        stroke="#FF0000"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <g transform="translate(10, 10)">
        <path
          d="M70 30V75"
          stroke="#FF0000"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M55 65L70 80L85 65"
          stroke="#FF0000"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M45 95H95"
          stroke="#FF0000"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default Logo;
