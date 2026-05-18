"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { movePost } from "@/app/actions";
import { Folder, FOLDER_LABEL } from "@/lib/types";

const MOVE_TARGETS: Folder[] = ["ideas", "drafts", "queue"];

export function MoveButtons({
  folder,
  slug,
}: {
  folder: Folder;
  slug: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingTarget, setPendingTarget] = useState<Folder | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // 발행 완료 글은 이동 불가
  if (folder === "published") return null;

  const targets = MOVE_TARGETS.filter((t) => t !== folder);

  function handleMove(target: Folder) {
    setError(null);
    setPendingTarget(target);
    startTransition(async () => {
      const result = await movePost(folder, slug, target);
      setPendingTarget(null);
      if (result.ok && result.newFolder) {
        router.push(`/post/${result.newFolder}/${slug}`);
        router.refresh();
      } else {
        setError(result.error ?? "이동 실패");
      }
    });
  }

  return (
    <div className="mb-4 flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-500">이동:</span>
      {targets.map((t) => {
        const isPending = pendingTarget === t;
        return (
          <button
            key={t}
            onClick={() => handleMove(t)}
            disabled={pendingTarget !== null}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {isPending ? "이동 중..." : `→ ${FOLDER_LABEL[t]}`}
          </button>
        );
      })}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
