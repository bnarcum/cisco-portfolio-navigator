/**
 * Solutions by use case — catalog modal + detail panel with product roles.
 * Call CPN_Solutions.init(ctx) from boot after REF_ARCH is enriched.
 */
(function () {
  "use strict";

  const LAYER_CLASS = {
    Identity: "sd-layer-identity",
    Posture: "sd-layer-posture",
    Access: "sd-layer-access",
    Enforce: "sd-layer-enforce",
    Collab: "sd-layer-collab",
    Observe: "sd-layer-observe",
    Platform: "sd-layer-platform",
    Edge: "sd-layer-edge",
    Fabric: "sd-layer-fabric",
    Compute: "sd-layer-compute",
    Intel: "sd-layer-intel",
  };

  let CTX = null;
  let activePersona = "";
  let activeUseCase = null;
  let built = false;

  function escapeHtml(s) {
    if (CTX?.escapeHtml) return CTX.escapeHtml(s);
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s);
  }

  function refArch() {
    return CTX?.refArch?.() || {};
  }

  function allUseCaseNames() {
    if (CTX?.getUseCases) return CTX.getUseCases();
    return Object.keys(refArch()).sort();
  }

  function catalogEntry(name) {
    const arch = refArch()[name];
    const nodes = CTX?.nodes || [];
    const families = nodes.filter(n => (n.useCases || []).includes(name));
    const bundleName = window.__cpnSolutionsBundles?.[name] || null;
    const bundle = bundleName && CTX?.bundles
      ? CTX.bundles.find(b => b.name === bundleName)
      : null;
    const P = CTX?.problems?.();
    const problems = P
      ? P.PROBLEMS.filter(p => (p.useCases || []).includes(name)).slice(0, 3)
      : [];
    const hasStack = !!(arch?.products?.length && (arch.roles?.length || arch.desc));
    const outcome = arch?.outcome || problems[0]?.outcome || name;

    const pillarCounts = {};
    families.forEach(n => {
      const pid = CTX?.familyPillar?.(n.id) || "resilience";
      pillarCounts[pid] = (pillarCounts[pid] || 0) + 1;
    });
    const pillars = Object.entries(pillarCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => {
        const pm = CTX?.pillarMeta?.(id);
        return { label: pm?.shortLabel || pm?.label || id, color: pm?.color || "#02C8FF" };
      });

    let framedOutcome = outcome;
    if (activePersona && problems[0] && P?.personaLine) {
      framedOutcome = P.personaLine(problems[0], activePersona) || outcome;
    }

    return {
      name,
      outcome: framedOutcome,
      narrative: arch?.desc || "",
      hasStack,
      familyCount: families.length,
      pillars,
      bundle: bundleName,
      bundleProducts: bundle?.products || arch?.products || [],
      problems,
      roles: arch?.roles || [],
      products: arch?.products || [],
    };
  }

  function layerClass(layer) {
    return LAYER_CLASS[layer] || "sd-layer-platform";
  }

  function buildDom() {
    if (built) return;
    built = true;

    const ov = document.createElement("div");
    ov.id = "solutions-ov";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", "Solutions by use case");
    ov.innerHTML = `
      <div class="sol-panel">
        <div class="sol-head">
          <div class="sol-head-row">
            <div>
              <h2>Solutions by use case</h2>
              <p class="sol-sub">Start from the customer outcome — see which families work together, what each one does, and jump to the graph or add a bundle to the plan.</p>
            </div>
            <button type="button" class="sol-close" id="sol-close" aria-label="Close">×</button>
          </div>
        </div>
        <div class="sol-toolbar">
          <input type="search" class="sol-search" id="sol-search" placeholder="Search use cases… (e.g. zero trust, hybrid work)" autocomplete="off"/>
          <div class="sol-personas" id="sol-personas" role="group" aria-label="Persona framing"></div>
        </div>
        <div class="sol-grid" id="sol-grid"></div>
      </div>`;
    document.body.appendChild(ov);

    const detail = document.createElement("aside");
    detail.id = "solutions-detail";
    detail.setAttribute("aria-label", "Use case detail");
    detail.innerHTML = `
      <div class="sd-head">
        <div class="sd-head-row">
          <div class="sd-title" id="sd-title">—</div>
          <button type="button" class="sd-close" id="sd-close" aria-label="Close detail">×</button>
        </div>
        <div class="sd-outcome" id="sd-outcome"></div>
        <div class="sd-narrative" id="sd-narrative"></div>
      </div>
      <div class="sd-body">
        <div class="sd-sec-t">Solution stack — role of each product</div>
        <div class="sd-stack" id="sd-stack"></div>
        <div class="sd-related">
          <div class="sd-sec-t">Related business problems</div>
          <div id="sd-problems"></div>
        </div>
        <div class="sd-bundle" id="sd-bundle"></div>
      </div>
      <div class="sd-foot">
        <button type="button" class="sd-btn primary" id="sd-graph">Show on graph →</button>
        <button type="button" class="sd-btn" id="sd-stack-btn">+ Add solution stack to plan</button>
        <button type="button" class="sd-btn" id="sd-labs">View dCloud learning path</button>
      </div>`;
    document.body.appendChild(detail);

    ov.querySelector("#sol-close")?.addEventListener("click", closeCatalog);
    ov.addEventListener("click", e => { if (e.target === ov) closeCatalog(); });
    detail.querySelector("#sd-close")?.addEventListener("click", closeDetail);
    detail.querySelector("#sd-graph")?.addEventListener("click", showOnGraph);
    detail.querySelector("#sd-stack-btn")?.addEventListener("click", addStackToPlan);
    detail.querySelector("#sd-labs")?.addEventListener("click", viewLearningPath);

    document.getElementById("sol-search")?.addEventListener("input", e => {
      renderCatalog(e.target.value);
    });

    wirePersonaChips();
    wireOpenButton();

    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if (document.getElementById("solutions-detail")?.classList.contains("open")) {
        closeDetail();
        e.preventDefault();
      } else if (document.getElementById("solutions-ov")?.classList.contains("open")) {
        closeCatalog();
        e.preventDefault();
      }
    });
  }

  function wirePersonaChips() {
    const host = document.getElementById("sol-personas");
    if (!host) return;
    const P = CTX?.problems?.();
    const personas = [{ id: "", label: "All" }, ...(P?.PERSONAS || [])];
    host.innerHTML = personas.map(p =>
      `<button type="button" class="sol-persona${p.id === activePersona ? " on" : ""}" data-persona="${escapeAttr(p.id)}">${escapeHtml(p.label)}</button>`
    ).join("");
    host.querySelectorAll(".sol-persona").forEach(btn => {
      btn.addEventListener("click", () => {
        activePersona = btn.dataset.persona || "";
        if (CTX?.setPersona) CTX.setPersona(activePersona);
        wirePersonaChips();
        renderCatalog(document.getElementById("sol-search")?.value || "");
        if (activeUseCase) renderDetail(activeUseCase);
      });
    });
  }

  function wireOpenButton() {
    document.getElementById("solutions-btn")?.addEventListener("click", openCatalog);
  }

  function renderCatalog(filter = "") {
    const grid = document.getElementById("sol-grid");
    if (!grid) return;
    const q = filter.trim().toLowerCase();
    grid.innerHTML = "";
    allUseCaseNames()
      .filter(name => {
        if (!q) return true;
        const e = catalogEntry(name);
        return name.toLowerCase().includes(q) || e.outcome.toLowerCase().includes(q);
      })
      .forEach(name => {
        const e = catalogEntry(name);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "uc-card";
        const pillarHtml = e.pillars.map(p =>
          `<span class="uc-pillar" style="border-color:${p.color}55;color:${p.color}">${escapeHtml(p.label)}</span>`
        ).join("");
        btn.innerHTML = `
          <div class="uc-card-top">
            <h3>${escapeHtml(name)}</h3>
            <span class="uc-badge ${e.hasStack ? "stack" : "filter"}">${e.hasStack ? "Full stack" : "Families"}</span>
          </div>
          <p class="uc-outcome">${escapeHtml(e.outcome)}</p>
          <div class="uc-meta">${pillarHtml}<span class="uc-count">${e.familyCount} families</span></div>
          <span class="uc-cta">View solution →</span>`;
        btn.addEventListener("click", () => openDetail(name));
        grid.appendChild(btn);
      });
  }

  function renderDetail(name) {
    const e = catalogEntry(name);
    activeUseCase = name;
    document.getElementById("sd-title").textContent = name;
    document.getElementById("sd-outcome").textContent = e.outcome;
    const narr = document.getElementById("sd-narrative");
    narr.textContent = e.narrative || "Reference architecture narrative coming soon — use related problems and bundle below for now.";
    narr.style.opacity = e.narrative ? "1" : "0.65";

    const stackEl = document.getElementById("sd-stack");
    const nodeById = CTX?.nodeById || {};
    const roles = e.roles.length
      ? e.roles
      : (e.products || []).map(id => ({ id, layer: "Platform", role: nodeById[id]?.desc?.slice(0, 120) || "Part of this solution stack." }));

    if (roles.length) {
      stackEl.innerHTML = roles.map((item, i) => {
        const fam = nodeById[item.id];
        const displayName = fam?.name || item.id;
        return `<button type="button" class="sd-stack-item" data-family="${escapeAttr(item.id)}">
          <div class="sd-num">${i + 1}</div>
          <div>
            <div class="sd-name">${escapeHtml(displayName)}</div>
            <div class="sd-role">${escapeHtml(item.role || "")}</div>
          </div>
          <span class="sd-layer ${layerClass(item.layer)}">${escapeHtml(item.layer || "Role")}</span>
        </button>`;
      }).join("");
      stackEl.querySelectorAll(".sd-stack-item").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.family;
          if (id && CTX?.jumpTo) {
            closeDetail();
            closeCatalog();
            CTX.jumpTo(id);
          }
        });
      });
    } else {
      stackEl.innerHTML = `<p style="font-size:0.72rem;color:var(--muted);line-height:1.5">No curated stack yet — add families tagged with this use case from the graph filter.</p>`;
    }

    const probEl = document.getElementById("sd-problems");
    const P = CTX?.problems?.();
    if (e.problems.length && P) {
      probEl.innerHTML = e.problems.map(p => {
        const line = activePersona && P.personaLine
          ? P.personaLine(p, activePersona)
          : p.outcome;
        const symptom = activePersona && P.personaView
          ? (P.personaView(p, activePersona).symptom || p.symptom)
          : p.symptom;
        return `<button type="button" class="sd-prob" data-prob="${escapeAttr(p.id)}"><q>${escapeHtml(symptom)}</q><span>${escapeHtml(line)}</span></button>`;
      }).join("");
      probEl.querySelectorAll(".sd-prob").forEach(btn => {
        btn.addEventListener("click", () => {
          closeDetail();
          closeCatalog();
          CTX?.exploreProblem?.(btn.dataset.prob);
        });
      });
    } else {
      probEl.innerHTML = `<p style="font-size:0.72rem;color:var(--muted)">No curated problems linked yet.</p>`;
    }

    document.getElementById("sd-bundle").innerHTML = e.bundle
      ? `<strong>Recommended bundle:</strong> ${escapeHtml(e.bundle)} — one-click add to account plan.`
      : `<strong>Bundle:</strong> None mapped — stack built from family use-case tags.`;
  }

  function openCatalog() {
    buildDom();
    if (CTX?.closePanel) CTX.closePanel();
    window.__cpnOutcomeCard?.hide?.();
    renderCatalog(document.getElementById("sol-search")?.value || "");
    document.getElementById("solutions-ov")?.classList.add("open");
  }

  function closeCatalog() {
    document.getElementById("solutions-ov")?.classList.remove("open");
  }

  function openDetail(name, opts = {}) {
    buildDom();
    if (!opts.keepCatalog) closeCatalog();
    if (CTX?.closePanel) CTX.closePanel();
    window.__cpnOutcomeCard?.hide?.();

    if (CTX?.setUseCaseFilter) CTX.setUseCaseFilter(name);

    renderDetail(name);
    document.getElementById("solutions-detail")?.classList.add("open");
    document.body.classList.add("solutions-detail-open");
  }

  function closeDetail() {
    document.getElementById("solutions-detail")?.classList.remove("open");
    document.body.classList.remove("solutions-detail-open");
    activeUseCase = null;
    if (CTX?.clearRefArch && !document.getElementById("ucs")?.value) CTX.clearRefArch();
  }

  function showOnGraph() {
    if (!activeUseCase) return;
    const arch = refArch()[activeUseCase];
    closeCatalog();
    if (arch && CTX?.applyRefArch) {
      CTX.applyRefArch(activeUseCase);
    } else if (CTX?.highlightForUseCase) {
      CTX.highlightForUseCase(activeUseCase);
    }
    CTX?.showToast?.(`Showing ${activeUseCase} on graph`);
  }

  function addStackToPlan() {
    if (!activeUseCase) return;
    const e = catalogEntry(activeUseCase);
    const ids = e.bundleProducts.length ? e.bundleProducts : e.products;
    if (!ids.length) {
      CTX?.showToast?.("No products mapped for this use case yet");
      return;
    }
    ids.forEach(id => CTX?.addToStack?.(id, "node"));
    CTX?.showToast?.(`Added ${ids.length} product${ids.length !== 1 ? "s" : ""} to plan`);
  }

  function viewLearningPath() {
    if (!activeUseCase) return;
    closeDetail();
    closeCatalog();
    if (CTX?.renderLearningPathBanner) CTX.renderLearningPathBanner(activeUseCase);
    CTX?.showToast?.("Learning path loaded");
  }

  function highlightForUseCase(name) {
    const nodes = CTX?.nodes || [];
    const setIds = new Set(nodes.filter(n => (n.useCases || []).includes(name)).map(n => n.id));
    if (CTX?.highlightProblemFamilies) {
      CTX.highlightProblemFamilies({ families: [...setIds], outcome: name, useCases: [name] });
    }
  }

  function init(ctx) {
    CTX = ctx;
    if (typeof window.__cpnSolutionsEnrichRefArch === "function" && ctx.refArch) {
      window.__cpnSolutionsEnrichRefArch(ctx.refArch());
    }
    buildDom();
    wireOpenButton();
  }

  window.CPN_Solutions = {
    init,
    openCatalog,
    closeCatalog,
    openDetail,
    closeDetail,
    catalogEntry,
  };
  window.__cpnSolutions = window.CPN_Solutions;
})();
