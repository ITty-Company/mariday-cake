/* Mariday — ⑥ seasonal flavours as a year through the kitchen window (pages/desserts.html, css/desserts-year.css).
   A cherry rides a garland of month tags: drag it, tap a month or use the arrow keys. The month decides the season,
   and the season turns the sky, the garden, the weather on the glass (petals, summer pollen, leaves with rain on the pane,
   snow with a frosted pane you can wipe), the desserts rising onto the sill and the menu card.
   On first sight the cherry runs from January to this month, so the year flies past once. */
(function () {
  const sec = document.querySelector("[data-ds-year]");
  const win = sec && sec.querySelector("[data-yr-win]");
  if (!win) return;
  const $ = (s, r = sec) => r.querySelector(s);
  const $$ = (s, r = sec) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const OF = ["winter", "winter", "winter", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];
  const NOTE = {
    spring: "торкніться скла — пелюстки розлетяться",
    summer: "сонце високо — candy bar можна й у саду",
    autumn: "дощ по шибці, а в нас — карамель",
    winter: "шибка замерзла — протріть її пальцем",
  };

  const garland = $("[data-yr-garland]");
  const tags = $$(".yr-m", garland);
  const cherry = $("[data-yr-cherry]");
  const cherryImg = $("img", cherry);
  const panels = $$("[data-panel]");
  const sills = $$("[data-sill]");
  const note = $("[data-yr-note]");
  const stamp = $("[data-yr-now]");
  const glass = $("[data-yr-glass]");
  const fx = weather(glass, $("[data-yr-fx]"), $("[data-yr-frost]"));

  const T = (i) => parseFloat(tags[i].style.getPropertyValue("--t"));
  const T0 = T(0), T11 = T(11);
  const nearest = (t) => clamp(Math.round(((t - T0) / (T11 - T0)) * 11), 0, 11);
  const today = new Date().getMonth();
  tags[today].classList.add("is-now");

  let month = -1;
  let season = "";
  const setCherry = (t) => cherry.style.setProperty("--ct", t);
  const swing = (dir) => {
    if (reduce) return;
    cherry.style.setProperty("--dir", dir);
    cherry.classList.remove("is-swing");
    void cherry.offsetWidth;
    cherry.classList.add("is-swing");
  };

  function pick(m, { move = true, quiet = false } = {}) {
    if (m === month) { if (move) setCherry(T(m)); return; }
    const prev = month;
    month = m;
    tags.forEach((b, i) => { b.setAttribute("aria-checked", String(i === m)); b.tabIndex = i === m ? 0 : -1; });
    if (move) { setCherry(T(m)); if (prev >= 0) swing(m > prev ? 1 : -1); }
    if (OF[m] !== season) setSeason(OF[m], quiet);
  }

  function setSeason(s, quiet) {
    season = s;
    sec.dataset.season = s;
    panels.forEach((p) => {
      const on = p.dataset.panel === s;
      p.hidden = !on;
      if (on && !quiet && !reduce && p.animate) p.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 520, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" });
    });
    sills.forEach((x) => x.classList.toggle("is-on", x.dataset.sill === s));
    note.textContent = NOTE[s];
    if (!quiet && !reduce) { note.classList.remove("is-new"); void note.offsetWidth; note.classList.add("is-new"); }
    stamp.hidden = s !== OF[today];
    fx.set(s, quiet);
  }

  /* first sight: the year flies by from January to now */
  let run = 0;
  function flyToToday() {
    if (reduce || today === 0) { pick(today); return; }
    garland.classList.add("is-run");
    const from = T(0), to = T(today), dur = 900 + today * 90;
    const t0 = performance.now();
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const t = from + (to - from) * ease(k);
      setCherry(t);
      cherryImg.style.rotate = `${Math.sin(k * Math.PI) * -14}deg`;
      pick(nearest(t), { move: false });
      if (k < 1) run = requestAnimationFrame(step);
      else stopRun(true);
    };
    run = requestAnimationFrame(step);
  }
  function stopRun(settle) {
    if (!run) return;
    cancelAnimationFrame(run);
    run = 0;
    garland.classList.remove("is-run");
    cherryImg.style.rotate = "";
    if (settle) { setCherry(T(month)); swing(1); }
  }

  pick(0, { quiet: true });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      if (month === 0) flyToToday();
    }, { threshold: 0.35 });
    io.observe(win);
  } else pick(today);

  /* drag the cherry along the rope; let go and it settles on the nearest month */
  let drag = null;
  let skipClick = false;
  const tAt = (x) => { const r = garland.getBoundingClientRect(); return clamp((x - r.left) / r.width, T0, T11); };
  garland.addEventListener("pointerdown", (e) => {
    if (e.button) return;
    drag = { id: e.pointerId, x: e.clientX, moved: false, lt: tAt(e.clientX), lx: e.clientX, v: 0 };
  });
  garland.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved) {
      if (Math.abs(e.clientX - drag.x) < 6) return;
      drag.moved = true;
      stopRun(false);
      garland.setPointerCapture(e.pointerId);
      garland.classList.add("is-drag");
    }
    const t = tAt(e.clientX);
    drag.v = drag.v * 0.6 + (e.clientX - drag.lx) * 0.4;
    drag.lx = e.clientX;
    setCherry(t);
    if (!reduce) cherryImg.style.rotate = `${clamp(-drag.v * 1.6, -24, 24)}deg`;
    pick(nearest(t), { move: false });
  });
  const up = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved) return;
    skipClick = true;
    setTimeout(() => (skipClick = false), 0);
    garland.classList.remove("is-drag");
    cherryImg.style.rotate = "";
    setCherry(T(month));
    swing(d.v > 0 ? 1 : -1);
  };
  garland.addEventListener("pointerup", up);
  garland.addEventListener("pointercancel", up);
  garland.addEventListener("click", (e) => {
    if (skipClick) return;
    const b = e.target.closest(".yr-m");
    if (!b) return;
    stopRun(false);
    pick(+b.dataset.m);
  });
  garland.addEventListener("keydown", (e) => {
    const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const to = e.key === "Home" ? 0 : e.key === "End" ? 11 : k ? (month + k + 12) % 12 : -1;
    if (to < 0) return;
    e.preventDefault();
    stopRun(false);
    pick(to);
    tags[to].focus();
  });

  /* ───────── the weather on the glass ───────── */
  function weather(glass, cv, frost) {
    const ctx = cv.getContext("2d");
    const fctx = frost.getContext("2d");
    const R = (a, b) => a + Math.random() * (b - a);
    const any = (a) => a[(Math.random() * a.length) | 0];
    const PETAL = ["#ffe3ea", "#fbc6d3", "#f6a8bc", "#fff5f7", "#f9b6c6"];
    const LEAF = ["#d9682b", "#e8962f", "#b8452a", "#f0b84a", "#a3401f"];
    const COUNT = { spring: 26, summer: 30, autumn: 16, winter: 85 };
    let W = 0, H = 0, s = 1;
    let kind = "spring";
    let parts = [];
    let drops = [];
    let ptr = null;
    let last = null;
    let frostImg = null;
    let visible = false;
    let raf = 0;
    let tick = 0;

    function size() {
      const r = glass.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height; s = W / 420;
      for (const c of [cv, frost]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeFrost();
      if (kind === "winter") paintFrost();
      if (reduce) draw(false);
    }

    function want() { return Math.round(COUNT[kind] * Math.max(0.6, (W * H) / (420 * 500))); }

    function make(k, anywhere) {
      const p = { k, x: R(-10, W + 10), y: anywhere ? R(0, H) : -16, al: anywhere ? 0 : 1, rot: R(0, 6.28), vr: R(-0.03, 0.03), ph: R(0, 6.28), vx: 0, dying: false };
      if (k === "spring") { p.r = R(4, 8) * s; p.vy = R(0.35, 0.75) * s; p.c = any(PETAL); }
      else if (k === "autumn") { p.r = R(6, 11) * s; p.vy = R(0.8, 1.4) * s; p.c = any(LEAF); p.vr = R(-0.06, 0.06); }
      else if (k === "winter") { p.r = R(0.8, 3.2) * s; p.vy = R(0.25, 0.55) * s * (p.r / (3 * s) + 0.5); }
      else { p.r = R(1, 2.4) * s; p.vy = -R(0.12, 0.38) * s; if (!anywhere) p.y = H + 10; }
      return p;
    }
    function makeDrop(anywhere) {
      return { x: R(8, W - 8), y: anywhere ? R(0, H * 0.8) : R(-20, H * 0.4), r: R(2, 4.6) * s, vy: 0, wait: R(30, 260), trail: 0, al: anywhere ? 0 : 1, dying: false };
    }

    function set(k, quiet) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      parts.forEach((p) => { if (p.k !== k) { p.dying = true; if (!quiet) p.vx += R(2, 5) * dir * s; } });
      drops.forEach((d) => { if (k !== "autumn") d.dying = true; });
      kind = k;
      if (!W) return;
      const n = want();
      for (let i = 0; i < n * 0.7; i++) parts.push(make(k, true));
      if (k === "autumn") for (let i = 0; i < 9; i++) drops.push(makeDrop(true));
      if (k === "winter") paintFrost();
      if (reduce) { parts.forEach((p) => (p.al = p.dying ? 0 : 1)); drops.forEach((d) => (d.al = d.dying ? 0 : 1)); draw(false); }
    }

    function makeFrost() {
      frostImg = document.createElement("canvas");
      frostImg.width = Math.max(1, Math.round(W));
      frostImg.height = Math.max(1, Math.round(H));
      const c = frostImg.getContext("2d");
      const g = c.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.12, W / 2, H * 0.55, Math.max(W, H) * 0.72);
      g.addColorStop(0, "rgba(240,246,255,0.42)");
      g.addColorStop(0.55, "rgba(236,244,252,0.7)");
      g.addColorStop(1, "rgba(250,252,255,0.95)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      // ice ferns creeping in from the edges
      c.strokeStyle = "rgba(255,255,255,0.55)";
      c.lineCap = "round";
      for (let i = 0; i < 70; i++) {
        const side = i % 4;
        let x = side === 0 ? R(0, W * 0.12) : side === 1 ? R(W * 0.88, W) : R(0, W);
        let y = side === 2 ? R(H * 0.85, H) : side === 3 ? R(0, H * 0.15) : R(0, H);
        let a = Math.atan2(H * 0.55 - y, W / 2 - x) + R(-0.9, 0.9);
        let len = R(10, 26) * s;
        c.lineWidth = R(0.6, 1.4);
        for (let j = 0; j < 5; j++) {
          const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
          c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke();
          for (const b of [-0.8, 0.8]) {
            c.beginPath(); c.moveTo((x + nx) / 2, (y + ny) / 2);
            c.lineTo((x + nx) / 2 + Math.cos(a + b) * len * 0.45, (y + ny) / 2 + Math.sin(a + b) * len * 0.45); c.stroke();
          }
          x = nx; y = ny; a += R(-0.5, 0.5); len *= 0.78;
        }
      }
      for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(255,255,255,${R(0.15, 0.6)})`; c.fillRect(R(0, W), R(0, H), 1.2, 1.2); }
    }
    function paintFrost() {
      if (!frostImg) return;
      fctx.globalCompositeOperation = "source-over";
      fctx.clearRect(0, 0, W, H);
      fctx.drawImage(frostImg, 0, 0, W, H);
    }
    function wipe(a, b) {
      fctx.globalCompositeOperation = "destination-out";
      const r = 26 * s;
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (r * 0.35)));
      for (let i = 0; i <= n; i++) {
        const x = a.x + ((b.x - a.x) * i) / n, y = a.y + ((b.y - a.y) * i) / n;
        const g = fctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(0,0,0,0.9)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        fctx.fillStyle = g;
        fctx.beginPath(); fctx.arc(x, y, r, 0, 6.29); fctx.fill();
      }
      fctx.globalCompositeOperation = "source-over";
    }

    function drawPart(p) {
      ctx.globalAlpha = p.al;
      if (p.k === "winter") {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill();
        return;
      }
      if (p.k === "summer") {
        const tw = 0.55 + 0.45 * Math.sin(p.ph * 2.2);
        ctx.globalAlpha = p.al * tw * 0.35;
        ctx.fillStyle = "#fff6c8";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, 6.29); ctx.fill();
        ctx.globalAlpha = p.al * tw;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill();
        return;
      }
      const r = p.r;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(0.3 + 0.7 * Math.abs(Math.cos(p.ph)), 1);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      if (p.k === "spring") {
        ctx.moveTo(0, -r);
        ctx.bezierCurveTo(r * 1.1, -r * 0.7, r * 0.7, r * 0.9, 0, r);
        ctx.bezierCurveTo(-r * 0.7, r * 0.9, -r * 1.1, -r * 0.7, 0, -r);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath(); ctx.ellipse(-r * 0.2, -r * 0.2, r * 0.22, r * 0.45, 0, 0, 6.29); ctx.fill();
      } else {
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(r * 0.9, -r * 0.1, 0, r);
        ctx.quadraticCurveTo(-r * 0.9, -r * 0.1, 0, -r);
        ctx.fill();
        ctx.strokeStyle = "rgba(90,30,10,0.4)";
        ctx.lineWidth = Math.max(0.6, r * 0.09);
        ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.lineTo(0, r * 1.35); ctx.stroke();
      }
      ctx.restore();
    }
    function drawDrop(d) {
      ctx.globalAlpha = d.al;
      if (d.trail > 2) {
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = d.r * 0.7;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(d.x, d.y - d.trail); ctx.lineTo(d.x, d.y); ctx.stroke();
      }
      const g = ctx.createRadialGradient(d.x - d.r * 0.35, d.y - d.r * 0.4, d.r * 0.1, d.x, d.y, d.r);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.45, "rgba(255,255,255,0.25)");
      g.addColorStop(1, "rgba(80,50,60,0.35)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.29); ctx.fill();
    }

    function draw(move) {
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      if (move) {
        tick++;
        if (parts.filter((p) => p.k === kind && !p.dying).length < want() && Math.random() < 0.5) parts.push(make(kind, false));
        const pr = 80 * s, pr2 = pr * pr;
        for (const p of parts) {
          if (ptr) {
            const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
            if (d2 < pr2 && d2 > 1) { const d = Math.sqrt(d2), f = (1 - d2 / pr2) * 2.2; p.vx += (dx / d) * f * 0.5; p.y += (dy / d) * f; p.vr += 0.004 * Math.sign(dx); }
          }
          p.vx *= 0.94;
          p.ph += p.k === "autumn" ? 0.05 : 0.03;
          const sway = p.k === "spring" ? Math.sin(p.ph) * 0.6 : p.k === "autumn" ? Math.sin(p.ph * 0.8) * 1.3 : p.k === "winter" ? Math.sin(p.ph * 0.6 + p.r) * 0.35 : Math.sin(p.ph) * 0.3;
          p.x += sway * s + p.vx;
          p.y += p.vy;
          p.rot += p.vr;
          p.vr *= 0.995;
          p.al = p.dying ? p.al - 0.03 : Math.min(1, p.al + 0.04);
          if (p.al <= 0 || p.y > H + 30 || p.y < -40 || p.x < -50 || p.x > W + 50) p.gone = true;
        }
        parts = parts.filter((p) => !p.gone);
        for (const d of drops) {
          if (d.wait > 0) d.wait--;
          else { d.vy = Math.min(d.vy + 0.05 * s, 2.4 * s); d.y += d.vy; d.trail = Math.min(d.trail + d.vy, 60 * s); if (Math.random() < 0.01) { d.wait = R(20, 90); d.vy = 0; } }
          d.al = d.dying ? d.al - 0.03 : Math.min(1, d.al + 0.03);
          if (d.y > H + 10) Object.assign(d, makeDrop(false), { dying: d.dying });
        }
        drops = drops.filter((d) => d.al > 0 || !d.dying);
        if (kind === "autumn" && drops.length < 12 && Math.random() < 0.01) drops.push(makeDrop(false));
        // the pane frosts over again, slowly
        if (kind === "winter" && frostImg && tick % 5 === 0) {
          fctx.globalAlpha = 0.03;
          fctx.drawImage(frostImg, 0, 0, W, H);
          fctx.globalAlpha = 1;
        }
      }
      for (const d of drops) drawDrop(d);
      for (const p of parts) drawPart(p);
      ctx.globalAlpha = 1;
    }

    function loop() { draw(true); raf = requestAnimationFrame(loop); }
    function go() {
      const want = visible && !document.hidden && !reduce;
      if (want && !raf) raf = requestAnimationFrame(loop);
      if (!want && raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    const pos = (e) => { const r = glass.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    glass.addEventListener("pointermove", (e) => {
      const p = pos(e);
      if (kind === "winter" && last) wipe(last, p);
      ptr = p; last = p;
    });
    glass.addEventListener("pointerdown", (e) => { const p = pos(e); ptr = p; last = p; if (kind === "winter") wipe(p, p); });
    const leave = () => { ptr = null; last = null; };
    glass.addEventListener("pointerleave", leave);
    glass.addEventListener("pointercancel", leave);

    if ("ResizeObserver" in window) new ResizeObserver(size).observe(glass);
    else addEventListener("resize", size);
    size();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; go(); }, { rootMargin: "120px" }).observe(glass);
    } else { visible = true; go(); }
    document.addEventListener("visibilitychange", go);

    return { set };
  }
})();
