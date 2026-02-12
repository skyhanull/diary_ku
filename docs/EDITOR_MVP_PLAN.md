# Editor MVP Plan

## 1) 목적
사용자가 3분 안에 다이어리 페이지를 꾸미고 저장할 수 있는 최소 편집 경험을 제공한다.
사용자는 편집 화면에서 `1페이지 보기`와 `2페이지(책 펼침) 보기`를 전환할 수 있다.

## 2) 핵심 사용자 가치
- 요소를 여러 개 자유롭게 배치할 수 있다.
- 스티커/사진 크기를 캔버스 안에서 직관적으로 조절할 수 있다.
- 저장 후 다시 열어도 같은 상태가 복원된다.

## 3) 화면 구조
1. 상단 바
- 뒤로가기
- 날짜
- 보기 모드 전환(1P / 2P)
- 저장 버튼
- 더보기(삭제/초기화)

2. 중앙 캔버스
- 1페이지 모드: 다이어리 1페이지(세로 비율)
- 2페이지 모드: 좌/우 페이지를 나란히 표시(책 펼침 형태)
- 선택 요소 바운딩 박스 표시

3. 하단 툴바
- 배경
- 텍스트
- 스티커
- 사진
- 레이어

4. 속성 패널(바텀시트)
- 선택 요소 속성 편집
- 텍스트/색상/폰트 크기
- 삭제

## 4) MVP 기능 범위 (확정)
1. 여러 개 요소 추가
- 텍스트 여러 개
- 스티커 여러 개
- 사진 여러 개

2. 요소 편집
- 선택
- 드래그 이동
- 리사이즈(스티커/사진)
- 회전(옵션: 1차에서 제외 가능)
- 삭제

3. 레이어
- 앞으로 가져오기
- 뒤로 보내기

4. 배경
- 컬러 프리셋 6개

5. 저장/복원
- 저장 버튼 클릭 시 현재 상태 저장
- 재진입 시 배치 상태 그대로 복원
 - 페이지별(좌/우) 아이템 위치 유지

## 5) 인터랙션 규칙
1. 탭(클릭)하면 요소 선택
2. 선택 시 바운딩 박스 + 코너 핸들 표시
3. 코너 핸들 드래그로 크기 조절
4. 캔버스 완전 이탈 방지(요소 중심점 기준)
5. 최소 크기 제한: 40x40
6. 최대 크기 제한: 캔버스 폭/높이
7. 2페이지 모드에서는 아이템이 속한 페이지(좌/우) 안에서만 이동 가능
8. 모드 전환 시 아이템 좌표는 각 페이지 기준으로 유지

## 6) 데이터 모델 (프론트 상태)
```ts
type EditorItemType = 'text' | 'sticker' | 'image';

interface EditorItem {
  id: string;
  type: EditorItemType;
  pageSide: 'single' | 'left' | 'right';
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

interface EditorState {
  pageId: string;
  viewMode: 'single' | 'spread';
  background: string;
  selectedItemId: string | null;
  items: EditorItem[];
  isDirty: boolean;
}
```

## 7) 저장 스키마 매핑
- diary_pages
  - id
  - user_id
  - page_date
  - background_color

- page_items
  - page_id
  - page_side(single/left/right)
  - type
  - x, y
  - width, height
  - rotation
  - z_index
  - text_content / image_url

## 8) 기술 선택
- Canvas 라이브러리: Konva.js (권장)
- 상태관리: React state 시작, 복잡해지면 Zustand
- 이미지 업로드: Supabase Storage

## 9) 비범위 (MVP 제외)
- 멀티 선택
- 정렬 가이드/스냅
- 필터/블렌딩
- 협업/실시간 편집
- 템플릿 마켓

## 10) 완료 기준 (Definition of Done)
1. 텍스트/스티커/사진을 각각 2개 이상 추가 가능
2. 스티커/사진 리사이즈 가능
3. 요소 이동/삭제/레이어 변경 가능
4. 1페이지/2페이지 보기 전환 가능
5. 2페이지 모드에서 좌/우 페이지 독립 편집 가능
6. 저장 후 새로고침 시 동일 상태 복원
7. 모바일 세로 화면에서도 주요 조작 가능

## 11) 구현 순서 (권장)
1. 캔버스 렌더 + 아이템 선택
2. 이동/리사이즈 인터랙션
3. 요소 추가(텍스트/스티커/사진)
4. 저장/복원 연결
5. 레이어/배경
6. 에러/로딩/저장 UX 보강
