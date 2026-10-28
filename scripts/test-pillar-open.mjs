#!/usr/bin/env node
/** Clicking an overview pillar opens that pillar: the card grows, then the focused view is inside it. */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = path.join(root, "index.html");
const errors = [];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await page.addInitScript(() => localStorage.setItem("cpn-first-path-v1", "1"));
  await page.goto(`file://${html}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });
  const version = await page.evaluate(() => window.__cpnV2.APP_VERSION);
  if (version !== "3.5.89") errors.push(`expected 3.5.89, got ${version}`);

  await page.waitForSelector("g.overview-deck g.ov-card", { timeout: 30000 });
  const cards = await page.locator("g.overview-deck g.ov-card").count();
  if (cards !== 3) errors.push(`expected 3 overview cards, got ${cards}`);

  await page.locator("g.overview-deck g.ov-card").nth(1).click();
  await page.waitForFunction(() => {
    const el = document.querySelector(".pillar-open-overlay.grow");
    return el && el.getBoundingClientRect().width > 400;
  }, { timeout: 3000 });
  const mid = await page.evaluate(() => {
    const el = document.querySelector(".pillar-open-overlay");
    const r = el.getBoundingClientRect();
    return { grow: el.classList.contains("grow"), w: r.width, text: el.textContent };
  });
  if (!mid.grow) errors.push("overlay should grow");
  if (!/Workplaces/.test(mid.text)) errors.push(`overlay label: ${mid.text}`);
  if (mid.w < 400) errors.push(`overlay did not expand (${mid.w})`);

  await page.waitForFunction(() => document.body.classList.contains("pillar-focus"), { timeout: 8000 });
  await page.waitForFunction(() => !document.querySelector(".pillar-open-overlay"), { timeout: 4000 });
  const landed = await page.evaluate(() => ({
    promise: document.querySelector(".pillar-promise-strip .pps-text")?.textContent || "",
    cards: document.querySelectorAll(".pvp-card").length
  }));
  if (!/Empower and secure every worker/.test(landed.promise)) errors.push(`promise: ${landed.promise}`);
  if (landed.cards !== 3) errors.push(`expected 3 outcome cards, got ${landed.cards}`);

  if (errors.length) {
    console.error("FAIL:", errors.join("; "));
    process.exit(1);
  }
  console.log("PASS: pillar card opens into the focused view");
} finally {
  await browser.close();
}
