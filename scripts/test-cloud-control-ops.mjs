#!/usr/bin/env node
/** Cloud Control ops — panel section, briefing handoff, and briefing page render. */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const errors = [];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on("pageerror", e => errors.push(`app pageerror: ${e.message}`));

  await page.goto(`file://${path.join(root, "cisco-portfolio-navigator.html")}`, {
    waitUntil: "load",
    timeout: 60000
  });
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION && window.__cpnOps, { timeout: 60000 });

  // Ops model sanity
  const model = await page.evaluate(() => {
    const o = window.__cpnOps;
    const rs = o.getOpsProfile("room-systems");
    return {
      hasRoom: o.hasOps("room-systems"),
      hasBogus: o.hasOps("not-a-family"),
      roomScenario: rs?.scenarioData?.id || null,
      scenarioCount: o.scenariosForFamilies(["room-systems", "sdwan"]).length
    };
  });
  if (!model.hasRoom) errors.push("ops model missing room-systems");
  if (model.hasBogus) errors.push("ops model should return false for unknown family");
  if (!model.roomScenario) errors.push("room-systems has no scenario data");
  if (model.scenarioCount < 1) errors.push("scenariosForFamilies returned nothing");

  // Inject the ops section into a fresh panel body and verify it renders.
  const details = await page.evaluate(() => {
    const pb = document.getElementById("pbody");
    pb.innerHTML = "";
    pb.dataset.lastId = "room-systems";
    pb.dataset.lastKind = "node";
    window.insertCloudControlOps("room-systems", "node");
    const sec = pb.querySelector(".p-ops");
    return sec ? {
      hasBtn: !!sec.querySelector("[data-cc-open]"),
      domains: sec.querySelectorAll(".p-ops-domain").length,
      family: sec.dataset.familyId,
      hasScenario: !!sec.querySelector(".p-ops-scn-title")
    } : null;
  });
  if (!details) {
    errors.push("Operations · Cloud Control section did not render in panel");
  } else {
    if (!details.hasBtn) errors.push("ops section missing briefing button");
    if (!details.domains) errors.push("ops section missing domain tags");
    if (details.family !== "room-systems") errors.push(`ops section wrong family: ${details.family}`);
    if (!details.hasScenario) errors.push("ops section missing scenario title");
  }

  // Verify the briefing handoff builds a valid payload.
  const brief = await page.evaluate(() => window.buildCloudControlBrief("room-systems"));
  if (!brief) errors.push("buildCloudControlBrief returned nothing");
  else {
    if (brief.focusFamily !== "room-systems") errors.push(`brief focusFamily wrong: ${brief.focusFamily}`);
    if (!Array.isArray(brief.items)) errors.push("brief.items missing");
    if (!Array.isArray(brief.pillars)) errors.push("brief.pillars missing");
    if (!brief.account) errors.push("brief.account missing");
  }

  // Load the AI Canvas board directly (demo fallback path) and verify it renders.
  const bp = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  bp.on("pageerror", e => errors.push(`briefing pageerror: ${e.message}`));
  await bp.goto(`file://${path.join(root, "cloud-control-briefing.html")}?focus=room-systems`, {
    waitUntil: "load",
    timeout: 30000
  });
  await bp.waitForSelector("#cc-board .cc-w", { timeout: 10000 });

  const rendered = await bp.evaluate(() => ({
    widgets: document.querySelectorAll("#cc-board .cc-w").length,
    tables: document.querySelectorAll("#cc-board .cc-tbl").length,
    chart: document.querySelectorAll("#cc-board .cc-chart").length,
    topo: document.querySelectorAll("#cc-board .cc-topo").length,
    tiles: document.querySelectorAll("#cc-board .cc-tile").length,
    stacks: document.querySelectorAll("#cc-board .cc-stack-row").length,
    badges: document.querySelectorAll("#cc-board .cc-badge").length,
    tabs: document.querySelectorAll("#cc-tabs .cc-tab").length,
    collab: document.querySelectorAll("#cc-collab .cc-av").length,
    composer: !!document.getElementById("cc-input")
  }));
  if (rendered.widgets < 6) errors.push(`expected >=6 widgets, got ${rendered.widgets}`);
  if (rendered.tables < 2) errors.push(`expected data tables, got ${rendered.tables}`);
  if (rendered.chart < 1) errors.push("no path-health chart rendered");
  if (rendered.topo < 1) errors.push("no topology widget rendered");
  if (rendered.tiles < 4) errors.push("no anomaly stat tiles rendered");
  if (rendered.stacks < 1) errors.push("no threat stacked bars rendered");
  if (rendered.badges < 6) errors.push("category badges missing");
  if (rendered.tabs < 6) errors.push("product nav tabs missing");
  if (rendered.collab < 2) errors.push("collaborator avatars missing");
  if (!rendered.composer) errors.push("assistant composer missing");

  // Assistant summary streams into the thread.
  await bp.waitForFunction(() => {
    const m = document.querySelector("#cc-thread .cc-msg-body p");
    return m && /network is healthy|Recommendation/i.test(document.querySelector("#cc-thread").textContent);
  }, { timeout: 8000 }).catch(() => errors.push("assistant summary did not render"));

  // Board switcher opens and lists scenario boards.
  await bp.click("#cc-dash");
  const boards = await bp.evaluate(() => document.querySelectorAll("#cc-boardmenu .cc-boardmenu-item").length);
  if (boards < 1) errors.push("board switcher menu empty");

  if (errors.length) {
    console.error("FAIL test-cloud-control-ops:");
    errors.forEach(e => console.error(" -", e));
    process.exit(1);
  }
  console.log("OK test-cloud-control-ops");
} finally {
  await browser.close();
}
