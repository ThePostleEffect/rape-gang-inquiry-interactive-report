import type { ReactNode } from "react";

export type RouteName = "overview" | "testimony" | "failures" | "recommendations" | "locations" | "full-report" | "search";

interface AppShellProps {
  route: RouteName;
  query: string;
  textScale: number;
  onNavigate: (route: RouteName) => void;
  onQueryChange: (query: string) => void;
  onTextScaleChange: (scale: number) => void;
  children: ReactNode;
}

const navigation: Array<{ route: RouteName; label: string }> = [
  { route: "overview", label: "Overview" },
  { route: "testimony", label: "Testimony" },
  { route: "failures", label: "Failures" },
  { route: "recommendations", label: "Recommendations" },
  { route: "locations", label: "Locations" },
  { route: "full-report", label: "Full report" }
];

export function AppShell({
  route,
  query,
  textScale,
  onNavigate,
  onQueryChange,
  onTextScaleChange,
  children
}: AppShellProps) {
  return (
    <div className="app-shell" style={{ "--reading-scale": textScale } as React.CSSProperties}>
      <header className="site-header">
        <button className="site-title" type="button" onClick={() => onNavigate("overview")}>
          The Rape Gang Inquiry Report
        </button>
        <nav aria-label="Primary navigation">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.route}
              className={route === item.route ? "is-active" : ""}
              aria-current={route === item.route ? "page" : undefined}
              onClick={() => onNavigate(item.route)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <div className="utility-bar">
        <label className="search-field">
          <span className="sr-only">Search the complete report</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
          <input
            type="search"
            aria-label="Search the complete report"
            placeholder="Search the complete report"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <div className="text-controls" aria-label="Reading text size">
          <span>Text size</span>
          <button type="button" aria-label="Decrease text size" onClick={() => onTextScaleChange(Math.max(0.9, textScale - 0.1))}>A-</button>
          <button type="button" aria-label="Increase text size" onClick={() => onTextScaleChange(Math.min(1.3, textScale + 0.1))}>A+</button>
        </div>
      </div>
      <main className="app-main">{children}</main>
    </div>
  );
}
