/** "YYYY-MM-DD" 형식으로 변환 (Supabase 날짜 경계 쿼리 등에 사용) */
export function formatDateBoundary(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** "4월 26일 (토)" 형식 — 선택된 날짜 표시용 */
export function formatSelectedDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(date);
}

/** "2026년 4월 26일" 형식 — "YYYY-MM-DD" 문자열 입력 */
export function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
}

/** "2026년 4월 26일" 형식 — pageId("YYYY-MM-DD") 또는 Date 문자열 입력 */
export function formatDiaryDate(pageId: string): string {
  const parts = pageId.split('-').map(Number);
  const date = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(pageId);
  if (Number.isNaN(date.getTime())) return pageId;
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

/** "오전/오후 HH:MM" 형식 — 저장 시각 표시용, timestamp가 없으면 null */
export function formatSaveTime(timestamp: number | null): string | null {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(timestamp);
}
