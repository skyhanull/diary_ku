# Editor Merge Summary (2026-02-16)

## 범위
이번 머지에는 에디터 MVP 확장 작업(레이아웃 개편, Tiptap 본문 편집기 도입, AI 스티커 생성 연결, 스티커 드래그/리사이즈 로직 조정, 스타일 확장)이 포함됩니다.

## 변경 파일
- `package.json`
- `package-lock.json`
- `src/app/globals.css`
- `src/features/editor/components/EditorCanvasSingle.tsx`
- `src/features/editor/components/EditorScreen.tsx`
- `src/features/editor/hooks/useEditorState.ts`

## 1) 의존성 추가
`package.json` / `package-lock.json`
- 추가된 패키지
  - `@tiptap/react`
  - `@tiptap/starter-kit`
  - `@tiptap/extension-task-list`
  - `@tiptap/extension-task-item`

목적:
- 속지 본문을 단순 textarea가 아니라 리치 텍스트 편집기로 전환
- 체크리스트(`[]`) 형태의 입력 지원 기반 확보

## 2) 전역 스타일 추가
`src/app/globals.css`
- `.diary-editor-content` 스타일 블록 추가
  - 기본 폰트/행간/단락 간격
  - `ul/ol/li` 목록 스타일
  - task list 레이아웃(`ul[data-type='taskList']`)

목적:
- Tiptap 콘텐츠가 노트 본문에서 읽기 좋은 형태로 렌더되도록 통일

## 3) EditorCanvasSingle 대규모 개편
`src/features/editor/components/EditorCanvasSingle.tsx`

### 3-1. 본문 편집기 전환
- Tiptap `useEditor` 도입
- `immediatelyRender: false` 설정(SSR hydration mismatch 완화)
- `onUpdate`에서 HTML을 부모 상태(`onDiaryTextChange`)로 반영
- 부모에서 내려온 `diaryText`와 에디터 내부 값 동기화 로직 추가

### 3-2. 노트 헤더/본문 구조 확장
- 속지 상단에 `DATE`, `TODAY EXPENSE` 입력 필드 추가
- 본문은 `EditorContent` 영역으로 분리
- `notebookTheme` prop으로 배경/테두리/텍스트 컬러 커스터마이징 가능

### 3-3. 스티커 조작 로직 조정
- window `pointermove/up/cancel` 기반 상호작용 처리 유지
- 드래그 시 좌표 clamp 적용
- 리사이즈 핸들(`nw/ne/sw/se`) 유지
- 휠 리사이즈 유지
- 상호작용 해제 가드 강화
  - blur/pointercancel 대응
  - 아이템 길이 변경 시 드래그 상태 초기화
  - 현재 포인터가 속지 내부에 있을 때만 move 처리
- 렌더 위치는 `left/top` 절대 좌표 기반으로 렌더

### 3-4. 스티커 렌더링 방식
- 이모지 스티커: 컬러 배경 + 이모지 텍스트 렌더
- 이미지 스티커: `img` 렌더
- 선택 시 점선 선택 박스 + 리사이즈 핸들 표시

## 4) EditorScreen 레이아웃/기능 개편
`src/features/editor/components/EditorScreen.tsx`

### 4-1. 전체 레이아웃
- 상단 헤더 + 본문 3분할(`10 / 80 / 10`) 구조
  - 좌측 툴 미니 컬럼
  - 중앙 캔버스
  - 우측 데코레이트 패널

### 4-2. 우측 패널 기능
- 기본 스티커 셋
- 사진 추가 버튼
- 도형 추가 버튼
- 테마 선택(`paper/cream/mint`)
- AI 스티커 입력/생성 UI

### 4-3. AI 스티커 프롬프트 보정
- 한글 입력 시 영문 키워드 스타일로 변환하는 `buildAiPrompt` 추가
- `NEXT_PUBLIC_CF_WORKER_URL` 호출로 base64 이미지 수신 후 스티커 추가

### 4-4. 중앙 캔버스 연동
- `EditorCanvasSingle`에 날짜/지출/테마/본문 값 전달
- `onMoveItem`, `onResizeItem` 콜백에서 선택된 아이템만 업데이트하도록 가드

## 5) 상태 훅 조정
`src/features/editor/hooks/useEditorState.ts`
- `addItem`에서 스티커 생성 시 고정 스폰 좌표 사용하도록 정리
- 새 아이템 추가 시 자동 선택 해제(`selectedItemId: null`)로 변경

## 6) 확인한 명령
- `npm run -s typecheck` 통과

## 7) 현재 인지 이슈
- 사용자 보고 기준으로 스티커 생성 위치/상호작용 관련 현상이 여전히 재현될 수 있음
- 이번 머지는 “현재 코드 전체 정리 및 누적 변경 반영” 목적이며,
  다음 사이클에서 스티커 위치 로직을 별도 최소 재현 기준으로 추가 정리 필요

## 8) 다음 권장 작업
1. 스티커 생성/드래그 로직을 최소 구현(생성, 선택, 이동만)으로 임시 분리
2. 그 위에 리사이즈/AI 생성/테마를 단계적으로 재적용
3. Playwright 또는 간단한 e2e 시나리오로 생성 위치 회귀 방지
