"use client";

import { useState } from "react";
import {
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Clock,
  Shield,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/?$/;

type Status = "idle" | "loading" | "triggered" | "error";

interface SubmittedScan {
  url: string;
  owner: string;
  name: string;
  triggeredAt: Date;
}

export function SubmitSkillForm() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [scan, setScan] = useState<SubmittedScan | null>(null);

  const isValidUrl = GITHUB_URL_REGEX.test(url);
  const canSubmit = isValidUrl && status !== "loading";

  function parseUrl(input: string) {
    const match = input.match(GITHUB_URL_REGEX);
    if (!match) return null;
    return { owner: match[1], name: match[2] };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setErrorMsg("");

    const parsed = parseUrl(url);
    if (!parsed) return;

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (res.status === 202) {
        setStatus("triggered");
        setScan({
          url,
          owner: parsed.owner,
          name: parsed.name,
          triggeredAt: new Date(),
        });
        setUrl("");
      } else {
        const data = await res.json();
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again");
    }
  }

  function dismissScan() {
    setScan(null);
    setStatus("idle");
  }

  return (
    <div className="space-y-4">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="url"
              placeholder="https://github.com/owner/repo"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              disabled={status === "loading"}
              className={cn(
                "w-full rounded-lg border bg-[#12121a] py-3 px-4",
                "text-sm font-mono text-foreground placeholder:text-muted-foreground/40",
                "transition-all duration-200",
                "focus:outline-none",
                status === "loading" && "opacity-50 cursor-not-allowed",
                url && !isValidUrl
                  ? "border-[#ff2d55]/30 focus:border-[#ff2d55]/50"
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
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Scan Skill
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {status === "error" && errorMsg && (
          <div className="flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5 animate-fade-in-up bg-[#ff2d55]/10 text-[#ff2d55] border border-[#ff2d55]/20">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}
      </form>

      {/* Scan Results Panel — persists after submission */}
      {scan && status === "triggered" && (
        <div className="rounded-lg border border-[#00e5a0]/20 bg-[#0e0e16] overflow-hidden animate-fade-in-up">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#00e5a0]/5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#00e5a0]" />
              <span className="text-sm font-mono font-semibold text-[#00e5a0]">
                Scan Submitted
              </span>
            </div>
            <button
              onClick={dismissScan}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Panel body */}
          <div className="p-4 space-y-4">
            {/* Scanned URL */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/40">Repo:</span>
              <a
                href={scan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-white hover:text-[#00e5a0] transition-colors flex items-center gap-1"
              >
                {scan.owner}/{scan.name}
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            </div>

            {/* Progress steps */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-[#00e5a0] flex-shrink-0" />
                <span className="text-sm text-white/70">
                  Scan request sent to GitHub Actions
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 text-[#ff9a00] animate-spin flex-shrink-0" />
                <span className="text-sm text-white/70">
                  Cloning and scanning repository...
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-white/20 flex-shrink-0" />
                <span className="text-sm text-white/30">
                  Results committed to registry
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-white/20 flex-shrink-0" />
                <span className="text-sm text-white/30">
                  Report page generated
                </span>
              </div>
            </div>

            {/* Estimated time */}
            <div className="rounded-md bg-white/[0.03] border border-white/[0.06] px-4 py-3">
              <p className="text-sm text-white/60">
                <span className="text-white/80 font-medium">
                  This usually takes 1-3 minutes.
                </span>{" "}
                The GitHub Action is cloning the repo, scanning every file, and
                committing the results. When it&apos;s done, the report will appear at:
              </p>
              <a
                href={`/repo/${scan.owner}/${scan.name}`}
                className="mt-2 inline-flex items-center gap-2 text-sm font-mono text-[#00e5a0] hover:text-[#00e5a0]/80 transition-colors"
              >
                /repo/{scan.owner}/{scan.name}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "mamabearmehmi-hub"}/${process.env.NEXT_PUBLIC_GITHUB_REPO ?? "skill-sentry"}/actions`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5",
                  "text-xs font-mono border border-white/[0.06] bg-white/[0.03]",
                  "text-white/60 hover:text-white hover:border-white/[0.12] transition-all"
                )}
              >
                Watch the Action run
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={`/repo/${scan.owner}/${scan.name}`}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5",
                  "text-xs font-mono border border-[#00e5a0]/20 bg-[#00e5a0]/10",
                  "text-[#00e5a0] hover:bg-[#00e5a0]/15 transition-all"
                )}
              >
                Check for results
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
