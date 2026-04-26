// 에디터 본문 변환: 텍스트↔HTML 변환과 줄바꿈·공백 정규화를 담당한다
// html과 text 두 형태를 함께 보관하는 본문 문서 타입
export interface EditorBodyDocument {
  html: string;
  text: string;
}

// 에디터 초기 본문 플레이스홀더 텍스트
export const DEFAULT_EDITOR_BODY_TEXT = "오늘의 기록을 시작해보세요.";
// 에디터 초기 본문 플레이스홀더 HTML
export const DEFAULT_EDITOR_BODY_HTML = "<p>오늘의 기록을 시작해보세요.</p>";

// HTML 엔티티(&nbsp; 등)를 실제 문자로 디코딩한다
function decodeHtmlEntities(value: string) {
  if (typeof document === "undefined") {
    return value.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

// Preserves internal spaces (including Korean word spaces) but filters whitespace-only lines.
// 공백만 있는 줄을 제거하고 줄바꿈을 정규화한다
function normalizeEditorText(value: string) {
  return value
    .split(/\n+/)
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

// 텍스트 문자열을 각 줄을 <p> 태그로 감싼 HTML로 변환한다
export function buildEditorBodyHtml(text: string) {
  const normalizedText = normalizeEditorText(text);
  if (!normalizedText) return '<p></p>';

  return normalizedText
    .split("\n")
    .map((line) => `<p>${line}</p>`)
    .join("");
}

// HTML 본문에서 순수 텍스트만 추출한다 (DOMParser 없으면 정규식으로 폴백)
export function extractEditorBodyText(bodyHtml: string | null | undefined) {
  if (!bodyHtml) return '';

  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(bodyHtml, "text/html");
    const blockNodes = Array.from(doc.body.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, blockquote, pre"));
    const lines = (blockNodes.length > 0 ? blockNodes : [doc.body])
      .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter(Boolean);

    return lines.join("\n");
  }

  // Fallback: regex-based extraction — trim each line since regex may add leading spaces
  const fallbackText = decodeHtmlEntities(
    bodyHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|h1|h2|h3|h4|h5|h6|blockquote|pre)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  );

  return fallbackText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

// HTML 문자열로부터 html+text 쌍의 본문 문서 객체를 생성한다
export function createEditorBodyFromHtml(bodyHtml: string | null | undefined): EditorBodyDocument {
  const text = extractEditorBodyText(bodyHtml);
  return {
    html: bodyHtml && bodyHtml.trim() ? bodyHtml : '<p></p>',
    text,
  };
}

// 순수 텍스트 문자열로부터 html+text 쌍의 본문 문서 객체를 생성한다
export function createEditorBodyFromText(text: string): EditorBodyDocument {
  const normalizedText = normalizeEditorText(text);

  return {
    text: normalizedText,
    html: buildEditorBodyHtml(normalizedText),
  };
}
