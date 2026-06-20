import type { ReportSection, TestimonyRole } from "../types";

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[“”‘’]/g, "'");

export function getSection(sections: ReportSection[], id: string): ReportSection | undefined {
  return sections.find((section) => section.id === id);
}

export function filterSections(
  sections: ReportSection[],
  category?: ReportSection["category"] | "all",
  role?: TestimonyRole | "All"
): ReportSection[] {
  return sections.filter((section) => {
    const matchesCategory = !category || category === "all" || section.category === category;
    const matchesRole = !role || role === "All" || section.role === role;
    return matchesCategory && matchesRole;
  });
}

export function searchSections(sections: ReportSection[], query: string): ReportSection[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return sections;
  return sections
    .map((section, index) => {
      const title = normalize(section.title);
      const summary = normalize(section.summary);
      const haystack = normalize(
        [section.title, section.summary, section.text, section.role ?? "", ...section.parents, ...section.themes].join(" ")
      );
      const matches = terms.every((term) => haystack.includes(term));
      const score = matches
        ? terms.reduce((total, term) => total + (title.includes(term) ? 8 : 0) + (summary.includes(term) ? 3 : 1), 0)
        : 0;
      return { section, score, index };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.section);
}

export function formatPageRange(section: Pick<ReportSection, "printedPageStart" | "printedPageEnd">): string {
  return section.printedPageStart === section.printedPageEnd
    ? String(section.printedPageStart)
    : `${section.printedPageStart}-${section.printedPageEnd}`;
}

export function pdfLink(section: Pick<ReportSection, "pdfPageStart">): string {
  return `./The-Rape-Gang-Inquiry-Report.pdf#page=${section.pdfPageStart}`;
}
