// 일정 DB 레이어: Supabase에서 월별 일정을 불러오고 생성·수정·삭제한다
import type { ScheduleItem, ScheduleRow } from '@/features/home/types/home.types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { formatDateBoundary } from '@/lib/date';

// DB의 ScheduleRow를 UI에서 쓰는 ScheduleItem 형태로 변환한다
function mapScheduleRow(row: ScheduleRow): ScheduleItem {
  return {
    id: row.id,
    date: row.schedule_date,
    title: row.title,
    note: row.note ?? undefined
  };
}

// 현재 로그인한 사용자의 ID를 Supabase에서 가져온다 (미로그인 시 null 반환)
async function getAuthenticatedUserId() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

// 주어진 월의 일정 목록을 Supabase에서 날짜 오름차순으로 불러온다
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

// 새 일정을 Supabase에 저장하고 생성된 ScheduleItem을 반환한다
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

// 기존 일정의 내용을 수정하고 업데이트된 ScheduleItem을 반환한다
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

// 지정한 일정을 Supabase에서 삭제한다
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
