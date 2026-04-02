"use client";

import { useState } from "react";
import {
  Send,
  AlertCircle,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  X,
  ExternalLink,
  FileCode,
  MessageCircleWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RegistryEntry, AuditFinding } from "@/lib/types";
import { getVerdict, getPlainEnglish } from "@/lib/registry-utils";

const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/?$/;

type Status = "idle" | "scanning" | "complete" | "error";

export function SubmitSkillForm() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<RegistryEntry | null>(null);

  const isValidUrl = GITHUB_URL_REGEX.test(url);
  const canSubmit = isValidUrl && status === "idle";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("scanning");
    setErrorMsg("");
    setResult(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (data.status === "complete" && data.entry) {
        setResult(data.entry);
        setStatus("complete");
        setUrl("");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Scan failed — please try again");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again");
    }
  }

  function dismiss() {
    setStatus("idle");
    setResult(null);
  }

  return (
    <div className="space-y-4">
      {/* Input form — hide when results showing */}
      {status !== "complete" && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (status === "error") { setStatus("idle"); setErrorMsg(""); }
                }}
                disabled={status === "scanning"}
                className={cn(
                  "w-full rounded-lg border bg-[#12121a] py-3 px-4",
                  "text-sm font-mono text-foreground placeholder:text-muted-foreground/40",
                  "transition-all duration-200 focus:outline-none",
                  status === "scanning" && "opacity-50 cursor-not-allowed",
                  url && !isValidUrl
                    ? "border-[#ff2d55]/30"
                    : "border-white/[0.06] focus:border-[#00e5a0]/30 focus:shadow-[0_0_20px_rgba(0,229,160,0.06)]"
                )}
              />
              {url && !isValidUrl && (
                <p className="absolute -bottom-5 left-0 text-[11px] text-[#ff2d55]/70 font-mono">
                  Enter a valid GitHub URL
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3",
                "text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                canSubmit
                  ? "bg-[#00e5a0] text-[#0a0a0f] hover:bg-[#00cc8e] hover:shadow-[0_0_24px_rgba(0,229,160,0.2)] active:scale-[0.98]"
                  : "bg-[#00e5a0]/20 text-[#00e5a0]/40 cursor-not-allowed"
              )}
            >
              {status === "scanning" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</>
              ) : (
                <><Send className="h-4 w-4" /> Scan Skill</>
              )}
            </button>
          </div>

          {status === "error" && errorMsg && (
            <div className="flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5 animate-fade-in-up bg-[#ff2d55]/10 text-[#ff2d55] border border-[#ff2d55]/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}
        </form>
      )}

      {/* Scanning animation */}
      {status === "scanning" && (
        <div className="rounded-lg border border-[#00e5a0]/20 bg-[#0e0e16] p-6 animate-fade-in-up">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-[#00e5a0]/20 flex items-center justify-center">
                <Shield className="h-7 w-7 text-[#00e5a0]" />
              </div>
              <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-t-[#00e5a0] animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-mono font-semibold text-white mb-1">
                Scanning...
              </h3>
              <p className="text-sm text-white/50">
                Cloning repo and checking every file against 11 security rules. This takes 5-15 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instant results */}
      {status === "complete" && result && (
        <div className="rounded-lg border border-white/[0.08] bg-[#0e0e16] overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="h-4 w-4 text-[#00e5a0] flex-shrink-0" />
              <span className="text-sm font-mono font-semibold text-white truncate">
                {result.owner}/{result.name}
              </span>
            </div>
            <button
              onClick={dismiss}
              className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0 ml-2"
              title="Close and scan another"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Verdict */}
          <VerdictBanner entry={result} />

          {/* Findings (top 3) */}
          {result.findings.length > 0 && (
            <div className="px-4 sm:px-5 py-4 space-y-3 border-t border-white/[0.04]">
              <h4 className="text-xs font-mono font-semibold text-white/50 uppercase tracking-widest">
                What We Found ({result.findings.length} {result.findings.length === 1 ? "issue" : "issues"})
              </h4>
              {result.findings.map((f, i) => (
                <InlineFinding key={`${f.ruleId}-${i}`} finding={f} repoUrl={result.url} />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="px-4 sm:px-5 py-3 border-t border-white/[0.04] flex flex-col sm:flex-row gap-2">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 flex-1",
                "text-sm font-mono font-medium",
                "border border-white/[0.08] bg-white/[0.03] text-white/60",
                "hover:text-white hover:border-white/[0.15] transition-all"
              )}
            >
              View on GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={dismiss}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5",
                "text-sm font-mono border border-white/[0.06] bg-white/[0.03]",
                "text-white/50 hover:text-white hover:border-white/[0.12] transition-all"
              )}
            >
              Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VerdictBanner({ entry }: { entry: RegistryEntry }) {
  const verdict = getVerdict(entry);

  const styles: Record<string, { bg: string; text: string }> = {
    safe: { bg: "bg-[#00e5a0]/5", text: "text-[#00e5a0]" },
    caution: { bg: "bg-[#ff9a00]/5", text: "text-[#ff9a00]" },
    danger: { bg: "bg-[#ff2d55]/5", text: "text-[#ff2d55]" },
    "do-not-install": { bg: "bg-[#ff0040]/8", text: "text-[#ff0040]" },
    "verified-publisher": { bg: "bg-[#6366f1]/5", text: "text-[#818cf8]" },
    "typosquat-warning": { bg: "bg-[#ff0040]/10", text: "text-[#ff0040]" },
  };

  const icons: Record<string, typeof ShieldCheck> = {
    safe: ShieldCheck,
    caution: ShieldAlert,
    danger: ShieldAlert,
    "do-not-install": ShieldX,
    "verified-publisher": ShieldCheck,
    "typosquat-warning": ShieldX,
  };

  const s = styles[verdict.recommendation];
  const Icon = icons[verdict.recommendation];

  return (
    <div className={cn("px-4 sm:px-5 py-4", s.bg)}>
      <div className="flex gap-3">
        <Icon className={cn("h-6 w-6 flex-shrink-0 mt-0.5", s.text)} />
        <div>
          <h3 className={cn("text-base font-semibold mb-1", s.text)}>
            {verdict.headline}
          </h3>
          <p className="text-sm text-white/60 leading-relaxed">
            {verdict.explanation}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-white/40">
            <span>Risk: {entry.riskScore}/100</span>
            <span>{entry.scannedFiles} files scanned</span>
            <span>{entry.findings.length} findings</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineFinding({ finding, repoUrl }: { finding: AuditFinding; repoUrl: string }) {
  const plain = getPlainEnglish(finding);
  const sourceLink = finding.line
    ? `${repoUrl}/blob/main/${finding.file}#L${finding.line}`
    : `${repoUrl}/blob/main/${finding.file}`;

  const severityColor: Record<string, string> = {
    CRITICAL: "text-[#ff0040] border-[#ff0040]/20 bg-[#ff0040]/5",
    HIGH: "text-[#ff2d55] border-[#ff2d55]/15 bg-[#ff2d55]/5",
    MEDIUM: "text-[#ff9a00] border-[#ff9a00]/15 bg-[#ff9a00]/5",
    LOW: "text-[#4ade80] border-[#4ade80]/15 bg-[#4ade80]/5",
    INFO: "text-white/50 border-white/10 bg-white/[0.02]",
  };

  return (
    <div className={cn("rounded-md border px-3 py-2.5", severityColor[finding.severity])}>
      <div className="flex items-start gap-2">
        <MessageCircleWarning className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 opacity-70" />
        <div className="min-w-0">
          <p className="text-xs leading-relaxed opacity-90">{plain}</p>
          <a
            href={sourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-mono opacity-50 hover:opacity-80 transition-opacity"
          >
            <FileCode className="h-3 w-3" />
            {finding.file}{finding.line && <>:{finding.line}</>}
          </a>
        </div>
      </div>
    </div>
  );
}
