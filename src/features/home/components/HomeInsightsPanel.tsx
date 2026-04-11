'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarPlus2, Cloud, CloudRain, CloudSun, Flame, Sparkles, Sun } from 'lucide-react';

import { getDailyFortune } from '@/features/home/lib/home-data';
import { toDateKey } from '@/features/home/lib/home-calendar';
import { fetchWeatherForCurrentPosition } from '@/features/home/lib/home-weather';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DiaryEntrySummary, HomeWeather, MoodTrendPoint, ScheduleItem, WeatherIconName } from '@/features/home/types/home.types';

interface HomeInsightsPanelProps {
  selectedDate: Date;
  selectedDateLabel: string;
  selectedEntry: DiaryEntrySummary | null;
  moodTrend: MoodTrendPoint[];
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
  moodTrend,
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
  const todayFortune = getDailyFortune(toDateKey(new Date()));
  const [weather, setWeather] = useState<HomeWeather | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleNote, setScheduleNote] = useState('');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const hasEntry = Boolean(selectedEntry);

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

  return (
    <aside className="col-span-12 space-y-6 lg:col-span-4">
      <section className="rounded-xl border border-border bg-card p-6 shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">선택한 날짜</h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{selectedDateLabel}</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            {selectedSchedules.length > 0 ? `일정 ${selectedSchedules.length}개` : getStatusLabel(selectedEntry)}
          </span>
        </div>

        <div className="rounded-lg bg-secondary/45 p-4">
          <p className="text-sm font-semibold text-foreground">아직 저장된 일기 제목이 없는 하루예요.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {hasEntry
              ? '이 날짜에는 저장된 일기가 있어요. 일정은 별도로 메인에서 함께 정리할 수 있어요.'
              : '달력에서 날짜를 고른 뒤 일기를 쓰거나, 먼저 일정만 가볍게 남겨둘 수도 있어요.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/editor/${selectedDateKey}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-primary transition-transform hover:translate-x-1"
            >
              {hasEntry ? '이 날짜 일기 열기' : '이 날짜에 일기 쓰기'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button type="button" onClick={onOpenScheduleComposer} className="inline-flex items-center gap-2 text-sm font-bold text-[#8C6A5D] transition-transform hover:translate-x-1">
              일정 추가
              <CalendarPlus2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border/80 bg-white/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">일정</p>
            <span className="text-xs font-medium text-muted-foreground">{selectedSchedules.length}개</span>
          </div>

          {selectedSchedules.length > 0 ? (
            <div className="space-y-2">
              {selectedSchedules.map((schedule) => (
                <div key={schedule.id} className="rounded-lg bg-secondary/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{schedule.title}</span>
                  </div>
                  {schedule.note ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{schedule.note}</p> : null}
                  <div className="mt-2 flex gap-3">
                    <button type="button" onClick={() => startEditingSchedule(schedule)} className="text-xs font-semibold text-[#8C6A5D]">
                      수정
                    </button>
                    <button type="button" onClick={() => void onDeleteSchedule(schedule.id)} className="text-xs font-semibold text-[#a83836]">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">아직 일정이 없어요. 약속이나 해야 할 일을 날짜와 함께 남겨둘 수 있어요.</p>
          )}

          {scheduleError ? <p className="mt-3 text-sm text-[#a83836]">{scheduleError}</p> : null}

          {editingScheduleId ? (
            <div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-card p-4">
              <Input value={scheduleTitle} onChange={(event) => setScheduleTitle(event.target.value)} placeholder="예: 4시 카페 약속" />
              <textarea
                value={scheduleNote}
                onChange={(event) => setScheduleNote(event.target.value)}
                placeholder="짧은 메모가 있으면 적어주세요"
                className="min-h-24 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex gap-2">
                <Button className="flex-1" size="sm" onClick={() => void handleSubmitScheduleEdit()} disabled={!scheduleTitle.trim() || isScheduleSaving}>
                  {isScheduleSaving ? '수정 중...' : '일정 수정'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelScheduleEdit}>
                  취소
                </Button>
              </div>
            </div>
          ) : isScheduleComposerOpen ? (
            <div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-card p-4">
              <Input value={scheduleTitle} onChange={(event) => setScheduleTitle(event.target.value)} placeholder="예: 4시 카페 약속" />
              <textarea
                value={scheduleNote}
                onChange={(event) => setScheduleNote(event.target.value)}
                placeholder="짧은 메모가 있으면 적어주세요"
                className="min-h-24 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex gap-2">
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

      <section className="rounded-xl border border-border bg-card p-6 shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
        <h3 className="text-lg font-bold text-foreground">감정 흐름</h3>
        <p className="mb-6 mt-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">최근 7일</p>

        <div className="mb-4 flex h-24 items-end justify-between gap-2">
          {moodTrend.map((point, index) => (
            <div
              key={point.date}
              className={`w-full rounded-t-lg transition-all ${index === moodTrend.length - 1 ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'} ${point.score === null ? 'opacity-25' : ''}`}
              style={{ height: `${point.score ?? 8}%` }}
              title={point.score === null ? `${point.date}: 기록 없음` : `${point.date}: ${point.score}점`}
            />
          ))}
        </div>

        <div className="flex justify-between px-1 text-[10px] font-bold text-muted-foreground/70">
          {moodTrend.map((point) => (
            <span key={point.date}>{point.label}</span>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-between rounded-xl border border-border bg-card p-6 shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-foreground">연속 기록</h3>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-['Epilogue'] text-4xl font-extrabold text-primary">12</span>
            <span className="text-sm font-medium text-muted-foreground">일 연속</span>
          </div>
        </div>

        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/10">
          <div className="absolute inset-0 rounded-full border-4 border-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0 75%)' }} />
          <Flame className="h-6 w-6 text-primary" />
        </div>
      </section>

      <section className="relative rounded-xl border border-border border-l-4 border-l-primary bg-card p-8 shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
        <Sparkles className="absolute right-4 top-4 h-10 w-10 text-primary/10" />
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold italic text-primary">오늘의 운세</h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">마음 지수</p>
          </div>
          <div className="text-right">
            <div className="font-['Epilogue'] text-4xl font-extrabold leading-none text-primary">{todayFortune.score}</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">/ 100</div>
          </div>
        </div>
        <p className="mb-3 mt-5 leading-7 text-foreground">{todayFortune.message}</p>
        <p className="text-sm leading-6 text-muted-foreground">가볍게 읽고 지나가도 좋은, 오늘의 작은 신호처럼 두었어요.</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">날씨</h3>
          <span className="text-[10px] font-bold text-muted-foreground">{weather?.locationLabel ?? '불러오는 중'}</span>
        </div>

        <div className="mb-8 flex items-center gap-6">
          {weather ? (() => {
            const CurrentIcon = getWeatherIcon(weather.currentIcon);
            return <CurrentIcon className="h-16 w-16 text-primary" />;
          })() : (
            <Sun className="h-16 w-16 animate-pulse text-primary/60" />
          )}
          <div>
            <div className="font-['Epilogue'] text-4xl font-extrabold text-foreground">{weather?.currentTemperature ?? '--°'}</div>
            <div className="text-xs font-medium uppercase tracking-tight text-muted-foreground">
              {weatherError ? '날씨 정보를 불러오지 못했어요' : weather?.currentCondition ?? '현재 날씨 확인 중'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border/80 pt-4">
          {(weather?.forecast ?? []).map((item) => {
            const Icon = getWeatherIcon(item.icon);
            return (
              <div key={item.label} className="text-center">
                <div className="mb-1 text-[10px] font-bold uppercase text-muted-foreground/70">{item.label}</div>
                <Icon className="mx-auto mb-1 h-5 w-5 text-primary/70" />
                <div className="text-xs font-bold text-foreground">{item.temperature}</div>
              </div>
            );
          })}
          {!weather &&
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="text-center">
                <div className="mb-1 text-[10px] font-bold uppercase text-muted-foreground/40">-</div>
                <CloudSun className="mx-auto mb-1 h-5 w-5 text-primary/30" />
                <div className="text-xs font-bold text-foreground/40">--° / --°</div>
              </div>
            ))}
        </div>
      </section>
    </aside>
  );
}
