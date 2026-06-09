interface StarRatingProps {
  value: number;
  size?: number;
  className?: string;
}

export function StarRating({ value, size = 16, className }: StarRatingProps) {
  const safe = Math.max(0, Math.min(5, value));
  return (
    <span
      role="img"
      aria-label={`${safe.toFixed(1)} out of 5 stars`}
      className={`inline-flex items-center gap-0.5 ${className ?? ""}`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, safe - (i - 1)));
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden
            className="block"
          >
            <defs>
              <linearGradient id={`star-${i}-${size}-${safe}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.6l2.9 6.5 7 .6-5.3 4.7 1.7 6.9L12 17.7 5.7 21.3l1.7-6.9L2.1 9.7l7-.6L12 2.6z"
              fill={`url(#star-${i}-${size}-${safe})`}
              stroke="currentColor"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}
