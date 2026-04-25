"use client";

import { useCallback, useEffect, useState } from "react";
import { tutorialSteps, type TutorialBubbleLayout } from "@/features/editor/components/editor-tutorial-config";

const TUTORIAL_STORAGE_KEY = "memolie-editor-tutorial-seen";

interface UseEditorTutorialInput {
  sidebarRef: React.RefObject<HTMLElement | null>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.RefObject<HTMLElement | null>;
}

export function useEditorTutorial({ sidebarRef, canvasRef, panelRef }: UseEditorTutorialInput) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialBubbleLayout, setTutorialBubbleLayout] = useState<TutorialBubbleLayout | null>(null);

  const tutorialStep = tutorialSteps[tutorialStepIndex];

  useEffect(() => {
    const seen = window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!seen) setIsTutorialOpen(true);
  }, []);

  useEffect(() => {
    if (!isTutorialOpen) return;

    const update = () => {
      const bubbleWidth = Math.min(window.innerWidth * 0.92, 440);
      const bubbleHeight = 220;
      const gutter = 24;
      const vp = 16;

      const target =
        tutorialStep?.id === "sidebar"
          ? sidebarRef.current
          : tutorialStep?.id === "canvas"
            ? canvasRef.current
            : panelRef.current;

      if (!target) return;

      const rect = target.getBoundingClientRect();

      if (tutorialStep?.id === "sidebar") {
        setTutorialBubbleLayout({
          left: Math.min(rect.right + gutter, window.innerWidth - bubbleWidth - vp),
          top: Math.min(Math.max(rect.top + 56, vp), window.innerHeight - bubbleHeight - vp),
          arrowSide: "left",
        });
        return;
      }

      if (tutorialStep?.id === "panel") {
        setTutorialBubbleLayout({
          left: Math.max(rect.left - bubbleWidth - gutter, vp),
          top: Math.min(Math.max(rect.top + 80, vp), window.innerHeight - bubbleHeight - vp),
          arrowSide: "right",
        });
        return;
      }

      setTutorialBubbleLayout({
        left: Math.min(
          Math.max(rect.left + rect.width - bubbleWidth - 32, vp),
          window.innerWidth - bubbleWidth - vp
        ),
        top: Math.min(Math.max(rect.top + 120, vp), window.innerHeight - bubbleHeight - vp),
        arrowSide: "right",
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isTutorialOpen, tutorialStep, sidebarRef, canvasRef, panelRef]);

  const closeTutorial = useCallback((markSeen = true) => {
    setIsTutorialOpen(false);
    if (markSeen) window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  }, []);

  const goToNextTutorialStep = useCallback(() => {
    if (tutorialStepIndex >= tutorialSteps.length - 1) {
      closeTutorial(true);
      return;
    }
    setTutorialStepIndex((prev) => prev + 1);
  }, [closeTutorial, tutorialStepIndex]);

  const goToPreviousTutorialStep = useCallback(() => {
    setTutorialStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  return {
    isTutorialOpen,
    tutorialStep,
    tutorialStepIndex,
    tutorialBubbleLayout,
    closeTutorial,
    goToNextTutorialStep,
    goToPreviousTutorialStep,
  };
}
