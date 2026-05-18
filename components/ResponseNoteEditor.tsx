"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setResponseNote } from "@/app/actions";
import { Folder } from "@/lib/types";

export function ResponseNoteEditor({
  folder,
  slug,
  publishedAt,
  initialNote,
  daysSincePublished = 0,
}: {
  folder: Folder;
  slug: string;
  publishedAt?: string;
  initialNote?: string;
  daysSincePublished?: number;
}) {
  const [note, setNote] = useState(initialNote ?? "");
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (folder !== "published") return null;

  const daysSince = daysSincePublished;
  const isOverdue = daysSince >= 7 && !initialNote;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await setResponseNote(folder, slug, note);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "저장 실패");
      }
    });
  }

  function handleCancel() {
    setNote(initialNote ?? "");
    setEditing(false);
    setError(null);
  }

  if (!editing) {
    return (
      <div
        className={`mt-4 p-4 rounded-lg border text-sm ${
          isOverdue
            ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
            : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-zinc-500">
            반응 메모 (response_note)
            {publishedAt && (
              <span className="ml-1.5 text-zinc-400">
                · 발행 {daysSince}일 경과
              </span>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
          >
            {initialNote ? "✏️ 수정" : "📝 작성"}
          </button>
        </div>
        {initialNote ? (
          <p className="mt-2 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
            {initialNote}
          </p>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">
            {isOverdue
              ? "🟡 발행 일주일이 지났어요. 댓글·저장·DM 한 줄 정리해두면 회고에 도움돼요."
              : "발행 일주일 뒤에 댓글·저장·DM 한 줄을 정리해보세요."}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-xs text-zinc-500">반응 메모 작성</div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            disabled={pending}
            className="px-3 py-1.5 text-xs font-medium rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={pending}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {pending ? "저장 중..." : "💾 저장"}
          </button>
        </div>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="댓글 N건 / 저장 N건 / DM 한 마디 등 — 한 줄로 정리"
        className="w-full min-h-[80px] p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
