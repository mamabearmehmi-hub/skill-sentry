import {
  ArrowLeft,
  Star,
  FileSearch,
  Clock,
  Package,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RegistryEntry } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

interface ReportHeaderProps {
  entry: RegistryEntry;
}

export function ReportHeader({ entry }: ReportHeaderProps) {
  const auditDate = new Date(entry.lastAuditDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-mono text-muted-foreground/60 hover:text-[#00e5a0] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Main header */}
      <div
        className={cn(
          "relative rounded-lg border border-white/[0.06] bg-[#12121a] p-6 overflow-hidden",
          entry.riskScore >= 80 &&
            "shadow-[inset_0_0_60px_rgba(255,0,64,0.04)]"
        )}
      >
        {/* Top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: entry.verifiedSafe
              ? "#00e5a0"
              : entry.riskScore >= 80
                ? "#ff0040"
                : entry.riskScore >= 50
                  ? "#ff2d55"
                  : entry.riskScore >= 20
                    ? "#ff9a00"
                    : "#4ade80",
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Risk score */}
          <div className="flex-shrink-0">
            <RiskBadge score={entry.riskScore} size="lg" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h1 className="text-2xl font-mono font-bold text-foreground">
                {entry.name}
              </h1>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-muted-foreground/60 hover:text-[#00e5a0] transition-colors"
              >
                {entry.owner}/{entry.name}
              </a>
            </div>

            {entry.description && (
              <p className="text-sm text-muted-foreground">
                {entry.description}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              {entry.packageName && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground/50">
                  <Package className="h-3.5 w-3.5" />
                  {entry.packageName}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground/50">
                <Star className="h-3.5 w-3.5" />
                {entry.stars}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground/50">
                <FileSearch className="h-3.5 w-3.5" />
                {entry.scannedFiles} files scanned
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground/50">
                <Clock className="h-3.5 w-3.5" />
                {auditDate}
              </span>
            </div>
          </div>
        </div>

        {/* Verified safe banner */}
        {entry.verifiedSafe && (
          <div className="mt-5 flex items-center gap-2 rounded-md bg-[#00e5a0]/10 border border-[#00e5a0]/20 px-4 py-2.5">
            <ShieldCheck className="h-5 w-5 text-[#00e5a0]" />
            <span className="text-sm font-semibold text-[#00e5a0]">
              Verified Safe — no security threats detected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
