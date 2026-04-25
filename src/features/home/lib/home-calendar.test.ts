import { describe, expect, it } from 'vitest';

import { buildCalendarDays, countMonthlyEntries, getSelectedEntry, monthLabel, toDateKey, yearLabel } from './home-calendar';
import type { DiaryEntrySummary, ScheduleItem } from '@/features/home/types/home.types';

function makeEntry(date: string, patch?: Partial<DiaryEntrySummary>): DiaryEntrySummary {
  return {
    id: date,
    date,
    status: 'saved',
    ...patch
  };
}

function makeSchedule(id: string, date: string, patch?: Partial<ScheduleItem>): ScheduleItem {
  return {
    id,
    date,
    title: `일정 ${id}`,
    ...patch
  };
}

describe('home calendar utilities', () => {
  it('formats date keys as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 3, 9))).toBe('2026-04-09');
  });

  it('formats month and year labels for the visible month', () => {
    const date = new Date(2026, 3, 1);

    expect(monthLabel(date)).toBe('4월');
    expect(yearLabel(date)).toBe('2026년');
  });

  it('builds a fixed 35-day calendar grid', () => {
    const days = buildCalendarDays({
      visibleMonth: new Date(2026, 3, 1),
      selectedDate: new Date(2026, 3, 9),
      today: new Date(2026, 3, 10),
      entries: [],
      schedules: []
    });

    expect(days).toHaveLength(35);
  });

  it('marks today and the selected date separately', () => {
    const days = buildCalendarDays({
      visibleMonth: new Date(2026, 3, 1),
      selectedDate: new Date(2026, 3, 9),
      today: new Date(2026, 3, 10),
      entries: [],
      schedules: []
    });

    expect(days.find((day) => day.isSelected)?.day).toBe(9);
    expect(days.find((day) => day.isToday)?.day).toBe(10);
  });

  it('attaches entries and schedules to matching dates', () => {
    const days = buildCalendarDays({
      visibleMonth: new Date(2026, 3, 1),
      selectedDate: new Date(2026, 3, 9),
      today: new Date(2026, 3, 10),
      entries: [makeEntry('2026-04-09', { title: '벚꽃' })],
      schedules: [makeSchedule('1', '2026-04-09'), makeSchedule('2', '2026-04-09')]
    });

    const selectedDay = days.find((day) => day.day === 9 && day.inMonth);
    expect(selectedDay?.entry?.title).toBe('벚꽃');
    expect(selectedDay?.schedules).toHaveLength(2);
  });

  it('counts only entries that belong to the visible month', () => {
    const count = countMonthlyEntries(new Date(2026, 3, 1), [
      makeEntry('2026-04-01'),
      makeEntry('2026-04-15'),
      makeEntry('2026-05-01')
    ]);

    expect(count).toBe(2);
  });

  it('returns the selected entry for the chosen date', () => {
    const entry = getSelectedEntry(new Date(2026, 3, 9), [
      makeEntry('2026-04-08'),
      makeEntry('2026-04-09', { title: '오늘 기록' })
    ]);

    expect(entry?.title).toBe('오늘 기록');
  });

  it('returns null when there is no selected entry', () => {
    const entry = getSelectedEntry(new Date(2026, 3, 9), [makeEntry('2026-04-08')]);

    expect(entry).toBeNull();
  });
});
