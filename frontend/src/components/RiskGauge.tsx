interface RiskGaugeProps {
  score: number;
  size?: number;
}

export default function RiskGauge({ score, size = 180 }: RiskGaugeProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s <= 40) return "hsl(var(--risk-low))";
    if (s <= 70) return "hsl(var(--risk-moderate))";
    return "hsl(var(--risk-high))";
  };

  const getLabel = (s: number) => {
    if (s <= 40) return "Low Risk";
    if (s <= 70) return "Moderate Risk";
    return "High Risk";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ "--gauge-target": offset } as React.CSSProperties}
        />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: size * 0.28 }}>
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <span
        className="text-sm font-semibold mt-1"
        style={{ color: getColor(score) }}
      >
        {getLabel(score)}
      </span>
    </div>
  );
}
