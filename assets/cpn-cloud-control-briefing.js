/* Cisco AI Canvas (demo) runtime — matched to the Cloud Control product UI.
   Left: AI Assistant conversation. Center/right: generative widget board
   (client table, dual-axis path-health chart, DC anomalies, QoS policy,
   topology, threats). Reads plan context handed off from the Portfolio
   Navigator; all telemetry is illustrative — not live. */
(function () {
  "use strict";

  const ops = window.__cpnOps;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const params = new URLSearchParams(location.search);
  const focusFamily = params.get("focus");

  const DEMO_BRIEF = {
    account: "Wayne Enterprise",
    focusFamily: focusFamily || null,
    stackFamilies: ["cloud-control", "room-systems", "webex-calling", "sdwan", "thousandeyes", "meraki-mx"],
    items: [
      { id: "cloud-control", name: "Cisco Cloud Control" }, { id: "room-systems", name: "Room Systems" },
      { id: "webex-calling", name: "Webex Calling" }, { id: "sdwan", name: "Catalyst SD-WAN" },
      { id: "thousandeyes", name: "ThousandEyes" }, { id: "meraki-mx", name: "Meraki MX" }
    ]
  };

  let brief = DEMO_BRIEF;
  try {
    const raw = sessionStorage.getItem("cpn-cc-brief");
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === "object") {
        brief = p;
        if (focusFamily) brief.focusFamily = focusFamily;
        if (!brief.account) brief.account = "Wayne Enterprise";
        if (!brief.stackFamilies || !brief.stackFamilies.length) brief.stackFamilies = DEMO_BRIEF.stackFamilies;
        if (!brief.items || !brief.items.length) brief.items = DEMO_BRIEF.items;
      }
    }
  } catch (e) { /* demo */ }

  const scenarios = ops.scenariosForFamilies(brief.stackFamilies || []);
  let activeIdx = 0;
  if (brief.focusFamily) {
    const pr = ops.getOpsProfile(brief.focusFamily);
    if (pr && pr.scenario) { const i = scenarios.findIndex(s => s.id === pr.scenario); if (i >= 0) activeIdx = i; }
  }
  let timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const seeded = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* ── top nav tabs ──────────────────────────────────────────────────── */
  const TABS = [
    ["⌂", "Home", true], ["◇", "Intersight"], ["◉", "Meraki"], ["▦", "Nexus Dashboard"],
    ["⛨", "Security"], ["⧉", "Fabrics"], ["◎", "ThousandEyes"], ["▣", "Collaboration Control Hub"]
  ];
  function renderTabs() {
    $("#cc-tabs").innerHTML = TABS.map(([g, l, a]) =>
      `<span class="cc-tab ${a ? "is-active" : ""}"><span class="cc-ico">${g}</span>${esc(l)}</span>`).join("");
  }
  function renderCollab() {
    const scn = scenarios[activeIdx] || {};
    const agents = (scn.domains || []).map(d => ops.DOMAIN_AGENTS[d]).filter(Boolean);
    let html = `<span class="cc-av" style="background:#c9b6f0" title="Alex">A</span>`
      + `<span class="cc-av" style="background:#f0a6c8" title="Bri">B</span>`;
    if (agents.length) html += `<span class="cc-av" style="background:#2a3550;color:#aeb9d0" title="agents">+${agents.length}</span>`;
    $("#cc-collab").innerHTML = html;
  }

  /* ── SVG icons for topology ────────────────────────────────────────── */
  const ICON = {
    cloud: '<path class="ICO" d="M7 16a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5 3.5 3.5 0 0 1-.5 6.5z"/>',
    shield: '<path class="ICO" d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
    switch: '<rect class="ICO" x="3" y="8" width="18" height="8" rx="1.5"/><path class="ICO" d="M7 12h2m3 0h2m3 0h.5"/>',
    wifi: '<path class="ICO" d="M4 9a12 12 0 0 1 16 0M7 12a8 8 0 0 1 10 0M10 15a4 4 0 0 1 4 0"/><circle class="ICO" cx="12" cy="18" r="1"/>',
    device: '<rect class="ICO" x="5" y="4" width="14" height="10" rx="1.5"/><path class="ICO" d="M9 20h6M12 14v6"/>',
    db: '<ellipse class="ICO" cx="12" cy="6" rx="7" ry="3"/><path class="ICO" d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/>'
  };
  function iconType(label) {
    const s = label.toLowerCase();
    if (/cloud|internet|webex|saas|c2|edge/.test(s)) return "cloud";
    if (/firewall|secure|ise|security|shield/.test(s)) return "shield";
    if (/switch|leaf|spine|mx|sd-?wan|branch|catalyst|access sw/.test(s)) return "switch";
    if (/ap|wireless|wifi|room ap/.test(s)) return "wifi";
    if (/storage|db|disk/.test(s)) return "db";
    return "device";
  }

  /* ── widget shell ──────────────────────────────────────────────────── */
  function widget(badge, badgeCls, title, sub, bodyHtml) {
    const w = document.createElement("div");
    w.className = "cc-w";
    w.innerHTML =
      `<div class="cc-w-head">
        <div class="cc-w-titles">
          <div class="cc-w-title">${esc(title)}</div>
          <div class="cc-w-sub">${esc(sub)}</div>
        </div>
        <div class="cc-w-hr">
          <span class="cc-badge cc-badge--${badgeCls}">${esc(badge)}</span>
          <span class="cc-w-dots">⋯</span>
        </div>
      </div>${bodyHtml}`;
    return w;
  }

  /* ── individual widgets ────────────────────────────────────────────── */
  function wClients() {
    const rows = [
      ["jsmith-mac", "MacBook Pro", "SJC23-22A-AP15", "Corp-WPA3", ["Good", "good"], "Connected"],
      ["rpatel-iphone", "iPhone 15", "SJC23-22A-AP29", "Corp-WPA3", ["Fair", "fair"], "Roamed 3m ago"],
      ["kwong-tab", "Webex Desk", "SJC23-21B-AP07", "Corp-WPA3", ["Good", "good"], "Connected"]
    ];
    const body = `<table class="cc-tbl"><thead><tr>
      <th>Client<span class="cc-sort">▾</span></th><th>Device</th><th>Access points</th><th>SSID</th><th>Signal</th><th>Status</th>
      </tr></thead><tbody>${rows.map(r =>
        `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td>
         <td><span class="cc-pill cc-pill--${r[4][1]}">${esc(r[4][0])}</span></td><td>${esc(r[5])}</td></tr>`).join("")}
      </tbody></table>`;
    return widget("Endpoints", "endpoints", "Recently Connected Clients", "Meraki", body);
  }

  function wPathHealth(scn) {
    const W = 460, H = 200, L = 34, R = 34, T = 14, B = 26;
    const iw = W - L - R, ih = H - T - B, n = 40;
    const rnd = seeded(scn.id + "path");
    const peak = Math.min(12, (scn.metric && scn.metric.peak) || 6);
    const loss = [], avail = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const spike = (t > 0.34 && t < 0.46) ? peak * (1 - Math.abs(t - 0.4) / 0.06) : 0;
      loss.push(Math.max(0, 0.4 + rnd() * 0.5 + spike));
      avail.push(100 - (spike > 0 ? spike * 2.4 : 0) - rnd() * 0.8);
    }
    const lossMax = Math.max(peak * 1.2, 10);
    const x = i => L + (i / (n - 1)) * iw;
    const yL = v => T + ih - (v / lossMax) * ih;
    const yR = v => T + ih - ((v - 70) / 30) * ih;
    const lp = loss.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${yL(v).toFixed(1)}`).join(" ");
    const ap = avail.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${Math.max(T, yR(v)).toFixed(1)}`).join(" ");
    const gx = [0, .2, .4, .6, .8, 1].map(t => `<line x1="${(L + t * iw).toFixed(1)}" y1="${T}" x2="${(L + t * iw).toFixed(1)}" y2="${T + ih}" stroke="rgba(255,255,255,.05)"/>`).join("");
    const xl = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"].map((t, i) =>
      `<text class="cc-axis" x="${(L + (i / 5) * iw).toFixed(1)}" y="${H - 8}" text-anchor="middle">${t}</text>`).join("");
    const yl = [0, 25, 50, 75, 100].map((v, i) =>
      `<text class="cc-axis" x="${L - 6}" y="${(yL(v * lossMax / 100) + 3).toFixed(1)}" text-anchor="end">${Math.round(v * lossMax / 100)}%</text>`).join("");
    const yr = [70, 80, 90, 100].map(v =>
      `<text class="cc-axis" x="${W - R + 6}" y="${(yR(v) + 3).toFixed(1)}" text-anchor="start">${v}%</text>`).join("");
    const tx = x(16), tyA = yR(avail[16]), tyL = yL(loss[16]);
    const svg = `<svg class="cc-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="application path health">
      ${gx}${yl}${yr}${xl}
      <text class="cc-axis-lbl" transform="translate(11,${T + ih / 2}) rotate(-90)" text-anchor="middle">Packet loss</text>
      <text class="cc-axis-lbl" transform="translate(${W - 9},${T + ih / 2}) rotate(90)" text-anchor="middle">Application availability</text>
      <path d="${ap}" fill="none" stroke="#3bc9ff" stroke-width="2"/>
      <path d="${lp}" fill="none" stroke="#f43f5e" stroke-width="2"/>
      <line x1="${tx}" y1="${T}" x2="${tx}" y2="${T + ih}" stroke="rgba(255,255,255,.18)" stroke-dasharray="3 3"/>
      <circle cx="${tx}" cy="${tyA}" r="3.5" fill="#3bc9ff"/><circle cx="${tx}" cy="${tyL}" r="3.5" fill="#f43f5e"/>
      <g transform="translate(${tx + 8},${T + 24})">
        <rect class="cc-tt" x="0" y="0" width="118" height="52" rx="7"/>
        <text class="cc-tt-txt" x="10" y="17">9:45am</text>
        <text class="cc-tt-txt cc-tt-sub" x="10" y="33"><tspan fill="#3bc9ff">●</tspan> 78% availability</text>
        <text class="cc-tt-txt cc-tt-sub" x="10" y="46"><tspan fill="#f43f5e">●</tspan> 3% packet loss</text>
      </g>
    </svg>
    <div class="cc-legend"><span><i style="background:#f43f5e"></i>Packet loss</span><span><i style="background:#3bc9ff"></i>Application availability</span></div>`;
    return widget("Health", "health", "Application Path Health", "ThousandEyes", svg);
  }

  function wAnomalies(scn) {
    const topo = scn.topology || { nodes: ["sjc-leaf-04", "sjc-leaf-09"], degraded: 0 };
    const nodeA = topo.nodes[topo.degraded] || "sjc-leaf-04";
    const nodeB = topo.nodes[topo.degraded + 1] || "sjc-leaf-09";
    const cat = (scn.title || "Anomaly").replace(/ .*/, "") === "Boardroom" ? "Media QoE" : (scn.title || "Anomaly").split(" ").slice(-1)[0];
    const tiles = [
      ["Fabric health score", "90", "#34d399"], ["Open anomalies", "2", "#fbbf24"],
      ["Endpoints tracked", "60", ""], ["Fabric uptime", "98%", "#34d399"]
    ];
    const rows = [
      ["10:14", ["Critical", "crit"], "Contract drop", esc(nodeA), esc((scn.action || "Review affected path").split(",")[0])],
      ["09:47", ["Major", "major"], "Endpoint flap", esc(nodeB), `Inspect link ${esc(nodeB)} → upstream`]
    ];
    const body = `<div class="cc-tiles">${tiles.map(t =>
      `<div class="cc-tile"><div class="cc-tile-lbl">${esc(t[0])}</div>
       <div class="cc-tile-val">${t[2] ? `<span class="cc-tile-dot" style="background:${t[2]}"></span>` : ""}${esc(t[1])}</div></div>`).join("")}</div>
      <table class="cc-tbl"><thead><tr><th>Time</th><th>Severity</th><th>Category</th><th>Affected node</th><th>Recommended action</th></tr></thead>
      <tbody>${rows.map(r =>
        `<tr><td>${esc(r[0])}</td><td><span class="cc-pill cc-pill--${r[1][1]}">${esc(r[1][0])}</span></td>
         <td>${esc(r[2])}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join("")}</tbody></table>`;
    return widget("Network", "network", "Top Data Center Anomalies", "Nexus Dashboard", body);
  }

  function wQos() {
    const rows = [
      ["Financial trading", "Highest", "20 percent reserved", "MPLS + Internet"],
      ["Voice and video conferencing", "High", "15 percent reserved", "MPLS"],
      ["Productivity SaaS", "Medium", "25 percent best effort", "Internet"],
      ["Backup and replication", "Low", "Throttle to 5 percent", "Internet, off-peak"],
      ["Recreational streaming", "Scavenger", "Drop above 1 percent", "Internet only"]
    ];
    const body = `<table class="cc-tbl"><thead><tr><th>Application</th><th>Priority</th><th>Bandwidth</th><th>Tunnel</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join("")}</tbody></table>`;
    return widget("Health", "health", "Application QoS Policy", "Catalyst SD-WAN", body);
  }

  function wTopology(scn) {
    const topo = scn.topology || { nodes: ["Internet cloud", "Security appliance", "Switches", "Access points", "Clients"], degraded: 1 };
    const nodes = topo.nodes.slice(0, 5);
    const W = 460, H = 150, cy = 58, r = 17;
    const gap = (W - 60) / (nodes.length - 1);
    const speeds = ["8G", "8G", "10G", "1G"];
    let links = "";
    for (let i = 0; i < nodes.length - 1; i++) {
      const x1 = 30 + i * gap + r, x2 = 30 + (i + 1) * gap - r, bad = i === topo.degraded;
      links += `<line class="cc-topo-link ${bad ? "cc-topo-link--bad" : ""}" x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}"/>`;
      links += `<text class="cc-topo-spd" x="${(x1 + x2) / 2}" y="${cy - 8}" text-anchor="middle" ${bad ? 'fill="#f43f5e"' : ""}>${bad ? "loss" : (speeds[i] || "1G")}</text>`;
    }
    const gcircles = nodes.map((name, i) => {
      const cx = 30 + i * gap, bad = i === topo.degraded || i === topo.degraded + 1;
      const ic = ICON[iconType(name)].replace(/class="ICO"/g, `class="cc-topo-ico ${bad ? "cc-topo-ico--bad" : ""}"`);
      return `<g transform="translate(${cx - 12},${cy - 12})">${ic}</g>
        <text x="${cx}" y="${cy + r + 16}" text-anchor="middle">${esc(name.length > 14 ? name.slice(0, 13) + "…" : name)}</text>`;
    }).join("");
    const svg = `<svg class="cc-topo" viewBox="0 0 ${W} ${H}" role="img" aria-label="network topology"><g class="cc-topo-node">${links}${gcircles}</g></svg>`;
    return widget("Topology", "topology", "Network Topology", "Meraki", svg);
  }

  function wThreats() {
    const cats = [
      ["Intrusion prevention signature", "#6b8cff", 500],
      ["Web URL filtering", "#34d399", 200],
      ["Geo-IP and reputation block", "#fbbf24", 145],
      ["Malware and file inspection", "#c084fc", 90],
      ["DNS security", "#f472b6", 36]
    ];
    const rnd = seeded("threats");
    const hours = ["−3h", "−2h", "−1h", "now"];
    const bars = hours.map(h => {
      const segs = cats.map(c => ({ c, v: Math.round(c[2] * (0.6 + rnd() * 0.6)) }));
      const tot = segs.reduce((a, s) => a + s.v, 0);
      return `<div class="cc-stack-row"><span class="cc-stack-time">${esc(h)}</span>
        <div class="cc-stack-bar">${segs.map(s =>
          `<div class="cc-stack-seg" style="width:${(s.v / tot * 100).toFixed(1)}%;background:${s.c[1]}">${s.v >= 60 ? s.v : ""}</div>`).join("")}</div></div>`;
    }).join("");
    const legend = `<div class="cc-legend" style="flex-wrap:wrap;gap:8px 14px">${cats.map(c =>
      `<span><i style="width:9px;height:9px;border-radius:2px;background:${c[1]}"></i>${esc(c[0])}</span>`).join("")}</div>`;
    return widget("Security & Compliance", "security", "Threats Blocked Over Time", "Secure Firewall",
      `<div class="cc-hint">Per hour, last 24 hours</div><div class="cc-stack">${bars}</div>${legend}`);
  }

  function renderBoard() {
    const scn = scenarios[activeIdx] || {};
    const board = $("#cc-board");
    board.innerHTML = "";
    // Two visual columns via CSS column-count; order interleaves like the product.
    [wClients(), wQos(), wPathHealth(scn), wTopology(scn), wAnomalies(scn), wThreats()]
      .forEach(w => board.appendChild(w));
  }

  /* ── assistant conversation ────────────────────────────────────────── */
  function summaryText(scn) {
    const acct = brief.account || "PseudoCo";
    const clients = 1200 + Math.floor(seeded(scn.id)() * 900);
    const topo = scn.topology || { nodes: ["sjc-leaf-04", "sjc-leaf-09"], degraded: 0 };
    const nodeA = topo.nodes[topo.degraded] || "sjc-leaf-04";
    const nodeB = topo.nodes[topo.degraded + 1] || "sjc-leaf-09";
    const incident = {
      "room-qoe": "Video quality dipped in several boardrooms between 10:00 and 10:45, traced to packet loss on a branch uplink, which a media-priority SD-WAN policy has begun to protect",
      "calling-registration": "Webex Calling phones at one site briefly flapped registration between 10:00 and 10:45, traced to aggressive firewall SIP timers, now being tuned",
      "wan-brownout": "A branch saw elevated latency between 10:00 and 10:45, traced to an upstream transit provider, and critical apps were steered to a healthy path",
      "dc-ai-fabric": "An AI training job stalled briefly as a leaf switch showed congestion, and flows were rebalanced to protect the workload",
      "security-anomaly": "An endpoint began beaconing to a low-reputation destination; it was auto-contained pending your review",
      "observability-gap": "Coverage checks found sites without telemetry agents, creating blind spots for future investigations"
    }[scn.id] || "There was a brief service degradation that recovered with an automated policy change";
    return {
      question: scn.question || `Show me a network health summary for ${acct}.`,
      summary: `${esc(acct)}'s network is healthy overall. ${clients.toLocaleString()} clients are connected with no degraded sessions, and the WAN is stable across all sites. ${esc(incident)}. The data center fabric is at health 90, with two open anomalies on <strong>${esc(nodeA)}</strong> and <strong>${esc(nodeB)}</strong>.`,
      rec: `Take a closer look at the ${esc((scn.title || "issue").toLowerCase())} on <strong>${esc(nodeA)}</strong>. ${esc(scn.severity === "critical" ? "Critical" : "Low")} severity, but it just opened and could affect application performance if it persists.`
    };
  }

  function renderThread() {
    clearTimers();
    const scn = scenarios[activeIdx] || {};
    const t = $("#cc-thread");
    const s = summaryText(scn);
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
    t.innerHTML =
      `<div class="cc-msg"><div class="cc-msg-body" style="color:var(--mut2)">…prior investigation summarized. No active breach.</div>
        <div class="cc-msg-actions"><span>👍</span><span>👎</span><span>⧉</span><span>↻</span></div></div>
      <div class="cc-msg-sep"></div>
      <div class="cc-msg"><div class="cc-msg-who"><span class="cc-msg-ic cc-msg-ic--you">◆</span><span class="cc-msg-name">You</span></div>
        <div class="cc-msg-body">${esc(s.question)}</div></div>
      <div class="cc-msg" id="cc-ai-msg"><div class="cc-msg-who"><span class="cc-msg-ic cc-msg-ic--ai">✦</span><span class="cc-msg-name">Assistant</span><span class="cc-msg-time">${esc(time)}</span></div>
        <div class="cc-msg-body"><span class="cc-typing"><span></span><span></span><span></span></span></div></div>`;
    t.scrollTop = t.scrollHeight;
    timers.push(setTimeout(() => {
      const m = $("#cc-ai-msg");
      if (!m) return;
      m.querySelector(".cc-msg-body").innerHTML =
        `<p>${s.summary}</p><p><strong>Recommendation:</strong> ${s.rec}</p>`;
      m.insertAdjacentHTML("beforeend", `<div class="cc-msg-actions"><span>👍</span><span>👎</span><span>⧉</span><span>↻</span></div>`);
      t.scrollTop = t.scrollHeight;
    }, 900));
  }

  /* ── board switcher ────────────────────────────────────────────────── */
  function renderBoardMenu() {
    const menu = $("#cc-boardmenu");
    menu.innerHTML = scenarios.map((s, i) =>
      `<div class="cc-boardmenu-item ${i === activeIdx ? "is-active" : ""}" data-idx="${i}">
        <span class="cc-sevdot sev--${s.severity || "warning"}"></span>${esc(s.title)}</div>`).join("");
    menu.querySelectorAll(".cc-boardmenu-item").forEach(n =>
      n.addEventListener("click", () => { activeIdx = +n.dataset.idx; menu.classList.remove("show"); switchBoard(); }));
  }

  function switchBoard() {
    const scn = scenarios[activeIdx] || {};
    $("#cc-dash-name").textContent = scn.severity === "critical"
      ? scn.title : "Network Health Dashboard";
    renderCollab();
    renderBoard();
    renderThread();
    renderBoardMenu();
  }

  function wire() {
    $("#cc-acct").querySelector("span").textContent = brief.account || "Wayne Enterprise";
    const dash = $("#cc-dash"), menu = $("#cc-boardmenu");
    dash.addEventListener("click", e => {
      e.stopPropagation();
      const r = dash.getBoundingClientRect();
      menu.style.left = r.left + "px"; menu.style.top = (r.bottom + 6) + "px";
      menu.classList.toggle("show");
    });
    document.addEventListener("click", e => { if (!menu.contains(e.target) && e.target !== dash) menu.classList.remove("show"); });
    $("#cc-back").addEventListener("click", () => {
      if (params.get("from") === "cpn" && window.history.length > 1) window.history.back();
      else window.location.href = "cisco-portfolio-navigator.html";
    });
    $("#cc-composer").addEventListener("submit", e => {
      e.preventDefault();
      const input = $("#cc-input"), q = input.value.trim();
      if (!q) return; input.value = "";
      const t = $("#cc-thread");
      t.insertAdjacentHTML("beforeend",
        `<div class="cc-msg-sep"></div><div class="cc-msg"><div class="cc-msg-who"><span class="cc-msg-ic cc-msg-ic--you">◆</span><span class="cc-msg-name">You</span></div><div class="cc-msg-body">${esc(q)}</div></div>
         <div class="cc-msg" id="cc-ai-live"><div class="cc-msg-who"><span class="cc-msg-ic cc-msg-ic--ai">✦</span><span class="cc-msg-name">Assistant</span></div><div class="cc-msg-body"><span class="cc-typing"><span></span><span></span><span></span></span></div></div>`);
      t.scrollTop = t.scrollHeight;
      const scn = scenarios[activeIdx] || {};
      timers.push(setTimeout(() => {
        const m = $("#cc-ai-live"); if (!m) return; m.id = "";
        m.querySelector(".cc-msg-body").innerHTML =
          `I've correlated that against the current board. Related evidence: ${esc((scn.evidence || ["telemetry looks nominal"])[0])}. I can generate a focused widget if you'd like. <em style="color:var(--mut)">(Demo response.)</em>`;
        t.scrollTop = t.scrollHeight;
      }, 1000));
    });
  }

  renderTabs();
  wire();
  switchBoard();
})();
