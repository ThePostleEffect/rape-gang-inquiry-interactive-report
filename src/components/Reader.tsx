import { formatPageRange, pdfLink } from "../lib/report";
import type { ReportSection } from "../types";

interface ReaderProps {
  section: ReportSection;
  mode: "summary" | "full";
  compact?: boolean;
  onModeChange: (mode: "summary" | "full") => void;
}

export function Reader({ section, mode, compact = false, onModeChange }: ReaderProps) {
  return (
    <article className={`reader ${compact ? "reader--compact" : ""}`}>
      <div className="mode-toggle" aria-label="Reading mode">
        <button type="button" className={mode === "summary" ? "is-active" : ""} onClick={() => onModeChange("summary")}>Quick summary</button>
        <button type="button" className={mode === "full" ? "is-active" : ""} onClick={() => onModeChange("full")}>Full text</button>
      </div>
      <p className="section-label">{section.role ?? section.category.replace("-", " ")}</p>
      <h2>{section.title}</h2>
      <div className="reader-meta">
        <span>Printed pages {formatPageRange(section)}</span>
        <span>{section.readingMinutes} min full read</span>
      </div>
      {mode === "summary" ? (
        <div className="reader-copy reader-summary" aria-label="Quick summary">
          <h3>Summary</h3>
          <p>{section.summary}</p>
          <h3>Content themes</h3>
          <p>{section.themes.join(" · ")}</p>
        </div>
      ) : (
        <div className="reader-copy reader-full-text" aria-label="Full report text">
          {section.text.split(/\n{2,}/).map((paragraph, index) => <p key={`${section.id}-${index}`}>{paragraph}</p>)}
        </div>
      )}
      <a className="source-link" href={pdfLink(section)} target="_blank" rel="noreferrer">
        Open original PDF at page {section.pdfPageStart}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>
      </a>
    </article>
  );
}
