"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/app/actions";

type FolderChoice = "ideas" | "drafts" | "queue";
type CategoryChoice = "A" | "B" | "C" | "자기계발";
type FormatChoice = "instagram_caption" | "threads" | "carousel";

const FOLDER_OPTIONS: { v: FolderChoice; label: string; hint: string }[] = [
  { v: "drafts", label: "후보 풀", hint: "다듬을 후보 — 4항목 체크리스트 통과 시 큐로" },
  { v: "ideas", label: "아이디어", hint: "발굴 전 단계의 메모" },
  { v: "queue", label: "발행 대기", hint: "발행 확정 — date_planned 필요" },
];

const CATEGORY_OPTIONS: { v: CategoryChoice; label: string }[] = [
  { v: "A", label: "A · 운영·콘텐츠 관찰" },
  { v: "B", label: "B · 피부 지식 학습 노트" },
  { v: "C", label: "C · AI·바이브코딩" },
  { v: "자기계발", label: "자기계발" },
];

const FORMAT_OPTIONS: { v: FormatChoice; label: string }[] = [
  { v: "instagram_caption", label: "인스타 캡션 (한 호흡)" },
  { v: "threads", label: "스레드 (H1로 카드 분할)" },
  { v: "carousel", label: "캐러셀" },
];

export function NewPostForm() {
  const [folder, setFolder] = useState<FolderChoice>("drafts");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<CategoryChoice>("A");
  const [format, setFormat] = useState<FormatChoice>("instagram_caption");
  const [datePlanned, setDatePlanned] = useState("");
  const [source, setSource] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPost({
        folder,
        slug: slug.trim(),
        category,
        format,
        datePlanned: datePlanned.trim() || undefined,
        source: source.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        body,
      });
      if (result.ok && result.folder && result.slug) {
        router.push(`/post/${result.folder}/${result.slug}`);
        router.refresh();
      } else {
        setError(result.error ?? "저장 실패");
      }
    });
  }

  const filenamePreview = previewFilename(folder, slug, datePlanned);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="폴더"
        hint={FOLDER_OPTIONS.find((o) => o.v === folder)?.hint}
      >
        <div className="flex flex-wrap gap-2">
          {FOLDER_OPTIONS.map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setFolder(opt.v)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                folder === opt.v
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="slug (영문 kebab-case)"
        hint={filenamePreview ? `파일명: ${filenamePreview}` : "예: my-new-finding"}
      >
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-new-finding"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
          className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </Field>

      {folder === "queue" && (
        <Field label="발행 예정일 (date_planned)" hint="YYYY-MM-DD — 큐 파일명 접두로 자동 부착">
          <input
            type="date"
            value={datePlanned}
            onChange={(e) => setDatePlanned(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Field>
      )}

      <Field label="영역 (category)">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryChoice)}
          className="px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.v} value={opt.v}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="포맷 (format)">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as FormatChoice)}
          className="px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {FORMAT_OPTIONS.map((opt) => (
            <option key={opt.v} value={opt.v}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="출처 (source) — 선택">
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder='예: instagram demaf.us 2026-05-14 "Soobooji skin"'
          className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </Field>

      <Field label="출처 URL (source_url) — 선택">
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </Field>

      <Field
        label="본문"
        hint={
          format === "threads"
            ? "스레드는 # 메인 / # 하위 1 식으로 H1 헤더로 분할"
            : "마크다운 자유"
        }
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={14}
          className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          spellCheck={false}
          placeholder="여기에 본문을 작성해주세요. frontmatter는 자동으로 생성돼요."
        />
      </Field>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.push("/")}
          disabled={pending}
          className="px-4 py-2 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-sm font-medium rounded-md bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {pending ? "저장 중..." : "🌱 저장"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
}

function previewFilename(
  folder: FolderChoice,
  slug: string,
  datePlanned: string
): string {
  if (!slug) return "";
  const base =
    folder === "drafts"
      ? `candidate-${slug}`
      : folder === "queue" && datePlanned
        ? `${datePlanned}-${slug}`
        : slug;
  const dir =
    folder === "ideas" ? "_ideas" : folder === "drafts" ? "_drafts" : "_queue";
  return `${dir}/${base}.md`;
}
