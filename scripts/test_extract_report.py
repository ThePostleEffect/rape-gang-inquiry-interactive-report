import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from extract_report import build_report, normalize_page_text, validate_report


PDF = Path(__file__).parents[1] / "public" / "The-Rape-Gang-Inquiry-Report.pdf"


class ExtractionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report = build_report(PDF)

    def test_normalize_page_text_preserves_paragraphs(self):
        raw = "  Heading  \n\nFirst line of a paragraph\ncontinues here.\n\n  12  "
        self.assertEqual(
            normalize_page_text(raw, 12),
            "Heading\n\nFirst line of a paragraph continues here.",
        )

    def test_build_report_maps_complete_source(self):
        report = self.report
        self.assertEqual(report["metadata"]["pdfPageCount"], 219)
        self.assertEqual(len(report["pages"]), 219)
        self.assertGreater(report["metadata"]["characterCount"], 350_000)
        self.assertEqual(report["pages"][1]["printedPage"], 1)
        self.assertTrue(report["pages"][5]["text"].startswith("Introduction"))

    def test_build_report_contains_expected_navigation(self):
        report = self.report
        titles = {section["title"] for section in report["sections"]}
        expected = {
            "Executive Summary",
            "Victim Testimony",
            "Whistleblower Testimony",
            "Homegrown Enabling Factors",
            "Recommendations",
            "Appendix III - Institutional Failures",
        }
        self.assertTrue(expected.issubset(titles))
        testimony = [section for section in report["sections"] if section["category"] == "testimony"]
        whistleblowers = [section for section in testimony if section["role"] == "Whistleblower"]
        self.assertGreaterEqual(len(testimony), 30)
        self.assertGreaterEqual(len(whistleblowers), 4)

    def test_every_section_has_summary_text_and_source_pages(self):
        report = self.report
        for section in report["sections"]:
            with self.subTest(section=section["title"]):
                self.assertTrue(section["summary"])
                self.assertTrue(section["text"])
                self.assertGreaterEqual(section["pdfPageStart"], 1)
                self.assertGreaterEqual(section["pdfPageEnd"], section["pdfPageStart"])

    def test_same_page_bookmarks_are_split_at_their_headings(self):
        by_title = {section["title"]: section for section in self.report["sections"]}
        caven = by_title["Caven Vines (Rotherham campaigner)"]
        robinson = by_title["Tommy Robinson (National Activist)"]
        self.assertTrue(caven["text"].startswith("Caven Vines"))
        self.assertNotIn("Tommy Robinson", caven["text"])
        self.assertTrue(robinson["text"].startswith("Tommy Robinson"))
        self.assertTrue(by_title["'Chloe'"]["text"].lstrip("'‘").startswith("Chloe"))

    def test_parent_testimony_is_labeled_as_family(self):
        by_title = {section["title"]: section for section in self.report["sections"]}
        for title in ("'Sally'", "Marlon", "Victoria", "Rachel"):
            with self.subTest(title=title):
                self.assertEqual(by_title[title]["role"], "Family")

    def test_validation_accepts_generated_report(self):
        report = self.report
        self.assertEqual(validate_report(report), [])
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "report.json"
            path.write_text(json.dumps(report), encoding="utf-8")
            self.assertGreater(path.stat().st_size, 400_000)


if __name__ == "__main__":
    unittest.main()
