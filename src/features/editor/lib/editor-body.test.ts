import { describe, expect, it } from "vitest";

import { buildEditorBodyHtml, createEditorBodyFromHtml, createEditorBodyFromText, DEFAULT_EDITOR_BODY_HTML, DEFAULT_EDITOR_BODY_TEXT, extractEditorBodyText } from "./editor-body";

describe("editor body document", () => {
  it("builds html from normalized text lines", () => {
    expect(buildEditorBodyHtml("  첫줄  \n\n둘째 줄 ")).toBe("<p>첫줄</p><p>둘째 줄</p>");
  });

  it("falls back to the default html when text is blank", () => {
    expect(buildEditorBodyHtml("   \n \n")).toBe(DEFAULT_EDITOR_BODY_HTML);
  });

  it("extracts text from html blocks", () => {
    expect(extractEditorBodyText("<p>하나</p><ul><li>둘</li></ul>")).toBe("하나\n둘");
  });

  it("extracts text from headings and blockquotes", () => {
    expect(extractEditorBodyText("<h1>제목</h1><blockquote>인용</blockquote>")).toBe("제목\n인용");
  });

  it("normalizes html entities and line breaks when extracting text", () => {
    expect(extractEditorBodyText("<p>Tom &amp; Jerry</p><p>둘째&nbsp;줄<br/>셋째 줄</p>")).toBe("Tom & Jerry\n둘째 줄\n셋째 줄");
  });

  it("creates a consistent document from html", () => {
    expect(createEditorBodyFromHtml(null)).toEqual({
      html: DEFAULT_EDITOR_BODY_HTML,
      text: DEFAULT_EDITOR_BODY_TEXT,
    });
  });

  it("keeps incoming html when it is already populated", () => {
    expect(createEditorBodyFromHtml("<p>이미 있는 본문</p>")).toEqual({
      html: "<p>이미 있는 본문</p>",
      text: "이미 있는 본문",
    });
  });

  it("creates a consistent document from text", () => {
    expect(createEditorBodyFromText("메모")).toEqual({
      html: "<p>메모</p>",
      text: "메모",
    });
  });

  it("normalizes multiline text into a consistent document", () => {
    expect(createEditorBodyFromText(" 첫 줄 \n\n 둘째 줄 ")).toEqual({
      html: "<p>첫 줄</p><p>둘째 줄</p>",
      text: "첫 줄\n둘째 줄",
    });
  });
});
