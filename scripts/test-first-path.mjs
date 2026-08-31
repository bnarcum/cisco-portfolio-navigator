#!/usr/bin/env node
/** First-path welcome, Overview hint, and job-focused chrome labels. */
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

  const first = await page.evaluate(() => {
    const fp = document.getElementById("first-path");
    const hint = document.getElementById("hint");
    return {
      version: window.__cpnV2?.APP_VERSION,
      mode: window.getViewMode?.(),
      fpHidden: fp?.hidden,
      fpTitle: document.getElementById("fp-title")?.textContent,
      actions: [...document.querySelectorAll("#first-path [data-fp]")].map((b) => b.dataset.fp),
      hint: hint?.textContent,
      labels: {
        composition: document.querySelector('#vm-seg [data-vm="composition"]')?.textContent.trim(),
        all: document.querySelector('#vm-seg [data-vm="all-products"]')?.textContent.trim(),
        spatial: document.querySelector('#vm-seg [data-vm="spatial"]')?.textContent.trim(),
        planner: document.getElementById("planner-btn")?.textContent.replace(/\s+/g, " ").trim(),
        plannerHead: document.querySelector("#ph .ph-t")?.textContent.trim()
      },
      compositionHidden: !!document.querySelector('#vm-seg [data-vm="composition"]')?.hidden,
      filtersHidden: !!document.querySelector(".actionbar-filters")?.hidden,
      plansLabel: document.getElementById("plans-btn")?.textContent.trim()
    };
  });

  if (first.version !== "3.5.63") errors.push(`expected 3.5.63, got ${first.version}`);
  if (first.mode !== "overview") errors.push(`expected overview, got ${first.mode}`);
  if (first.fpHidden) errors.push("first-path should show on a cold Overview visit");
  if (first.fpTitle !== "Where do you want to go?") errors.push(`first-path title: ${first.fpTitle}`);
  for (const act of ["pillar", "solutions", "plan", "tour", "skip"]) {
    if (!first.actions.includes(act)) errors.push(`missing first-path action ${act}`);
  }
  if (!/pillar/i.test(first.hint || "")) errors.push(`overview hint should mention a pillar, got "${first.hint}"`);
  if (first.labels.composition !== "Inside this family") errors.push(`composition label: ${first.labels.composition}`);
  if (first.labels.all !== "Everything") errors.push(`all label: ${first.labels.all}`);
  if (first.labels.spatial !== "3D map") errors.push(`spatial label: ${first.labels.spatial}`);
  if (!first.labels.planner.includes("This account")) errors.push(`planner label: ${first.labels.planner}`);
  if (first.labels.plannerHead !== "This account") errors.push(`planner head: ${first.labels.plannerHead}`);
  if (!first.compositionHidden) errors.push("composition tab should stay hidden on Overview");
  if (!first.filtersHidden) errors.push("category filters should stay hidden on Overview");
  if (first.plansLabel !== "This account") errors.push(`plans-btn default: ${first.plansLabel}`);

  await page.click('#first-path [data-fp="skip"]');
  const afterSkip = await page.evaluate(() => ({
    hidden: document.getElementById("first-path")?.hidden,
    seen: localStorage.getItem("cpn-first-path-v1"),
    hint: document.getElementById("hint")?.textContent
  }));
  if (!afterSkip.hidden) errors.push("first-path should hide after skip");
  if (afterSkip.seen !== "1") errors.push("first-path skip should persist");
  if (!/pillar/i.test(afterSkip.hint || "")) errors.push(`hint after skip: ${afterSkip.hint}`);

  await page.reload({ waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });
  const afterReload = await page.evaluate(() => document.getElementById("first-path")?.hidden);
  if (!afterReload) errors.push("first-path should stay dismissed after reload");
} finally {
  await browser.close();
}

if (errors.length) {
  console.error("FAIL test-first-path\n" + errors.join("\n"));
  process.exit(1);
}
console.log("PASS: first-path welcome, overview hint, job-focused labels");
