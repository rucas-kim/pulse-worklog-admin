import { Post } from "./types";

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
      case "planned": {
        const aDate = a.frontmatter.date_planned ?? "9999";
        const bDate = b.frontmatter.date_planned ?? "9999";
        return aDate.localeCompare(bDate);
      }
      case "published_at": {
        const aDate = a.frontmatter.published_at ?? "";
        const bDate = b.frontmatter.published_at ?? "";
        return bDate.localeCompare(aDate);
      }
    }
  });
}
