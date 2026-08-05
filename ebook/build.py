#!/usr/bin/env python3
"""
'그 사람이 나를 잊을까요?' 전자책 빌드 스크립트.

book.src.html 을 읽어  ①본문에 실제로 쓰인 글자만 남기도록 폰트를 서브셋하고
②woff2 를 base64 로 HTML 안에 심어 단일 파일로 만든 뒤 ③A4 PDF 로 렌더링한다.
폰트를 내장하기 때문에 결과물은 인터넷 없이도 어디서나 동일하게 보인다.

  python3 build.py            # HTML + PDF 생성
  python3 build.py --check    # 페이지 넘침 검사만 수행
"""
import base64
import io
import re
import subprocess
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = Path(__file__).parent
SRC = HERE / "book.src.html"
OUT_HTML = HERE / "그사람이_나를_잊을까요.html"
OUT_PDF = HERE / "그사람이_나를_잊을까요.pdf"
FONT_DIR = Path.home() / ".fonts"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

# 가변 폰트를 그대로 심으면 크롬이 '쪽마다' 별도의 서브셋을 PDF에 끼워 넣어
# 파일이 수십 MB로 불어난다. 실제로 쓰는 굵기만 고정 인스턴스로 뽑아 심는다.
FONTS = [
    ("NotoSerifKR.ttf", "Noto Serif KR", "korean", [300, 400, 500, 600]),
    ("NotoSansKR.ttf", "Noto Sans KR", "korean", [300, 400, 500, 600]),
    ("Cormorant.ttf", "Cormorant Garamond", "latin", [400, 500, 600]),
]

# 라틴 문자·숫자·구두점은 UI 요소에도 쓰이므로 항상 포함시킨다.
ALWAYS = set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789"
    " .,;:!?'\"()[]{}<>/\\|-–—_=+*&%#@~^`·…‘’“”"
    "–— •❖■●→×"
)


def page_text(html: str) -> str:
    """스크립트·스타일을 제외한, 화면에 실제로 그려지는 문자열만 뽑는다."""
    body = re.sub(r"<script\b.*?</script>", " ", html, flags=re.S | re.I)
    body = re.sub(r"<style\b.*?</style>", " ", body, flags=re.S | re.I)
    body = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    # SVG 안의 <text> 는 화면에 보이므로 남기고 태그만 제거한다.
    body = re.sub(r"<[^>]+>", " ", body)
    body = body.replace("&nbsp;", " ").replace("&amp;", "&")
    body = body.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
    return body


def subset_font(path: Path, chars: set, weight: int) -> bytes:
    """가변 폰트를 지정한 굵기의 고정 인스턴스로 만든 뒤 필요한 글리프만 남긴다."""
    font = TTFont(str(path))
    if "fvar" in font:
        font = instancer.instantiateVariableFont(font, {"wght": weight}, inplace=True)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.desubroutinize = False
    opts.layout_features = ["*"]        # 커닝·합자 유지
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.recalc_bounds = True
    subsetter = subset.Subsetter(options=opts)
    subsetter.populate(unicodes={ord(c) for c in chars})
    subsetter.subset(font)
    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    font.close()
    return buf.getvalue()


def build_font_css(chars: set) -> str:
    latin = {c for c in chars if ord(c) < 0x250}
    blocks = []
    total = 0
    for filename, family, scope, weights in FONTS:
        src = FONT_DIR / filename
        if not src.exists():
            sys.exit(f"폰트를 찾을 수 없습니다: {src}")
        wanted = (latin if scope == "latin" else chars) | ALWAYS
        per_family = 0
        for w in weights:
            data = subset_font(src, wanted, w)
            per_family += len(data)
            b64 = base64.b64encode(data).decode()
            blocks.append(
                "@font-face{font-family:'%s';font-style:normal;font-weight:%d;"
                "font-display:block;src:url(data:font/woff2;base64,%s) format('woff2');}"
                % (family, w, b64)
            )
        total += per_family
        print(f"  {family:<20} {len(wanted):>5} glyphs × {len(weights)} weights  →  {per_family/1024:7.1f} KB")
    print(f"  {'합계':<20} {'':>5}                        {total/1024:7.1f} KB")
    return "<style>\n" + "\n".join(blocks) + "\n</style>"


def paper_grain(size: int = 96, seed: int = 7) -> str:
    """종이 결 타일을 PNG data URI 로 만든다.

    SVG feTurbulence 로 같은 효과를 내면 크롬이 쪽마다 전면을 래스터라이즈해
    PDF 가 13MB 가량 불어난다. 작은 PNG 타일은 그 비용이 사실상 0 이다.
    """
    import random
    import struct
    import zlib

    rnd = random.Random(seed)
    rows = b""
    for _ in range(size):
        row = b"\x00"                       # 각 줄의 필터 바이트
        for _ in range(size):
            v = rnd.randint(232, 255)       # 아주 옅은 결
            row += bytes((v, v, v))
        rows += row

    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(rows, 9))
           + chunk(b"IEND", b""))
    return "data:image/png;base64," + base64.b64encode(png).decode()


OVERFLOW_JS = """
<script>
/* 조판은 폰트 로딩 후 비동기로 끝나므로, 끝났다는 표시를 기다렸다가 잰다. */
function runCheck(){
  var out = [], n = 0;
  var pages = document.querySelectorAll('#book > .page');
  pages.forEach(function(pg, i){
    var pad = pg.querySelector('.pad');
    if (!pad) return;
    // 본문 영역(패딩 제외)의 바닥을 기준으로 넘침을 잰다. 쪽번호 영역 침범까지 잡힌다.
    var cs = getComputedStyle(pad);
    var padBottom = parseFloat(cs.paddingBottom) || 0;
    var floor = pad.getBoundingClientRect().top + pad.clientHeight - padBottom;
    var lowest = 0;
    for (var j = 0; j < pad.children.length; j++) {
      var rb = pad.children[j].getBoundingClientRect().bottom;
      if (rb > lowest) lowest = rb;
    }
    var over = Math.round(Math.max(lowest - floor, pad.scrollHeight - pad.clientHeight));
    var label = pg.getAttribute('data-rt') || ('page#' + (i+1));
    if (over > 1) { out.push('OVER|' + (i+1) + '|' + label + '|+' + over + 'px'); n++; return; }
    // 여백이 과한 페이지도 잡아낸다. 마지막 자식의 바닥까지를 실제 사용 높이로 본다.
    if (pg.hasAttribute('data-loose') || pg.classList.contains('plate')) return;
    var next = pages[i+1];
    var lastOfChapter = !next || next.getAttribute('data-rt') !== pg.getAttribute('data-rt');
    if (lastOfChapter) return;   /* 장의 마지막 쪽이 짧은 것은 자연스럽다 */
    var inner = pad.clientHeight - padBottom - (parseFloat(cs.paddingTop) || 0);
    var used = lowest - (pad.getBoundingClientRect().top + (parseFloat(cs.paddingTop) || 0));
    var pct = Math.round(used / inner * 100);
    if (pct < 88) { out.push('THIN|' + (i+1) + '|' + label + '|' + pct + '%'); n++; }
  });
  var d = document.createElement('div');
  d.id = 'overflow-report';
  d.textContent = 'PAGES=' + document.querySelectorAll('.page').length +
                  ' BAD=' + n + ' ' + out.join(' ;; ');
  document.body.appendChild(d);
}
(function wait(){
  if (document.documentElement.hasAttribute('data-paginated')) { runCheck(); }
  else { setTimeout(wait, 50); }
})();
</script>
"""


def render(html_path: Path, pdf_path: Path):
    subprocess.run(
        [CHROME, "--headless", "--no-sandbox", "--disable-gpu",
         "--virtual-time-budget=25000", "--no-pdf-header-footer",
         f"--print-to-pdf={pdf_path}", str(html_path)],
        check=True, capture_output=True,
    )


def check_overflow(html: str):
    tmp = HERE / ".check.html"
    tmp.write_text(html.replace("</body>", OVERFLOW_JS + "</body>"), encoding="utf-8")
    res = subprocess.run(
        [CHROME, "--headless", "--no-sandbox", "--disable-gpu",
         "--virtual-time-budget=20000", "--dump-dom", str(tmp)],
        capture_output=True, text=True,
    )
    tmp.unlink(missing_ok=True)
    m = re.search(r'id="overflow-report">(.*?)</div>', res.stdout, re.S)
    if not m:
        print("  검사 결과를 읽지 못했습니다.")
        return
    report = m.group(1).strip()
    m2 = re.match(r"(PAGES=\d+ BAD=\d+)\s*(.*)", report, re.S)
    print("  " + m2.group(1))
    rest = m2.group(2).strip()
    if rest:
        for line in rest.split(" ;; "):
            line = line.strip()
            print(("   ✗ " if line.startswith("OVER") else "   · ") + line)
    else:
        print("   ✓ 모든 페이지 정상")


def main():
    html = SRC.read_text(encoding="utf-8")
    chars = set(page_text(html))

    print("· 폰트 서브셋")
    html = html.replace("<!--FONTS-->", build_font_css(chars))
    html = html.replace("__GRAIN__", paper_grain())
    html = html.replace("<!--CONTENT-->", "")

    print("· 페이지 넘침 검사")
    check_overflow(html)

    if "--check" in sys.argv:
        return

    OUT_HTML.write_text(html, encoding="utf-8")
    print(f"· HTML  {OUT_HTML.name}  ({OUT_HTML.stat().st_size/1024/1024:.2f} MB)")

    print("· PDF 렌더링")
    render(OUT_HTML, OUT_PDF)
    print(f"· PDF   {OUT_PDF.name}  ({OUT_PDF.stat().st_size/1024/1024:.2f} MB)")


if __name__ == "__main__":
    main()
