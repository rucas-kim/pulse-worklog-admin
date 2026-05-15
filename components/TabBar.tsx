import Link from "next/link";
import { Folder, FOLDERS, FOLDER_LABEL } from "@/lib/types";

export function TabBar({
  current,
  counts,
}: {
  current: Folder;
  counts: Record<Folder, number>;
}) {
  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-800"
      aria-label="폴더 탐색"
    >
      {FOLDERS.map((f) => {
        const isActive = f === current;
        return (
          <Link
            key={f}
            href={{ pathname: "/", query: { folder: f } }}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span>{FOLDER_LABEL[f]}</span>
            <span className="ml-1.5 text-xs text-zinc-400">{counts[f]}</span>
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 bg-emerald-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
