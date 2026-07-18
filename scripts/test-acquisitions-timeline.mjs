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

const searchResults = await page.locator("#acq-search-results").getAttribute("role");
if (searchResults !== "listbox") errors.push(`search results role: ${searchResults}`);

const compactFilters = await page.evaluate(() => ({
  buttonExpanded: document.querySelector("#acq-filter-btn")?.getAttribute("aria-expanded"),
  menuRole: document.querySelector("#acq-filter-menu")?.getAttribute("role"),
  exposedChips: document.querySelectorAll("#acq-head .acq-filter-chip").length,
  period: document.querySelector("#acq-current-period")?.textContent.trim(),
}));
if (compactFilters.buttonExpanded !== "false") errors.push("filter button missing collapsed state");
if (compactFilters.menuRole !== "menu") errors.push(`filter menu role: ${compactFilters.menuRole}`);
if (compactFilters.exposedChips) errors.push("legacy filter chips remain exposed");
if (!compactFilters.period) errors.push("sticky temporal context was empty");

await page.click("#acq-filter-btn");
if (await page.locator("#acq-filter-menu").isHidden()) errors.push("filter menu did not open");
await page.click('#acq-filter-menu [data-acq-filter="featured"]');
const activeFilter = await page.locator("#acq-filter-btn").textContent();
if (!activeFilter.includes("Megadeals")) errors.push(`active filter label: ${activeFilter}`);

const excludedSearch = await page.evaluate(() => {
  const api = window.CPN_AcquisitionTimeline;
  return window.CPN_ACQUISITIONS.acquisitions.find(acq =>
    !acq.featured && api.searchAcquisitions(acq.company)[0]?.id === acq.id);
});
await page.fill("#acq-search", excludedSearch.company);
await page.keyboard.press("Enter");
await page.waitForTimeout(100);
const searchSelection = await page.evaluate(() => ({
  state: window.CPN_AcquisitionTimeline.testState(),
  filterLabel: document.querySelector("#acq-filter-btn")?.textContent,
  activeId: document.activeElement?.dataset?.id,
  activeVisible: Boolean(document.activeElement?.getClientRects().length),
}));
if (searchSelection.state.focusedId !== excludedSearch.id) {
  errors.push(`filtered search focus: ${searchSelection.state.focusedId}`);
}
if (!searchSelection.filterLabel.includes("All")) {
  errors.push(`filtered search retained filter: ${searchSelection.filterLabel}`);
}
if (!searchSelection.state.visibleIds.includes(excludedSearch.id)) {
  errors.push("filtered search selection was unreachable");
}
if (searchSelection.activeId !== excludedSearch.id || !searchSelection.activeVisible) {
  errors.push(`search focus restoration: ${searchSelection.activeId}`);
}

await page.click("#acq-filter-btn");
await page.keyboard.press("ArrowDown");
let menuFocus = await page.evaluate(() => document.activeElement?.dataset?.acqFilter);
if (menuFocus !== "featured") errors.push(`filter ArrowDown focus: ${menuFocus}`);
await page.keyboard.press("End");
const lastFilter = await page.evaluate(() =>
  [...document.querySelectorAll("#acq-filter-menu [data-acq-filter]")].at(-1)?.dataset.acqFilter);
menuFocus = await page.evaluate(() => document.activeElement?.dataset?.acqFilter);
if (menuFocus !== lastFilter) errors.push(`filter End focus: ${menuFocus}`);
await page.keyboard.press("Home");
menuFocus = await page.evaluate(() => document.activeElement?.dataset?.acqFilter);
if (menuFocus !== "all") errors.push(`filter Home focus: ${menuFocus}`);
await page.keyboard.press("ArrowUp");
menuFocus = await page.evaluate(() => document.activeElement?.dataset?.acqFilter);
if (menuFocus !== lastFilter) errors.push(`filter ArrowUp wrap: ${menuFocus}`);
await page.keyboard.press("Escape");
if (!(await page.locator("#acq-filter-menu").isHidden())) errors.push("Escape did not close filter menu");
if (await page.evaluate(() => document.activeElement?.id) !== "acq-filter-btn") {
  errors.push("filter Escape did not restore button focus");
}

await page.click("#acq-filter-btn");
await page.keyboard.press("End");
await page.keyboard.press("Enter");
const selectedFilter = await page.evaluate(() =>
  document.querySelector('#acq-filter-menu [aria-checked="true"]')?.dataset.acqFilter);
if (await page.evaluate(() => document.activeElement?.id) !== "acq-filter-btn") {
  errors.push("filter selection did not restore button focus");
}
const filteredBounds = await page.evaluate(filter => {
  const list = window.CPN_ACQUISITIONS.acquisitions
    .filter(acq => acq.era === filter)
    .sort((a, b) => a.announced.localeCompare(b.announced) || a.id.localeCompare(b.id));
  return { first: list[0]?.id, last: list.at(-1)?.id };
}, selectedFilter);
await page.click("#acq-next");
let focused = await page.evaluate(() => window.CPN_AcquisitionTimeline.testState().focusedId);
if (focused !== filteredBounds.first) errors.push(`filtered next boundary: ${focused}`);
await page.click("#acq-prev");
focused = await page.evaluate(() => window.CPN_AcquisitionTimeline.testState().focusedId);
if (focused !== filteredBounds.last) errors.push(`filtered previous wrap: ${focused}`);
await page.waitForFunction(id => document.activeElement?.dataset?.id === id, filteredBounds.last);
if (await page.evaluate(() => document.activeElement?.dataset?.id) !== filteredBounds.last) {
  errors.push("previous navigation did not restore card focus");
}

await page.click("#acq-filter-btn");
await page.click('#acq-filter-menu [data-acq-filter="all"]');
await page.fill("#acq-search", "Meraki");
await page.keyboard.press("Enter");
await page.locator("#acq-focus-clear").evaluate(el => el.click());
await page.evaluate(() => window.CPN_AcquisitionTimeline.setZoom(2.4));
await page.locator("#acq-canvas").evaluate(el => {
  const yearMin = 1993;
  const zoom = 2.4;
  el.scrollLeft = (2012 - yearMin) * 72 * zoom + 120 - el.clientWidth / 2;
});
await page.waitForFunction(() =>
  document.querySelector('.acq-overflow-marker[aria-label*="2012"]'));
await page.locator('.acq-overflow-marker[aria-label*="2012"]').evaluate(el => el.click());
await page.waitForFunction(() => window.CPN_AcquisitionTimeline.testState().expandedYear === 2012);
const crossYear = await page.evaluate(() => {
  const list = window.CPN_ACQUISITIONS.acquisitions
    .slice().sort((a, b) => a.announced.localeCompare(b.announced) || a.id.localeCompare(b.id));
  const currentIndex = list.map(acq => acq.announced.slice(0, 4)).lastIndexOf("2012");
  return { current: list[currentIndex].id, next: list[currentIndex + 1].id };
});
await page.locator(`.acq-card[data-id="${crossYear.current}"]`).evaluate(el => el.click());
await page.click("#acq-next");
const crossYearReached = await page.waitForFunction(id => {
  const state = window.CPN_AcquisitionTimeline.testState();
  return state.focusedId === id && state.visibleIds.includes(id) &&
    document.activeElement?.dataset?.id === id;
}, crossYear.next, { timeout: 3000 }).then(() => true, () => false);
const crossYearState = await page.evaluate(() => window.CPN_AcquisitionTimeline.testState());
if (!crossYearReached) {
  const activeId = await page.evaluate(() => document.activeElement?.dataset?.id);
  errors.push(`cross-year reachability: ${crossYearState.focusedId}/${activeId}`);
}
if (crossYearState.expandedYear != null) {
  errors.push(`cross-year navigation retained tray: ${crossYearState.expandedYear}`);
}

await page.locator("#acq-canvas").evaluate(el => {
  const rawYear = 2012.75;
  el.scrollLeft = (rawYear - 1993) * 72 * 2.4 + 120 - el.clientWidth / 2;
  el.dispatchEvent(new Event("scroll"));
});
await page.waitForTimeout(100);
const exactPeriod = await page.locator("#acq-current-period").textContent();
if (exactPeriod.trim() !== "2012") errors.push(`centered temporal year: ${exactPeriod}`);

const accessibility = await page.evaluate(() => {
  const marker = document.querySelector(".acq-year-marker, .acq-overflow-marker");
  const card = document.querySelector(".acq-card");
  return {
    markerRole: marker?.getAttribute("role"),
    markerTabIndex: marker?.tabIndex,
    markerLabel: marker?.getAttribute("aria-label"),
    cardRole: card?.getAttribute("role"),
    cardTabIndex: card?.tabIndex,
    cardLabel: card?.getAttribute("aria-label"),
  };
});
if (accessibility.markerRole && accessibility.markerRole !== "button") {
  errors.push(`marker role: ${accessibility.markerRole}`);
}
if (accessibility.markerTabIndex != null && accessibility.markerTabIndex !== 0) {
  errors.push(`marker tabindex: ${accessibility.markerTabIndex}`);
}
if (accessibility.markerRole && !accessibility.markerLabel) errors.push("marker label missing");
if (accessibility.cardRole && accessibility.cardRole !== "button") {
  errors.push(`card role: ${accessibility.cardRole}`);
}
if (accessibility.cardTabIndex != null && accessibility.cardTabIndex !== 0) {
  errors.push(`card tabindex: ${accessibility.cardTabIndex}`);
}
if (accessibility.cardRole && !accessibility.cardLabel) errors.push("card label missing");

const badVerified = await page.evaluate(() =>
  window.CPN_ACQUISITIONS.acquisitions.some(acq =>
    acq.visualIdentity?.kind === "verified-logo" &&
    acq.visualIdentity?.source === "favicon-png")
);
if (badVerified) errors.push("unverified favicon rendered as verified logo");
const incompleteIdentity = await page.evaluate(() =>
  window.CPN_ACQUISITIONS.acquisitions.some(acq =>
    !acq.visualIdentity?.kind || !acq.visualIdentity?.source || !acq.visualIdentity?.path)
);
if (incompleteIdentity) errors.push("dataset identity provenance incomplete");

await page.click("#acq-close");
await page.click("#tools-acquisitions");
await page.click("#acq-close");
const closeFocus = await page.evaluate(() => ({
  id: document.activeElement?.id,
  visible: Boolean(document.activeElement?.getClientRects().length),
}));
if (closeFocus.id !== "tools-acquisitions" || !closeFocus.visible) {
  errors.push(`close focus restoration: ${closeFocus.id}`);
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
