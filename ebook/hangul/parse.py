#!/usr/bin/env python3
"""book.src.html 의 원고를 편집용 문서(한글/워드) 생성기가 쓸 JSON 으로 옮긴다.

조판 정보(쪽 나누기·여백)는 버리고 '무엇이 무슨 요소인가'만 남긴다.
"""
import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag

HERE = Path(__file__).parent
SRC = HERE.parent / "book.src.html"
OUT = HERE / "content.json"


def runs(node) -> list:
    """굵게·강조·위첨자 같은 인라인 서식을 유지한 채 조각 목록으로 바꾼다."""
    out = []

    def walk(n, fmt):
        if isinstance(n, NavigableString):
            text = re.sub(r"\s+", " ", str(n))
            if text.strip() or (text == " " and out):
                out.append({"t": text, **fmt})
            return
        if not isinstance(n, Tag):
            return
        f = dict(fmt)
        if n.name in ("strong", "b"):
            f["b"] = True
        elif n.name == "em":
            f["hl"] = True                       # 본문의 <em> 은 형광펜 강조
        elif n.name == "i":
            f["i"] = True
        elif n.name == "sup":
            f["sup"] = True
        elif n.name == "br":
            out.append({"t": "\n", **fmt})
            return
        for c in n.children:
            walk(c, f)

    for c in node.children:
        walk(c, {})
    while out and not out[0]["t"].strip():
        out.pop(0)
    while out and not out[-1]["t"].strip():
        out.pop()
    if out:
        out[0]["t"] = out[0]["t"].lstrip()
        out[-1]["t"] = out[-1]["t"].rstrip()
    return out


def flat(node) -> str:
    return re.sub(r"\s+", " ", node.get_text(" ", strip=True)) if node else ""


def parse_block(el, blocks):
    cls = el.get("class", []) or []
    name = el.name

    if "ch-head" in cls:
        blocks.append({
            "t": "chapter",
            "no": flat(el.select_one(".ch-no")),
            "title": flat(el.select_one(".ch-title")),
            "sub": flat(el.select_one(".ch-sub")),
        })
        return

    if name == "h3":
        n = el.select_one(".n")
        if n:
            n.extract()
        blocks.append({"t": "h3", "text": flat(el)})
        return

    if name == "p":
        kind = "p"
        for c in ("opening", "lead", "small"):
            if c in cls:
                kind = c
        r = runs(el)
        if r:
            blocks.append({"t": kind, "runs": r})
        return

    if {"research", "case", "note", "keypoint"} & set(cls):
        kind = ("research" if "research" in cls else
                "case" if "case" in cls else
                "keypoint" if "keypoint" in cls else "note")
        cite = el.select_one(".cite")
        paras = [{"runs": runs(p), "q": "q" in (p.get("class") or [])}
                 for p in el.select("p") if p is not cite]
        if kind == "note" and not paras:
            paras = [{"runs": runs(el), "q": False}]
        tag, head = el.select_one(".tag"), el.select_one("h4")
        blocks.append({
            "t": "box", "kind": kind,
            "label": flat(tag) if tag else "",
            "head": flat(head) if head else "",
            "paras": paras,
            "cite": flat(cite) if cite else "",
        })
        return

    if "split" in cls:
        blocks.append({"t": "split", "cols": [{
            "warn": "warn" in (c.get("class") or []),
            "h5": flat(c.select_one("h5")),
            "paras": [runs(p) for p in c.select("p")],
            "items": [runs(li) for li in c.select("ul.dash li")],
        } for c in el.select(".col")]})
        return

    if "pull" in cls:
        q = el.select_one("q")
        blocks.append({"t": "pull", "runs": runs(q) if q else runs(el)})
        return

    if "numbox" in cls:
        blocks.append({"t": "numbox", "items": [
            {"v": flat(n.select_one(".v")), "l": flat(n.select_one(".l"))} for n in el.select(".n")]})
        return

    if "band" in cls:
        blocks.append({"t": "band", "items": [
            {"r": flat(b.select_one(".r")), "p": flat(b.select_one("p"))} for b in el.select(".b")]})
        return

    if "fig" in cls:
        blocks.append({"t": "fig", "cap": flat(el.select_one(".cap"))})
        return

    if "quiz-sec" in cls:
        blocks.append({"t": "quizsec", "text": flat(el)})
        return
    if "quiz-head" in cls:
        return
    if "quiz-item" in cls:
        q = el.select_one(".q")
        num = q.select_one("b")
        no = flat(num) if num else ""
        if num:
            num.extract()
        blocks.append({"t": "quizitem", "no": no, "runs": runs(q)})
        return

    if name in ("ul", "ol"):
        style = ("checklist" if "checklist" in cls else
                 "refs" if "refs" in cls else "dash")
        blocks.append({"t": "list", "style": style,
                       "items": [runs(li) for li in el.find_all("li", recursive=False)]})
        return

    if name == "div":
        for c in el.find_all(recursive=False):
            parse_block(c, blocks)


def main():
    soup = BeautifulSoup(SRC.read_text(encoding="utf-8"), "lxml")
    doc = []

    for el in soup.select_one("#src").find_all(["section", "article"], recursive=False):
        cls = el.get("class", []) or []
        rt = el.get("data-rt", "")

        if "plate" in cls:
            if el.select_one(".part-no"):
                doc.append({"t": "part",
                            "no": flat(el.select_one(".part-no")),
                            "title": flat(el.select_one(".part-title")),
                            "sub": flat(el.select_one(".part-sub")),
                            "items": [flat(p) for p in el.select(".part-toc")]})
            elif rt == "상담 안내":
                blocks = []
                for c in el.select_one(".pad").find_all(recursive=False):
                    parse_block(c, blocks)
                doc.append({"t": "closing", "blocks": blocks})
            elif "이 책을 펼친" in el.get_text():
                blocks = []
                for c in el.select_one(".pad > div").find_all(recursive=False):
                    parse_block(c, blocks)
                doc.append({"t": "colophon", "blocks": blocks})
            continue

        blocks = []
        for c in el.find_all(recursive=False):
            parse_block(c, blocks)
        doc.append({"t": "flow", "rt": rt, "blocks": blocks})

    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    kinds = {}
    for sec in doc:
        for b in sec.get("blocks", []):
            kinds[b["t"]] = kinds.get(b["t"], 0) + 1
    print("섹션", len(doc), "· 블록:", dict(sorted(kinds.items(), key=lambda t: -t[1])))


if __name__ == "__main__":
    main()
