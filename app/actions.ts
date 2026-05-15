"use server";

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { findPostBySlug, getContentDir, ensureSafePath } from "@/lib/posts";
import { Folder, FOLDER_MAP, Frontmatter } from "@/lib/types";

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
