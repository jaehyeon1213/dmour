const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "YOUFIT TOEIC";
pres.title = "유핏토익 1년 수업 운영 안내";

/* ---------- palette ---------- */
const NAVY = "16233F";
const NAVY_LT = "27395F";
const INK = "1B2436";
const MUTED = "6B7791";
const LIVE = "D9481F";
const LIVE_SOFT = "FCEDE7";
const VOD = "0E7C77";
const VOD_SOFT = "E2F2F0";
const GOLD = "B8860B";
const GOLD_SOFT = "FBF2DC";
const TINT = "F3F6FA";
const LINE = "DCE3ED";
const WHITE = "FFFFFF";

const F = "Malgun Gothic";
const W = 13.3, H = 7.5, M = 0.6;

const sh = () => ({ type: "outer", color: "9AA6BC", blur: 10, offset: 2, angle: 90, opacity: 0.22 });

function card(s, o) {
  s.addShape(pres.ShapeType.roundRect, {
    x: o.x, y: o.y, w: o.w, h: o.h, rectRadius: o.r === undefined ? 0.1 : o.r,
    fill: { color: o.fill || WHITE },
    line: o.line ? { color: o.line, width: 1 } : { type: "none" },
    shadow: o.shadow ? sh() : undefined,
  });
}

function pill(s, o) {
  s.addShape(pres.ShapeType.roundRect, {
    x: o.x, y: o.y, w: o.w, h: o.h, rectRadius: 0.4,
    fill: { color: o.fill }, line: { type: "none" },
  });
  s.addText(o.text, {
    x: o.x, y: o.y, w: o.w, h: o.h, align: "center", valign: "middle", margin: 0,
    fontFace: F, fontSize: o.size || 11, bold: true, color: o.color,
  });
}

function circleNum(s, o) {
  s.addShape(pres.ShapeType.ellipse, {
    x: o.x, y: o.y, w: o.d, h: o.d, fill: { color: o.fill }, line: { type: "none" },
  });
  s.addText(o.text, {
    x: o.x, y: o.y, w: o.d, h: o.d, align: "center", valign: "middle", margin: 0,
    fontFace: F, fontSize: o.size || 15, bold: true, color: o.color || WHITE,
  });
}

function head(s, title, sub) {
  s.addText(title, {
    x: M, y: 0.42, w: W - M * 2, h: 0.7, margin: 0, valign: "middle",
    fontFace: F, fontSize: 31, bold: true, color: INK,
  });
  if (sub) {
    s.addText(sub, {
      x: M, y: 1.14, w: W - M * 2, h: 0.36, margin: 0, valign: "middle",
      fontFace: F, fontSize: 14.5, color: MUTED,
    });
  }
}

const MONTHS = [
  { m: 1, t: "라이브" }, { m: 2, t: "라이브" }, { m: 3, t: "라이브" },
  { m: 4, t: "VOD" }, { m: 5, t: "VOD" }, { m: 6, t: "VOD" },
  { m: 7, t: "라이브" }, { m: 8, t: "라이브" }, { m: 9, t: "라이브" },
  { m: 10, t: "VOD" }, { m: 11, t: "VOD" }, { m: 12, t: "VOD" },
];

/* =========================================================
   1. TITLE
========================================================= */
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  s.addText("YOUFIT TOEIC  ·  ANNUAL CURRICULUM", {
    x: 0.95, y: 1.62, w: 9, h: 0.35, margin: 0, valign: "middle",
    fontFace: "Calibri", fontSize: 13, bold: true, charSpacing: 3, color: "7FC8C3",
  });
  s.addText("유핏토익 1년 수업 운영 안내", {
    x: 0.95, y: 2.05, w: 11.4, h: 1.0, margin: 0, valign: "middle",
    fontFace: F, fontSize: 44, bold: true, color: WHITE,
  });
  s.addText("시즌 1과 시즌 2로 나누어 운영되는 라이브 · VOD 수업과 수강료 혜택 안내", {
    x: 0.95, y: 3.12, w: 11.4, h: 0.42, margin: 0, valign: "middle",
    fontFace: F, fontSize: 16.5, color: "C6D2E6",
  });

  // 12 month chips
  const cw = 0.92, gap = 0.092, x0 = 0.95;
  MONTHS.forEach((mo, i) => {
    const live = mo.t === "라이브";
    const x = x0 + i * (cw + gap);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 4.85, w: cw, h: 0.86, rectRadius: 0.16,
      fill: { color: live ? LIVE : VOD }, line: { type: "none" },
    });
    s.addText(`${mo.m}월`, {
      x, y: 4.85, w: cw, h: 0.86, align: "center", valign: "middle", margin: 0,
      fontFace: F, fontSize: 13.5, bold: true, color: WHITE,
    });
  });

  const legend = [
    { c: LIVE, t: "라이브 수업  1~3월 · 7~9월" },
    { c: VOD, t: "VOD 수업  4~6월 · 10~12월" },
  ];
  legend.forEach((lg, i) => {
    const x = 0.95 + i * 4.3;
    s.addShape(pres.ShapeType.ellipse, {
      x, y: 6.05, w: 0.19, h: 0.19, fill: { color: lg.c }, line: { type: "none" },
    });
    s.addText(lg.t, {
      x: x + 0.3, y: 5.96, w: 4.0, h: 0.36, margin: 0, valign: "middle",
      fontFace: F, fontSize: 12.5, color: "C6D2E6",
    });
  });
  s.addNotes("유핏토익 1년 수업 운영 안내 — 시즌 1(1~6월)과 시즌 2(7~12월)로 나누어 운영됩니다.");
}

/* =========================================================
   2. 운영 구조
========================================================= */
{
  const s = pres.addSlide();
  head(s, "1년 운영 구조 한눈에 보기", "유핏토익의 1년 수업은 시즌 1과 시즌 2로 나누어 운영됩니다.");

  const seasons = [
    { x: M, tag: "S1", name: "시즌 1", range: "1월 – 6월", live: "1월 · 2월 · 3월", vod: "4월 · 5월 · 6월" },
    { x: 6.95, tag: "S2", name: "시즌 2", range: "7월 – 12월", live: "7월 · 8월 · 9월", vod: "10월 · 11월 · 12월" },
  ];
  seasons.forEach((sn) => {
    const w = 5.75, y = 1.68, h = 2.15;
    card(s, { x: sn.x, y, w, h, fill: TINT });
    circleNum(s, { x: sn.x + 0.35, y: y + 0.32, d: 0.62, fill: NAVY, text: sn.tag, size: 14 });
    s.addText(sn.name, {
      x: sn.x + 1.12, y: y + 0.3, w: 2.2, h: 0.36, margin: 0, valign: "middle",
      fontFace: F, fontSize: 21, bold: true, color: NAVY,
    });
    s.addText(sn.range, {
      x: sn.x + 2.55, y: y + 0.34, w: 2.6, h: 0.3, margin: 0, valign: "middle",
      fontFace: F, fontSize: 14, color: MUTED,
    });
    pill(s, { x: sn.x + 0.35, y: y + 1.08, w: 1.0, h: 0.38, fill: LIVE_SOFT, color: LIVE, text: "라이브" });
    s.addText(sn.live, {
      x: sn.x + 1.5, y: y + 1.08, w: 4.0, h: 0.38, margin: 0, valign: "middle",
      fontFace: F, fontSize: 14.5, bold: true, color: INK,
    });
    pill(s, { x: sn.x + 0.35, y: y + 1.55, w: 1.0, h: 0.38, fill: VOD_SOFT, color: VOD, text: "VOD" });
    s.addText(sn.vod, {
      x: sn.x + 1.5, y: y + 1.55, w: 4.0, h: 0.38, margin: 0, valign: "middle",
      fontFace: F, fontSize: 14.5, bold: true, color: INK,
    });
  });

  const rules = [
    { n: "1", c: LIVE, t: "앞 3개월은 라이브", d: "각 시즌의 앞 3개월은 라이브 수업으로 진행됩니다." },
    { n: "2", c: VOD, t: "뒤 3개월은 VOD", d: "뒤 3개월은 앞서 진행된 라이브 수업을 활용한 VOD 수업으로 진행됩니다." },
    { n: "3", c: NAVY, t: "짝수달 · 홀수달 구분", d: "VOD는 단순히 월 순서대로 제공되지 않고, 짝수달과 홀수달을 구분하여 제공됩니다." },
  ];
  rules.forEach((r, i) => {
    const x = M + i * 4.15, y = 4.15, w = 3.85, h = 2.2;
    card(s, { x, y, w, h, fill: WHITE, line: LINE, shadow: true });
    circleNum(s, { x: x + 0.35, y: y + 0.32, d: 0.5, fill: r.c, text: r.n, size: 14 });
    s.addText(r.t, {
      x: x + 0.35, y: y + 0.98, w: w - 0.7, h: 0.34, margin: 0, valign: "middle",
      fontFace: F, fontSize: 16, bold: true, color: INK,
    });
    s.addText(r.d, {
      x: x + 0.35, y: y + 1.36, w: w - 0.7, h: 0.72, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUTED, lineSpacingMultiple: 1.25,
    });
  });
  s.addNotes("시즌마다 라이브 3개월 + VOD 3개월. VOD는 월 순서가 아니라 짝수달·홀수달 구분으로 제공됩니다.");
}

/* =========================================================
   3-4. 시즌 상세
========================================================= */
function seasonSlide(cfg) {
  const s = pres.addSlide();
  head(s, cfg.title, cfg.sub);

  const cw = 1.9, gap = 0.16, x0 = 0.55;
  cfg.months.forEach((mo, i) => {
    const live = mo.t === "라이브";
    const x = x0 + i * (cw + gap), y = 1.62, h = 1.3;
    card(s, { x, y, w: cw, h, fill: live ? LIVE_SOFT : VOD_SOFT });
    s.addText(`${mo.m}월`, {
      x, y: y + 0.22, w: cw, h: 0.45, align: "center", valign: "middle", margin: 0,
      fontFace: F, fontSize: 24, bold: true, color: live ? LIVE : VOD,
    });
    s.addText(mo.t, {
      x, y: y + 0.72, w: cw, h: 0.32, align: "center", valign: "middle", margin: 0,
      fontFace: F, fontSize: 13, bold: true, color: live ? LIVE : VOD,
    });
  });

  s.addText("VOD 수업으로 제공되는 영상", {
    x: M, y: 3.15, w: 6, h: 0.34, margin: 0, valign: "middle",
    fontFace: F, fontSize: 16, bold: true, color: NAVY,
  });

  cfg.map.forEach((mp, i) => {
    const x = M + i * 4.15, y = 3.62, w = 3.85, h = 1.6;
    card(s, { x, y, w, h, fill: WHITE, line: LINE, shadow: true });
    pill(s, { x: x + 0.32, y: y + 0.26, w: 1.35, h: 0.36, fill: VOD_SOFT, color: VOD, text: `${mp.month}월 VOD` });
    s.addText(mp.src, {
      x: x + 0.32, y: y + 0.75, w: w - 0.64, h: 0.62, margin: 0,
      fontFace: F, fontSize: mp.small ? 14 : 17, bold: true, color: INK, lineSpacingMultiple: 1.2,
    });
  });

  card(s, { x: M, y: 5.45, w: W - M * 2, h: 1.15, fill: TINT });
  s.addText(cfg.note, {
    x: M + 0.42, y: 5.45, w: W - M * 2 - 0.84, h: 1.15, margin: 0, valign: "middle",
    fontFace: F, fontSize: 13.5, color: INK, lineSpacingMultiple: 1.3,
  });
  s.addNotes(cfg.notes);
}

seasonSlide({
  title: "시즌 1 ｜ 1월 – 6월",
  sub: "1~3월은 라이브 수업, 4~6월은 앞서 진행된 라이브 수업을 활용한 VOD 수업으로 진행됩니다.",
  months: MONTHS.slice(0, 6),
  map: [
    { month: 4, src: "2월 라이브 수업 영상" },
    { month: 5, src: "1월 라이브 수업 영상" },
    { month: 6, src: "수강 이력과 운영 상황에 따라\n겹치지 않는 수업 영상", small: true },
  ],
  note: "4월에는 1월 영상이 아닌 2월 영상이 제공되고, 5월에는 2월 영상이 아닌 1월 영상이 제공됩니다.\n6월에는 기존에 들었던 수업과 겹치지 않도록 수강 이력을 확인한 뒤 적합한 수업을 제공합니다.",
  notes: "시즌 1: 4월 VOD = 2월 영상, 5월 VOD = 1월 영상, 6월은 수강 이력 확인 후 배정.",
});

seasonSlide({
  title: "시즌 2 ｜ 7월 – 12월",
  sub: "7~9월은 라이브 수업, 10~12월은 앞서 진행된 라이브 수업을 활용한 VOD 수업으로 진행됩니다.",
  months: MONTHS.slice(6),
  map: [
    { month: 10, src: "8월 라이브 수업 영상" },
    { month: 11, src: "7월 라이브 수업 영상" },
    { month: 12, src: "수강 이력과 운영 상황에 따라\n겹치지 않는 수업 영상", small: true },
  ],
  note: "10월에는 7월 영상이 아닌 8월 영상이 제공되고, 11월에는 8월 영상이 아닌 7월 영상이 제공됩니다.\n12월에도 이전에 들었던 수업과 겹치지 않도록 수강 이력을 확인한 뒤 수업을 배정합니다.",
  notes: "시즌 2: 10월 VOD = 8월 영상, 11월 VOD = 7월 영상, 12월은 수강 이력 확인 후 배정.",
});

/* =========================================================
   5. 연간 일정 표
========================================================= */
{
  const s = pres.addSlide();
  head(s, "한눈에 보는 연간 수업 일정", "수강 월별 수업 방식과 실제로 제공되는 수업입니다.");

  const rows = [
    [1, "라이브", "1월 라이브 수업"], [2, "라이브", "2월 라이브 수업"], [3, "라이브", "3월 라이브 수업"],
    [4, "VOD", "2월 라이브 영상"], [5, "VOD", "1월 라이브 영상"], [6, "VOD", "수강 이력에 따라 겹치지 않는 영상"],
    [7, "라이브", "7월 라이브 수업"], [8, "라이브", "8월 라이브 수업"], [9, "라이브", "9월 라이브 수업"],
    [10, "VOD", "8월 라이브 영상"], [11, "VOD", "7월 라이브 영상"], [12, "VOD", "수강 이력에 따라 겹치지 않는 영상"],
  ];

  [0, 1].forEach((half) => {
    const x = M + half * 6.35;
    s.addText(half === 0 ? "시즌 1 ｜ 1월 – 6월" : "시즌 2 ｜ 7월 – 12월", {
      x, y: 1.62, w: 5.5, h: 0.34, margin: 0, valign: "middle",
      fontFace: F, fontSize: 16, bold: true, color: NAVY,
    });

    const hdr = ["수강 월", "수업 방식", "제공되는 수업"].map((t) => ({
      text: t,
      options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 12.5, align: "center" },
    }));
    const body = rows.slice(half * 6, half * 6 + 6).map((r) => {
      const live = r[1] === "라이브";
      const bg = live ? LIVE_SOFT : VOD_SOFT;
      const fg = live ? LIVE : VOD;
      return [
        { text: `${r[0]}월`, options: { fill: { color: bg }, color: INK, bold: true, align: "center", fontSize: 13 } },
        { text: r[1], options: { fill: { color: bg }, color: fg, bold: true, align: "center", fontSize: 12.5 } },
        { text: r[2], options: { fill: { color: WHITE }, color: INK, fontSize: 12.5 } },
      ];
    });

    s.addTable([hdr, ...body], {
      x, y: 2.05, w: 6.1, colW: [1.05, 1.25, 3.8], rowH: 0.5,
      fontFace: F, valign: "middle", margin: [0, 0.12, 0, 0.12],
      border: { type: "solid", color: LINE, pt: 1 },
    });
  });

  card(s, { x: M, y: 5.85, w: W - M * 2, h: 0.8, fill: TINT });
  s.addText("4·5월과 10·11월의 VOD는 짝수달 · 홀수달을 구분해 제공되며, 6월과 12월은 수강 이력을 확인해 겹치지 않는 영상을 배정합니다.", {
    x: M + 0.42, y: 5.85, w: W - M * 2 - 0.84, h: 0.8, margin: 0, valign: "middle",
    fontFace: F, fontSize: 13, color: INK,
  });
  s.addNotes("연간 일정 요약표. 라이브 6개월 + VOD 6개월.");
}

/* =========================================================
   6. 중복 방지 원칙
========================================================= */
{
  const s = pres.addSlide();
  head(s, "이전에 들었던 수업과 겹치지 않도록 제공합니다", "재수강생이 같은 수업을 반복해서 듣지 않도록 기존 수강 이력을 확인해 수업을 제공합니다.");

  card(s, { x: M, y: 1.62, w: W - M * 2, h: 0.86, fill: TINT });
  s.addText("수업을 변경할 때는 가능하면 짝수달과 홀수달의 구분을 유지합니다.", {
    x: M + 0.42, y: 1.62, w: W - M * 2 - 0.84, h: 0.86, margin: 0, valign: "middle",
    fontFace: F, fontSize: 15, bold: true, color: NAVY,
  });

  const rules = [
    { n: "짝", c: VOD, t: "짝수달 수업을 들었던 경우", d: "다른 짝수달 수업으로 변경해드립니다." },
    { n: "홀", c: LIVE, t: "홀수달 수업을 들었던 경우", d: "다른 홀수달 수업으로 변경해드립니다." },
    { n: "!", c: NAVY, t: "기존 수강 이력과 겹치는 경우", d: "수강 이력 확인 후 겹치지 않는 수업으로 변경해드립니다." },
  ];
  rules.forEach((r, i) => {
    const x = M + i * 4.15, y = 2.72, w = 3.85, h = 2.05;
    card(s, { x, y, w, h, fill: WHITE, line: LINE, shadow: true });
    circleNum(s, { x: x + 0.35, y: y + 0.3, d: 0.52, fill: r.c, text: r.n, size: 14 });
    s.addText(r.t, {
      x: x + 0.35, y: y + 0.96, w: w - 0.7, h: 0.36, margin: 0, valign: "middle",
      fontFace: F, fontSize: 15.5, bold: true, color: INK,
    });
    s.addText(r.d, {
      x: x + 0.35, y: y + 1.32, w: w - 0.7, h: 0.6, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUTED, lineSpacingMultiple: 1.25,
    });
  });

  card(s, { x: M, y: 5.05, w: W - M * 2, h: 1.35, fill: NAVY });
  s.addText("현재 배정된 수업이 이전에 들었던 수업과 겹치는 경우 말씀해주세요.", {
    x: M + 0.5, y: 5.22, w: W - M * 2 - 1.0, h: 0.4, margin: 0, valign: "middle",
    fontFace: F, fontSize: 16.5, bold: true, color: WHITE,
  });
  s.addText("수강 이력을 확인한 뒤 겹치지 않는 수업으로 바로 변경해드립니다.", {
    x: M + 0.5, y: 5.68, w: W - M * 2 - 1.0, h: 0.4, margin: 0, valign: "middle",
    fontFace: F, fontSize: 14, color: "C6D2E6",
  });
  s.addNotes("중복 방지 원칙: 짝수달↔짝수달, 홀수달↔홀수달을 유지하며 겹치지 않는 수업으로 변경.");
}

/* =========================================================
   7. 사례
========================================================= */
{
  const s = pres.addSlide();
  head(s, "사례로 보는 수강 이력 확인", "기본 VOD가 이전에 들었던 수업과 겹치는지 확인한 뒤 안내해드립니다.");

  const cases = [
    {
      tag: "CASE 1", prev: "7월 라이브 수업 수강", back: "11월에 다시 수강",
      base: "11월 기본 VOD = 7월 영상", result: "중복 → 다른 달 수업으로 변경",
      ok: false,
    },
    {
      tag: "CASE 2", prev: "8월 라이브 수업 수강", back: "10월에 다시 수강",
      base: "10월 기본 VOD = 8월 영상", result: "중복 → 다른 달 수업으로 변경",
      ok: false,
    },
    {
      tag: "CASE 3", prev: "8월 라이브 수업 수강", back: "11월에 다시 수강",
      base: "11월 기본 VOD = 7월 영상", result: "중복 없음 → 그대로 수강 가능",
      ok: true,
    },
  ];

  cases.forEach((c, i) => {
    const x = M + i * 4.15, y = 1.68, w = 3.85, h = 3.75;
    card(s, { x, y, w, h, fill: WHITE, line: LINE, shadow: true });
    pill(s, { x: x + 0.32, y: y + 0.28, w: 1.25, h: 0.36, fill: TINT, color: NAVY, text: c.tag, size: 11 });

    s.addText("이전 수강", {
      x: x + 0.32, y: y + 0.82, w: w - 0.64, h: 0.26, margin: 0, valign: "middle",
      fontFace: F, fontSize: 11.5, bold: true, color: MUTED,
    });
    s.addText(c.prev, {
      x: x + 0.32, y: y + 1.08, w: w - 0.64, h: 0.34, margin: 0, valign: "middle",
      fontFace: F, fontSize: 15, bold: true, color: INK,
    });

    s.addText("↓", {
      x: x + 0.32, y: y + 1.46, w: 0.4, h: 0.3, margin: 0, align: "center", valign: "middle",
      fontFace: F, fontSize: 15, bold: true, color: MUTED,
    });

    s.addText("재수강", {
      x: x + 0.32, y: y + 1.8, w: w - 0.64, h: 0.26, margin: 0, valign: "middle",
      fontFace: F, fontSize: 11.5, bold: true, color: MUTED,
    });
    s.addText(c.back, {
      x: x + 0.32, y: y + 2.06, w: w - 0.64, h: 0.34, margin: 0, valign: "middle",
      fontFace: F, fontSize: 15, bold: true, color: INK,
    });

    card(s, { x: x + 0.32, y: y + 2.52, w: w - 0.64, h: 0.44, fill: TINT, r: 0.06 });
    s.addText(c.base, {
      x: x + 0.44, y: y + 2.52, w: w - 0.88, h: 0.44, margin: 0, valign: "middle",
      fontFace: F, fontSize: 12.5, color: NAVY,
    });

    card(s, { x: x + 0.32, y: y + 3.06, w: w - 0.64, h: 0.44, fill: c.ok ? VOD_SOFT : LIVE_SOFT, r: 0.06 });
    s.addText(c.result, {
      x: x + 0.44, y: y + 3.06, w: w - 0.88, h: 0.44, margin: 0, valign: "middle",
      fontFace: F, fontSize: 12.5, bold: true, color: c.ok ? VOD : LIVE,
    });
  });

  card(s, { x: M, y: 5.65, w: W - M * 2, h: 0.85, fill: TINT });
  s.addText("겹치는 수업이 있는 경우에는 기존에 듣지 않았던 다른 달의 수업으로 변경해드리고, 겹치지 않는 경우에는 배정된 수업을 그대로 수강하실 수 있습니다.", {
    x: M + 0.42, y: 5.65, w: W - M * 2 - 0.84, h: 0.85, margin: 0, valign: "middle",
    fontFace: F, fontSize: 13, color: INK,
  });
  s.addNotes("케이스 3처럼 겹치지 않으면 변경 없이 그대로 수강 가능합니다.");
}

/* =========================================================
   8. 할인
========================================================= */
{
  const s = pres.addSlide();
  head(s, "VOD 수강료 할인 안내", "유핏토익은 상시로 수강료 할인 이벤트를 진행하지 않습니다.");

  card(s, { x: M, y: 1.62, w: W - M * 2, h: 0.8, fill: GOLD_SOFT });
  s.addText("대신 1년에 두 번, 각 시즌의 VOD 수업이 처음 시작되는 달에 가장 큰 할인 혜택이 적용됩니다.", {
    x: M + 0.42, y: 1.62, w: W - M * 2 - 0.84, h: 0.8, margin: 0, valign: "middle",
    fontFace: F, fontSize: 15, bold: true, color: "6B4E00",
  });

  const stats = [
    {
      x: M, big: "5%", label: "VOD 기본 할인", fill: TINT, color: VOD,
      d1: "VOD 수업이 진행되는 달에는 기본 5% 할인이 적용됩니다.",
      d2: "시즌 1 VOD  4월 · 5월 · 6월\n시즌 2 VOD  10월 · 11월 · 12월",
    },
    {
      x: 6.95, big: "10%", label: "4월 · 10월 최대 할인", fill: GOLD_SOFT, color: GOLD,
      d1: "VOD가 처음 시작되는 4월과 10월은 기본 5% + 추가 5%가 적용됩니다.",
      d2: "4월  시즌 1 VOD 첫 오픈\n10월  시즌 2 VOD 첫 오픈",
    },
  ];
  stats.forEach((st) => {
    const y = 2.62, w = 5.75, h = 2.75;
    card(s, { x: st.x, y, w, h, fill: st.fill });
    s.addText(st.big, {
      x: st.x + 0.4, y: y + 0.28, w: 2.35, h: 1.0, margin: 0, valign: "middle",
      fontFace: "Calibri", fontSize: 58, bold: true, color: st.color,
    });
    s.addText(st.label, {
      x: st.x + 2.95, y: y + 0.48, w: 2.6, h: 0.6, margin: 0, valign: "middle",
      fontFace: F, fontSize: 16, bold: true, color: INK,
    });
    s.addText(st.d1, {
      x: st.x + 0.4, y: y + 1.36, w: w - 0.8, h: 0.5, margin: 0,
      fontFace: F, fontSize: 13, color: INK, lineSpacingMultiple: 1.2,
    });
    s.addText(st.d2, {
      x: st.x + 0.4, y: y + 1.9, w: w - 0.8, h: 0.72, margin: 0,
      fontFace: F, fontSize: 12.5, color: MUTED, lineSpacingMultiple: 1.35,
    });
  });

  card(s, { x: M, y: 5.62, w: W - M * 2, h: 0.88, fill: NAVY });
  s.addText("4월과 10월은 유핏토익의 연간 수강 일정 중 수강료가 가장 저렴한 달입니다.", {
    x: M + 0.5, y: 5.62, w: W - M * 2 - 1.0, h: 0.88, margin: 0, valign: "middle",
    fontFace: F, fontSize: 16, bold: true, color: WHITE,
  });
  s.addNotes("상시 할인 없음. VOD 달 기본 5%, 4월·10월은 추가 5%로 총 10% 수준의 최대 혜택.");
}

/* =========================================================
   9. 연속 수강
========================================================= */
{
  const s = pres.addSlide();
  head(s, "연속 수강 시 할인 혜택이 유지됩니다", "꾸준히 공부하는 학생분들의 수강료가 다음 달부터 갑자기 높아지지 않도록 연속 수강 혜택을 운영합니다.");

  const tracks = [
    {
      label: "시즌 1 ｜ 4월 시작", y: 1.95,
      steps: [
        { t: "4월 VOD", s: "기본 5% + 추가 5%", hi: true },
        { t: "5월 VOD", s: "혜택 유지" },
        { t: "6월 VOD", s: "혜택 유지" },
        { t: "7월 라이브", s: "혜택 유지" },
      ],
    },
    {
      label: "시즌 2 ｜ 10월 시작", y: 3.85,
      steps: [
        { t: "10월 VOD", s: "기본 5% + 추가 5%", hi: true },
        { t: "11월 VOD", s: "혜택 유지" },
        { t: "12월 VOD", s: "혜택 유지" },
        { t: "다음 라이브", s: "혜택 유지" },
      ],
    },
  ];

  tracks.forEach((tr) => {
    s.addText(tr.label, {
      x: M, y: tr.y, w: 5, h: 0.32, margin: 0, valign: "middle",
      fontFace: F, fontSize: 15, bold: true, color: NAVY,
    });
    const cwid = 2.75, gapx = 0.45, x0 = M;
    tr.steps.forEach((st, i) => {
      const x = x0 + i * (cwid + gapx), y = tr.y + 0.42, h = 1.05;
      card(s, { x, y, w: cwid, h, fill: st.hi ? GOLD_SOFT : TINT });
      s.addText(st.t, {
        x: x + 0.25, y: y + 0.18, w: cwid - 0.5, h: 0.34, margin: 0, valign: "middle",
        fontFace: F, fontSize: 15, bold: true, color: st.hi ? "6B4E00" : INK,
      });
      s.addText(st.s, {
        x: x + 0.25, y: y + 0.54, w: cwid - 0.5, h: 0.3, margin: 0, valign: "middle",
        fontFace: F, fontSize: 12, bold: st.hi, color: st.hi ? GOLD : MUTED,
      });
      if (i < tr.steps.length - 1) {
        s.addText("→", {
          x: x + cwid, y, w: gapx, h, margin: 0, align: "center", valign: "middle",
          fontFace: F, fontSize: 17, bold: true, color: MUTED,
        });
      }
    });
  });

  card(s, { x: M, y: 5.72, w: W - M * 2, h: 1.05, fill: NAVY });
  s.addText("4월 또는 10월에 수강을 시작한 뒤 연속으로 수강하면, 수강료가 다시 높아지는 부담 없이 공부를 이어갈 수 있습니다.", {
    x: M + 0.5, y: 5.72, w: W - M * 2 - 1.0, h: 1.05, margin: 0, valign: "middle",
    fontFace: F, fontSize: 15.5, bold: true, color: WHITE,
  });
  s.addNotes("4월·10월에 시작해 쉬지 않고 연속 수강하면 다음 라이브 수업까지 할인 혜택이 유지됩니다.");
}

/* =========================================================
   10. 안내사항
========================================================= */
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  s.addText("꼭 확인해주세요", {
    x: M + 0.35, y: 0.62, w: 8, h: 0.8, margin: 0, valign: "middle",
    fontFace: F, fontSize: 34, bold: true, color: WHITE,
  });
  s.addText("현재 안내된 연간 일정은 유핏토익의 기본 운영 계획입니다.", {
    x: M + 0.35, y: 1.42, w: 10, h: 0.36, margin: 0, valign: "middle",
    fontFace: F, fontSize: 15, color: "9FB0CC",
  });

  const items = [
    { n: "1", t: "일정 및 수업 방식 변경 가능", d: "1·2·3월과 7·8·9월은 라이브 수업으로 안내되지만, 대형 프로젝트 진행이나 내부 운영 상황에 따라 일부 일정 또는 수업 방식이 변경될 수 있습니다." },
    { n: "2", t: "6월 · 12월 VOD는 유동적", d: "6월과 12월에 제공되는 VOD 영상은 해당 시기의 수업 운영 상황과 학생별 수강 이력에 따라 달라질 수 있습니다." },
    { n: "3", t: "변경 시 사전 안내", d: "변경되는 내용이 있을 경우 수강생분들이 혼란을 겪지 않도록 미리 안내드리겠습니다." },
    { n: "4", t: "중복 수업은 바로 변경", d: "현재 제공되는 수업이 이전에 들었던 수업과 겹친다면 꼭 말씀해주세요. 확인 후 겹치지 않는 수업으로 바로 변경해드립니다." },
  ];
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + 0.35 + col * 6.15, y = 2.1 + row * 2.05, w = 5.7, h = 1.8;
    card(s, { x, y, w, h, fill: NAVY_LT });
    circleNum(s, { x: x + 0.35, y: y + 0.3, d: 0.46, fill: "7FC8C3", text: it.n, color: NAVY, size: 13 });
    s.addText(it.t, {
      x: x + 0.95, y: y + 0.3, w: w - 1.3, h: 0.46, margin: 0, valign: "middle",
      fontFace: F, fontSize: 15.5, bold: true, color: WHITE,
    });
    s.addText(it.d, {
      x: x + 0.35, y: y + 0.86, w: w - 0.7, h: 0.8, margin: 0,
      fontFace: F, fontSize: 12.5, color: "C6D2E6", lineSpacingMultiple: 1.25,
    });
  });

  s.addText("유핏토익은 학생 한 분 한 분의 수강 이력을 확인해 겹치지 않는 수업을 제공합니다.", {
    x: M + 0.35, y: 6.35, w: 12, h: 0.4, margin: 0, valign: "middle",
    fontFace: F, fontSize: 14, bold: true, color: "7FC8C3",
  });
  s.addNotes("운영 상황에 따른 변경 가능성 안내 및 중복 수업 변경 요청 안내.");
}

pres.writeFile({ fileName: process.argv[2] || "youfit_toeic_annual.pptx" })
  .then((f) => console.log("saved:", f));
