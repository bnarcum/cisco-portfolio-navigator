/**
 * Cisco Portfolio Navigator — optional Guided / Presenter experience shell.
 * Classic mode is unchanged; guided layers role + scenario entry and an outcome path bar in Design Studio.
 */
(function () {
  "use strict";

  const STORAGE_MODE = "cpn-experience-v1";
  const STORAGE_PERSONA = "cpn-experience-persona-v1";
  const STORAGE_SCENARIO = "cpn-experience-scenario-v1";

  const PERSONAS = [
    { id: "se", label: "Solutions Engineer", hint: "Validate architecture, score, and customer story" },
    { id: "customer", label: "Customer IT", hint: "Outcome-focused walkthrough and install guides" },
    { id: "partner", label: "Partner", hint: "Demo scenarios, BOM, and dCloud labs" },
    { id: "field", label: "Field / Install", hint: "Room layout, cabling, and CT design guides" }
  ];

  const SCENARIOS = [
    {
      id: "boardroom-refresh",
      title: "Boardroom refresh",
      subtitle: "Video-centric boardroom with Board Pro and ceiling mics",
      personas: ["se", "customer", "partner", "field"],
      roomTemplate: "boardroom",
      intentText: "Refresh our executive boardroom for hybrid meetings — video-centric, 14–20 seats, PoE collab switching.",
      outcomeHeadline: "One validated video-centric boardroom with PoE collab VLAN and CT-aligned layout",
      pathSteps: [
        { id: "room", label: "Review room", action: "room" },
        { id: "validate", label: "Validate design", action: "validate" },
        { id: "learn", label: "Install guides", action: "learn" },
        { id: "walk", label: "3D walk", action: "walk" },
        { id: "export", label: "Export BOM", action: "export" }
      ]
    },
    {
      id: "conference-standard",
      title: "Conference room",
      subtitle: "Room Kit EQ + dual ceiling mics — medium collaboration",
      personas: ["se", "partner", "field"],
      roomTemplate: "conference",
      intentText: "Standard 8–12 seat conference room with Room Kit EQ, dual displays optional, validated CT medium room guide.",
      outcomeHeadline: "Medium collaboration room with codec, touch controller, and PoE audio",
      pathSteps: [
        { id: "room", label: "Review room", action: "room" },
        { id: "validate", label: "Validate design", action: "validate" },
        { id: "learn", label: "CT guide", action: "learn" },
        { id: "dcloud", label: "dCloud lab", action: "dcloud" }
      ]
    },
    {
      id: "campus-meetings",
      title: "Campus + meeting rooms",
      subtitle: "Collapsed core campus with a sample conference room",
      personas: ["se", "partner"],
      networkTemplate: "campusCollapsed",
      roomTemplate: "conference",
      intentText: "Campus LAN refresh with collapsed core and a representative conference room for hybrid work pilots.",
      outcomeHeadline: "Campus CVD baseline plus a reference collaboration space on the same design",
      pathSteps: [
        { id: "network", label: "Review network", action: "network" },
        { id: "room", label: "Review room", action: "room" },
        { id: "validate", label: "Validate", action: "validate" },
        { id: "learn", label: "Guides & labs", action: "learn" }
      ]
    },
    {
      id: "branch-collab",
      title: "Branch office",
      subtitle: "SD-WAN branch with huddle space",
      personas: ["se", "partner", "customer"],
      networkTemplate: "branchStandard",
      roomTemplate: "huddle",
      intentText: "Branch SD-WAN edge with local switching and a huddle room for quick hybrid sessions.",
      outcomeHeadline: "Branch WAN/LAN reference with a compact Webex huddle attached",
      pathSteps: [
        { id: "network", label: "Review network", action: "network" },
        { id: "room", label: "Huddle room", action: "room" },
        { id: "validate", label: "Validate", action: "validate" },
        { id: "export", label: "Export BOM", action: "export" }
      ]
    }
  ];

  const state = {
    persona: null,
    scenarioId: null,
    entryStep: 1,
    entryOpen: false,
    pathDone: Object.create(null),
    pendingOpen: null
  };

  function lsGet(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function lsSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { /* ignore */ }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function getMode() {
    const m = lsGet(STORAGE_MODE, "classic");
    return m === "guided" || m === "presenter" ? m : "classic";
  }

  function setMode(mode) {
    const m = mode === "guided" || mode === "presenter" ? mode : "classic";
    lsSet(STORAGE_MODE, m);
    document.body.classList.toggle("cpn-exp-guided", m === "guided");
    document.body.classList.toggle("cpn-exp-presenter", m === "presenter");
    syncMenuButton();
    if (m === "classic") hideStudioBar();
  }

  function scenarioById(id) {
    return SCENARIOS.find(s => s.id === id) || null;
  }

  function filteredScenarios() {
    const p = state.persona || lsGet(STORAGE_PERSONA, "");
    return SCENARIOS.filter(s => !p || s.personas.includes(p));
  }

  function computeScore(design) {
    return window.__DS_RULES?.computeScore?.(design)
      ?? window.__DS_RULES?.validateDesign?.(design)?.score
      ?? null;
  }

  function readUrlParams() {
    try {
      const params = new URLSearchParams(location.search);
      const exp = params.get("experience");
      const scen = params.get("scenario");
      if (exp) setMode(exp);
      if (scen && scenarioById(scen)) {
        state.scenarioId = scen;
        lsSet(STORAGE_SCENARIO, scen);
      }
    } catch (e) { /* ignore */ }
  }

  function restorePersisted() {
    state.persona = lsGet(STORAGE_PERSONA, "") || null;
    state.scenarioId = lsGet(STORAGE_SCENARIO, "") || null;
    if (state.scenarioId && !scenarioById(state.scenarioId)) state.scenarioId = null;
  }

  function modeLabel(mode) {
    if (mode === "guided") return "Guided";
    if (mode === "presenter") return "Presenter";
    return "Classic";
  }

  function syncMenuButton() {
    const btn = document.getElementById("exp-menu-btn");
    if (!btn) return;
    const mode = getMode();
    btn.dataset.mode = mode;
    btn.title = "Switch experience mode (Classic = full tool, Guided = scenario path, Presenter = customer view)";
    const label = btn.querySelector(".exp-menu-label");
    if (label) label.textContent = `Experience: ${modeLabel(mode)}`;
  }

  function buildExperienceMenu() {
    if (document.getElementById("exp-menu-wrap")) return;
    const anchor = document.querySelector(".actionbar-end");
    if (!anchor) return;
    const wrap = document.createElement("div");
    wrap.id = "exp-menu-wrap";
    wrap.innerHTML = `
      <button type="button" id="exp-menu-btn" aria-haspopup="true" aria-expanded="false">
        <span class="exp-menu-label">Experience: Classic</span>
        <span aria-hidden="true">▾</span>
      </button>
      <div id="exp-menu-pop" hidden role="menu"></div>`;
    anchor.insertBefore(wrap, anchor.firstChild);

    const pop = document.getElementById("exp-menu-pop");
    pop.innerHTML = [
      { id: "classic", title: "Classic", desc: "Full portfolio graph and Design Studio — no guided flow" },
      { id: "guided", title: "Guided", desc: "Role-based scenarios, outcome strip, and your path checklist" },
      { id: "presenter", title: "Presenter", desc: "Guided scenario plus customer-safe presentation chrome" }
    ].map(o => `
      <button type="button" class="exp-menu-item" data-exp-mode="${o.id}" role="menuitem">
        <strong>${escapeHtml(o.title)}</strong>
        <span>${escapeHtml(o.desc)}</span>
      </button>`).join("");

    const btn = document.getElementById("exp-menu-btn");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = pop.classList.toggle("open");
      pop.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    pop.addEventListener("click", (e) => {
      const item = e.target.closest("[data-exp-mode]");
      if (!item) return;
      setMode(item.dataset.expMode);
      pop.classList.remove("open");
      pop.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (getMode() !== "classic" && !state.scenarioId) {
        openEntryOverlay(null);
      }
    });
    document.addEventListener("click", () => {
      pop.classList.remove("open");
      pop.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    });
    syncMenuButton();
  }

  function buildEntryOverlay() {
    if (document.getElementById("ge-overlay")) return;
    const ov = document.createElement("div");
    ov.id = "ge-overlay";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.innerHTML = `
      <div id="ge-panel">
        <div class="ge-head">
          <div class="ge-title" id="ge-title">Guided experience</div>
          <div class="ge-sub" id="ge-sub">Pick your role and a demo scenario. Design Studio opens with a loaded design, outcome summary, and a step-by-step path.</div>
        </div>
        <div id="ge-body"></div>
        <div class="ge-foot">
          <button type="button" class="ge-btn ghost" id="ge-use-classic">Use Classic instead</button>
          <div class="ge-actions">
            <button type="button" class="ge-btn ghost" id="ge-back" hidden>Back</button>
            <button type="button" class="ge-btn ghost" id="ge-skip">Cancel</button>
            <button type="button" class="ge-btn primary" id="ge-next" disabled>Continue</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(ov);
    document.getElementById("ge-use-classic").onclick = () => {
      setMode("classic");
      closeEntryOverlay();
      state.pendingOpen?.();
      state.pendingOpen = null;
    };
    document.getElementById("ge-skip").onclick = () => {
      closeEntryOverlay();
      state.pendingOpen = null;
    };
    document.getElementById("ge-back").onclick = () => {
      state.entryStep = 1;
      renderEntryStep();
    };
    document.getElementById("ge-next").onclick = onEntryContinue;
    ov.addEventListener("click", (e) => {
      if (e.target === ov) closeEntryOverlay();
    });
  }

  function openEntryOverlay(afterLoad) {
    buildEntryOverlay();
    state.entryOpen = true;
    state.pendingOpen = typeof afterLoad === "function" ? afterLoad : null;
    state.entryStep = state.persona ? 2 : 1;
    document.getElementById("ge-overlay").classList.add("show");
    document.body.style.overflow = "hidden";
    renderEntryStep();
  }

  function closeEntryOverlay() {
    state.entryOpen = false;
    const ov = document.getElementById("ge-overlay");
    if (ov) ov.classList.remove("show");
    if (!document.getElementById("design-studio")?.classList.contains("open")) {
      document.body.style.overflow = "";
    }
  }

  function renderEntryStep() {
    const body = document.getElementById("ge-body");
    const next = document.getElementById("ge-next");
    const back = document.getElementById("ge-back");
    if (!body || !next) return;

    if (state.entryStep === 1) {
      back.hidden = true;
      next.textContent = "Continue";
      next.disabled = !state.persona;
      body.innerHTML = `
        <div class="ge-step-lbl">Step 1 — Your role</div>
        <div class="ge-grid" id="ge-persona-grid">
          ${PERSONAS.map(p => `
            <button type="button" class="ge-card${state.persona === p.id ? " selected" : ""}" data-persona="${p.id}">
              <strong>${escapeHtml(p.label)}</strong>
              <p>${escapeHtml(p.hint)}</p>
            </button>`).join("")}
        </div>`;
      body.querySelectorAll("[data-persona]").forEach(el => {
        el.onclick = () => {
          state.persona = el.dataset.persona;
          lsSet(STORAGE_PERSONA, state.persona);
          body.querySelectorAll(".ge-card").forEach(c => c.classList.toggle("selected", c.dataset.persona === state.persona));
          next.disabled = false;
        };
      });
      return;
    }

    back.hidden = false;
    next.textContent = "Load scenario";
    next.disabled = !state.scenarioId;
    const list = filteredScenarios();
    body.innerHTML = `
      <div class="ge-step-lbl">Step 2 — Pick a scenario</div>
      <div class="ge-grid" id="ge-scenario-grid">
        ${list.map(s => `
          <button type="button" class="ge-card${state.scenarioId === s.id ? " selected" : ""}" data-scenario="${s.id}">
            <strong>${escapeHtml(s.title)}</strong>
            <p>${escapeHtml(s.subtitle)}</p>
            <div class="ge-meta">${s.networkTemplate ? "Network + room" : "Room design"} · CT/CVD aligned</div>
          </button>`).join("")}
      </div>`;
    body.querySelectorAll("[data-scenario]").forEach(el => {
      el.onclick = () => {
        state.scenarioId = el.dataset.scenario;
        lsSet(STORAGE_SCENARIO, state.scenarioId);
        body.querySelectorAll(".ge-card").forEach(c => c.classList.toggle("selected", c.dataset.scenario === state.scenarioId));
        next.disabled = false;
      };
    });
  }

  function onEntryContinue() {
    if (state.entryStep === 1) {
      if (!state.persona) return;
      state.entryStep = 2;
      if (!state.scenarioId || !filteredScenarios().some(s => s.id === state.scenarioId)) {
        state.scenarioId = filteredScenarios()[0]?.id || null;
      }
      renderEntryStep();
      return;
    }
    if (!state.scenarioId) return;
    closeEntryOverlay();
    loadScenario(state.scenarioId, true);
    const cb = state.pendingOpen;
    state.pendingOpen = null;
    if (cb) cb();
    else window.DesignStudio?.open?.();
  }

  function ensureStudioBar() {
    const ds = document.getElementById("design-studio");
    if (!ds || document.getElementById("ge-studio-bar")) return;
    const bar = document.createElement("div");
    bar.id = "ge-studio-bar";
    bar.innerHTML = `
      <div class="ge-outcome">
        <span class="ge-outcome-label">Outcome</span>
        <strong id="ge-outcome-text"></strong>
        <span id="ge-score-pill" hidden></span>
      </div>
      <div class="ge-path" id="ge-path-wrap">
        <span class="ge-path-lbl">Your path</span>
        <span id="ge-path-steps"></span>
      </div>
      <button type="button" id="ge-change-scenario">Change scenario…</button>`;
    const header = document.getElementById("ds-header");
    if (header) header.insertAdjacentElement("afterend", bar);
    document.getElementById("ge-change-scenario").onclick = () => {
      openEntryOverlay(() => window.DesignStudio?.open?.());
    };
  }

  function hideStudioBar() {
    document.getElementById("design-studio")?.classList.remove("ge-active");
    document.getElementById("ge-studio-bar")?.setAttribute("hidden", "");
  }

  function refreshStudioBar(studio) {
    if (getMode() === "classic") {
      hideStudioBar();
      return;
    }
    const scenario = scenarioById(state.scenarioId);
    if (!scenario) return;
    ensureStudioBar();
    const ds = document.getElementById("design-studio");
    ds?.classList.add("ge-active");
    document.getElementById("ge-studio-bar")?.removeAttribute("hidden");

    const outcome = document.getElementById("ge-outcome-text");
    if (outcome) outcome.textContent = scenario.outcomeHeadline;

    const score = studio?.design ? window.__DS_RULES?.computeScore?.(studio.design) : null;
    const pill = document.getElementById("ge-score-pill");
    if (pill) {
      if (score != null) {
        pill.hidden = false;
        pill.textContent = `Score ${score}/100`;
      } else {
        pill.hidden = true;
      }
    }

    const stepsEl = document.getElementById("ge-path-steps");
    if (stepsEl) {
      stepsEl.innerHTML = (scenario.pathSteps || []).map(step => `
        <button type="button" class="ge-path-step${state.pathDone[step.id] ? " done" : ""}" data-path="${step.id}" data-action="${step.action}">
          ${state.pathDone[step.id] ? "✓ " : ""}${escapeHtml(step.label)}
        </button>`).join("");
      stepsEl.querySelectorAll("[data-action]").forEach(btn => {
        btn.onclick = () => runPathAction(btn.dataset.action, btn.dataset.path, studio);
      });
    }
  }

  function runPathAction(action, pathId, studio) {
    if (!studio) studio = window.DesignStudio?.instance;
    if (!studio) return;
    state.pathDone[pathId] = true;

    switch (action) {
      case "network":
        studio.setTab("network");
        studio.fitView?.();
        break;
      case "room":
        studio.setTab("room");
        studio.fitView?.();
        break;
      case "validate":
        studio.setSidebarMode("quote");
        studio.panelTab = "validate";
        studio.renderInspector?.();
        break;
      case "learn":
        studio.setSidebarMode("learn");
        studio.refreshExplore?.();
        break;
      case "walk":
        studio.setTab("room");
        window.__DS_WALK?.open?.(studio);
        break;
      case "dcloud":
        window.openDcloudBrowser?.();
        break;
      case "export":
        studio.setSidebarMode("quote");
        studio.panelTab = "bom";
        studio.renderInspector?.();
        break;
      default:
        break;
    }
    refreshStudioBar(studio);
    studio.render?.();
  }

  function applyPresenterChrome(studio) {
    if (getMode() !== "presenter" || !studio) return;
    studio.presentation = true;
    studio.showMinimap = false;
    studio.el?.classList.add("ds-present-mode");
    document.getElementById("ds-canvas-wrap")?.classList.add("presentation");
    if (studio.design?.rooms?.length) studio.setTab("room");
    studio.render?.();
  }

  function clearPresenterChrome(studio) {
    if (!studio) return;
    studio.presentation = false;
    studio.el?.classList.remove("ds-present-mode");
    document.getElementById("ds-canvas-wrap")?.classList.remove("presentation");
  }

  function loadScenario(scenarioId, skipOpen) {
    const scenario = scenarioById(scenarioId);
    const studio = window.DesignStudio?.instance;
    if (!scenario || !studio) return false;

    state.scenarioId = scenarioId;
    lsSet(STORAGE_SCENARIO, scenarioId);
    state.pathDone = Object.create(null);

    const acct = scenario.title;
    if (typeof studio.resetForScenario === "function") {
      studio.resetForScenario(acct, scenario.intentText);
    } else {
      studio.startOver?.();
      return false;
    }

    if (scenario.networkTemplate) studio.applyRefArch(scenario.networkTemplate);
    if (scenario.roomTemplate) studio.addRoomTemplate(scenario.roomTemplate);

    const ta = document.getElementById("ds-intent-text");
    if (ta) ta.value = scenario.intentText || "";

    if (!skipOpen && !studio.el?.classList.contains("open")) {
      window.DesignStudio.open();
    } else {
      studio.render?.();
    }

    applyPresenterChrome(studio);
    refreshStudioBar(studio);
    return true;
  }

  function shouldPromptEntry() {
    if (getMode() === "classic") return false;
    if (!state.scenarioId) return true;
    const studio = window.DesignStudio?.instance;
    const empty = !studio?.design?.nodes?.length && !(studio?.design?.rooms || []).length;
    return empty;
  }

  function patchDesignStudioOpen() {
    const api = window.DesignStudio;
    if (!api?.open || api.open.__gePatched) return;
    const orig = api.open.bind(api);
    api.open = function geOpen() {
      const mode = getMode();
      if (mode === "classic") return orig();
      if (shouldPromptEntry()) {
        openEntryOverlay(() => orig());
        return;
      }
      const result = orig();
      onStudioOpen(window.DesignStudio.instance);
      return result;
    };
    api.open.__gePatched = true;
  }

  function onStudioOpen(studio) {
    if (getMode() === "classic") {
      hideStudioBar();
      return;
    }
    if (state.scenarioId && studio?.design && !studio.design.nodes?.length && !(studio.design.rooms || []).length) {
      loadScenario(state.scenarioId, true);
    }
    applyPresenterChrome(studio);
    refreshStudioBar(studio);
  }

  function onStudioClose(studio) {
    clearPresenterChrome(studio);
    if (!state.entryOpen) document.body.style.overflow = "";
  }

  function init() {
    readUrlParams();
    restorePersisted();
    setMode(getMode());
    buildExperienceMenu();
    buildEntryOverlay();
    ensureStudioBar();

    const tryPatch = () => {
      patchDesignStudioOpen();
      if (!window.DesignStudio?.open?.__gePatched) setTimeout(tryPatch, 50);
    };
    tryPatch();
  }

  window.__CPN_EXPERIENCE = {
    getMode,
    setMode,
    getScenario: () => scenarioById(state.scenarioId),
    loadScenario,
    openEntry: openEntryOverlay,
    onStudioOpen,
    onStudioClose,
    PERSONAS,
    SCENARIOS
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
