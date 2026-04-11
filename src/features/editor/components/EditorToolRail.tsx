"use client";

import { forwardRef } from "react";
import { ChevronLeft, ImagePlus, MousePointer2, Sticker, Type } from "lucide-react";

import { ToolIconButton } from "@/components/ui/tool-icon-button";
import type { EditorSidePanel, EditorTool } from "@/features/editor/types/editor.types";

interface EditorToolRailProps {
  activePanel: EditorSidePanel;
  onChangePanel: (panel: EditorSidePanel) => void;
  onChangeTool: (tool: EditorTool) => void;
}

export const EditorToolRail = forwardRef<HTMLElement, EditorToolRailProps>(({ activePanel, onChangePanel, onChangeTool }, ref) => {
  const openPanel = (panel: EditorSidePanel) => {
    onChangeTool("select");
    onChangePanel(panel);
  };

  return (
    <aside ref={ref} className="fixed left-0 top-16 z-40 flex h-[calc(100vh-64px)] w-20 flex-col items-center gap-ds-6 rounded-r-[28px] border-r border-line bg-oatmeal py-ds-6">
      <ToolIconButton onClick={() => openPanel("base")} active={activePanel === "base"}>
        <MousePointer2 className="h-5 w-5" />
      </ToolIconButton>
      <ToolIconButton onClick={() => openPanel("text")} active={activePanel === "text"}>
        <Type className="h-5 w-5" />
      </ToolIconButton>
      <ToolIconButton onClick={() => openPanel("sticker")} active={activePanel === "sticker"}>
        <Sticker className="h-5 w-5" />
      </ToolIconButton>
      <ToolIconButton onClick={() => openPanel("media")} active={activePanel === "media"}>
        <ImagePlus className="h-5 w-5" />
      </ToolIconButton>

      <ToolIconButton className="mt-auto">
        <ChevronLeft className="h-5 w-5" />
      </ToolIconButton>
    </aside>
  );
});

EditorToolRail.displayName = "EditorToolRail";
