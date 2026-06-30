#!/usr/bin/env node
/**
 * Copy Cisco Portfolio Navigator → Cisco Portfolio Navigator (production folder).
 * Rebrands, preserves production preview banner + DEVELOPING.md.
 *
 * Usage:
 *   node scripts/promote-to-production.mjs [--dry-run] [PRODUCTION_ROOT]
 *
 * Default PRODUCTION_ROOT: /Users/bnarcum/Projects/Cursor Portfolio
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUS_ROOT = path.resolve(__dirname, "..");
const DEFAULT_PROD = "/Users/bnarcum/Projects/Cursor Portfolio";

const SKIP_DIRS = new Set([".git", "node_modules", ".cursor"]);
const SKIP_FILES = new Set(["PROJECT.md", "PROMOTE-TO-PRODUCTION.md"]);
const PRESERVE_IN_PROD = ["DEVELOPING.md"];

const BRAND_REPLACEMENTS = [
  ["Cisco Portfolio Navigator", "Cisco Portfolio Navigator"],
  ["cisco-portfolio-navigator", "cisco-portfolio-navigator"],
  ["https://bnarcum.github.io/cisco-portfolio-navigator/", "https://bnarcum.github.io/cisco-portfolio-navigator/"],
  ["github.com/bnarcum/cisco-portfolio-navigator", "github.com/bnarcum/cisco-portfolio-navigator"],
];

const PREVIEW_BANNER_CSS = `    #preview-banner{display:none;background:#f5a623;color:#1a1200;text-align:center;
      font-size:12px;font-weight:600;padding:5px 12px;letter-spacing:.02em}
    #preview-banner.visible{display:block}
`;

const PREVIEW_BANNER_HTML = `<div id="preview-banner" role="status">Preview sandbox — changes here are not production. Live site: <a href="https://bnarcum.github.io/cisco-portfolio-navigator/" style="color:#1a1200;text-decoration:underline">Portfolio Navigator</a></div>
<script>if(/cisco-portfolio-navigator-preview/i.test(location.pathname))document.getElementById("preview-banner").classList.add("visible");</script>
`;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const prodRoot = path.resolve(args.find(a => !a.startsWith("--")) || DEFAULT_PROD);

function shouldRebrand(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".woff", ".woff2", ".ico", ".svg"].includes(ext)) return false;
  if (filePath.endsWith("package-lock.json")) return false;
  return true;
}

function rebrandContent(text) {
  let out = text;
  for (const [from, to] of BRAND_REPLACEMENTS) out = out.split(from).join(to);
  return out;
}

function walkCopy(srcDir, destDir, stats) {
  if (!fs.existsSync(srcDir)) throw new Error(`Source missing: ${srcDir}`);
  for (const name of fs.readdirSync(srcDir)) {
    if (SKIP_DIRS.has(name)) continue;
    const src = path.join(srcDir, name);
    const dest = path.join(destDir, name);
    const rel = path.relative(PLUS_ROOT, src);
    if (SKIP_FILES.has(name) && srcDir === PLUS_ROOT) {
      stats.skipped.push(rel);
      continue;
    }
    const st = fs.statSync(src);
    if (st.isDirectory()) {
      if (!dryRun && !fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      walkCopy(src, dest, stats);
    } else {
      stats.copied.push(rel);
      if (dryRun) continue;
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (shouldRebrand(src)) {
        const text = fs.readFileSync(src, "utf8");
        fs.writeFileSync(dest, rebrandContent(text));
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  }
}

function backupPreserve(prodDir) {
  const backed = {};
  for (const name of PRESERVE_IN_PROD) {
    const p = path.join(prodDir, name);
    if (fs.existsSync(p)) backed[name] = fs.readFileSync(p, "utf8");
  }
  return backed;
}

function restorePreserve(prodDir, backed) {
  for (const [name, content] of Object.entries(backed)) {
    fs.writeFileSync(path.join(prodDir, name), content);
  }
}

function patchPackageJson(prodDir) {
  const pkgPath = path.join(prodDir, "package.json");
  const plusPkg = JSON.parse(fs.readFileSync(path.join(PLUS_ROOT, "package.json"), "utf8"));
  let prodPkg = {};
  if (fs.existsSync(pkgPath)) {
    try { prodPkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")); } catch { /* use plus */ }
  }
  const merged = {
    ...plusPkg,
    name: "cisco-portfolio-navigator",
    devDependencies: { ...plusPkg.devDependencies, ...prodPkg.devDependencies },
  };
  fs.writeFileSync(pkgPath, JSON.stringify(merged, null, 2) + "\n");
}

function injectPreviewBanner(htmlPath) {
  if (!fs.existsSync(htmlPath)) return;
  let html = fs.readFileSync(htmlPath, "utf8");
  if (html.includes('id="preview-banner"')) return;
  if (!html.includes("#app-chrome{")) {
    html = html.replace(
      "    /* TOP BAR + ACTION BAR */\n    #app-chrome{",
      `    /* TOP BAR + ACTION BAR */\n${PREVIEW_BANNER_CSS}    #app-chrome{`
    );
  } else if (!html.includes("#preview-banner")) {
    html = html.replace("    #app-chrome{", `${PREVIEW_BANNER_CSS}    #app-chrome{`);
  }
  html = html.replace("<body>\n\n<div id=\"app-chrome\">", `<body>\n\n${PREVIEW_BANNER_HTML}<div id="app-chrome">`);
  html = html.replace("<body>\n<div id=\"app-chrome\">", `<body>\n\n${PREVIEW_BANNER_HTML}<div id="app-chrome">`);
  fs.writeFileSync(htmlPath, html);
}

function main() {
  if (!fs.existsSync(prodRoot)) {
    console.error(`Production folder not found: ${prodRoot}`);
    process.exit(1);
  }
  const version = (() => {
    try {
      const html = fs.readFileSync(path.join(PLUS_ROOT, "cisco-portfolio-navigator.html"), "utf8");
      const m = html.match(/const APP_VERSION\s*=\s*"([^"]+)"/);
      return m?.[1] || "?";
    } catch { return "?"; }
  })();

  console.log(dryRun ? "DRY RUN — no files written" : "Promoting Plus → production");
  console.log(`  From: ${PLUS_ROOT}`);
  console.log(`  To:   ${prodRoot}`);
  console.log(`  Plus version: v${version}`);

  const preserved = dryRun ? {} : backupPreserve(prodRoot);
  const stats = { copied: [], skipped: [] };

  if (!dryRun) {
    walkCopy(PLUS_ROOT, prodRoot, stats);
    restorePreserve(prodRoot, preserved);
    patchPackageJson(prodRoot);
    injectPreviewBanner(path.join(prodRoot, "cisco-portfolio-navigator.html"));
  } else {
    walkCopy(PLUS_ROOT, prodRoot, stats);
  }

  console.log(`\n${dryRun ? "Would copy" : "Copied"} ${stats.copied.length} paths (skipped ${stats.skipped.length} Plus-only files)`);
  if (!dryRun) {
    console.log("\nNext steps:");
    console.log(`  cd "${prodRoot}"`);
    console.log("  npm install && npm test");
    console.log("  git add -A && git commit -m \"Promote Plus v" + version + " — Design Studio\"");
    console.log("  git push preview dev:main   # preview first, or push origin main");
    console.log("\nSee PROMOTE-TO-PRODUCTION.md for full workflow.");
  }
}

main();
