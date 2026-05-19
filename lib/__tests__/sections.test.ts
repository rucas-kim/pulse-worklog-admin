import { describe, it, expect } from "vitest";
import { parseSections } from "@/lib/sections";

describe("parseSections - 단일 카드 (캡션)", () => {
  it("format=instagram_caption은 H1 있어도 본문 통째로 한 카드", () => {
    const body = "# 메인\n\n첫 줄\n둘째 줄\n\n# 하위\n\n셋째 줄";
    const sections = parseSections(body, "instagram_caption");
    expect(sections.length).toBe(1);
    expect(sections[0].order).toBe("1/1");
    expect(sections[0].title).toBe("본문");
    expect(sections[0].content).toContain("메인");
    expect(sections[0].content).toContain("하위");
  });

  it("format=caption도 동일", () => {
    const body = "# A\n본문\n# B\n또 다른 본문";
    const sections = parseSections(body, "caption");
    expect(sections.length).toBe(1);
  });

  it("H1이 없으면 format과 무관하게 단일 카드", () => {
    const body = "그냥 본문\n두 줄짜리";
    const sections = parseSections(body, "threads");
    expect(sections.length).toBe(1);
    expect(sections[0].title).toBe("본문");
    expect(sections[0].content).toBe("그냥 본문\n두 줄짜리");
  });
});

describe("parseSections - H1 기반 분할 (threads)", () => {
  const body = `# 메인 (1번 스레드)

본문 1
👇

# 하위 1 (2번 스레드)

본문 2

# 하위 2 (3번 스레드)

본문 3
👇`;

  it("threads format + H1 3개 → 카드 3개", () => {
    const sections = parseSections(body, "threads");
    expect(sections.length).toBe(3);
  });

  it("order는 1/N 형태로 매겨짐", () => {
    const sections = parseSections(body, "threads");
    expect(sections[0].order).toBe("1/3");
    expect(sections[1].order).toBe("2/3");
    expect(sections[2].order).toBe("3/3");
  });

  it("title은 H1 텍스트", () => {
    const sections = parseSections(body, "threads");
    expect(sections[0].title).toBe("메인 (1번 스레드)");
    expect(sections[1].title).toBe("하위 1 (2번 스레드)");
  });

  it("content는 헤더 제외 본문, trim됨", () => {
    const sections = parseSections(body, "threads");
    expect(sections[0].content).toContain("본문 1");
    expect(sections[0].content).not.toContain("# 메인");
    expect(sections[0].content.startsWith(" ")).toBe(false);
    expect(sections[0].content.endsWith(" ")).toBe(false);
  });
});

describe("parseSections - format 미지정 시", () => {
  it("H1 있으면 분할", () => {
    const body = "# 첫\n내용1\n# 둘\n내용2";
    const sections = parseSections(body);
    expect(sections.length).toBe(2);
  });

  it("H1 없으면 단일", () => {
    const body = "내용만 있음";
    const sections = parseSections(body);
    expect(sections.length).toBe(1);
  });
});

describe("parseSections - 엣지 케이스", () => {
  it("H1이 한 개면 한 카드 (분할은 되지만 order 1/1)", () => {
    const body = "# 메인\n본문 1";
    const sections = parseSections(body, "threads");
    expect(sections.length).toBe(1);
    expect(sections[0].order).toBe("1/1");
    expect(sections[0].title).toBe("메인");
  });

  it("빈 본문은 한 카드", () => {
    const sections = parseSections("", "threads");
    expect(sections.length).toBe(1);
    expect(sections[0].content).toBe("");
  });
});
