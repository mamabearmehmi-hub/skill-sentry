import { Shield, ShieldCheck, AlertTriangle, Skull } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRiskLevel } from "@/lib/registry-utils";

interface StatsHeaderProps {
  totalScanned: number;
  verifiedSafe: number;
  averageRisk: number;
  criticalCount: number;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
  glow?: string;
}

function StatCard({ label, value, icon, accent, glow }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-white/[0.06] bg-[#12121a] p-5 overflow-hidden",
        "transition-all duration-300 hover:border-white/[0.12]",
        glow
      )}
    >
      {/* Subtle top accent line */}
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: accent }}
        />
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {label}
          </p>
          <p className="mt-2 text-3xl font-mono font-bold tracking-tight" style={{ color: accent }}>
            {value}
          </p>
        </div>
        <div className="rounded-md bg-white/[0.04] p-2" style={{ color: accent }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsHeader({
  totalScanned,
  verifiedSafe,
  averageRisk,
  criticalCount,
}: StatsHeaderProps) {
  const avgLevel = getRiskLevel(averageRisk);
  const avgColor =
    avgLevel === "safe" || avgLevel === "low"
      ? "#00e5a0"
      : avgLevel === "medium"
        ? "#ff9a00"
        : "#ff2d55";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      <StatCard
        label="Skills Scanned"
        value={totalScanned}
        icon={<Shield className="h-5 w-5" />}
        accent="#8888a0"
      />
      <StatCard
        label="No Risks Found"
        value={verifiedSafe}
        icon={<ShieldCheck className="h-5 w-5" />}
        accent="#00e5a0"
        glow="hover:shadow-[0_0_30px_rgba(0,229,160,0.08)]"
      />
      <StatCard
        label="Avg Risk Score"
        value={averageRisk}
        icon={<AlertTriangle className="h-5 w-5" />}
        accent={avgColor}
      />
      <StatCard
        label="Critical Threats"
        value={criticalCount}
        icon={<Skull className="h-5 w-5" />}
        accent={criticalCount > 0 ? "#ff0040" : "#8888a0"}
        glow={
          criticalCount > 0
            ? "hover:shadow-[0_0_30px_rgba(255,0,64,0.08)]"
            : undefined
        }
      />
    </div>
  );
}
