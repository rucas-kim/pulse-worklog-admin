"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishPost } from "@/app/actions";
import { Folder } from "@/lib/types";

export function PublishButton({
  folder,
  slug,
  alreadyPublished,
}: {
  folder: Folder;
  slug: string;
  alreadyPublished?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [permalink, setPermalink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const result = await publishPost(folder, slug, permalink.trim() || undefined);
      if (result.ok) {
        setOpen(false);
        // 발행 후 _published 폴더의 같은 slug로 redirect
        router.push(`/post/published/${result.newSlug ?? slug}`);
        router.refresh();
      } else {
        setError(result.error ?? "발행 실패");
      }
    });
  }

  if (alreadyPublished) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        📤 발행
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => !pending && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-modal-title"
        >
          <div
            className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="publish-modal-title"
              className="text-lg font-semibold mb-4"
            >
              발행 확인
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-zinc-500 text-xs mb-1">발행 시간</div>
                <div className="font-mono text-emerald-600 dark:text-emerald-400">
                  {new Date().toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="permalink"
                  className="block text-zinc-500 text-xs mb-1"
                >
                  Permalink (선택 — 발행 후 입력해도 OK)
                </label>
                <input
                  id="permalink"
                  type="url"
                  value={permalink}
                  onChange={(e) => setPermalink(e.target.value)}
                  placeholder="https://www.threads.net/@pulse.worklog/post/..."
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 text-xs text-zinc-600 dark:text-zinc-400">
                확정 시:
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  <li>frontmatter <code>status: published</code> 갱신</li>
                  <li><code>published_at</code> 자동 입력</li>
                  <li>
                    파일을 <code>_published/{new Date().getFullYear()}-
                    {String(new Date().getMonth() + 1).padStart(2, "0")}/</code>로 이동
                  </li>
                </ul>
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="px-4 py-1.5 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handlePublish}
                disabled={pending}
                className="px-4 py-1.5 text-sm font-medium rounded-md bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {pending ? "발행 중..." : "확정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
