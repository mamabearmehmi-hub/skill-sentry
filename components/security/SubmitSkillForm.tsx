"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

type Status = "idle" | "loading" | "success" | "error";

export function SubmitSkillForm() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const isValidUrl = GITHUB_URL_REGEX.test(url);
  const canSubmit = isValidUrl && status !== "loading";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (res.status === 202) {
        setStatus("success");
        setMessage("Scan triggered! Results will appear shortly.");
        setUrl("");
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 5000);
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 5000);
      }
    } catch {
      setStatus("error");
      setMessage("Network error — please try again");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* URL Input */}
        <div className="relative flex-1">
          <input
            type="url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
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
          {/* Inline validation hint */}
          {url && !isValidUrl && (
            <p className="absolute -bottom-5 left-0 text-[11px] text-[#ff2d55]/70 font-mono">
              Enter a valid GitHub URL
            </p>
          )}
        </div>

        {/* Submit Button */}
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
              Scanning...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Scan Skill
            </>
          )}
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5",
            "animate-fade-in-up",
            status === "success" &&
              "bg-[#00e5a0]/10 text-[#00e5a0] border border-[#00e5a0]/20",
            status === "error" &&
              "bg-[#ff2d55]/10 text-[#ff2d55] border border-[#ff2d55]/20"
          )}
        >
          {status === "success" && <CheckCircle className="h-4 w-4 flex-shrink-0" />}
          {status === "error" && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {message}
        </div>
      )}
    </form>
  );
}
