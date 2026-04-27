# 토큰

이 문서는 현재 코드에서 실제로 사용 가능한 디자인 토큰을 정리한다.
기준 구현은 [tailwind.config.ts](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/tailwind.config.ts) 와 [src/app/globals.css](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/src/app/globals.css) 다.

## 색상 토큰

### 브랜드 계열
- `cedar`: 기본 브랜드 포인트
- `cedar-dark`: hover 또는 더 깊은 액션 상태
- `cedar-deep`: 따뜻한 강한 CTA
- `cedar-soft`: 은은한 강조 배경
- `cedar-mist`: 활성 툴 버튼 같은 부드러운 선택 상태

### 종이 / 표면 계열
- `vellum`: 전체 앱의 기본 배경
- `oatmeal`: 보조 배경, 칩, 보조 카드
- `paper`
- `paper-warm`
- `paper-soft`
- `paper-cream`

### 잉크 / 텍스트 계열
- `ink`: 기본 본문 텍스트
- `ink-soft`: 약한 본문
- `ink-muted`: 보조 텍스트
- `ink-warm`: 감성 문구, 따뜻한 서브 텍스트
- `ink-umber`: 브라운 계열 텍스트 강조

### 선 / 경계 계열
- `line`
- `line-soft`
- `line-warm`
- `line-pale`
- semantic aliases: `border`, `input`, `ring`

### 상태 계열
- `rose`
- `rose-soft`
- `rose-pale`
- `rose-danger`
- `sage`
- `mood-happy`
- `mood-calm`
- `mood-neutral`
- `mood-cloudy`
- `mood-sad`

### semantic aliases
- `background`
- `foreground`
- `card`
- `card-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`

## 색상 사용 원칙
- 배경 기본값은 `bg-vellum` 또는 semantic `bg-background`를 우선한다.
- 카드 계열은 `bg-card`, `bg-paper-warm`, `bg-oatmeal` 순으로 검토한다.
- 파괴적 상태는 `rose-danger`, 에러 표면은 `rose-pale`을 우선한다.
- 아이콘과 보조 텍스트는 `text-ink-muted` 또는 `text-cedar/60`처럼 눌러서 쓴다.
- 신규 색이 반복되면 토큰으로 올리고, 한 화면 장식값이면 지역 패턴으로 남긴다.

## 타이포 토큰

### 폰트 패밀리
- `font-sans`: `Pretendard`, `Apple SD Gothic Neo`, `sans-serif`
- `font-display`: `Epilogue`, `Pretendard`, `sans-serif`
- `font-editorial`: `Noto Serif KR`, `Pretendard`, `serif`

### 폰트 사이즈
- `text-ds-display`: 큰 화면 제목
- `text-ds-brand`: 브랜드성 큰 타이틀
- `text-ds-modal-title`: 모달 타이틀
- `text-ds-title`: 카드/섹션 타이틀
- `text-ds-body`: 기본 UI/본문
- `text-ds-caption`: 보조 정보
- `text-ds-micro`: 아주 작은 보조 정보
- `text-ds-emoji`: 감정 이모지

## 타이포 원칙
- 페이지 hero, 브랜딩, 편지형 타이틀은 `font-display`.
- 일반 UI, 폼, 대부분의 한글 텍스트는 `font-sans`.
- 아카이브 카드나 감성 강조 포인트만 제한적으로 `font-editorial`.
- 긴 본문은 장식보다 가독성을 우선한다.

## spacing 토큰
- scale: `ds-1`, `ds-2`, `ds-3`, `ds-4`, `ds-5`, `ds-6`, `ds-7`, `ds-8`, `ds-12`
- layout: `ds-page`, `ds-page-lg`
- card padding: `ds-card`, `ds-card-lg`

## spacing 원칙
- 기본 간격 단위는 `ds-*` 스케일을 우선한다.
- 페이지 수평 여백은 `px-ds-page`, 큰 화면은 `lg:px-ds-page-lg`.
- 카드 내부 여백은 `p-ds-card` 또는 `p-ds-card-lg`.
- 즉흥적인 `px-[13px]` 류 값은 재사용 근거가 없다면 피한다.

## radius 토큰
- `rounded-sm`
- `rounded-md`
- `rounded-lg`

현재 `--radius`는 `0.5rem`이고, Tailwind semantic radius가 이를 기반으로 계산된다.
다만 화면 구현에는 `rounded-xl`, `rounded-2xl`, `rounded-[24px]`, `rounded-[32px]` 같은 표현도 함께 존재한다.

## motion 토큰
- 기본 인터랙션 전환: `duration-200`
- 패널/상태 전환: `duration-300`
- 버튼 눌림: `active:scale-[0.98]`
- 포커스 링: `focus-visible:ring-2 focus-visible:ring-ring`

## 표면 규칙
- 앱 기본 배경은 `body`의 radial gradient와 `bg-background` 조합을 기준으로 한다.
- 대부분의 카드 그림자는 매우 약하게 유지한다.
- 그림자보다 배경색 차이와 얇은 경계선으로 레이어를 만드는 쪽을 우선한다.

## 아직 토큰화되지 않은 영역
- shadow 값은 여러 컴포넌트에 하드코딩되어 있다.
- overlay 배경의 `rgba(...)` 값도 반복된다.
- 일부 share/auth/editor 화면은 헥스 색상을 직접 사용한다.

상세 후보는 [06-audit.md](/Users/an-yungyeong/Downloads/회사폴더/diary_ku/docs/design-system/06-audit.md) 를 참고한다.
