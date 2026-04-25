# Editor Data Model Rules

## Purpose
이 문서는 Memolie 에디터의 데이터 모델과 저장 구조에 대한 현재 확정 규칙을 정리한다.
특히 날짜 기반 일기, 캔버스 아이템, Supabase 저장 전략을 구현할 때 기준으로 사용한다.

## Current Decisions

### Entry Unit
- 일기는 `유저 1명 + 날짜 1개`를 기준으로 한다.
- 하루에 작성 가능한 일기는 1개다.
- 같은 날짜에 여러 개의 별도 엔트리를 두지 않는다.

### Route And Lookup Rule
- 에디터 라우트는 날짜 기반으로 진입한다.
- 기준 형식은 `YYYY-MM-DD`다.
- 에디터 진입 시 `user_id + entry_date`로 기존 일기를 조회한다.
- 기존 일기가 있으면 해당 데이터를 로드한다.
- 기존 일기가 없으면 빈 초안 상태로 시작한다.

### Persistence Split
- 일기 본문과 메타 정보는 `diary_entries` 테이블에 저장한다.
- 캔버스 위 요소는 `editor_items` 테이블에 저장한다.
- 이미지, GIF, AI 스티커 파일은 Supabase Storage에 저장한다.
- 데이터베이스에는 파일 자체가 아니라 파일 URL과 메타데이터만 저장한다.

## Table Responsibilities

### diary_entries
이 테이블은 날짜별 일기 문서 자체를 저장한다.

포함 대상:
- `user_id`
- `entry_date`
- 제목
- 본문
- 감정
- 태그
- 단면 / 양면 보기 설정
- 저장 상태
- 생성 / 수정 시각

### editor_items
이 테이블은 캔버스에 배치되는 개별 요소를 저장한다.

포함 대상:
- `entry_id`
- `user_id`
- 요소 타입
- 페이지 위치
- 좌표
- 크기
- 회전
- 레이어 순서
- 투명도
- 타입별 payload
- 생성 / 수정 시각

## Item Type Rules
- 캔버스 아이템 타입은 각각 분리한다.
- 현재 기준 타입은 아래와 같다:
  - `text`
  - `sticker`
  - `image`
  - `gif`
- 스티커는 이미지와 별도 타입으로 둔다.
- AI 스티커도 저장 시 `sticker` 타입으로 관리한다.
- AI 생성 여부는 payload 메타데이터로 구분한다.

예시:
- `type = sticker`
- `payload.source = "ai"`

## Storage Rules
- 업로드 이미지, GIF, AI 생성 결과물은 Supabase Storage 버킷에 저장한다.
- DB에는 Storage 경로 또는 public URL만 저장한다.
- base64 원본을 DB에 직접 저장하지 않는다.
- 바이너리 파일을 테이블 컬럼에 직접 저장하지 않는다.

## Save Strategy
MVP 단계의 저장은 단순성과 안정성을 우선한다.

### Entry Save
- `diary_entries`는 `upsert` 전략을 사용한다.
- 기준 키는 `user_id + entry_date`다.

### Item Save
- `editor_items`는 아이템 `id`를 기준으로 diff 저장 전략을 사용한다.
- 저장 시 순서는 아래와 같다:
  1. `diary_entries` upsert
  2. 대상 `entry_id` 확보
  3. 기존 `editor_items` id 목록 조회
  4. 현재 캔버스에 없는 id만 delete
  5. 현재 캔버스 아이템은 `id` 기준 upsert

## Why This Strategy
- 아이템 수가 늘어도 저장 비용이 덜 커진다.
- 같은 아이템의 row identity를 유지할 수 있다.
- 자동 저장, 충돌 복구, 추후 협업 기능에 더 유리하다.
- AI 스티커, GIF, 이미지, 텍스트를 동일한 저장 흐름에 태울 수 있다.
- 여전히 프론트 모델은 단순하게 유지할 수 있다.

## Load Strategy
- 에디터 진입 시 먼저 `diary_entries`를 조회한다.
- 엔트리가 존재하면 그 `entry_id`로 `editor_items`를 조회한다.
- 엔트리가 존재하지 않으면 빈 상태를 초기값으로 사용한다.
- 빈 초안은 사용자가 저장할 때 실제 row로 생성한다.

## Frontend Contract Direction
프론트엔드는 최소한 아래 두 단위를 분리해서 다룬다.

### Entry Model
- 날짜별 문서 정보
- 본문 / 감정 / 태그 / 상태 / 뷰 모드

### Canvas Item Model
- 위치 / 크기 / 회전 / 레이어 / 타입 / payload

## Notes For Future Work
- 이후 자동 저장을 붙여도 기본 저장 구조는 유지한다.
- 이후 undo/redo가 추가되어도 DB 구조는 그대로 사용 가능해야 한다.
- 이후 공유 / 공개 범위가 생기면 `diary_entries`에 확장한다.
- 이후 미디어 라이브러리가 생기면 Storage 경로 규칙만 확장한다.
