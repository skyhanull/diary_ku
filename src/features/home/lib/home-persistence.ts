import type { DiaryEntrySummary } from '@/features/home/types/home.types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface DiaryEntrySummaryRow {
  id: string;
  entry_date: string;
  title: string | null;
  body_html: string | null;
  status: DiaryEntrySummary['status'];
}

interface EditorItemSummaryRow {
  entry_id: string;
  type: 'text' | 'sticker' | 'image' | 'gif';
}

function formatDateBoundary(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function loadMonthlyDiaryEntrySummaries(visibleMonth: Date): Promise<DiaryEntrySummary[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return [];

  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);

  const { data: entryRows, error: entryError } = await supabase
    .from('diary_entries')
    .select('id, entry_date, title, body_html, status')
    .eq('user_id', authData.user.id)
    .gte('entry_date', formatDateBoundary(monthStart))
    .lte('entry_date', formatDateBoundary(monthEnd))
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
    .select('entry_id, type')
    .in('entry_id', entryIds)
    .returns<EditorItemSummaryRow[]>();

  if (itemError) throw itemError;

  const itemsByEntryId = new Map<string, EditorItemSummaryRow[]>();
  for (const item of itemRows ?? []) {
    const current = itemsByEntryId.get(item.entry_id) ?? [];
    current.push(item);
    itemsByEntryId.set(item.entry_id, current);
  }

  return entries.map((entry) => {
    const items = itemsByEntryId.get(entry.id) ?? [];
    const hasTextItem = items.some((item) => item.type === 'text');
    const hasImageItem = items.some((item) => item.type === 'image' || item.type === 'gif');
    const hasStickerItem = items.some((item) => item.type === 'sticker');

    return {
      id: entry.entry_date,
      date: entry.entry_date,
      title: entry.title ?? undefined,
      status: entry.status,
      hasText: Boolean(entry.body_html) || hasTextItem,
      hasPhoto: hasImageItem,
      hasSticker: hasStickerItem
    };
  });
}
