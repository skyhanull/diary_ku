'use client';

import { useEffect, useMemo, useState } from 'react';

import { MonthlyCalendar } from '@/features/home/components/MonthlyCalendar';
import { HomeInsightsPanel } from '@/features/home/components/HomeInsightsPanel';
import { buildCalendarDays, countMonthlyEntries, getSelectedEntry, monthLabel, toDateKey, yearLabel } from '@/features/home/lib/home-calendar';
import { createSchedule, loadMonthlySchedules, removeSchedule, updateSchedule } from '@/features/home/lib/home-schedules';
import { loadMonthlyDiaryEntrySummaries } from '@/features/home/lib/home-persistence';
import type { DiaryEntrySummary, ScheduleItem } from '@/features/home/types/home.types';

function formatSelectedDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(date);
}

export function HomeDashboard() {
  const [today] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [entries, setEntries] = useState<DiaryEntrySummary[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isScheduleComposerOpen, setIsScheduleComposerOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);

  const moveMonth = (offset: number) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
    setIsScheduleComposerOpen(false);
  };

  useEffect(() => {
    let cancelled = false;

    const syncEntries = async () => {
      try {
        const nextEntries = await loadMonthlyDiaryEntrySummaries(visibleMonth);
        if (!cancelled) {
          setEntries(nextEntries);
        }
      } catch {
        if (!cancelled) {
          setEntries([]);
        }
      }
    };

    void syncEntries();

    return () => {
      cancelled = true;
    };
  }, [visibleMonth]);

  useEffect(() => {
    let cancelled = false;

    const syncSchedules = async () => {
      try {
        const nextSchedules = await loadMonthlySchedules(visibleMonth);
        if (!cancelled) {
          setSchedules(nextSchedules);
          setScheduleError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setSchedules([]);
          setScheduleError(error instanceof Error ? error.message : '일정을 불러오는 중 문제가 발생했어요.');
        }
      }
    };

    void syncSchedules();

    return () => {
      cancelled = true;
    };
  }, [visibleMonth]);

  const calendarDays = useMemo(
    () =>
      buildCalendarDays({
        visibleMonth,
        selectedDate,
        today,
        entries,
        schedules
      }),
    [entries, schedules, selectedDate, today, visibleMonth]
  );

  const selectedEntry = useMemo(() => getSelectedEntry(selectedDate, entries), [entries, selectedDate]);
  const selectedSchedules = useMemo(() => schedules.filter((schedule) => schedule.date === toDateKey(selectedDate)), [schedules, selectedDate]);
  const monthlyCount = useMemo(() => countMonthlyEntries(visibleMonth, entries), [entries, visibleMonth]);

  const handleAddSchedule = async (input: { date: string; title: string; note?: string }) => {
    setIsScheduleSaving(true);
    setScheduleError(null);

    try {
      const createdSchedule = await createSchedule(input);
      setSchedules((prev) =>
        [...prev, createdSchedule].sort((left, right) => left.date.localeCompare(right.date, 'ko'))
      );
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : '일정을 저장하는 중 문제가 발생했어요.');
    } finally {
      setIsScheduleSaving(false);
    }
  };

  const handleUpdateSchedule = async (scheduleId: string, input: { date: string; title: string; note?: string }) => {
    setIsScheduleSaving(true);
    setScheduleError(null);

    try {
      const updatedSchedule = await updateSchedule(scheduleId, input);
      setSchedules((prev) =>
        prev
          .map((schedule) => (schedule.id === scheduleId ? updatedSchedule : schedule))
          .sort((left, right) => left.date.localeCompare(right.date, 'ko'))
      );
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : '일정을 수정하는 중 문제가 발생했어요.');
    } finally {
      setIsScheduleSaving(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    setIsScheduleSaving(true);
    setScheduleError(null);

    try {
      await removeSchedule(scheduleId);
      setSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId));
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : '일정을 삭제하는 중 문제가 발생했어요.');
    } finally {
      setIsScheduleSaving(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-[1440px] grid-cols-12 gap-8 px-6 pb-12 pt-8 lg:px-8">
      <MonthlyCalendar
        monthLabel={monthLabel(visibleMonth)}
        yearLabel={yearLabel(visibleMonth)}
        days={calendarDays}
        monthlyRecordCount={monthlyCount}
        selectedDateKey={toDateKey(selectedDate)}
        onSelectDate={setSelectedDate}
        onPrevMonth={() => moveMonth(-1)}
        onNextMonth={() => moveMonth(1)}
        onToday={() => {
          setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
          setSelectedDate(today);
          setIsScheduleComposerOpen(false);
        }}
        onRequestAddSchedule={() => setIsScheduleComposerOpen(true)}
      />

      <HomeInsightsPanel
        selectedDate={selectedDate}
        selectedDateLabel={formatSelectedDate(selectedDate)}
        selectedEntry={selectedEntry}
        selectedSchedules={selectedSchedules}
        onAddSchedule={handleAddSchedule}
        onUpdateSchedule={handleUpdateSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        scheduleError={scheduleError}
        isScheduleSaving={isScheduleSaving}
        isScheduleComposerOpen={isScheduleComposerOpen}
        onOpenScheduleComposer={() => setIsScheduleComposerOpen(true)}
        onCloseScheduleComposer={() => setIsScheduleComposerOpen(false)}
      />
    </main>
  );
}
