/** Shared chrome + pillar picker for context mockups */
function initPillarMockup(opts = {}) {
  const { onPillar, defaultPillar = "ai-dc" } = opts;
  let pillarId = defaultPillar;

  const topbar = document.querySelector(".topbar");
  if (topbar && !topbar.innerHTML.trim()) {
    topbar.innerHTML = `
      <div class="logo-dot"></div>
      <span class="topbar-title">Cisco Portfolio Navigator</span>
      <span class="topbar-spacer"></span>
      <div class="vm-seg"><span>Overview</span><span class="on">Families</span><span>Composition</span></div>`;
  }

  const ab = document.querySelector(".actionbar");
  if (ab && !ab.dataset.init) {
    ab.dataset.init = "1";
    ab.innerHTML = PILLAR_ORDER.map(id => {
      const p = PILLAR_CTX[id];
      return `<button type="button" class="pp" data-pp="${id}"><span class="pp-dot" style="background:${p.color}"></span> ${p.label.split(" ")[0]}… <span style="opacity:.6">${p.familyCount}</span></button>`;
    }).join("") + `<span class="pp-sep"></span><span class="chip">Mockup</span>`;
    ab.addEventListener("click", e => {
      const b = e.target.closest(".pp");
      if (!b) return;
      pillarId = b.dataset.pp;
      sync();
      onPillar?.(pillarId);
    });
  }

  const ctrl = document.querySelector(".controls");
  if (ctrl && !ctrl.dataset.init) {
    ctrl.dataset.init = "1";
    ctrl.innerHTML = `<label>Pillar</label><div class="pill-row pillar-toggle"></div>`;
    const row = ctrl.querySelector(".pillar-toggle");
    row.innerHTML = PILLAR_ORDER.map(id => {
      const p = PILLAR_CTX[id];
      return `<button type="button" data-pillar="${id}"><span class="dot" style="background:${p.color}"></span> ${p.label.replace("Future-Proofed ", "").replace("AI-Ready ", "")}</button>`;
    }).join("");
    row.addEventListener("click", e => {
      const b = e.target.closest("[data-pillar]");
      if (!b) return;
      pillarId = b.dataset.pillar;
      sync();
      onPillar?.(pillarId);
    });
  }

  function sync() {
    document.querySelectorAll(".pp").forEach(b => b.classList.toggle("on", b.dataset.pp === pillarId));
    document.querySelectorAll("[data-pillar]").forEach(b => b.classList.toggle("on", b.dataset.pillar === pillarId));
  }

  sync();
  return { getPillar: () => pillarId, setPillar: id => { pillarId = id; sync(); onPillar?.(id); } };
}
