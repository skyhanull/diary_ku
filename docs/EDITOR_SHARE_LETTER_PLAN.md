# Editor Share Letter Plan

## 1) 목적
사용자가 에디터에서 작성한 일기를 사이트 전체가 아니라 `편지처럼 전달되는 읽기 전용 결과물`로 공유할 수 있게 한다.

공유 경험의 핵심은 다음이다.
- 작성자는 에디터에서 계속 수정할 수 있다.
- 공유 시점에는 결과물을 하나의 `편지 snapshot`으로 발행한다.
- 수신자는 봉투를 열고 편지를 펼치듯 내용을 본다.

## 2) 왜 이 구조가 맞는가

### 사이트 전체 공유보다 나은 이유
- 편집 UI, 패널, 툴바를 숨기고 감성적인 결과물만 전달할 수 있다.
- SNS 링크 공유 시 소비 경험이 더 명확하다.
- DearMe의 다이어리 / 편지 무드와 잘 맞는다.

### 원본 페이지 직접 공유보다 나은 이유
- 원본 일기를 나중에 수정해도 이미 보낸 편지는 바뀌지 않는다.
- 공유 링크를 `읽기 전용`으로 안정적으로 유지할 수 있다.
- 애니메이션과 커버 UI를 공유 전용으로 따로 설계할 수 있다.

## 3) 핵심 개념

### 원본 엔티티
- `diary entry`
- 작성자가 계속 수정하는 편집 원본

### 공유 엔티티
- `shared letter`
- 특정 시점의 diary entry를 복사한 공개용 결과물

즉 공유는 URL만 만드는 것이 아니라, `그 순간의 상태를 발행한다`는 개념으로 본다.

## 4) MVP 사용자 흐름
1. 작성자가 에디터에서 일기를 저장한다.
2. `편지로 공유` 버튼을 누른다.
3. 공유 설정을 입력한다.
4. 시스템이 공유용 snapshot을 생성한다.
5. 공유 링크를 복사하거나 SNS로 보낸다.
6. 수신자는 `/letter/[token]`에서 봉투를 열고 편지를 본다.

## 5) 라우트 구조

### 편집 라우트
- `/editor/[pageId]`
- 역할: 작성, 수정, 저장

### 공유 생성 UI
- 1차는 `EditorScreen` 내부 모달 또는 오른쪽 패널 추천
- 예시:
  - `ShareLetterModal`
  - `ShareLetterPanel`

### 공유 결과 라우트
- `/letter/[shareToken]`
- 역할: 읽기 전용 공유 페이지

## 6) 데이터 구조

### 기존 데이터
현재 editor는 대략 아래 구조를 원본으로 가진다.
- `DiaryEntryRecord`
- `EditorItem[]`

### 추가 추천 테이블
`shared_letters`

추천 컬럼:
```ts
interface SharedLetterRow {
  id: string;
  entry_id: string;
  user_id: string;
  share_token: string;
  title: string | null;
  recipient_name: string | null;
  cover_message: string | null;
  snapshot_json: SharedLetterSnapshot;
  theme: 'paper' | 'cream' | 'midnight';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
```

### snapshot 구조
```ts
interface SharedLetterSnapshot {
  entryDate: string;
  title: string | null;
  bodyHtml: string | null;
  background: string;
  items: EditorItem[];
  viewMode: 'single';
}
```

### 왜 snapshot이 필요한가
- 공유 후 원본을 수정해도 공유본은 유지된다.
- 편지를 "보낸 시점의 결과물"로 고정할 수 있다.
- 읽기 전용 페이지가 원본 상태 변화에 덜 흔들린다.

## 7) 권한 / 공개 범위

### MVP 기준
- 공유 링크 생성은 작성자만 가능
- 링크를 아는 사람은 읽기 가능
- 공유 페이지는 읽기 전용
- 삭제 또는 재발행은 작성자만 가능

## 8) 프론트엔드 컴포넌트 구조

### editor 쪽
- `ShareLetterModal`
  - recipient name 입력
  - cover message 입력
  - 공유 링크 생성
  - 링크 복사 / SNS 공유 버튼

### share 쪽
- `LetterOpenScreen`
  - 봉투 닫힌 상태
  - 열기 CTA
- `LetterEnvelope`
  - 봉투 flap
  - 커버 텍스트
- `LetterPaper`
  - 펼쳐지는 종이 레이어
- `SharedDiaryRenderer`
  - 읽기 전용 diary 렌더
  - 본문과 아이템 렌더
  - 선택/이동/리사이즈 없음
- `LetterActionBar`
  - 링크 복사
  - 이미지 저장
  - 다시 보기

## 9) 상태 흐름

### 공유 생성 상태
```ts
type ShareLetterStatus =
  | 'idle'
  | 'creating'
  | 'created'
  | 'error';
```

### 편지 열기 상태
```ts
type LetterOpenState =
  | 'closed'
  | 'opening'
  | 'opened';
```

## 10) 애니메이션 구조
1. `closed`
  - 봉투만 보임
2. `opening`
  - flap이 열림
  - 종이가 위로 올라옴
3. `opened`
  - 일기 내용이 fade-in
  - 장식 요소가 순차적으로 등장

구현 메모:
- 1차는 CSS transition으로 충분
- 첫 진입 1회만 강하게, 재방문은 짧게
- 모바일에서 600ms~900ms 안쪽 권장

## 11) 서버 / persistence 흐름
1. 에디터에서 `편지로 공유` 클릭
2. 현재 entry + items를 읽는다
3. 서버에서 snapshot을 만든다
4. `shared_letters` row를 생성한다
5. `share_token`을 반환한다
6. `/letter/[shareToken]` 링크를 사용자에게 보여준다

## 12) 추천 구현 순서

### 1차
- `shared_letters` 타입 정의
- share token 기반 라우트 생성
- 읽기 전용 shared page 렌더

### 2차
- 봉투 오픈 애니메이션 추가
- 링크 복사 버튼 추가

### 3차
- 에디터 내 공유 모달 추가
- snapshot 생성 API 연결

### 4차
- SNS 공유
- OG 이미지 / 메타데이터
- 이미지 저장 또는 카드 export

## 13) MVP에서 꼭 지킬 규칙
- 공유 페이지는 읽기 전용이어야 한다.
- 에디터 UI를 그대로 노출하지 않는다.
- 공유는 원본 참조가 아니라 snapshot 발행으로 본다.
- 공유용 렌더와 편집용 렌더의 책임을 섞지 않는다.
