"use client";

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

interface EditorTutorialOverlayProps {
  step: TutorialStep;
  stepIndex: number;
  layout: TutorialBubbleLayout | null;
  onPrevious: () => void;
  onNext: () => void;
}

export function EditorTutorialOverlay({ step, stepIndex, layout, onPrevious, onNext }: EditorTutorialOverlayProps) {
  return (
    <div className="fixed inset-0 z-[120] bg-[rgba(38,30,28,0.52)] backdrop-blur-[3px]">
      {step.id === "sidebar" ? <div className="pointer-events-none fixed left-1 top-[75px] h-[calc(100vh-82px)] w-20 rounded-[28px] border-[5px] border-focus shadow-[0_0_0_9999px_rgba(0,0,0,0.06)]" /> : null}
      {step.id === "canvas" ? <div className="pointer-events-none fixed left-[98px] right-[332px] top-[60px] bottom-2 rounded-[28px] border-[5px] border-focus shadow-[0_0_0_9999px_rgba(0,0,0,0.06)]" /> : null}
      {step.id === "panel" ? <div className="pointer-events-none fixed right-2 top-[75px] h-[calc(100vh-82px)] w-[304px] rounded-[28px] border-[5px] border-focus shadow-[0_0_0_9999px_rgba(0,0,0,0.06)]" /> : null}

      <div
        className="absolute w-[min(92vw,440px)] rounded-[24px] border border-line-warm bg-paper-cream px-ds-6 py-ds-5 text-ink shadow-[0_20px_60px_rgba(54,35,28,0.22)]"
        style={{
          left: layout?.left ?? 24,
          top: layout?.top ?? 24,
        }}
      >
        {layout?.arrowSide === "left" ? <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rotate-45 border-b border-l border-line-warm bg-paper-cream" /> : null}
        {layout?.arrowSide === "right" ? <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rotate-45 border-r border-t border-line-warm bg-paper-cream" /> : null}
        {layout?.arrowSide === "top" ? <div className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-line-warm bg-paper-cream" /> : null}
        {layout?.arrowSide === "bottom" ? <div className="absolute bottom-0 left-1/2 h-6 w-6 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-line-warm bg-paper-cream" /> : null}

        <div className="relative flex items-start justify-between gap-ds-4">
          <div>
            <div className="inline-flex items-center gap-ds-2 rounded-full bg-cedar-soft px-ds-3 py-ds-1 text-ds-micro font-semibold uppercase tracking-[0.18em] text-cedar">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-cedar text-ds-micro text-white">{stepIndex + 1}</span>
              Tutorial Step
            </div>
            <h3 className="mt-ds-3 text-ds-modal-title font-bold tracking-tight">{step.title}</h3>
            <p className="mt-ds-2 text-ds-body leading-6 text-ink-warm">{step.description}</p>
          </div>
        </div>

        <div className="relative mt-ds-5 flex items-center justify-between">
          <button type="button" onClick={onPrevious} disabled={stepIndex === 0} className="rounded-full border border-line bg-white px-ds-4 py-ds-2 text-ds-body text-ink-warm disabled:opacity-40">
            이전
          </button>
          <div className="flex items-center gap-ds-2">
            {tutorialSteps.map((tutorialStep, index) => (
              <span key={tutorialStep.id} className={`h-2.5 w-2.5 rounded-full ${index === stepIndex ? "bg-cedar" : "bg-line"}`} />
            ))}
          </div>
          <button type="button" onClick={onNext} className="rounded-full bg-cedar-deep px-ds-5 py-ds-2 text-ds-body font-semibold text-white shadow-[0_8px_18px_rgba(125,100,86,0.35)]">
            {stepIndex === tutorialSteps.length - 1 ? "시작하기" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
