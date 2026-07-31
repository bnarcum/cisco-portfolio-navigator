/**
 * Outcome-first solution composition — builds multi-family stacks from curated
 * PROBLEMS (assets/cpn-problems.js) and BUNDLES (index.html), validated against live NODES.
 */
(function () {
  "use strict";

  const LAYER_BY_CAT = {
    networking: { key: "connect", label: "Connect & steer", order: 1 },
    security: { key: "secure", label: "Secure", order: 2 },
    collaboration: { key: "collab", label: "Collaborate", order: 3 },
    observability: { key: "observe", label: "Observe & automate", order: 4 },
    computing: { key: "automate", label: "Compute & platform", order: 5 }
  };

  const PILLAR_FILTER = {
    connectivity: { id: "connectivity", label: "Connectivity" },
    workplaces: { id: "workplaces", label: "Workplaces" },
    "ai-dc": { id: "ai-dc", label: "AI & data center" },
    resilience: { id: "resilience", label: "Resilience & ops" }
  };

  function problemsApi() {
    return window.__cpnProblems;
  }

  function bundlesList() {
    return typeof window.__cpnSolutionsBundles === "function"
      ? window.__cpnSolutionsBundles()
      : (window.BUNDLES || []);
  }

  function nodeById(fid) {
    return window.nodeById && window.nodeById[fid] ? window.nodeById[fid] : null;
  }

  function prodById(pid) {
    return window.prodById && window.prodById[pid] ? window.prodById[pid] : null;
  }

  /** Family ids from a problem that exist in the portfolio graph. */
  function validFamilyIds(problem) {
    if (!problem) return [];
    return (problem.families || []).filter(fid => nodeById(fid));
  }

  function resolveBundle(problem) {
    const bundles = bundlesList();
    const names = problem.bundles || [];
    for (let i = 0; i < names.length; i++) {
      const b = bundles.find(x => x.name === names[i]);
      if (b) return b;
    }
    return null;
  }

  /** Families that appear in the named bundle AND this outcome's family list. */
  function coreFamilySet(problem) {
    const valid = validFamilyIds(problem);
    const set = new Set(valid);
    const bundle = resolveBundle(problem);
    if (bundle && bundle.products && bundle.products.length) {
      const fromBundle = new Set();
      bundle.products.forEach(pid => {
        const p = prodById(pid);
        const fam = p && p.family ? p.family : (nodeById(pid) ? pid : null);
        if (fam && set.has(fam)) fromBundle.add(fam);
      });
      if (fromBundle.size) return fromBundle;
    }
    if (problem.signals && Array.isArray(problem.signals.has)) {
      const sig = new Set(problem.signals.has.filter(fid => set.has(fid)));
      if (sig.size) return sig;
    }
    return new Set(valid);
  }

  function hubFamilyId(problem) {
    const valid = validFamilyIds(problem);
    if (!valid.length) return null;
    const core = coreFamilySet(problem);
    for (let i = 0; i < valid.length; i++) {
      if (core.has(valid[i])) return valid[i];
    }
    return valid[0];
  }

  function buildLayerStack(problem) {
    const core = coreFamilySet(problem);
    const layerMap = new Map();
    validFamilyIds(problem).forEach(fid => {
      const node = nodeById(fid);
      const cat = (node && node.category) || "networking";
      const layer = LAYER_BY_CAT[cat] || LAYER_BY_CAT.networking;
      if (!layerMap.has(layer.key)) {
        layerMap.set(layer.key, { key: layer.key, label: layer.label, order: layer.order, rows: [] });
      }
      const desc = (node && node.desc) || "";
      const shortDesc = desc.length > 120 ? desc.slice(0, 118) + "…" : desc;
      layerMap.get(layer.key).rows.push({
        familyId: fid,
        name: node.name,
        shortDesc,
        category: cat,
        core: core.has(fid)
      });
    });
    layerMap.forEach(layer => {
      layer.rows.sort((a, b) => a.name.localeCompare(b.name));
    });
    return [...layerMap.values()].sort((a, b) => a.order - b.order);
  }

  function listOutcomes() {
    const P = problemsApi();
    if (!P || !P.PROBLEMS) return [];
    return P.PROBLEMS.map(p => ({
      id: p.id,
      pillar: p.pillar,
      pillarLabel: (PILLAR_FILTER[p.pillar] || { label: p.pillar || "Other" }).label,
      filterId: (PILLAR_FILTER[p.pillar] || { id: "other" }).id,
      symptom: p.symptom,
      outcome: p.outcome,
      useCases: (p.useCases || []).slice(),
      bundles: (p.bundles || []).slice(),
      bundlePrimary: resolveBundle(p)?.name || (p.bundles && p.bundles[0]) || "",
      familyCount: validFamilyIds(p).length,
      familyIds: validFamilyIds(p)
    })).filter(o => o.familyCount > 0);
  }

  function getOutcome(problemId) {
    const P = problemsApi();
    const p = P && P.getProblem ? P.getProblem(problemId) : null;
    if (!p || !validFamilyIds(p).length) return null;
    const bundle = resolveBundle(p);
    const persona = typeof window.currentPersona === "function" ? window.currentPersona() : "";
    const view = P.personaView ? P.personaView(p, persona) : { line: p.outcome, symptom: p.symptom, proof: p.proof };
    return {
      problem: p,
      id: p.id,
      pillar: p.pillar,
      pillarLabel: (PILLAR_FILTER[p.pillar] || { label: p.pillar }).label,
      symptom: p.symptom,
      outcome: p.outcome,
      personaLine: view.line || p.outcome,
      proof: p.proof || null,
      useCases: p.useCases || [],
      bundle: bundle,
      bundleName: bundle ? bundle.name : ((p.bundles && p.bundles[0]) || ""),
      bundleDesc: bundle ? bundle.desc : "",
      layers: buildLayerStack(p),
      familyIds: validFamilyIds(p),
      coreFamilyIds: [...coreFamilySet(p)],
      hubFamilyId: hubFamilyId(p)
    };
  }

  function familySetForProblem(problemId) {
    const o = getOutcome(problemId);
    return o ? new Set(o.familyIds) : new Set();
  }

  window.__cpnSolutions = {
    LAYER_BY_CAT,
    PILLAR_FILTER,
    listOutcomes,
    getOutcome,
    validFamilyIds,
    coreFamilySet,
    hubFamilyId,
    buildLayerStack,
    familySetForProblem,
    resolveBundle
  };
})();
