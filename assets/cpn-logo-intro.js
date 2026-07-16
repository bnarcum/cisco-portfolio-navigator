/**
 * Click header logo to play Premium intro, then return to Overview home.
 */
(function () {
  "use strict";

  const INTRO_MS = 3200;
  const REDUCED_MS = 1600;

  function init() {
    const trigger = document.querySelector("button.logo");
    const overlay = document.getElementById("logo-intro");
    if (!trigger || !overlay) return;

    const animBlock = overlay.querySelector(".logo-intro-anim");
    const video = overlay.querySelector(".logo-intro-video");
    const staticImg = overlay.querySelector(".logo-intro-static");
    const skipBtn = overlay.querySelector(".logo-intro-skip");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let playing = false;
    let returnHomeOnClose = false;
    let closeTimer = null;

    function clearCloseTimer() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function goOverviewHome() {
      if (typeof window.cpnReturnToOverviewHome === "function") {
        window.cpnReturnToOverviewHome();
      } else if (typeof window.applyViewLevel === "function") {
        window.applyViewLevel("overview");
      }
    }

    function closeIntro() {
      const shouldHome = returnHomeOnClose;
      clearCloseTimer();
      overlay.classList.remove("is-active", "is-playing", "logo-intro-out");
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("logo-intro-open");
      playing = false;
      returnHomeOnClose = false;
      if (video) {
        video.onended = null;
        video.pause();
        video.currentTime = 0;
        video.hidden = true;
      }
      if (staticImg) {
        staticImg.hidden = true;
        staticImg.classList.remove("is-cinematic");
      }
      if (animBlock) animBlock.hidden = false;
      if (shouldHome) goOverviewHome();
    }

    function scheduleClose(ms) {
      clearCloseTimer();
      closeTimer = setTimeout(() => {
        overlay.classList.add("logo-intro-out");
        setTimeout(closeIntro, 420);
      }, ms);
    }

    async function videoAvailable() {
      if (!video) return false;
      const sources = [...video.querySelectorAll("source")];
      for (const src of sources) {
        const url = src.getAttribute("src");
        if (!url) continue;
        try {
          const res = await fetch(url, { method: "HEAD", cache: "no-store" });
          if (res.ok) return true;
        } catch (e) { /* optional asset */ }
      }
      return false;
    }

    function playCssIntro() {
      if (animBlock) animBlock.hidden = false;
      if (video) video.hidden = true;
      if (staticImg) staticImg.hidden = true;
      overlay.classList.add("is-playing");
      scheduleClose(INTRO_MS);
    }

    function playPosterIntro(cinematic) {
      if (animBlock) animBlock.hidden = true;
      if (video) video.hidden = true;
      if (!staticImg) {
        playCssIntro();
        return;
      }
      staticImg.hidden = false;
      staticImg.classList.toggle("is-cinematic", !!cinematic);
      scheduleClose(cinematic ? INTRO_MS : REDUCED_MS);
    }

    async function playVideoIntro() {
      if (animBlock) animBlock.hidden = true;
      if (staticImg) staticImg.hidden = true;
      video.hidden = false;
      video.currentTime = 0;
      video.onended = () => {
        overlay.classList.add("logo-intro-out");
        setTimeout(closeIntro, 200);
      };
      try {
        await video.play();
      } catch (e) {
        playPosterIntro(true);
      }
    }

    async function openIntro() {
      if (playing) return;
      playing = true;
      returnHomeOnClose = true;
      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("logo-intro-open");
      requestAnimationFrame(() => overlay.classList.add("is-active"));

      if (reduced) {
        playPosterIntro(false);
        return;
      }

      if (await videoAvailable()) {
        await playVideoIntro();
        return;
      }

      playPosterIntro(true);
    }

    trigger.addEventListener("click", openIntro);
    skipBtn?.addEventListener("click", closeIntro);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeIntro();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) closeIntro();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
