/**
 * Outcome framing — lives in the detail panel Overview tab (expand on demand).
 * Legacy #outcome-card canvas element is kept hidden; offsetW() is always 0.
 */
(function () {
  "use strict";

  let panelFamilyId = null;
  let panelExpanded = false;
  let panelExpandedMore = false;

  function cardEl() {
    return document.getElementById("outcome-card");
  }

  function isVisible() {
    const block = document.querySelector("#pbody .p-outcome-block.is-expanded");
    return !!block;
  }

  function offsetW() {
    return 0;
  }

  function escapeHtml(s) {
    if (typeof window.escapeHtml === "function") return window.escapeHtml(s);
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escapeAttr(s) { return escapeHtml(s); }

  function problemBlockHtml(prob, persona, P, opts) {
    const view = P.personaView ? P.personaView(prob, persona) : {
      symptom: prob.symptom,
      line: persona ? P.personaLine(prob, persona) : prob.outcome,
      proof: prob.proof
    };
    const symptom = view.symptom || prob.symptom;
    const line = view.line || prob.outcome;
    const proof = view.proof || prob.proof;
    const compare = proof
      ? `<div class="oc-compare">
          <div class="oc-compare-box oc-compare-before">
            <div class="oc-compare-lbl">Before</div>${escapeHtml(proof.before)}
          </div>
          <div class="oc-compare-arrow" aria-hidden="true">→</div>
          <div class="oc-compare-box oc-compare-after">
            <div class="oc-compare-lbl">After</div>${escapeHtml(proof.after)}
          </div>
        </div>`
      : "";
    const next = prob.maturityNext ? P.getProblem(prob.maturityNext) : null;
    const familyId = opts?.familyId;
    const chainRelevant = next && (!familyId || (next.families || []).includes(familyId));
    const chain = chainRelevant
      ? `<button type="button" class="oc-prob-next" data-ocj-explore="${escapeAttr(next.id)}">Then explore <b>${escapeHtml(next.outcome)}</b> →</button>`
      : "";
    const divider = opts?.withDivider ? `<div class="oc-prob-divider" role="separator"></div>` : "";
    return `${divider}
      <p class="oc-quote">"<em>${escapeHtml(symptom)}</em>"</p>
      <div class="oc-headline">${escapeHtml(line)}</div>
      ${compare}
      ${chain}`;
  }

  function teaserSummary(prob, persona, P) {
    const headline = persona ? P.personaLine(prob, persona) : prob.outcome;
    const personaObj = persona && prob.personas?.[persona];
    const symptom = typeof personaObj === "object" ? personaObj?.symptom : null;
    const showSym = symptom && symptom !== headline;
    return { headline, symptom: showSym ? symptom : null };
  }

  function buildPanelHtml(familyId) {
    const P = window.__cpnProblems;
    if (!P) return "";
    const problems = P.problemsForFamily(familyId);
    if (!problems.length) return "";

    const persona = typeof currentPersona === "function" ? currentPersona() : "";
    const primary = problems[0];
    const rest = problems.slice(1);
    const showRest = panelExpandedMore && rest.length;
    const { headline, symptom } = teaserSummary(primary, persona, P);

    const personaChips = P.PERSONAS.map(pp =>
      `<button type="button" role="tab" aria-selected="${pp.id === persona ? "true" : "false"}" class="oc-persona${pp.id === persona ? " on" : ""}" data-oc-persona="${escapeAttr(pp.id)}">${escapeHtml(pp.label)}</button>`
    ).join("");

    const moreBtn = rest.length && !panelExpandedMore
      ? `<button type="button" class="oc-more" data-oc-more>+ ${rest.length} more problem${rest.length > 1 ? "s" : ""}</button>`
      : "";

    const toggleLabel = panelExpanded ? "Hide outcome framing" : "Show full outcome framing";

    return `<div class="p-outcome-block${panelExpanded ? " is-expanded" : ""}" data-outcome-family="${escapeAttr(familyId)}">
      <button type="button" class="p-outcome-teaser" aria-expanded="${panelExpanded ? "true" : "false"}">
        <div class="p-outcome-label">What problem this solves</div>
        ${symptom ? `<div class="p-outcome-sym">${escapeHtml(symptom)}</div>` : ""}
        <div class="p-outcome-head">${escapeHtml(headline)}</div>
        <div class="p-outcome-link">${toggleLabel} ${panelExpanded ? "↑" : "→"}</div>
      </button>
      <div class="p-outcome-body"${panelExpanded ? "" : " hidden"}>
        <div class="oc-persona-block">
          <div class="oc-persona-label">View as</div>
          <div class="oc-personas" role="tablist" aria-label="Frame outcome for persona">${personaChips}</div>
        </div>
        <div class="oc-problems">
          ${problemBlockHtml(primary, persona, P, { familyId })}
          ${showRest ? rest.map(p => problemBlockHtml(p, persona, P, { withDivider: true, familyId })).join("") : ""}
          ${moreBtn}
        </div>
        <div class="oc-note" title="${escapeAttr(P.DISCLAIMER)}">Directional talking points · not guarantees</div>
      </div>
    </div>`;
  }

  function wirePanelBlock(host, familyId) {
    if (!host) return;
    host.querySelector(".p-outcome-teaser")?.addEventListener("click", () => {
      panelExpanded = !panelExpanded;
      remountPanel(host, familyId);
    });
    host.querySelectorAll("[data-oc-persona]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = btn.dataset.ocPersona;
        const cur = typeof currentPersona === "function" ? currentPersona() : "";
        if (typeof setPersona === "function") setPersona(val === cur ? "" : val);
        if (typeof restoreGraphNodeIcons === "function") restoreGraphNodeIcons();
        remountPanel(host, familyId);
      });
    });
    host.querySelector("[data-oc-more]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      panelExpandedMore = true;
      panelExpanded = true;
      remountPanel(host, familyId);
    });
    host.querySelectorAll("[data-ocj-explore]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof exploreProblem === "function") exploreProblem(btn.dataset.ocjExplore);
        if (typeof restoreGraphNodeIcons === "function") restoreGraphNodeIcons();
      });
    });
  }

  function remountPanel(host, familyId) {
    host.innerHTML = buildPanelHtml(familyId);
    wirePanelBlock(host, familyId);
  }

  function mountPanelOutcome(host, familyId, opts) {
    if (!host || !familyId) return;
    const P = window.__cpnProblems;
    if (!P || !P.problemsForFamily(familyId).length) {
      host.innerHTML = "";
      return;
    }
    if (familyId !== panelFamilyId) {
      panelFamilyId = familyId;
      panelExpanded = !!opts?.startExpanded;
      panelExpandedMore = false;
    } else if (opts?.startExpanded) {
      panelExpanded = true;
    }
    remountPanel(host, familyId);
  }

  function hideOutcomeCard() {
    const card = cardEl();
    if (card) {
      card.style.display = "none";
      card.setAttribute("aria-hidden", "true");
    }
    panelFamilyId = null;
    panelExpanded = false;
    panelExpandedMore = false;
  }

  /** @deprecated Canvas card — redirects to panel mount when possible */
  function showOutcomeCard(familyId, node, opts) {
    hideOutcomeCard();
    const slot = document.querySelector("#pbody .p-outcome-slot[data-outcome-family=\"" + familyId + "\"]")
      || document.querySelector("#pbody .p-outcome-slot");
    if (slot) {
      mountPanelOutcome(slot, familyId, { startExpanded: true });
      return;
    }
    const overview = document.querySelector('#pbody .p-tab-pane[data-tab="overview"]');
    if (overview) {
      let slotEl = overview.querySelector(".p-outcome-slot");
      if (!slotEl) {
        slotEl = document.createElement("div");
        slotEl.className = "p-outcome-slot";
        slotEl.dataset.outcomeFamily = familyId;
        overview.insertBefore(slotEl, overview.firstChild);
      }
      mountPanelOutcome(slotEl, familyId, { startExpanded: true });
    }
  }

  function repositionOutcomeCard() { /* no-op — panel-local */ }

  window.__cpnOutcomeCard = {
    show: showOutcomeCard,
    hide: hideOutcomeCard,
    reposition: repositionOutcomeCard,
    offsetW,
    isVisible,
    mountPanel: mountPanelOutcome,
    buildPanelHtml
  };
})();
