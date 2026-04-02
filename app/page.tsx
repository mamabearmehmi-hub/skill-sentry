import { Shield, Radar } from "lucide-react";
import { getRegistry, getStats } from "@/lib/registry";
import { StatsHeader } from "@/components/security/StatsHeader";
import { SkillsTable } from "@/components/security/SkillsTable";
import { SubmitSkillForm } from "@/components/security/SubmitSkillForm";

export default function Dashboard() {
  const registry = getRegistry();
  const stats = getStats(registry);

  // Sort by risk score descending (highest threat first)
  const sortedEntries = [...registry.entries].sort(
    (a, b) => b.riskScore - a.riskScore
  );

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <header className="mb-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-[#00e5a0]/10 p-2">
              <Shield className="h-7 w-7 text-[#00e5a0]" />
            </div>
            <h1 className="text-3xl font-mono font-bold tracking-tight text-foreground">
              SKILL SENTRY
            </h1>
          </div>
          <p className="text-muted-foreground text-base max-w-xl">
            Safely vet Claude skills and MCP servers before installing them.
            Static analysis only — no code is ever executed.
          </p>

          {/* Decorative divider */}
          <div className="mt-6 h-px bg-gradient-to-r from-[#00e5a0]/20 via-white/[0.06] to-transparent" />
        </header>

        {/* Stats */}
        <section
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <StatsHeader
            totalScanned={stats.totalScanned}
            verifiedSafe={stats.verifiedSafe}
            averageRisk={stats.averageRisk}
            criticalCount={stats.criticalCount}
          />
        </section>

        {/* Submit Form */}
        <section
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: "150ms" }}
        >
          <div className="rounded-lg border border-white/[0.06] bg-[#12121a] p-6">
            <div className="flex items-center gap-2 mb-2">
              <Radar className="h-5 w-5 text-[#00e5a0]" />
              <h2 className="text-lg font-mono font-semibold text-foreground">
                Submit a Skill for Audit
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Paste any GitHub URL — we&apos;ll scan it for security threats.
              No code is executed.
            </p>
            <SubmitSkillForm />
          </div>
        </section>

        {/* Skills Table */}
        <section
          className="mb-12 animate-fade-in-up"
          style={{ animationDelay: "250ms" }}
        >
          <SkillsTable entries={sortedEntries} />
        </section>

        {/* Footer trust line */}
        <footer
          className="border-t border-white/[0.04] pt-6 pb-4 animate-fade-in-up"
          style={{ animationDelay: "350ms" }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/50">
            <p className="font-mono">
              Static analysis only — no code executed. Ever.
            </p>
            <p className="font-mono">
              Registry: {registry.totalEntries} skills &middot; Updated{" "}
              {new Date(registry.lastUpdated).toLocaleDateString()}
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
