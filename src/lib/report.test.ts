import { describe, expect, it } from "vitest";

import { filterSections, formatPageRange, getSection, searchSections } from "./report";
import type { ReportSection } from "../types";

const sections: ReportSection[] = [
  {
    id: "chloe-1",
    title: "'Chloe'",
    depth: 1,
    parents: ["Victim Testimony"],
    category: "testimony",
    role: "Survivor",
    pdfPageStart: 19,
    pdfPageEnd: 22,
    printedPageStart: 18,
    printedPageEnd: 21,
    readingMinutes: 8,
    themes: ["Police response"],
    summary: "Chloe describes reporting abuse and the response she received.",
    text: "Complete testimony text about police response."
  },
  {
    id: "recommendations-2",
    title: "Recommendations",
    depth: 0,
    parents: [],
    category: "recommendations",
    role: null,
    pdfPageStart: 160,
    pdfPageEnd: 164,
    printedPageStart: 159,
    printedPageEnd: 163,
    readingMinutes: 10,
    themes: ["Reform"],
    summary: "The report recommends changes to the criminal justice response.",
    text: "Full recommendations concerning sentencing and prosecution."
  }
];

describe("report selectors", () => {
  it("finds a section by id", () => {
    expect(getSection(sections, "chloe-1")?.title).toBe("'Chloe'");
  });

  it("filters testimony by role", () => {
    expect(filterSections(sections, "testimony", "Survivor")).toHaveLength(1);
    expect(filterSections(sections, "testimony", "Whistleblower")).toHaveLength(0);
  });

  it("searches summaries, full text, and themes", () => {
    expect(searchSections(sections, "sentencing")[0].id).toBe("recommendations-2");
    expect(searchSections(sections, "police response")[0].id).toBe("chloe-1");
  });

  it("formats printed page ranges", () => {
    expect(formatPageRange(sections[0])).toBe("18-21");
    expect(formatPageRange({ ...sections[0], printedPageEnd: 18 })).toBe("18");
  });
});
