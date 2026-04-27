# 화면 패턴

이 문서는 Memolie에서 반복되는 핵심 UI 패턴을 정리한다.
공용 primitive보다 한 단계 위의 화면 규칙이다.

## 1. Home Dashboard
주요 구현: [src/features/home/components/HomeDashboard.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/home/components/HomeDashboard.tsx)

### 패턴
- 좌측은 달력, 우측은 선택 날짜의 인사이트 패널
- 날짜 선택과 월 이동이 1차 행동
- 인사이트 패널은 요약, 감정, 일정 입력을 수용

### 규칙
- 캘린더 셀은 감성보다 상태 식별성이 우선
- 오른쪽 패널은 카드형 블록으로 분리
- 일정 입력과 오류 메시지는 차분한 보조 톤 사용

## 2. Archive Masonry Cards
주요 구현: [src/features/archive/components/ArchiveDashboard.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/archive/components/ArchiveDashboard.tsx)

### 패턴
- masonry 느낌의 종이 카드 나열
- 이미지 유무에 따라 hero형 카드와 텍스트형 카드로 분기
- 검색 이유, 태그, 감정, 상태를 칩과 메타 정보로 노출

### 규칙
- 카드 variation은 허용하지만 읽는 순서가 흔들리면 안 된다
- 태그와 검색 이유는 장식이 아니라 정보 보조 수단
- hover 피드백은 가볍고 종이 카드가 들리는 정도면 충분하다

## 3. Editor Shell
주요 구현: [src/features/editor/components/EditorScreen.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/editor/components/EditorScreen.tsx)

### 패턴
- 상단 헤더 액션
- 좌측 툴 레일
- 중앙 캔버스
- 우측 속성 패널
- 상단 또는 패널 인근 저장 상태 피드백

### 규칙
- 저장 중, 자동 저장, 저장 완료, 실패 상태가 분명해야 한다
- 조작 대상과 보조 입력 영역이 한눈에 구분돼야 한다
- 캔버스 장식보다 선택/이동/리사이즈 가시성이 우선이다

## 4. Editor Overlay Patterns
관련 구현:
- [src/features/editor/components/EditorShareModal.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/editor/components/EditorShareModal.tsx)
- [src/features/editor/components/EditorTutorialOverlay.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/editor/components/EditorTutorialOverlay.tsx)

### 패턴
- 전체 화면 overlay + blur
- 중앙 카드 또는 포인트 하이라이트
- primary/secondary CTA 분리

### 규칙
- overlay는 정보 차단이 아니라 집중 유도여야 한다
- blur와 어두운 배경은 과하지 않게 유지한다
- 튜토리얼은 spotlight보다 행동 유도 문구가 더 중요하다

## 5. Side Panel Editing
관련 구현: [src/features/editor/components/EditorSidePanel.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/editor/components/EditorSidePanel.tsx)

### 패턴
- 현재 선택 항목에 따라 컨트롤이 달라짐
- 텍스트, 색상, 폰트, 미디어 선택이 한 패널에서 이어짐

### 규칙
- 세부 옵션은 많아도 구획은 단순해야 한다
- 컨트롤 밀도가 높아질수록 기본 입력 패턴을 재사용한다
- 편집 대상이 바뀌었을 때 패널의 문맥 전환이 자연스러워야 한다

## 6. Diary Chat Drawer
주요 구현: [src/features/chat/components/DiaryChat.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/chat/components/DiaryChat.tsx)

### 패턴
- 오른쪽 슬라이드 패널
- 메시지 버블
- 하단 입력창 고정

### 규칙
- 보조 기능이므로 에디터 주 흐름을 압도하면 안 된다
- assistant와 user 버블 대비는 분명하되 과장되지 않게 유지한다
- 스트리밍 중 상태는 잔잔하게 보여준다

## 7. Shared Letter Presentation
관련 구현:
- [src/features/share/components/SharedLetterScreen.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/share/components/SharedLetterScreen.tsx)
- [src/features/share/components/LetterEnvelopeStage.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/features/share/components/LetterEnvelopeStage.tsx)

### 패턴
- 가장 장식적인 화면군
- 편지 봉투, 종이, 그라데이션, 스냅샷 표시

### 규칙
- 장식은 허용되지만 본문 읽기성과 여백이 최우선
- theme별 차이는 허용해도 구조는 일관돼야 한다
- 테마 예외가 반복되면 문서에 명시한다

## Do
- 홈과 에디터에서는 구조 명확성을 우선한다
- 카드, 패널, 모달의 레이어 차이는 배경과 얇은 선으로 만든다
- 상태 피드백은 짧고 차분하게 유지한다

## Don't
- 감성을 이유로 핵심 조작 영역을 흐리게 만들지 않는다
- 한 화면용 장식 규칙을 공용 primitive 기본값으로 올리지 않는다
- 저장/에러/로딩 피드백을 너무 기술적이거나 거칠게 만들지 않는다
