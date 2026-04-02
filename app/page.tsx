import { Shield, Radar } from "lucide-react";
import { getRegistry, getStats } from "@/lib/registry";
import { DashboardClient } from "@/components/security/DashboardClient";
import { SubmitSkillForm } from "@/components/security/SubmitSkillForm";

export default function Dashboard() {
  const registry = getRegistry();
  const stats = getStats(registry);

  // Sort by stars descending (most popular first)
  const sortedEntries = [...registry.entries].sort(
    (a, b) => b.stars - a.stars
  );

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <header className="mb-8 animate-fade-in-up">
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

        {/* Submit Form */}
        <section
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
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

        {/* Interactive Dashboard (stats + ticker + table) */}
        <section
          className="mb-12 animate-fade-in-up"
          style={{ animationDelay: "160ms" }}
        >
          <DashboardClient entries={sortedEntries} stats={stats} />
        </section>

        {/* Honest disclaimer */}
        <section
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-5 py-4">
            <h3 className="text-xs font-mono font-semibold text-white/40 uppercase tracking-widest mb-2">
              What this is &amp; what it isn&apos;t
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Skill Sentry is a <span className="text-white/60">first-pass security scanner</span> — not a replacement for a full security audit.
              It catches common dangerous patterns like malicious install scripts, credential theft, and process execution
              using regex-based static analysis. It <span className="text-white/60">cannot</span> detect obfuscated code,
              sophisticated supply chain attacks, or threats hidden in compiled binaries. Think of it as a smoke detector,
              not a fire brigade — it tells you something&apos;s worth investigating, fast. For critical production systems,
              combine this with tools like Snyk, SonarQube, and manual code review.
            </p>
          </div>
        </section>

        {/* Registry Status */}
        <section
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: "350ms" }}
        >
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-5 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-mono font-semibold text-white/40 uppercase tracking-widest mb-1">
                  Registry Status
                </h3>
                <p className="text-sm text-white/50">
                  <span className="text-white/70 font-mono font-semibold">{registry.totalEntries}</span> skills scanned
                  &middot; Last updated{" "}
                  <span className="text-white/70 font-mono">{new Date(registry.lastUpdated).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5a0] opacity-40"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00e5a0]"></span>
                </span>
                <span className="text-xs font-mono text-white/40">
                  Auto-scanning daily at 06:00 UTC
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="border-t border-white/[0.04] pt-6 pb-4 animate-fade-in-up"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/50">
            <p className="font-mono">
              Static analysis only — no code executed. Ever.
            </p>
            <div className="flex items-center gap-4 font-mono">
              <a
                href="https://github.com/mamabearmehmi-hub/skill-sentry"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/70 transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://github.com/mamabearmehmi-hub/skill-sentry/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/70 transition-colors"
              >
                Report an Issue
              </a>
              <a
                href="https://github.com/mamabearmehmi-hub/skill-sentry/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/70 transition-colors"
              >
                Contribute
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
