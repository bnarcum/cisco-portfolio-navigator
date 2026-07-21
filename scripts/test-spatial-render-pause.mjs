#!/usr/bin/env node
/** Spatial view pauses ForceGraph3D when leaving the view. */
import { chromium } from "playwright";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = 9876 + Math.floor(Math.random() * 1000);
const url = `http://127.0.0.1:${port}/cisco-portfolio-navigator.html`;

const server = spawn("python3", ["-m", "http.server", String(port)], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
await new Promise((resolve, reject) => {
  server.on("error", reject);
  setTimeout(resolve, 400);
});

const WEBGL_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
let exitCode = 0;
const browser = await chromium.launch({ args: WEBGL_ARGS });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => { throw new Error(e.message); });

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.click('#vm-seg button[data-vm="spatial"]');
  await page.waitForTimeout(3500);

  const running = await page.evaluate(() => window.__cpnSpatialRenderState?.());
  await page.click('#vm-seg button[data-vm="families"]');
  await page.waitForTimeout(500);
  const afterExit = await page.evaluate(() => window.__cpnSpatialRenderState?.());

  const fails = [];
  if (!running?.active || running.paused) fails.push(`expected active render in spatial, got ${JSON.stringify(running)}`);
  if (afterExit?.active) fails.push("spatialState.active should be false after exit");
  if (!afterExit?.paused) fails.push(`render should be paused after exit, got ${JSON.stringify(afterExit)}`);

  if (fails.length) {
    console.error("FAIL:", fails.join("; "));
    exitCode = 1;
  } else {
    console.log("PASS: Spatial render pauses when leaving the view");
  }
} finally {
  await browser.close();
  server.kill();
}
process.exit(exitCode);
