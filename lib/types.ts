export type Folder = "ideas" | "drafts" | "queue" | "published";

export const FOLDERS: Folder[] = ["ideas", "drafts", "queue", "published"];

export const FOLDER_MAP: Record<Folder, string> = {
  ideas: "_ideas",
  drafts: "_drafts",
  queue: "_queue",
  published: "_published",
};

export const FOLDER_LABEL: Record<Folder, string> = {
  ideas: "아이디어",
  drafts: "후보 풀",
  queue: "발행 대기",
  published: "발행 완료",
};

export type Status = "idea" | "candidate" | "queued" | "published" | "rejected";

export type Category = "A" | "B" | "C" | "자기계발" | "기타";

export type Frontmatter = {
  title?: string;
  category?: string;
  format?: string;
  length?: string;
  status?: Status;
  date_planned?: string;
  date_created?: string;
  published_at?: string;
  permalink?: string;
  source?: string;
  source_url?: string;
  references?: string[];
  tags?: string[];
  chain_count?: number;
  account?: string;
  note?: string;
  response_note?: string;
  checklist?: {
    role_fit?: boolean;
    source?: boolean;
    finding?: boolean;
    tone?: boolean;
  };
  [key: string]: unknown;
};

export type Post = {
  slug: string;
  folder: Folder;
  filepath: string;
  filename: string;
  relativePath: string; // CONTENT_DIR 기준 상대 경로
  frontmatter: Frontmatter;
  body: string;
  title: string;
  preview: string;
  category: Category;
  modifiedAt: Date;
  createdAt: Date;
};

export type Section = {
  id: number;
  order: string; // "1/4" 형태
  title: string;
  content: string;
};
