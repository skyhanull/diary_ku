import type { ScheduleItem, ScheduleRow } from '@/features/home/types/home.types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

function formatDateBoundary(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function mapScheduleRow(row: ScheduleRow): ScheduleItem {
  return {
    id: row.id,
    date: row.schedule_date,
    title: row.title,
    note: row.note ?? undefined
  };
}

async function getAuthenticatedUserId() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

export async function loadMonthlySchedules(visibleMonth: Date): Promise<ScheduleItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return [];
  }

  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', userId)
    .gte('schedule_date', formatDateBoundary(monthStart))
    .lte('schedule_date', formatDateBoundary(monthEnd))
    .order('schedule_date', { ascending: true })
    .order('created_at', { ascending: true })
    .returns<ScheduleRow[]>();

  if (error) throw error;

  return (data ?? []).map(mapScheduleRow);
}

export async function createSchedule(input: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('일정을 저장하려면 로그인해야 해요.');
  }

  const { data, error } = await supabase
    .from('schedules')
    .insert({
      user_id: userId,
      schedule_date: input.date,
      title: input.title,
      note: input.note ?? null
    })
    .select('*')
    .single<ScheduleRow>();

  if (error) throw error;

  return mapScheduleRow(data);
}

export async function updateSchedule(scheduleId: string, input: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('일정을 수정하려면 로그인해야 해요.');
  }

  const { data, error } = await supabase
    .from('schedules')
    .update({
      schedule_date: input.date,
      title: input.title,
      note: input.note ?? null
    })
    .eq('id', scheduleId)
    .eq('user_id', userId)
    .select('*')
    .single<ScheduleRow>();

  if (error) throw error;

  return mapScheduleRow(data);
}

export async function removeSchedule(scheduleId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('일정을 삭제하려면 로그인해야 해요.');
  }

  const { error } = await supabase.from('schedules').delete().eq('id', scheduleId).eq('user_id', userId);
  if (error) throw error;
}
