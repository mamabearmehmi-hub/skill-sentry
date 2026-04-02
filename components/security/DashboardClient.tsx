"use client";

import { useState, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Skull,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RegistryEntry } from "@/lib/types";
import { getRiskLevel, formatStars } from "@/lib/registry-utils";
import { SkillsTable } from "./SkillsTable";

interface DashboardClientProps {
  entries: RegistryEntry[];
  stats: {
    totalScanned: number;
    verifiedSafe: number;
    averageRisk: number;
    criticalCount: number;
  };
}

type StatFilter = null | "all" | "safe" | "threats" | "critical";

export function DashboardClient({ entries, stats }: DashboardClientProps) {
  const [activeFilter, setActiveFilter] = useState<StatFilter>(null);

  // Compute the "headline" finding: highest risk + most stars
  const headline = useMemo(() => {
    const realEntries = entries.filter((e) => !e.isDemo);
    const highestRiskPopular = realEntries
      .filter((e) => e.riskScore > 0 && e.stars > 0)
      .sort((a, b) => b.stars - a.stars)[0];
    const mostPopularSafe = realEntries
      .filter((e) => e.verifiedSafe && e.stars > 0)
      .sort((a, b) => b.stars - a.stars)[0];
    return { highestRiskPopular, mostPopularSafe };
  }, [entries]);

  // Filter entries based on active stat tile
  const filteredEntries = useMemo(() => {
    if (!activeFilter || activeFilter === "all") return entries;
    if (activeFilter === "safe") return entries.filter((e) => e.verifiedSafe);
    if (activeFilter === "threats") return entries.filter((e) => !e.verifiedSafe && !e.isDemo);
    if (activeFilter === "critical")
      return entries.filter((e) => e.riskScore >= 80 && !e.isDemo);
    return entries;
  }, [entries, activeFilter]);

  const avgLevel = getRiskLevel(stats.averageRisk);
  const avgColor =
    avgLevel === "safe" || avgLevel === "low"
      ? "#00e5a0"
      : avgLevel === "medium"
        ? "#ff9a00"
        : "#ff2d55";

  function StatCard({
    label,
    value,
    icon,
    accent,
    glow,
    filter,
  }: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    accent?: string;
    glow?: string;
    filter: StatFilter;
  }) {
    const isActive = activeFilter === filter;
    return (
      <button
        onClick={() => setActiveFilter(isActive ? null : filter)}
        className={cn(
          "relative rounded-lg border bg-[#12121a] p-5 overflow-hidden text-left",
          "transition-all duration-300 cursor-pointer",
          isActive
            ? "border-white/[0.2] ring-1 ring-white/[0.1] scale-[1.02]"
            : "border-white/[0.06] hover:border-white/[0.12]",
          glow
        )}
      >
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
            <p
              className="mt-2 text-3xl font-mono font-bold tracking-tight"
              style={{ color: accent }}
            >
              {value}
            </p>
          </div>
          <div className="rounded-md bg-white/[0.04] p-2" style={{ color: accent }}>
            {icon}
          </div>
        </div>
        {/* Click hint */}
        <p className="mt-2 text-[10px] font-mono text-muted-foreground/30 flex items-center gap-1">
          <MousePointerClick className="h-2.5 w-2.5" />
          {isActive ? "Click to clear filter" : "Click to filter"}
        </p>
      </button>
    );
  }

  return (
    <>
      {/* News Ticker */}
      {headline.highestRiskPopular && (
        <div className="mb-6 overflow-hidden rounded-lg border border-white/[0.06] bg-[#0e0e16]">
          <div className="flex items-center gap-3 px-4 py-2.5 animate-fade-in-up">
            <TrendingUp className="h-4 w-4 text-[#ff9a00] flex-shrink-0" />
            <div className="flex gap-6 text-xs font-mono overflow-hidden">
              {headline.highestRiskPopular && (
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[#ff2d55] font-semibold">TOP FINDING</span>
                  <span className="text-foreground/80">
                    {headline.highestRiskPopular.owner}/{headline.highestRiskPopular.name}
                  </span>
                  <span className="text-muted-foreground/50">
                    ({formatStars(headline.highestRiskPopular.stars)} stars, risk {headline.highestRiskPopular.riskScore})
                  </span>
                  <span className="text-[#ff2d55]/70">
                    — {headline.highestRiskPopular.findings.length} issues found
                  </span>
                </span>
              )}
              {headline.mostPopularSafe && (
                <>
                  <span className="text-muted-foreground/20">|</span>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-[#00e5a0] font-semibold">VERIFIED SAFE</span>
                    <span className="text-foreground/80">
                      {headline.mostPopularSafe.owner}/{headline.mostPopularSafe.name}
                    </span>
                    <span className="text-muted-foreground/50">
                      ({formatStars(headline.mostPopularSafe.stars)} stars)
                    </span>
                    <span className="text-[#00e5a0]/70">
                      — clean scan
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clickable Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children mb-8">
        <StatCard
          label="Skills Scanned"
          value={stats.totalScanned}
          icon={<Shield className="h-5 w-5" />}
          accent="#8888a0"
          filter="all"
        />
        <StatCard
          label="Verified Safe"
          value={stats.verifiedSafe}
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="#00e5a0"
          glow="hover:shadow-[0_0_30px_rgba(0,229,160,0.08)]"
          filter="safe"
        />
        <StatCard
          label="Avg Risk Score"
          value={stats.averageRisk}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent={avgColor}
          filter="threats"
        />
        <StatCard
          label="Critical Threats"
          value={stats.criticalCount}
          icon={<Skull className="h-5 w-5" />}
          accent={stats.criticalCount > 0 ? "#ff0040" : "#8888a0"}
          glow={
            stats.criticalCount > 0
              ? "hover:shadow-[0_0_30px_rgba(255,0,64,0.08)]"
              : undefined
          }
          filter="critical"
        />
      </div>

      {/* Active filter indicator */}
      {activeFilter && (
        <div className="mb-4 flex items-center gap-2 text-xs font-mono animate-fade-in-up">
          <span className="text-muted-foreground/50">Showing:</span>
          <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1 text-foreground/70">
            {activeFilter === "all" && "All skills"}
            {activeFilter === "safe" && "Verified safe only"}
            {activeFilter === "threats" && "Flagged skills only"}
            {activeFilter === "critical" && "Critical threats only"}
          </span>
          <button
            onClick={() => setActiveFilter(null)}
            className="text-muted-foreground/40 hover:text-foreground/60 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table hint */}
      <p className="mb-3 text-xs font-mono text-muted-foreground/40 flex items-center gap-1.5">
        <MousePointerClick className="h-3 w-3" />
        Click any row to see the full security report
      </p>

      {/* Skills Table */}
      <SkillsTable entries={filteredEntries} />
    </>
  );
}
