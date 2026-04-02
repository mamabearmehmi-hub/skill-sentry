import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shield, AlertTriangle, ShieldCheck } from "lucide-react";
import { getRegistry, getEntryBySlug } from "@/lib/registry";
import { ReportHeader } from "@/components/security/ReportHeader";
import { FindingCard } from "@/components/security/FindingCard";

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

export async function generateStaticParams() {
  const registry = getRegistry();
  return registry.entries.map((entry) => ({
    owner: entry.owner,
    name: entry.name,
  }));
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { owner, name } = await params;
  const entry = getEntryBySlug(owner, name);

  if (!entry) {
    notFound();
  }

  const sortedFindings = [...entry.findings].sort((a, b) => b.score - a.score);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Report Header */}
        <section className="mb-8 animate-fade-in-up">
          <ReportHeader entry={entry} />
        </section>

        {/* Findings */}
        <section
          className="mb-12 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          {sortedFindings.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-[#ff2d55]" />
                <h2 className="text-lg font-mono font-semibold text-foreground">
                  Security Findings
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({sortedFindings.length})
                  </span>
                </h2>
              </div>
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
                No Security Threats Detected
              </h2>
              <p className="text-sm text-muted-foreground">
                This skill passed all {11} security checks. No dangerous
                patterns were found in the source code or package configuration.
              </p>
            </div>
          )}
        </section>

        {/* Findings Summary Table */}
        {sortedFindings.length > 0 && (
          <section
            className="mb-12 animate-fade-in-up"
            style={{ animationDelay: "150ms" }}
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
                    style={{ color: count > 0 ? color : "var(--muted-foreground)" }}
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
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
            <Shield className="h-3.5 w-3.5" />
            <p className="font-mono">
              This report was generated by static analysis — no code was
              executed.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
