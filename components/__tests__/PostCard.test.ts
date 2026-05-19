import { describe, it, expect } from "vitest";
import { normalizeScore } from "@/components/PostCard";

describe("normalizeScore", () => {
  it("1~5 사이 정수는 그대로", () => {
    expect(normalizeScore(1)).toBe(1);
    expect(normalizeScore(3)).toBe(3);
    expect(normalizeScore(5)).toBe(5);
  });

  it("소수는 반올림", () => {
    expect(normalizeScore(3.4)).toBe(3);
    expect(normalizeScore(3.5)).toBe(4);
    expect(normalizeScore(4.7)).toBe(5);
  });

  it("범위 밖 / 무효 값은 null (UI에서 비표시)", () => {
    expect(normalizeScore(0)).toBeNull();
    expect(normalizeScore(6)).toBeNull();
    expect(normalizeScore(-1)).toBeNull();
    expect(normalizeScore(NaN)).toBeNull();
    expect(normalizeScore(Infinity)).toBeNull();
  });

  it("타입이 number가 아니면 null", () => {
    expect(normalizeScore(undefined)).toBeNull();
    expect(normalizeScore(null)).toBeNull();
    expect(normalizeScore("3")).toBeNull();
    expect(normalizeScore({})).toBeNull();
  });
});
