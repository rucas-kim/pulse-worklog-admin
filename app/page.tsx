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
      <header className="mb-8">
        <h1 className="text-2xl font-bold">
          <span className="text-emerald-500">🌱</span> pulse.worklog
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          맥박의 콘텐츠 운영 — 학습 노트 관리 시스템
        </p>
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
