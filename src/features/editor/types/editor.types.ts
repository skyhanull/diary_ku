export type EditorViewMode = 'single' | 'spread';

export type PageSide = 'single' | 'left' | 'right';

export type EditorItemType = 'text' | 'sticker' | 'image';

export interface TextPayload {
  content: string;
  fontSize: number;
  color: string;
}

export interface EditorItemPayload {
  text?: TextPayload;
  imageUrl?: string;
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
  payload?: EditorItemPayload;
}

export interface CreateEditorStateInput {
  pageId: string;
  viewMode?: EditorViewMode;
  background?: string;
  selectedItemId?: string | null;
  items?: EditorItem[];
}
