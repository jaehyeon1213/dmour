/**
 * Render youfit-season.html to A4 page images (2480 x 3508 = A4 @ 300dpi).
 *
 *   npm i playwright && node make-a4.mjs [src.html] [outDir]
 *
 * The document is authored as one <section class="sheet"> per page, laid out
 * at 827 CSS px wide (= 210mm, so 1 CSS px = 0.254mm). body.a4 locks every
 * sheet to exactly one page height, so each sheet is captured as-is — no
 * slicing, nothing ever cut across a page.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(process.argv[2] || 'youfit-season.html');
const OUT = path.resolve(process.argv[3] || 'export');

const CSS_W = 827;        // 210mm
const PAGE_H = 1169.33;   // 297mm
const DSF = 3;            // -> ~300dpi
const A4 = { w: 2480, h: 3508 };

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

// Warn if any sheet's content exceeds the fixed page height.
const overflow = await page.evaluate(() =>
  [...document.querySelectorAll('.sheet')]
    .map((s, i) => ({ page: i + 1, over: Math.round(s.scrollHeight - s.clientHeight) }))
    .filter((x) => x.over > 1)
);
if (overflow.length) {
  console.warn('CONTENT OVERFLOWS:', overflow.map((o) => `p${o.page} +${o.over}px`).join(', '));
}

const sheets = await page.$$('.sheet');
const base = path.basename(SRC, '.html');

for (let i = 0; i < sheets.length; i++) {
  const shot = await sheets[i].screenshot();

  // Normalise to exact A4 @300dpi (Chromium rounds element bounds).
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

  const file = path.join(OUT, `${base}-a4-${String(i + 1).padStart(2, '0')}.png`);
  fs.writeFileSync(file, Buffer.from(exact.split(',')[1], 'base64'));
  console.log('wrote', path.relative(process.cwd(), file));
}

await browser.close();
