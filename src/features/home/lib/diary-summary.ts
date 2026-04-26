// 일기 요약 레이어: diary_entries + editor_items를 합쳐 홈·보관함에서 바로 쓸 수 있는 DiaryEntrySummary를 만든다
import type { DiaryEntrySummary } from '@/features/home/types/home.types';
import { getMoodScore } from '@/features/home/lib/home-mood';
import type { EditorItemPayload } from '@/features/editor/types/editor.types';
import { getCurrentUser } from '@/lib/client-auth';
import { htmlToPlainText } from '@/lib/html';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { formatDateBoundary } from '@/lib/date';

// Supabase diary_entries 테이블에서 조회한 날것의 행 타입
interface DiaryEntrySummaryRow {
  id: string;
  entry_date: string;
  title: string | null;
  body_html: string | null;
  mood: string | null;
  tags: string[] | null;
  status: DiaryEntrySummary['status'];
  updated_at: string;
}

// Supabase editor_items 테이블에서 조회한 날것의 행 타입
interface EditorItemSummaryRow {
  entry_id: string;
  type: 'text' | 'sticker' | 'image' | 'gif';
  payload: EditorItemPayload | null;
}

// DB 행 배열을 DiaryEntrySummary 배열로 변환해 홈·보관함에서 쓸 수 있게 만든다
function mapEntryRowsToSummaries(entryRows: DiaryEntrySummaryRow[], itemRows: EditorItemSummaryRow[] | null | undefined) {
  const itemsByEntryId = new Map<string, EditorItemSummaryRow[]>();
  for (const item of itemRows ?? []) {
    const current = itemsByEntryId.get(item.entry_id) ?? [];
    current.push(item);
    itemsByEntryId.set(item.entry_id, current);
  }

  return entryRows.map((entry) => {
    const bodyText = htmlToPlainText(entry.body_html);
    const items = itemsByEntryId.get(entry.id) ?? [];
    const hasTextItem = items.some((item) => item.type === 'text');
    const hasImageItem = items.some((item) => item.type === 'image' || item.type === 'gif');
    const hasStickerItem = items.some((item) => item.type === 'sticker');
    const coverImageUrl = items.find((item) => item.type === 'image' || item.type === 'gif')?.payload?.imageUrl;
    const itemSearchText = items
      .filter((item) => item.type === 'text')
      .map((item) => item.payload?.text?.content)
      .filter(Boolean)
      .join(' ') || undefined;

    return {
      id: entry.entry_date,
      date: entry.entry_date,
      title: entry.title ?? undefined,
      bodyText: bodyText || undefined,
      mood: entry.mood ?? undefined,
      tags: entry.tags ?? [],
      updatedAt: entry.updated_at,
      coverImageUrl,
      status: entry.status,
      moodScore: getMoodScore(entry.mood),
      hasText: Boolean(bodyText) || hasTextItem,
      hasPhoto: hasImageItem,
      hasSticker: hasStickerItem,
      itemCount: items.length,
      itemSearchText,
    };
  });
}

// 날짜 범위를 받아 해당 기간의 일기 요약 목록을 Supabase에서 불러온다
export async function loadDiaryEntrySummariesByDateRange(startDate: Date, endDate: Date): Promise<DiaryEntrySummary[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const user = await getCurrentUser();
  if (!user) return [];

  const { data: entryRows, error: entryError } = await supabase
    .from('diary_entries')
    .select('id, entry_date, title, body_html, mood, tags, status, updated_at')
    .eq('user_id', user.id)
    .gte('entry_date', formatDateBoundary(startDate))
    .lte('entry_date', formatDateBoundary(endDate))
    .order('entry_date', { ascending: true })
    .returns<DiaryEntrySummaryRow[]>();

  if (entryError) throw entryError;

  const entries = entryRows ?? [];
  if (entries.length === 0) {
    return [];
  }

  const entryIds = entries.map((entry) => entry.id);
  const { data: itemRows, error: itemError } = await supabase
    .from('editor_items')
    .select('entry_id, type, payload')
    .in('entry_id', entryIds)
    .returns<EditorItemSummaryRow[]>();

  if (itemError) throw itemError;

  return mapEntryRowsToSummaries(entries, itemRows);
}

// 주어진 월의 첫날~마지막날 범위로 일기 요약 목록을 불러온다
export function loadMonthlyDiaryEntrySummaries(visibleMonth: Date): Promise<DiaryEntrySummary[]> {
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);

  return loadDiaryEntrySummariesByDateRange(monthStart, monthEnd);
}

// 최근 일기 요약을 limit 개수만큼 최신순으로 불러온다 (보관함 전체 조회용)
export async function loadAllDiaryEntrySummaries(limit = 80): Promise<DiaryEntrySummary[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const user = await getCurrentUser();
  if (!user) return [];

  const { data: entryRows, error: entryError } = await supabase
    .from('diary_entries')
    .select('id, entry_date, title, body_html, mood, tags, status, updated_at')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .limit(limit)
    .returns<DiaryEntrySummaryRow[]>();

  if (entryError) throw entryError;

  const entries = entryRows ?? [];
  if (entries.length === 0) {
    return [];
  }

  const entryIds = entries.map((entry) => entry.id);
  const { data: itemRows, error: itemError } = await supabase
    .from('editor_items')
    .select('entry_id, type, payload')
    .in('entry_id', entryIds)
    .returns<EditorItemSummaryRow[]>();

  if (itemError) throw itemError;

  return mapEntryRowsToSummaries(entries, itemRows);
}
