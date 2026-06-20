# The Rape Gang Inquiry Report - Interactive Edition

This static React application turns the supplied 219-page report into a searchable, navigable reading experience. It includes:

- The complete extracted report text, appendices, and footnotes
- 127 linked report sections with concise source-grounded summaries
- Survivor, family, professional, and whistleblower testimony filters
- Institutional-failure, recommendation, location, and full-report indexes
- Full-text search and shareable section links
- Direct links to the corresponding pages in the bundled original PDF
- Responsive layouts and adjustable reading text

## Run locally

From this folder:

```powershell
pnpm install
pnpm dev
```

Open the local address printed in the terminal, normally `http://127.0.0.1:5173/`.

## Production build

```powershell
pnpm build
```

The deployable static site is written to `dist/`. Serve that folder with any static host or local web server.

## Rebuild the report data

```powershell
pnpm validate:content
```

This regenerates `src/data/report.json` and verifies all 219 PDF pages, section boundaries, summaries, page mappings, and expected testimony structure.

The included command uses the Codex workspace Python runtime on this machine. For another computer, install `scripts/requirements.txt` and run `scripts/extract_report.py` with that Python environment.
