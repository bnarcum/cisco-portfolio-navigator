#!/usr/bin/env node
/** Pillar titles stay clickable above the connection lines. */
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
  await page.waitForFunction(() => window.__cpnV2 && window.__cpnV2.APP_VERSION, null, { timeout: 60000 });
  await page.evaluate(() => window.applyViewLevel("families"));
  await page.waitForFunction(() => [...document.querySelectorAll(".zone-title")].some(el => el.textContent === "Digital Resilience"), null, { timeout: 15000 });
  await page.waitForTimeout(400);

  const hit = await page.evaluate(() => {
    const title = [...document.querySelectorAll(".zone-title")].find(el => el.textContent === "Digital Resilience");
    const r = title.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    return {
      x, y,
      tag: top?.tagName || "",
      cls: top?.getAttribute?.("class") || "",
      pillar: top?.getAttribute?.("data-pillar") || ""
    };
  });
  if (!/zone-header-hit/.test(hit.cls) || hit.pillar !== "resilience") {
    errors.push(`title is blocked by ${hit.tag}.${hit.cls} (${hit.pillar})`);
  }

  await page.mouse.click(hit.x, hit.y);
  await page.waitForTimeout(400);
  const focused = await page.evaluate(() => ({
    focus: document.body.classList.contains("pillar-focus"),
    hot: document.querySelector(".zone-resilience")?.className?.baseVal || ""
  }));
  if (!focused.focus) errors.push("clicking the title did not focus the pillar");
  if (!/zone-hot/.test(focused.hot)) errors.push(`resilience zone not hot (${focused.hot})`);

  if (errors.length) {
    console.error("FAIL:", errors.join("; "));
    process.exit(1);
  }
  console.log("PASS: Digital Resilience title opens the pillar");
} finally {
  await browser.close();
}
