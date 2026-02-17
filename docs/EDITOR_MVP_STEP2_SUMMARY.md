# Editor MVP Step 2 - 작업 요약

## 개요
에디터 MVP 2단계: GIF 스티커 검색, 스티커 삭제 기능, 공용 헤더 및 마이페이지 추가.

---

## 1. GIF 스티커 검색 (GIPHY API)

### 배경
- 처음에는 Cloudflare Workers AI(`flux-1-schnell`)로 GIF 생성을 시도했으나, 해당 모델은 정적 이미지만 지원
- 무료 대안으로 GIPHY Stickers API를 선택

### 구현 내용
- **GIPHY Stickers API** (`/v1/stickers/search`) 연동
- 검색어 입력 후 GIF 스티커 검색
- **페이지네이션**: 한 번에 24개 fetch → 4개씩 페이지로 표시 (이전/다음 버튼)
- **더 불러오기**: 마지막 페이지에서 추가 24개 로드 (GIPHY offset 파라미터)
- 검색 결과 클릭 시 캔버스에 GIF 스티커 삽입

### 관련 파일
- `src/features/editor/components/EditorScreen.tsx` - GIF 검색 UI 및 로직
- `.env.local` - `NEXT_PUBLIC_GIPHY_API_KEY` 환경변수

---

## 2. 스티커 삭제 기능

### 구현 내용
- **개별 삭제 버튼**: 스티커 선택 시 우측 상단에 빨간 X 버튼 표시
- **키보드 단축키**: `Delete` / `Backspace` 키로 선택된 스티커 삭제
- **사이드바 삭제 버튼**: "선택한 스티커 삭제" 버튼 (스티커 탭)

### 관련 파일
- `src/features/editor/components/EditorCanvasSingle.tsx` - `onDeleteItem` prop, X 버튼 렌더링
- `src/features/editor/components/EditorScreen.tsx` - `handleDeleteSelectedSticker`, 키보드 이벤트 리스너

---

## 3. 공용 헤더

### 구현 내용
- **공용 Header 컴포넌트** 생성
- 네비게이션: 홈, 에디터, 마이페이지
- 로그인 상태에 따라 로그인/로그아웃 버튼 전환
- Supabase Auth 연동 (실시간 상태 감지)
- `/editor/*` 경로에서 자동 숨김 (에디터는 전체화면)
- 반투명 blur 배경, sticky 고정

### 관련 파일
- `src/components/Header.tsx` - 헤더 컴포넌트
- `src/app/layout.tsx` - 루트 레이아웃에 헤더 추가

---

## 4. 마이페이지

### 구현 내용
- 프로필 카드: 프로필 사진, 이름, 이메일
- 계정 정보: 가입일, 로그인 방법
- 로그아웃 기능
- 비로그인 시 로그인 유도 화면

### 관련 파일
- `src/app/mypage/page.tsx` - 마이페이지

---

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `src/features/editor/components/EditorScreen.tsx` | GIF 검색, 페이지네이션, 삭제 기능 추가 |
| `src/features/editor/components/EditorCanvasSingle.tsx` | `onDeleteItem` prop, X 삭제 버튼 |
| `src/components/Header.tsx` | 공용 헤더 (신규) |
| `src/app/mypage/page.tsx` | 마이페이지 (신규) |
| `src/app/layout.tsx` | 헤더 추가 |
| `src/app/editor/[pageId]/page.tsx` | 에디터 페이지 설정 |

## 환경변수

```env
NEXT_PUBLIC_GIPHY_API_KEY=<your_giphy_api_key>
```
