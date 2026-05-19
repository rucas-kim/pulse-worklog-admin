import Link from "next/link";
import { NewPostForm } from "@/components/NewPostForm";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← 목록
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold">
          <span className="text-emerald-500">🌱</span> 새 글
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          빠른 메모는 *아이디어*로, 다듬을 후보는 *후보 풀*로, 발행 확정은 *발행 대기*로.
        </p>
      </header>

      <NewPostForm />
    </main>
  );
}
