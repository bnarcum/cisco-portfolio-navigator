#!/usr/bin/env node
/** UI polish — slim chrome, hero, refine bar, light default. */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = path.join(root, "cisco-portfolio-navigator.html");

const browser = await chromium.launch();
const errors = [];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`file://${html}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION === "2.81.0", { timeout: 60000 });

  const chrome = await page.evaluate(() => ({
    refine: !!document.getElementById("refine-toggle"),
    more: !!document.getElementById("chrome-more-btn"),
    hero: !!document.getElementById("cpn-hero"),
    actionbarHidden: getComputedStyle(document.getElementById("actionbar") || document.createElement("div")).display === "none"
      || !document.getElementById("actionbar"),
    theme: document.documentElement.getAttribute("data-theme"),
    dsPrimary: getComputedStyle(document.getElementById("design-studio-btn")).backgroundImage.includes("gradient")
  }));

  if (!chrome.refine) errors.push("refine-toggle missing");
  if (!chrome.more) errors.push("chrome-more-btn missing");
  if (!chrome.hero) errors.push("cpn-hero missing");
  if (!chrome.dsPrimary) errors.push("design-studio-btn should use gradient primary");

  await page.click("#refine-toggle");
  const refineOpen = await page.evaluate(() => !document.getElementById("refine-panel").hidden);
  if (!refineOpen) errors.push("refine panel did not open");

  await page.click("#chrome-more-btn");
  const menuOpen = await page.evaluate(() => !document.getElementById("chrome-more-menu").hidden);
  if (!menuOpen) errors.push("chrome more menu did not open");

  await page.click("#design-studio-btn");
  await page.waitForFunction(
    () => window.DesignStudio?.instance?.el?.classList.contains("open"),
    { timeout: 15000 }
  );
  await page.click("#ds-close");

  console.log(JSON.stringify({ ok: errors.length === 0, errors, chrome }, null, 2));
  if (errors.length) {
    console.error("FAIL:", errors.join("; "));
    process.exit(1);
  }
} finally {
  await browser.close();
}
