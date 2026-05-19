import Link from "next/link";
import { listPosts } from "@/lib/posts";
import { Post } from "@/lib/types";
import {
  buildGrid,
  fmtMonth,
  parseMonth,
  shiftMonth,
  toIsoDay,
  todayIsoKst,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

type CellItem = { post: Post; kind: "queue" | "published" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const { year, month } = parseMonth(params.month);

  const [queuePosts, publishedPosts] = await Promise.all([
    listPosts("queue"),
    listPosts("published"),
  ]);

  const postsByDate = new Map<string, CellItem[]>();
  for (const p of queuePosts) {
    const k = toIsoDay(p.frontmatter.date_planned);
    if (!k) continue;
    const arr = postsByDate.get(k) ?? [];
    arr.push({ post: p, kind: "queue" });
    postsByDate.set(k, arr);
  }
  for (const p of publishedPosts) {
    const k = toIsoDay(p.frontmatter.published_at);
    if (!k) continue;
    const arr = postsByDate.get(k) ?? [];
    arr.push({ post: p, kind: "published" });
    postsByDate.set(k, arr);
  }

  const today = todayIsoKst();
  const cells = buildGrid(year, month, today);
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  const totalInMonth = cells
    .filter((c) => c.inMonth)
    .reduce((acc, c) => acc + (postsByDate.get(c.iso)?.length ?? 0), 0);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← 목록
        </Link>
      </div>

      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tabular-nums">
            <span className="text-emerald-500">📅</span> {year}년 {month}월
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            발행 예정 + 발행 완료 · 총 {totalInMonth}건
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/calendar?month=${fmtMonth(prev.year, prev.month)}`}
            className="px-3 py-1.5 text-sm rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="이전 달"
          >
            ←
          </Link>
          <Link
            href="/calendar"
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900"
          >
            오늘
          </Link>
          <Link
            href={`/calendar?month=${fmtMonth(next.year, next.month)}`}
            className="px-3 py-1.5 text-sm rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="다음 달"
          >
            →
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div
            key={d}
            className={`bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-center py-2 ${
              i === 0
                ? "text-red-500"
                : i === 6
                  ? "text-blue-500"
                  : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {d}
          </div>
        ))}

        {cells.map((c) => {
          const dow = c.date.getDay();
          const items = postsByDate.get(c.iso) ?? [];
          return (
            <div
              key={c.iso + (c.inMonth ? "" : "-pad")}
              className={`min-h-[96px] p-1.5 bg-white dark:bg-zinc-900 ${
                !c.inMonth ? "opacity-40" : ""
              } ${c.isToday ? "ring-2 ring-emerald-400 dark:ring-emerald-600 ring-inset" : ""}`}
            >
              <div
                className={`text-xs mb-1 font-mono ${
                  c.isToday
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : dow === 0
                      ? "text-red-500"
                      : dow === 6
                        ? "text-blue-500"
                        : "text-zinc-500"
                }`}
              >
                {c.date.getDate()}
                {c.isToday && <span className="ml-1 text-[10px]">오늘</span>}
              </div>
              <div className="space-y-0.5">
                {items.map(({ post, kind }) => (
                  <Link
                    key={post.filepath}
                    href={`/post/${post.folder}/${post.slug}`}
                    className={`block text-[11px] leading-tight px-1.5 py-1 rounded truncate ${
                      kind === "published"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950"
                    }`}
                    title={post.title}
                  >
                    {post.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded bg-blue-400" />
          발행 예정 (큐)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-500" />
          발행 완료
        </span>
      </div>

      {totalInMonth === 0 && (
        <div className="mt-8 text-center text-sm text-zinc-500">
          🌱 이 달에 발행 예정/완료된 글이 없어요.
        </div>
      )}
    </main>
  );
}
