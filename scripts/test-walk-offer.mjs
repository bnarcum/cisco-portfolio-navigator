#!/usr/bin/env node
/** Intent screen offers a sample walk when empty, and walks a saved room design without regenerating. */
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
  await page.evaluate(() => localStorage.removeItem("cpn-design-studio-v4"));
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });
  const version = await page.evaluate(() => window.__cpnV2.APP_VERSION);
  if (version !== "3.5.89") errors.push(`expected 3.5.89, got ${version}`);

  await page.click("#design-studio-btn");
  await page.waitForSelector("#design-studio.open", { timeout: 30000 });
  await page.waitForSelector("#ds-walk-offer", { timeout: 10000 });

  const empty = await page.evaluate(() => {
    const btn = document.getElementById("ds-walk-offer");
    return { hidden: btn.hidden, text: btn.textContent, mode: btn.dataset.walkMode };
  });
  if (empty.hidden) errors.push("sample walk should show on an empty brief");
  if (empty.text !== "Walk a sample workplace") errors.push(`empty label: ${empty.text}`);
  if (empty.mode !== "sample") errors.push(`empty mode: ${empty.mode}`);

  await page.fill("#ds-intent-text", "A campus refresh");
  await page.waitForTimeout(250);
  const typed = await page.evaluate(() => document.getElementById("ds-walk-offer").hidden);
  if (!typed) errors.push("sample walk should hide once the brief has text");

  await page.fill("#ds-intent-text", "");
  await page.waitForTimeout(250);
  const cleared = await page.evaluate(() => {
    const btn = document.getElementById("ds-walk-offer");
    return { hidden: btn.hidden, mode: btn.dataset.walkMode };
  });
  if (cleared.hidden || cleared.mode !== "sample") errors.push("sample walk should return when the brief is cleared");

  await page.evaluate(() => document.querySelector("#ds-one-cisco-deck [data-pillar='workplaces']")?.click());
  await page.click("#ds-generate");
  await page.waitForFunction(() => (window.DesignStudio?.instance?.design?.rooms?.length || 0) > 0, { timeout: 30000 });
  const drafted = await page.evaluate(() => {
    const offer = document.getElementById("ds-walk-offer");
    const walk = document.querySelector("#ds-rationale-cta [data-goto='walk']");
    const rooms = document.querySelector("#ds-rationale-cta [data-goto='room']");
    return {
      offerHidden: offer.hidden,
      walk: walk?.textContent || "",
      walkPrimary: walk?.classList.contains("primary") || false,
      roomsPrimary: rooms?.classList.contains("primary") || false
    };
  });
  if (!drafted.offerHidden) errors.push("row walk button should hide while the draft bar is open");
  if (drafted.walk !== "Walk this design") errors.push(`cta walk: ${drafted.walk}`);
  if (!drafted.walkPrimary) errors.push("Walk this design should be the primary draft action");
  if (drafted.roomsPrimary) errors.push("View rooms should not stay the primary action");

  await page.click("#ds-rationale-cta [data-goto='walk']");
  await page.waitForFunction(() => window.__DS_WALK?.isOpen?.(), { timeout: 60000 });
  const walking = await page.evaluate(() => window.__DS_WALK?.isOpen?.() && window.DesignStudio?.instance?.tab === "room");
  if (!walking) errors.push("Walk this design should open the room walk");

  await page.evaluate(() => window.__DS_WALK?.close?.(true));
  await page.evaluate(() => window.DesignStudio?.close?.());
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });
  await page.click("#design-studio-btn");
  await page.waitForSelector("#design-studio.open");
  const saved = await page.evaluate(() => {
    const btn = document.getElementById("ds-walk-offer");
    const notes = window.DesignStudio?.instance?.design?.requirements?.notes || "";
    return { hidden: btn.hidden, text: btn.textContent, mode: btn.dataset.walkMode, notes };
  });
  if (saved.hidden || saved.text !== "Walk this design" || saved.mode !== "design") {
    errors.push(`reopen offer: hidden=${saved.hidden} text=${saved.text} mode=${saved.mode}`);
  }
  const roomsBefore = await page.evaluate(() => window.DesignStudio.instance.design.rooms.length);
  await page.click("#ds-walk-offer");
  await page.waitForTimeout(200);
  const roomsAfter = await page.evaluate(() => window.DesignStudio.instance.design.rooms.length);
  if (roomsBefore !== roomsAfter) errors.push("Walk this design regenerated the rooms");

  if (errors.length) {
    console.error("FAIL:", errors.join("; "));
    process.exit(1);
  }
  console.log("PASS: walk offer");
} finally {
  await browser.close();
}
