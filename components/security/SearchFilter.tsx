"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterSafe: (safeOnly: boolean) => void;
}

export function SearchFilter({ onSearch, onFilterSafe }: SearchFilterProps) {
  const [query, setQuery] = useState("");
  const [safeOnly, setSafeOnly] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const toggleSafe = useCallback(() => {
    const next = !safeOnly;
    setSafeOnly(next);
    onFilterSafe(next);
  }, [safeOnly, onFilterSafe]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search skills by name, owner, or description..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            "w-full rounded-lg border border-white/[0.06] bg-[#12121a] py-2.5 pl-10 pr-4",
            "text-sm font-sans text-foreground placeholder:text-muted-foreground/50",
            "transition-all duration-200",
            "focus:outline-none focus:border-[#00e5a0]/30 focus:shadow-[0_0_20px_rgba(0,229,160,0.06)]"
          )}
        />
      </div>

      {/* Verified Safe toggle */}
      <button
        onClick={toggleSafe}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5",
          "text-sm font-medium transition-all duration-200 whitespace-nowrap",
          safeOnly
            ? "border-[#00e5a0]/30 bg-[#00e5a0]/10 text-[#00e5a0]"
            : "border-white/[0.06] bg-[#12121a] text-muted-foreground hover:text-foreground hover:border-white/[0.12]"
        )}
      >
        <ShieldCheck className="h-4 w-4" />
        Verified Safe Only
      </button>
    </div>
  );
}
