interface CoverProps {
  onEnter: () => void;
}

export function Cover({ onEnter }: CoverProps) {
  return (
    <main className="cover">
      <section className="cover__title-panel" aria-labelledby="report-title">
        <div className="cover__title-content">
          <h1 id="report-title">The Rape Gang Inquiry Report</h1>
          <span className="cover__accent" aria-hidden="true" />
          <p>An interactive edition designed to make the complete report easier to navigate, search, and read.</p>
        </div>
        <div className="cover__index-lines" aria-hidden="true">
          {Array.from({ length: 22 }, (_, index) => <span key={index} />)}
        </div>
      </section>
      <section className="cover__warning" aria-labelledby="warning-title">
        <div>
          <h2 id="warning-title">Before you continue</h2>
          <p>
            This report contains graphic testimony and descriptions of rape, sexual violence, abuse, trafficking,
            and institutional failure. Please proceed with care if this material may be triggering.
          </p>
          <button type="button" onClick={onEnter}>Enter the report</button>
        </div>
      </section>
    </main>
  );
}
