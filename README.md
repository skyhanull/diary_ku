# Memolie

스티커, 텍스트, 이미지로 하루를 꾸미고 편지 형태로 공유할 수 있는 디지털 다이어리 웹앱입니다. 이 저장소는 이력서/포트폴리오 공개를 기준으로 핵심 MVP인 `홈 캘린더 -> 일기 에디터 -> 저장 -> 공유 링크 생성` 흐름에 집중해 정리했습니다.

## 핵심 기능
- 월간 캘린더 기반 일기 진입: 홈에서 날짜별 기록 상태와 감정 흐름을 확인하고 특정 날짜 에디터로 이동합니다.
- 다이어리 에디터: 본문 작성, 텍스트 박스, 스티커, 이미지, GIF, AI 스티커를 캔버스에 배치할 수 있습니다.
- 캔버스 인터랙션: 꾸미기 요소 선택, 이동, 크기 조절, 줌 좌표 보정, 캔버스 경계 제한을 처리합니다.
- Supabase 저장/복원: 일기 본문과 꾸미기 요소를 사용자/날짜 기준으로 저장하고 다시 불러옵니다.
- 편지형 공유: 공유 시점의 일기 스냅샷을 별도로 저장하고 `/letter/[shareToken]` 링크로 읽기 전용 화면을 제공합니다.
- 수동 배포 파이프라인: GitHub Actions에서 `Run workflow`를 눌렀을 때만 Vercel Production 배포가 실행됩니다.

## 기술 스택
- Frontend: Next.js App Router, React, TypeScript
- Styling: Tailwind CSS, custom UI primitives
- Editor: Tiptap, Pointer Events 기반 캔버스 아이템 조작
- Backend: Supabase Auth, Postgres
- AI/Image: Cloudflare Workers AI, GIPHY API
- Infra: GitHub Actions, Vercel CLI

## 기술적 문제 해결
- 확대/축소 상태에서 캔버스 포인터 좌표가 실제 요소 위치와 어긋나는 문제를 해결하기 위해 Pointer Events 기반 드래그·리사이즈·회전 로직을 직접 구현했습니다. 포인터 이동량을 현재 줌 배율로 보정하고, `clamp` 처리를 적용해 요소가 캔버스 경계 밖으로 벗어나지 않도록 제한했습니다.
- 에디터의 요소 목록, 선택 상태, 수정 여부(dirty)가 여러 컴포넌트에 분산되면 상태 변경 흐름을 추적하기 어려워지는 문제가 있어 `useEditorState` 커스텀 훅으로 핵심 상태와 변경 액션을 분리했습니다. 화면 컴포넌트는 렌더링과 입력 처리에 집중하도록 구조를 나눴습니다.
- 공유 링크가 원본 일기 데이터를 그대로 참조하면 이후 편집 내용이 이미 공유된 화면에 반영될 수 있는 문제가 있어, 공유 생성 시점의 제목·본문·배경·꾸미기 요소를 스냅샷으로 별도 저장했습니다. 이를 통해 원본 일기를 수정해도 공유 화면은 생성 당시 상태를 유지하도록 설계했습니다.
- 한국어 프롬프트가 이미지 생성 모델에서 부정확하게 처리되거나 같은 검색어의 생성 결과가 유사해지는 문제를 개선하기 위해 Cloudflare Workers AI 기반 생성 파이프라인에 번역 처리와 랜덤 변주 프롬프트를 적용했습니다. 생성된 이미지는 에디터 캔버스에 스티커 요소로 바로 배치할 수 있도록 연결했습니다.

## MVP 범위
현재 공개 데모의 핵심 범위는 홈 캘린더, 에디터, 저장, 편지형 공유입니다. `archive`, `library`, `stats`, `mypage`는 후속 확장 기능으로 분리했고, 헤더 네비게이션에서는 노출하지 않습니다.

## 실행 방법
```bash
cp .env.example .env.local
npm install
npm run dev
```

`.env.local`에는 아래 값을 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CF_WORKER_URL=
NEXT_PUBLIC_GIPHY_API_KEY=
NEXT_PUBLIC_TEST_ACCOUNT_EMAIL=
NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD=
```

로그인 화면은 기본적으로 테스트 계정이 입력된 상태로 열립니다. 공개 데모 계정을 바꾸려면 Supabase Auth에 해당 계정을 만든 뒤 `NEXT_PUBLIC_TEST_ACCOUNT_EMAIL`, `NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD`를 설정합니다.

## 품질 확인
```bash
npm run lint
npm run typecheck
npm run build
```

현재 일부 동적 이미지 렌더링에는 사용자 업로드, data URL, GIF 미리보기 특성상 `<img>`를 사용하고 있어 `@next/next/no-img-element` warning이 남을 수 있습니다. Production build는 통과하도록 관리합니다.

## 배포
GitHub Actions의 `CD - Vercel` workflow를 수동 실행합니다.

1. GitHub 저장소에서 `Actions` 탭으로 이동합니다.
2. `CD - Vercel` workflow를 선택합니다.
3. `Run workflow`를 누르고 배포할 `ref`를 입력합니다. 기본값은 `main`입니다.
4. 아래 GitHub Secrets가 등록되어 있어야 합니다.

```txt
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## 문서
- 제품 요구사항: `docs/PRD.md`
- 아키텍처 가이드: `docs/ARCHITECTURE.md`
- 에디터 데이터 모델 규칙: `docs/EDITOR_DATA_MODEL_RULES.md`
- 공유 편지 설계: `docs/EDITOR_SHARE_LETTER_PLAN.md`
- 공유 편지 SQL: `docs/EDITOR_SHARE_LETTER_SQL.md`
