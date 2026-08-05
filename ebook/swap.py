#!/usr/bin/env python3
"""book.src.html 안의 특정 <article data-tocid="..."> 블록을 통째로 갈아끼운다."""
import re, sys
from pathlib import Path
SRC = Path(__file__).parent / "book.src.html"

def replace(tocid: str, new_html: str):
    s = SRC.read_text(encoding="utf-8")
    m = re.search(r'<article class="flow" data-tocid="%s".*?</article>' % re.escape(tocid), s, re.S)
    if not m:
        sys.exit("찾지 못함: " + tocid)
    s = s[:m.start()] + new_html.strip() + s[m.end():]
    SRC.write_text(s, encoding="utf-8")
    print(f"  교체 {tocid}: {m.end()-m.start()} → {len(new_html.strip())}자")

if __name__ == "__main__":
    tocid = sys.argv[1]
    replace(tocid, Path(sys.argv[2]).read_text(encoding="utf-8"))
