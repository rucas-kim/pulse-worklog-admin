import { describe, it, expect } from "vitest";
import {
  toIsoDay,
  toMillis,
  parseMonth,
  shiftMonth,
  fmtMonth,
  todayIsoKst,
  buildGrid,
  isoDate,
} from "@/lib/dates";

describe("toIsoDay", () => {
  it("string에서 YYYY-MM-DD prefix를 그대로 반환", () => {
    expect(toIsoDay("2026-05-14")).toBe("2026-05-14");
    expect(toIsoDay("2026-05-15T13:42+09:00")).toBe("2026-05-15");
  });

  it("형식이 안 맞는 string은 null", () => {
    expect(toIsoDay("not-a-date")).toBeNull();
    expect(toIsoDay("")).toBeNull();
    expect(toIsoDay("2026/05/14")).toBeNull();
  });

  it("YAML date(UTC 자정 Date)를 KST 기준 같은 날짜로 변환", () => {
    // gray-matter가 `2026-05-14`를 Date(2026-05-14T00:00:00Z)로 변환
    const d = new Date("2026-05-14T00:00:00.000Z");
    expect(toIsoDay(d)).toBe("2026-05-14");
  });

  it("KST 새벽 발행(UTC 전날)을 KST 기준 발행일로 잡음", () => {
    // KST 2026-05-15 05:00 = UTC 2026-05-14 20:00
    const d = new Date("2026-05-14T20:00:00.000Z");
    expect(toIsoDay(d)).toBe("2026-05-15");
  });

  it("KST 저녁 발행(UTC 같은 날)을 그대로 잡음", () => {
    // KST 2026-05-15 22:00 = UTC 2026-05-15 13:00
    const d = new Date("2026-05-15T13:00:00.000Z");
    expect(toIsoDay(d)).toBe("2026-05-15");
  });

  it("Invalid Date / 기타 타입은 null", () => {
    expect(toIsoDay(new Date("invalid"))).toBeNull();
    expect(toIsoDay(null)).toBeNull();
    expect(toIsoDay(undefined)).toBeNull();
    expect(toIsoDay(12345)).toBeNull();
  });
});

describe("toMillis", () => {
  it("YYYY-MM-DD string은 UTC 자정 ms", () => {
    expect(toMillis("2026-05-14")).toBe(Date.UTC(2026, 4, 14));
  });

  it("Date는 getTime()", () => {
    const d = new Date("2026-05-14T13:00:00.000Z");
    expect(toMillis(d)).toBe(d.getTime());
  });

  it("무효 값은 +Infinity (정렬 시 후순위)", () => {
    expect(toMillis(undefined)).toBe(Number.POSITIVE_INFINITY);
    expect(toMillis(null)).toBe(Number.POSITIVE_INFINITY);
    expect(toMillis("garbage")).toBe(Number.POSITIVE_INFINITY);
    expect(toMillis(new Date("invalid"))).toBe(Number.POSITIVE_INFINITY);
  });

  it("정렬에 사용 시 무효 값이 가장 뒤로", () => {
    const arr = ["2026-05-14", undefined, "2026-05-10", "garbage"];
    const sorted = [...arr].sort((a, b) => toMillis(a) - toMillis(b));
    expect(sorted[0]).toBe("2026-05-10");
    expect(sorted[1]).toBe("2026-05-14");
    // 나머지 두 +Infinity는 stable order
  });
});

describe("parseMonth", () => {
  it("유효한 YYYY-MM 파싱", () => {
    expect(parseMonth("2026-05")).toEqual({ year: 2026, month: 5 });
    expect(parseMonth("2026-12")).toEqual({ year: 2026, month: 12 });
    expect(parseMonth("2000-01")).toEqual({ year: 2000, month: 1 });
  });

  it("형식이 안 맞으면 fallback (today 인자)", () => {
    expect(parseMonth("garbage", "2026-05-19")).toEqual({ year: 2026, month: 5 });
    expect(parseMonth(undefined, "2026-05-19")).toEqual({ year: 2026, month: 5 });
    expect(parseMonth("", "2026-12-31")).toEqual({ year: 2026, month: 12 });
  });

  it("월 범위 밖이면 fallback", () => {
    expect(parseMonth("2026-13", "2026-05-19")).toEqual({ year: 2026, month: 5 });
    expect(parseMonth("2026-00", "2026-05-19")).toEqual({ year: 2026, month: 5 });
  });

  it("연도 범위 밖이면 fallback", () => {
    expect(parseMonth("1999-05", "2026-05-19")).toEqual({ year: 2026, month: 5 });
    expect(parseMonth("2101-05", "2026-05-19")).toEqual({ year: 2026, month: 5 });
  });
});

describe("shiftMonth", () => {
  it("같은 해 안에서 이동", () => {
    expect(shiftMonth(2026, 5, 1)).toEqual({ year: 2026, month: 6 });
    expect(shiftMonth(2026, 5, -1)).toEqual({ year: 2026, month: 4 });
  });

  it("12월 → 1월 경계", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("1월 → 전년 12월 경계", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("여러 칸 이동", () => {
    expect(shiftMonth(2026, 5, 12)).toEqual({ year: 2027, month: 5 });
    expect(shiftMonth(2026, 5, -12)).toEqual({ year: 2025, month: 5 });
  });
});

describe("fmtMonth", () => {
  it("YYYY-MM 형식으로 zero-pad", () => {
    expect(fmtMonth(2026, 5)).toBe("2026-05");
    expect(fmtMonth(2026, 12)).toBe("2026-12");
    expect(fmtMonth(2026, 1)).toBe("2026-01");
  });
});

describe("isoDate", () => {
  it("로컬 타임존 기준 YYYY-MM-DD", () => {
    // 로컬 메서드라 머신 의존이지만 동작 자체는 검증
    const d = new Date(2026, 4, 14); // local 2026-05-14
    expect(isoDate(d)).toBe("2026-05-14");
  });
});

describe("todayIsoKst", () => {
  it("UTC 자정 입력에 대해 KST 오늘은 같은 날", () => {
    // 2026-05-19T00:00:00Z = KST 2026-05-19 09:00 → KST date 5/19
    expect(todayIsoKst(Date.UTC(2026, 4, 19, 0, 0, 0))).toBe("2026-05-19");
  });

  it("UTC 자정 직전(전날 23:59)도 KST 오늘은 다음 날 08:59 → 같은 날 잡음", () => {
    // 2026-05-19T23:59:00Z = KST 2026-05-20 08:59 → KST date 5/20
    expect(todayIsoKst(Date.UTC(2026, 4, 19, 23, 59, 0))).toBe("2026-05-20");
  });
});

describe("buildGrid", () => {
  it("2026-05는 시작이 금요일(1일)이고 31일까지, 길이는 7의 배수", () => {
    const cells = buildGrid(2026, 5, "2026-05-19");
    expect(cells.length % 7).toBe(0);
    // 첫 칸이 일요일이어야 함 (getDay = 0)
    expect(cells[0].date.getDay()).toBe(0);
    // 1일은 금요일 (getDay = 5) — startDay 5칸 padding 후 6번째 칸이 1일
    expect(cells[5].inMonth).toBe(true);
    expect(cells[5].date.getDate()).toBe(1);
  });

  it("today 인자에 해당하는 셀의 isToday=true, 나머지는 false", () => {
    const cells = buildGrid(2026, 5, "2026-05-19");
    const today = cells.find((c) => c.iso === "2026-05-19");
    expect(today?.isToday).toBe(true);
    const other = cells.find((c) => c.iso === "2026-05-18");
    expect(other?.isToday).toBe(false);
  });

  it("이전/다음 달 padding 셀은 inMonth=false", () => {
    const cells = buildGrid(2026, 5, "2026-05-19");
    const padded = cells.filter((c) => !c.inMonth);
    expect(padded.length).toBeGreaterThan(0);
    padded.forEach((c) => expect(c.isToday).toBe(false));
  });

  it("31일까지 있는 달은 inMonth 셀 31개", () => {
    const cells = buildGrid(2026, 5, "2026-05-19");
    expect(cells.filter((c) => c.inMonth).length).toBe(31);
  });

  it("2월(28일)도 정상", () => {
    const cells = buildGrid(2026, 2, "2026-02-15");
    expect(cells.filter((c) => c.inMonth).length).toBe(28);
  });
});
