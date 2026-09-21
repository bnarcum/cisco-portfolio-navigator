#!/usr/bin/env node
/** Direct URL parameters open the requested full-screen portfolio tool. */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const appUrl = `file://${path.join(root, "index.html")}`;
const browser = await chromium.launch({ headless: true });

const cases = [
  {
    value: "refresh",
    selector: "#tl-wrap.show",
    bodyClass: "tl-open",
  },
  {
    value: "acquisitions",
    selector: "#acq-wrap.show",
    bodyClass: "acq-open",
  },
  {
    value: "design-studio",
    selector: "#design-studio.open",
    bodyClass: "design-studio-open",
  },
];

try {
  for (const testCase of cases) {
    const page = await browser.newPage();
    await page.goto(`${appUrl}?open=${testCase.value}`, { waitUntil: "load" });
    await page.waitForSelector(testCase.selector, { timeout: 15000 });
    const hasBodyClass = await page.evaluate((name) => document.body.classList.contains(name), testCase.bodyClass);
    if (!hasBodyClass) throw new Error(`${testCase.value}: missing body class ${testCase.bodyClass}`);
    await page.close();
  }

  const returningPage = await browser.newPage();
  await returningPage.addInitScript(() => {
    localStorage.setItem("cpn-app-version", "older-build");
    sessionStorage.removeItem("cpn-version-reload");
  });
  await returningPage.goto(`${appUrl}?open=refresh`, { waitUntil: "load" });
  await returningPage.waitForSelector("#tl-wrap.show", { timeout: 15000 });
  const preservedOpen = await returningPage.evaluate(() => new URLSearchParams(location.search).get("open"));
  if (preservedOpen !== "refresh") throw new Error(`cache bust removed open=refresh (got ${preservedOpen})`);
  await returningPage.close();

  console.log("PASS direct tool links");
} finally {
  await browser.close();
}
