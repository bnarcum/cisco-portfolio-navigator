#!/usr/bin/env node
/** One Cisco Story Mode: launch, step through beats, verify state + clean exit. */
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
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });

  const themeBefore = await page.evaluate(() =>
    document.documentElement.getAttribute("data-theme"));

  const hasBtn = await page.evaluate(() => !!document.getElementById("story-btn"));
  if (!hasBtn) errors.push("missing #story-btn launch button");
  const autoShown = await page.evaluate(() =>
    document.getElementById("story-overlay")?.classList.contains("show"));
  if (autoShown) errors.push("story overlay should not auto-launch");

  await page.click("#story-btn");
  await page.waitForTimeout(300);
  const shown = await page.evaluate(() =>
    document.getElementById("story-overlay")?.classList.contains("show"));
  if (!shown) errors.push("story overlay did not show after button click");

  const themeAfterStart = await page.evaluate(() =>
    document.documentElement.getAttribute("data-theme"));
  if (themeAfterStart !== themeBefore) errors.push("story should not change theme");

  const chromeHidden = await page.evaluate(() =>
    document.body.classList.contains("story-open"));
  if (!chromeHidden) errors.push("story did not add body.story-open");

  const startBeat = await page.evaluate(() => window.__storyBeat);
  if (startBeat !== 0) errors.push(`expected start beat 0, got ${startBeat}`);

  // Beat 1 → overview tool beat.
  await page.keyboard.press("ArrowRight"); await page.waitForTimeout(200);
  const beat1 = await page.evaluate(() => ({
    beat: window.__storyBeat,
    tool: document.getElementById("story-overlay")?.classList.contains("tool"),
    view: window.getViewMode && window.getViewMode()
  }));
  if (beat1.beat !== 1) errors.push(`expected beat 1, got ${beat1.beat}`);
  if (!beat1.tool) errors.push("beat 1 should be a tool beat");
  if (beat1.view !== "overview") errors.push(`beat 1 expected overview, got ${beat1.view}`);

  // Beat 2 → families (disconnected narrative).
  await page.keyboard.press("ArrowRight"); await page.waitForTimeout(400);
  const famView = await page.evaluate(() => window.getViewMode && window.getViewMode());
  if (famView !== "families") errors.push(`beat 2 expected families view, got ${famView}`);

  // Beat 3 → Hybrid Work reference architecture.
  await page.keyboard.press("ArrowRight"); await page.waitForTimeout(500);
  const refArchUC = await page.evaluate(() => document.getElementById("ucs")?.value);
  if (refArchUC !== "Hybrid Work") errors.push(`beat 3 expected Hybrid Work UC, got ${refArchUC}`);

  // No abstract scene elements.
  const hasScene = await page.evaluate(() => !!document.getElementById("story-scene"));
  if (hasScene) errors.push("abstract story-scene should be removed");

  // Captions toggle.
  await page.keyboard.press("c"); await page.waitForTimeout(120);
  const capsOn = await page.evaluate(() =>
    document.getElementById("story-overlay")?.classList.contains("captions"));
  if (!capsOn) errors.push("captions toggle (c) did not enable captions");

  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  const afterExit = await page.evaluate(() => ({
    shown: document.getElementById("story-overlay")?.classList.contains("show"),
    open: document.body.classList.contains("story-open"),
    uc: document.getElementById("ucs")?.value,
    theme: document.documentElement.getAttribute("data-theme")
  }));
  if (afterExit.shown) errors.push("overlay still shown after Esc");
  if (afterExit.open) errors.push("body.story-open not cleared after Esc");
  if (afterExit.uc) errors.push(`use case not restored after exit (got "${afterExit.uc}")`);
  if (afterExit.theme !== themeBefore) errors.push("theme not preserved after exit");

  await page.click("#story-btn"); await page.waitForTimeout(200);
  const relaunch = await page.evaluate(() =>
    document.getElementById("story-overlay")?.classList.contains("show"));
  if (!relaunch) errors.push("story failed to re-launch after exit");

} catch (e) {
  errors.push(`exception: ${e.message}`);
} finally {
  await browser.close();
}

if (errors.length) {
  console.error("FAIL test-story-mode:\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log("PASS test-story-mode");
