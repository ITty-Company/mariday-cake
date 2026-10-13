/* Mariday inner pages — shared motion (GSAP + ScrollTrigger + Lenis, with a static fallback) */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasLibs = !!(window.gsap && window.ScrollTrigger);
  const live = hasLibs && !reduce;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let lenis = null;

  /* ───────── Text splitting ───────── */
  function splitWords(el) {
    if (el.dataset.split) return $$(".x-ri", el);
    el.dataset.split = "1";
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(" "));
            const outer = document.createElement("span");
            const inner = document.createElement("span");
            outer.className = "x-rl";
            inner.className = "x-ri";
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          walk(n);
        }
      });
    };
    walk(el);
    return $$(".x-ri", el);
  }

  function splitChars(el) {
    const text = el.textContent;
    el.setAttribute("aria-label", text.trim());
    el.textContent = "";
    return [...text].map((ch) => {
      const s = document.createElement("span");
      s.className = "p-ch";
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch === " " ? " " : ch;
      el.appendChild(s);
      return s;
    });
  }

  /* ───────── Smooth scroll + progress ───────── */
  function setupLenis() {
    const bar = document.createElement("div");
    bar.className = "p-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    const setBar = (p) => { bar.style.transform = `scaleX(${p})`; };

    if (!window.Lenis || !live) {
      addEventListener("scroll", () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        setBar(max > 0 ? scrollY / max : 0);
      }, { passive: true });
      return;
    }
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.MaridayLenis = lenis;
    lenis.on("scroll", (l) => {
      ScrollTrigger.update();
      setBar(l.limit ? l.scroll / l.limit : 0);
    });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener("mariday:menu", (e) => (e.detail.open ? lenis.stop() : lenis.start()));
    // anchors scroll smoothly
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute("href").length < 2) return;
      const t = $(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -110, duration: 1.4 });
    });
  }

  /* ───────── Reveals ───────── */
  function revealTitle() {
    $$("[data-chars]").forEach((el) => {
      const chars = splitChars(el);
      if (!live) return;
      gsap.from(chars, { yPercent: 120, rotate: (i) => (i % 2 ? 14 : -14), opacity: 0, duration: 1.2, stagger: 0.045, ease: "expo.out", delay: 0.35 });
    });
  }

  function reveal(root = document) {
    if (!live) return;
    $$("[data-rise]", root).forEach((el) => {
      if (el._rev) return;
      el._rev = 1;
      gsap.from(splitWords(el), { yPercent: 115, rotate: 5, duration: 1.2, stagger: 0.06, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });
    const ups = $$("[data-up]", root).filter((el) => !el._rev);
    ups.forEach((el) => (el._rev = 1));
    if (ups.length) {
      gsap.set(ups, { y: 46, opacity: 0 });
      ScrollTrigger.batch(ups, {
        start: "top 94%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: "expo.out", overwrite: true }),
      });
    }
    const pops = $$("[data-pop]", root).filter((el) => !el._rev);
    pops.forEach((el) => (el._rev = 1));
    if (pops.length) {
      gsap.set(pops, { scale: 0.4, opacity: 0, rotation: (i) => (i % 2 ? 20 : -20) });
      ScrollTrigger.batch(pops, {
        start: "top 94%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { scale: 1, opacity: 1, rotation: 0, duration: 0.9, stagger: 0.06, ease: "back.out(2)", clearProps: "transform,opacity" }),
      });
    }
  }

  // Grid items appear one after another (used after filters re-render)
  function stagger(nodes) {
    if (!live || !nodes.length) return;
    gsap.fromTo(nodes, { y: 40, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.05, ease: "expo.out", clearProps: "transform,opacity" });
  }

  function parallax() {
    if (!live) return;
    $$("[data-parallax]").forEach((el) => {
      const k = parseFloat(el.dataset.parallax) || 0.2;
      gsap.to(el, { yPercent: k * -100, rotation: k * 30, ease: "none", scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$("[data-scale-in]").forEach((el) => {
      gsap.fromTo(el, { clipPath: "inset(18% 18% 18% 18% round 40px)" }, { clipPath: "inset(0% 0% 0% 0% round 28px)", ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 35%", scrub: 0.6 } });
    });
    // Manifesto text lights up word by word while scrolling
    $$("[data-scrub-text]").forEach((el) => {
      const words = splitWords(el);
      gsap.set(words, { opacity: 0.16 });
      gsap.to(words, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
    });
  }

  // Hero cherries drift with the pointer
  function pointerDepth() {
    if (!live || !fine) return;
    const items = $$("[data-depth]");
    if (!items.length) return;
    const movers = items.map((el) => ({ d: parseFloat(el.dataset.depth) || 1, x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }), y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" }) }));
    addEventListener("pointermove", (e) => {
      const dx = e.clientX / innerWidth - 0.5;
      const dy = e.clientY / innerHeight - 0.5;
      movers.forEach((m) => { m.x(dx * 40 * m.d); m.y(dy * 30 * m.d); });
    });
  }

  function marquees() {
    $$("[data-marquee]").forEach((row) => {
      const track = row.firstElementChild;
      if (!track) return;
      track.innerHTML += track.innerHTML;
      if (!live) return;
      const dir = row.hasAttribute("data-reverse") ? 1 : -1;
      const speed = parseFloat(row.dataset.marquee) || 1;
      let x = 0;
      let boost = 0;
      if (lenis) lenis.on("scroll", (l) => { boost = Math.min(8, Math.abs(l.velocity) * 0.25); });
      gsap.ticker.add(() => {
        const w = track.scrollWidth / 2;
        if (!w) return;
        x += dir * (0.6 * speed + boost);
        boost *= 0.92;
        if (x <= -w) x += w;
        if (x > 0) x -= w;
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
    });
  }

  function counters() {
    $$("[data-count]").forEach((el) => {
      const to = Number(el.dataset.count);
      const fmt = (v) => Math.round(v).toLocaleString("uk-UA");
      if (!live) { el.textContent = fmt(to); return; }
      const o = { v: 0 };
      el.textContent = "0";
      ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => gsap.to(o, { v: to, duration: 2, ease: "power3.out", onUpdate: () => (el.textContent = fmt(o.v)) }) });
    });
  }

  function magnets() {
    if (!live || !fine) return;
    $$(".p-magnet").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  function tilt(root = document) {
    if (!live || !fine) return;
    $$("[data-tilt]", root).forEach((el) => {
      if (el._tilt) return;
      el._tilt = 1;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotationY: x * 12, rotationX: -y * 12, transformPerspective: 800, duration: 0.6, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { rotationY: 0, rotationX: 0, duration: 1, ease: "elastic.out(1, 0.5)" }));
    });
  }

  /* ───────── Sprinkles: click anywhere inside [data-sprinkles] ───────── */
  function sprinkles() {
    $$("[data-sprinkles]").forEach((sec) => {
      const cv = document.createElement("canvas");
      cv.className = "p-sprinkles";
      cv.setAttribute("aria-hidden", "true");
      sec.prepend(cv);
      const ctx = cv.getContext("2d");
      const COLORS = ["#f5bcc8", "#dbefed", "#fbe6b8", "#ffffff", "#bcd6f3", "#e2849a"];
      let parts = [];
      let running = false;
      let dpr = 1;
      const size = () => {
        dpr = Math.min(devicePixelRatio || 1, 2);
        cv.width = sec.clientWidth * dpr;
        cv.height = sec.clientHeight * dpr;
      };
      size();
      addEventListener("resize", size);
      const tick = () => {
        const H = cv.height / dpr;
        ctx.clearRect(0, 0, cv.width, cv.height);
        parts = parts.filter((p) => p.life > 0 && p.y < H + 40);
        parts.forEach((p) => {
          p.vy += 0.3; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.006;
          ctx.save();
          ctx.translate(p.x * dpr, p.y * dpr);
          ctx.rotate(p.r);
          ctx.globalAlpha = Math.min(1, p.life * 2);
          ctx.fillStyle = p.c;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect((-p.w / 2) * dpr, (-p.h / 2) * dpr, p.w * dpr, p.h * dpr, (p.w / 2) * dpr);
          else ctx.rect((-p.w / 2) * dpr, (-p.h / 2) * dpr, p.w * dpr, p.h * dpr);
          ctx.fill();
          ctx.restore();
        });
        if (parts.length) requestAnimationFrame(tick);
        else running = false;
      };
      const burst = (x, y, n = 60) => {
        if (reduce) return;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 3 + Math.random() * 10;
          parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, r: Math.random() * 3, vr: (Math.random() - 0.5) * 0.35, w: 3 + Math.random() * 3, h: 9 + Math.random() * 10, c: COLORS[(Math.random() * COLORS.length) | 0], life: 1 });
        }
        if (!running) { running = true; requestAnimationFrame(tick); }
      };
      sec.addEventListener("pointerdown", (e) => {
        if (e.target.closest("a, button, input, select, textarea")) return;
        const r = sec.getBoundingClientRect();
        burst(e.clientX - r.left, e.clientY - r.top);
      });
      sec._burst = burst;
    });
  }

  /* ───────── Page transitions: three-layer curtain ───────── */
  function pageTransitions() {
    if (!live) return;
    const curtain = document.createElement("div");
    curtain.className = "x-curtain p-curtain";
    curtain.setAttribute("aria-hidden", "true");
    curtain.innerHTML = "<i></i><i></i><i></i>";
    document.body.appendChild(curtain);
    const panels = $$("i", curtain);
    gsap.set(panels, { yPercent: 101 });

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/^https?:/.test(url.protocol)) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      curtain.style.visibility = "visible";
      lenis?.stop();
      gsap.to(panels, { yPercent: 0, duration: 0.75, stagger: 0.08, ease: "expo.inOut", onComplete: () => { location.href = url.href; } });
    });
    addEventListener("pageshow", (e) => {
      if (!e.persisted) return;
      gsap.set(panels, { yPercent: 101 });
      curtain.style.visibility = "";
      lenis?.start();
    });
  }

  function footerWord() {
    const word = $(".footer-word");
    if (!word || !live) return;
    gsap.from($$("span", word), { yPercent: 110, rotation: (i) => (i % 2 ? 12 : -12), duration: 1.2, stagger: 0.06, ease: "expo.out", scrollTrigger: { trigger: word, start: "top 95%" } });
  }

  window.MaridayMotion = {
    live,
    reveal: (root) => { reveal(root); tilt(root); },
    stagger,
    refresh: () => { if (hasLibs) setTimeout(() => ScrollTrigger.refresh(), 60); },
    burst: (sec, x, y, n) => sec?._burst?.(x, y, n),
  };

  function init() {
    if (hasLibs) gsap.registerPlugin(ScrollTrigger);
    if (!live) document.documentElement.classList.add("p-static");
    setupLenis();
    revealTitle();
    reveal();
    parallax();
    pointerDepth();
    marquees();
    counters();
    magnets();
    tilt();
    sprinkles();
    pageTransitions();
    footerWord();
    if (hasLibs) {
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      addEventListener("load", () => ScrollTrigger.refresh());
    }
  }

  MARIDAY.onReady(init);
})();
