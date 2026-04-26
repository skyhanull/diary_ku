// 튜토리얼 설정: 각 단계의 제목·설명·말풍선 위치를 정의하는 상수 파일
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
}

export interface TutorialBubbleLayout {
  left: number;
  top: number;
  arrowSide: "left" | "right" | "top" | "bottom";
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: "sidebar",
    title: "왼쪽 도구",
    description: "여기서 포인터, 텍스트, 스티커, 사진/움짤 패널을 열 수 있어요. 이제 클릭만으로 바로 생성되진 않고, 오른쪽 패널을 여는 역할만 합니다.",
  },
  {
    id: "canvas",
    title: "가운데 캔버스",
    description: "일기 본문과 꾸미기 요소가 실제로 배치되는 영역이에요. 추가한 요소는 여기서 선택하고 이동할 수 있어요.",
  },
  {
    id: "panel",
    title: "오른쪽 패널",
    description: "현재 선택한 도구에 따라 패널 내용이 바뀝니다. 검색 결과를 보고 직접 골라서 추가하는 흐름도 여기서 진행해요.",
  },
];
