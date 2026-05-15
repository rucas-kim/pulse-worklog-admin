"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePostBody } from "@/app/actions";
import { Folder } from "@/lib/types";

export function PostEditor({
  folder,
  slug,
  initialBody,
}: {
  folder: Folder;
  slug: string;
  initialBody: string;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // 미저장 상태에서 페이지 이탈 경고
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function handleChange(value: string) {
    setBody(value);
    setDirty(value !== initialBody);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await savePostBody(folder, slug, body);
      if (result.ok) {
        setSaved(true);
        setDirty(false);
        setEditing(false);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? "저장 실패");
      }
    });
  }

  function handleCancel() {
    if (dirty && !confirm("수정 사항이 있어요. 정말 취소하시겠어요?")) return;
    setBody(initialBody);
    setDirty(false);
    setEditing(false);
    setError(null);
  }

  if (!editing) {
    return (
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          ✏️ 편집
        </button>
        {saved && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            ✓ 저장됨
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="text-xs text-zinc-500 flex items-center gap-2">
          마크다운 편집
          {dirty && (
            <span className="text-amber-600 dark:text-amber-400">· 수정됨</span>
          )}
        </div>
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
            disabled={pending || !dirty}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {pending ? "저장 중..." : "💾 저장"}
          </button>
        </div>
      </div>
      <textarea
        value={body}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full min-h-[300px] p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        spellCheck={false}
      />
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
