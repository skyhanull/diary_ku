export type EditorViewMode = 'single' | 'spread';

export type PageSide = 'single' | 'left' | 'right';

export type EditorItemType = 'text' | 'sticker' | 'image' | 'gif';
export type EditorEntryStatus = 'draft' | 'saved' | 'published';
export type EditorAssetSource = 'upload' | 'library' | 'ai';

export interface TextPayload {
  content: string;
  fontSize: number;
  color: string;
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
