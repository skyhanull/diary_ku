import { describe, expect, it } from "vitest";

import { buildEditorBodyHtml, createEditorBodyFromHtml, createEditorBodyFromText, extractEditorBodyText } from "./editor-body";

describe("editor body document", () => {
  it("builds html from text lines (preserves internal spaces)", () => {
    expect(buildEditorBodyHtml("첫줄\n둘째 줄")).toBe("<p>첫줄</p><p>둘째 줄</p>");
  });

  it("returns empty paragraph when text is blank", () => {
    expect(buildEditorBodyHtml("   \n \n")).toBe("<p></p>");
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

  it("returns empty document from null html", () => {
    expect(createEditorBodyFromHtml(null)).toEqual({
      html: "<p></p>",
      text: "",
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

  it("preserves spaces within lines (important for Korean IME word spacing)", () => {
    expect(createEditorBodyFromText("안녕 세계\n둘째 줄")).toEqual({
      html: "<p>안녕 세계</p><p>둘째 줄</p>",
      text: "안녕 세계\n둘째 줄",
    });
  });

  it("returns empty document from empty text", () => {
    expect(createEditorBodyFromText("")).toEqual({
      html: "<p></p>",
      text: "",
    });
  });
});
