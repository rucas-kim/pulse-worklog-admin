/**
 * 날짜·시각 헬퍼 모음.
 *
 * 핵심 이슈: gray-matter(js-yaml)가 따옴표 없는 YAML 날짜를 Date(UTC 자정)로 자동 변환함.
 * 머신 타임존에서 getDate를 호출하면 결과가 머신마다 달라지므로 KST(+9h) 기준 UTC 메서드로 읽어야 함.
 * 디마프 운영은 KST 기준.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * 임의 값(string/Date/null)을 KST 기준 YYYY-MM-DD 문자열로 정규화.
 * - string에서 ISO date prefix 추출
 * - Date는 KST로 변환 후 UTC 메서드로 읽음
 * - 기타 → null
 */
export function toIsoDay(v: unknown): string | null {
  if (typeof v === "string") {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
    return m ? m[1] : null;
  }
  if (v instanceof Date && !isNaN(v.getTime())) {
    const kst = new Date(v.getTime() + KST_OFFSET_MS);
    const y = kst.getUTCFullYear();
    const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
    const d = String(kst.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

/**
 * 정렬 비교용 ms 변환. string("YYYY-MM-DD..."), Date 모두 수용. 무효 값은 +Infinity로 후순위.
 */
export function toMillis(v: unknown): number {
  if (typeof v === "string") {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
    return m ? new Date(m[1]).getTime() : Number.POSITIVE_INFINITY;
  }
  if (v instanceof Date && !isNaN(v.getTime())) return v.getTime();
  return Number.POSITIVE_INFINITY;
}

/**
 * 사용자 머신 어디든 KST 기준 오늘 YYYY-MM-DD 반환.
 * `now` 인자를 받아 테스트 가능. 미지정 시 Date.now().
 */
export function todayIsoKst(now: number = Date.now()): string {
  const offsetMs = new Date(now).getTimezoneOffset() * 60 * 1000;
  const utcMs = now + offsetMs;
  const kst = new Date(utcMs + KST_OFFSET_MS);
  return isoDate(kst);
}

/**
 * "YYYY-MM" 입력을 {year, month}로 안전하게 파싱. 유효치 않으면 today(KST) 반환.
 */
export function parseMonth(
  s: string | undefined,
  fallbackToday: string = todayIsoKst()
): { year: number; month: number } {
  if (s && /^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split("-").map(Number);
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
      return { year: y, month: m };
    }
  }
  const t = fallbackToday.split("-");
  return { year: Number(t[0]), month: Number(t[1]) };
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function fmtMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export type DayCell = {
  date: Date;
  iso: string;
  inMonth: boolean;
  isToday: boolean;
};

/**
 * 일요일을 첫 칸으로 하는 달력 그리드. 이전/다음 달 일자로 padding하여 7의 배수 길이.
 */
export function buildGrid(year: number, month: number, today: string): DayCell[] {
  const first = new Date(year, month - 1, 1);
  const startDay = first.getDay();
  const cells: DayCell[] = [];

  for (let i = 0; i < startDay; i++) {
    const d = new Date(year, month - 1, -startDay + i + 1);
    cells.push({ date: d, iso: isoDate(d), inMonth: false, isToday: false });
  }
  const last = new Date(year, month, 0).getDate();
  for (let dd = 1; dd <= last; dd++) {
    const dt = new Date(year, month - 1, dd);
    const iso = isoDate(dt);
    cells.push({ date: dt, iso, inMonth: true, isToday: iso === today });
  }
  while (cells.length % 7 !== 0) {
    const prev = cells[cells.length - 1].date;
    const next = new Date(prev);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, iso: isoDate(next), inMonth: false, isToday: false });
  }
  return cells;
}

export { DAY_MS, KST_OFFSET_MS };
