#!/usr/bin/env node
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = path.join(root, "cisco-portfolio-navigator.html");
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`file://${html}`, { waitUntil: "load", timeout: 60000 });
await page.waitForFunction(() => window.CPN_AcquisitionTimeline?.open);
await page.evaluate(() => window.CPN_AcquisitionTimeline.open());
await page.waitForSelector("#acq-wrap.show");

const initial = await page.evaluate(() => window.CPN_AcquisitionTimeline.testState());
if (initial.level !== "overview") errors.push(`initial level: ${initial.level}`);
if (initial.representedCount !== initial.totalCount) {
  errors.push(`represented ${initial.representedCount}/${initial.totalCount}`);
}
if (initial.overlapCount !== 0) errors.push(`overview overlaps: ${initial.overlapCount}`);
if (initial.renderedCards >= initial.totalCount) errors.push("overview rendered every card");

await page.click('.acq-year-marker[data-year="2012"]');
await page.waitForFunction(() => window.CPN_AcquisitionTimeline.testState().level === "explore");
const explore = await page.evaluate(() => window.CPN_AcquisitionTimeline.testState());
if (!explore.visibleIds.includes("meraki")) errors.push("2012 explore missing Meraki");
if (explore.overlapCount !== 0) errors.push(`explore overlaps: ${explore.overlapCount}`);

await browser.close();
if (errors.length) {
  console.error(`FAIL test-acquisitions-timeline\n${errors.join("\n")}`);
  process.exit(1);
}
console.log("OK test-acquisitions-timeline");
