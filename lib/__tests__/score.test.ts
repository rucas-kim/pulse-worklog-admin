import { describe, it, expect } from "vitest";
import { normalizeOverall, axisScores, totalScore } from "@/lib/score";

describe("normalizeOverall", () => {
  it("객체.overall이 1-5면 그대로", () => {
    expect(normalizeOverall({ overall: 1 })).toBe(1);
    expect(normalizeOverall({ overall: 5 })).toBe(5);
    expect(normalizeOverall({ overall: 3.5 })).toBe(4);
  });

  it("범위 밖/무효 타입은 null", () => {
    expect(normalizeOverall({ overall: 0 })).toBeNull();
    expect(normalizeOverall({ overall: 6 })).toBeNull();
    expect(normalizeOverall({ overall: NaN })).toBeNull();
    expect(normalizeOverall({ overall: "4" })).toBeNull();
    expect(normalizeOverall({})).toBeNull();
  });

  it("객체가 아니면 null (단일 number도 더는 지원 X)", () => {
    expect(normalizeOverall(4)).toBeNull();
    expect(normalizeOverall(null)).toBeNull();
    expect(normalizeOverall(undefined)).toBeNull();
    expect(normalizeOverall("4")).toBeNull();
  });
});

describe("axisScores", () => {
  it("정의된 축만 통과", () => {
    const v = axisScores({
      data: 5,
      finding: 4,
      role_fit: 3,
    });
    expect(v).toEqual({ data: 5, finding: 4, role_fit: 3 });
  });

  it("범위 밖 축은 누락", () => {
    const v = axisScores({ data: 0, finding: 4, role_fit: 6, tone: 3 });
    expect(v).toEqual({ finding: 4, tone: 3 });
  });

  it("객체가 아니면 빈 객체", () => {
    expect(axisScores(undefined)).toEqual({});
    expect(axisScores(null)).toEqual({});
    expect(axisScores(4)).toEqual({});
  });

  it("알 수 없는 키는 무시", () => {
    const v = axisScores({ data: 5, extra: 99, foo: "bar" });
    expect(v).toEqual({ data: 5 });
  });
});

describe("totalScore", () => {
  it("5축 정의되면 max=25, 합산 정확", () => {
    const r = totalScore({
      overall: 4,
      data: 5,
      finding: 4,
      role_fit: 5,
      tone: 4,
      readiness: 4,
    });
    expect(r).toEqual({ total: 22, max: 25 });
  });

  it("3축만 정의되면 max=15", () => {
    const r = totalScore({ data: 3, finding: 4, tone: 5 });
    expect(r).toEqual({ total: 12, max: 15 });
  });

  it("축 0개면 null (overall만 있는 경우 포함)", () => {
    expect(totalScore({ overall: 4 })).toBeNull();
    expect(totalScore({})).toBeNull();
    expect(totalScore(undefined)).toBeNull();
  });
});
