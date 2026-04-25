# AI 일기 친구 — RAG 채팅 아키텍처

에디터 우측 채팅 패널에서 과거 일기를 기억하는 AI와 대화하는 기능의 설계 문서입니다.

## 흐름 요약

```
[저장] → Voyage AI 임베딩 생성 → Supabase diary_entries.embedding 저장
[채팅] → 질문 임베딩 생성 → pgvector 유사도 검색 → 컨텍스트 주입 → Groq 스트리밍 응답
```

## 컴포넌트 구성

| 파일 | 역할 |
|------|------|
| `src/app/api/diary/embed/route.ts` | 일기 텍스트 → Voyage AI 임베딩 → Supabase 저장 |
| `src/app/api/diary/chat/route.ts` | RAG 검색 + Groq 스트리밍 응답 생성 |
| `src/features/chat/hooks/useDiaryChat.ts` | 채팅 상태, 이력 로드, 스트리밍 수신 |
| `src/features/chat/components/DiaryChat.tsx` | 슬라이드 패널 UI |
| `src/features/editor/hooks/useEditorPersistenceActions.ts` | 저장 성공 후 임베딩 트리거 |

## 임베딩 생성 (`/api/diary/embed`)

저장이 성공한 후에만 호출됩니다 (`persistSession` 반환값으로 제어).

```
입력: { pageId: "2025-01-15", text: "제목\n태그\n본문" }
모델: voyage-3-lite (512차원)
저장: diary_entries.embedding (vector(512))
실패: best-effort — 임베딩 실패가 저장을 막지 않음, 5xx 시 1회 재시도
```

임베딩 텍스트는 `제목 + 태그 + stripHtml(본문)` 순으로 조합합니다. 제목·태그가 의미적으로 밀도가 높아 검색 품질에 더 많이 기여합니다.

## 유사도 검색 (`match_diary_entries` RPC)

```sql
-- Supabase pgvector 함수
match_diary_entries(
  query_embedding vector(512),
  match_threshold  float  -- 0.4 (코사인 유사도)
  match_count      int    -- 최대 5개
  p_user_id        uuid
)
```

임계값 0.4는 너무 관련 없는 일기가 컨텍스트로 섞이는 것을 방지하는 경험적 값입니다.

## 채팅 응답 생성 (`/api/diary/chat`)

```
시스템 프롬프트: 한국어 전용 지시 + 유사 일기 컨텍스트 (최대 5건)
모델: llama-3.3-70b-versatile (Groq, OpenAI 호환 엔드포인트)
대화 이력: 최근 8턴 (conversationHistory.slice(-8))
max_tokens: 400 (간결한 응답 유도)
응답 방식: ReadableStream 스트리밍 → text/plain
```

RAG 검색이 실패해도 채팅은 계속됩니다 (try/catch로 격리).

## 대화 이력 영속화

- 테이블: `chat_messages` (user_id, entry_date, role, content, created_at)
- 로드: 채팅 패널이 열릴 때 해당 `entry_date`의 이력을 Supabase에서 조회
- 저장: 스트리밍 완료 후 user + assistant 메시지를 함께 insert
- 초기 인사: DB에 이력이 없을 때만 클라이언트에서 인사 메시지를 표시 (DB에는 저장하지 않음)

## 한국어 응답 강제

Llama 3 계열 모델은 한국어 입력에 베트남어·일본어가 섞이는 경우가 있어 시스템 프롬프트에 명시적 지시를 포함합니다.

```
반드시 한국어로만 답변하세요. 다른 언어(영어, 일본어, 중국어, 베트남어 등)는 절대 사용하지 마세요.
```
