"use client";

type RatingStarsProps = {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClassMap: Record<NonNullable<RatingStarsProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function RatingStars({ score, size = "md", className = "" }: RatingStarsProps) {
  const safeScore = Math.max(0, Math.min(5, score));
  const percentage = `${(safeScore / 5) * 100}%`;

  return (
    <span
      className={`relative inline-block leading-none ${sizeClassMap[size]} ${className}`.trim()}
      aria-label={`评分 ${safeScore.toFixed(1)} / 5`}
    >
      <span className="text-slate-300">★★★★★</span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-amber-400"
        style={{ width: percentage }}
        aria-hidden="true"
      >
        ★★★★★
      </span>
    </span>
  );
}
