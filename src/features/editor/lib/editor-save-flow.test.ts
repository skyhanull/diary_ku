// editor-save-flow의 동시 저장 요청 관리·race condition 방지 로직 단위 테스트
import { describe, expect, it } from "vitest";

import { createEditorSaveFlowController } from "./editor-save-flow";

describe("editor save flow controller", () => {
  it("treats only the newest request as the latest completion", () => {
    const controller = createEditorSaveFlowController();

    const firstRequestId = controller.start("autosave");
    const secondRequestId = controller.start("manual");

    expect(controller.isLatest(firstRequestId)).toBe(false);
    expect(controller.isLatest(secondRequestId)).toBe(true);
  });

  it("tracks active persist counts per mode", () => {
    const controller = createEditorSaveFlowController();

    controller.start("autosave");
    controller.start("autosave");
    controller.start("body");

    expect(controller.getCounts()).toEqual({
      manual: 0,
      body: 1,
      autosave: 2,
    });

    controller.finish("autosave");
    controller.finish("body");

    expect(controller.getCounts()).toEqual({
      manual: 0,
      body: 0,
      autosave: 1,
    });
  });

  it("reports whether any persist request is still active", () => {
    const controller = createEditorSaveFlowController();

    expect(controller.hasActivePersist()).toBe(false);

    controller.start("manual");
    expect(controller.hasActivePersist()).toBe(true);

    controller.finish("manual");
    expect(controller.hasActivePersist()).toBe(false);
  });

  it("keeps the latest request id after older requests finish", () => {
    const controller = createEditorSaveFlowController();

    const firstRequestId = controller.start("manual");
    const secondRequestId = controller.start("autosave");

    controller.finish("manual");

    expect(controller.isLatest(firstRequestId)).toBe(false);
    expect(controller.isLatest(secondRequestId)).toBe(true);
  });

  it("does not let counts drop below zero", () => {
    const controller = createEditorSaveFlowController();

    controller.finish("manual");
    controller.finish("manual");

    expect(controller.getCounts()).toEqual({
      manual: 0,
      body: 0,
      autosave: 0,
    });
  });

  it("tracks multiple active modes at once", () => {
    const controller = createEditorSaveFlowController();

    controller.start("manual");
    controller.start("body");
    controller.start("autosave");

    expect(controller.getCounts()).toEqual({
      manual: 1,
      body: 1,
      autosave: 1,
    });
    expect(controller.hasActivePersist()).toBe(true);
  });

  it("returns to an idle state after every mode finishes", () => {
    const controller = createEditorSaveFlowController();

    controller.start("manual");
    controller.start("body");
    controller.start("autosave");

    controller.finish("manual");
    controller.finish("body");
    controller.finish("autosave");

    expect(controller.getCounts()).toEqual({
      manual: 0,
      body: 0,
      autosave: 0,
    });
    expect(controller.hasActivePersist()).toBe(false);
  });
});
