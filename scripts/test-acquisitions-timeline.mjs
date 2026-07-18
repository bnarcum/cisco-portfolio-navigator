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
if (explore.anchorYear !== 2012) errors.push(`anchor year: ${explore.anchorYear}`);

await page.evaluate(() => window.CPN_AcquisitionTimeline.setZoom(2.4));
await page.waitForFunction(() =>
  window.CPN_AcquisitionTimeline.testState().zoom === 2.4 &&
  document.querySelector('.acq-overflow-marker[aria-label*="2012"]'));
const maxZoom = await page.evaluate(() => window.CPN_AcquisitionTimeline.testState());
if (maxZoom.overlapCount !== 0) errors.push(`max-zoom marker overlaps: ${maxZoom.overlapCount}`);
if (maxZoom.overflowMarkers === 0) errors.push("max zoom had no overflow marker to test");

const initialExploreScroll = await page.locator("#acq-canvas").evaluate(el => el.scrollLeft);
const mountedBeforeScroll = maxZoom.mountedIds.join(",");
await page.locator("#acq-canvas").evaluate(el => {
  el.scrollLeft = el.scrollWidth - el.clientWidth;
});
await page.waitForFunction(before =>
  window.CPN_AcquisitionTimeline.testState().mountedIds.join(",") !== before,
mountedBeforeScroll);
const scrolled = await page.evaluate(() => {
  const state = window.CPN_AcquisitionTimeline.testState();
  const canvas = document.querySelector("#acq-canvas").getBoundingClientRect();
  const allVisible = [...document.querySelectorAll(".acq-card")]
    .filter(card => state.visibleIds.includes(card.dataset.id))
    .every(card => {
      const rect = card.getBoundingClientRect();
      return rect.left < canvas.right && rect.right > canvas.left &&
        rect.top < canvas.bottom && rect.bottom > canvas.top;
    });
  return { state, allVisible };
});
if (scrolled.state.mountedIds.join(",") === mountedBeforeScroll) {
  errors.push("scroll virtualization did not change mounted cards");
}
if (!scrolled.allVisible) errors.push("visibleIds included off-viewport cards");
if (scrolled.state.visibleIds.length >= scrolled.state.mountedIds.length) {
  errors.push("viewport visibility did not exclude buffered cards");
}
if (scrolled.state.anchorYear !== 2012) errors.push("scroll lost anchor year");

await page.locator("#acq-canvas").evaluate((el, left) => {
  el.scrollLeft = left;
}, initialExploreScroll);
await page.waitForFunction(() =>
  document.querySelector('.acq-overflow-marker[aria-label*="2012"]'));
await page.locator('.acq-overflow-marker[aria-label*="2012"]').evaluate(el => el.click());
await page.waitForFunction(() => window.CPN_AcquisitionTimeline.testState().expandedYear === 2012);
const expanded = await page.evaluate(() => ({
  state: window.CPN_AcquisitionTimeline.testState(),
  yearIds: window.CPN_ACQUISITIONS.acquisitions
    .filter(acq => acq.announced.startsWith("2012"))
    .map(acq => acq.id),
}));
const unreachable = expanded.yearIds.filter(id => !expanded.state.visibleIds.includes(id));
const previouslyOverflowed = expanded.yearIds.filter(id => !maxZoom.mountedIds.includes(id));
if (unreachable.length) errors.push(`expanded 2012 unreachable: ${unreachable.join(",")}`);
if (!previouslyOverflowed.length) errors.push("no max-zoom overflow acquisition identified");
if (expanded.state.zoom !== 2.4) errors.push(`expansion changed max zoom: ${expanded.state.zoom}`);
if (expanded.state.anchorYear !== 2012) errors.push("expansion lost anchor year");
if (expanded.state.overlapCount !== 0) errors.push(`expanded overlaps: ${expanded.state.overlapCount}`);
if (previouslyOverflowed[0]) {
  await page.locator(`.acq-card[data-id="${previouslyOverflowed[0]}"]`).evaluate(el => el.click());
  await page.waitForFunction(id =>
    window.CPN_AcquisitionTimeline.testState().focusedId === id,
  previouslyOverflowed[0]);
}

const reducedPage = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
await reducedPage.goto(`file://${html}`, { waitUntil: "load", timeout: 60000 });
await reducedPage.waitForFunction(() => window.CPN_AcquisitionTimeline?.open);
await reducedPage.evaluate(() => window.CPN_AcquisitionTimeline.open());
await reducedPage.click('.acq-year-marker[data-year="2012"]');
await reducedPage.evaluate(() => {
  const canvas = document.querySelector("#acq-canvas");
  canvas.scrollTo = options => { window.__acqScrollOptions = options; };
});
await reducedPage.click('.acq-card[data-id="meraki"]');
const reduced = await reducedPage.evaluate(() => ({
  state: window.CPN_AcquisitionTimeline.testState(),
  behavior: window.__acqScrollOptions?.behavior,
  particleTransforms: [...document.querySelectorAll(".acq-particle")]
    .map(node => node.style.transform).filter(Boolean),
  layerTransforms: [...document.querySelectorAll(".acq-layer")]
    .map(node => node.style.transform).filter(Boolean),
}));
if (!reduced.state.reducedMotion) errors.push("reduced-motion state not detected");
if (reduced.behavior !== "auto") errors.push(`reduced-motion focus behavior: ${reduced.behavior}`);
if (reduced.particleTransforms.length) errors.push("reduced-motion particles transformed");
if (reduced.layerTransforms.length) errors.push("reduced-motion layers transformed");

await browser.close();
if (errors.length) {
  console.error(`FAIL test-acquisitions-timeline\n${errors.join("\n")}`);
  process.exit(1);
}
console.log("OK test-acquisitions-timeline");
