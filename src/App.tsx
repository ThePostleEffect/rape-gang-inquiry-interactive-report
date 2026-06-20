import { useMemo, useState } from "react";

import reportJson from "./data/report.json";
import { filterSections, searchSections } from "./lib/report";
import type { ReportData, ReportSection, TestimonyRole } from "./types";
import { AppShell, type RouteName } from "./components/AppShell";
import { Cover } from "./components/Cover";
import { Directory } from "./components/Directory";
import { Overview } from "./components/Overview";

const report = reportJson as ReportData;
const validRoutes = new Set<RouteName>(["overview", "testimony", "failures", "recommendations", "locations", "full-report", "search"]);

function initialLocation(): { route: RouteName; sectionId?: string } {
  const [routePart, sectionId] = window.location.hash.replace(/^#/, "").split("/");
  return { route: validRoutes.has(routePart as RouteName) ? routePart as RouteName : "overview", sectionId };
}

const routeCopy: Record<Exclude<RouteName, "overview" | "search">, { title: string; description: string }> = {
  testimony: { title: "Testimony", description: "Browse hearing and written testimony by role, with summaries and complete source text." },
  failures: { title: "Institutional failures", description: "Explore the institutional failures catalogued in Appendix III." },
  recommendations: { title: "Recommendations", description: "Review the Inquiry's proposed criminal justice, legislative, and frontline responses." },
  locations: { title: "Locations", description: "Read the report's list of areas where gangs are stated to have operated." },
  "full-report": { title: "Full report", description: "Browse the complete report in source order, including appendices and footnotes." }
};

function routeSections(route: RouteName): ReportSection[] {
  if (route === "testimony") return report.sections.filter((section) => section.category === "testimony" && section.depth > 0);
  if (route === "failures") return report.sections.filter((section) => section.category === "failures" && section.depth > 0);
  if (route === "recommendations") return filterSections(report.sections, "recommendations");
  if (route === "locations") return filterSections(report.sections, "locations");
  if (route === "full-report") return report.sections;
  return [];
}

export function App() {
  const initial = useMemo(initialLocation, []);
  const [entered, setEntered] = useState(false);
  const [route, setRoute] = useState<RouteName>(initial.route);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<TestimonyRole | "All">("All");
  const [selectedId, setSelectedId] = useState<string | undefined>(initial.sectionId);
  const [mode, setMode] = useState<"summary" | "full">("summary");
  const [textScale, setTextScale] = useState(1);

  const sections = useMemo(() => {
    const candidates = route === "search" ? searchSections(report.sections, query) : routeSections(route);
    return route === "testimony" && role !== "All" ? candidates.filter((section) => section.role === role) : candidates;
  }, [query, role, route]);
  const selected = selectedId
    ? report.sections.find((section) => section.id === selectedId)
    : route === "search" ? undefined : sections[0];

  const navigate = (nextRoute: RouteName) => {
    setRoute(nextRoute);
    setQuery("");
    setRole("All");
    setSelectedId(undefined);
    setMode("summary");
    window.location.hash = nextRoute;
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setRoute(value.trim() ? "search" : "overview");
    setSelectedId(undefined);
    setMode("summary");
  };

  const selectSection = (section: ReportSection) => {
    setSelectedId(section.id);
    setMode("summary");
    window.location.hash = `${route}/${section.id}`;
  };

  if (!entered) return <Cover onEnter={() => { setEntered(true); if (!window.location.hash) window.location.hash = route; }} />;

  return (
    <AppShell
      route={route}
      query={query}
      textScale={textScale}
      onNavigate={navigate}
      onQueryChange={updateQuery}
      onTextScaleChange={setTextScale}
    >
      {route === "overview" ? <Overview report={report} onNavigate={navigate} /> : null}
      {route === "search" ? (
        <Directory
          title="Search results"
          description={query ? `Sections containing every term in “${query}”.` : "Search the complete report."}
          sections={sections}
          selected={selected}
          mode={mode}
          onSelect={selectSection}
          onModeChange={setMode}
        />
      ) : null}
      {route !== "overview" && route !== "search" ? (
        <Directory
          title={routeCopy[route].title}
          description={routeCopy[route].description}
          sections={sections}
          selected={selected}
          mode={mode}
          role={role}
          showRoleFilters={route === "testimony"}
          onRoleChange={(nextRole) => { setRole(nextRole); setSelectedId(undefined); }}
          onSelect={selectSection}
          onModeChange={setMode}
        />
      ) : null}
    </AppShell>
  );
}
