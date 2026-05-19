import { describe, it, expect } from "vitest";
import { filterAndSort } from "@/lib/filter";
import { Post, Frontmatter, Category } from "@/lib/types";

function mkPost(over: Partial<Post> & { frontmatter?: Partial<Frontmatter> } = {}): Post {
  return {
    slug: over.slug ?? "test",
    folder: over.folder ?? "drafts",
    filepath: over.filepath ?? "/tmp/test.md",
    filename: over.filename ?? "test.md",
    relativePath: over.relativePath ?? "_drafts/test.md",
    frontmatter: (over.frontmatter ?? {}) as Frontmatter,
    body: over.body ?? "본문",
    title: over.title ?? "제목",
    preview: over.preview ?? "미리보기",
    category: (over.category ?? "기타") as Category,
    modifiedAt: over.modifiedAt ?? new Date("2026-05-10T00:00:00.000Z"),
    createdAt: over.createdAt ?? new Date("2026-05-01T00:00:00.000Z"),
  };
}

describe("filterAndSort - status visibility", () => {
  const active = mkPost({ slug: "active", frontmatter: { status: "candidate" } });
  const rejected = mkPost({ slug: "rejected", frontmatter: { status: "rejected" } });

  it("active(default)는 rejected 제외", () => {
    const out = filterAndSort([active, rejected], {});
    expect(out.map((p) => p.slug)).toEqual(["active"]);
  });

  it("rejected는 모두 포함", () => {
    const out = filterAndSort([active, rejected], { statusVisibility: "rejected" });
    expect(out.length).toBe(2);
  });

  it("all도 모두 포함", () => {
    const out = filterAndSort([active, rejected], { statusVisibility: "all" });
    expect(out.length).toBe(2);
  });
});

describe("filterAndSort - category", () => {
  const a = mkPost({ slug: "a", category: "A" });
  const b = mkPost({ slug: "b", category: "B" });
  const c = mkPost({ slug: "c", category: "C" });

  it("all은 전부 통과", () => {
    const out = filterAndSort([a, b, c], { category: "all" });
    expect(out.length).toBe(3);
  });

  it("A 선택은 A만", () => {
    const out = filterAndSort([a, b, c], { category: "A" });
    expect(out.map((p) => p.slug)).toEqual(["a"]);
  });
});

describe("filterAndSort - query", () => {
  const p1 = mkPost({ slug: "p1", title: "디마프 인스타", body: "saves 신호" });
  const p2 = mkPost({ slug: "p2", title: "AI 도구", body: "비교에 하루를 썼다" });

  it("제목 부분 매칭", () => {
    const out = filterAndSort([p1, p2], { query: "디마프" });
    expect(out.map((p) => p.slug)).toEqual(["p1"]);
  });

  it("본문 부분 매칭", () => {
    const out = filterAndSort([p1, p2], { query: "saves" });
    expect(out.map((p) => p.slug)).toEqual(["p1"]);
  });

  it("대소문자 무시", () => {
    const out = filterAndSort([p1, p2], { query: "AI" });
    expect(out.map((p) => p.slug)).toEqual(["p2"]);
  });

  it("빈 쿼리는 전부 통과", () => {
    const out = filterAndSort([p1, p2], { query: "" });
    expect(out.length).toBe(2);
  });
});

describe("filterAndSort - sort planned (Date/string mix)", () => {
  // 이전 버그: Date 객체가 들어가면 localeCompare 깨짐. 이 케이스가 회귀를 잡음.
  const dateObj = mkPost({
    slug: "as-date",
    frontmatter: { date_planned: new Date("2026-05-14T00:00:00.000Z") } as unknown as Frontmatter,
  });
  const dateStr = mkPost({
    slug: "as-string",
    frontmatter: { date_planned: "2026-05-12" },
  });
  const missing = mkPost({ slug: "missing", frontmatter: {} });

  it("Date 객체와 string이 혼재해도 깨지지 않고 오름차순 정렬", () => {
    const out = filterAndSort([dateObj, dateStr, missing], { sort: "planned" });
    expect(out.map((p) => p.slug)).toEqual(["as-string", "as-date", "missing"]);
  });
});

describe("filterAndSort - sort published_at", () => {
  const older = mkPost({
    slug: "older",
    frontmatter: { published_at: "2026-05-01T10:00+09:00" },
  });
  const newer = mkPost({
    slug: "newer",
    frontmatter: { published_at: "2026-05-15T10:00+09:00" },
  });
  const unpublished = mkPost({ slug: "unpublished", frontmatter: {} });

  it("발행일 내림차순 (최신이 먼저), 미발행은 가장 뒤", () => {
    const out = filterAndSort([older, newer, unpublished], { sort: "published_at" });
    expect(out.map((p) => p.slug)).toEqual(["newer", "older", "unpublished"]);
  });

  it("발행일이 Date 객체로 들어와도 정상 정렬", () => {
    const dateObj = mkPost({
      slug: "as-date",
      frontmatter: {
        published_at: new Date("2026-05-10T10:00:00.000Z"),
      } as unknown as Frontmatter,
    });
    const out = filterAndSort([older, dateObj, newer], { sort: "published_at" });
    expect(out.map((p) => p.slug)).toEqual(["newer", "as-date", "older"]);
  });
});

describe("filterAndSort - sort modified/created", () => {
  const a = mkPost({
    slug: "a",
    modifiedAt: new Date("2026-05-10T00:00:00.000Z"),
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
  });
  const b = mkPost({
    slug: "b",
    modifiedAt: new Date("2026-05-15T00:00:00.000Z"),
    createdAt: new Date("2026-05-05T00:00:00.000Z"),
  });

  it("modified는 최신 수정이 먼저", () => {
    const out = filterAndSort([a, b], { sort: "modified" });
    expect(out.map((p) => p.slug)).toEqual(["b", "a"]);
  });

  it("created는 최신 생성이 먼저", () => {
    const out = filterAndSort([a, b], { sort: "created" });
    expect(out.map((p) => p.slug)).toEqual(["b", "a"]);
  });
});
