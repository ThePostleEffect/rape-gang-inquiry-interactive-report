import { formatPageRange } from "../lib/report";
import type { ReportSection, TestimonyRole } from "../types";
import { Reader } from "./Reader";

interface DirectoryProps {
  title: string;
  description: string;
  sections: ReportSection[];
  selected: ReportSection | undefined;
  mode: "summary" | "full";
  role?: TestimonyRole | "All";
  showRoleFilters?: boolean;
  showPreview?: boolean;
  onRoleChange?: (role: TestimonyRole | "All") => void;
  onSelect: (section: ReportSection) => void;
  onModeChange: (mode: "summary" | "full") => void;
}

const roles: Array<{ value: TestimonyRole | "All"; label: string }> = [
  { value: "All", label: "All testimony" },
  { value: "Survivor", label: "Survivors" },
  { value: "Family", label: "Family" },
  { value: "Whistleblower", label: "Whistleblowers" },
  { value: "Professional", label: "Professionals" }
];

export function Directory({
  title,
  description,
  sections,
  selected,
  mode,
  role = "All",
  showRoleFilters = false,
  showPreview = true,
  onRoleChange,
  onSelect,
  onModeChange
}: DirectoryProps) {
  return (
    <section className={`directory-layout ${showPreview ? "" : "directory-layout--single"}`}>
      <div className="directory-panel">
        <header className="directory-heading">
          <p className="section-label">Explore the report</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        {showRoleFilters ? (
          <div className="filter-row" aria-label="Testimony filters">
            {roles.map((item) => (
              <button
                type="button"
                key={item.value}
                className={role === item.value ? "is-active" : ""}
                onClick={() => onRoleChange?.(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="directory-count">{sections.length} {sections.length === 1 ? "section" : "sections"}</div>
        <div className="directory-list" aria-label={`${title} directory`}>
          {sections.map((section) => (
            <button
              type="button"
              key={section.id}
              className={selected?.id === section.id ? "is-selected" : ""}
              onClick={() => onSelect(section)}
              aria-label={`${section.title}, ${section.role ?? "report section"}, pages ${formatPageRange(section)}`}
            >
              <span className="directory-title">{section.title}</span>
              <span className="directory-role">{section.role ?? section.parents.at(-1) ?? "Report"}</span>
              <span className="directory-summary">{section.summary}</span>
              <span className="directory-pages">pp. {formatPageRange(section)}</span>
              <span className="directory-time">{section.readingMinutes} min</span>
            </button>
          ))}
          {!sections.length ? <p className="empty-state">No sections match this selection.</p> : null}
        </div>
      </div>
      {showPreview ? (
        <aside className="preview-panel" aria-label="Selected section preview">
          {selected ? <Reader section={selected} mode={mode} compact onModeChange={onModeChange} /> : <p>Select a section to begin.</p>}
        </aside>
      ) : null}
    </section>
  );
}
