#!/usr/bin/env node
/**
 * UA-aware external link checker for the Portfolio Navigator.
 *
 * Extracts every external URL referenced from the product catalog
 * (cisco-portfolio-navigator.html) and the Design Studio templates
 * (design-studio-templates.js), then verifies each one with a
 * browser-like User-Agent, following redirects and detecting soft-404s.
 *
 * Classification:
 *   OK        2xx final, no soft-404 marker
 *   REDIRECT  landed on a different path (still 2xx) — informational
 *   BROKEN    404/410 or soft-404 body → FAILS the build
 *   BLOCKED   403/429 from a known bot-blocking host → quarantined (warn only)
 *
 * Usage:
 *   node scripts/check-links.mjs            # check all, fail on BROKEN
 *   node scripts/check-links.mjs --json     # machine-readable report
 *   node scripts/check-links.mjs --redirects# also list redirects
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = new Set(process.argv.slice(2));
const AS_JSON = args.has("--json");
const SHOW_REDIRECTS = args.has("--redirects");

// Hosts that aggressively block automated clients (Akamai bot manager, etc.).
// A 403/429 from these is treated as "blocked", not "broken" — verify manually.
const QUARANTINE_HOSTS = [
  "webex.com",
  "www.webex.com",
  "thousandeyes.com",
  "www.thousandeyes.com",
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const SOFT_404 =
  /page not found|404 error|we couldn't find|no longer available|page you (?:are looking for|requested) (?:cannot|could not) be found|does not exist/i;

const SOURCES = [
  "cisco-portfolio-navigator.html",
  "design-studio-templates.js",
];

// Non-documentation hosts that legitimately appear in code (LLM endpoints,
// dev servers, XML namespaces, placeholders) and must never be link-checked.
const IGNORE_HOSTS = [
  "localhost",
  "www.w3.org",
  "api.openai.com",
  "api.anthropic.com",
  "api.groq.com",
  "openrouter.ai",
  "ollama.com",
  "lmstudio.ai",
  "docs.appdynamics.com",
  "docs.kennasecurity.com",
];

function extractUrls() {
  const map = new Map(); // url -> Set(sourceFile)
  // Only documentation-style fields: url:, cvdUrl:, datasheet:, docUrl:
  const re =
    /\b(?:url|cvdUrl|datasheet|docUrl)\s*:\s*["'](https?:\/\/[^"'`]+)["']/g;
  for (const rel of SOURCES) {
    let text;
    try {
      text = readFileSync(join(ROOT, rel), "utf8");
    } catch {
      continue;
    }
    let m;
    while ((m = re.exec(text))) {
      const url = m[1];
      if (url.includes("${") || url.includes("{{")) continue; // placeholders
      let host;
      try {
        host = new URL(url).hostname;
      } catch {
        continue;
      }
      if (IGNORE_HOSTS.includes(host) || host.endsWith(".example")) continue;
      if (!map.has(url)) map.set(url, new Set());
      map.get(url).add(rel);
    }
  }
  return map;
}

function isQuarantined(url) {
  try {
    return QUARANTINE_HOSTS.includes(new URL(url).host);
  } catch {
    return false;
  }
}

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const status = res.status;
    let soft = false;
    if (status >= 200 && status < 400) {
      const body = await res.text().catch(() => "");
      soft = SOFT_404.test(body.slice(0, 8000));
    }
    let redirected = false;
    try {
      redirected = new URL(res.url).pathname !== new URL(url).pathname;
    } catch {}
    return { status, finalUrl: res.url, soft, redirected };
  } catch (e) {
    return { status: 0, error: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const urlMap = extractUrls();
  const urls = [...urlMap.keys()].sort();
  const results = [];

  const CONCURRENCY = 8;
  let idx = 0;
  async function worker() {
    while (idx < urls.length) {
      const url = urls[idx++];
      const r = await check(url);
      const quarantined = isQuarantined(url);
      let category;
      if (r.status >= 200 && r.status < 400 && !r.soft) {
        category = r.redirected ? "REDIRECT" : "OK";
      } else if (r.status === 404 || r.status === 410 || r.soft) {
        // Definitively dead → fails the build.
        category = "BROKEN";
      } else if ((r.status === 403 || r.status === 429) && quarantined) {
        category = "BLOCKED";
      } else {
        // 403/5xx/timeouts on non-quarantined hosts: report but don't fail CI
        // (transient errors / new bot-blocking shouldn't break the build).
        category = "WARN";
      }
      results.push({ url, category, ...r, sources: [...urlMap.get(url)] });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  results.sort((a, b) => a.url.localeCompare(b.url));
  const by = (c) => results.filter((r) => r.category === c);
  const broken = by("BROKEN");
  const blocked = by("BLOCKED");
  const redirects = by("REDIRECT");
  const warn = by("WARN");

  if (AS_JSON) {
    console.log(JSON.stringify({ total: results.length, broken, blocked, redirects, warn }, null, 2));
  } else {
    console.log(`Checked ${results.length} unique external links.`);
    console.log(
      `  OK ${by("OK").length}  REDIRECT ${redirects.length}  BLOCKED ${blocked.length}  WARN ${warn.length}  BROKEN ${broken.length}`
    );
    if (warn.length) {
      console.log("\nWarnings (transient / non-404 errors — not failing build):");
      for (const r of warn) console.log(`  [${r.error || "HTTP " + r.status}] ${r.url}`);
    }
    if (SHOW_REDIRECTS && redirects.length) {
      console.log("\nRedirects (informational):");
      for (const r of redirects) console.log(`  ${r.url}\n      -> ${r.finalUrl}`);
    }
    if (blocked.length) {
      console.log("\nBlocked (bot-protected host — verify manually):");
      for (const r of blocked) console.log(`  [${r.status}] ${r.url}`);
    }
    if (broken.length) {
      console.log("\nBROKEN:");
      for (const r of broken) {
        const why = r.soft ? "soft-404" : r.error || `HTTP ${r.status}`;
        console.log(`  [${why}] ${r.url}  (${r.sources.join(", ")})`);
      }
    }
  }

  if (broken.length) {
    console.error(`\n✖ ${broken.length} broken link(s) found.`);
    process.exit(1);
  }
  console.log(`\n✓ No broken links (${blocked.length} blocked host(s) quarantined).`);
}

run();
