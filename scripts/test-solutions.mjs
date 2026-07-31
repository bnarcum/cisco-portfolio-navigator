#!/usr/bin/env node
/** Validates outcome → solution stacks against live NODES, BUNDLES, and PROBLEMS. */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const htmlPath = path.join(root, "index.html");

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => window.__cpnSolutions && window.__cpnProblems, { timeout: 60000 });

  const result = await page.evaluate(() => {
    const outcomes = window.__cpnSolutions.listOutcomes();
    const problems = window.__cpnProblems.PROBLEMS.length;
    const empty = outcomes.filter(o => !o.familyCount);
    const details = outcomes.map(o => {
      const d = window.__cpnSolutions.getOutcome(o.id);
      const layerFamilies = (d?.layers || []).flatMap(l => l.rows.map(r => r.familyId));
      const missing = (d?.familyIds || []).filter(fid => !window.nodeById[fid]);
      const orphanRows = layerFamilies.filter(fid => !(d?.familyIds || []).includes(fid));
      return {
        id: o.id,
        families: d?.familyIds?.length || 0,
        layers: d?.layers?.length || 0,
        missing,
        orphanRows,
        bundle: d?.bundleName || ""
      };
    });
    const bad = details.filter(d => d.missing.length || d.orphanRows.length || !d.families);
    return { problems, outcomeCount: outcomes.length, bad, sample: details.slice(0, 5) };
  });

  if (result.bad.length) {
    console.error("FAIL test-solutions", JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(`OK test-solutions (${result.outcomeCount} outcomes from ${result.problems} problems)`);
} finally {
  await browser.close();
}
