import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import matter from "gray-matter";

// next/cache가 Next 런타임 밖에서 import되면 깨지므로 mock
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// import는 mock 이후에야 안전
import {
  createPost,
  movePost,
  publishPost,
  savePostBody,
  setResponseNote,
} from "@/app/actions";

let tmp: string;
const orig = process.env.CONTENT_DIR;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pulse-worklog-actions-"));
  process.env.CONTENT_DIR = tmp;
  for (const sub of ["_ideas", "_drafts", "_queue", "_published"]) {
    fs.mkdirSync(path.join(tmp, sub), { recursive: true });
  }
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  if (orig === undefined) delete process.env.CONTENT_DIR;
  else process.env.CONTENT_DIR = orig;
});

function readFm(p: string) {
  const raw = fs.readFileSync(p, "utf-8");
  return matter(raw);
}

// ─────────────────────────────────────────────────────────
// createPost
// ─────────────────────────────────────────────────────────
describe("createPost", () => {
  it("drafts에 candidate-{slug}.md 파일명 + status: candidate + checklist 4 false", async () => {
    const result = await createPost({
      folder: "drafts",
      slug: "my-finding",
      category: "A",
      format: "instagram_caption",
      body: "본문 한 줄",
    });
    expect(result.ok).toBe(true);
    expect(result.folder).toBe("drafts");
    expect(result.slug).toBe("candidate-my-finding");

    const file = path.join(tmp, "_drafts", "candidate-my-finding.md");
    expect(fs.existsSync(file)).toBe(true);
    const { data, content } = readFm(file);
    expect(data.status).toBe("candidate");
    expect(data.category).toBe("A (운영·콘텐츠 관찰)");
    expect(data.format).toBe("instagram_caption");
    expect(data.account).toBe("pulse.worklog");
    expect(data.checklist).toEqual({
      role_fit: false,
      source: false,
      finding: false,
      tone: false,
    });
    expect(content.trim()).toBe("본문 한 줄");
  });

  it("queue + date_planned면 YYYY-MM-DD-{slug}.md", async () => {
    const result = await createPost({
      folder: "queue",
      slug: "japan-trip",
      category: "A",
      format: "threads",
      datePlanned: "2026-05-22",
      body: "# 메인\n본문",
    });
    expect(result.ok).toBe(true);
    expect(result.slug).toBe("2026-05-22-japan-trip");
    const file = path.join(tmp, "_queue", "2026-05-22-japan-trip.md");
    expect(fs.existsSync(file)).toBe(true);
    const { data } = readFm(file);
    expect(data.status).toBe("queued");
    expect(data.date_planned).toBe("2026-05-22");
  });

  it("ideas는 {slug}.md", async () => {
    const r = await createPost({
      folder: "ideas",
      slug: "spark",
      body: "idea",
    });
    expect(r.ok).toBe(true);
    expect(fs.existsSync(path.join(tmp, "_ideas", "spark.md"))).toBe(true);
    const { data } = readFm(path.join(tmp, "_ideas", "spark.md"));
    expect(data.status).toBe("idea");
  });

  it("slug가 kebab-case 위반이면 reject", async () => {
    const r1 = await createPost({ folder: "drafts", slug: "Bad Slug", body: "x" });
    expect(r1.ok).toBe(false);
    expect(r1.error).toMatch(/소문자/);

    const r2 = await createPost({ folder: "drafts", slug: "한글슬러그", body: "x" });
    expect(r2.ok).toBe(false);

    const r3 = await createPost({ folder: "drafts", slug: "trailing-", body: "x" });
    expect(r3.ok).toBe(false);
  });

  it("본문 빈 문자열이면 reject", async () => {
    const r = await createPost({ folder: "drafts", slug: "x", body: "   \n  " });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/본문/);
  });

  it("date_planned 형식 위반이면 reject", async () => {
    const r = await createPost({
      folder: "queue",
      slug: "x",
      datePlanned: "2026/05/22",
      body: "본문",
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/YYYY-MM-DD/);
  });

  it("동명 파일 충돌 시 reject (덮어쓰기 차단)", async () => {
    const first = await createPost({ folder: "drafts", slug: "dup", body: "1" });
    expect(first.ok).toBe(true);
    const second = await createPost({ folder: "drafts", slug: "dup", body: "2" });
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/이미 있어요/);
  });
});

// ─────────────────────────────────────────────────────────
// movePost
// ─────────────────────────────────────────────────────────
describe("movePost", () => {
  beforeEach(async () => {
    await createPost({ folder: "drafts", slug: "to-move", category: "A", body: "본문" });
  });

  it("drafts → queue 이동 시 파일 이동 + status: queued", async () => {
    const r = await movePost("drafts", "candidate-to-move", "queue");
    expect(r.ok).toBe(true);
    expect(r.newFolder).toBe("queue");
    expect(fs.existsSync(path.join(tmp, "_drafts", "candidate-to-move.md"))).toBe(false);
    const target = path.join(tmp, "_queue", "candidate-to-move.md");
    expect(fs.existsSync(target)).toBe(true);
    const { data } = readFm(target);
    expect(data.status).toBe("queued");
  });

  it("queue → ideas는 status: idea", async () => {
    await movePost("drafts", "candidate-to-move", "queue");
    const r = await movePost("queue", "candidate-to-move", "ideas");
    expect(r.ok).toBe(true);
    const { data } = readFm(path.join(tmp, "_ideas", "candidate-to-move.md"));
    expect(data.status).toBe("idea");
  });

  it("same-folder 이동은 reject", async () => {
    const r = await movePost("drafts", "candidate-to-move", "drafts");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/같은 폴더/);
  });

  it("published 대상은 거부 (발행은 publishPost로)", async () => {
    const r = await movePost("drafts", "candidate-to-move", "published");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/발행 버튼/);
  });

  it("target에 동명 파일이 있으면 거부 (덮어쓰기 차단)", async () => {
    // queue에 같은 이름 미리 둠
    fs.writeFileSync(
      path.join(tmp, "_queue", "candidate-to-move.md"),
      "---\nstatus: queued\n---\n기존 본문",
      "utf-8"
    );
    const r = await movePost("drafts", "candidate-to-move", "queue");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/이미 있어요/);
    // 원본 파일은 그대로 (이동 실패)
    expect(fs.existsSync(path.join(tmp, "_drafts", "candidate-to-move.md"))).toBe(true);
  });

  it("없는 slug는 not found", async () => {
    const r = await movePost("drafts", "ghost", "queue");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });
});

// ─────────────────────────────────────────────────────────
// publishPost
// ─────────────────────────────────────────────────────────
describe("publishPost", () => {
  it("드래프트에서 발행 시 _published/YYYY-MM/로 이동 + status:published + published_at", async () => {
    await createPost({
      folder: "drafts",
      slug: "ready",
      category: "A",
      body: "본문",
    });
    const r = await publishPost("drafts", "candidate-ready", "https://example.com/p/1");
    expect(r.ok).toBe(true);

    const now = new Date();
    const yyyymm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const target = path.join(tmp, "_published", yyyymm, "candidate-ready.md");
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.existsSync(path.join(tmp, "_drafts", "candidate-ready.md"))).toBe(false);

    const { data } = readFm(target);
    expect(data.status).toBe("published");
    expect(typeof data.published_at).toBe("string");
    expect(data.published_at).toMatch(/\+09:00$/);
    expect(data.permalink).toBe("https://example.com/p/1");
  });

  it("permalink 생략 가능", async () => {
    await createPost({ folder: "drafts", slug: "no-link", body: "본문" });
    const r = await publishPost("drafts", "candidate-no-link");
    expect(r.ok).toBe(true);
    const yyyymm = new Date().toISOString().slice(0, 7);
    const { data } = readFm(
      path.join(tmp, "_published", yyyymm, "candidate-no-link.md")
    );
    expect(data.permalink).toBeUndefined();
  });

  it("없는 slug는 not found", async () => {
    const r = await publishPost("drafts", "ghost");
    expect(r.ok).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// savePostBody
// ─────────────────────────────────────────────────────────
describe("savePostBody", () => {
  it("본문 갱신 시 frontmatter는 보존", async () => {
    await createPost({
      folder: "drafts",
      slug: "to-edit",
      category: "B",
      body: "기존 본문",
    });
    const file = path.join(tmp, "_drafts", "candidate-to-edit.md");
    const before = readFm(file);

    const r = await savePostBody("drafts", "candidate-to-edit", "새 본문 한 줄");
    expect(r.ok).toBe(true);

    const after = readFm(file);
    expect(after.content.trim()).toBe("새 본문 한 줄");
    // frontmatter 모두 보존
    expect(after.data.status).toBe(before.data.status);
    expect(after.data.category).toBe(before.data.category);
    expect(after.data.checklist).toEqual(before.data.checklist);
  });

  it("없는 slug는 not found", async () => {
    const r = await savePostBody("drafts", "ghost", "x");
    expect(r.ok).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// setResponseNote
// ─────────────────────────────────────────────────────────
describe("setResponseNote", () => {
  it("note 추가 + 갱신 + 빈 문자열로 삭제", async () => {
    // 발행된 상태의 파일을 직접 만들어두기
    const yyyymm = "2026-05";
    const dir = path.join(tmp, "_published", yyyymm);
    fs.mkdirSync(dir, { recursive: true });
    const slug = "candidate-with-note";
    fs.writeFileSync(
      path.join(dir, `${slug}.md`),
      `---
status: published
published_at: '2026-05-10T13:00+09:00'
---
본문
`,
      "utf-8"
    );

    // 1) 추가
    const r1 = await setResponseNote("published", slug, "댓글 12건, 저장 3건");
    expect(r1.ok).toBe(true);
    const { data: d1 } = readFm(path.join(dir, `${slug}.md`));
    expect(d1.response_note).toBe("댓글 12건, 저장 3건");

    // 2) 갱신
    const r2 = await setResponseNote("published", slug, "댓글 30건으로 늘었음");
    expect(r2.ok).toBe(true);
    const { data: d2 } = readFm(path.join(dir, `${slug}.md`));
    expect(d2.response_note).toBe("댓글 30건으로 늘었음");

    // 3) 빈 문자열은 필드 제거
    const r3 = await setResponseNote("published", slug, "   ");
    expect(r3.ok).toBe(true);
    const { data: d3 } = readFm(path.join(dir, `${slug}.md`));
    expect(d3.response_note).toBeUndefined();
  });
});
