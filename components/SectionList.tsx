"use client";

import { useState } from "react";
import { Section } from "@/lib/types";
import { SectionCard } from "./SectionCard";

export function SectionList({ sections }: { sections: Section[] }) {
  const [copiedIds, setCopiedIds] = useState<Set<number>>(new Set());

  function handleCopied(id: number) {
    setCopiedIds((prev) => new Set(prev).add(id));
  }

  // 다음 미복사 카드 = 진행 표시
  const nextId = sections.find((s) => !copiedIds.has(s.id))?.id;
  const allCopied = sections.every((s) => copiedIds.has(s.id));

  return (
    <div>
      {sections.length > 1 && (
        <div className="mb-4 flex items-center gap-2 text-xs text-zinc-500">
          <span>복사 진행</span>
          <div className="flex gap-1">
            {sections.map((s) => (
              <span
                key={s.id}
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  copiedIds.has(s.id)
                    ? "bg-emerald-500"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
                aria-label={`${s.order} ${copiedIds.has(s.id) ? "복사됨" : "미복사"}`}
              />
            ))}
          </div>
          {allCopied && (
            <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ 모두 복사됨 — 발행 가능
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            highlightAsNext={section.id === nextId}
            onCopied={handleCopied}
          />
        ))}
      </div>
    </div>
  );
}
