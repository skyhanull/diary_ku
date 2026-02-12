# Editor Component Architecture

## 1) 목표
- 1페이지(single) / 2페이지(spread) 전환 가능한 에디터 구조를 만든다.
- 렌더링(UI)과 상태/명령 로직을 분리해서 유지보수성을 높인다.

## 2) 파일 트리(초안)
```txt
src/
  app/
    editor/
      [pageId]/
        page.tsx

  features/
    editor/
      components/
        EditorScreen.tsx
        EditorTopBar.tsx
        EditorBottomToolbar.tsx

        canvas/
          EditorCanvasRoot.tsx
          EditorCanvasSingle.tsx
          EditorCanvasSpread.tsx
          EditorPageSurface.tsx

        items/
          EditorItemRenderer.tsx
          TextItem.tsx
          StickerItem.tsx
          PhotoItem.tsx

        panels/
          EditorPropertySheet.tsx
          LayerPanel.tsx
          BackgroundPanel.tsx

      hooks/
        useEditorState.ts
        useEditorCommands.ts

      lib/
        editor.repository.ts
        editor.mapper.ts

      types/
        editor.types.ts
```

## 3) 컴포넌트 책임

### `app/editor/[pageId]/page.tsx`
- 역할: 진입점
- 작업:
  - `pageId` 파싱
  - 초기 데이터 로드
  - `EditorScreen` 렌더

### `EditorScreen`
- 역할: 에디터 전체 컨테이너
- 보유 상태:
  - `viewMode: 'single' | 'spread'`
  - `items: EditorItem[]`
  - `selectedItemId: string | null`
  - `background`
  - `isDirty`, `isSaving`
- 하위 조립:
  - TopBar
  - CanvasRoot
  - BottomToolbar
  - PropertySheet/Layer/Background 패널

### `EditorTopBar`
- 역할: 상단 액션
- 기능:
  - 뒤로가기
  - 1P/2P 모드 전환
  - 저장

### `EditorBottomToolbar`
- 역할: 요소 추가/패널 오픈
- 기능:
  - 텍스트 추가
  - 스티커 추가
  - 사진 추가
  - 레이어/배경 패널 열기

### `EditorCanvasRoot`
- 역할: 모드 분기
- 규칙:
  - single -> `EditorCanvasSingle`
  - spread -> `EditorCanvasSpread`

### `EditorCanvasSingle`
- 역할: 단일 페이지 캔버스
- 내부:
  - `EditorPageSurface(side='single')`

### `EditorCanvasSpread`
- 역할: 책 펼침(좌/우) 캔버스
- 내부:
  - `EditorPageSurface(side='left')`
  - `EditorPageSurface(side='right')`
- 규칙:
  - 아이템은 해당 side 안에서만 이동/리사이즈

### `EditorPageSurface`
- 역할: 페이지 단위 공통 렌더
- 기능:
  - 아이템 렌더
  - 선택 표시
  - 이동/리사이즈 핸들 처리

### `EditorItemRenderer`
- 역할: 아이템 타입 분기
- 분기:
  - text -> `TextItem`
  - sticker -> `StickerItem`
  - image -> `PhotoItem`

### `EditorPropertySheet`
- 역할: 선택 요소 속성 편집
- 예:
  - text: 내용/폰트크기/색
  - sticker/photo: 크기/삭제

### `LayerPanel`
- 역할: z-index 조정
- 기능:
  - 앞으로/뒤로

### `BackgroundPanel`
- 역할: 배경색 프리셋 변경

## 4) 타입 설계 (`editor.types.ts`)
```ts
export type EditorViewMode = 'single' | 'spread';
export type PageSide = 'single' | 'left' | 'right';
export type EditorItemType = 'text' | 'sticker' | 'image';

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
  payload: {
    text?: {
      content: string;
      fontSize: number;
      color: string;
    };
    imageUrl?: string;
  };
}

export interface EditorState {
  pageId: string;
  viewMode: EditorViewMode;
  background: string;
  selectedItemId: string | null;
  items: EditorItem[];
  isDirty: boolean;
}
```

## 5) 훅 설계

### `useEditorState`
- 역할: 순수 상태 변경
- 제공 함수:
  - `setViewMode(mode)`
  - `addItem(item)`
  - `updateItem(id, patch)`
  - `removeItem(id)`
  - `selectItem(id | null)`
  - `setBackground(color)`

### `useEditorCommands`
- 역할: 도메인 동작(명령)
- 제공 함수:
  - `moveItem(id, x, y)`
  - `resizeItem(id, width, height)`
  - `bringForward(id)`
  - `sendBackward(id)`
  - `clampItemToPage(id)`

## 6) 저장 계층

### `editor.repository.ts`
- `loadEditor(pageId)`
  - `diary_pages` + `page_items` 조회
- `saveEditor(pageId, state)`
  - `diary_pages.background_color` 업데이트
  - `page_items` upsert

### `editor.mapper.ts`
- DB row <-> UI state 변환 분리

## 7) 이벤트 흐름
1. 사용자 액션(툴바/캔버스)
2. `useEditorCommands` 호출
3. `useEditorState`로 상태 반영
4. `isDirty=true`
5. 저장 클릭 시 repository 저장

## 8) 예시 props 계약
```ts
interface EditorTopBarProps {
  viewMode: EditorViewMode;
  isSaving: boolean;
  onChangeViewMode: (mode: EditorViewMode) => void;
  onSave: () => Promise<void>;
}

interface EditorCanvasRootProps {
  viewMode: EditorViewMode;
  items: EditorItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onChangeItem: (id: string, patch: Partial<EditorItem>) => void;
}
```

## 9) 구현 순서
1. `types` + `useEditorState` 생성
2. `EditorScreen` + `TopBar` + `BottomToolbar`
3. `CanvasSingle` -> `CanvasSpread` 확장
4. `ItemRenderer` + text/sticker/photo
5. `PropertySheet`, `LayerPanel`, `BackgroundPanel`
6. repository 연결(저장/불러오기)

## 10) 결정 필요 항목
1. 캔버스 라이브러리: Konva vs Fabric (권장: Konva)
2. 모바일에서 spread 표시 방식
- 가로 스크롤 2페이지 동시
- 축소된 2페이지 미리보기
3. rotation MVP 포함 여부
