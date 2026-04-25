import type { DiaryEntrySummary } from '@/features/home/types/home.types';
import { getMoodScore } from '@/features/home/lib/home-mood';
import type { EditorItemPayload } from '@/features/editor/types/editor.types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

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

interface EditorItemSummaryRow {
  entry_id: string;
  type: 'text' | 'sticker' | 'image' | 'gif';
  payload: EditorItemPayload | null;
}

export function formatDateBoundary(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function stripHtmlToText(html: string | null | undefined) {
  if (!html) return '';

  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function mapEntryRowsToSummaries(entryRows: DiaryEntrySummaryRow[], itemRows: EditorItemSummaryRow[] | null | undefined) {
  const itemsByEntryId = new Map<string, EditorItemSummaryRow[]>();
  for (const item of itemRows ?? []) {
    const current = itemsByEntryId.get(item.entry_id) ?? [];
    current.push(item);
    itemsByEntryId.set(item.entry_id, current);
  }

  return entryRows.map((entry) => {
    const bodyText = stripHtmlToText(entry.body_html);
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

export async function loadDiaryEntrySummariesByDateRange(startDate: Date, endDate: Date): Promise<DiaryEntrySummary[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return [];

  const { data: entryRows, error: entryError } = await supabase
    .from('diary_entries')
    .select('id, entry_date, title, body_html, mood, tags, status, updated_at')
    .eq('user_id', authData.user.id)
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

export function loadMonthlyDiaryEntrySummaries(visibleMonth: Date): Promise<DiaryEntrySummary[]> {
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);

  return loadDiaryEntrySummariesByDateRange(monthStart, monthEnd);
}

export async function loadAllDiaryEntrySummaries(limit = 80): Promise<DiaryEntrySummary[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return [];

  const { data: entryRows, error: entryError } = await supabase
    .from('diary_entries')
    .select('id, entry_date, title, body_html, mood, tags, status, updated_at')
    .eq('user_id', authData.user.id)
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
