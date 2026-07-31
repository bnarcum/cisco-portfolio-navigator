/**
 * Solutions overlay UI — outcome catalog, composition detail, graph lens hooks.
 */
(function () {
  "use strict";

  let activeFilter = "all";
  let activeProblemId = null;

  function api() { return window.__cpnSolutions; }
  function P() { return window.__cpnProblems; }

  function escapeHtml(s) {
    if (typeof window.escapeHtml === "function") return window.escapeHtml(s);
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function ov() { return document.getElementById("solutions-ov"); }

  function openOverlay() {
    const el = ov();
    if (!el) return;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    showCatalog();
    renderCatalog();
  }

  function closeOverlay() {
    const el = ov();
    if (!el) return;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
  }

  function showCatalog() {
    activeProblemId = null;
    document.querySelector(".sol-catalog")?.classList.add("on");
    document.querySelector(".sol-detail")?.classList.remove("on");
    const h = document.getElementById("sol-panel-title");
    if (h) h.textContent = "Business outcomes → solution stacks";
    const sub = document.getElementById("sol-panel-sub");
    if (sub) sub.textContent = "Pick an outcome to see which portfolio families compose the solution — not a single product.";
  }

  function showDetail(problemId) {
    activeProblemId = problemId;
    document.querySelector(".sol-catalog")?.classList.remove("on");
    document.querySelector(".sol-detail")?.classList.add("on");
    renderDetail(problemId);
  }

  function renderCatalog() {
    const grid = document.getElementById("sol-outcome-grid");
    if (!grid || !api()) return;
    const q = (document.getElementById("sol-search")?.value || "").trim().toLowerCase();
    const items = api().listOutcomes().filter(o => {
      if (activeFilter !== "all" && o.filterId !== activeFilter) return false;
      if (!q) return true;
      const hay = [o.outcome, o.symptom, o.bundlePrimary, ...(o.useCases || [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
    grid.innerHTML = items.map(o => `
      <button type="button" class="oc-card" data-problem-id="${escapeHtml(o.id)}">
        <div class="oc-pillar">${escapeHtml(o.pillarLabel)}</div>
        <div class="oc-outcome">${escapeHtml(o.outcome)}</div>
        <div class="oc-symptom">"${escapeHtml(o.symptom)}"</div>
        <div class="oc-meta">
          <span>${o.familyCount} families${o.bundlePrimary ? " · " + escapeHtml(o.bundlePrimary) : ""}</span>
        </div>
      </button>`).join("");
    grid.querySelectorAll("[data-problem-id]").forEach(btn => {
      btn.addEventListener("click", () => showDetail(btn.getAttribute("data-problem-id")));
    });
  }

  function renderDetail(problemId) {
    const o = api()?.getOutcome(problemId);
    const root = document.getElementById("sol-detail-root");
    const h = document.getElementById("sol-panel-title");
    const sub = document.getElementById("sol-panel-sub");
    if (!o || !root) return;
    if (h) h.textContent = o.outcome;
    if (sub) sub.textContent = o.pillarLabel + (o.bundleName ? " · " + o.bundleName : "");

    const proof = o.proof;
    const proofHtml = proof && (proof.before || proof.after) ? `
      <div class="ba-row">
        <div class="ba-box ba-before"><div class="ba-lbl">Before</div>${escapeHtml(proof.before || "—")}</div>
        <div class="ba-arrow">→</div>
        <div class="ba-box ba-after"><div class="ba-lbl">After</div>${escapeHtml(proof.after || "—")}</div>
      </div>` : "";

    const layersHtml = o.layers.map(layer => `
      <div class="layer">
        <div class="layer-h ${escapeHtml(layer.key)}"><span class="bar"></span>${escapeHtml(layer.label)}</div>
        ${layer.rows.map(r => `
          <button type="button" class="stack-row" data-family-id="${escapeHtml(r.familyId)}">
            <div class="stack-role">
              <div class="t">${escapeHtml(r.name)}${r.core ? '<span class="tag-core">CORE</span>' : ""}</div>
              <div class="s">${escapeHtml(r.shortDesc)}</div>
            </div>
            <span class="stack-fam ${r.core ? "core" : ""}">${escapeHtml((window.CATS && window.CATS[r.category] && window.CATS[r.category].label) || r.category)}</span>
          </button>`).join("")}
      </div>`).join("");

    root.innerHTML = `
      <button type="button" class="sol-back" id="sol-back-btn">← All outcomes</button>
      <p class="compose-quote">Customer symptom: <em>"${escapeHtml(o.symptom)}"</em></p>
      <p class="compose-headline">${escapeHtml(o.personaLine)}</p>
      ${proofHtml}
      <p style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--subtle);margin:0 0 8px">Solution composition</p>
      <div class="layer-stack">${layersHtml}</div>
      <div class="sol-side-meta">
        ${o.bundleName ? `<div><strong>Related package:</strong> ${escapeHtml(o.bundleName)}</div>` : ""}
        ${o.bundleDesc ? `<div style="margin-top:6px">${escapeHtml(o.bundleDesc)}</div>` : ""}
        ${o.useCases.length ? `<div style="margin-top:8px"><strong>Use cases:</strong> ${escapeHtml(o.useCases.join(" · "))}</div>` : ""}
        <div style="margin-top:8px;font-size:10px;color:var(--subtle)">${escapeHtml(P()?.DISCLAIMER || "")}</div>
      </div>
      <div class="sol-actions">
        <button type="button" class="sol-act primary" data-action="add-plan" data-problem-id="${escapeHtml(o.id)}">Add full solution to plan</button>
        <button type="button" class="sol-act ghost" data-action="graph-lens" data-problem-id="${escapeHtml(o.id)}">Show on graph →</button>
        <button type="button" class="sol-act ghost" data-action="open-hub" data-family-id="${escapeHtml(o.hubFamilyId || "")}">Open anchor family</button>
      </div>`;

    document.getElementById("sol-back-btn")?.addEventListener("click", showCatalog);
    root.querySelectorAll("[data-family-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const fid = btn.getAttribute("data-family-id");
        closeOverlay();
        if (typeof window.jumpTo === "function") window.jumpTo(fid, { closePanel: false });
      });
    });
    root.querySelector('[data-action="add-plan"]')?.addEventListener("click", () => {
      addSolutionToPlan(o.id);
    });
    root.querySelector('[data-action="graph-lens"]')?.addEventListener("click", () => {
      activateGraphLens(o.id);
    });
    root.querySelector('[data-action="open-hub"]')?.addEventListener("click", () => {
      if (!o.hubFamilyId) return;
      closeOverlay();
      activateGraphLens(o.id);
      if (typeof window.jumpTo === "function") window.jumpTo(o.hubFamilyId);
    });
  }

  function addSolutionToPlan(problemId) {
    const o = api()?.getOutcome(problemId);
    if (!o || typeof window.addToStack !== "function") return;
    o.familyIds.forEach(fid => window.addToStack(fid, "node"));
    closeOverlay();
    if (typeof window.openPanel !== "function" && typeof window.togglePlanner === "function") {
      window.togglePlanner(true);
    }
  }

  function activateGraphLens(problemId) {
    closeOverlay();
    if (typeof window.setSolutionLens === "function") window.setSolutionLens(problemId);
    if (typeof window.applyViewLevel === "function") {
      window.applyViewLevel("families");
    }
    setTimeout(() => {
      if (typeof window.applyFilters === "function") window.applyFilters();
      if (typeof window.applySolutionLensHighlight === "function") window.applySolutionLensHighlight();
      if (typeof window.fitSolutionLensGraph === "function") window.fitSolutionLensGraph();
    }, 400);
  }

  function wireChrome() {
    document.getElementById("solutions-btn")?.addEventListener("click", openOverlay);
    document.getElementById("sol-close-btn")?.addEventListener("click", closeOverlay);
    ov()?.addEventListener("click", e => {
      if (e.target === ov()) closeOverlay();
    });
    document.getElementById("sol-search")?.addEventListener("input", renderCatalog);
    document.querySelectorAll(".sol-fchip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".sol-fchip").forEach(c => c.classList.remove("on"));
        chip.classList.add("on");
        activeFilter = chip.dataset.filter || "all";
        renderCatalog();
      });
    });
    document.getElementById("sl-clear")?.addEventListener("click", () => {
      if (typeof window.clearSolutionLens === "function") window.clearSolutionLens();
    });
    document.getElementById("sl-reopen")?.addEventListener("click", () => {
      const id = window.solutionLensProblemId;
      if (id) showDetail(id);
      openOverlay();
      showDetail(id);
    });
    document.getElementById("sl-add")?.addEventListener("click", () => {
      const id = window.solutionLensProblemId;
      if (id) addSolutionToPlan(id);
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && ov()?.classList.contains("open")) closeOverlay();
    });
  }

  function init() {
    if (!api() || !document.getElementById("solutions-ov")) return;
    wireChrome();
  }

  window.__cpnSolutionsUI = { init, openOverlay, closeOverlay, renderDetail, activateGraphLens };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
