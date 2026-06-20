export type ReportCategory = "front-matter" | "report" | "testimony" | "failures" | "recommendations" | "locations";
export type TestimonyRole = "Survivor" | "Family" | "Whistleblower" | "Professional";

export interface ReportSection {
  id: string;
  title: string;
  depth: number;
  parents: string[];
  category: ReportCategory;
  role: TestimonyRole | null;
  pdfPageStart: number;
  pdfPageEnd: number;
  printedPageStart: number;
  printedPageEnd: number;
  readingMinutes: number;
  themes: string[];
  summary: string;
  text: string;
}

export interface ReportPage {
  pdfPage: number;
  printedPage: number | null;
  text: string;
}

export interface ReportData {
  metadata: {
    title: string;
    pdfPageCount: number;
    printedPageCount: number;
    sectionCount: number;
    characterCount: number;
    sourceFile: string;
  };
  pages: ReportPage[];
  sections: ReportSection[];
}
