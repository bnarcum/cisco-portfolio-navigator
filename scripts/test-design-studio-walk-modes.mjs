#!/usr/bin/env node
/** Design Studio walk — single Solution Walk experience. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const walk = fs.readFileSync(path.join(root, "design-studio-walk.js"), "utf8");
const css = fs.readFileSync(path.join(root, "design-studio.css"), "utf8");
const studio = fs.readFileSync(path.join(root, "design-studio.js"), "utf8");
const lazy = fs.readFileSync(path.join(root, "assets/cpn-lazy-load.js"), "utf8");

const errors = [];
const must = (ok, msg) => { if (!ok) errors.push(msg); };

must(/const WALK_STYLE_KEY\s*=\s*"cpn-ds-walk-style"/.test(walk), "walk style preference key is missing");
must(/const WALK_STYLES\s*=/.test(walk), "walk style registry is missing");
must(/lab:\s*\{[\s\S]*title:\s*"Solution Walk"/.test(walk), "Solution Walk title is missing");
must(!/explore:\s*\{/.test(walk), "Explore mode should be removed");
must(!/design-studio-walk-quest/.test(lazy), "Cable Quest should not be lazy-loaded");
must(!/__DS_WALK_QUEST/.test(walk), "Walk should not reference Cable Quest");
must(/function pickHeroChamber/.test(walk), "pickHeroChamber is missing");
must(/function playEntryReveal/.test(walk), "playEntryReveal is missing");
must(/function finishIntroReveal/.test(walk), "finishIntroReveal is missing");
must(!/ds-walk-cinema/.test(walk), "cinema dim mode should not be used");
must(!/ds-entering-walk/.test(walk), "diagram dim should not be used");
must(/await loadDevicePods/.test(walk), "device pods must load before reveal");
must(/style\.features\.manualMove/.test(walk), "manual movement must be gated by style features");
must(/style\.features\.avatar/.test(walk), "avatar must be gated by style features");
must(/if \(style\.features\.avatar\) state\.thirdPerson = true;/.test(walk), "Avatar walk must restore third-person visibility");
must(/PROX_LABEL_NEAR/.test(walk), "proximity label distance is missing");

must(!/ds-walk-cinema/.test(css), "cinema dim CSS should be removed");
must(!/ds-entering-walk/.test(css), "diagram dim CSS should be removed");
must(/function usesGlassHud/.test(walk), "Glass HUD helper is missing");
must(/return hudHtmlGlass/.test(walk), "Walk HUD must use glass layout");
must(!/data-action="walk-style"/.test(walk), "walk style HUD toggle should be removed");
must(/ds-walk-hud-row2[\s\S]*data-action="packets"[\s\S]*data-action="packet-speed"/.test(walk), "Packets and speed belong in main HUD row");

must(/id="ds-walk-corridor"/.test(studio), "Walk toolbar button is missing");
must(/function shouldRenderWalk/.test(walk), "walk render gate is missing");
must(/visibilitychange/.test(walk), "walk must pause WebGL when the tab is hidden");
must(/window\.__DS_WALK\?\.close/.test(studio), "closing Design Studio must stop Walk mode");
must(/sfx\?\.enter/.test(walk), "entry reveal must play enter sfx");

if (errors.length) {
  console.error("FAIL test-design-studio-walk-modes");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("OK test-design-studio-walk-modes");
