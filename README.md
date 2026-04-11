# DearMe

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
- 복잡한 에디터 상태를 액션 기반으로 분리했습니다. `useEditorState`에서 선택, 추가, 수정, 삭제, dirty 상태를 관리하고 화면 컴포넌트는 렌더링과 사용자 입력에 집중하도록 나눴습니다.
- 화면 상태와 저장 모델을 분리했습니다. 프론트의 `EditorItem`을 Supabase의 `diary_entries`, `editor_items` 구조로 매핑해 저장/복원 시 데이터 계약이 흔들리지 않도록 했습니다.
- 드래그/리사이즈 좌표 안정성을 개선했습니다. 줌 배율을 반영해 포인터 좌표를 계산하고 `clamp`로 요소가 캔버스 밖으로 벗어나지 않도록 제한했습니다.
- 공유 링크의 일관성을 위해 원본 일기와 공유 스냅샷을 분리했습니다. 공유 생성 시점의 본문, 배경, 아이템 배열을 `snapshot_json`으로 저장해 이후 편집이 공유 화면에 예기치 않게 섞이지 않도록 했습니다.
- 배포 트리거를 수동화했습니다. `main` 머지 즉시 배포되지 않도록 GitHub Actions CD workflow에서 push trigger를 제거하고 `workflow_dispatch`만 사용합니다.

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
```

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
