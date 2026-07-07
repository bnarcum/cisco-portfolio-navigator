#!/usr/bin/env node
/** Guided experience — mode toggle, scenario load, studio bar. */
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
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION && window.__CPN_EXPERIENCE, { timeout: 60000 });

  const classicDefault = await page.evaluate(() => window.__CPN_EXPERIENCE.getMode());
  if (classicDefault !== "classic") errors.push(`expected classic default, got ${classicDefault}`);

  const menuExists = await page.evaluate(() => !!document.getElementById("exp-menu-btn"));
  if (!menuExists) errors.push("experience menu button missing");

  await page.click("#exp-menu-btn");
  await page.click('[data-exp-mode="guided"]');
  const guidedMode = await page.evaluate(() => window.__CPN_EXPERIENCE.getMode());
  if (guidedMode !== "guided") errors.push(`expected guided mode, got ${guidedMode}`);

  await page.waitForSelector("#ge-overlay.show", { timeout: 5000 });
  await page.click('[data-persona="se"]');
  await page.click("#ge-next");
  await page.click('[data-scenario="boardroom-refresh"]');
  await page.click("#ge-next");

  await page.waitForFunction(
    () => window.DesignStudio?.instance?.el?.classList.contains("open"),
    { timeout: 15000 }
  );

  const loaded = await page.evaluate(() => {
    const ds = window.DesignStudio.instance;
    const scen = window.__CPN_EXPERIENCE.getScenario();
    return {
      scenarioId: scen?.id,
      rooms: ds.design.rooms?.length || 0,
      nodes: ds.design.nodes?.length || 0,
      bar: !!document.getElementById("ge-studio-bar") && document.getElementById("design-studio")?.classList.contains("ge-active"),
      outcome: document.getElementById("ge-outcome-text")?.textContent || ""
    };
  });

  if (loaded.scenarioId !== "boardroom-refresh") errors.push(`wrong scenario: ${loaded.scenarioId}`);
  if (loaded.rooms < 1) errors.push("boardroom scenario did not add a room");
  if (loaded.nodes < 3) errors.push(`expected devices in boardroom, got ${loaded.nodes}`);
  if (!loaded.bar) errors.push("guided studio bar not visible");
  if (!loaded.outcome) errors.push("outcome text missing");

  await page.click('[data-action="validate"]');
  const validatePanel = await page.evaluate(() => {
    const ds = window.DesignStudio.instance;
    return ds.sidebarMode === "quote" && ds.panelTab === "validate";
  });
  if (!validatePanel) errors.push("validate path step did not open validate panel");

  await page.click("#ds-close");
  await page.evaluate(() => {
    window.__CPN_EXPERIENCE.setMode("classic");
    localStorage.removeItem("cpn-experience-scenario-v1");
    localStorage.removeItem("cpn-experience-persona-v1");
  });

  console.log(JSON.stringify({ ok: errors.length === 0, errors, loaded }, null, 2));
  if (errors.length) {
    console.error("FAIL:", errors.join("; "));
    process.exit(1);
  }
} finally {
  await browser.close();
}
