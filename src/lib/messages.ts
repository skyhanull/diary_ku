export const APP_MESSAGES = {
  authRequired: "로그인이 필요해요.",
  authRequiredAlert: "로그인이 필요합니다.",
  invalidRequest: "잘못된 요청이에요.",
  requestFailed: "요청에 실패했어요.",
  supabaseNotConfigured: "Supabase 설정이 필요해요.",
  diarySaveRequiresAuth: "일기를 저장하려면 로그인해야 해요.",
  scheduleCreateRequiresAuth: "일정을 저장하려면 로그인해야 해요.",
  scheduleUpdateRequiresAuth: "일정을 수정하려면 로그인해야 해요.",
  scheduleDeleteRequiresAuth: "일정을 삭제하려면 로그인해야 해요.",
  embeddingFailed: "임베딩 생성 중 문제가 발생했어요.",
  signOutFailed: "로그아웃 중 문제가 발생했어요.",
  archiveLoadFailed: "보관함을 불러오는 중 문제가 생겼어요.",
  scheduleLoadFailed: "일정을 불러오는 중 문제가 발생했어요.",
  editorLoadFailed: "저장된 일기를 불러오는 중 문제가 발생했어요.",
  imageUploadFailed: "이미지 업로드 중 문제가 발생했어요.",
  imageFileOnly: "이미지 파일만 업로드할 수 있어요.",
  gifSearchFailed: "움짤 검색 중 문제가 발생했어요.",
  gifSearchEmpty: "검색 결과를 찾지 못했어요.",
  aiStickerFailed: "AI 스티커 생성 중 문제가 발생했어요.",
  canvasInitFailed: "이미지 처리 캔버스를 준비하지 못했어요.",
  weatherFetchFailed: "날씨 정보를 불러오지 못했어요.",
} as const;

export function isMissingAuthSessionMessage(message: string | undefined) {
  return message?.toLowerCase().includes("auth session missing") ?? false;
}

export function isAuthRequiredMessage(message: string | undefined) {
  if (!message) return false;

  const authRequiredMessages = new Set<string>([
    APP_MESSAGES.authRequired,
    APP_MESSAGES.diarySaveRequiresAuth,
    APP_MESSAGES.scheduleCreateRequiresAuth,
    APP_MESSAGES.scheduleUpdateRequiresAuth,
    APP_MESSAGES.scheduleDeleteRequiresAuth,
  ]);

  return authRequiredMessages.has(message);
}

export function getUserFacingErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message) {
    return fallback;
  }

  if (isMissingAuthSessionMessage(message)) {
    return APP_MESSAGES.authRequired;
  }

  if (message.startsWith("Failed to fetch")) {
    return fallback;
  }

  if (
    message.startsWith("AuthApiError:") ||
    message.startsWith("PostgrestError:") ||
    message.startsWith("StorageApiError:")
  ) {
    return fallback;
  }

  return message;
}
