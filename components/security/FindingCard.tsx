import { ExternalLink, FileCode, MessageCircleWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditFinding } from "@/lib/types";
import { getPlainEnglish } from "@/lib/registry-utils";

interface FindingCardProps {
  finding: AuditFinding;
  repoUrl: string;
}

const severityStripe: Record<string, string> = {
  CRITICAL: "bg-[#ff0040]",
  HIGH: "bg-[#ff2d55]",
  MEDIUM: "bg-[#ff9a00]",
  LOW: "bg-[#4ade80]",
  INFO: "bg-[#8888a0]",
};

const severityBadge: Record<string, string> = {
  CRITICAL: "bg-[#ff0040]/15 text-[#ff0040] border-[#ff0040]/30",
  HIGH: "bg-[#ff2d55]/10 text-[#ff2d55] border-[#ff2d55]/20",
  MEDIUM: "bg-[#ff9a00]/10 text-[#ff9a00] border-[#ff9a00]/20",
  LOW: "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20",
  INFO: "bg-[#8888a0]/10 text-[#8888a0] border-[#8888a0]/20",
};

export function FindingCard({ finding, repoUrl }: FindingCardProps) {
  const sourceLink = finding.line
    ? `${repoUrl}/blob/main/${finding.file}#L${finding.line}`
    : `${repoUrl}/blob/main/${finding.file}`;

  const plainEnglish = getPlainEnglish(finding);

  return (
    <div className="relative rounded-lg border border-white/[0.06] bg-[#12121a] overflow-hidden">
      {/* Severity stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px]",
          severityStripe[finding.severity]
        )}
      />

      <div className="pl-5 pr-4 py-4 space-y-3">
        {/* Header: severity + rule ID */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5",
              "text-[11px] font-mono font-bold uppercase tracking-wider",
              severityBadge[finding.severity]
            )}
          >
            {finding.severity}
          </span>
          <span className="text-xs font-mono text-muted-foreground/60">
            {finding.ruleId}
          </span>
        </div>

        {/* Plain English — the "What does this mean?" box */}
        <div
          className={cn(
            "rounded-md border px-4 py-3",
            finding.severity === "CRITICAL"
              ? "bg-[#ff0040]/5 border-[#ff0040]/15"
              : finding.severity === "HIGH"
                ? "bg-[#ff2d55]/5 border-[#ff2d55]/10"
                : "bg-[#ff9a00]/5 border-[#ff9a00]/10"
          )}
        >
          <div className="flex gap-2">
            <MessageCircleWarning className="h-4 w-4 flex-shrink-0 mt-0.5 text-foreground/70" />
            <p className="text-sm text-foreground/90 leading-relaxed">
              {plainEnglish}
            </p>
          </div>
        </div>

        {/* Technical detail (collapsed feel) */}
        <details className="group">
          <summary className="text-xs font-mono text-muted-foreground/50 cursor-pointer hover:text-muted-foreground/70 transition-colors">
            Technical details
          </summary>
          <div className="mt-2 space-y-2">
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              {finding.message}
            </p>
            {/* Matched text */}
            {finding.match && (
              <div className="rounded-md bg-black/30 border border-white/[0.04] px-3 py-2">
                <code className="text-xs font-mono text-[#ff9a00]/80 break-all">
                  {finding.match}
                </code>
              </div>
            )}
          </div>
        </details>

        {/* File + line link */}
        <a
          href={sourceLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-2 text-xs font-mono",
            "text-muted-foreground/70 hover:text-[#00e5a0] transition-colors"
          )}
        >
          <FileCode className="h-3.5 w-3.5" />
          {finding.file}
          {finding.line && (
            <span className="text-muted-foreground/40">:{finding.line}</span>
          )}
          <ExternalLink className="h-3 w-3 opacity-50" />
        </a>
      </div>
    </div>
  );
}
