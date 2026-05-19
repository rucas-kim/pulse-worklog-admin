/**
 * 자가 추천도 점수 헬퍼.
 *
 * 스키마: frontmatter.score 는 객체 또는 부재.
 *   { overall: 1..5, data?: 1..5, finding?: 1..5, role_fit?: 1..5, tone?: 1..5, readiness?: 1..5 }
 *
 * overall = 종합 별점 (1..5). 5개 카드에 같이 보임.
 * 5축은 선택 — 정의된 축만 합산해서 총점/만점을 잡음.
 *   - 5축 모두면 max=25
 *   - 4축이면 max=20
 *   - 0축(즉 overall만 있음)이면 총점 = null
 */

export const SCORE_AXES = [
  "data",
  "finding",
  "role_fit",
  "tone",
  "readiness",
] as const;

export type ScoreAxis = (typeof SCORE_AXES)[number];

export type ScoreInput = {
  overall?: unknown;
  data?: unknown;
  finding?: unknown;
  role_fit?: unknown;
  tone?: unknown;
  readiness?: unknown;
};

export const AXIS_LABEL: Record<ScoreAxis, string> = {
  data: "데이터 강도",
  finding: "발견 신선도",
  role_fit: "역할 정합",
  tone: "톤",
  readiness: "발행 준비도",
};

function asAxisScore(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (v < 1 || v > 5) return null;
  return Math.round(v);
}

export function normalizeOverall(score: unknown): number | null {
  if (!score || typeof score !== "object") return null;
  return asAxisScore((score as ScoreInput).overall);
}

export function axisScores(score: unknown): Partial<Record<ScoreAxis, number>> {
  if (!score || typeof score !== "object") return {};
  const out: Partial<Record<ScoreAxis, number>> = {};
  for (const a of SCORE_AXES) {
    const v = asAxisScore((score as ScoreInput)[a]);
    if (v !== null) out[a] = v;
  }
  return out;
}

export function totalScore(
  score: unknown
): { total: number; max: number } | null {
  const axes = axisScores(score);
  const present = Object.values(axes);
  if (present.length === 0) return null;
  return {
    total: present.reduce((a, b) => a + b, 0),
    max: present.length * 5,
  };
}
