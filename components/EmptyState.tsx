import { Folder, FOLDER_LABEL } from "@/lib/types";

const MESSAGES: Record<Folder, { title: string; hint: string }> = {
  ideas: {
    title: "아이디어가 아직 비어 있어요.",
    hint: "Claude Code 세션에서 새 아이디어를 발굴해 이 폴더에 저장하세요.",
  },
  drafts: {
    title: "후보 풀이 비어 있어요.",
    hint: "Claude에게 \"또 5개 후보 만들어줘\"라고 부탁해보세요.",
  },
  queue: {
    title: "발행 대기 글이 없어요.",
    hint: "후보 풀에서 마음에 드는 글을 발행하시거나, 큐로 이동하세요.",
  },
  published: {
    title: "아직 발행한 글이 없어요.",
    hint: "첫 발행은 가볍게 — 손에 가는 글부터 시작해도 충분해요.",
  },
};

export function EmptyState({ folder }: { folder: Folder }) {
  const msg = MESSAGES[folder];
  return (
    <div className="py-16 text-center">
      <div className="text-4xl mb-3">🌱</div>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {msg.title}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-sm mx-auto">
        {msg.hint}
      </p>
      <p className="text-xs text-zinc-400 mt-4">
        현재 폴더: <code className="font-mono">{FOLDER_LABEL[folder]}</code>
      </p>
    </div>
  );
}
