#!/usr/bin/env node
/**
 * Fetch logo candidates from Wikipedia and generate trusted name-tile fallbacks.
 * Run: node scripts/fetch-acq-logos.mjs
 * Generate missing fallback tiles only: node scripts/fetch-acq-logos.mjs --generate-name-tiles
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataPath = path.join(root, "assets/cpn-acquisitions.json");
const logoDir = path.join(root, "assets/acq-logos");
const manifestPath = path.join(logoDir, "manifest.json");

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Pack company name into short lines at word boundaries (never mid-word). */
function splitWordmarkLines(text, maxLines = 3, maxLineLen = 14) {
  const clean = text.replace(/\([^)]*\)/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxLineLen || !line) {
      line = candidate;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length >= maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);
  else if (line && lines.length) {
    const tail = `${lines[lines.length - 1]} ${line}`.trim();
    lines[lines.length - 1] = tail.length > maxLineLen + 6
      ? `${tail.slice(0, maxLineLen - 1)}…`
      : tail;
  }
  return lines.length ? lines : [clean.slice(0, maxLineLen)];
}

function wordmarkFontSize(lines) {
  const longest = Math.max(...lines.map(ln => ln.length));
  if (lines.length >= 3) return 9;
  if (lines.length === 2) return longest > 13 ? 10 : 11;
  return longest > 16 ? 10 : longest > 12 ? 11 : 13;
}

function wordmarkSvg(company, id) {
  const hash = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues = [210, 195, 175, 160, 145, 220, 200, 185];
  const hue = hues[hash % hues.length];
  const lines = splitWordmarkLines(company);
  const fontSize = wordmarkFontSize(lines);
  const lineHeight = fontSize + 2;
  const blockHeight = lines.length * lineHeight - 2;
  const startY = 64 - blockHeight / 2 + fontSize * 0.35;
  const tspans = lines.map((ln, i) =>
    `<tspan x="64" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(ln)}</tspan>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="hsl(${hue},55%,28%)"/>
    <stop offset="100%" stop-color="hsl(${hue},45%,18%)"/>
  </linearGradient></defs>
  <rect width="128" height="128" rx="16" fill="url(#g)"/>
  <rect x="8" y="8" width="112" height="112" rx="12" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>
  <text text-anchor="middle" dominant-baseline="middle" fill="#eef6fc" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="${fontSize}" x="64" y="${startY}">${tspans}</text>
</svg>`;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function writeNameTile(acq) {
  const svgPath = path.join(logoDir, `${acq.id}.svg`);
  fs.writeFileSync(svgPath, wordmarkSvg(acq.company, acq.id));
  return svgPath;
}

function ensureNameTile(acq) {
  const svgPath = path.join(logoDir, `${acq.id}.svg`);
  if (fs.existsSync(svgPath)) return false;
  writeNameTile(acq);
  return true;
}

async function wikiLogo(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=256&origin=*`;
  try {
    const res = await fetch(url);
    const j = await res.json();
    const pages = j.query?.pages || {};
    const page = Object.values(pages)[0];
    const src = page?.thumbnail?.source;
    if (src) return src;
  } catch (_) {}
  return null;
}

async function wikiSearchLogo(company) {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(company)}&limit=1&format=json&origin=*`;
  try {
    const res = await fetch(url);
    const [, titles] = await res.json();
    if (titles?.[0]) return wikiLogo(titles[0]);
  } catch (_) {}
  return null;
}

async function downloadImage(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": "CiscoPortfolioNavigator/1.0" } });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest.replace(/\.webp$/, ".png"), buf);
  try {
    execSync(`sips -s format webp "${dest.replace(/\.webp$/, ".png")}" --out "${dest}"`, { stdio: "pipe" });
    fs.unlinkSync(dest.replace(/\.webp$/, ".png"));
  } catch {
    fs.renameSync(dest.replace(/\.webp$/, ".png"), dest.replace(/\.webp$/, ".png"));
    fs.copyFileSync(dest.replace(/\.webp$/, ".png"), dest);
  }
  return true;
}

async function processOne(acq, existing) {
  const webpPath = path.join(logoDir, `${acq.id}.webp`);
  if (fs.existsSync(webpPath) && fs.statSync(webpPath).size > 400) {
    if (existing?.path && typeof existing.verified === "boolean") {
      if (!existing.verified) ensureNameTile(acq);
      return existing;
    }
    ensureNameTile(acq);
    return {
      id: acq.id,
      source: "cached",
      sourceUrl: null,
      path: `assets/acq-logos/${acq.id}.webp`,
      verified: false,
      ok: true,
    };
  }

  let imgUrl = await wikiLogo(acq.wikiTitle || acq.company);
  if (!imgUrl) imgUrl = await wikiSearchLogo(acq.company);

  if (imgUrl) {
    try {
      const ok = await downloadImage(imgUrl, webpPath);
      if (ok) {
        ensureNameTile(acq);
        return {
          id: acq.id,
          source: "wikipedia-candidate",
          sourceUrl: imgUrl,
          path: `assets/acq-logos/${acq.id}.webp`,
          verified: false,
          ok: true,
        };
      }
    } catch (_) {}
  }

  ensureNameTile(acq);
  return {
    id: acq.id,
    source: "generated",
    sourceUrl: null,
    path: `assets/acq-logos/${acq.id}.svg`,
    verified: false,
    ok: true,
  };
}

async function main() {
  if (!fs.existsSync(dataPath)) {
    console.error("Run node scripts/build-acquisitions.mjs first");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  fs.mkdirSync(logoDir, { recursive: true });

  const existingManifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    : { items: {} };
  if (process.argv.includes("--generate-name-tiles")) {
    let generated = 0;
    for (const acq of data.acquisitions) {
      if (existingManifest.items?.[acq.id]?.verified !== true && ensureNameTile(acq)) {
        generated++;
      }
    }
    console.log(`Generated ${generated} missing name tiles`);
    return;
  }
  if (process.argv.includes("--refresh-name-tiles")) {
    let refreshed = 0;
    for (const acq of data.acquisitions) {
      if (acq.visualIdentity?.kind !== "name-tile") continue;
      writeNameTile(acq);
      refreshed++;
    }
    console.log(`Refreshed ${refreshed} name-tile SVGs`);
    return;
  }
  const manifest = {};
  const list = data.acquisitions;
  console.log(`Fetching logos for ${list.length} acquisitions…`);

  for (let i = 0; i < list.length; i++) {
    const acq = list[i];
    const result = await processOne(acq, existingManifest.items?.[acq.id]);
    manifest[acq.id] = result;
    if ((i + 1) % 25 === 0 || i === list.length - 1) {
      console.log(`  ${i + 1}/${list.length} — last: ${acq.company} (${result.source})`);
    }
    await sleep(120);
  }

  const counts = {};
  for (const m of Object.values(manifest)) counts[m.source] = (counts[m.source] || 0) + 1;
  fs.writeFileSync(manifestPath, JSON.stringify({ generated: new Date().toISOString(), counts, items: manifest }, null, 2));
  console.log("Logo sources:", counts);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
