"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Skull,
  MousePointerClick,
  TrendingUp,
  AlertCircle,
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

  const filteredEntries = useMemo(() => {
    if (!activeFilter || activeFilter === "all") return entries;
    if (activeFilter === "safe") return entries.filter((e) => e.verifiedSafe);
    if (activeFilter === "threats")
      return entries.filter((e) => !e.verifiedSafe && !e.isDemo);
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
          "relative rounded-lg border bg-[#12121a] p-4 sm:p-5 overflow-hidden text-left w-full",
          "transition-all duration-300 cursor-pointer",
          isActive
            ? "border-white/[0.25] ring-1 ring-white/[0.15] scale-[1.02]"
            : "border-white/[0.06] hover:border-white/[0.15]",
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
            <p className="text-xs sm:text-sm font-medium text-muted-foreground tracking-wide uppercase">
              {label}
            </p>
            <p
              className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-mono font-bold tracking-tight"
              style={{ color: accent }}
            >
              {value}
            </p>
          </div>
          <div
            className="rounded-md bg-white/[0.04] p-1.5 sm:p-2"
            style={{ color: accent }}
          >
            {icon}
          </div>
        </div>
        <p className="mt-2 text-[11px] font-mono text-white/50 flex items-center gap-1">
          <MousePointerClick className="h-3 w-3" />
          {isActive ? "Tap to clear" : "Tap to filter"}
        </p>
      </button>
    );
  }

  return (
    <>
      {/* Ticker Tape — scrolling marquee */}
      {headline.highestRiskPopular && (
        <div className="mb-6 rounded-lg border border-white/[0.06] bg-[#0e0e16] overflow-hidden">
          <div className="relative flex items-center py-2.5 px-3">
            <AlertCircle className="h-4 w-4 text-[#ff9a00] flex-shrink-0 mr-3 z-10" />
            <div className="overflow-hidden flex-1">
              <div className="flex gap-12 animate-ticker whitespace-nowrap">
                {/* Top Finding — clickable */}
                {headline.highestRiskPopular && (
                  <Link
                    href={`/repo/${headline.highestRiskPopular.owner}/${headline.highestRiskPopular.name}`}
                    className="inline-flex items-center gap-2 text-xs font-mono hover:opacity-80 transition-opacity"
                  >
                    <span className="text-[#ff2d55] font-bold">
                      TOP FINDING
                    </span>
                    <span className="text-white">
                      {headline.highestRiskPopular.owner}/
                      {headline.highestRiskPopular.name}
                    </span>
                    <span className="text-white/40">
                      {formatStars(headline.highestRiskPopular.stars)} stars
                    </span>
                    <span className="text-[#ff2d55]">
                      risk {headline.highestRiskPopular.riskScore} —{" "}
                      {headline.highestRiskPopular.findings.length} issues
                    </span>
                    <span className="text-white/30">Click to view report</span>
                  </Link>
                )}

                {/* Most Popular Safe — clickable */}
                {headline.mostPopularSafe && (
                  <Link
                    href={`/repo/${headline.mostPopularSafe.owner}/${headline.mostPopularSafe.name}`}
                    className="inline-flex items-center gap-2 text-xs font-mono hover:opacity-80 transition-opacity"
                  >
                    <span className="text-[#00e5a0] font-bold">
                      NO RISKS FOUND
                    </span>
                    <span className="text-white">
                      {headline.mostPopularSafe.owner}/
                      {headline.mostPopularSafe.name}
                    </span>
                    <span className="text-white/40">
                      {formatStars(headline.mostPopularSafe.stars)} stars
                    </span>
                    <span className="text-[#00e5a0]">clean scan</span>
                    <span className="text-white/30">Click to view report</span>
                  </Link>
                )}

                {/* Duplicate for seamless loop */}
                {headline.highestRiskPopular && (
                  <Link
                    href={`/repo/${headline.highestRiskPopular.owner}/${headline.highestRiskPopular.name}`}
                    className="inline-flex items-center gap-2 text-xs font-mono hover:opacity-80 transition-opacity"
                  >
                    <span className="text-[#ff2d55] font-bold">
                      TOP FINDING
                    </span>
                    <span className="text-white">
                      {headline.highestRiskPopular.owner}/
                      {headline.highestRiskPopular.name}
                    </span>
                    <span className="text-white/40">
                      {formatStars(headline.highestRiskPopular.stars)} stars
                    </span>
                    <span className="text-[#ff2d55]">
                      risk {headline.highestRiskPopular.riskScore} —{" "}
                      {headline.highestRiskPopular.findings.length} issues
                    </span>
                  </Link>
                )}
                {headline.mostPopularSafe && (
                  <Link
                    href={`/repo/${headline.mostPopularSafe.owner}/${headline.mostPopularSafe.name}`}
                    className="inline-flex items-center gap-2 text-xs font-mono hover:opacity-80 transition-opacity"
                  >
                    <span className="text-[#00e5a0] font-bold">
                      NO RISKS FOUND
                    </span>
                    <span className="text-white">
                      {headline.mostPopularSafe.owner}/
                      {headline.mostPopularSafe.name}
                    </span>
                    <span className="text-white/40">
                      {formatStars(headline.mostPopularSafe.stars)} stars
                    </span>
                    <span className="text-[#00e5a0]">clean scan</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clickable Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger-children mb-8">
        <StatCard
          label="Skills Scanned"
          value={stats.totalScanned}
          icon={<Shield className="h-4 w-4 sm:h-5 sm:w-5" />}
          accent="#8888a0"
          filter="all"
        />
        <StatCard
          label="No Risks Found"
          value={stats.verifiedSafe}
          icon={<ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />}
          accent="#00e5a0"
          glow="hover:shadow-[0_0_30px_rgba(0,229,160,0.08)]"
          filter="safe"
        />
        <StatCard
          label="Avg Risk Score"
          value={stats.averageRisk}
          icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />}
          accent={avgColor}
          filter="threats"
        />
        <StatCard
          label="Critical Threats"
          value={stats.criticalCount}
          icon={<Skull className="h-4 w-4 sm:h-5 sm:w-5" />}
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
          <span className="text-white/50">Showing:</span>
          <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1 text-white/70">
            {activeFilter === "all" && "All skills"}
            {activeFilter === "safe" && "No risks found only"}
            {activeFilter === "threats" && "Flagged skills only"}
            {activeFilter === "critical" && "Critical threats only"}
          </span>
          <button
            onClick={() => setActiveFilter(null)}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table hint */}
      <p className="mb-3 text-xs font-mono text-white/50 flex items-center gap-1.5">
        <MousePointerClick className="h-3 w-3" />
        Click any row to see the full security report
      </p>

      {/* Skills Table */}
      <SkillsTable entries={filteredEntries} />
    </>
  );
}
