#!/usr/bin/env node
/** learning-links.json — no broken Academy search URLs; allowlisted hosts only. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const data = JSON.parse(fs.readFileSync(path.join(root, "learning-links.json"), "utf8"));
const entries = data.entries || [];
const errors = [];

const BANNED = [/academy\.webex\.com\/catalog/i, /catalog\?search=/i];

function urlAllowed(url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  const h = u.hostname;
  const p = u.pathname + u.search;
  if (h === "academy.webex.com") return p === "/learn" || p.startsWith("/learn/");
  if (h === "help.webex.com") return p.includes("/article/");
  if (h === "www.cisco.com" || h === "cisco.com") return true;
  if (h === "u.cisco.com") return p === "/" || p.startsWith("/search");
  if (h === "www.cisco.com" && p.includes("/partners/training/black-belt")) return true;
  if (u.hostname.includes("cisco.com")) return true;
  return false;
}

for (const e of entries) {
  if (!e.url) { errors.push(`${e.id}: missing url`); continue; }
  for (const re of BANNED) {
    if (re.test(e.url)) errors.push(`${e.id}: banned URL pattern ${e.url}`);
  }
  if (!urlAllowed(e.url)) errors.push(`${e.id}: URL not on allowlist — ${e.url}`);
}

const sources = Object.keys(data.sources || {});
for (const e of entries) {
  if (e.source && !sources.includes(e.source))
    errors.push(`${e.id}: unknown source ${e.source}`);
}

if (!sources.includes("webex-help")) errors.push("missing webex-help source definition");

if (errors.length) {
  console.error("FAIL test-learning-links:");
  errors.forEach(x => console.error(" -", x));
  process.exit(1);
}
console.log(`OK test-learning-links (${entries.length} entries)`);
