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
