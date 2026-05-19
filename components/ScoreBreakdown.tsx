import {
  AXIS_LABEL,
  SCORE_AXES,
  ScoreAxis,
  axisScores,
  normalizeOverall,
  totalScore,
} from "@/lib/score";

export function ScoreBreakdown({ score }: { score: unknown }) {
  const overall = normalizeOverall(score);
  const axes = axisScores(score);
  const total = totalScore(score);

  // overall도 5축도 없으면 통째로 비표시
  if (overall === null && Object.keys(axes).length === 0) return null;

  return (
    <section
      className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/50"
      aria-label="자가 평가 점수"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          자가 평가
        </h3>
        {overall !== null && (
          <span
            className="inline-flex items-center gap-1.5 text-xs"
            aria-label={`종합 ${overall}점, 5점 만점`}
          >
            <span className="text-amber-500">
              {"★".repeat(overall)}
              <span className="text-zinc-300 dark:text-zinc-700">
                {"★".repeat(5 - overall)}
              </span>
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-400">
              종합 {overall}/5
            </span>
          </span>
        )}
      </div>

      {Object.keys(axes).length > 0 && (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {SCORE_AXES.filter((a) => axes[a] !== undefined).map((axis) => (
              <AxisRow key={axis} axis={axis} score={axes[axis]!} />
            ))}
          </ul>

          {total && (
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-sm">
              <span className="text-zinc-500">총점</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {total.total}/{total.max}
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function AxisRow({ axis, score }: { axis: ScoreAxis; score: number }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-zinc-600 dark:text-zinc-400">
        {AXIS_LABEL[axis]}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="text-amber-500 text-xs">
          {"★".repeat(score)}
          <span className="text-zinc-300 dark:text-zinc-700">
            {"★".repeat(5 - score)}
          </span>
        </span>
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
          {score}/5
        </span>
      </span>
    </li>
  );
}
