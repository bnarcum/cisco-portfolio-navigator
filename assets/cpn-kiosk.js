/**
 * Kiosk mode runtime — home button, idle reset, session hygiene.
 */
(function () {
  "use strict";

  if (!window.__CPN_KIOSK_MODE) return;

  const params = new URLSearchParams(location.search);
  const idleSec = Math.max(30, parseInt(params.get("idle") || "120", 10) || 120);
  const warnSec = Math.min(20, Math.max(10, idleSec - 15));
  const homePath = new URL("kiosk.html", document.baseURI).pathname;

  let idleTimer = null;
  let warnTimer = null;
  let overlay = null;

  function clearKioskSession() {
    try {
      ["cpn-view-mode-v2", "cpn-view-focus-v2", "cpn-autosave-v2", "cpn-current-v2"].forEach(k => {
        localStorage.removeItem(k);
      });
    } catch (_) { /* ignore */ }
  }

  function hideWarn() {
    overlay?.classList.remove("show");
    overlay?.setAttribute("aria-hidden", "true");
  }

  function showWarn() {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "kiosk-idle-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "kiosk-idle-title");
      overlay.innerHTML =
        '<div class="kiosk-idle-card">' +
        '<h2 id="kiosk-idle-title">Still exploring?</h2>' +
        '<p>Touch anywhere to continue, or we\'ll return to the home screen shortly.</p>' +
        '<button type="button" id="kiosk-idle-stay">Continue exploring</button>' +
        "</div>";
      document.body.appendChild(overlay);
      overlay.querySelector("#kiosk-idle-stay")?.addEventListener("click", () => {
        hideWarn();
        resetIdle();
      });
      overlay.addEventListener("pointerdown", e => {
        if (e.target === overlay) {
          hideWarn();
          resetIdle();
        }
      });
    }
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
  }

  function goHome() {
    clearKioskSession();
    location.href = homePath;
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    clearTimeout(warnTimer);
    hideWarn();
    warnTimer = setTimeout(showWarn, Math.max(5, idleSec - warnSec) * 1000);
    idleTimer = setTimeout(goHome, idleSec * 1000);
  }

  function mountHomeFab() {
    if (document.getElementById("kiosk-home-fab")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "kiosk-home-fab";
    btn.setAttribute("aria-label", "Return to kiosk home");
    btn.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
      "</svg><span>Home</span>";
    btn.addEventListener("click", goHome);
    document.body.appendChild(btn);
  }

  function wireActivity() {
    ["pointerdown", "touchstart", "keydown", "wheel"].forEach(ev => {
      document.addEventListener(ev, resetIdle, { passive: true });
    });
  }

  // Disable context menu on long-press (kiosk hygiene).
  document.addEventListener("contextmenu", e => {
    if (window.__CPN_KIOSK_MODE) e.preventDefault();
  });

  // Skip logo intro auto-play on kiosk — logo tap still works if wired.
  window.__CPN_SKIP_LOGO_INTRO = true;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      mountHomeFab();
      wireActivity();
      resetIdle();
    });
  } else {
    mountHomeFab();
    wireActivity();
    resetIdle();
  }
})();
