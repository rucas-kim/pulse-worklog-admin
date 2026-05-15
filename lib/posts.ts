import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import {
  Folder,
  Post,
  Frontmatter,
  Category,
  FOLDER_MAP,
} from "./types";

export function getContentDir(): string {
  const dir = process.env.CONTENT_DIR;
  if (!dir) {
    throw new Error("CONTENT_DIR environment variable is required");
  }
  return dir;
}

export function ensureSafePath(filepath: string): void {
  const resolved = path.resolve(filepath);
  const base = path.resolve(getContentDir());
  if (!resolved.startsWith(base)) {
    throw new Error("Unsafe path detected — outside CONTENT_DIR");
  }
}

async function walkMdFiles(rootDir: string): Promise<string[]> {
  const results: string[] = [];
  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(full);
      }
    }
  }
  await walk(rootDir);
  return results;
}

export async function listPosts(folder: Folder): Promise<Post[]> {
  const folderPath = path.join(getContentDir(), FOLDER_MAP[folder]);
  const files = await walkMdFiles(folderPath);
  const posts: (Post | null)[] = await Promise.all(
    files.map((f) => readPost(f, folder))
  );
  return posts.filter((p): p is Post => p !== null);
}

export async function listAllCounts(): Promise<Record<Folder, number>> {
  const folders: Folder[] = ["ideas", "drafts", "queue", "published"];
  const counts = await Promise.all(
    folders.map(async (f) => [f, (await listPosts(f)).length] as const)
  );
  return Object.fromEntries(counts) as Record<Folder, number>;
}

export async function readPost(
  filepath: string,
  folder: Folder
): Promise<Post | null> {
  ensureSafePath(filepath);
  try {
    const raw = await fs.readFile(filepath, "utf-8");
    const stat = await fs.stat(filepath);
    let data: Frontmatter = {};
    let content = raw;
    try {
      const parsed = matter(raw);
      data = parsed.data as Frontmatter;
      content = parsed.content;
    } catch {
      // frontmatter 파싱 실패 — raw 본문 fallback
      data = {};
      content = raw;
    }
    const filename = path.basename(filepath);
    const slug = path.basename(filepath, ".md");
    const relativePath = path.relative(getContentDir(), filepath);
    const title = extractTitle(data, content, filename);
    const preview = extractPreview(content);
    const category = extractCategory(data);

    return {
      slug,
      folder,
      filepath,
      filename,
      relativePath,
      frontmatter: data,
      body: content,
      title,
      preview,
      category,
      modifiedAt: stat.mtime,
      createdAt: stat.birthtime ?? stat.ctime,
    };
  } catch (err) {
    console.error(`Failed to read post ${filepath}:`, err);
    return null;
  }
}

export async function findPostBySlug(
  folder: Folder,
  slug: string
): Promise<Post | null> {
  const folderPath = path.join(getContentDir(), FOLDER_MAP[folder]);
  const files = await walkMdFiles(folderPath);
  const target = files.find((f) => path.basename(f, ".md") === slug);
  if (!target) return null;
  return readPost(target, folder);
}

function extractTitle(
  data: Frontmatter,
  content: string,
  filename: string
): string {
  if (data.title) return String(data.title);

  // H1 헤더 찾기 — 단, 섹션 헤더("메인", "하위", "카드", "섹션")는 제목 아님
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    const h1 = h1Match[1].trim();
    if (!/^(메인|하위|카드|섹션)/.test(h1)) {
      return h1.slice(0, 80);
    }
  }

  // 본문 첫 의미 있는 줄
  const firstLine = content
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && !l.startsWith("---"));
  if (firstLine) {
    return firstLine.replace(/[*_`]/g, "").slice(0, 60);
  }

  // 파일명 fallback
  return filename
    .replace(/\.md$/, "")
    .replace(/^candidate-/, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/-/g, " ");
}

function extractPreview(content: string): string {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("---") && !l.startsWith("→"));
  return lines.slice(0, 2).join(" ").replace(/[*_`]/g, "").slice(0, 140);
}

function extractCategory(data: Frontmatter): Category {
  const raw = String(data.category ?? "").toUpperCase();
  if (raw.startsWith("A")) return "A";
  if (raw.startsWith("B")) return "B";
  if (raw.startsWith("C")) return "C";
  if (String(data.category ?? "").includes("자기계발")) return "자기계발";
  return "기타";
}
