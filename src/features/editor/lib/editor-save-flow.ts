// 저장 흐름 컨트롤러: 수동/본문/자동저장 요청을 ID로 추적해 race condition을 방지한다
// 수동/본문/자동 세 가지 저장 모드를 구분하는 타입
export type EditorPersistMode = "manual" | "body" | "autosave";

// 각 모드별 진행 중인 저장 요청 수를 추적하는 카운터 타입
export interface EditorPersistCounts {
  manual: number;
  body: number;
  autosave: number;
}

// 모든 모드 카운터를 0으로 초기화한 객체를 반환한다
function createInitialCounts(): EditorPersistCounts {
  return {
    manual: 0,
    body: 0,
    autosave: 0,
  };
}

// 저장 요청 ID와 모드별 카운터를 관리하는 컨트롤러 객체를 생성한다
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
