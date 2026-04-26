'use client';
// 홈 대시보드: 캘린더·인사이트 패널을 조합하고 일기·일정 데이터를 불러와 관리한다
import { useEffect, useMemo, useState } from 'react';

import { MonthlyCalendar } from '@/features/home/components/MonthlyCalendar';
import { HomeInsightsPanel } from '@/features/home/components/HomeInsightsPanel';
import { buildCalendarDays, getSelectedEntry, monthLabel, toDateKey, yearLabel } from '@/features/home/lib/home-calendar';
import { loadMonthlyDiaryEntrySummaries } from '@/features/home/lib/diary-summary';
import { createSchedule, loadMonthlySchedules, removeSchedule, updateSchedule } from '@/features/home/lib/home-schedules';
import type { DiaryEntrySummary, MoodDistributionItem, ScheduleItem } from '@/features/home/types/home.types';
import { moodMeta } from '@/lib/mood';
import { formatSelectedDate } from '@/lib/date';

// 해당 월 일기 목록에서 감정별 개수와 비율을 계산해 분포 배열을 반환한다
function buildMonthlyMoodDistribution(entries: DiaryEntrySummary[]): MoodDistributionItem[] {
  const scoreCounts = new Map<number, number>();

  for (const entry of entries) {
    if (entry.moodScore === undefined) continue;
    scoreCounts.set(entry.moodScore, (scoreCounts.get(entry.moodScore) ?? 0) + 1);
  }

  const total = [...scoreCounts.values()].reduce((sum, count) => sum + count, 0);

  return moodMeta.map((item) => {
    const count = scoreCounts.get(item.score) ?? 0;

    return {
      ...item,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    };
  });
}

// 홈 페이지의 최상위 컨테이너로 캘린더와 인사이트 패널을 조합하고 데이터 상태를 관리한다
export function HomeDashboard() {
  const [today] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [entries, setEntries] = useState<DiaryEntrySummary[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isScheduleComposerOpen, setIsScheduleComposerOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);

  // offset 방향으로 표시 월을 이동하고 선택 날짜를 해당 월 1일로 초기화한다
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

  // 표시 월·선택 날짜·일기·일정이 바뀔 때마다 캘린더 그리드 데이터를 재계산한다
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

  // 선택된 날짜에 해당하는 일기 요약을 메모이제이션해 반환한다
  const selectedEntry = useMemo(() => getSelectedEntry(selectedDate, entries), [entries, selectedDate]);
  // 선택된 날짜의 일정만 필터링해 메모이제이션한다
  const selectedSchedules = useMemo(() => schedules.filter((schedule) => schedule.date === toDateKey(selectedDate)), [schedules, selectedDate]);
  // 현재 월 일기 목록에서 감정 분포를 메모이제이션해 계산한다
  const monthlyMoodDistribution = useMemo(() => buildMonthlyMoodDistribution(entries), [entries]);

  // 새 일정을 서버에 저장하고 로컬 상태에 추가한다
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

  // 기존 일정을 서버에서 수정하고 로컬 상태를 업데이트한다
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

  // 지정한 일정을 서버에서 삭제하고 로컬 상태에서 제거한다
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
    <main className="mx-auto grid max-w-[1440px] grid-cols-12 gap-ds-8 px-ds-page pb-ds-12 pt-ds-8 lg:px-ds-page-lg">
      <MonthlyCalendar
        monthLabel={monthLabel(visibleMonth)}
        yearLabel={yearLabel(visibleMonth)}
        days={calendarDays}
        onSelectDate={setSelectedDate}
        onPrevMonth={() => moveMonth(-1)}
        onNextMonth={() => moveMonth(1)}
        onToday={() => {
          setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
          setSelectedDate(today);
          setIsScheduleComposerOpen(false);
        }}
      />

      <HomeInsightsPanel
        selectedDate={selectedDate}
        selectedDateLabel={formatSelectedDate(selectedDate)}
        selectedEntry={selectedEntry}
        monthlyMoodDistribution={monthlyMoodDistribution}
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
