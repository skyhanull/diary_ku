# Initial Setup Guide

## 1) 현재 초기 세팅 상태
- Next.js 15 + TypeScript 세팅 완료
- Tailwind + shadcn/ui 기본 설정 완료
- Supabase 클라이언트 파일 생성 완료
- CI/CD GitHub Actions 파일 생성 완료
- Vercel 배포용 설정 파일 추가 완료

## 2) 주요 파일
- `package.json`
- `tsconfig.json`
- `next.config.mjs`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `components.json`
- `vercel.json`
- `.github/workflows/ci.yml`
- `.github/workflows/cd-vercel.yml`
- `src/lib/supabase.ts`

## 3) 로컬 실행
1. `cp .env.example .env.local`
2. `.env.local`에 Supabase 값 입력
3. `npm install`
4. `npm run dev`

## 4) GitHub Actions 연결 조건
중요: 워크플로우 파일이 있다고 자동 "연결 완료"는 아님.
아래 조건을 만족해야 실제로 동작한다.

1. GitHub 원격 저장소에 코드 push
2. 기본 브랜치가 `main`
3. GitHub Repo의 Actions 기능이 활성화
4. (CD용) Secrets 등록
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

## 5) 동작 확인 방법
1. GitHub 저장소 탭에서 `Actions` 진입
2. `CI` 워크플로우가 push/PR 시 자동 실행되는지 확인
3. `CD - Vercel` 워크플로우가 main push 시 실행되는지 확인
4. 실패 시 로그에서 실패 단계 확인 후 수정

## 6) 추천 다음 단계
1. 먼저 CI만 통과되게(`lint`, `typecheck`, `build`) 안정화
2. 이후 Vercel secrets 등록하고 CD 활성화
3. 그 다음 기능 개발 시작
