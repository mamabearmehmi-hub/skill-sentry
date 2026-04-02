"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Star, ExternalLink, ArrowUpDown, FlaskConical, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RegistryEntry } from "@/lib/types";
import {
  searchEntries,
  getRiskLevel,
  getImpact,
  formatStars,
} from "@/lib/registry-utils";
import { RiskBadge } from "./RiskBadge";
import { ThreatBar } from "./ThreatBar";
import { SearchFilter } from "./SearchFilter";

interface SkillsTableProps {
  entries: RegistryEntry[];
}

type SortField = "riskScore" | "stars" | "name" | "lastAuditDate";
type SortDir = "asc" | "desc";

const rowGlowStyles: Record<string, string> = {
  safe: "hover:shadow-[inset_0_0_40px_rgba(0,229,160,0.03)]",
  low: "hover:shadow-[inset_0_0_40px_rgba(74,222,128,0.03)]",
  medium: "hover:shadow-[inset_0_0_40px_rgba(255,154,0,0.03)]",
  high: "hover:shadow-[inset_0_0_40px_rgba(255,45,85,0.04)]",
  critical: "hover:shadow-[inset_0_0_40px_rgba(255,0,64,0.06)]",
};

const impactBadgeStyles: Record<string, string> = {
  "High Impact": "bg-[#ff0040]/10 text-[#ff0040] border-[#ff0040]/20",
  Notable: "bg-[#ff9a00]/10 text-[#ff9a00] border-[#ff9a00]/20",
  Watch: "bg-[#ff9a00]/8 text-[#ff9a00]/80 border-[#ff9a00]/15",
  "Low Profile": "bg-white/[0.03] text-white/40 border-white/[0.06]",
  "Widely Used": "bg-[#00e5a0]/10 text-[#00e5a0] border-[#00e5a0]/20",
  Clear: "bg-[#00e5a0]/8 text-[#00e5a0]/80 border-[#00e5a0]/15",
  Demo: "bg-white/[0.03] text-white/30 border-white/[0.04]",
};

export function SkillsTable({ entries }: SkillsTableProps) {
  const [query, setQuery] = useState("");
  const [safeOnly, setSafeOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("stars");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSearch = useCallback((q: string) => setQuery(q), []);
  const handleFilterSafe = useCallback((s: boolean) => setSafeOnly(s), []);

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir(field === "riskScore" || field === "stars" ? "desc" : "asc");
      }
    },
    [sortField]
  );

  const filtered = useMemo(() => {
    let result = searchEntries(entries, query);
    if (safeOnly) {
      result = result.filter((e) => e.verifiedSafe);
    }
    result.sort((a, b) => {
      if (a.isDemo && !b.isDemo) return 1;
      if (!a.isDemo && b.isDemo) return -1;
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return result;
  }, [entries, query, safeOnly, sortField, sortDir]);

  function SortHeader({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) {
    return (
      <button
        onClick={() => toggleSort(field)}
        className="inline-flex items-center gap-1 text-xs font-mono font-semibold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
      >
        {children}
        <ArrowUpDown
          className={cn(
            "h-3 w-3",
            sortField === field ? "text-[#00e5a0]" : "opacity-30"
          )}
        />
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <SearchFilter onSearch={handleSearch} onFilterSafe={handleFilterSafe} />

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-[minmax(140px,1.2fr)_2fr_90px_120px_70px_90px] gap-3 px-5 py-3 bg-[#0e0e16] border-b border-white/[0.04]">
          <SortHeader field="name">Skill</SortHeader>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-white/50">
            Description
          </span>
          <SortHeader field="riskScore">Risk</SortHeader>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-white/50">
            Findings
          </span>
          <SortHeader field="stars">Stars</SortHeader>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-white/50">
            Impact
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-white/40 text-sm">
            No skills match your search.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((entry) => {
              const level = getRiskLevel(entry.riskScore);
              const impact = getImpact(entry);
              return (
                <Link
                  key={`${entry.owner}/${entry.name}`}
                  href={entry.isDemo ? "#" : `/repo/${entry.owner}/${entry.name}`}
                  className={cn(
                    "grid grid-cols-[minmax(140px,1.2fr)_2fr_90px_120px_70px_90px] gap-3 px-5 py-4 items-center",
                    "bg-[#12121a] transition-all duration-200",
                    "hover:bg-[#161622]",
                    entry.isDemo && "opacity-50",
                    rowGlowStyles[level]
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {entry.isDemo && (
                        <FlaskConical className="h-3 w-3 text-white/30 flex-shrink-0" />
                      )}
                      <span className="font-mono font-semibold text-sm text-white truncate">
                        {entry.name}
                      </span>
                      {!entry.isDemo && (
                        <ExternalLink className="h-3 w-3 text-white/30 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-white/40 font-mono">
                      {entry.isDemo ? "demo" : entry.owner}
                    </span>
                  </div>

                  <p className="text-sm text-white/50 truncate">
                    {entry.isDemo
                      ? "Demo entry for testing"
                      : entry.description ?? "No description"}
                  </p>

                  <RiskBadge score={entry.riskScore} size="sm" />
                  <ThreatBar findings={entry.totalFindings} />

                  <div className="flex items-center gap-1 text-sm text-white/50">
                    <Star className="h-3.5 w-3.5 fill-current opacity-40" />
                    <span className="font-mono tabular-nums text-xs">
                      {formatStars(entry.stars)}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full border px-2 py-0.5",
                      "text-[10px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap",
                      impactBadgeStyles[impact.label]
                    )}
                    title={impact.description}
                  >
                    {impact.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {/* Mobile sort controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-mono text-white/40 flex-shrink-0">Sort:</span>
          {(
            [
              ["stars", "Popular"],
              ["riskScore", "Risk"],
              ["name", "Name"],
            ] as const
          ).map(([field, label]) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={cn(
                "text-xs font-mono px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors",
                sortField === field
                  ? "border-[#00e5a0]/30 bg-[#00e5a0]/10 text-[#00e5a0]"
                  : "border-white/[0.06] text-white/40 hover:text-white/60"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-white/40 text-sm">
            No skills match your search.
          </div>
        ) : (
          filtered.map((entry) => {
            const level = getRiskLevel(entry.riskScore);
            const impact = getImpact(entry);
            return (
              <Link
                key={`m-${entry.owner}/${entry.name}`}
                href={entry.isDemo ? "#" : `/repo/${entry.owner}/${entry.name}`}
                className={cn(
                  "block rounded-lg border border-white/[0.06] bg-[#12121a] p-4",
                  "transition-all duration-200 active:scale-[0.99]",
                  entry.isDemo && "opacity-50",
                  rowGlowStyles[level]
                )}
              >
                {/* Top row: name + risk badge */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {entry.isDemo && (
                        <FlaskConical className="h-3 w-3 text-white/30 flex-shrink-0" />
                      )}
                      <span className="font-mono font-semibold text-sm text-white truncate">
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-xs text-white/40 font-mono">
                      {entry.isDemo ? "demo" : entry.owner}
                    </span>
                  </div>
                  <RiskBadge score={entry.riskScore} size="sm" />
                </div>

                {/* Description */}
                <p className="text-sm text-white/40 mb-3 line-clamp-2">
                  {entry.isDemo
                    ? "Demo entry"
                    : entry.description ?? "No description"}
                </p>

                {/* Bottom row: stats */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <Star className="h-3 w-3 fill-current opacity-40" />
                      <span className="font-mono tabular-nums">
                        {formatStars(entry.stars)}
                      </span>
                    </div>
                    <ThreatBar findings={entry.totalFindings} />
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5",
                        "text-[9px] font-mono font-semibold uppercase tracking-wider",
                        impactBadgeStyles[impact.label]
                      )}
                    >
                      {impact.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/20 flex-shrink-0" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      <p className="text-xs font-mono text-white/30 text-right">
        {filtered.length} of {entries.length} skills
      </p>
    </div>
  );
}
