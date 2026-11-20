"""
Builds a PDF from a Markdown file in docs/.

    python3 docs/render.py                  # submission.md -> submission.pdf
    python3 docs/render.py reflection.md    # reflection.md -> reflection.pdf

Converts the Markdown to HTML (headings, paragraphs, lists, tables, images,
code blocks, quotes) and prints it to PDF with a headless Chromium-based
browser (Brave or Chrome). Images are referenced relative to docs/.
"""
import html
import re
import subprocess
import sys
from pathlib import Path

docs = Path(__file__).parent
root = docs.parent
source = docs / (sys.argv[1] if len(sys.argv) > 1 else "submission.md")
md = html.unescape(source.read_text().replace("&nbsp;", ""))


# --- "//" placeholder lines -> the real table or chart (only in the PDF; submission.md is not changed)
def overview_table():
    import csv
    rows = [r for r in csv.DictReader(open(root / "1_generation/graphs/overview.csv")) if r["file"].startswith("kg_")]
    lines = ["| Topics V | Edges E | Avg. prerequisites | Max. prerequisites | Biggest hub | Longest path | Matrix fill |",
             "|---:|---:|---:|---:|---:|---:|---:|"]
    for r in rows:
        lines.append(f"| {int(r['topics']):,} | {int(r['edges']):,} | {r['avgPrereqs']} | {r['maxPrereqs']} | {r['biggestHub']} "
                     f"| {r['longestPath']} | {float(r['matrixFill']) * 100:.2g} % |")
    return "\n".join(lines)


LISTS_TABLE = """| | Inner: array | Inner: Set |
|---|---|---|
| **Outer: Map** | Map of arrays `Map<id, id[]>` | Map of sets `Map<id, Set<id>>` |
| **Outer: array** | Array of arrays `id[][]` | Array of sets `Set<id>[]` |"""

charts = [p for d in ("1_generation", "2_data_structures/results", "3_algorithms/results") for p in (root / d).glob("*.png")]


def fill(line):
    text = line.strip()
    if not text.startswith("//"):
        return line
    if "overview.csv" in text:
        return overview_table()
    if "outter and inner" in text or "outer and inner" in text:
        return LISTS_TABLE
    if m := re.search(r"([a-z_]+?_p\d)", text):  # e.g. memory_loglog_p5, memory_list_p5
        name = m.group(1)
        base, p = name.rsplit("_", 1)
        match = next((c for c in charts if c.stem == name), None) or \
            next((c for c in charts if c.stem.startswith(base) and c.stem.endswith("_" + p)), None)
        if match:
            return f"\n![{match.stem}](../{match.relative_to(root).as_posix()})\n"
    print(f"note: placeholder left as text: {text}")
    return line


md = "\n".join(fill(line) for line in md.split("\n"))


def inline(text):
    parts = re.split(r"(`[^`]+`)", text)  # keep code spans untouched
    out = []
    for part in parts:
        if part.startswith("`") and part.endswith("`") and len(part) > 1:
            out.append(f"<code>{html.escape(part[1:-1])}</code>")
            continue
        part = html.escape(part, quote=False)
        part = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", part)
        part = re.sub(r"(?<![\w*])\*([^*\s][^*]*)\*(?![\w*])", r"<em>\1</em>", part)
        part = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', part)  # [text](url)
        out.append(part.replace("\\_", "_"))
    return "".join(out)


def table(lines):
    cells = lambda l: [c.strip() for c in l.strip().strip("|").split("|")]
    aligns = ["right" if c.endswith(":") and not c.startswith(":") else "left" for c in cells(lines[1])]
    head = "".join(f'<th style="text-align:{a}">{inline(c)}</th>' for c, a in zip(cells(lines[0]), aligns))
    body = "".join("<tr>" + "".join(f'<td style="text-align:{a}">{inline(c)}</td>' for c, a in zip(cells(l), aligns)) + "</tr>"
                   for l in lines[2:])
    return f"<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>"


def block(lines):
    first = lines[0].strip()
    if m := re.match(r"(#{1,6})\s+(.*)", first):
        level = len(m.group(1))
        rest = f"<p>{inline(' '.join(l.strip() for l in lines[1:]))}</p>" if lines[1:] else ""
        return f"<h{level}>{inline(m.group(2))}</h{level}>{rest}"
    if first.startswith("|") and len(lines) >= 2:
        return table(lines)
    if m := re.match(r"!\[(.*)\]\((.*)\)", first):
        src = (docs / m.group(2)).resolve().as_uri()
        return f'<figure><img src="{src}"><figcaption>{inline(m.group(1))}</figcaption></figure>'
    if first.startswith(">"):
        inner = [l.strip()[1:].strip() for l in lines]
        return f'<blockquote>{block(inner) if inner and inner[0] else ""}</blockquote>'
    if LIST_ITEM.match(lines[0]):
        return list_html(lines)
    return paragraph(lines)


def paragraph(lines):
    """Lines join with a space, or with a line break after a line that ends in two spaces."""
    out = ""
    for i, l in enumerate(lines):
        out += inline(l.strip())
        if i < len(lines) - 1:
            out += "<br>" if l.endswith("  ") else " "
    return f"<p>{out}</p>"


LIST_ITEM = re.compile(r"^(\s*)([-*]|\d+\.)\s+(.*)")


def list_html(lines):
    """Bullet ("- ") and numbered ("1. ") lists; indented items become nested lists."""
    items = []  # (indent, ordered, text)
    for l in lines:
        if m := LIST_ITEM.match(l):
            items.append([len(m.group(1).expandtabs(4)), m.group(2)[0].isdigit(), m.group(3)])
        elif items:
            items[-1][2] += " " + l.strip()  # continuation of the previous item

    def render(start, indent):
        ordered = items[start][1]
        out, i = ["<ol>" if ordered else "<ul>"], start
        while i < len(items) and items[i][0] >= indent:
            if items[i][0] > indent:  # deeper: a nested list inside the previous item
                nested, i = render(i, items[i][0])
                out[-1] = out[-1].removesuffix("</li>") + nested + "</li>"
                continue
            out.append(f"<li>{inline(items[i][2])}</li>")
            i += 1
        out.append("</ol>" if ordered else "</ul>")
        return "".join(out), i

    return render(0, items[0][0])[0]


# split into blocks, keeping fenced code blocks whole
body, buffer, in_code, code = [], [], False, []
for line in md.split("\n"):
    if line.strip().startswith("```"):
        if in_code:
            body.append(f"<pre><code>{html.escape(chr(10).join(code))}</code></pre>")
            code, in_code = [], False
        else:
            if buffer:
                body.append(block(buffer))
                buffer = []
            in_code = True
        continue
    if in_code:
        code.append(line)
    elif line.strip() == "":
        if buffer:
            body.append(block(buffer))
            buffer = []
    else:
        # two trailing spaces = a Markdown line break; keep them as a marker for paragraph()
        buffer.append(line.rstrip() + ("  " if line.endswith("  ") and line.strip() else ""))
if buffer:
    body.append(block(buffer))

css = """
@page { size: A4; margin: 22mm 20mm; }
body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1a1a19; }
h1 { font-size: 19pt; line-height: 1.25; margin: 0 0 14pt; }
h2 { font-size: 14pt; margin: 22pt 0 8pt; border-bottom: 1px solid #e4e3dd; padding-bottom: 3pt; }
h3 { font-size: 12pt; margin: 16pt 0 6pt; }
h4 { font-size: 10.5pt; margin: 14pt 0 5pt; }
p { margin: 0 0 9pt; text-align: justify; }
ul, ol { margin: 0 0 9pt; padding-left: 18pt; }
li ul, li ol { margin: 2pt 0 2pt; }
ol { list-style: none; counter-reset: item; padding-left: 0; }
ol ol { padding-left: 16pt; }
ol li { counter-increment: item; }
ol li::before { content: counters(item, ".") ". "; } /* 1., 2., 2.1., 2.3.1. like the section numbers */
code { font-family: Menlo, monospace; font-size: 8.8pt; background: #f3f2ee; padding: 0 2pt; border-radius: 2pt; }
pre { background: #f3f2ee; padding: 7pt 9pt; border-radius: 3pt; page-break-inside: avoid; margin: 0 0 10pt; }
pre code { background: none; padding: 0; font-size: 8.5pt; line-height: 1.4; }
blockquote { margin: 0 0 10pt; padding: 5pt 10pt; border-left: 3px solid #eda100; background: #fdf6e6; }
blockquote p, blockquote ul { margin: 0; text-align: left; }
table { border-collapse: collapse; margin: 6pt 0 12pt; font-size: 9pt; page-break-inside: avoid; }
th, td { border-bottom: 1px solid #e4e3dd; padding: 3pt 7pt; vertical-align: top; }
th { border-bottom: 1.5px solid #6b6a63; font-weight: 600; }
figure { margin: 8pt 0 14pt; page-break-inside: avoid; }
figure img { width: 100%; }
figcaption { font-size: 9pt; color: #6b6a63; margin-top: 3pt; }
a { color: #2a78d6; text-decoration: none; }
"""
page = docs / f".{source.stem}.html"
page.write_text(f'<!doctype html><html><head><meta charset="utf-8"><title>{source.stem}</title><style>{css}</style></head>'
                f"<body>{''.join(body)}</body></html>")

browsers = ["/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
browser = next((b for b in browsers if Path(b).exists()), None)
if browser is None:
    raise SystemExit(f"no Chromium-based browser found; open {page} in a browser and print it to PDF")
pdf = source.with_suffix(".pdf")
subprocess.run([browser, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files",
                f"--print-to-pdf={pdf}", page.as_uri()], check=True, capture_output=True)
page.unlink()
print(f"wrote {pdf}")
