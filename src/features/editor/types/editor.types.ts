export type EditorViewMode = 'single' | 'spread';

export type PageSide = 'single' | 'left' | 'right';

export type EditorItemType = 'text' | 'sticker' | 'image' | 'gif';
export type EditorEntryStatus = 'draft' | 'saved' | 'published';
export type EditorAssetSource = 'upload' | 'library' | 'ai';
export type SharedLetterTheme = 'paper' | 'cream' | 'midnight';

export interface TextPayload {
  content: string;
  fontSize: number;
  color: string;
  fontFamily?: string;
}

export interface EditorItemPayload {
  text?: TextPayload;
  imageUrl?: string;
  source?: EditorAssetSource;
  mediaType?: 'image' | 'gif';
  prompt?: string;
  alt?: string;
  originalFilename?: string;
}

export interface EditorItem {
  id: string;
  type: EditorItemType;
  pageSide: PageSide;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  payload: EditorItemPayload;
}

export interface EditorState {
  pageId: string;
  viewMode: EditorViewMode;
  background: string;
  selectedItemId: string | null;
  items: EditorItem[];
  isDirty: boolean;
}

export interface CreateEditorItemInput {
  type: EditorItemType;
  pageSide?: PageSide;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  payload?: EditorItemPayload;
}

export interface CreateEditorStateInput {
  pageId: string;
  viewMode?: EditorViewMode;
  background?: string;
  selectedItemId?: string | null;
  items?: EditorItem[];
}

export interface DiaryEntryRecord {
  id: string;
  userId: string;
  entryDate: string;
  title: string | null;
  bodyHtml: string | null;
  mood: string | null;
  tags: string[];
  viewMode: EditorViewMode;
  status: EditorEntryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EditorSessionData {
  entry: DiaryEntryRecord | null;
  items: EditorItem[];
}

export interface SaveEditorSessionInput {
  pageId: string;
  title?: string | null;
  bodyHtml?: string | null;
  mood?: string | null;
  tags?: string[];
  viewMode: EditorViewMode;
  status?: EditorEntryStatus;
  items: EditorItem[];
}

export interface SharedLetterSnapshot {
  entryDate: string;
  title: string | null;
  bodyHtml: string | null;
  background: string;
  items: EditorItem[];
  viewMode: 'single';
}

export interface CreateSharedLetterInput extends SaveEditorSessionInput {
  background?: string;
  recipientName?: string | null;
  coverMessage?: string | null;
  theme?: SharedLetterTheme;
  isPublic?: boolean;
}

export interface SharedLetterRecord {
  id: string;
  entryId: string;
  userId: string;
  shareToken: string;
  title: string | null;
  recipientName: string | null;
  coverMessage: string | null;
  snapshot: SharedLetterSnapshot;
  theme: SharedLetterTheme;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryEntryRow {
  id: string;
  user_id: string;
  entry_date: string;
  title: string | null;
  body_html: string | null;
  mood: string | null;
  tags: string[] | null;
  view_mode: EditorViewMode;
  status: EditorEntryStatus;
  created_at: string;
  updated_at: string;
}

export interface EditorItemRow {
  id: string;
  entry_id: string;
  user_id: string;
  type: EditorItemType;
  page_side: PageSide;
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  rotation: number | string;
  z_index: number;
  opacity: number | string;
  payload: EditorItemPayload | null;
  created_at: string;
  updated_at: string;
}

export interface SharedLetterRow {
  id: string;
  entry_id: string;
  user_id: string;
  share_token: string;
  title: string | null;
  recipient_name: string | null;
  cover_message: string | null;
  snapshot_json: SharedLetterSnapshot | null;
  theme: SharedLetterTheme;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
