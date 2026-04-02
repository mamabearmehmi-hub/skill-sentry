import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Shield,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  CircleCheck,
} from "lucide-react";
import { getRegistry, getEntryBySlug } from "@/lib/registry";
import { getVerdict } from "@/lib/registry-utils";
import { ReportHeader } from "@/components/security/ReportHeader";
import { FindingCard } from "@/components/security/FindingCard";
import { cn } from "@/lib/utils";

interface ReportPageProps {
  params: Promise<{ owner: string; name: string }>;
}

export async function generateMetadata({
  params,
}: ReportPageProps): Promise<Metadata> {
  const { owner, name } = await params;
  const entry = getEntryBySlug(owner, name);

  if (!entry) {
    return { title: "Not Found — Skill Sentry" };
  }

  const findingCount =
    entry.findings.length > 0
      ? `${entry.findings.length} findings`
      : "no threats detected";

  return {
    title: `${entry.name} — Skill Sentry Audit Report`,
    description: `Security audit for ${owner}/${name}: risk score ${entry.riskScore}/100, ${findingCount}. Static analysis by Skill Sentry.`,
  };
}

// Allow dynamic pages for repos scanned via the live API
export const dynamicParams = true;

export async function generateStaticParams() {
  const registry = getRegistry();
  return registry.entries.map((entry) => ({
    owner: entry.owner,
    name: entry.name,
  }));
}

const verdictStyles: Record<string, { bg: string; border: string; iconColor: string; headlineColor: string }> = {
  safe: {
    bg: "bg-[#00e5a0]/5",
    border: "border-[#00e5a0]/20",
    iconColor: "text-[#00e5a0]",
    headlineColor: "text-[#00e5a0]",
  },
  caution: {
    bg: "bg-[#ff9a00]/5",
    border: "border-[#ff9a00]/20",
    iconColor: "text-[#ff9a00]",
    headlineColor: "text-[#ff9a00]",
  },
  danger: {
    bg: "bg-[#ff2d55]/5",
    border: "border-[#ff2d55]/15",
    iconColor: "text-[#ff2d55]",
    headlineColor: "text-[#ff2d55]",
  },
  "do-not-install": {
    bg: "bg-[#ff0040]/8",
    border: "border-[#ff0040]/25",
    iconColor: "text-[#ff0040]",
    headlineColor: "text-[#ff0040]",
  },
  "verified-publisher": {
    bg: "bg-[#6366f1]/5",
    border: "border-[#6366f1]/20",
    iconColor: "text-[#818cf8]",
    headlineColor: "text-[#818cf8]",
  },
  "typosquat-warning": {
    bg: "bg-[#ff0040]/10",
    border: "border-[#ff0040]/30",
    iconColor: "text-[#ff0040]",
    headlineColor: "text-[#ff0040]",
  },
};

const verdictIcons: Record<string, typeof CircleCheck> = {
  safe: CircleCheck,
  caution: ShieldAlert,
  danger: ShieldAlert,
  "do-not-install": ShieldX,
  "verified-publisher": CircleCheck,
  "typosquat-warning": ShieldX,
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { owner, name } = await params;
  const entry = getEntryBySlug(owner, name);

  if (!entry) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-lg border border-white/[0.08] bg-[#12121a] p-8 text-center">
            <Shield className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <h1 className="text-xl font-mono font-semibold text-white mb-2">
              {owner}/{name}
            </h1>
            <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">
              This repo hasn&apos;t been scanned yet, or the results haven&apos;t been
              saved to the registry. Go back to the dashboard and paste the URL
              to scan it.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-mono font-medium bg-[#00e5a0]/10 border border-[#00e5a0]/20 text-[#00e5a0] hover:bg-[#00e5a0]/15 transition-all"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </main>
    );
  }

  const sortedFindings = [...entry.findings].sort((a, b) => b.score - a.score);
  const verdict = getVerdict(entry);
  const style = verdictStyles[verdict.recommendation];
  const VerdictIcon = verdictIcons[verdict.recommendation];

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Report Header */}
        <section className="mb-6 animate-fade-in-up">
          <ReportHeader entry={entry} />
        </section>

        {/* Verdict — "Should I install this?" */}
        <section
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          <div
            className={cn(
              "rounded-lg border p-6",
              style.bg,
              style.border,
              verdict.recommendation === "do-not-install" &&
                "animate-pulse-danger"
            )}
          >
            <div className="flex gap-4">
              <VerdictIcon
                className={cn("h-8 w-8 flex-shrink-0 mt-0.5", style.iconColor)}
              />
              <div>
                <h2
                  className={cn(
                    "text-xl font-semibold mb-2",
                    style.headlineColor
                  )}
                >
                  {verdict.headline}
                </h2>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {verdict.explanation}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Findings */}
        <section
          className="mb-12 animate-fade-in-up"
          style={{ animationDelay: "150ms" }}
        >
          {sortedFindings.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-[#ff2d55]" />
                <h2 className="text-lg font-mono font-semibold text-foreground">
                  What We Found
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({sortedFindings.length}{" "}
                    {sortedFindings.length === 1 ? "issue" : "issues"})
                  </span>
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Each card explains what was found and what it means in plain
                English. Click &quot;Technical details&quot; for the full
                breakdown.
              </p>
              <div className="space-y-3">
                {sortedFindings.map((finding, i) => (
                  <FindingCard
                    key={`${finding.ruleId}-${finding.file}-${i}`}
                    finding={finding}
                    repoUrl={entry.url}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-[#00e5a0]/20 bg-[#00e5a0]/5 p-8 text-center">
              <ShieldCheck className="h-12 w-12 text-[#00e5a0] mx-auto mb-3" />
              <h2 className="text-lg font-mono font-semibold text-[#00e5a0] mb-1">
                No Known Risk Patterns Detected
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                We scanned every file in this package against 11 detection
                rules and found no matches. This does not guarantee safety —
                always review code from unfamiliar authors before installing.
              </p>
            </div>
          )}
        </section>

        {/* Findings Summary Table */}
        {sortedFindings.length > 0 && (
          <section
            className="mb-12 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <h3 className="text-sm font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Finding Summary
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {(
                [
                  ["Critical", entry.totalFindings.critical, "#ff0040"],
                  ["High", entry.totalFindings.high, "#ff2d55"],
                  ["Medium", entry.totalFindings.medium, "#ff9a00"],
                  ["Low", entry.totalFindings.low, "#4ade80"],
                  ["Info", entry.totalFindings.info, "#8888a0"],
                ] as const
              ).map(([label, count, color]) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/[0.06] bg-[#12121a] p-3 text-center"
                >
                  <p
                    className="text-2xl font-mono font-bold"
                    style={{
                      color:
                        count > 0 ? color : "var(--muted-foreground)",
                    }}
                  >
                    {count}
                  </p>
                  <p className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer
          className="border-t border-white/[0.04] pt-6 pb-4 animate-fade-in-up"
          style={{ animationDelay: "250ms" }}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
            <Shield className="h-3.5 w-3.5" />
            <p className="font-mono">
              This report was generated by static analysis — no code was
              executed. Always review the source code yourself before installing.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
