// 에디터 캔버스 좌표계 상수: 아이템 x/y/width/height는 이 페이지 크기를 기준으로 저장된다.
// EditorCanvasSingle의 페이지가 `w-[700px] aspect-[3/4]`이므로 공유 편지에서도 같은 좌표계를
// 그대로 스케일해 아이템 위치를 정확히 재현한다. 여기 값과 EditorCanvasSingle의 페이지 크기는 함께 유지한다.
export const EDITOR_PAGE_WIDTH = 700;
export const EDITOR_PAGE_HEIGHT = Math.round((EDITOR_PAGE_WIDTH * 4) / 3);
