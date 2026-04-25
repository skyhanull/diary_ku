export interface EditorBodyDocument {
  html: string;
  text: string;
}

export const DEFAULT_EDITOR_BODY_TEXT = "오늘의 기록을 시작해보세요.";
export const DEFAULT_EDITOR_BODY_HTML = "<p>오늘의 기록을 시작해보세요.</p>";

function decodeHtmlEntities(value: string) {
  if (typeof document === "undefined") {
    return value.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

// Preserves internal spaces (including Korean word spaces) but filters whitespace-only lines.
function normalizeEditorText(value: string) {
  return value
    .split(/\n+/)
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

export function buildEditorBodyHtml(text: string) {
  const normalizedText = normalizeEditorText(text);
  if (!normalizedText) return '<p></p>';

  return normalizedText
    .split("\n")
    .map((line) => `<p>${line}</p>`)
    .join("");
}

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

export function createEditorBodyFromHtml(bodyHtml: string | null | undefined): EditorBodyDocument {
  const text = extractEditorBodyText(bodyHtml);
  return {
    html: bodyHtml && bodyHtml.trim() ? bodyHtml : '<p></p>',
    text,
  };
}

export function createEditorBodyFromText(text: string): EditorBodyDocument {
  const normalizedText = normalizeEditorText(text);

  return {
    text: normalizedText,
    html: buildEditorBodyHtml(normalizedText),
  };
}
