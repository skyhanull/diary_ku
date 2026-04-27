# 컴포넌트 카탈로그

이 문서는 현재 공용 UI 프리미티브와 그 사용 원칙을 정리한다.
기준 폴더는 `src/components/ui/*` 이다.

## 기본 원칙
- 공용 컴포넌트는 feature 전용 비즈니스 로직을 가지지 않는다.
- 새로운 props 추가보다 composition 또는 feature wrapper를 먼저 검토한다.
- 시각 패턴이 반복될 때만 variant를 추가한다.
- focus, disabled, interactive 상태를 깨뜨리지 않는다.

## Button
소스: [src/components/ui/button.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/button.tsx)

### variants
- `default`
  기본 primary CTA
- `secondary`
  덜 강한 보조 버튼
- `outline`
  선 기반 액션
- `ghost`
  툴바, 헤더 액션
- `soft`
  부드러운 배경 강조
- `warm`
  더 감성적인 강한 CTA

### sizes
- `default`
- `sm`
- `lg`
- `iconSoft`
- `tool`
- `iconCircle`
- `pill`

### 사용 원칙
- 화면의 대표 액션은 `default` 또는 `warm`.
- 헤더/툴바 액션은 `ghost` 또는 `outline`.
- 단일 화면용 색조 조합 때문에 새 variant를 늘리지 않는다.

## Input
소스: [src/components/ui/input.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/input.tsx)

### 특징
- 기본 높이 `h-10`
- semantic `border-input`, `bg-secondary`
- focus 시 ring + card 배경

### 사용 원칙
- 일반 폼과 검색 입력의 기본 출발점으로 사용한다.
- 한 화면만 필요한 장식형 입력은 wrapper 또는 className 조합으로 처리한다.

## Card
소스: [src/components/ui/card.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/card.tsx)

### exports
- `Card`
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardContent`
- `CardFooter`

### 사용 원칙
- 일반 정보 카드, 패널, 요약 블록의 기본 골격으로 사용한다.
- 큰 화면 특화 레이아웃은 바깥 className으로 조정한다.

## SurfaceCard
소스: [src/components/ui/surface-card.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/surface-card.tsx)

### tone
- `default`
- `soft`
- `overlay`

### radius
- `lg`
- `xl`

### 사용 원칙
- 장식 카드, 반투명 패널, share 화면 같은 표면 변형에 사용한다.
- 현재 white 계열 하드코딩이 있으므로 확장 전 토큰화 여지를 같이 본다.

## NoticeBox
소스: [src/components/ui/notice-box.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/notice-box.tsx)

### tone
- `info`
- `success`
- `error`
- `overlay`

### 사용 원칙
- 저장 성공, 에러, 가벼운 안내 메시지에 사용한다.
- 현재 `info`와 `success`는 같은 시각값을 공유한다.

## ToolIconButton
소스: [src/components/ui/tool-icon-button.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/tool-icon-button.tsx)

### 특징
- `Button`의 `ghost` + `tool` 래퍼
- `active` 상태를 지원

### 사용 원칙
- 에디터 툴 레일과 유사한 도구 버튼에 우선 사용한다.

## RoundIconButton
소스: [src/components/ui/round-icon-button.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/round-icon-button.tsx)

### 특징
- `Button`의 `soft` + `iconCircle` 래퍼

### 사용 원칙
- 부드러운 단일 아이콘 액션에 사용한다.

## ErrorBoundary
소스: [src/components/ui/error-boundary.tsx](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/components/ui/error-boundary.tsx)

### 사용 원칙
- feature 전체가 깨질 수 있는 비동기/동적 UI 주변에 둔다.
- 에러 문구와 fallback UI는 전체 톤을 해치지 않게 유지한다.

## 프리미티브를 확장하기 전 체크
- 두 화면 이상에서 반복되는가
- props보다 variant가 더 적절한가
- feature 전용 조건이 섞이지 않는가
- 문서에 남길 만큼 재사용 패턴인가

## 프리미티브로 만들지 말아야 할 것
- editor 전용 저장 버튼 복합 동작
- archive 카드 전용 레이아웃
- share 화면 전용 편지지 장식
- 홈 대시보드 전용 섹션 조합
