/**
 * content.json → 편집용 문서(.docx).
 *
 * 한글(HWP)에서 바로 열리고, 워드·구글문서에서도 열린다.
 * 디자인은 원본 전자책의 분위기만 옮기고, 편집하기 쉬운 구조를 우선했다.
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, TableOfContents, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  HeadingLevel, AlignmentType, LevelFormat, ImageRun,
  Footer, PageNumber,
} = require('docx');

const HERE = __dirname;
const doc = JSON.parse(fs.readFileSync(path.join(HERE, 'content.json'), 'utf8'));

/* ── 색과 서체 ────────────────────────────────────────────── */
const GOLD = 'A97F3C', VIOLET = '5B4A96', INK = '241D33', INK2 = '4A4160', INK3 = '6B6183';
const KR_SERIF = { ascii: '바탕', eastAsia: '바탕', hAnsi: '바탕', cs: '바탕' };
const KR_SANS = { ascii: '맑은 고딕', eastAsia: '맑은 고딕', hAnsi: '맑은 고딕', cs: '맑은 고딕' };

const CONTENT_W = 9070;                 /* A4 − 좌우 여백 25mm */

/* ── 조각 도우미 ──────────────────────────────────────────── */
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const line = (color, size) => ({ style: BorderStyle.SINGLE, size: size || 4, color });

function runs(list, opt = {}) {
  const base = { font: opt.font || KR_SERIF, size: opt.size || 21, color: opt.color || INK2 };
  const out = [];
  (list || []).forEach((r) => {
    if (r.t === '\n') { out.push(new TextRun({ break: 1 })); return; }
    out.push(new TextRun({
      ...base,
      text: r.t,
      bold: !!r.b || !!opt.bold,
      italics: !!r.i,
      superScript: !!r.sup,
      color: r.sup ? GOLD : base.color,
      size: r.sup ? Math.round(base.size * 0.7) : base.size,
      shading: r.hl ? { type: ShadingType.CLEAR, fill: 'F7EBD2' } : undefined,
    }));
  });
  return out;
}

function para(children, opt = {}) {
  return new Paragraph({
    children,
    spacing: { line: opt.line || 340, before: opt.before || 0, after: opt.after == null ? 130 : opt.after },
    alignment: opt.align,
    indent: opt.indent,
    border: opt.border,
    shading: opt.shading,
    keepNext: opt.keepNext,
  });
}

const text = (s, o = {}) => runs([{ t: s }], o);

/* 상자 = 한 칸짜리 표. 셀 배경과 왼쪽 굵은 선으로 종류를 구분한다. */
function boxTable(children, { fill, edge }) {
  return new Table({
    columnWidths: [CONTENT_W],
    width: { size: CONTENT_W, type: WidthType.DXA },
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: CONTENT_W, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
        margins: { top: 170, bottom: 170, left: 220, right: 220 },
        borders: {
          top: line(edge, 2), bottom: line(edge, 2),
          right: line(edge, 2), left: line(edge, 18),
        },
        children,
      })],
    })],
  });
}

/* 좌우 비교 표 */
function splitTable(cols) {
  const w = Math.floor(CONTENT_W / cols.length);
  const widths = cols.map(() => w);
  return new Table({
    columnWidths: widths,
    width: { size: w * cols.length, type: WidthType.DXA },
    rows: [new TableRow({
      children: cols.map((c) => {
        const kids = [para(text(c.h5, { font: KR_SANS, size: 19, color: c.warn ? GOLD : VIOLET, bold: true }), { after: 90 })];
        (c.paras || []).forEach((p) => kids.push(para(runs(p, { size: 19 }), { line: 300, after: 90 })));
        (c.items || []).forEach((it) => kids.push(new Paragraph({
          numbering: { reference: 'dash', level: 0 },
          children: runs(it, { size: 19 }),
          spacing: { line: 290, after: 70 },
        })));
        if (kids.length === 1) kids.push(para([]));
        return new TableCell({
          width: { size: w, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: c.warn ? 'FBF5E9' : 'FCFAF5', color: 'auto' },
          margins: { top: 150, bottom: 150, left: 190, right: 190 },
          borders: {
            top: line('E0D6C2', 2), bottom: line('E0D6C2', 2),
            left: line('E0D6C2', 2), right: line('E0D6C2', 2),
          },
          children: kids,
        });
      }),
    })],
  });
}

/* ── 블록 → 문단 ─────────────────────────────────────────── */
function renderBlock(b, out) {
  switch (b.t) {
    case 'chapter': {
      out.push(new Paragraph({
        children: text(b.no, { font: KR_SANS, size: 17, color: GOLD }),
        spacing: { before: 0, after: 90 },
        pageBreakBefore: true,
      }));
      out.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: text(b.title.replace(/\s*—\s*/g, ' — '), { font: KR_SANS, size: 32, color: INK, bold: true }),
        spacing: { before: 0, after: 110 },
      }));
      if (b.sub) {
        out.push(para(text(b.sub, { font: KR_SANS, size: 18, color: INK3 }), { line: 300, after: 100 }));
      }
      out.push(new Paragraph({
        children: [],
        border: { bottom: line(GOLD, 8) },
        spacing: { after: 260 },
      }));
      break;
    }
    case 'h3':
      out.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: text(b.text, { font: KR_SANS, size: 23, color: INK, bold: true }),
        spacing: { before: 340, after: 140 },
        keepNext: true,
      }));
      break;

    case 'opening':
      out.push(para(runs(b.runs, { size: 22, color: INK }), {
        line: 350, after: 220,
        indent: { left: 220 },
        border: { left: line(GOLD, 12) },
      }));
      break;

    case 'lead':
      out.push(para(runs(b.runs, { size: 22, color: INK }), { line: 350 }));
      break;

    case 'small':
      out.push(para(runs(b.runs, { size: 19 }), { line: 300 }));
      break;

    case 'p':
      out.push(para(runs(b.runs), {}));
      break;

    case 'pull':
      out.push(para(runs(b.runs, { size: 26, color: INK }), {
        align: AlignmentType.CENTER, line: 380, before: 240, after: 240,
        border: { top: line('D9C79E', 4), bottom: line('D9C79E', 4) },
      }));
      break;

    case 'box': {
      const style = {
        research: { fill: 'FBF7EE', edge: VIOLET, label: b.label || '연구 이야기' },
        case: { fill: 'F3EFFA', edge: '8B7CC4', label: b.label || '상담실에서' },
        note: { fill: 'F3EEE4', edge: 'C9A860', label: b.label },
        keypoint: { fill: 'F8F1E0', edge: GOLD, label: b.label },
      }[b.kind];
      const kids = [];
      if (style.label) {
        kids.push(para(text(style.label, { font: KR_SANS, size: 16, color: style.edge, bold: true }), { after: 90 }));
      }
      if (b.head) {
        kids.push(para(text(b.head, { font: KR_SANS, size: 21, color: INK, bold: true }), { after: 110 }));
      }
      b.paras.forEach((p) => kids.push(para(runs(p.runs, { size: 20 }), {
        line: 320, after: 100, indent: p.q ? { left: 200 } : undefined,
        border: p.q ? { left: line('C3B4E6', 8) } : undefined,
      })));
      if (b.cite) {
        kids.push(para(text(b.cite, { font: KR_SANS, size: 15, color: INK3 }), {
          line: 260, after: 0, before: 90, border: { top: line('DDD2BD', 2) },
        }));
      }
      out.push(boxTable(kids, style));
      out.push(para([], { after: 200 }));
      break;
    }

    case 'split':
      out.push(splitTable(b.cols));
      out.push(para([], { after: 200 }));
      break;

    case 'numbox': {
      const w = Math.floor(CONTENT_W / b.items.length);
      out.push(new Table({
        columnWidths: b.items.map(() => w),
        width: { size: w * b.items.length, type: WidthType.DXA },
        rows: [new TableRow({
          children: b.items.map((it) => new TableCell({
            width: { size: w, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: 'FCFAF5', color: 'auto' },
            margins: { top: 170, bottom: 170, left: 120, right: 120 },
            borders: { top: line('E0D6C2', 2), bottom: line('E0D6C2', 2), left: line('E0D6C2', 2), right: line('E0D6C2', 2) },
            children: [
              para(text(it.v, { font: KR_SANS, size: 34, color: GOLD, bold: true }), { align: AlignmentType.CENTER, after: 70 }),
              para(text(it.l, { font: KR_SANS, size: 16, color: INK3 }), { align: AlignmentType.CENTER, line: 260, after: 0 }),
            ],
          })),
        })],
      }));
      out.push(para([], { after: 200 }));
      break;
    }

    case 'band': {
      const w = Math.floor(CONTENT_W / b.items.length);
      out.push(new Table({
        columnWidths: b.items.map(() => w),
        width: { size: w * b.items.length, type: WidthType.DXA },
        rows: [new TableRow({
          children: b.items.map((it) => new TableCell({
            width: { size: w, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: 'FCFAF5', color: 'auto' },
            margins: { top: 150, bottom: 150, left: 170, right: 170 },
            borders: { top: line('E0D6C2', 2), bottom: line('E0D6C2', 2), left: line('E0D6C2', 2), right: line('E0D6C2', 2) },
            children: [
              para(text(it.r, { font: KR_SANS, size: 24, color: GOLD, bold: true }), { after: 80 }),
              para(text(it.p, { size: 18 }), { line: 290, after: 0 }),
            ],
          })),
        })],
      }));
      out.push(para([], { after: 200 }));
      break;
    }

    case 'list':
      b.items.forEach((it, i) => {
        if (b.style === 'refs') {
          out.push(new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}. `, font: KR_SANS, size: 17, color: GOLD, bold: true }),
              ...runs(it, { font: KR_SANS, size: 17, color: INK2 }),
            ],
            spacing: { line: 280, after: 110 },
            indent: { left: 340, hanging: 340 },
          }));
        } else {
          out.push(new Paragraph({
            numbering: { reference: b.style === 'checklist' ? 'check' : 'dash', level: 0 },
            children: runs(it, { size: 20 }),
            spacing: { line: 310, after: 100 },
          }));
        }
      });
      out.push(para([], { after: 120 }));
      break;

    case 'quizsec':
      out.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: text(b.text, { font: KR_SANS, size: 19, color: VIOLET, bold: true }),
        spacing: { before: 300, after: 130 },
        border: { bottom: line('DDD2BD', 2) },
        keepNext: true,
      }));
      break;

    case 'quizitem': {
      const qw = CONTENT_W - 1800;
      out.push(new Table({
        columnWidths: [qw, 1800],
        width: { size: CONTENT_W, type: WidthType.DXA },
        rows: [new TableRow({
          children: [
            new TableCell({
              width: { size: qw, type: WidthType.DXA },
              margins: { top: 60, bottom: 60, left: 0, right: 120 },
              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
              children: [para([
                new TextRun({ text: `${b.no}. `, font: KR_SANS, size: 19, color: GOLD, bold: true }),
                ...runs(b.runs, { size: 20 }),
              ], { line: 290, after: 0 })],
            }),
            new TableCell({
              width: { size: 1800, type: WidthType.DXA },
              margins: { top: 60, bottom: 60, left: 0, right: 0 },
              borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
              children: [para(text('☐  ☐  ☐  ☐', { font: KR_SANS, size: 20, color: INK3 }),
                { align: AlignmentType.RIGHT, after: 0 })],
            }),
          ],
        })],
      }));
      break;
    }

    case 'fig': {
      const img = path.join(HERE, b.img || '');
      if (b.img && fs.existsSync(img)) {
        const W = 560, H = Math.round(W * (b.h / b.w));
        out.push(new Paragraph({
          children: [new ImageRun({ data: fs.readFileSync(img), transformation: { width: W, height: H }, type: 'png' })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 180, after: 100 },
        }));
      }
      if (b.cap) {
        out.push(para(text(b.cap, { font: KR_SANS, size: 16, color: INK3 }),
          { align: AlignmentType.CENTER, line: 260, after: 240 }));
      }
      break;
    }
    default:
      break;
  }
}

/* ── 문서 조립 ───────────────────────────────────────────── */
const body = [];

/* 표제지 */
body.push(para([], { after: 2400 }));
body.push(para(text('D M O U R', { font: KR_SANS, size: 18, color: GOLD, bold: true }), { align: AlignmentType.CENTER, after: 120 }));
body.push(para(text('연애 · 재회 · 이별 심리상담', { font: KR_SANS, size: 16, color: INK3 }), { align: AlignmentType.CENTER, after: 1400 }));
body.push(para(text('그 사람이', { font: KR_SANS, size: 52, color: INK, bold: true }), { align: AlignmentType.CENTER, after: 160 }));
body.push(para(text('나를 잊을까요?', { font: KR_SANS, size: 52, color: GOLD, bold: true }), { align: AlignmentType.CENTER, after: 700 }));
body.push(para(text('이별한 마음에 대해 가장 정직하게 쓴 심리학 안내서', { font: KR_SANS, size: 21, color: INK3 }), { align: AlignmentType.CENTER, after: 300 }));
body.push(para(text('33편의 심리학 연구를 바탕으로 누구나 읽을 수 있게 썼습니다', { font: KR_SANS, size: 17, color: INK3 }), { align: AlignmentType.CENTER, after: 0 }));

/* 목차 */
body.push(new Paragraph({ children: [new PageBreak()] }));
body.push(new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: text('차례', { font: KR_SANS, size: 34, color: INK, bold: true }),
  spacing: { after: 300 },
}));
/* 차례는 고정 목록으로 넣는다. 필드 목차는 새로 고치기 전까지 빈 칸으로 보여
   편집용 문서에서는 오히려 불편하다. 쪽 번호는 편집하면 어차피 달라진다. */
doc.forEach((sec) => {
  if (sec.t === 'part') {
    body.push(para(text(`PART ${sec.no} · ${sec.title}`,
      { font: KR_SANS, size: 18, color: GOLD, bold: true }), { before: 240, after: 120 }));
    (sec.items || []).forEach((it) => body.push(
      para(text(it, { font: KR_SANS, size: 20, color: INK2 }), { line: 300, after: 80, indent: { left: 220 } })));
  } else if (sec.t === 'flow' && sec.blocks.length && sec.blocks[0].t === 'chapter') {
    const ch = sec.blocks[0];
    if (!/^CHAPTER/.test(ch.no)) {
      body.push(para(text(ch.title, { font: KR_SANS, size: 20, color: INK2 }),
        { line: 300, after: 80, before: 160, indent: { left: 220 } }));
    }
  }
});

/* 본문 */
doc.forEach((sec) => {
  if (sec.t === 'colophon') {
    body.push(new Paragraph({ children: [new PageBreak()] }));
    body.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: text('이 책을 펼친 당신에게', { font: KR_SANS, size: 30, color: INK, bold: true }),
      spacing: { after: 260 },
    }));
    sec.blocks.forEach((b) => renderBlock(b, body));
    return;
  }
  if (sec.t === 'part') {
    body.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: text(`PART ${sec.no} · ${sec.title}`, { font: KR_SANS, size: 30, color: INK, bold: true }),
      spacing: { before: 0, after: 200 },
      pageBreakBefore: true,
    }));
    body.push(para(text(sec.sub, { font: KR_SANS, size: 20, color: INK3 }), { line: 320, after: 200 }));
    (sec.items || []).forEach((it) => body.push(para(text(it, { font: KR_SANS, size: 19, color: INK2 }), { line: 300, after: 90 })));
    return;
  }
  if (sec.t === 'closing') {
    body.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: text('상담 안내', { font: KR_SANS, size: 30, color: INK, bold: true }),
      spacing: { after: 260 },
      pageBreakBefore: true,
    }));
    sec.blocks.forEach((b) => renderBlock(b, body));
    return;
  }
  sec.blocks.forEach((b) => renderBlock(b, body));
});

const document = new Document({
  creator: 'DMOUR',
  title: '그 사람이 나를 잊을까요?',
  description: '이별한 마음에 대해 가장 정직하게 쓴 심리학 안내서',
  styles: {
    default: {
      document: { run: { font: KR_SERIF, size: 21, color: INK2 }, paragraph: { spacing: { line: 340 } } },
      heading1: { run: { font: KR_SANS, size: 30, bold: true, color: INK }, paragraph: { spacing: { before: 400, after: 200 } } },
      heading2: { run: { font: KR_SANS, size: 32, bold: true, color: INK }, paragraph: { spacing: { before: 0, after: 160 } } },
      heading3: { run: { font: KR_SANS, size: 23, bold: true, color: INK }, paragraph: { spacing: { before: 340, after: 140 } } },
    },
  },
  numbering: {
    config: [
      {
        reference: 'dash',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 340, hanging: 220 } }, run: { color: GOLD, font: KR_SANS } },
        }],
      },
      {
        reference: 'check',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '☐', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 380, hanging: 260 } }, run: { color: GOLD, font: KR_SANS } },
        }],
      },
    ],
  },
  sections: [{
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], font: KR_SANS, size: 17, color: INK3 })],
        })],
      }),
    },
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1418, right: 1418, bottom: 1418, left: 1418 },
      },
    },
    children: body,
  }],
});

Packer.toBuffer(document).then((buf) => {
  const out = path.join(HERE, '..', '그사람이_나를_잊을까요.docx');
  fs.writeFileSync(out, buf);
  console.log('· DOCX', (buf.length / 1024 / 1024).toFixed(2), 'MB ·', body.length, '블록');
});
