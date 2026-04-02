import { cn } from "@/lib/utils";

interface ThreatBarProps {
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

const segmentColors: Record<string, string> = {
  critical: "bg-[#ff0040]",
  high: "bg-[#ff2d55]",
  medium: "bg-[#ff9a00]",
  low: "bg-[#4ade80]",
  info: "bg-[#8888a0]",
};

export function ThreatBar({ findings }: ThreatBarProps) {
  const total =
    findings.critical +
    findings.high +
    findings.medium +
    findings.low +
    findings.info;

  if (total === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-full max-w-[120px] rounded-full bg-[#00e5a0]/20 overflow-hidden">
          <div className="h-full w-full rounded-full bg-[#00e5a0]/60" />
        </div>
        <span className="text-xs font-mono text-[#00e5a0]/70">Clean</span>
      </div>
    );
  }

  const segments = (
    ["critical", "high", "medium", "low", "info"] as const
  ).filter((key) => findings[key] > 0);

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full max-w-[120px] rounded-full bg-white/5 overflow-hidden flex">
        {segments.map((key) => (
          <div
            key={key}
            className={cn("h-full first:rounded-l-full last:rounded-r-full", segmentColors[key])}
            style={{ width: `${(findings[key] / total) * 100}%` }}
            title={`${key}: ${findings[key]}`}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-muted-foreground tabular-nums">
        {total}
      </span>
    </div>
  );
}
