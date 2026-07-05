import { describe, expect, it } from "vitest";

import { attributionHint, citationContextLabel, stripCitationMarkers } from "@/lib/citations";

describe("citation display", () => {
  it("removes internal citation markers from message text", () => {
    expect(stripCitationMarkers("大一开始做项目[1]，大二继续实习²。"))
      .toBe("大一开始做项目，大二继续实习。");
  });

  it("describes the cited topic without exposing its internal number", () => {
    expect(
      citationContextLabel({
        id: "topic-1",
        sourceType: "topic",
        title: "大学生活",
        excerpt: "",
        citeIndex: 1,
      })
    ).toBe("主题 · 大学生活");
  });

  it("uses the parent entry title for knowledge chunks", () => {
    expect(
      citationContextLabel({
        id: "chunk-2",
        sourceType: "knowledge",
        title: "片段标题",
        parentTitle: "大二项目经历",
        excerpt: "",
      })
    ).toBe("经历 · 大二项目经历");
  });

  it("does not show a general-advice attribution hint", () => {
    expect(attributionHint("general")).toBeNull();
  });
});
