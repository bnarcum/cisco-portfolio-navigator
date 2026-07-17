/**
 * Kiosk attract screen — touch feedback + optional idle reload.
 */
(function () {
  "use strict";

  document.querySelectorAll(".kiosk-pillar, .kiosk-explore-all").forEach(el => {
    el.addEventListener("pointerdown", () => el.classList.add("kiosk-tap"), { passive: true });
    el.addEventListener("pointerup", () => el.classList.remove("kiosk-tap"), { passive: true });
    el.addEventListener("pointercancel", () => el.classList.remove("kiosk-tap"), { passive: true });
    el.addEventListener("pointerleave", () => el.classList.remove("kiosk-tap"), { passive: true });
  });

  // Long idle on attract screen — soft reload to clear any stale state.
  const IDLE_MS = 10 * 60 * 1000;
  let idleTimer = null;
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => location.reload(), IDLE_MS);
  }
  ["pointerdown", "touchstart", "keydown"].forEach(ev => {
    document.addEventListener(ev, resetIdle, { passive: true });
  });
  resetIdle();
})();
