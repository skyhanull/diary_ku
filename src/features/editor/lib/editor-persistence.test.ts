// editor-persistence의 Supabase 저장/로드 로직 단위 테스트 (Supabase mock 사용)
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EditorItem, EditorItemRow } from '@/features/editor/types/editor.types';
import { APP_MESSAGES } from '@/lib/messages';

const mockSupabaseState = vi.hoisted(() => ({
  isSupabaseConfigured: true,
  supabase: null as ReturnType<typeof createSupabaseMock>['supabase'] | null
}));

vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mockSupabaseState.isSupabaseConfigured;
  },
  get supabase() {
    return mockSupabaseState.supabase;
  }
}));

import { createSharedLetter, saveEditorSession } from './editor-persistence';

const authUserId = 'user-1';
const entryId = 'entry-1';

function makeItem(id: string, patch?: Partial<EditorItem>): EditorItem {
  return {
    id,
    type: 'sticker',
    pageSide: 'single',
    x: 24,
    y: 36,
    width: 120,
    height: 120,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    payload: {
      imageUrl: `data:image/png;base64,${id}`
    },
    ...patch
  };
}

function toRow(item: EditorItem): EditorItemRow {
  return {
    id: item.id,
    entry_id: entryId,
    user_id: authUserId,
    type: item.type,
    page_side: item.pageSide,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    rotation: item.rotation,
    z_index: item.zIndex,
    opacity: item.opacity,
    payload: item.payload,
    created_at: '2026-04-22T00:00:00.000Z',
    updated_at: '2026-04-22T00:00:00.000Z'
  };
}

function createSupabaseMock(options: { existingIds?: string[]; loadedRows?: EditorItemRow[] } = {}) {
  const existingIds = options.existingIds ?? [];
  const loadedRows = options.loadedRows ?? [];
  const diaryEntryRow = {
    id: entryId,
    user_id: authUserId,
    entry_date: '2026-04-22',
    title: 'Saved title',
    body_html: '<p>Saved body</p>',
    mood: '🙂',
    tags: ['일상'],
    view_mode: 'single' as const,
    status: 'saved' as const,
    created_at: '2026-04-22T00:00:00.000Z',
    updated_at: '2026-04-22T00:00:00.000Z'
  };
  const deleteIn = vi.fn(async () => ({ error: null }));
  const upsertEditorItems = vi.fn(async () => ({ error: null }));
  const insertSharedLetter = vi.fn((payload: {
    entry_id: string;
    user_id: string;
    share_token: string;
    title: string | null;
    recipient_name: string | null;
    cover_message: string | null;
    snapshot_json: unknown;
    theme: 'paper' | 'cream' | 'midnight';
    is_public: boolean;
  }) => ({
    select: () => ({
      single: async () => ({
        data: {
          id: 'shared-1',
          entry_id: payload.entry_id,
          user_id: payload.user_id,
          share_token: 'token-123',
          title: payload.title,
          recipient_name: payload.recipient_name,
          cover_message: payload.cover_message,
          snapshot_json: payload.snapshot_json,
          theme: payload.theme,
          is_public: payload.is_public,
          created_at: '2026-04-22T00:00:00.000Z',
          updated_at: '2026-04-22T00:00:00.000Z'
        },
        error: null
      })
    })
  }));
  const upsertDiaryEntry = vi.fn(() => ({
    select: () => ({
      single: async () => ({
        data: diaryEntryRow,
        error: null
      })
    })
  }));

  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: {
            id: authUserId
          }
        },
        error: null
      }))
    },
    from(table: string) {
      if (table === 'diary_entries') {
        return {
          select() {
            return {
              eq(column: string, value: string) {
                expect(column).toBe('user_id');
                expect(value).toBe(authUserId);

                return {
                  eq(nextColumn: string, nextValue: string) {
                    expect(nextColumn).toBe('entry_date');
                    expect(nextValue).toBe('2026-04-22');

                    return {
                      maybeSingle: async () => ({
                        data: diaryEntryRow,
                        error: null
                      })
                    };
                  }
                };
              }
            };
          },
          upsert: upsertDiaryEntry
        };
      }

      if (table === 'editor_items') {
        return {
          select(columns: string) {
            const filters: Array<[string, string]> = [];

            return {
              eq(column: string, value: string) {
                filters.push([column, value]);

                return {
                  order(orderColumn: string, orderOptions: { ascending: boolean }) {
                    expect(columns).toBe('*');
                    expect(column).toBe('entry_id');
                    expect(value).toBe(entryId);
                    expect(orderColumn).toBe('z_index');
                    expect(orderOptions).toEqual({ ascending: true });

                    return {
                      returns: async () => ({
                        data: loadedRows,
                        error: null
                      })
                    };
                  },
                  returns: async () => {
                    expect(columns).toBe('id');
                    expect(filters).toEqual([['entry_id', entryId]]);

                    return {
                      data: existingIds.map((id) => ({ id })),
                      error: null
                    };
                  }
                };
              }
            };
          },
          delete() {
            return {
              in: deleteIn
            };
          },
          upsert: upsertEditorItems,
          insert: insertSharedLetter
        };
      }

      if (table === 'shared_letters') {
        return {
          insert: insertSharedLetter
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }
  };

  return {
    supabase,
    deleteIn,
    insertSharedLetter,
    upsertDiaryEntry,
    upsertEditorItems
  };
}

describe('saveEditorSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseState.isSupabaseConfigured = true;
  });

  it('deletes only removed item ids and upserts the current items', async () => {
    const nextItems = [makeItem('item-1'), makeItem('item-3', { x: 88, zIndex: 3 })];
    const supabaseMock = createSupabaseMock({
      existingIds: ['item-1', 'item-2', 'item-3'],
      loadedRows: nextItems.map(toRow)
    });
    mockSupabaseState.supabase = supabaseMock.supabase;

    const session = await saveEditorSession({
      pageId: '2026-04-22',
      title: '테스트 저장',
      bodyHtml: '<p>본문</p>',
      mood: '🙂',
      tags: ['일상'],
      viewMode: 'single',
      status: 'saved',
      items: nextItems
    });

    expect(supabaseMock.deleteIn).toHaveBeenCalledWith('id', ['item-2']);
    expect(supabaseMock.upsertEditorItems).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'item-1',
          entry_id: entryId,
          user_id: authUserId
        }),
        expect.objectContaining({
          id: 'item-3',
          x: 88,
          z_index: 3
        })
      ]),
      { onConflict: 'id' }
    );
    expect(session.items.map((item) => item.id)).toEqual(['item-1', 'item-3']);
  });

  it('skips delete when no items were removed', async () => {
    const nextItems = [makeItem('item-1', { type: 'image' })];
    const supabaseMock = createSupabaseMock({
      existingIds: ['item-1'],
      loadedRows: nextItems.map(toRow)
    });
    mockSupabaseState.supabase = supabaseMock.supabase;

    await saveEditorSession({
      pageId: '2026-04-22',
      title: '삭제 없음',
      bodyHtml: '<p>본문</p>',
      mood: '🙂',
      tags: ['기록'],
      viewMode: 'single',
      status: 'saved',
      items: nextItems
    });

    expect(supabaseMock.deleteIn).not.toHaveBeenCalled();
    expect(supabaseMock.upsertEditorItems).toHaveBeenCalledTimes(1);
  });

  it('deletes every previous item when saving an empty canvas', async () => {
    const supabaseMock = createSupabaseMock({
      existingIds: ['item-1', 'item-2'],
      loadedRows: []
    });
    mockSupabaseState.supabase = supabaseMock.supabase;

    const session = await saveEditorSession({
      pageId: '2026-04-22',
      title: '빈 캔버스',
      bodyHtml: '<p>본문</p>',
      mood: '🙂',
      tags: ['기록'],
      viewMode: 'single',
      status: 'saved',
      items: []
    });

    expect(supabaseMock.deleteIn).toHaveBeenCalledWith('id', ['item-1', 'item-2']);
    expect(supabaseMock.upsertEditorItems).not.toHaveBeenCalled();
    expect(session.items).toEqual([]);
  });

  it('throws when supabase is not configured', async () => {
    mockSupabaseState.isSupabaseConfigured = false;
    mockSupabaseState.supabase = null;

    await expect(
      saveEditorSession({
        pageId: '2026-04-22',
        title: '설정 없음',
        bodyHtml: '<p>본문</p>',
        mood: '🙂',
        tags: ['기록'],
        viewMode: 'single',
        status: 'saved',
        items: []
      })
    ).rejects.toThrow(APP_MESSAGES.supabaseNotConfigured);
  });

  it('creates a shared letter snapshot from the saved session', async () => {
    const nextItems = [makeItem('item-1', { type: 'gif', payload: { imageUrl: 'https://example.com/a.gif', mediaType: 'gif' } })];
    const supabaseMock = createSupabaseMock({
      existingIds: ['item-1'],
      loadedRows: nextItems.map(toRow)
    });
    mockSupabaseState.supabase = supabaseMock.supabase;

    const sharedLetter = await createSharedLetter({
      pageId: '2026-04-22',
      title: '공유 테스트',
      bodyHtml: '<p>공유 본문</p>',
      mood: '🙂',
      tags: ['공유'],
      viewMode: 'single',
      status: 'saved',
      items: nextItems,
      recipientName: '받는 사람',
      theme: 'paper'
    });

    expect(supabaseMock.insertSharedLetter).toHaveBeenCalledTimes(1);
    expect(sharedLetter.shareToken).toBe('token-123');
    expect(sharedLetter.snapshot.items).toEqual(nextItems);
    expect(sharedLetter.snapshot.bodyHtml).toBe('<p>공유 본문</p>');
  });
});
