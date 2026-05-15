import { listPosts, listAllCounts } from "@/lib/posts";
import { Folder, FOLDERS } from "@/lib/types";
import { TabBar } from "@/components/TabBar";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const params = await searchParams;
  const folder: Folder = FOLDERS.includes(params.folder as Folder)
    ? (params.folder as Folder)
    : "drafts";

  const [posts, counts] = await Promise.all([
    listPosts(folder),
    listAllCounts(),
  ]);

  // 발행 대기: 발행 예정일 asc / 발행 완료: 발행일 desc / 그 외: 수정일 desc
  const sorted = [...posts].sort((a, b) => {
    if (folder === "queue") {
      const aDate = a.frontmatter.date_planned ?? "";
      const bDate = b.frontmatter.date_planned ?? "";
      return aDate.localeCompare(bDate);
    }
    if (folder === "published") {
      const aDate = a.frontmatter.published_at ?? "";
      const bDate = b.frontmatter.published_at ?? "";
      return bDate.localeCompare(aDate);
    }
    return b.modifiedAt.getTime() - a.modifiedAt.getTime();
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

      <div className="mt-6 space-y-3">
        {sorted.length === 0 ? (
          <EmptyState folder={folder} />
        ) : (
          sorted.map((post) => <PostCard key={post.filepath} post={post} />)
        )}
      </div>
    </main>
  );
}
