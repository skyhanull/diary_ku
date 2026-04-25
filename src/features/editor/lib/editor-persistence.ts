import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type {
  CreateSharedLetterInput,
  DiaryEntryRecord,
  DiaryEntryRow,
  EditorItem,
  EditorItemPayload,
  EditorItemRow,
  EditorSessionData,
  SaveEditorSessionInput,
  SharedLetterRecord,
  SharedLetterRow,
  SharedLetterSnapshot
} from '@/features/editor/types/editor.types';

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapDiaryEntryRow(row: DiaryEntryRow): DiaryEntryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    entryDate: row.entry_date,
    title: row.title,
    bodyHtml: row.body_html,
    mood: row.mood,
    tags: row.tags ?? [],
    viewMode: row.view_mode,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapEditorItemRow(row: EditorItemRow): EditorItem {
  return {
    id: row.id,
    type: row.type,
    pageSide: row.page_side,
    x: toNumber(row.x),
    y: toNumber(row.y),
    width: toNumber(row.width, 120),
    height: toNumber(row.height, 120),
    rotation: toNumber(row.rotation),
    zIndex: row.z_index,
    opacity: toNumber(row.opacity, 1),
    payload: (row.payload ?? {}) as EditorItemPayload
  };
}

function mapEditorItemToInsert(item: EditorItem, entryId: string, userId: string) {
  return {
    id: item.id,
    entry_id: entryId,
    user_id: userId,
    type: item.type,
    page_side: item.pageSide,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    rotation: item.rotation,
    z_index: item.zIndex,
    opacity: item.opacity,
    payload: item.payload
  };
}

function diffRemovedItemIds(existingItemRows: Pick<EditorItemRow, 'id'>[], nextItems: EditorItem[]) {
  const nextIds = new Set(nextItems.map((item) => item.id));
  return existingItemRows.map((row) => row.id).filter((id) => !nextIds.has(id));
}

function mapSharedLetterRow(row: SharedLetterRow): SharedLetterRecord {
  return {
    id: row.id,
    entryId: row.entry_id,
    userId: row.user_id,
    shareToken: row.share_token,
    title: row.title,
    recipientName: row.recipient_name,
    coverMessage: row.cover_message,
    snapshot: row.snapshot_json ?? {
      entryDate: '',
      title: row.title,
      bodyHtml: null,
      background: '#fffdf9',
      items: [],
      viewMode: 'single'
    },
    theme: row.theme,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createShareToken() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
}

async function getAuthenticatedUserId() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) return null;
  return data.user.id;
}

export async function loadEditorSession(pageId: string): Promise<EditorSessionData> {
  if (!isSupabaseConfigured || !supabase) {
    return { entry: null, items: [] };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { entry: null, items: [] };
  }

  const { data: entryRow, error: entryError } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', pageId)
    .maybeSingle<DiaryEntryRow>();

  if (entryError) throw entryError;
  if (!entryRow) {
    return { entry: null, items: [] };
  }

  const { data: itemRows, error: itemsError } = await supabase
    .from('editor_items')
    .select('*')
    .eq('entry_id', entryRow.id)
    .order('z_index', { ascending: true })
    .returns<EditorItemRow[]>();

  if (itemsError) throw itemsError;

  return {
    entry: mapDiaryEntryRow(entryRow),
    items: (itemRows ?? []).map(mapEditorItemRow)
  };
}

export async function saveEditorSession(input: SaveEditorSessionInput): Promise<EditorSessionData> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('You must be signed in to save an editor entry.');
  }

  const entryPayload = {
    user_id: userId,
    entry_date: input.pageId,
    title: input.title ?? null,
    body_html: input.bodyHtml ?? null,
    mood: input.mood ?? null,
    tags: input.tags ?? [],
    view_mode: input.viewMode,
    status: input.status ?? 'draft'
  };

  const { data: entryRow, error: entryError } = await supabase
    .from('diary_entries')
    .upsert(entryPayload, { onConflict: 'user_id,entry_date' })
    .select('*')
    .single<DiaryEntryRow>();

  if (entryError) throw entryError;

  const { data: existingItemRows, error: existingItemsError } = await supabase
    .from('editor_items')
    .select('id')
    .eq('entry_id', entryRow.id)
    .returns<Pick<EditorItemRow, 'id'>[]>();

  if (existingItemsError) throw existingItemsError;

  const removedItemIds = diffRemovedItemIds(existingItemRows ?? [], input.items);

  if (removedItemIds.length > 0) {
    const { error: deleteError } = await supabase.from('editor_items').delete().in('id', removedItemIds);
    if (deleteError) throw deleteError;
  }

  if (input.items.length > 0) {
    const itemsPayload = input.items.map((item) => mapEditorItemToInsert(item, entryRow.id, userId));
    const { error: upsertError } = await supabase.from('editor_items').upsert(itemsPayload, { onConflict: 'id' });
    if (upsertError) throw upsertError;
  }

  return loadEditorSession(input.pageId);
}

export async function createSharedLetter(input: CreateSharedLetterInput): Promise<SharedLetterRecord> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const savedSession = await saveEditorSession(input);
  const entry = savedSession.entry;

  if (!entry) {
    throw new Error('공유할 일기를 먼저 저장해주세요.');
  }

  const snapshot: SharedLetterSnapshot = {
    entryDate: entry.entryDate,
    title: input.title ?? entry.title ?? null,
    bodyHtml: input.bodyHtml ?? entry.bodyHtml ?? null,
    background: input.background ?? '#fffdf9',
    items: savedSession.items,
    viewMode: 'single'
  };

  const payload = {
    entry_id: entry.id,
    user_id: entry.userId,
    share_token: createShareToken(),
    title: snapshot.title,
    recipient_name: input.recipientName ?? null,
    cover_message: input.coverMessage ?? null,
    snapshot_json: snapshot,
    theme: input.theme ?? 'paper',
    is_public: input.isPublic ?? true
  };

  const { data, error } = await supabase
    .from('shared_letters')
    .insert(payload)
    .select('*')
    .single<SharedLetterRow>();

  if (error) throw error;

  return mapSharedLetterRow(data);
}

export async function loadSharedLetter(shareToken: string): Promise<SharedLetterRecord | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('shared_letters')
    .select('*')
    .eq('share_token', shareToken)
    .eq('is_public', true)
    .maybeSingle<SharedLetterRow>();

  if (error) throw error;
  if (!data) return null;

  return mapSharedLetterRow(data);
}
