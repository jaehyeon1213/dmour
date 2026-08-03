/**
 * Render youfit-season.html to A4 page images (2480 x 3508 = A4 @ 300dpi).
 *
 *   npm i playwright && node make-a4.mjs [src.html] [outDir]
 *
 * The page is laid out at 827 CSS px wide (= 210mm, so 1 CSS px = 0.254mm)
 * with body.a4 applied, then split into sheets. Break points are chosen so
 * no card or diagram is ever cut across a page.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(process.argv[2] || 'youfit-season.html');
const OUT = path.resolve(process.argv[3] || 'export');

const CSS_W = 827;          // 210mm
const PAGE_H = 1169.333;    // 297mm
const DSF = 3;              // -> ~300dpi
const A4 = { w: 2480, h: 3508 };

// Elements a page may start on. Anything not listed is kept with its parent.
const BREAK_AT = [
  'section.map',
  'section.map .frame',
  'section.notice',
  'section.notice .n-card',
  'section.close',
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({
  viewport: { width: CSS_W, height: Math.round(PAGE_H) },
  deviceScaleFactor: DSF,
});
await page.goto('file://' + SRC);
await page.evaluate(() => document.body.classList.add('a4'));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

const plan = await page.evaluate(
  ([PAGE_H, BREAK_AT]) => {
    const els = [...document.querySelectorAll(BREAK_AT.join(','))].sort(
      (a, z) => a.getBoundingClientRect().top - z.getBoundingClientRect().top
    );
    const y = (el) => el.getBoundingClientRect().top + window.scrollY;
    const spacer = (h) => {
      const d = document.createElement('div');
      d.setAttribute('data-a4-spacer', '');
      d.style.cssText = `height:${h}px;width:100%;flex:none;`;
      return d;
    };

    let cur = 0; // top of the sheet currently being filled
    for (let i = 0; i < els.length; i++) {
      const top = y(els[i]);
      if (top <= cur) continue;
      const next = els[i + 1] ? y(els[i + 1]) : document.body.scrollHeight;
      const need = Math.min(next - top, PAGE_H); // blocks taller than a sheet just bleed
      if (top - cur + need > PAGE_H) {
        const pad = cur + PAGE_H - top;
        if (pad > 0.5) els[i].parentNode.insertBefore(spacer(pad), els[i]);
        cur += PAGE_H;
      }
    }

    const pages = Math.ceil(document.body.scrollHeight / PAGE_H);
    const tail = pages * PAGE_H - document.body.scrollHeight;
    if (tail > 0.5) document.body.appendChild(spacer(tail));
    return { pages, docH: document.body.scrollHeight };
  },
  [PAGE_H, BREAK_AT]
);

console.log(`${plan.pages} pages (document ${Math.round(plan.docH)}px)`);

const base = path.basename(SRC, '.html');
for (let i = 0; i < plan.pages; i++) {
  const file = path.join(OUT, `${base}-a4-${String(i + 1).padStart(2, '0')}.png`);
  const shot = await page.screenshot({
    fullPage: true,
    clip: { x: 0, y: i * PAGE_H, width: CSS_W - 0.34, height: PAGE_H },
  });

  // Chromium floors the clip, so normalise each sheet to exact A4 @300dpi.
  const exact = await page.evaluate(
    async ([src, w, h]) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      return c.toDataURL('image/png');
    },
    ['data:image/png;base64,' + shot.toString('base64'), A4.w, A4.h]
  );

  fs.writeFileSync(file, Buffer.from(exact.split(',')[1], 'base64'));
  console.log('wrote', path.relative(process.cwd(), file));
}

await browser.close();
