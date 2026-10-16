/* Mariday speed — keeps phones and tablets smooth, and has every section ready before the visitor reaches it.
   1. A section far off the screen sleeps: its CSS animations and endless GSAP loops pause until it comes near again.
   2. The pictures of the sections below load (and decode) ahead of the scroll, nearest first, so no section
      arrives empty or stutters while a big photo is decoded on the way in. */
(function () {
  const conn = navigator.connection || {};
  const frugal = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 120));

  /* ───────── 1. Off-screen sections sleep ───────── */
  function sleepers() {
    if (!("IntersectionObserver" in window)) return;
    const st = document.createElement("style");
    st.textContent = ".is-asleep, .is-asleep *, .is-asleep *::before, .is-asleep *::after { animation-play-state: paused !important; }";
    document.head.appendChild(st);
    const secs = [...document.querySelectorAll("main section, #site-footer")].filter((s) => !s.parentElement.closest("main section"));
    if (!secs.length) return;
    const asleep = new Set();
    const inside = (t) => t && t.nodeType === 1 && [...asleep].some((s) => s.contains(t));
    // the endless loops (a cherry that sways, a sparkle that blinks) — never scroll-driven tweens
    const loops = () => window.gsap ? gsap.globalTimeline.getChildren(true, true, true).filter((a) => a.repeat && a.repeat() === -1 && !a.scrollTrigger) : [];
    const sync = () => {
      loops().forEach((a) => {
        const targets = a.targets ? a.targets() : [];
        if (!targets.length) return;
        const off = targets.every(inside);
        if (off && !a.paused()) { a.pause(); a._mdSlept = true; }
        else if (!off && a._mdSlept) { a._mdSlept = false; a.resume(); }
      });
    };
    let queued = false;
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; sync(); }); } };
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        e.target.classList.toggle("is-asleep", !e.isIntersecting);
        e.isIntersecting ? asleep.delete(e.target) : asleep.add(e.target);
      });
      queue();
    }, { rootMargin: "120% 0px" });
    secs.forEach((s) => io.observe(s));
  }

  /* ───────── 2. Pictures load ahead of the scroll ───────── */
  function warmUp() {
    const seen = new WeakSet();
    const pageY = (el) => el.getBoundingClientRect().top + scrollY;
    const pending = () => [...document.querySelectorAll('img[loading="lazy"]')].filter((img) => !seen.has(img) && !img.complete && img.getClientRects().length);
    const warm = (img) => {
      seen.add(img);
      img.loading = "eager";
      img.decoding = "async";
      if (img.decode) img.decode().catch(() => {});
    };
    // how far ahead to look, in screens: everything on a good connection, a little on a slow or data-saving one
    const reach = frugal ? 1.5 : Infinity;
    let busy = false;
    const pump = () => {
      if (busy) return;
      busy = true;
      idle(() => {
        busy = false;
        const y = scrollY, h = innerHeight;
        const list = pending()
          .map((img) => ({ img, d: pageY(img) - y }))
          .filter((o) => o.d > -h && o.d < h * reach)
          // the ones just below come first, then further down, then what is above
          .sort((a, b) => (a.d < 0) - (b.d < 0) || Math.abs(a.d) - Math.abs(b.d));
        // a few at a time, so the pictures on screen are never queued behind the far ones
        list.slice(0, 4).forEach((o) => warm(o.img));
        if (list.length > 4) setTimeout(pump, 260);
      }, { timeout: 600 });
    };
    pump();
    addEventListener("scroll", pump, { passive: true });
    // cakes and cards drawn later by the page's own scripts join the queue
    new MutationObserver(pump).observe(document.body, { childList: true, subtree: true });
  }

  /* ───────── 3. The next page is fetched the moment a finger lands on its link ───────── */
  // the curtain takes most of a second to close: by the time it has, the page behind the link is already here
  function prefetch() {
    const done = new Set([location.pathname]);
    const go = (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || frugal) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || done.has(url.pathname) || !/\.html$|\/$/.test(url.pathname)) return;
      done.add(url.pathname);
      const l = document.createElement("link");
      l.rel = "prefetch";
      l.href = url.pathname;
      document.head.appendChild(l);
    };
    addEventListener("pointerdown", go, { passive: true, capture: true });
    addEventListener("touchstart", go, { passive: true, capture: true });
    addEventListener("mouseover", go, { passive: true });
  }

  const start = () => {
    sleepers();
    prefetch();
    // the first screen has the network to itself; the rest is fetched as soon as it is up
    setTimeout(warmUp, 400);
  };
  if (document.readyState === "complete") start();
  else addEventListener("load", start, { once: true });
})();
