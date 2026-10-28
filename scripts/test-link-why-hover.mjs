#!/usr/bin/env node
/** Link description stays only while the pointer is over the link or the card. */
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
  await page.addInitScript(() => localStorage.setItem("cpn-first-path-v1", "1"));
  await page.goto(`file://${html}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });
  if (await page.evaluate(() => window.__cpnV2.APP_VERSION) !== "3.5.88") errors.push("version");

  await page.evaluate(() => window.applyViewLevel("families", { focusPillar: "workplaces" }));
  await page.waitForFunction(() => document.querySelectorAll("line.lh").length > 0, { timeout: 15000 });
  await page.waitForTimeout(400);

  const shown = await page.evaluate(() => {
    const lines = [...document.querySelectorAll("line.lh")];
    const line = lines.find(el => {
      const r = el.getBoundingClientRect();
      return r.width > 8 && r.left > 80 && r.top > 80 && r.right < window.innerWidth - 40 && r.bottom < window.innerHeight - 40;
    }) || lines[0];
    const r = line.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    line.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: x, clientY: y, view: window }));
    const card = document.getElementById("link-why-card");
    return { display: card.style.display, text: card.innerText, x, y };
  });
  if (shown.display !== "block") errors.push(`hover did not show card (${shown.display})`);
  if (!shown.text.trim()) errors.push("card has no description");

  await page.evaluate(() => {
    const lines = [...document.querySelectorAll("line.lh")];
    const line = lines.find(el => {
      const r = el.getBoundingClientRect();
      return r.width > 8 && r.left > 80 && r.top > 80 && r.right < window.innerWidth - 40 && r.bottom < window.innerHeight - 40;
    }) || lines[0];
    line.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    line.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, view: window }));
  });
  await page.waitForTimeout(180);
  const after = await page.evaluate(() => document.getElementById("link-why-card").style.display);
  if (after !== "none") errors.push(`card stayed after leaving the link (${after})`);

  const point = await page.evaluate(() => {
    const lines = [...document.querySelectorAll("line.lh")];
    const line = lines.find(el => {
      const r = el.getBoundingClientRect();
      return r.width > 24 && r.height > 4 && r.left > 120 && r.top > 120 && r.right < window.innerWidth - 80 && r.bottom < window.innerHeight - 80;
    });
    if (!line) return null;
    const r = line.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + Math.max(2, r.height / 2) };
  });
  if (!point) errors.push("no on-screen link to hover");
  else {
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(80);
    const live = await page.evaluate(() => document.getElementById("link-why-card").style.display);
    if (live !== "block") errors.push(`pointer hover did not show card (${live})`);
    await page.mouse.move(8, 8);
    await page.waitForTimeout(220);
    const gone = await page.evaluate(() => document.getElementById("link-why-card").style.display);
    if (gone !== "none") errors.push(`pointer leave left the card open (${gone})`);
  }

  if (errors.length) {
    console.error("FAIL:", errors.join("; "));
    process.exit(1);
  }
  console.log("PASS: link description hides when the pointer leaves");
} finally {
  await browser.close();
}
