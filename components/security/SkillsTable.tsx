"use client";

import { useState, useCallback, useMemo } from "react";
import { Star, ExternalLink, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RegistryEntry } from "@/lib/types";
import { searchEntries, getRiskLevel } from "@/lib/registry-utils";
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

export function SkillsTable({ entries }: SkillsTableProps) {
  const [query, setQuery] = useState("");
  const [safeOnly, setSafeOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("riskScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSearch = useCallback((q: string) => setQuery(q), []);
  const handleFilterSafe = useCallback((s: boolean) => setSafeOnly(s), []);

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir(field === "riskScore" ? "desc" : "asc");
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
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
    return result;
  }, [entries, query, safeOnly, sortField, sortDir]);

  function SortHeader({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <button
        onClick={() => toggleSort(field)}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground",
          "hover:text-foreground transition-colors",
          className
        )}
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

      <div className="rounded-lg border border-white/[0.06] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_2fr_100px_140px_80px] gap-4 px-5 py-3 bg-[#0e0e16] border-b border-white/[0.04]">
          <SortHeader field="name">Skill</SortHeader>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
            Description
          </span>
          <SortHeader field="riskScore">Risk</SortHeader>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
            Findings
          </span>
          <SortHeader field="stars">Stars</SortHeader>
        </div>

        {/* Table Body */}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted-foreground text-sm">
            No skills match your search.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((entry) => {
              const level = getRiskLevel(entry.riskScore);
              return (
                <div
                  key={`${entry.owner}/${entry.name}`}
                  className={cn(
                    "grid grid-cols-[1fr_2fr_100px_140px_80px] gap-4 px-5 py-4 items-center",
                    "bg-[#12121a] transition-all duration-200 cursor-default",
                    "hover:bg-[#161622]",
                    rowGlowStyles[level]
                  )}
                >
                  {/* Skill name */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-sm text-foreground truncate">
                        {entry.name}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                    </div>
                    <span className="text-xs text-muted-foreground/60 font-mono">
                      {entry.owner}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground truncate">
                    {entry.description ?? "No description"}
                  </p>

                  {/* Risk Score */}
                  <RiskBadge score={entry.riskScore} size="sm" />

                  {/* Findings */}
                  <ThreatBar findings={entry.totalFindings} />

                  {/* Stars */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-current opacity-40" />
                    <span className="font-mono tabular-nums">{entry.stars}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs font-mono text-muted-foreground/50 text-right">
        {filtered.length} of {entries.length} skills
      </p>
    </div>
  );
}
