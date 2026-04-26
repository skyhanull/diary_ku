'use client';
// 인사이트 패널: 선택된 날짜의 일기·일정·감정 분포·날씨를 보여주는 우측 패널
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarPlus2, Cloud, CloudRain, CloudSun, Sparkles, Sun } from 'lucide-react';

import { getDailyFortune } from '@/features/home/lib/home-data';
import { toDateKey } from '@/features/home/lib/home-calendar';
import { fetchWeatherForCurrentPosition } from '@/features/home/lib/home-weather';
import { getCurrentUser } from '@/lib/client-auth';
import { APP_MESSAGES } from '@/lib/messages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DiaryEntrySummary, HomeWeather, MoodDistributionItem, ScheduleItem, WeatherIconName } from '@/features/home/types/home.types';

interface HomeInsightsPanelProps {
  selectedDate: Date;
  selectedDateLabel: string;
  selectedEntry: DiaryEntrySummary | null;
  monthlyMoodDistribution: MoodDistributionItem[];
  selectedSchedules: ScheduleItem[];
  onAddSchedule: (input: { date: string; title: string; note?: string }) => Promise<void>;
  onUpdateSchedule: (scheduleId: string, input: { date: string; title: string; note?: string }) => Promise<void>;
  onDeleteSchedule: (scheduleId: string) => Promise<void>;
  scheduleError: string | null;
  isScheduleSaving: boolean;
  isScheduleComposerOpen: boolean;
  onOpenScheduleComposer: () => void;
  onCloseScheduleComposer: () => void;
}

function getWeatherIcon(icon: WeatherIconName) {
  if (icon === 'cloud-sun') return CloudSun;
  if (icon === 'cloud') return Cloud;
  if (icon === 'rain') return CloudRain;
  return Sun;
}

function getStatusLabel(entry: DiaryEntrySummary | null) {
  if (!entry) return '새 기록을 시작해보세요';
  if (entry.status === 'draft') return '작성 중';
  if (entry.status === 'saved') return '저장 완료';
  return '공개됨';
}

export function HomeInsightsPanel({
  selectedDate,
  selectedDateLabel,
  selectedEntry,
  monthlyMoodDistribution,
  selectedSchedules,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  scheduleError,
  isScheduleSaving,
  isScheduleComposerOpen,
  onOpenScheduleComposer,
  onCloseScheduleComposer
}: HomeInsightsPanelProps) {
  const router = useRouter();
  const todayFortune = getDailyFortune(toDateKey(new Date()));
  const [weather, setWeather] = useState<HomeWeather | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleNote, setScheduleNote] = useState('');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const hasEntry = Boolean(selectedEntry);
  const totalMoodCount = useMemo(() => monthlyMoodDistribution.reduce((sum, item) => sum + item.count, 0), [monthlyMoodDistribution]);
  const moodDonutGradient = useMemo(() => {
    if (totalMoodCount === 0) return 'hsl(var(--muted))';

    let cursor = 0;
    const segments = monthlyMoodDistribution
      .filter((item) => item.count > 0)
      .map((item) => {
        const start = cursor;
        const end = cursor + (item.count / totalMoodCount) * 100;
        cursor = end;
        return `${item.color} ${start}% ${end}%`;
      });

    return `conic-gradient(${segments.join(', ')})`;
  }, [monthlyMoodDistribution, totalMoodCount]);
  const topMood = useMemo(
    () =>
      monthlyMoodDistribution
        .filter((item) => item.count > 0)
        .sort((left, right) => right.count - left.count || right.score - left.score)[0],
    [monthlyMoodDistribution]
  );

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      try {
        const nextWeather = await fetchWeatherForCurrentPosition();
        if (!cancelled) {
          setWeather(nextWeather);
        }
      } catch {
        if (!cancelled) {
          setWeatherError(true);
        }
      }
    };

    void loadWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isScheduleComposerOpen) {
      setScheduleTitle('');
      setScheduleNote('');
    }
  }, [isScheduleComposerOpen, selectedDateKey]);

  useEffect(() => {
    setEditingScheduleId(null);
  }, [selectedDateKey]);

  const handleSubmitSchedule = async () => {
    const trimmedTitle = scheduleTitle.trim();
    if (!trimmedTitle) {
      return;
    }

    await onAddSchedule({
      date: selectedDateKey,
      title: trimmedTitle,
      note: scheduleNote.trim() || undefined
    });

    setScheduleTitle('');
    setScheduleNote('');
    onCloseScheduleComposer();
  };

  const startEditingSchedule = (schedule: ScheduleItem) => {
    setEditingScheduleId(schedule.id);
    setScheduleTitle(schedule.title);
    setScheduleNote(schedule.note ?? '');
  };

  const handleSubmitScheduleEdit = async () => {
    if (!editingScheduleId) {
      return;
    }

    const trimmedTitle = scheduleTitle.trim();
    if (!trimmedTitle) {
      return;
    }

    await onUpdateSchedule(editingScheduleId, {
      date: selectedDateKey,
      title: trimmedTitle,
      note: scheduleNote.trim() || undefined
    });

    setEditingScheduleId(null);
    setScheduleTitle('');
    setScheduleNote('');
  };

  const handleCancelScheduleEdit = () => {
    setEditingScheduleId(null);
    setScheduleTitle('');
    setScheduleNote('');
  };

  const handleOpenEditor = async () => {
    const user = await getCurrentUser();
    if (!user) {
      window.alert(APP_MESSAGES.authRequiredAlert);
      return;
    }

    router.push(`/editor/${selectedDateKey}`);
  };

  const handleOpenScheduleComposer = async () => {
    const user = await getCurrentUser();
    if (!user) {
      window.alert(APP_MESSAGES.authRequiredAlert);
      return;
    }

    onOpenScheduleComposer();
  };

  return (
    <aside className="col-span-12 space-y-ds-6 lg:col-span-4">
      <section className="rounded-xl border border-border bg-card p-ds-card shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
        <div className="mb-ds-5 flex items-start justify-between gap-ds-4">
          <div>
            <h3 className="text-ds-title font-bold text-foreground">선택한 날짜</h3>
            <p className="mt-ds-1 text-ds-caption font-bold uppercase tracking-[0.2em] text-muted-foreground">{selectedDateLabel}</p>
          </div>
          <span className="rounded-full bg-secondary px-ds-3 py-ds-1 text-ds-caption font-semibold text-secondary-foreground">
            {selectedSchedules.length > 0 ? `일정 ${selectedSchedules.length}개` : getStatusLabel(selectedEntry)}
          </span>
        </div>

        <div className="rounded-lg bg-secondary/45 p-ds-4">
          <p className="text-ds-body font-semibold text-foreground">아직 저장된 일기 제목이 없는 하루예요.</p>
          <p className="mt-ds-2 text-ds-body text-muted-foreground">
            {hasEntry
              ? '이 날짜에는 저장된 일기가 있어요. 일정은 별도로 메인에서 함께 정리할 수 있어요.'
              : '달력에서 날짜를 고른 뒤 일기를 쓰거나, 먼저 일정만 가볍게 남겨둘 수도 있어요.'}
          </p>
          <div className="mt-ds-4 flex flex-wrap gap-ds-3">
            <button
              type="button"
              onClick={() => void handleOpenEditor()}
              className="inline-flex items-center gap-ds-2 text-ds-body font-bold text-primary transition-transform hover:translate-x-1"
            >
              {hasEntry ? '이 날짜 일기 열기' : '이 날짜에 일기 쓰기'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => void handleOpenScheduleComposer()} className="inline-flex items-center gap-ds-2 text-ds-body font-bold text-cedar transition-transform hover:translate-x-1">
              일정 추가
              <CalendarPlus2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-ds-4 rounded-lg border border-border/80 bg-white/70 p-ds-4">
          <div className="mb-ds-3 flex items-center justify-between">
            <p className="text-ds-body font-semibold text-foreground">일정</p>
            <span className="text-ds-caption font-medium text-muted-foreground">{selectedSchedules.length}개</span>
          </div>

          {selectedSchedules.length > 0 ? (
            <div className="space-y-ds-2">
              {selectedSchedules.map((schedule) => (
                <div key={schedule.id} className="rounded-lg bg-secondary/50 px-ds-3 py-ds-2">
                  <div className="flex items-center gap-ds-2">
                    <span className="text-ds-body font-semibold text-foreground">{schedule.title}</span>
                  </div>
                  {schedule.note ? <p className="mt-ds-1 text-ds-caption text-muted-foreground">{schedule.note}</p> : null}
                  <div className="mt-ds-2 flex gap-ds-3">
                    <button type="button" onClick={() => startEditingSchedule(schedule)} className="text-ds-caption font-semibold text-cedar">
                      수정
                    </button>
                    <button type="button" onClick={() => void onDeleteSchedule(schedule.id)} className="text-ds-caption font-semibold text-rose-danger">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ds-body text-muted-foreground">아직 일정이 없어요. 약속이나 해야 할 일을 날짜와 함께 남겨둘 수 있어요.</p>
          )}

          {scheduleError ? <p className="mt-ds-3 text-ds-body text-rose-danger">{scheduleError}</p> : null}

          {editingScheduleId ? (
            <div className="mt-ds-4 space-y-ds-3 rounded-lg border border-border/80 bg-card p-ds-4">
              <Input value={scheduleTitle} onChange={(event) => setScheduleTitle(event.target.value)} placeholder="예: 4시 카페 약속" />
              <textarea
                value={scheduleNote}
                onChange={(event) => setScheduleNote(event.target.value)}
                placeholder="짧은 메모가 있으면 적어주세요"
                className="min-h-24 w-full rounded-lg border border-input bg-secondary px-ds-3 py-ds-2 text-ds-body outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex gap-ds-2">
                <Button className="flex-1" size="sm" onClick={() => void handleSubmitScheduleEdit()} disabled={!scheduleTitle.trim() || isScheduleSaving}>
                  {isScheduleSaving ? '수정 중...' : '일정 수정'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelScheduleEdit}>
                  취소
                </Button>
              </div>
            </div>
          ) : isScheduleComposerOpen ? (
            <div className="mt-ds-4 space-y-ds-3 rounded-lg border border-border/80 bg-card p-ds-4">
              <Input value={scheduleTitle} onChange={(event) => setScheduleTitle(event.target.value)} placeholder="예: 4시 카페 약속" />
              <textarea
                value={scheduleNote}
                onChange={(event) => setScheduleNote(event.target.value)}
                placeholder="짧은 메모가 있으면 적어주세요"
                className="min-h-24 w-full rounded-lg border border-input bg-secondary px-ds-3 py-ds-2 text-ds-body outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex gap-ds-2">
                <Button className="flex-1" size="sm" onClick={() => void handleSubmitSchedule()} disabled={!scheduleTitle.trim() || isScheduleSaving}>
                  {isScheduleSaving ? '저장 중...' : '일정 저장'}
                </Button>
                <Button variant="outline" size="sm" onClick={onCloseScheduleComposer}>
                  닫기
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-ds-card shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
        <div className="mb-ds-5 flex items-start justify-between gap-ds-4">
          <div>
            <h3 className="text-ds-title font-bold text-foreground">이번 달 감정</h3>
            <p className="mt-ds-1 text-ds-caption font-bold uppercase tracking-[0.2em] text-muted-foreground">감정 비율</p>
          </div>
          <span className="rounded-full bg-secondary px-ds-3 py-ds-1 text-ds-caption font-semibold text-secondary-foreground">{totalMoodCount}개</span>
        </div>

        <div className="flex items-center gap-ds-6">
          <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: moodDonutGradient }}>
            <div className="grid h-20 w-20 place-items-center rounded-full bg-card text-center shadow-inner">
              {topMood ? (
                <div>
                  <div className="text-ds-emoji">{topMood.emoji}</div>
                  <div className="text-ds-caption font-bold text-foreground">{topMood.percentage}%</div>
                </div>
              ) : (
                <div className="text-ds-caption font-semibold text-muted-foreground">기록<br />없음</div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-ds-2">
            {monthlyMoodDistribution.map((item) => (
              <div key={item.score} className="flex items-center gap-ds-2 text-ds-body">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.count > 0 ? item.color : 'hsl(var(--border))' }} />
                <span className="w-7 text-ds-title">{item.emoji}</span>
                <span className="flex-1 font-medium text-foreground">{item.label}</span>
                <span className="text-ds-caption font-semibold text-muted-foreground">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative rounded-xl border border-border border-l-4 border-l-primary bg-card p-ds-card-lg shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
        <Sparkles className="absolute right-4 top-4 h-10 w-10 text-primary/10" />
        <div className="flex items-end justify-between gap-ds-4">
          <div>
            <h3 className="text-ds-title font-bold italic text-primary">오늘의 운세</h3>
            <p className="mt-ds-1 text-ds-caption font-bold uppercase tracking-[0.18em] text-muted-foreground">마음 지수</p>
          </div>
          <div className="text-right">
            <div className="font-display text-ds-display font-extrabold text-primary">{todayFortune.score}</div>
            <div className="mt-ds-1 text-ds-caption font-semibold text-muted-foreground">/ 100</div>
          </div>
        </div>
        <p className="mb-ds-3 mt-ds-5 leading-7 text-foreground">{todayFortune.message}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-ds-card shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
        <div className="mb-ds-6 flex items-center justify-between">
          <h3 className="text-ds-body font-bold uppercase tracking-[0.2em] text-foreground">날씨</h3>
          <span className="text-ds-micro font-bold text-muted-foreground">{weather?.locationLabel ?? '불러오는 중'}</span>
        </div>

        <div className="mb-ds-8 flex items-center gap-ds-6">
          {weather ? (() => {
            const CurrentIcon = getWeatherIcon(weather.currentIcon);
            return <CurrentIcon className="h-16 w-16 text-primary" />;
          })() : (
            <Sun className="h-16 w-16 animate-pulse text-primary/60" />
          )}
          <div>
            <div className="font-display text-ds-display font-extrabold text-foreground">{weather?.currentTemperature ?? '--°'}</div>
            <div className="text-ds-caption font-medium uppercase text-muted-foreground">
              {weatherError ? '날씨 정보를 불러오지 못했어요' : weather?.currentCondition ?? '현재 날씨 확인 중'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-ds-2 border-t border-border/80 pt-ds-4">
          {(weather?.forecast ?? []).map((item) => {
            const Icon = getWeatherIcon(item.icon);
            return (
              <div key={item.label} className="text-center">
                <div className="mb-ds-1 text-ds-micro font-bold uppercase text-muted-foreground/70">{item.label}</div>
                <Icon className="mx-auto mb-ds-1 h-5 w-5 text-primary/70" />
                <div className="text-ds-caption font-bold text-foreground">{item.temperature}</div>
              </div>
            );
          })}
          {!weather &&
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="text-center">
                <div className="mb-ds-1 text-ds-micro font-bold uppercase text-muted-foreground/40">-</div>
                <CloudSun className="mx-auto mb-ds-1 h-5 w-5 text-primary/30" />
                <div className="text-ds-caption font-bold text-foreground/40">--° / --°</div>
              </div>
            ))}
        </div>
      </section>
    </aside>
  );
}
