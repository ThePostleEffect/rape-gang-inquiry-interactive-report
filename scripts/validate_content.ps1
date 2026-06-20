$ErrorActionPreference = "Stop"

$bundledPython = "C:\Users\Daniel\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$python = if (Test-Path -LiteralPath $bundledPython) { $bundledPython } else { "python" }

& $python scripts/extract_report.py public/The-Rape-Gang-Inquiry-Report.pdf src/data/report.json
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $python -m unittest scripts/test_extract_report.py
exit $LASTEXITCODE
