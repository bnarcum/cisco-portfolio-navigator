#!/usr/bin/env node
/** Floating tabbed detail panel — layout + tabs + outcome teaser. */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const errors = [];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(`file://${path.join(root, "cisco-portfolio-navigator.html")}`, {
    waitUntil: "load",
    timeout: 60000
  });
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });

  await page.evaluate(async () => {
    document.querySelector('[data-vm="families"]')?.click();
    await new Promise((r) => setTimeout(r, 500));
    window.jumpTo("webex-calling");
  });
  await page.waitForTimeout(900);

  const panelOpen = await page.evaluate(() => document.getElementById("panel")?.classList.contains("open"));
  if (!panelOpen) {
    await page.evaluate(() => {
      const d = window.nodeById?.["webex-calling"];
      if (d && typeof showDetailPanel === "function") {
        showDetailPanel(d);
        const pb = document.getElementById("pbody");
        if (pb) { pb.dataset.lastId = d.id; pb.dataset.lastKind = "node"; }
        window.__cpnV2?.phases?.enhanceDetailPanel?.();
      }
    });
    await page.waitForTimeout(200);
  }

  const state = await page.evaluate(() => {
    const panel = document.getElementById("panel");
    const style = panel ? getComputedStyle(panel) : null;
    const rect = panel?.getBoundingClientRect();
    const pb = document.getElementById("pbody");
    return {
      version: window.__cpnV2?.APP_VERSION,
      panelOpen: panel?.classList.contains("open"),
      hasHead: !!document.getElementById("phead")?.innerHTML.trim(),
      hasFooter: !!document.getElementById("pfooter")?.innerHTML.trim(),
      backdrop: document.getElementById("panel-backdrop")?.classList.contains("open"),
      borderRadius: style?.borderRadius,
      notFullHeight: rect ? rect.bottom < window.innerHeight - 8 : false,
      tabs: document.querySelectorAll("#phead .p-tab").length,
      overviewTeaser: !!document.querySelector(".p-outcome-teaser"),
      outcomeLabel: document.querySelector(".p-outcome-label")?.textContent || "",
      noCompetitive: !document.body.textContent.includes("Often evaluated against"),
      noProbBlock: !document.querySelector("#pbody .p-prob"),
      activeTab: pb?.dataset.activeTab || "overview"
    };
  });

  if (state.version !== "3.5.11") errors.push(`expected 3.5.11, got ${state.version}`);
  if (!state.panelOpen) errors.push("panel did not open");
  if (!state.hasHead) errors.push("missing phead content");
  if (!state.hasFooter) errors.push("missing pfooter content");
  if (state.panelOpen && !state.backdrop) errors.push("panel backdrop not open");
  if (!state.borderRadius || !/12px/.test(state.borderRadius)) errors.push(`panel should have 12px border-radius, got ${state.borderRadius}`);
  if (!state.tabs || state.tabs < 4) errors.push(`expected 4 tabs, got ${state.tabs}`);
  if (!state.overviewTeaser) errors.push("missing outcome teaser on overview");
  if (!/problem this solves/i.test(state.outcomeLabel)) errors.push("outcome label not readable");
  if (state.noCompetitive === false) errors.push("competitive row should not appear");
  if (!state.noProbBlock) errors.push("legacy p-prob block should not appear");

  await page.evaluate(() => {
    document.querySelector('#phead .p-tab[data-tab="products"]')?.click();
  });
  await page.waitForTimeout(100);
  const productsTab = await page.evaluate(() =>
    document.querySelector('.p-tab-pane[data-tab="products"]')?.classList.contains("on")
  );
  if (!productsTab) errors.push("products tab did not activate");

  console.log(JSON.stringify({ ok: errors.length === 0, state, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
