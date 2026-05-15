"use client";

import { useState } from "react";
import { Section } from "@/lib/types";
import { Markdown } from "./Markdown";

export function SectionCard({
  section,
  highlightAsNext,
  onCopied,
}: {
  section: Section;
  highlightAsNext?: boolean;
  onCopied?: (id: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(section.content);
      setCopied(true);
      setError(null);
      onCopied?.(section.id);
      setTimeout(() => setCopied(false), 4000);
    } catch (e) {
      setError("복사 실패 — 브라우저 권한을 확인하세요");
      console.error(e);
    }
  }

  const isCopied = copied;
  const cardClass = isCopied
    ? "opacity-60 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
    : highlightAsNext
      ? "border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-100 dark:ring-emerald-950 bg-white dark:bg-zinc-900"
      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900";

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${cardClass}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-zinc-400 shrink-0">
            {section.order}
          </span>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">
            {section.title}
          </h3>
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            isCopied
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
          aria-label={`${section.title} 복사`}
        >
          {isCopied ? "복사됨 ✓" : "📋 복사"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}

      <Markdown content={section.content} />
    </div>
  );
}
