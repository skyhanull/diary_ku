import type { CalendarDay, DiaryEntrySummary, ScheduleItem } from '@/features/home/types/home.types';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function monthLabel(date: Date) {
  return `${date.getMonth() + 1}월`;
}

export function yearLabel(date: Date) {
  const formatter = new Intl.DateTimeFormat('ko-KR-u-nu-hang', { year: 'numeric' });
  return formatter.format(date).replace(/\s/g, '');
}

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

export function countMonthlyEntries(visibleMonth: Date, entries: DiaryEntrySummary[]) {
  return entries.filter((entry) => {
    const [year, month] = entry.date.split('-').map(Number);
    return year === visibleMonth.getFullYear() && month === visibleMonth.getMonth() + 1;
  }).length;
}

export function getSelectedEntry(selectedDate: Date, entries: DiaryEntrySummary[]) {
  const key = toDateKey(selectedDate);
  return entries.find((entry) => entry.date === key) ?? null;
}
