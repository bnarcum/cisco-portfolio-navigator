/**
 * Portfolio Navigator — solution journey walk (REF_ARCH + Spaces-style wayfinding)
 */
(function () {
  "use strict";

  const STENCIL_BY_CAT = {
    networking: "c9200-access",
    security: "fpr-1120",
    collaboration: "room-kit-eq",
    compute: "ucs-c240",
    observability: "thousandeyes-logical",
    cloud: "spaces-cloud",
    management: "catalyst-center-logical"
  };

  const LINK_MEDIA = {
    direct: "fiber-sm",
    adjacent: "cat6",
    succession: "control",
    composition: "cat6a"
  };

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function pg() {
    return window.__cpnV2?.portfolioGraph;
  }

  function stencilForFamily(fam) {
    const cat = fam?.category || "networking";
    return STENCIL_BY_CAT[cat] || "c9200-access";
  }

  function heroUrl(familyId) {
    return pg()?.familyHero?.(familyId)
      || window.CPN_FAMILY_HERO_IMAGES?.[familyId]
      || null;
  }

  function layoutPositions(count) {
    const out = [];
    const n = Math.max(1, count);
    const span = Math.max(14, n * 5.5);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const angle = (t - 0.5) * Math.PI * 0.65;
      const radius = 8 + n * 0.85;
      out.push({
        x: Math.sin(angle) * radius,
        y: 3,
        z: i * 6.2 - span * 0.5
      });
    }
    return out;
  }

  function buildGraph(journey) {
    const products = (journey?.products || []).filter(Boolean);
    if (!products.length) return null;

    const positions = layoutPositions(products.length);
    const chambers = products.map((id, i) => {
      const fam = pg()?.getFamily?.(id);
      const pos = positions[i];
      return {
        id,
        stencilId: stencilForFamily(fam),
        label: fam?.name || id,
        pid: "",
        zone: fam?.pillar === "workplaces" ? "collab" : (fam?.pillar === "resilience" ? "security" : "core"),
        photoUrl: heroUrl(id),
        pos: { ...pos },
        portfolioFamilyId: id,
        journeyIndex: i + 1,
        journeyTotal: products.length,
        journeyWhy: fam?.desc || "",
        canvas: "network"
      };
    });

    const chamberMap = Object.fromEntries(chambers.map(c => [c.id, c]));
    const corridorKeys = new Set();
    const corridors = [];

    function addCorridor(from, to, label, media, type) {
      if (!from || !to || from.id === to.id) return;
      const key = [from.id, to.id].sort().join("|");
      if (corridorKeys.has(key)) return;
      corridorKeys.add(key);
      corridors.push({
        id: `cor-${from.id}-${to.id}`,
        from,
        to,
        media: media || "cat6",
        label: label || "Connected",
        linkType: type || "adjacent",
        color: type === "direct" ? 0x6eb8ff : 0xd4a060
      });
    }

    for (let i = 0; i < chambers.length - 1; i++) {
      addCorridor(chambers[i], chambers[i + 1], "Solution path", "fiber-sm", "journey");
    }

    const links = pg()?.findLinks?.(products) || [];
    links.forEach(l => {
      const a = chamberMap[l.source], b = chamberMap[l.target];
      if (!a || !b) return;
      const type = l.type || "adjacent";
      addCorridor(a, b, pg()?.connectionLabel?.(type) || type, LINK_MEDIA[type] || "cat6", type);
    });

    const wx = chambers.map(c => c.pos.x);
    const wz = chambers.map(c => c.pos.z);
    const pad = 12;
    const layoutBounds = {
      minX: Math.min(...wx) - pad,
      maxX: Math.max(...wx) + pad,
      minZ: Math.min(...wz) - pad,
      maxZ: Math.max(...wz) + pad
    };

    return {
      room: { name: journey.title || "Solution journey" },
      chambers,
      corridors,
      kind: "portfolio-journey",
      journeyMeta: {
        title: journey.title,
        desc: journey.desc,
        useCase: journey.useCase
      },
      layoutBounds,
      semanticFrame: null,
      layoutDiagram: { kind: "portfolio-journey", cx: 0, cy: 0, scale: 1 }
    };
  }

  function neighbors(ch) {
    const graph = window.__DS_WALK?.getGraph?.();
    const ids = new Set();
    (graph?.corridors || []).forEach(c => {
      if (c.from.id === ch.id) ids.add(c.to.id);
      if (c.to.id === ch.id) ids.add(c.from.id);
    });
    return [...ids];
  }

  function renderFieldPanel(ch, panelEl) {
    if (!panelEl || !ch?.portfolioFamilyId) return;
    const fam = pg()?.getFamily?.(ch.portfolioFamilyId);
    const meta = window.__DS_WALK?.getGraph?.()?.journeyMeta || {};
    const cat = fam?.category ? (window.__cpnV2?.CATS?.[fam.category] || null) : null;
    const ucs = (fam?.useCases || []).slice(0, 4);
    const nbrs = neighbors(ch).map(id => pg()?.getFamily?.(id)?.name || id);

    panelEl.hidden = false;
    panelEl.innerHTML = `
      <header class="ds-fp-head">
        <div>
          <div class="ds-fp-kicker">Stop ${ch.journeyIndex} of ${ch.journeyTotal} · ${esc(meta.title || "Solution journey")}</div>
          <h2 class="ds-fp-title">${esc(ch.label)}</h2>
          ${cat ? `<span class="ds-fp-badge" style="background:${cat.color}22;color:${cat.color}">${esc(cat.label)}</span>` : ""}
        </div>
        <button type="button" class="ds-fp-close" data-action="fp-close" aria-label="Close">✕</button>
      </header>
      <div class="ds-fp-body cpn-journey-fp">
        ${ch.journeyWhy ? `<p class="cpn-jf-desc">${esc(ch.journeyWhy)}</p>` : ""}
        ${meta.desc && ch.journeyIndex === 1 ? `<p class="cpn-jf-arch"><strong>Stack story:</strong> ${esc(meta.desc)}</p>` : ""}
        ${ucs.length ? `<div class="cpn-jf-ucs">${ucs.map(u => `<span class="cpn-jf-uc">${esc(u)}</span>`).join("")}</div>` : ""}
        ${nbrs.length ? `<p class="cpn-jf-links"><strong>Connected here:</strong> ${esc(nbrs.join(", "))}</p>` : ""}
        <div class="cpn-jf-actions">
          <button type="button" class="ds-fp-btn primary" data-jf="graph">View in graph</button>
          <button type="button" class="ds-fp-btn" data-jf="planner">+ Account list</button>
          <button type="button" class="ds-fp-btn" data-jf="ai">Ask AI</button>
        </div>
      </div>`;

    panelEl.querySelector("[data-jf=graph]")?.addEventListener("click", () => {
      window.__DS_WALK?.close?.();
      window.jumpTo?.(ch.portfolioFamilyId);
    });
    panelEl.querySelector("[data-jf=planner]")?.addEventListener("click", () => {
      window.addToStack?.(ch.portfolioFamilyId, "node");
    });
    panelEl.querySelector("[data-jf=ai]")?.addEventListener("click", () => {
      const prompt = `Explain how ${ch.label} fits in a ${meta.title || meta.useCase || "Cisco"} solution stack for a customer. What integrates natively with adjacent families?`;
      window.__cpnV2?.phases?.openAiWithPrompt?.(prompt) || window.openAiWithPrompt?.(prompt);
    });
  }

  function openFromUseCase(useCase) {
    const arch = window.__cpnV2?.REF_ARCH?.[useCase];
    if (!arch?.products?.length) {
      console.warn("[Journey walk] No REF_ARCH for", useCase);
      return false;
    }
    const journey = {
      title: useCase,
      desc: arch.desc,
      useCase,
      products: arch.products.slice()
    };
    const graph = buildGraph(journey);
    if (!graph || !window.__DS_WALK?.openJourney) return false;
    window.__DS_WALK.openJourney(journey, graph);
    return true;
  }

  function openFromStack(familyIds, title) {
    const ids = [...new Set((familyIds || []).filter(Boolean))];
    if (!ids.length) return false;
    const journey = {
      title: title || "Your account stack",
      desc: "Walk the families on your list and see how they connect.",
      useCase: "",
      products: ids
    };
    const graph = buildGraph(journey);
    if (!graph || !window.__DS_WALK?.openJourney) return false;
    window.__DS_WALK.openJourney(journey, graph);
    return true;
  }

  window.__CPN_JOURNEY_WALK = {
    buildGraph,
    openFromUseCase,
    openFromStack,
    renderFieldPanel
  };

  if (window.__cpnV2) {
    window.__cpnV2.openPortfolioJourney = openFromUseCase;
    window.__cpnV2.openStackJourney = openFromStack;
  }
})();
