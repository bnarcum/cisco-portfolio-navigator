#!/usr/bin/env node
/** Blank canvas steps back one level. An open family panel closes first. */
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
  if (await page.evaluate(() => window.__cpnV2.APP_VERSION) !== "3.5.87") errors.push("version");

  async function blankPoint() {
    return page.evaluate(() => {
      const svg = document.getElementById("gs").getBoundingClientRect();
      for (let y = svg.top + 30; y < svg.bottom - 30; y += 22) {
        for (let x = svg.left + 20; x < svg.right - 20; x += 22) {
          const top = document.elementFromPoint(x, y);
          if (top && (top.id === "gs" || top.id === "panel-backdrop")) return { x, y };
        }
      }
      return null;
    });
  }

  await page.evaluate(() => window.applyViewLevel("families"));
  await page.waitForFunction(() => document.body.classList.contains("families-mode") && document.querySelectorAll(".zone-title").length === 3, null, { timeout: 15000 });
  await page.waitForTimeout(400);

  const outside = await blankPoint();
  if (!outside) errors.push("no blank canvas point");
  else {
    await page.mouse.click(outside.x, outside.y);
    await page.waitForFunction(() => document.body.classList.contains("overview-mode"), null, { timeout: 4000 }).catch(() => {});
    if (!await page.evaluate(() => document.body.classList.contains("overview-mode"))) {
      errors.push("blank click did not return to overview");
    }
  }

  await page.evaluate(() => window.applyViewLevel("families", { focusPillar: "resilience" }));
  await page.waitForFunction(() => document.body.classList.contains("pillar-focus"), null, { timeout: 8000 });
  await page.waitForTimeout(300);
  const back = await blankPoint();
  if (!back) errors.push("no blank point on a focused pillar");
  else {
    await page.mouse.click(back.x, back.y);
    await page.waitForTimeout(500);
    const mid = await page.evaluate(() => ({
      families: document.body.classList.contains("families-mode"),
      focus: document.body.classList.contains("pillar-focus"),
      overview: document.body.classList.contains("overview-mode")
    }));
    if (!mid.families || mid.focus || mid.overview) errors.push(`focused pillar should return to all three (${JSON.stringify(mid)})`);
    const again = await blankPoint();
    if (!again) errors.push("no blank point after returning to all pillars");
    else {
      await page.mouse.click(again.x, again.y);
      await page.waitForFunction(() => document.body.classList.contains("overview-mode"), null, { timeout: 4000 }).catch(() => {});
      if (!await page.evaluate(() => document.body.classList.contains("overview-mode"))) {
        errors.push("second blank click did not return to overview");
      }
    }
  }

  await page.evaluate(() => window.applyViewLevel("families"));
  await page.waitForFunction(() => document.body.classList.contains("families-mode"), null, { timeout: 8000 });
  await page.waitForTimeout(300);
  const node = await page.evaluate(() => {
    const el = document.querySelector("g.nd");
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.click(node.x, node.y);
  await page.waitForFunction(() => document.getElementById("panel")?.classList.contains("open"), null, { timeout: 4000 }).catch(() => {});
  const panelPoint = await blankPoint();
  if (!await page.evaluate(() => document.getElementById("panel")?.classList.contains("open"))) {
    errors.push("family click did not open the panel");
  } else if (!panelPoint) {
    errors.push("no blank point while the panel is open");
  } else {
    await page.mouse.click(panelPoint.x, panelPoint.y);
    await page.waitForTimeout(250);
    const afterPanel = await page.evaluate(() => ({
      open: document.getElementById("panel")?.classList.contains("open"),
      families: document.body.classList.contains("families-mode")
    }));
    if (afterPanel.open) errors.push("blank click left the family panel open");
    if (!afterPanel.families) errors.push("closing the panel also left the families view");
  }

  if (errors.length) {
    console.error("FAIL:", errors.join("; "));
    process.exit(1);
  }
  console.log("PASS: blank space steps back one level");
} finally {
  await browser.close();
}
