'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { CalendarDay } from '@/features/home/types/home.types';

interface MonthlyCalendarProps {
  monthLabel: string;
  yearLabel: string;
  days: CalendarDay[];
  selectedDateKey: string;
  monthlyRecordCount: number;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onRequestAddSchedule: () => void;
}

const weekdayLabels = ['월', '화', '수', '목', '금', '토', '일'] as const;

const recordBadges = [
  { icon: FileText, bg: 'bg-[#fcd1c1]', fg: 'text-[#63463a]' },
  { icon: ImageIcon, bg: 'bg-[#f8dec1]', fg: 'text-[#614f38]' },
  { label: '+4', bg: 'bg-[#e7e2dd]', fg: 'text-[#615f5b]' }
] as const;

function CalendarCell({
  day,
  onSelectDate
}: {
  day: CalendarDay;
  onSelectDate: (date: Date) => void;
}) {
  const baseClassName = day.inMonth
    ? 'bg-card text-foreground hover:bg-secondary/70'
    : 'bg-secondary/35 text-muted-foreground/60';

  const selectedClassName = day.isSelected
    ? 'border-2 border-primary/40 ring-4 ring-primary/5'
    : 'border border-transparent';

  const statusDots = [
    day.entry?.hasText ? 'primary' : null,
    day.entry?.hasPhoto ? 'secondary' : null,
    day.entry?.hasSticker ? 'muted' : null
  ].filter(Boolean) as Array<'primary' | 'secondary' | 'muted'>;

  const content = (
    <button
      type="button"
      onClick={() => {
        if (!day.inMonth) return;
        onSelectDate(day.date);
      }}
      className={[
        'flex aspect-square w-full flex-col justify-between p-3 text-left text-xs transition-colors duration-200',
        baseClassName,
        selectedClassName,
        day.inMonth ? 'cursor-pointer' : ''
      ].join(' ')}
      disabled={!day.inMonth}
    >
      <span
        className={[
          'font-semibold',
          day.isSelected || day.isToday ? 'text-primary' : '',
          !day.inMonth ? 'opacity-70' : ''
        ].join(' ')}
      >
        {day.day}
      </span>

      <div className="mt-auto space-y-1">
        {day.entry?.title ? (
          day.isSelected ? (
            <span className="block text-[9px] font-medium italic text-muted-foreground">{day.entry.title}</span>
          ) : (
            <span className="block truncate rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">{day.entry.title}</span>
          )
        ) : null}
        {day.schedules.length > 0 ? (
          <span className="block truncate rounded bg-[#f8dec1] px-1.5 py-0.5 text-[9px] font-bold text-[#7a5a2a]">
            {day.schedules.length === 1 ? day.schedules[0].title : `일정 ${day.schedules.length}개`}
          </span>
        ) : null}
      </div>

      {statusDots.length > 0 ? (
        <div className="flex gap-1">
          {statusDots.map((dot, index) => (
            <span
              key={`${day.date.toISOString()}-${dot}-${index}`}
              className={[
                'h-1.5 w-1.5 rounded-full',
                dot === 'primary' ? 'bg-primary' : '',
                dot === 'secondary' ? 'bg-secondary-foreground' : '',
                dot === 'muted' ? 'bg-primary/25' : ''
              ].join(' ')}
            />
          ))}
        </div>
      ) : null}
    </button>
  );
  return content;
}

export function MonthlyCalendar({
  monthLabel,
  yearLabel,
  days,
  monthlyRecordCount,
  selectedDateKey,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onRequestAddSchedule
}: MonthlyCalendarProps) {
  return (
    <Card className="col-span-12 border-border/80 bg-card p-6 shadow-[0_12px_32px_rgba(52,50,47,0.04)] lg:col-span-8 lg:p-8">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-['Epilogue'] text-4xl font-extrabold tracking-tight text-primary">{monthLabel}</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{yearLabel}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="iconSoft" onClick={onPrevMonth} aria-label="이전 달">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday} className="tracking-[0.2em]">
            오늘
          </Button>
          <Button variant="ghost" size="iconSoft" onClick={onNextMonth} aria-label="다음 달">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border/80 bg-border/70">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="bg-secondary py-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80"
          >
            {label}
          </div>
        ))}
        {days.map((day, index) => (
          <CalendarCell key={`${day.date.toISOString()}-${index}`} day={day} onSelectDate={onSelectDate} />
        ))}
      </div>

      <footer className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex -space-x-2">
            {recordBadges.map((badge, index) =>
              'icon' in badge ? (
                <div
                  key={index}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ${badge.bg}`}
                >
                  <badge.icon className={`h-3.5 w-3.5 ${badge.fg}`} />
                </div>
              ) : (
                <div
                  key={index}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold ${badge.bg} ${badge.fg}`}
                >
                  {badge.label}
                </div>
              )
            )}
          </div>
          <span className="text-sm italic text-muted-foreground">
            이번 달에 {monthlyRecordCount}개의 기록이 저장되었습니다. 현재 선택: {selectedDateKey}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/editor/${selectedDateKey}`}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_32px_rgba(52,50,47,0.08)] transition-all duration-200 hover:brightness-[1.03] active:scale-95"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            <span className="font-['Epilogue'] text-base font-bold tracking-tight">선택한 날짜에 일기 쓰기</span>
          </Link>
          <Button variant="outline" className="rounded-full px-6" onClick={onRequestAddSchedule}>
            선택한 날짜에 일정 추가
          </Button>
        </div>
      </footer>
    </Card>
  );
}
