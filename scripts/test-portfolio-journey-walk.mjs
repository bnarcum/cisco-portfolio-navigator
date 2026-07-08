#!/usr/bin/env node
/**
 * Portfolio journey walk — graph builder smoke test
 */
import { chromium } from "playwright";

const URL = process.env.CPN_URL || "http://127.0.0.1:8765/cisco-portfolio-navigator.html";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.__CPN_JOURNEY_WALK?.buildGraph && window.__cpnV2?.REF_ARCH, { timeout: 60000 });

  const result = await page.evaluate(() => {
    const uc = "Zero Trust Security";
    const arch = window.__cpnV2.REF_ARCH[uc];
    const graph = window.__CPN_JOURNEY_WALK.buildGraph({
      title: uc,
      desc: arch.desc,
      useCase: uc,
      products: arch.products
    });
    return {
      version: window.__cpnV2.APP_VERSION,
      chambers: graph?.chambers?.length || 0,
      corridors: graph?.corridors?.length || 0,
      kind: graph?.kind,
      hasWalk: typeof window.__DS_WALK?.openJourney === "function",
      hasOpen: typeof window.__cpnV2.openPortfolioJourney === "function",
      firstChamber: graph?.chambers?.[0]?.portfolioFamilyId || null
    };
  });

  await browser.close();

  const errs = [];
  if (result.version !== "2.82.0") errs.push(`version ${result.version}`);
  if (result.chambers < 5) errs.push(`chambers ${result.chambers}`);
  if (result.corridors < 5) errs.push(`corridors ${result.corridors}`);
  if (result.kind !== "portfolio-journey") errs.push(`kind ${result.kind}`);
  if (!result.hasWalk) errs.push("missing openJourney");
  if (!result.hasOpen) errs.push("missing openPortfolioJourney");
  if (!result.firstChamber) errs.push("no first chamber");

  if (errs.length) {
    console.error("FAIL portfolio-journey-walk:", errs.join("; "), result);
    process.exit(1);
  }
  console.log("OK portfolio-journey-walk", result);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
