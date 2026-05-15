import { Section } from "./types";

/**
 * 마크다운 본문을 발행 단위(섹션)로 분할.
 * - format=instagram_caption 또는 H1 헤더 없음 → 본문 하나로
 * - H1 헤더(`# `)가 있으면 → 헤더 단위로 분할
 */
export function parseSections(body: string, format?: string): Section[] {
  const hasH1 = /^#\s+/m.test(body);

  if (!hasH1) {
    return [
      {
        id: 1,
        order: "1/1",
        title: "본문",
        content: body.trim(),
      },
    ];
  }

  const sections: Array<{ title: string; content: string }> = [];
  const lines = body.split("\n");
  let current: { title: string; content: string } | null = null;

  for (const line of lines) {
    if (line.startsWith("# ")) {
      if (current) sections.push(current);
      current = { title: line.replace(/^#\s+/, "").trim(), content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);

  const total = sections.length;
  return sections.map((s, i) => ({
    id: i + 1,
    order: `${i + 1}/${total}`,
    title: s.title,
    content: s.content.trim(),
  }));
}
