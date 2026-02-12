# DearMe

디지털 다이어리 꾸미기 사이드프로젝트.

## 시작
1. `cp .env.example .env.local`
2. `.env.local`에 Supabase 값 입력
3. `npm install`
4. `npm run dev`

## 배포/운영 기본 세팅
- CI: `.github/workflows/ci.yml`
  - `main` push/PR마다 `lint` + `typecheck` + `build` 검증
- CD: `.github/workflows/cd-vercel.yml`
  - `main` push 시 Vercel Production 배포
- PR 자동화:
  - `.github/workflows/pr-auto-review.yml` (품질 자동 리뷰 코멘트)
  - `.github/workflows/pr-summary.yml` (변경 요약 코멘트)
- Vercel 설정: `vercel.json`

## GitHub Secrets (CD용)
아래 3개를 GitHub Repository Settings -> Secrets and variables -> Actions에 등록:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 로컬 체크 커맨드
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## 현재 범위
- PRD: `docs/PRD.md`
- 초기 화면: `/`, `/auth`
- AI 테스트 화면: `/ai-sticker-test`
- Supabase 클라이언트: `src/lib/supabase.ts`
- 디자인 시스템 컴포넌트: `src/components/ui/*`

## Import Alias
- `@/*` -> `src/*`
- 예: `import { Button } from '@/components/ui/button'`
