#!/usr/bin/env node
/** Present mode, idle chrome, and account title on the glass. */
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

  await page.goto(`file://${html}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });
  await page.waitForTimeout(400);

  const cold = await page.evaluate(() => ({
    version: window.__cpnV2?.APP_VERSION,
    present: !!window.__CPN_PRESENT_MODE,
    compositionHidden: !!document.querySelector('#vm-seg [data-vm="composition"]')?.hidden,
    filtersHidden: !!document.querySelector(".actionbar-filters")?.hidden,
    plans: document.getElementById("plans-btn")?.textContent.trim()
  }));
  if (cold.version !== "3.5.66") errors.push(`expected 3.5.66, got ${cold.version}`);
  if (cold.present) errors.push("present should be off by default");
  if (!cold.compositionHidden) errors.push("composition should be hidden on Overview");
  if (!cold.filtersHidden) errors.push("filters should be hidden on Overview");
  if (cold.plans !== "This account") errors.push(`plans default: ${cold.plans}`);

  await page.click("#present-btn");
  const on = await page.evaluate(() => {
    const vis = (id) => {
      const el = document.getElementById(id);
      return el && getComputedStyle(el).display !== "none";
    };
    return {
      present: !!window.__CPN_PRESENT_MODE,
      classOn: document.documentElement.classList.contains("cpn-present-mode"),
      stored: localStorage.getItem("cpn-present-v1"),
      label: document.getElementById("present-btn")?.textContent.trim(),
      rst: vis("rst"),
      ai: vis("ai-btn"),
      studio: vis("design-studio-btn"),
      dcloud: vis("dcloud-btn"),
      tools: vis("tools"),
      firstPath: vis("first-path"),
      everything: getComputedStyle(document.querySelector('#vm-seg [data-vm="all-products"]')).display !== "none",
      spatial: getComputedStyle(document.querySelector('#vm-seg [data-vm="spatial"]')).display !== "none",
      overview: vis("vm-seg") && document.querySelector('#vm-seg [data-vm="overview"]')?.classList.contains("active"),
      families: getComputedStyle(document.querySelector('#vm-seg [data-vm="families"]')).display !== "none",
      solutions: vis("solutions-btn"),
      guided: vis("guided-btn"),
      planner: vis("planner-btn"),
      plans: vis("plans-btn"),
      search: vis("search")
    };
  });
  if (!on.present || !on.classOn) errors.push("present toggle did not turn on");
  if (on.stored !== "1") errors.push("present should persist");
  if (on.label !== "Seller") errors.push(`present label should become Seller, got ${on.label}`);
  if (on.rst) errors.push("Reset should hide in Present");
  if (on.ai) errors.push("Ask AI should hide in Present");
  if (on.studio) errors.push("Design Studio should hide in Present");
  if (on.dcloud) errors.push("dCloud should hide in Present");
  if (on.tools) errors.push("timeline tools should hide in Present");
  if (on.firstPath) errors.push("first-path should hide in Present");
  if (on.everything) errors.push("Everything tab should hide in Present");
  if (on.spatial) errors.push("3D map tab should hide in Present");
  if (!on.overview) errors.push("Overview should stay available in Present");
  if (!on.families) errors.push("Families should stay available in Present");
  if (!on.solutions) errors.push("Solutions should stay available in Present");
  if (!on.guided) errors.push("Guided Plan should stay available in Present");
  if (!on.planner) errors.push("This account should stay available in Present");
  if (!on.plans) errors.push("plans title should stay available in Present");
  if (!on.search) errors.push("search should stay available in Present");

  await page.fill("#acct-name", "Acme");
  await page.selectOption("#prof-vert", { label: "Healthcare" }).catch(() => null);
  await page.evaluate(() => {
    const vert = document.getElementById("prof-vert");
    if (vert) {
      const opt = [...vert.options].find((o) => /healthcare/i.test(o.textContent || o.value));
      if (opt) vert.value = opt.value;
      vert.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const mode = document.getElementById("prof-mode");
    if (mode) {
      mode.value = "Hybrid";
      mode.dispatchEvent(new Event("change", { bubbles: true }));
    }
    document.getElementById("acct-name")?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const glass = await page.evaluate(() => document.getElementById("plans-btn")?.textContent.trim());
  if (glass !== "Acme · Healthcare · Hybrid") errors.push(`glass title: ${glass}`);

  const urlPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await urlPage.goto(`file://${html}?present=1`, { waitUntil: "load", timeout: 60000 });
  await urlPage.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });
  const fromUrl = await urlPage.evaluate(() => ({
    present: !!window.__CPN_PRESENT_MODE,
    room: !!window.__CPN_ROOM_MODE,
    label: document.getElementById("present-btn")?.textContent.trim()
  }));
  if (!fromUrl.present) errors.push("?present=1 should turn Present on");
  if (fromUrl.room) errors.push("?present=1 must not enable room mode");
  if (fromUrl.label !== "Seller") errors.push(`url present label: ${fromUrl.label}`);
  await urlPage.close();
} finally {
  await browser.close();
}

if (errors.length) {
  console.error("FAIL test-present-mode\n" + errors.join("\n"));
  process.exit(1);
}
console.log("PASS: present mode, idle chrome, account glass title");
