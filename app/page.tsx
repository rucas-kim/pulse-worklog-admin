import Link from "next/link";
import { listPosts, listAllCounts } from "@/lib/posts";
import { Folder, FOLDERS } from "@/lib/types";
import { filterAndSort, CategoryFilter, StatusVisibility, SortKey } from "@/lib/filter";
import { TabBar } from "@/components/TabBar";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    folder?: string;
    category?: string;
    status?: string;
    sort?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const folder: Folder = FOLDERS.includes(params.folder as Folder)
    ? (params.folder as Folder)
    : "drafts";

  const defaultSort: SortKey =
    folder === "queue" ? "planned" : folder === "published" ? "published_at" : "modified";

  const [posts, counts] = await Promise.all([
    listPosts(folder),
    listAllCounts(),
  ]);

  const filtered = filterAndSort(posts, {
    category: (params.category ?? "all") as CategoryFilter,
    statusVisibility: (params.status ?? "active") as StatusVisibility,
    sort: (params.sort as SortKey) ?? defaultSort,
    query: params.q ?? "",
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="text-emerald-500">🌱</span> pulse.worklog
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            맥박의 콘텐츠 운영 — 학습 노트 관리 시스템
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/calendar"
            className="px-3 py-1.5 text-sm font-medium rounded-md text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            📅 캘린더
          </Link>
          <Link
            href="/new"
            className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            ＋ 새 글
          </Link>
        </div>
      </header>

      <TabBar current={folder} counts={counts} />
      <FilterBar />

      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          posts.length === 0 ? (
            <EmptyState folder={folder} />
          ) : (
            <div className="py-12 text-center text-sm text-zinc-500">
              🌱 검색·필터 결과가 없어요.
            </div>
          )
        ) : (
          filtered.map((post) => <PostCard key={post.filepath} post={post} />)
        )}
      </div>
    </main>
  );
}
