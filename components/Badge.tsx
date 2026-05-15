import { Category, Status } from "@/lib/types";

const CATEGORY_STYLES: Record<Category, string> = {
  A: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  B: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  C: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  자기계발: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  기타: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const STATUS_STYLES: Record<Status, string> = {
  idea: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  candidate: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  queued: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  published: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-zinc-100 text-zinc-500 line-through dark:bg-zinc-800 dark:text-zinc-500",
};

const STATUS_LABEL: Record<Status, string> = {
  idea: "아이디어",
  candidate: "후보",
  queued: "발행 대기",
  published: "발행됨",
  rejected: "폐기",
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${CATEGORY_STYLES[category]}`}
    >
      {category}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
