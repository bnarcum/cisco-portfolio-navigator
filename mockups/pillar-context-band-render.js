/** Shared render for band mockups — graph + value-prop ribbon, no overlap. */
function bandEsc(s){ return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;"); }

function renderBandHeader(root, p) {
  document.documentElement.style.setProperty("--zone-color", p.color);
  root.classList.toggle("resilience-gradient", !!p.gradient);
  const icon = root.querySelector("[data-zone-icon]");
  const title = root.querySelector("[data-zone-title]");
  const promise = root.querySelector("[data-zone-promise]");
  if (icon) icon.src = p.icon;
  if (title) title.textContent = p.label;
  if (promise) {
    promise.innerHTML = bandEsc(p.promise) + (p.scope ? ` <span class="scope">· ${bandEsc(p.scope)}</span>` : "");
  }
}

function renderBandGraph(root, p) {
  const graph = root.querySelector("[data-band-graph]");
  if (graph) {
    graph.innerHTML = p.families.map(f =>
      `<span class="fam" title="${bandEsc(f.label)}">${bandEsc(f.abbr)}<span class="fam-lbl">${bandEsc(f.label)}</span></span>`).join("");
  }
}

function renderBand(root, p, opts = {}) {
  renderBandHeader(root, p);
  renderBandGraph(root, p);
  const ribbon = root.querySelector("[data-vp-ribbon]");
  if (ribbon) {
    if (p.highlights.length > 4) ribbon.classList.add("wrap");
    else ribbon.classList.remove("wrap");
    ribbon.innerHTML = p.highlights.map((h, i) => `
      <article class="vp-card">
        <h4><span class="vp-n">${i + 1}</span>${bandEsc(h.title)}</h4>
        <p>${bandEsc(h.body)}</p>
      </article>`).join("");
  }
}
