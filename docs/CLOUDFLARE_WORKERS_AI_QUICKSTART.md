# Cloudflare Workers AI Quickstart

## 목표
- Cloudflare에서 스티커 1장 생성
- Next.js 웹(`/ai-sticker-test`)에서 결과 확인

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
2. `http://localhost:3000/ai-sticker-test` 접속
3. 프롬프트 입력 후 생성

## 4) 확인 포인트
- 결과 이미지가 보이면 성공
- 실패 시 브라우저 에러 + Worker 로그 확인

## 5) 다음 단계
1. 생성 이미지 Supabase Storage 저장
2. diary editor 캔버스에 바로 삽입
3. 생성 횟수 제한(비용 보호)
