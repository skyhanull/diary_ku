// 에디터 관련 TypeScript 타입 전체 정의 (뷰모드·도구·아이템·공유 편지 등)
// 한 페이지 보기(single)와 펼침 보기(spread)를 구분하는 뷰 모드 타입
export type EditorViewMode = 'single' | 'spread';

// 캔버스에서 선택할 수 있는 편집 도구 종류
export type EditorTool = 'select' | 'text' | 'sticker' | 'image';

// 사이드 패널의 현재 탭을 나타내는 타입
export type EditorSidePanel = 'base' | 'text' | 'sticker' | 'media';

// 펼침 보기에서 아이템이 놓이는 페이지 위치 (단일/왼쪽/오른쪽)
export type PageSide = 'single' | 'left' | 'right';

// 캔버스에 배치할 수 있는 아이템 종류
export type EditorItemType = 'text' | 'sticker' | 'image' | 'gif';
// 일기 항목의 저장 상태 (초안/저장됨/발행됨)
export type EditorEntryStatus = 'draft' | 'saved' | 'published';
// 이미지·스티커 에셋의 출처 (업로드/라이브러리/AI 생성)
export type EditorAssetSource = 'upload' | 'library' | 'ai';
// 공유 편지에 적용할 시각적 테마 종류
export type SharedLetterTheme = 'paper' | 'cream' | 'midnight';

// 텍스트 아이템이 가지는 내용·폰트·색상 데이터
export interface TextPayload {
  content: string;
  fontSize: number;
  color: string;
  fontFamily?: string;
}

// 아이템 종류에 따라 선택적으로 채워지는 페이로드 데이터 타입
export interface EditorItemPayload {
  text?: TextPayload;
  imageUrl?: string;
  source?: EditorAssetSource;
  mediaType?: 'image' | 'gif';
  prompt?: string;
  alt?: string;
  originalFilename?: string;
}

// 캔버스에 배치되는 단일 아이템의 위치·크기·페이로드를 담는 타입
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

// 에디터 전체 캔버스 상태 (뷰모드·배경·아이템 목록·dirty 여부 포함)
export interface EditorState {
  pageId: string;
  viewMode: EditorViewMode;
  background: string;
  selectedItemId: string | null;
  items: EditorItem[];
  isDirty: boolean;
}

// 새 캔버스 아이템 생성 시 전달하는 옵셔널 초기값 타입
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

// 에디터 상태 훅 초기화 시 전달하는 옵셔널 초기값 타입
export interface CreateEditorStateInput {
  pageId: string;
  viewMode?: EditorViewMode;
  background?: string;
  selectedItemId?: string | null;
  items?: EditorItem[];
}

// DB에서 불러온 일기 항목을 camelCase로 변환한 프론트 모델
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

// 에디터 로드 시 반환되는 일기 항목과 캔버스 아이템 묶음
export interface EditorSessionData {
  entry: DiaryEntryRecord | null;
  items: EditorItem[];
}

// saveEditorSession 함수에 전달하는 저장 요청 데이터 타입
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

// 공유 시점에 저장되는 일기 스냅샷 (원본 수정과 분리됨)
export interface SharedLetterSnapshot {
  entryDate: string;
  title: string | null;
  bodyHtml: string | null;
  background: string;
  items: EditorItem[];
  viewMode: 'single';
}

// 공유 편지 생성 시 추가로 필요한 배경·수신인·테마 등을 포함하는 입력 타입
export interface CreateSharedLetterInput extends SaveEditorSessionInput {
  background?: string;
  recipientName?: string | null;
  coverMessage?: string | null;
  theme?: SharedLetterTheme;
  isPublic?: boolean;
}

// DB에서 불러온 공유 편지를 camelCase로 변환한 프론트 모델
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

// Supabase diary_entries 테이블의 snake_case raw row 타입
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

// Supabase editor_items 테이블의 snake_case raw row 타입
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

// Supabase shared_letters 테이블의 snake_case raw row 타입
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
