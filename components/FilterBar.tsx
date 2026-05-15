"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

type SortKey = "modified" | "created" | "planned" | "published_at";
type CategoryKey = "all" | "A" | "B" | "C" | "자기계발" | "기타";
type StatusKey = "all" | "active" | "rejected";

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const folder = params.get("folder") ?? "drafts";

  const category = (params.get("category") ?? "all") as CategoryKey;
  const statusVisibility = (params.get("status") ?? "active") as StatusKey;
  const sort = (params.get("sort") ?? "modified") as SortKey;
  const initialQ = params.get("q") ?? "";

  const [q, setQ] = useState(initialQ);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "" || value === "all" || value === "active" || value === "modified") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.set("folder", folder);
    startTransition(() => {
      router.push(`/?${next.toString()}`, { scroll: false });
    });
  }

  // 검색 debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== initialQ) updateParam("q", q);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mt-4 mb-2 flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 제목·본문 검색"
        className="flex-1 min-w-[200px] px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <Select
        value={category}
        onChange={(v) => updateParam("category", v)}
        label="영역"
        options={[
          { v: "all", label: "전체" },
          { v: "A", label: "A · 운영" },
          { v: "B", label: "B · 피부" },
          { v: "C", label: "C · AI" },
          { v: "자기계발", label: "자기계발" },
          { v: "기타", label: "기타" },
        ]}
      />

      <Select
        value={sort}
        onChange={(v) => updateParam("sort", v)}
        label="정렬"
        options={[
          { v: "modified", label: "최근 수정" },
          { v: "created", label: "작성순" },
          { v: "planned", label: "발행 예정일" },
          { v: "published_at", label: "발행일" },
        ]}
      />

      <Select
        value={statusVisibility}
        onChange={(v) => updateParam("status", v)}
        label="상태"
        options={[
          { v: "active", label: "활성" },
          { v: "rejected", label: "폐기 포함" },
          { v: "all", label: "전체" },
        ]}
      />

      {pending && (
        <span className="text-xs text-zinc-400">⋯</span>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: { v: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs">
      <span className="text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {options.map((opt) => (
          <option key={opt.v} value={opt.v}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
