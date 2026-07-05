'use client';
// 홈 대시보드: 캘린더·인사이트 패널을 조합하고 일기·일정 데이터를 불러와 관리한다
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cloud, CloudRain, CloudSun, Flame, PenLine, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/client-auth';
import { MonthlyCalendar } from '@/features/home/components/MonthlyCalendar';
import { DemoAccountPrompt } from '@/features/home/components/DemoAccountPrompt';
import { HomeInsightsPanel } from '@/features/home/components/HomeInsightsPanel';
import { buildCalendarDays, getSelectedEntry, monthLabel, toDateKey, yearLabel } from '@/features/home/lib/home-calendar';
import { loadMonthlyDiaryEntrySummaries } from '@/features/home/lib/diary-summary';
import { createSchedule, loadMonthlySchedules, removeSchedule, updateSchedule } from '@/features/home/lib/home-schedules';
import { fetchWeatherForCurrentPosition } from '@/features/home/lib/home-weather';
import type { DiaryEntrySummary, HomeWeather, MoodDistributionItem, ScheduleItem, WeatherIconName } from '@/features/home/types/home.types';
import { APP_MESSAGES, getUserFacingErrorMessage, isAuthRequiredMessage } from '@/lib/messages';
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

// 날씨 상태값에 맞는 아이콘 컴포넌트를 반환한다
function getWeatherIcon(icon: WeatherIconName) {
  if (icon === 'cloud-sun') return CloudSun;
  if (icon === 'cloud') return Cloud;
  if (icon === 'rain') return CloudRain;
  return Sun;
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
  const [todayMonthEntries, setTodayMonthEntries] = useState<DiaryEntrySummary[]>([]);
  const [weather, setWeather] = useState<HomeWeather | null>(null);
  const router = useRouter();

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
          setScheduleError(getUserFacingErrorMessage(error, APP_MESSAGES.scheduleLoadFailed));
        }
      }
    };

    void syncSchedules();

    return () => {
      cancelled = true;
    };
  }, [visibleMonth]);

  // 상단 상태바(스트릭·오늘 쓰기)는 캘린더 이동과 무관하게 항상 "오늘"이 속한 달 기준으로 계산한다
  useEffect(() => {
    let cancelled = false;

    const syncTodayMonth = async () => {
      try {
        const list = await loadMonthlyDiaryEntrySummaries(new Date(today.getFullYear(), today.getMonth(), 1));
        if (!cancelled) setTodayMonthEntries(list);
      } catch {
        if (!cancelled) setTodayMonthEntries([]);
      }
    };

    void syncTodayMonth();

    return () => {
      cancelled = true;
    };
  }, [today]);

  useEffect(() => {
    let cancelled = false;
    void fetchWeatherForCurrentPosition()
      .then((next) => {
        if (!cancelled) setWeather(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const todayKey = useMemo(() => toDateKey(today), [today]);
  const todayHasEntry = useMemo(() => todayMonthEntries.some((entry) => entry.date === todayKey), [todayMonthEntries, todayKey]);
  const monthRecordedDays = todayMonthEntries.length;
  const daysInThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  // 오늘(또는 어제)부터 거꾸로 세어 연속 기록 일수를 구한다. 로드된 이번 달 범위 안에서만 계산한다.
  const streak = useMemo(() => {
    const recorded = new Set(todayMonthEntries.map((entry) => entry.date));
    let count = 0;
    const cursor = new Date(today);
    if (!recorded.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (recorded.has(toDateKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [todayMonthEntries, today]);

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
      const message = getUserFacingErrorMessage(error, '일정을 저장하는 중 문제가 발생했어요.');
      setScheduleError(message);
      if (isAuthRequiredMessage(message)) {
        window.alert(APP_MESSAGES.authRequiredAlert);
      }
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
      const message = getUserFacingErrorMessage(error, '일정을 수정하는 중 문제가 발생했어요.');
      setScheduleError(message);
      if (isAuthRequiredMessage(message)) {
        window.alert(APP_MESSAGES.authRequiredAlert);
      }
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
      const message = getUserFacingErrorMessage(error, '일정을 삭제하는 중 문제가 발생했어요.');
      setScheduleError(message);
      if (isAuthRequiredMessage(message)) {
        window.alert(APP_MESSAGES.authRequiredAlert);
      }
    } finally {
      setIsScheduleSaving(false);
    }
  };

  // 오늘 일기 에디터로 이동한다. 미로그인 시 안내 후 중단한다.
  const handleWriteToday = async () => {
    const user = await getCurrentUser();
    if (!user) {
      window.alert(APP_MESSAGES.authRequiredAlert);
      return;
    }
    router.push(`/editor/${todayKey}`);
  };

  return (
    <>
      <DemoAccountPrompt />
      <main className="mx-auto grid max-w-7xl grid-cols-12 items-start gap-ds-8 px-ds-page pb-ds-12 pt-ds-8 lg:px-ds-page-lg">
        <section className="col-span-12 flex flex-col gap-ds-4 rounded-xl border border-border bg-card p-ds-card shadow-[0_12px_32px_rgba(52,50,47,0.04)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-ds-4">
            <span className="flex items-center gap-ds-2 text-ds-title font-bold text-foreground">
              <Flame className={`h-5 w-5 ${streak > 0 ? 'text-primary' : 'text-muted-foreground/50'}`} />
              {streak > 0 ? `${streak}일 연속 기록` : '연속 기록 시작 전'}
            </span>
            <span className="text-ds-body text-muted-foreground">
              이번 달 <span className="font-semibold text-foreground">{monthRecordedDays}일</span> / {daysInThisMonth}일 기록
            </span>
            {weather ? (() => {
              const WeatherIcon = getWeatherIcon(weather.currentIcon);
              return (
                <span className="flex items-center gap-ds-1 text-ds-body text-muted-foreground" title={weather.locationLabel}>
                  <WeatherIcon className="h-4 w-4 text-primary" />
                  {weather.currentTemperature}
                </span>
              );
            })() : null}
          </div>
          <Button className="h-11 shrink-0" onClick={() => void handleWriteToday()}>
            <PenLine className="mr-ds-2 h-4 w-4" />
            {todayHasEntry ? '오늘 일기 이어쓰기' : '오늘 일기 쓰기'}
          </Button>
        </section>

        <div className="col-span-12 lg:col-span-8">
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
        </div>

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
    </>
  );
}
