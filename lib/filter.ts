import { Post } from "./types";

// gray-matter(js-yaml)가 YAML 날짜를 Date로 변환할 수 있어서 string/Date 모두 ms로 정규화
function toMillis(v: unknown): number {
  if (typeof v === "string") {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
    return m ? new Date(m[1]).getTime() : Number.POSITIVE_INFINITY;
  }
  if (v instanceof Date && !isNaN(v.getTime())) return v.getTime();
  return Number.POSITIVE_INFINITY;
}

export type SortKey = "modified" | "created" | "planned" | "published_at";
export type CategoryFilter = "all" | "A" | "B" | "C" | "자기계발" | "기타";
export type StatusVisibility = "active" | "rejected" | "all";

export function filterAndSort(
  posts: Post[],
  opts: {
    category?: CategoryFilter;
    statusVisibility?: StatusVisibility;
    sort?: SortKey;
    query?: string;
  }
): Post[] {
  const { category = "all", statusVisibility = "active", sort = "modified", query = "" } = opts;

  let filtered = posts;

  // status visibility
  if (statusVisibility === "active") {
    filtered = filtered.filter((p) => p.frontmatter.status !== "rejected");
  } else if (statusVisibility === "rejected") {
    // include rejected — no filter
  }

  // category
  if (category !== "all") {
    filtered = filtered.filter((p) => p.category === category);
  }

  // query (title + body)
  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.preview.toLowerCase().includes(q)
    );
  }

  // sort
  return [...filtered].sort((a, b) => {
    switch (sort) {
      case "modified":
        return b.modifiedAt.getTime() - a.modifiedAt.getTime();
      case "created":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "planned":
        return toMillis(a.frontmatter.date_planned) - toMillis(b.frontmatter.date_planned);
      case "published_at": {
        const am = toMillis(a.frontmatter.published_at);
        const bm = toMillis(b.frontmatter.published_at);
        // 발행일 최신순 (Infinity → 가장 뒤로)
        if (am === Number.POSITIVE_INFINITY && bm === Number.POSITIVE_INFINITY) return 0;
        if (am === Number.POSITIVE_INFINITY) return 1;
        if (bm === Number.POSITIVE_INFINITY) return -1;
        return bm - am;
      }
    }
  });
}
