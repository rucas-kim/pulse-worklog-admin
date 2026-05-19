"use server";

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { findPostBySlug, getContentDir, ensureSafePath } from "@/lib/posts";
import { Folder, FOLDER_MAP, Frontmatter, Status } from "@/lib/types";

const STATUS_BY_FOLDER: Record<Exclude<Folder, "published">, Status> = {
  ideas: "idea",
  drafts: "candidate",
  queue: "queued",
};

const CATEGORY_LONG: Record<string, string> = {
  A: "A (운영·콘텐츠 관찰)",
  B: "B (피부 지식 학습 노트)",
  C: "C (AI·바이브코딩)",
  "자기계발": "자기계발 (기존 결)",
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function buildFilename(
  folder: Exclude<Folder, "published">,
  slug: string,
  datePlanned?: string
): string {
  if (folder === "queue" && datePlanned) return `${datePlanned}-${slug}.md`;
  if (folder === "drafts") return `candidate-${slug}.md`;
  return `${slug}.md`;
}

export type CreatePostInput = {
  folder: Exclude<Folder, "published">;
  slug: string;
  category?: "A" | "B" | "C" | "자기계발";
  format?: "instagram_caption" | "threads" | "carousel";
  datePlanned?: string;
  source?: string;
  sourceUrl?: string;
  body: string;
};

export async function createPost(
  input: CreatePostInput
): Promise<{ ok: boolean; error?: string; folder?: Folder; slug?: string }> {
  try {
    if (!SLUG_RE.test(input.slug)) {
      return {
        ok: false,
        error: "slug는 소문자/숫자/하이픈만 사용해주세요 (예: my-new-finding)",
      };
    }
    if (!input.body.trim()) {
      return { ok: false, error: "본문은 비울 수 없어요" };
    }
    if (input.datePlanned && !DATE_RE.test(input.datePlanned)) {
      return { ok: false, error: "발행 예정일은 YYYY-MM-DD 형식이어야 해요" };
    }

    const filename = buildFilename(input.folder, input.slug, input.datePlanned);
    const folderDir = path.join(getContentDir(), FOLDER_MAP[input.folder]);
    await fs.mkdir(folderDir, { recursive: true });
    const targetPath = path.join(folderDir, filename);
    ensureSafePath(targetPath);

    try {
      await fs.access(targetPath);
      return {
        ok: false,
        error: `같은 이름의 파일이 이미 있어요: ${filename}`,
      };
    } catch {
      // 없음 — 정상
    }

    const frontmatter: Frontmatter = {
      status: STATUS_BY_FOLDER[input.folder],
      account: "pulse.worklog",
    };
    if (input.category) {
      frontmatter.category = CATEGORY_LONG[input.category] ?? input.category;
    }
    if (input.format) frontmatter.format = input.format;
    if (input.datePlanned) frontmatter.date_planned = input.datePlanned;
    if (input.source) frontmatter.source = input.source;
    if (input.sourceUrl) frontmatter.source_url = input.sourceUrl;
    frontmatter.checklist = {
      role_fit: false,
      source: false,
      finding: false,
      tone: false,
    };

    const content = matter.stringify(input.body, frontmatter);
    await fs.writeFile(targetPath, content, "utf-8");

    const newSlug = path.basename(filename, ".md");
    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath(`/post/${input.folder}/${newSlug}`);
    return { ok: true, folder: input.folder, slug: newSlug };
  } catch (e) {
    console.error("createPost failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function savePostBody(
  folder: Folder,
  slug: string,
  newBody: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const post = await findPostBySlug(folder, slug);
    if (!post) return { ok: false, error: "Post not found" };

    ensureSafePath(post.filepath);
    const updated = matter.stringify(newBody, post.frontmatter);
    await fs.writeFile(post.filepath, updated, "utf-8");

    revalidatePath("/");
    revalidatePath(`/post/${folder}/${slug}`);
    return { ok: true };
  } catch (e) {
    console.error("savePostBody failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function publishPost(
  folder: Folder,
  slug: string,
  permalink?: string
): Promise<{ ok: boolean; error?: string; newSlug?: string }> {
  try {
    const post = await findPostBySlug(folder, slug);
    if (!post) return { ok: false, error: "Post not found" };

    ensureSafePath(post.filepath);

    const now = new Date();
    const isoNow = toIsoWithOffset(now);
    const yyyymm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const updatedFrontmatter: Frontmatter = {
      ...post.frontmatter,
      status: "published",
      published_at: isoNow,
      ...(permalink ? { permalink } : {}),
    };

    const newContent = matter.stringify(post.body, updatedFrontmatter);

    // 새 위치: _published/YYYY-MM/<slug>.md
    const targetDir = path.join(
      getContentDir(),
      FOLDER_MAP.published,
      yyyymm
    );
    await fs.mkdir(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, `${slug}.md`);
    ensureSafePath(targetPath);

    // 같은 경로면 그냥 갱신, 다르면 이동
    if (path.resolve(targetPath) === path.resolve(post.filepath)) {
      await fs.writeFile(targetPath, newContent, "utf-8");
    } else {
      await fs.writeFile(targetPath, newContent, "utf-8");
      await fs.unlink(post.filepath);
    }

    revalidatePath("/");
    revalidatePath(`/post/${folder}/${slug}`);
    revalidatePath(`/post/published/${slug}`);

    return { ok: true, newSlug: slug };
  } catch (e) {
    console.error("publishPost failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function setResponseNote(
  folder: Folder,
  slug: string,
  note: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const post = await findPostBySlug(folder, slug);
    if (!post) return { ok: false, error: "Post not found" };

    ensureSafePath(post.filepath);

    const trimmed = note.trim();
    const nextFrontmatter: Frontmatter = { ...post.frontmatter };
    if (trimmed) {
      nextFrontmatter.response_note = trimmed;
    } else {
      delete nextFrontmatter.response_note;
    }

    const updated = matter.stringify(post.body, nextFrontmatter);
    await fs.writeFile(post.filepath, updated, "utf-8");

    revalidatePath("/");
    revalidatePath(`/post/${folder}/${slug}`);
    return { ok: true };
  } catch (e) {
    console.error("setResponseNote failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function movePost(
  folder: Folder,
  slug: string,
  target: Folder
): Promise<{ ok: boolean; error?: string; newFolder?: Folder }> {
  if (target === "published") {
    return { ok: false, error: "발행은 발행 버튼을 사용하세요" };
  }
  if (target === folder) {
    return { ok: false, error: "이미 같은 폴더에 있어요" };
  }
  try {
    const post = await findPostBySlug(folder, slug);
    if (!post) return { ok: false, error: "Post not found" };

    ensureSafePath(post.filepath);

    const targetDir = path.join(getContentDir(), FOLDER_MAP[target]);
    await fs.mkdir(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, `${slug}.md`);
    ensureSafePath(targetPath);

    if (path.resolve(targetPath) === path.resolve(post.filepath)) {
      return { ok: false, error: "이동할 위치가 현재와 같아요" };
    }

    // 동일 slug가 target에 이미 있으면 차단 (덮어쓰기 방지)
    try {
      await fs.access(targetPath);
      return {
        ok: false,
        error: `${FOLDER_MAP[target]} 폴더에 동일 이름의 파일이 이미 있어요`,
      };
    } catch {
      // 없음 — 정상
    }

    const updatedFrontmatter: Frontmatter = {
      ...post.frontmatter,
      status: STATUS_BY_FOLDER[target as Exclude<Folder, "published">],
    };
    const newContent = matter.stringify(post.body, updatedFrontmatter);

    await fs.writeFile(targetPath, newContent, "utf-8");
    await fs.unlink(post.filepath);

    revalidatePath("/");
    revalidatePath(`/post/${folder}/${slug}`);
    revalidatePath(`/post/${target}/${slug}`);

    return { ok: true, newFolder: target };
  } catch (e) {
    console.error("movePost failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

function toIsoWithOffset(date: Date): string {
  // Asia/Seoul (+09:00) 기준 ISO 8601 문자열
  const offset = 9 * 60; // KST
  const local = new Date(date.getTime() + offset * 60 * 1000);
  const yyyy = local.getUTCFullYear();
  const mm = String(local.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(local.getUTCDate()).padStart(2, "0");
  const hh = String(local.getUTCHours()).padStart(2, "0");
  const min = String(local.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}+09:00`;
}
