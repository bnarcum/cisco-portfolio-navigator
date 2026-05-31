import { chromium } from "playwright";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
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

let exitCode = 0;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.click('#vm-seg button[data-vm="spatial"]');
  await page.waitForTimeout(2500);

  const debug = await page.evaluate(() => ({
    viewMode: window.getViewMode?.(),
    active: document.getElementById("spatial-wrap")?.style.display,
    lastErr: window.__spatialLastErr,
  }));
  console.log("Debug:", debug);

  const toast = await page.locator("#toast.show").textContent().catch(() => "");
  const spatialVisible = await page.locator("#spatial-wrap").evaluate(el => el.style.display !== "none");
  const hasCanvas = await page.locator("#spatial-graph canvas").count();
  const forceGraph = await page.evaluate(() => typeof window.ForceGraph3D === "function");

  console.log("ForceGraph3D loaded:", forceGraph);
  console.log("Spatial wrap visible:", spatialVisible);
  console.log("WebGL canvas count:", hasCanvas);
  if (toast) console.log("Toast:", toast);

  if (toast && toast.includes("failed") || toast.includes("could not")) {
    console.error("FAIL: error toast shown");
    exitCode = 1;
  } else if (!spatialVisible || hasCanvas < 1) {
    console.error("FAIL: spatial view did not render");
    exitCode = 1;
  } else if (errors.length) {
    console.warn("WARN: console errors:", errors.slice(0, 5));
  } else {
    console.log("PASS: Spatial view loaded with WebGL canvas");
  }
} finally {
  await browser.close();
  server.kill();
}
process.exit(exitCode);
