import Link from "next/link";
import { Post } from "@/lib/types";
import { CategoryBadge, StatusBadge } from "./Badge";

function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "방금 전";
  if (diff < hour) return `${Math.floor(diff / minute)}분 전`;
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}일 전`;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function PostCard({ post }: { post: Post }) {
  const status = post.frontmatter.status;
  const score = normalizeScore(post.frontmatter.score);

  return (
    <Link
      href={`/post/${post.folder}/${post.slug}`}
      className="block p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="text-base font-semibold leading-snug line-clamp-2">
          {post.title}
        </h2>
        <div className="flex items-center gap-1.5 shrink-0">
          {score !== null && <ScoreStars score={score} />}
          <CategoryBadge category={post.category} />
        </div>
      </div>

      {post.preview && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
          {post.preview}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2 flex-wrap">
          {status && <StatusBadge status={status} />}
          {post.frontmatter.format && (
            <span className="text-zinc-400">{labelFormat(post.frontmatter.format)}</span>
          )}
        </div>
        <time
          dateTime={post.modifiedAt.toISOString()}
          className="shrink-0"
          title={post.modifiedAt.toLocaleString("ko-KR")}
        >
          {formatRelativeDate(post.modifiedAt)}
        </time>
      </div>
    </Link>
  );
}

function labelFormat(format: string): string {
  switch (format) {
    case "threads":
      return "스레드";
    case "instagram_caption":
      return "인스타 캡션";
    case "caroussel":
    case "carousel":
      return "캐러셀";
    default:
      return format;
  }
}

// 1-5 사이로 안전 변환. 그 밖의 값(0, 6, "abc", null)은 null 반환 → 비표시
export function normalizeScore(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (v < 1 || v > 5) return null;
  return Math.round(v);
}

function ScoreStars({ score }: { score: number }) {
  return (
    <span
      className="inline-flex items-center text-amber-500"
      title={`자가 추천도 ${score}/5`}
      aria-label={`자가 추천도 ${score}점, 5점 만점`}
    >
      {"★".repeat(score)}
      <span className="text-zinc-300 dark:text-zinc-700">
        {"★".repeat(5 - score)}
      </span>
    </span>
  );
}
