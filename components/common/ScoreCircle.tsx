import React from "react";

export function ScoreCircle({ score, size = 120, strokeWidth = 10 }: { score: number, size?: number, strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  let color = "var(--red)";
  if (score >= 80) color = "var(--green)";
  else if (score >= 50) color = "var(--amber)";

  return (
    <div className="relative flex items-center justify-center font-dm-mono" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex items-baseline">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-sm text-muted">%</span>
      </div>
    </div>
  );
}
