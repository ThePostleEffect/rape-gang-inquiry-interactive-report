"""Build the static content model for the interactive report."""

from __future__ import annotations

import argparse
import json
import logging
import re
from pathlib import Path
from typing import Any

from pypdf import PdfReader

logging.getLogger("pypdf").setLevel(logging.ERROR)


SPACE_RE = re.compile(r"[ \t]+")
SENTENCE_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9'\"“])")
THEME_TERMS = {
    "Grooming": ("groom",),
    "Sexual violence": ("rape", "sexual abuse", "sexual violence"),
    "Trafficking": ("traffic", "transported"),
    "Police response": ("police", "policing"),
    "Social care": ("social worker", "social services", "social care"),
    "Healthcare": ("nhs", "healthcare", "mental health"),
    "Courts and sentencing": ("court", "sentence", "prosecution"),
    "Institutional failure": ("institution", "failed", "failure"),
    "Political response": ("government", "labour party", "conservative party"),
    "Family": ("mother", "father", "parent", "family"),
    "Culture and religion": ("culture", "islam", "muslim"),
    "Survivor impact": ("trauma", "survivor", "impact"),
    "Reform": ("recommend", "legislation", "response"),
}


def clean_title(value: str) -> str:
    value = value.replace("\ufffd", "'").replace("\u200b", "")
    value = value.replace("–", "-").replace("—", "-")
    value = value.replace("‘", "'").replace("’", "'")
    value = value.replace("“", '"').replace("”", '"')
    return SPACE_RE.sub(" ", value).strip(" .")


def normalize_page_text(raw: str, printed_page: int | None) -> str:
    """Repair layout extraction line wraps while retaining paragraph boundaries."""
    blocks: list[str] = []
    current: list[str] = []

    def flush() -> None:
        if not current:
            return
        joined = ""
        for line in current:
            if joined.endswith("-"):
                joined += line
            else:
                joined += (" " if joined else "") + line
        joined = SPACE_RE.sub(" ", joined).strip()
        if joined and not (printed_page is not None and joined == str(printed_page)):
            blocks.append(joined)
        current.clear()

    for source_line in raw.replace("\ufffd", "'").replace("\u200b", "").splitlines():
        line = SPACE_RE.sub(" ", source_line).strip()
        if not line:
            flush()
        else:
            current.append(line)
    flush()
    return "\n\n".join(blocks).strip()


def flatten_outline(reader: PdfReader) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []

    def visit(items: list[Any], depth: int, parents: list[str]) -> None:
        last_title: str | None = None
        for item in items:
            if isinstance(item, list):
                visit(item, depth + 1, parents + ([last_title] if last_title else []))
                continue
            title = clean_title(getattr(item, "title", item.get("/Title", "")))
            last_title = title
            if not title:
                continue
            try:
                page_index = reader.get_destination_page_number(item)
            except Exception:
                continue
            records.append(
                {
                    "title": title,
                    "depth": depth,
                    "parents": parents,
                    "pdfPageStart": page_index + 1,
                }
            )

    visit(reader.outline, 0, [])
    return records


def slugify(title: str, index: int) -> str:
    stem = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "section"
    return f"{stem}-{index + 1}"


def section_category(title: str, parents: list[str]) -> str:
    context = " ".join([*parents, title]).lower()
    if any(term in context for term in ("victim testimony", "whistleblower testimony", "non-hearing victim testimony", "survivor quotations")):
        return "testimony"
    if "institutional failures" in context:
        return "failures"
    if "list of areas" in context:
        return "locations"
    if any(term in context for term in ("recommendations", "legislative response", "all frontline response", "next steps")):
        return "recommendations"
    if any(term in context for term in ("contents", "acknowledgements", "foreword", "introduction")):
        return "front-matter"
    return "report"


def section_role(title: str, parents: list[str], category: str, text: str = "") -> str | None:
    if category != "testimony":
        return None
    context = " ".join([*parents, title]).lower()
    if "parent" in context or "mother" in context or "father" in context:
        return "Family"
    introduction = SPACE_RE.sub(" ", text[:600]).lower()
    if re.search(r"\b(?:is|as) the (?:mother|father|parent)\b", introduction):
        return "Family"
    if "whistleblower" in context or "social worker" in context or "campaigner" in context or "activist" in context:
        return "Whistleblower"
    if "physician" in context or "professional" in context:
        return "Professional"
    return "Survivor"


def extract_summary(text: str, title: str, limit: int = 72) -> str:
    body = text.strip()
    if body.lower().startswith(title.lower()):
        body = body[len(title) :].lstrip(" \n:-")
    body = re.sub(r"\n+", " ", body)
    body = SPACE_RE.sub(" ", body).strip()
    if not body:
        return title
    sentences = [sentence.strip() for sentence in SENTENCE_RE.split(body) if len(sentence.split()) >= 5]
    selected: list[str] = []
    words = 0
    for sentence in sentences:
        count = len(sentence.split())
        if selected and words + count > limit:
            break
        selected.append(sentence)
        words += count
        if len(selected) == 2:
            break
    if selected:
        return " ".join(selected)
    fallback = " ".join(body.split()[:limit])
    return fallback + ("..." if len(body.split()) > limit else "")


def identify_themes(title: str, summary: str) -> list[str]:
    haystack = f"{title} {summary}".lower()
    themes = [label for label, terms in THEME_TERMS.items() if any(term in haystack for term in terms)]
    return themes[:4] or ["Inquiry evidence"]


def find_heading(text: str, title: str, start: int = 0) -> re.Match[str] | None:
    words = re.findall(r"[A-Za-z0-9]+", title)
    if not words:
        return None
    pattern = r"\b" + r"[\W_]*".join(re.escape(word) for word in words) + r"\b"
    return re.search(pattern, text[start:], flags=re.IGNORECASE)


def slice_to_bookmark(text: str, title: str, next_title: str | None, same_page_end: bool) -> str:
    start_match = find_heading(text, title)
    if start_match:
        text = text[start_match.start() :]
    if same_page_end and next_title:
        end_match = find_heading(text, next_title, 1)
        if end_match:
            text = text[: 1 + end_match.start()]
    return text.strip()


def build_report(pdf_path: Path) -> dict[str, Any]:
    reader = PdfReader(str(pdf_path))
    pages: list[dict[str, Any]] = []
    for index, page in enumerate(reader.pages):
        pdf_page = index + 1
        printed_page = pdf_page - 1 if pdf_page > 1 else None
        raw = page.extract_text(extraction_mode="layout") or ""
        pages.append(
            {
                "pdfPage": pdf_page,
                "printedPage": printed_page,
                "text": normalize_page_text(raw, printed_page),
            }
        )

    outline = flatten_outline(reader)
    sections: list[dict[str, Any]] = []
    for index, record in enumerate(outline):
        start = record["pdfPageStart"]
        next_start = outline[index + 1]["pdfPageStart"] if index + 1 < len(outline) else len(pages) + 1
        end = max(start, next_start - 1)
        end = min(end, len(pages))
        text = "\n\n".join(page["text"] for page in pages[start - 1 : end] if page["text"]).strip()
        next_title = outline[index + 1]["title"] if index + 1 < len(outline) else None
        text = slice_to_bookmark(text, record["title"], next_title, next_start == start)
        if not text:
            text = record["title"]
        category = section_category(record["title"], record["parents"])
        summary = extract_summary(text, record["title"])
        role = section_role(record["title"], record["parents"], category, summary)
        word_count = len(text.split())
        sections.append(
            {
                "id": slugify(record["title"], index),
                "title": record["title"],
                "depth": record["depth"],
                "parents": record["parents"],
                "category": category,
                "role": role,
                "pdfPageStart": start,
                "pdfPageEnd": end,
                "printedPageStart": max(1, start - 1),
                "printedPageEnd": max(1, end - 1),
                "readingMinutes": max(1, round(word_count / 210)),
                "themes": identify_themes(record["title"], summary),
                "summary": summary,
                "text": text,
            }
        )

    return {
        "metadata": {
            "title": "The Rape Gang Inquiry Report",
            "pdfPageCount": len(pages),
            "printedPageCount": len(pages) - 1,
            "sectionCount": len(sections),
            "characterCount": sum(len(page["text"]) for page in pages),
            "sourceFile": "The-Rape-Gang-Inquiry-Report.pdf",
        },
        "pages": pages,
        "sections": sections,
    }


def validate_report(report: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    pages = report.get("pages", [])
    sections = report.get("sections", [])
    metadata = report.get("metadata", {})
    if metadata.get("pdfPageCount") != 219 or len(pages) != 219:
        errors.append("Expected all 219 PDF pages")
    if [page.get("pdfPage") for page in pages] != list(range(1, 220)):
        errors.append("PDF page mapping is not contiguous")
    if sum(len(page.get("text", "")) for page in pages) < 350_000:
        errors.append("Extracted source text is unexpectedly short")
    if len(sections) < 80:
        errors.append("Outline extraction is unexpectedly sparse")
    for section in sections:
        if not section.get("text") or not section.get("summary"):
            errors.append(f"Empty section content: {section.get('title', 'unknown')}")
        if not 1 <= section.get("pdfPageStart", 0) <= section.get("pdfPageEnd", 0) <= 219:
            errors.append(f"Invalid page range: {section.get('title', 'unknown')}")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    report = build_report(args.pdf)
    errors = validate_report(report)
    if errors:
        raise SystemExit("\n".join(errors))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(
        f"Wrote {len(report['pages'])} pages, {len(report['sections'])} sections, "
        f"and {report['metadata']['characterCount']:,} source characters to {args.output}"
    )


if __name__ == "__main__":
    main()
