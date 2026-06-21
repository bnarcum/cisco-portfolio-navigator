#!/usr/bin/env node
/** Showroom device reflections — scans screenshot for mirror strip under hero. */
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const matrixRoot = path.resolve(root, "../Cursor Device Matrix/collaboration-device-matrix");
const outDir = path.join(matrixRoot, ".test-artifacts");
mkdirSync(outDir, { recursive: true });

const base =
  process.env.MATRIX_URL ||
  (process.env.LOCAL === "1"
    ? "http://127.0.0.1:4173/"
    : "https://bnarcum.github.io/collaboration-device-matrix/");

const url = `${base}?vendor=cisco&filter=room&embed=cpn&_v=${Date.now()}`;

function avgRect(png, x, y, span = 16) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let dy = -span; dy <= span; dy++) {
    for (let dx = -span; dx <= span; dx++) {
      const px = Math.min(png.width - 1, Math.max(0, x + dx));
      const py = Math.min(png.height - 1, Math.max(0, y + dy));
      const i = (py * png.width + px) * 4;
      r += png.data[i];
      g += png.data[i + 1];
      b += png.data[i + 2];
      n++;
    }
  }
  return { r: r / n, g: g / n, b: b / n, lum: (r + g + b) / (3 * n) };
}

function scanBand(png, x, y0, y1) {
  let best = { lum: 0, y: y0 };
  for (let y = y0; y <= y1; y += 6) {
    const s = avgRect(png, x, y, 14);
    if (s.lum > best.lum) best = { ...s, y };
  }
  return best;
}

const browser = await chromium.launch();
let exitCode = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector("canvas", { timeout: 30000 });
  await page.waitForTimeout(4500);

  const shot = path.join(outDir, "showroom-reflection.png");
  await page.screenshot({ path: shot, type: "png", fullPage: false });

  const png = PNG.sync.read(readFileSync(shot));
  const cx = Math.floor(png.width * 0.5);
  const hero = avgRect(png, cx, Math.floor(png.height * 0.34), 22);
  const reflection = scanBand(png, cx, Math.floor(png.height * 0.38), Math.floor(png.height * 0.62));
  const bareFloor = avgRect(png, Math.floor(png.width * 0.2), Math.floor(png.height * 0.72), 18);

  console.log("URL:", url);
  console.log("Screenshot:", shot);
  console.log("Metrics:", JSON.stringify({ hero, reflection, bareFloor }, null, 2));

  const delta = reflection.lum - bareFloor.lum;
  if (hero.lum < bareFloor.lum + 12) {
    console.error("FAIL: hero not brighter than floor");
    exitCode = 1;
  } else if (delta < 8) {
    console.error(`FAIL: no reflection strip (delta=${delta.toFixed(1)})`);
    exitCode = 1;
  } else {
    console.log(`PASS: reflection delta=${delta.toFixed(1)} at y=${reflection.y}`);
  }
} catch (err) {
  console.error("FAIL:", err.message);
  exitCode = 1;
} finally {
  await browser.close();
}
process.exit(exitCode);
