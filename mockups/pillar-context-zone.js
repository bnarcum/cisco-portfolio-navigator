/** Shared zone + family rendering for peek/filmstrip mockups */
function renderZoneShell(root, p) {
  document.documentElement.style.setProperty("--zone-color", p.color);
  const icon = root.querySelector("[data-zone-icon]");
  const title = root.querySelector("[data-zone-title]");
  const promise = root.querySelector("[data-zone-promise]");
  const graph = root.querySelector("[data-zone-graph]");
  const stats = root.querySelector("[data-zone-stats]");
  if (icon) icon.src = p.icon;
  if (title) title.textContent = p.label;
  if (promise) {
    promise.innerHTML = p.promise + (p.scope ? `<span class="scope">${p.scope}</span>` : "");
  }
  if (graph) {
    graph.className = "family-grid cols-" + p.cols;
    graph.innerHTML = p.families.map(f => `
      <div class="fam-node" title="${f.label}">
        <div class="icon">${f.abbr}</div>
        <span class="lbl">${f.label}</span>
      </div>`).join("");
  }
  if (stats) stats.textContent = `${p.familyCount} families`;
}

function mountPeekRotation(getPillar, onTick, ms = 4500) {
  let idx = 0, timer = null;
  function stop() { if (timer) clearInterval(timer); timer = null; }
  function start() {
    stop();
    timer = setInterval(() => {
      const p = getPillar();
      if (!p) return;
      idx = (idx + 1) % p.highlights.length;
      onTick(p, idx);
    }, ms);
  }
  function setIndex(i) { idx = i; }
  function getIndex() { return idx; }
  return { start, stop, setIndex, getIndex, reset() { idx = 0; } };
}
