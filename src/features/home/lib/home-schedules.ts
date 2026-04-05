import type { ScheduleItem } from '@/features/home/types/home.types';

const STORAGE_KEY = 'dearme-home-schedules';

export function loadSchedules(): ScheduleItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ScheduleItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSchedules(schedules: ScheduleItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

export function createSchedule(input: Omit<ScheduleItem, 'id'>): ScheduleItem {
  return {
    id: `${input.date}-${Date.now()}`,
    ...input
  };
}

export function updateSchedule(schedules: ScheduleItem[], scheduleId: string, input: Omit<ScheduleItem, 'id'>) {
  return schedules.map((schedule) => (schedule.id === scheduleId ? { id: scheduleId, ...input } : schedule));
}

export function removeSchedule(schedules: ScheduleItem[], scheduleId: string) {
  return schedules.filter((schedule) => schedule.id !== scheduleId);
}
