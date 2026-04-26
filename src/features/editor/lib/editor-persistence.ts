// 에디터 DB 레이어: 일기 항목·캔버스 아이템을 Supabase에 저장/로드하고 공유 편지를 생성한다
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/client-auth';
import { APP_MESSAGES } from '@/lib/messages';
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

// 숫자로 변환할 수 없는 값은 fallback으로 대체한다
function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// DB row를 프론트에서 쓰는 에디터 모델로 바꾸는 변환기들이다.
// 화면에서는 snake_case 대신 camelCase 타입을 쓰기 때문에 저장/로드 경계에서 정리한다.
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

// DB row(snake_case)를 프론트 EditorItem(camelCase)으로 변환한다
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

// EditorItem(camelCase)을 DB insert용 snake_case 객체로 변환한다
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

// 기존 DB 아이템 중 다음 저장 목록에 없어진 아이템의 id 배열을 반환한다
function diffRemovedItemIds(existingItemRows: Pick<EditorItemRow, 'id'>[], nextItems: EditorItem[]) {
  const nextIds = new Set(nextItems.map((item) => item.id));
  return existingItemRows.map((row) => row.id).filter((id) => !nextIds.has(id));
}

// DB row를 프론트 SharedLetterRecord(camelCase)로 변환한다
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

// 공유 링크에 쓸 20자리 랜덤 토큰을 생성한다
function createShareToken() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
}

// Supabase 세션에서 현재 로그인한 사용자 ID를 가져온다
async function getAuthenticatedUserId() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(APP_MESSAGES.supabaseNotConfigured);
  }

  const user = await getCurrentUser();
  return user?.id ?? null;
}

// 날짜 기반 pageId로 일기 항목과 캔버스 아이템을 DB에서 불러온다
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

// 일기 항목을 upsert하고 캔버스 아이템을 diff 방식으로 저장한 뒤 최신 상태를 반환한다
export async function saveEditorSession(input: SaveEditorSessionInput): Promise<EditorSessionData> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(APP_MESSAGES.supabaseNotConfigured);
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error(APP_MESSAGES.diarySaveRequiresAuth);
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

  // 예전에는 editor_items를 전부 지우고 다시 넣었지만,
  // 지금은 삭제된 id만 지우고 나머지는 upsert해서 저장 비용과 충돌 위험을 줄였다.
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

  // 저장 직후 DB 기준 최신 상태를 다시 읽어 화면 상태와 맞춘다.
  return loadEditorSession(input.pageId);
}

// 현재 일기를 저장한 뒤 공유 시점 스냅샷을 shared_letters 테이블에 생성한다
export async function createSharedLetter(input: CreateSharedLetterInput): Promise<SharedLetterRecord> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(APP_MESSAGES.supabaseNotConfigured);
  }

  const savedSession = await saveEditorSession(input);
  const entry = savedSession.entry;

  if (!entry) {
    throw new Error('공유할 일기를 먼저 저장해주세요.');
  }

  // 공유 링크는 원본 일기를 직접 읽지 않는다.
  // 공유 시점의 제목/본문/아이템을 snapshot_json으로 따로 보관해서 이후 수정과 분리한다.
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

// shareToken으로 공개 공유 편지를 DB에서 조회해 반환한다
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
