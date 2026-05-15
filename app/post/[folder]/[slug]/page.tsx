import Link from "next/link";
import { notFound } from "next/navigation";
import { findPostBySlug } from "@/lib/posts";
import { parseSections } from "@/lib/sections";
import { Folder, FOLDERS } from "@/lib/types";
import { SectionList } from "@/components/SectionList";
import { CategoryBadge, StatusBadge } from "@/components/Badge";
import { PostEditor } from "@/components/PostEditor";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ folder: string; slug: string }>;
}) {
  const { folder: folderParam, slug } = await params;
  if (!FOLDERS.includes(folderParam as Folder)) notFound();
  const folder = folderParam as Folder;

  const post = await findPostBySlug(folder, slug);
  if (!post) notFound();

  const sections = parseSections(post.body, String(post.frontmatter.format ?? ""));
  const status = post.frontmatter.status;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href={{ pathname: "/", query: { folder } }}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← 목록
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-xl font-bold mb-2 leading-snug">
          {post.title}
        </h1>
        <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
          <CategoryBadge category={post.category} />
          {status && <StatusBadge status={status} />}
          <span className="text-zinc-400">·</span>
          <span>
            {post.modifiedAt.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}{" "}
            수정
          </span>
          {post.frontmatter.source_url && (
            <>
              <span className="text-zinc-400">·</span>
              <a
                href={post.frontmatter.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                원본 ↗
              </a>
            </>
          )}
        </div>
      </header>

      <PostEditor folder={folder} slug={slug} initialBody={post.body} />

      <SectionList sections={sections} />

      {post.frontmatter.published_at && (
        <div className="mt-8 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-sm">
          <span className="text-emerald-700 dark:text-emerald-300">
            🟢 발행됨 · {new Date(post.frontmatter.published_at).toLocaleString("ko-KR")}
          </span>
          {post.frontmatter.permalink && (
            <a
              href={post.frontmatter.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              게시물 보기 ↗
            </a>
          )}
        </div>
      )}
    </main>
  );
}
