// 캘린더 날짜 계산: 월별 날짜 배열 생성, 날짜 키 변환, 레이블 포맷 등 캘린더 유틸
import type { CalendarDay, DiaryEntrySummary, ScheduleItem } from '@/features/home/types/home.types';

// 시·분·초를 0으로 만들어 날짜의 시작 시각을 반환한다
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Date 객체를 'YYYY-MM-DD' 형식의 문자열 키로 변환한다
export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Date에서 'N월' 형태의 월 레이블 문자열을 반환한다
export function monthLabel(date: Date) {
  return `${date.getMonth() + 1}월`;
}

// Date에서 한국어 한자 연도 레이블(예: '2024년')을 반환한다
export function yearLabel(date: Date) {
  const formatter = new Intl.DateTimeFormat('ko-KR-u-nu-hang', { year: 'numeric' });
  return formatter.format(date).replace(/\s/g, '');
}

// 월별 35칸 캘린더 그리드를 만들어 각 날짜에 일기·일정 정보를 담아 반환한다
export function buildCalendarDays(params: {
  visibleMonth: Date;
  selectedDate: Date;
  today: Date;
  entries: DiaryEntrySummary[];
  schedules: ScheduleItem[];
}) {
  const { visibleMonth, selectedDate, today, entries, schedules } = params;
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
  const startWeekday = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startWeekday);

  const entriesByDate = new Map(entries.map((entry) => [entry.date, entry]));
  const schedulesByDate = new Map<string, ScheduleItem[]>();
  for (const schedule of schedules) {
    const current = schedulesByDate.get(schedule.date) ?? [];
    current.push(schedule);
    schedulesByDate.set(schedule.date, current);
  }
  const selectedKey = toDateKey(startOfDay(selectedDate));
  const todayKey = toDateKey(startOfDay(today));
  const days: CalendarDay[] = [];

  for (let index = 0; index < 35; index += 1) {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    const key = toDateKey(current);

    days.push({
      date: current,
      day: current.getDate(),
      inMonth: current >= monthStart && current <= monthEnd,
      isToday: key === todayKey,
      isSelected: key === selectedKey,
      entry: entriesByDate.get(key),
      schedules: schedulesByDate.get(key) ?? []
    });
  }

  return days;
}

// 해당 월에 작성된 일기 항목의 개수를 센다
export function countMonthlyEntries(visibleMonth: Date, entries: DiaryEntrySummary[]) {
  return entries.filter((entry) => {
    const [year, month] = entry.date.split('-').map(Number);
    return year === visibleMonth.getFullYear() && month === visibleMonth.getMonth() + 1;
  }).length;
}

// 선택된 날짜에 해당하는 일기 요약을 찾아 반환한다 (없으면 null)
export function getSelectedEntry(selectedDate: Date, entries: DiaryEntrySummary[]) {
  const key = toDateKey(selectedDate);
  return entries.find((entry) => entry.date === key) ?? null;
}
