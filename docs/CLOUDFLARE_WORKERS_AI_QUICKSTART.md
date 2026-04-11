# Cloudflare Workers AI Quickstart

## 목표
- Cloudflare에서 스티커 1장 생성
- Next.js 에디터의 AI 스티커 패널에서 결과 확인

## 1) Worker 배포
1. Cloudflare 로그인
2. 로컬에서 실행
   - `cd cloudflare/sticker-worker`
   - `npm create cloudflare@latest . -- --ts --existing-script`
   - 파일 덮어쓰기 확인
   - `npx wrangler deploy`
3. 배포 후 Worker URL 복사

## 2) Next.js 환경변수
`.env.local`에 추가

```env
NEXT_PUBLIC_CF_WORKER_URL=https://your-worker.your-subdomain.workers.dev
```

## 3) 웹에서 테스트
1. `npm run dev`
2. 에디터 화면 접속
3. 스티커 패널에서 프롬프트 입력 후 `AI 스티커 생성`

## 4) 확인 포인트
- 결과 이미지가 보이면 성공
- 실패 시 브라우저 에러 + Worker 로그 확인

## 5) 다음 단계
1. 생성 이미지 Supabase Storage 저장
2. 생성 횟수 제한(비용 보호)
