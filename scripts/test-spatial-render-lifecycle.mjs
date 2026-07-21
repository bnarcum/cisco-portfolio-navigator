#!/usr/bin/env node
/** Spatial view — pause WebGL when leaving the view or hiding the tab. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = fs.readFileSync(path.join(root, "cisco-portfolio-navigator.html"), "utf8");
const errors = [];
const must = (ok, msg) => { if (!ok) errors.push(msg); };

must(/function shouldRenderSpatial/.test(html), "spatial render gate is missing");
must(/function pauseSpatialRender/.test(html), "pauseSpatialRender is missing");
must(/function resumeSpatialRender/.test(html), "resumeSpatialRender is missing");
must(/function syncSpatialRender/.test(html), "syncSpatialRender is missing");
must(/pauseSpatialRender\(\)/.test(html), "spatial must call pauseSpatialRender on exit");
must(/syncSpatialRender\(\)/.test(html), "spatial must sync render on enter");
must(/visibilitychange/.test(html) && /bindSpatialRenderLifecycle/.test(html), "spatial must pause when tab is hidden");
must(/pauseAnimation/.test(html), "spatial must call graph.pauseAnimation");
must(/resumeAnimation/.test(html), "spatial must call graph.resumeAnimation");
must(/window\.__cpnSpatialRenderState/.test(html), "spatial render debug hook is missing");
must(/function paintSpatialTileCanvas/.test(html), "spatial canvas tile painter is missing");
must(/createImageBitmap/.test(html), "spatial SVG raster fallback is missing");
must(/SRGBColorSpace/.test(html), "spatial texture colorSpace patch is missing");
must(/function buildSpatialIconRasterSvg/.test(html), "spatial icon raster SVG builder is missing");
must(/function spatialCanvasHasIconInk/.test(html), "spatial icon ink probe is missing");
must(/tile-v13/.test(html), "spatial tile cache version bump is missing");
must(!/function spatialLoadTileImage/.test(html), "legacy spatial SVG image loader should be removed");

if (errors.length) {
  console.error("FAIL test-spatial-render-lifecycle\n" + errors.map(e => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log("OK test-spatial-render-lifecycle");
