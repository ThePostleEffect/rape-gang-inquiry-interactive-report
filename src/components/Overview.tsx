import type { ReportData } from "../types";
import type { RouteName } from "./AppShell";

interface OverviewProps {
  report: ReportData;
  onNavigate: (route: RouteName) => void;
}

const paths: Array<{ route: RouteName; number: string; title: string; description: string }> = [
  { route: "testimony", number: "01", title: "Testimony", description: "Firsthand accounts from survivors, families, professionals, and whistleblowers." },
  { route: "failures", number: "02", title: "Institutional failures", description: "A structured index of the agencies, decisions, and systems examined in the report." },
  { route: "recommendations", number: "03", title: "Recommendations", description: "Criminal justice, legislative, frontline, healthcare, and civil responses proposed by the Inquiry." },
  { route: "locations", number: "04", title: "Locations", description: "The report's list of areas where gangs are stated to have operated." },
  { route: "full-report", number: "05", title: "Full report", description: "Browse the complete report in its original order, section by section." }
];

export function Overview({ report, onNavigate }: OverviewProps) {
  const testimonyCount = report.sections.filter((section) => section.category === "testimony" && section.depth > 0).length;
  return (
    <section className="overview-page">
      <div className="overview-intro">
        <p className="section-label">Interactive edition</p>
        <h1>Read the report your way</h1>
        <p>
          Begin with a concise summary or move directly into the complete source text. Every section remains tied to
          its printed pages and the original PDF.
        </p>
      </div>
      <dl className="report-facts" aria-label="Report coverage">
        <div><dt>PDF pages</dt><dd>{report.metadata.pdfPageCount}</dd></div>
        <div><dt>Navigable sections</dt><dd>{report.metadata.sectionCount}</dd></div>
        <div><dt>Testimony entries</dt><dd>{testimonyCount}</dd></div>
        <div><dt>Source coverage</dt><dd>Complete</dd></div>
      </dl>
      <div className="path-list">
        {paths.map((path) => (
          <button type="button" key={path.route} onClick={() => onNavigate(path.route)}>
            <span className="path-number">{path.number}</span>
            <span><strong>{path.title}</strong><small>{path.description}</small></span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>
          </button>
        ))}
      </div>
    </section>
  );
}
