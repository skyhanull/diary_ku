// 보관함 상단에서 사용하는 미디어 필터 버튼 목록이다.
// key는 내부 상태값, label은 사용자에게 보여줄 텍스트다.
export const archiveMediaFilters = [
  { key: 'all', label: '전체' },
  { key: 'text', label: '글' },
  { key: 'photo', label: '사진' },
  { key: 'sticker', label: '스티커' }
] as const;

// 일기 저장 상태를 보관함 카드에서 읽기 쉬운 한국어 라벨로 바꾼다.
export const archiveStatusLabels = {
  empty: '빈 기록',
  draft: '작성 중',
  saved: '저장됨',
  published: '공유됨'
} as const;
