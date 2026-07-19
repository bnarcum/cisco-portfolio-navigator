#!/usr/bin/env node
/** Solutions by use case — catalog modal, detail panel, REF_ARCH roles enrichment. */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const errors = [];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  page.on("pageerror", e => errors.push(`app pageerror: ${e.message}`));

  await page.goto(`file://${path.join(root, "cisco-portfolio-navigator.html")}`, {
    waitUntil: "load",
    timeout: 60000
  });
  await page.waitForFunction(
    () => window.__cpnSolutions && window.__cpnV2?.APP_VERSION === "3.5.11",
    { timeout: 60000 }
  );

  const meta = await page.evaluate(() => {
    const RA = window.__cpnV2.REF_ARCH;
    return {
      ucCount: window.__cpnSolutions.catalogEntry("Hybrid Work")?.familyCount > 0,
      hybridRoles: RA["Hybrid Work"]?.roles?.length || 0,
      contactCenter: !!RA["Contact Center"]?.products?.length,
      threatDet: !!RA["Threat Detection & Response"]?.roles?.length,
      cloudMig: !!RA["Cloud Migration"]?.products?.length,
      zeroTrustOutcome: !!RA["Zero Trust Security"]?.outcome,
      btn: !!document.getElementById("solutions-btn"),
    };
  });
  if (!meta.btn) errors.push("solutions button missing");
  if (!meta.ucCount) errors.push("catalog entry missing family count");
  if (meta.hybridRoles < 5) errors.push(`Hybrid Work roles too few: ${meta.hybridRoles}`);
  if (!meta.contactCenter) errors.push("Contact Center REF_ARCH not enriched");
  if (!meta.threatDet) errors.push("Threat Detection REF_ARCH not enriched");
  if (!meta.cloudMig) errors.push("Cloud Migration REF_ARCH not enriched");
  if (!meta.zeroTrustOutcome) errors.push("Zero Trust outcome missing");

  const catalog = await page.evaluate(async () => {
    window.__cpnSolutions.openCatalog();
    await new Promise(r => setTimeout(r, 120));
    const ov = document.getElementById("solutions-ov");
    const cards = ov?.querySelectorAll(".uc-card").length || 0;
    return { open: ov?.classList.contains("open"), cards };
  });
  if (!catalog.open) errors.push("solutions catalog did not open");
  if (catalog.cards < 11) errors.push(`expected >=11 use case cards, got ${catalog.cards}`);

  const detail = await page.evaluate(async () => {
    const card = [...document.querySelectorAll(".uc-card")].find(c => /Hybrid Work/i.test(c.textContent));
    card?.click();
    await new Promise(r => setTimeout(r, 150));
    const panel = document.getElementById("solutions-detail");
    const stackItems = panel?.querySelectorAll(".sd-stack-item").length || 0;
    const hasWebex = /Webex App/i.test(panel?.textContent || "");
    document.getElementById("sd-graph")?.click();
    await new Promise(r => setTimeout(r, 80));
    const badge = document.getElementById("refarch-badge")?.classList.contains("show");
    return {
      panelOpen: panel?.classList.contains("open"),
      stackItems,
      hasWebex,
      refArchBadge: badge
    };
  });
  if (!detail.panelOpen) errors.push("detail panel did not open");
  if (detail.stackItems < 5) errors.push(`detail stack items too few: ${detail.stackItems}`);
  if (!detail.hasWebex) errors.push("Hybrid Work stack missing Webex App");
  if (!detail.refArchBadge) errors.push("Show on graph did not activate refarch badge");

  const familyTag = await page.evaluate(async () => {
    window.__cpnSolutions.closeDetail();
    window.__cpnSolutions.closeCatalog();
    await new Promise(r => setTimeout(r, 80));
    const fam = window.nodeById?.sdwan;
    if (fam && typeof showDetailPanel === "function") showDetailPanel(fam);
    await new Promise(r => setTimeout(r, 200));
    const tag = [...document.querySelectorAll("#pbody .tg")].find(t => /SD-WAN \/ SASE/i.test(t.textContent));
    if (!tag) return { detailOpen: false, ucs: "", noTag: true };
    tag.click();
    await new Promise(r => setTimeout(r, 150));
    return {
      detailOpen: document.getElementById("solutions-detail")?.classList.contains("open"),
      ucs: document.getElementById("ucs")?.value || "",
      noTag: false
    };
  });
  if (familyTag.noTag) errors.push("family panel use case tag not found");
  if (!familyTag.detailOpen) errors.push("family use case tag did not open detail panel");
  if (!familyTag.ucs.includes("SD-WAN")) errors.push("use case filter not set from family tag");

} catch (e) {
  errors.push(`fatal: ${e.message}`);
} finally {
  await browser.close();
}

if (errors.length) {
  console.error("❌ solutions test FAILED:\n - " + errors.join("\n - "));
  process.exit(1);
}
console.log("✅ solutions test passed");
