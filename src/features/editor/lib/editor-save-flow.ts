export type EditorPersistMode = "manual" | "body" | "autosave";

export interface EditorPersistCounts {
  manual: number;
  body: number;
  autosave: number;
}

function createInitialCounts(): EditorPersistCounts {
  return {
    manual: 0,
    body: 0,
    autosave: 0,
  };
}

export function createEditorSaveFlowController() {
  let latestRequestId = 0;
  const counts = createInitialCounts();

  return {
    start(mode: EditorPersistMode) {
      latestRequestId += 1;
      counts[mode] += 1;
      return latestRequestId;
    },
    finish(mode: EditorPersistMode) {
      counts[mode] = Math.max(0, counts[mode] - 1);
      return { ...counts };
    },
    isLatest(requestId: number) {
      return requestId === latestRequestId;
    },
    hasActivePersist() {
      return counts.manual > 0 || counts.body > 0 || counts.autosave > 0;
    },
    getCounts() {
      return { ...counts };
    },
  };
}
