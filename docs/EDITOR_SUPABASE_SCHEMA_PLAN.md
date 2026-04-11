# Editor Supabase Schema Plan

## Purpose
이 문서는 Memolie 에디터의 Supabase 테이블 구조 초안을 정리한다.
`docs/EDITOR_DATA_MODEL_RULES.md`에서 확정한 규칙을 실제 DB 스키마로 옮기기 위한 문서다.

## What We Are Storing
에디터 저장은 아래 4개 영역으로 나눈다.

1. `diary_entries`
   - 날짜별 일기 문서
   - 본문, 감정, 태그, 상태 같은 메타 정보
2. `editor_items`
   - 캔버스 위 요소
   - 텍스트, 스티커, 이미지, GIF
3. `schedules`
   - 날짜별 개인 일정
   - 메인 달력과 날짜 상세 패널에서 사용
4. Supabase Storage
   - 사진 파일
   - GIF 파일
   - AI 스티커 결과 이미지

## High-Level Model

### One Entry Per Day
- 기준은 `user_id + entry_date`
- 같은 유저는 같은 날짜에 일기 1개만 가진다

### One Entry Has Many Items
- `diary_entries` 1개는 `editor_items` 여러 개를 가질 수 있다
- 아이템은 `entry_id`로 연결한다

## Table 1: diary_entries

### Role
하루 단위 일기 문서 자체를 저장한다.

### Recommended Columns

| column | type | required | meaning |
|---|---|---:|---|
| `id` | `uuid` | yes | 일기 row 고유 id |
| `user_id` | `uuid` | yes | 작성자 id |
| `entry_date` | `date` | yes | 일기 날짜 |
| `title` | `text` | no | 제목 |
| `body_html` | `text` | no | 본문 HTML |
| `mood` | `text` | no | 감정 값 |
| `tags` | `text[]` | yes | 태그 배열 |
| `view_mode` | `entry_view_mode` | yes | `single` 또는 `spread` |
| `status` | `entry_status` | yes | `draft`, `saved`, `published` |
| `created_at` | `timestamptz` | yes | 생성 시각 |
| `updated_at` | `timestamptz` | yes | 수정 시각 |

### Why Each Field Exists
- `entry_date`: 날짜 기반 에디터 진입과 조회를 위해 필요하다
- `body_html`: 현재 에디터 본문이 HTML 중심이라서 그대로 저장하기 좋다
- `tags`: 해시태그 성격이라 배열로 두는 것이 편하다
- `view_mode`: 단면 / 양면 편집 상태를 복원하려면 필요하다
- `status`: 홈 달력에서 초안 / 저장 / 공개 상태를 보여줄 수 있다

### Constraints
- `unique (user_id, entry_date)`

이 제약이 있어야 하루에 일기 1개 규칙이 DB에서 보장된다.

## Table 2: editor_items

### Role
캔버스에 놓인 개별 요소를 저장한다.

### Recommended Columns

| column | type | required | meaning |
|---|---|---:|---|
| `id` | `uuid` | yes | 아이템 고유 id |
| `entry_id` | `uuid` | yes | 어떤 일기에 속하는지 |
| `user_id` | `uuid` | yes | 소유자 |
| `type` | `editor_item_type` | yes | `text`, `sticker`, `image`, `gif` |
| `page_side` | `editor_page_side` | yes | `single`, `left`, `right` |
| `x` | `numeric(10,2)` | yes | x 좌표 |
| `y` | `numeric(10,2)` | yes | y 좌표 |
| `width` | `numeric(10,2)` | yes | 너비 |
| `height` | `numeric(10,2)` | yes | 높이 |
| `rotation` | `numeric(8,2)` | yes | 회전 각도 |
| `z_index` | `int` | yes | 레이어 순서 |
| `opacity` | `numeric(4,2)` | yes | 투명도 |
| `payload` | `jsonb` | yes | 타입별 상세 데이터 |
| `created_at` | `timestamptz` | yes | 생성 시각 |
| `updated_at` | `timestamptz` | yes | 수정 시각 |

### Why `payload` Is JSONB
아이템 타입마다 필요한 필드가 다르다.

예시:
- 텍스트는 내용, 글자 크기, 글자색
- 스티커는 이미지 URL, 생성 출처
- 이미지는 URL, 원본 파일명
- GIF는 URL, mediaType

이걸 테이블 컬럼으로 다 풀어놓으면 MVP에서 너무 복잡해진다.
그래서 공통 배치 정보는 컬럼으로 두고, 타입별 상세는 `jsonb`로 둔다.

## Payload Direction

### Text Example
```json
{
  "text": {
    "content": "오늘은 햇살이 좋았다",
    "fontSize": 18,
    "color": "#4F3328"
  }
}
```

### Sticker Example
```json
{
  "imageUrl": "https://storage.example/sticker.png",
  "source": "library"
}
```

### AI Sticker Example
```json
{
  "imageUrl": "https://storage.example/ai-sticker.png",
  "source": "ai",
  "prompt": "cute coffee cat sticker"
}
```

### Image Example
```json
{
  "imageUrl": "https://storage.example/photo.jpg",
  "source": "upload",
  "originalFilename": "cafe.jpg"
}
```

### GIF Example
```json
{
  "imageUrl": "https://storage.example/mood.gif",
  "source": "upload",
  "mediaType": "gif",
  "originalFilename": "mood.gif"
}
```

## Enums To Create

### entry_status
- `draft`
- `saved`
- `published`

### entry_view_mode
- `single`
- `spread`

### editor_item_type
- `text`
- `sticker`
- `image`
- `gif`

### editor_page_side
- `single`
- `left`
- `right`

## Storage Plan

### Bucket
추천 버킷 이름:
- `diary-media`

### What Goes Into Storage
- 사용자 업로드 이미지
- 사용자 업로드 GIF
- AI 스티커 생성 결과

### What Stays In DB
- 파일 URL 또는 storage path
- 위치, 크기, 회전, 레이어
- source, prompt, filename 같은 메타데이터

## Table 3: schedules

### Role
메인 달력에서 날짜별로 보이는 사용자 일정을 저장한다.

### Recommended Columns

| column | type | required | meaning |
|---|---|---:|---|
| `id` | `uuid` | yes | 일정 row 고유 id |
| `user_id` | `uuid` | yes | 작성자 id |
| `schedule_date` | `date` | yes | 일정 날짜 |
| `title` | `text` | yes | 일정 제목 |
| `note` | `text` | no | 메모 |
| `created_at` | `timestamptz` | yes | 생성 시각 |
| `updated_at` | `timestamptz` | yes | 수정 시각 |

### Why Each Field Exists
- `schedule_date`: 메인 달력 날짜 셀과 직접 연결된다
- `title`: 달력 셀과 오른쪽 상세 패널에 바로 보여줄 핵심 텍스트다
- `note`: 일정에 대한 짧은 설명이나 준비 메모를 남기기 위해 둔다

### Constraints
- 최소 제약은 `user_id`, `schedule_date` 인덱스다
- 하루에 여러 일정이 가능해야 하므로 `user_id + schedule_date` unique는 두지 않는다

## Save Flow

### On Save
1. `diary_entries`를 `user_id + entry_date` 기준으로 upsert
2. 반환된 `entry_id` 확보
3. 해당 `entry_id`의 기존 `editor_items` 삭제
4. 현재 아이템 배열 전체 insert

### On Load
1. `user_id + entry_date`로 `diary_entries` 조회
2. 있으면 `entry_id`로 `editor_items` 조회
3. 없으면 빈 초안 상태 사용

## Practical Notes
- `editor_items.user_id`는 RLS와 디버깅에서 도움이 된다
- `payload`는 나중에 필드가 늘어나도 스키마 변경이 적다
- MVP에서는 아이템 diff update보다 전체 덮어쓰기가 더 안전하다

## Next Step
이 문서 다음 단계는 실제 SQL 작성이다.
SQL에는 아래가 포함되어야 한다.

1. enum 생성
2. `diary_entries` 테이블 생성
3. `editor_items` 테이블 생성
4. `schedules` 테이블 생성
5. unique / foreign key / index 설정
6. RLS 정책 추가
7. `diary-media` storage bucket 정책 추가
