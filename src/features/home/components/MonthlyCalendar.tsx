'use client';
// 월간 캘린더: 날짜 선택·월 이동·일기 유무·일정 표시를 담당하는 캘린더 컴포넌트
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { CalendarDay } from '@/features/home/types/home.types';

interface MonthlyCalendarProps {
  monthLabel: string;
  yearLabel: string;
  days: CalendarDay[];
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const weekdayLabels = ['월', '화', '수', '목', '금', '토', '일'] as const;

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
        'flex aspect-square w-full flex-col justify-between p-ds-3 text-left text-ds-caption transition-colors duration-200',
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
            <span className="block text-ds-micro font-medium italic text-muted-foreground">{day.entry.title}</span>
          ) : (
            <span className="block truncate rounded bg-primary/10 px-1.5 py-0.5 text-ds-micro font-bold text-primary">{day.entry.title}</span>
          )
        ) : null}
        {day.schedules.length > 0 ? (
          <span className="block truncate rounded bg-peach px-1.5 py-0.5 text-ds-micro font-bold text-ink-umber">
            {day.schedules.length === 1 ? day.schedules[0].title : `일정 ${day.schedules.length}개`}
          </span>
        ) : null}
      </div>

      {statusDots.length > 0 ? (
        <div className="flex gap-ds-1">
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
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday
}: MonthlyCalendarProps) {
  return (
    <Card className="col-span-12 border-border/80 bg-card p-ds-card shadow-[0_12px_32px_rgba(52,50,47,0.04)] lg:col-span-8 lg:p-ds-card-lg">
      <header className="mb-ds-8 flex items-end justify-between gap-ds-4">
        <div>
          <h1 className="font-display text-ds-display font-extrabold text-primary">{monthLabel}</h1>
          <p className="mt-ds-1 text-ds-body font-medium text-muted-foreground">{yearLabel}</p>
        </div>

        <div className="flex gap-ds-2">
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
            className="bg-secondary py-ds-4 text-center text-ds-micro font-bold uppercase tracking-[0.2em] text-muted-foreground/80"
          >
            {label}
          </div>
        ))}
        {days.map((day, index) => (
          <CalendarCell key={`${day.date.toISOString()}-${index}`} day={day} onSelectDate={onSelectDate} />
        ))}
      </div>
    </Card>
  );
}
