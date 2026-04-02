import { cn } from "@/lib/utils";
import { getRiskLevel } from "@/lib/registry-utils";
import { ShieldCheck } from "lucide-react";

interface RiskBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5 min-w-[3rem]",
  md: "text-sm px-3 py-1 min-w-[3.5rem]",
  lg: "text-base px-4 py-1.5 min-w-[4rem]",
};

const levelStyles: Record<string, string> = {
  safe: "bg-[#00e5a0]/10 text-[#00e5a0] border-[#00e5a0]/20 animate-glow-safe",
  low: "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20",
  medium: "bg-[#ff9a00]/10 text-[#ff9a00] border-[#ff9a00]/20",
  high: "bg-[#ff2d55]/10 text-[#ff2d55] border-[#ff2d55]/20",
  critical:
    "bg-[#ff0040]/15 text-[#ff0040] border-[#ff0040]/30 animate-pulse-danger",
};

export function RiskBadge({ score, size = "md" }: RiskBadgeProps) {
  const level = getRiskLevel(score);

  if (level === "safe") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border font-mono font-semibold tracking-wide uppercase",
          sizeClasses[size],
          levelStyles.safe
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Clear
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-mono font-bold tabular-nums",
        sizeClasses[size],
        levelStyles[level]
      )}
    >
      {score}
    </span>
  );
}
