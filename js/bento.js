/* Mariday — bento from above (pages/bento.html, css/bento.css).
   The whole page is a flat lay on the table, shot from straight above:
   ① hero: the kraft box comes tied — the twine slips off, the lid flips open on its hinge and a piping bag writes;
     a palette knife smooths it over in a new cream and the next message is piped. Scrolling on, the camera dives
     into the cream until it fills the screen
   ② «Що написати?»: big messages piped in cream as you scroll, a little bento with each lands on the table,
     the page takes on each cream; a tap takes that design to the studio
   ③ «Ваш бенто»: the studio from above — type and the bag pipes it; nozzles, cream jars, the filling card;
     «Запакувати» flips the lid shut, ties the twine, stamps the seal, into the cart
   ④ «Чому бенто?»: a tear-off calendar, a kitchen scale, letter tiles and two spoons slide onto the table
   ⑤ the finale: a growth chart on the kitchen wall — the bento and the real big cakes grow up by height and get
     pencil marks with how many each feeds; then, on the cherry counter, the heart of two thumbprints
   The box is real CSS 3D: a tray with four walls, the cake standing in it and a lid on a hinge, seen through a camera
   above it — so the walls lean in and the lid really turns over. Works without GSAP; with reduced motion it is all shown. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const M = () => window.MARIDAY;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const esc = (s) => window.escapeHTML(s);
  const eur = (n) => window.formatEUR(n);
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2),
    in: (t) => t * t * t,
  };
  // a tween on requestAnimationFrame; resolves when done (at once with reduced motion)
  const tween = (ms, fn, ez = ease.out) => new Promise((done) => {
    if (reduce || ms <= 0) { fn(1, 1); return done(); }
    const t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / ms, 0, 1);
      fn(ez(t), t);
      t < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  });
  const fonts = () => (document.fonts ? document.fonts.ready : Promise.resolve());

  /* ───────── the cake: creams, nozzles, fillings ───────── */
  const CREAMS = { powder: "#f5bcc8", ice: "#dbefed", butter: "#fbe6b8", sky: "#bcd6f3", lilac: "#e9c6f0", cherry: "#6d0809", white: "#fbf6ee" };
  const CREAM_NAMES = { powder: "Пудровий", ice: "М’ятний", butter: "Вершковий", sky: "Блакитний", lilac: "Лавандовий", cherry: "Вишневий", white: "Білий" };
  const NOZZLES = {
    script: { name: "Каліграфія", ff: "'Great Vibes', cursive", w: 400, max: 52, css: "Great Vibes" },
    hand: { name: "Рукописний", ff: "Caveat, cursive", w: 700, max: 46, css: "Caveat" },
    bold: { name: "Жирний", ff: "Unbounded, sans-serif", w: 800, max: 26, css: "Unbounded" },
  };
  const FLAVORS = ["berry-forest", "snickers", "pistachio-raspberry", "lemon-raspberry"];
  const IDEAS = ["З днем народження!", "Ти — мій торт", "Happy B-day", "Love you", "Просто так ♥", "Шеф, ти топ", "Мир?", "Я пишаюсь тобою"];
  const flavor = (id) => (M().flavors || []).find((f) => f.id === id) || (M().flavors || [])[0] || { id, name: id };
  const layersOf = (id) => ((M().flavorMeta || {})[id] || { layers: ["#f0dca0", "#f7efe6", "#c2263f"] }).layers;
  const decorOf = (id) => (M().bentoDecor || []).find((d) => d.id === id) || (M().bentoDecor || [])[0] || { id: "light", name: "Легкий декор", price: 8, note: "" };
  const priceOf = (d) => (Number(M().bentoBase) || 0) + (Number(decorOf(d.decor).price) || 0);
  const minPrice = () => (Number(M().bentoBase) || 0) + Math.min(...(M().bentoDecor || [{ price: 0 }]).map((x) => Number(x.price) || 0));

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => clamp(Math.round(v + amt * 255), 0, 255);
    return "#" + ((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1);
  }
  const isDark = (hex) => { const n = parseInt(hex.slice(1), 16); return (n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140; };
  const inkOf = (c) => (isDark(c) ? "#fbd3dc" : "#6d0809");
  const pipOf = (key) => (key === "cherry" ? "#f5bcc8" : key === "white" ? "#f3b3c1" : "#fffaf3");
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const f1 = (v) => v.toFixed(1);

  let uid = 0;

  /* the shared pieces every drawing uses: the cream relief, rosettes, shells, the piping bag, the palette knife, a spoon */
  function defs() {
    if ($("#bn-defs")) return;
    const ros = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const r = 10 * (0.8 + 0.2 * Math.cos(a * 8));
      ros.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
    }
    const swirl = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 3.2;
      const r = 1 + (i / 40) * 6.4;
      swirl.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
    }
    const host = document.createElement("div");
    host.innerHTML = `<svg id="bn-defs" class="bn-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
      <filter id="bn-pipe" x="-20%" y="-40%" width="140%" height="180%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="b"/>
        <feSpecularLighting in="b" surfaceScale="2.6" specularConstant="0.9" specularExponent="14" lighting-color="#ffffff" result="s"><feDistantLight azimuth="225" elevation="50"/></feSpecularLighting>
        <feComposite in="s" in2="SourceAlpha" operator="in" result="si"/>
        <feOffset in="SourceAlpha" dx="1.4" dy="1.8" result="o"/><feGaussianBlur in="o" stdDeviation="1" result="ob"/>
        <feFlood flood-color="#3d0405" flood-opacity="0.3"/><feComposite in2="ob" operator="in" result="sh"/>
        <feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/><feMergeNode in="si"/></feMerge>
      </filter>
      <radialGradient id="bn-gold" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff6d0"/><stop offset="0.45" stop-color="#e3b94a"/><stop offset="1" stop-color="#8a6416"/></radialGradient>
      <linearGradient id="bn-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d8f96"/><stop offset="0.35" stop-color="#f4f5f7"/><stop offset="0.6" stop-color="#b9bcc3"/><stop offset="1" stop-color="#6c6e75"/></linearGradient>
      <linearGradient id="bn-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a4a26"/><stop offset="0.45" stop-color="#b47a45"/><stop offset="1" stop-color="#6a3d1e"/></linearGradient>
      <symbol id="bn-ros" viewBox="-12 -12 24 24" overflow="visible">
        <polygon points="${ros.join(" ")}" fill="currentColor"/>
        <polyline points="${swirl.join(" ")}" fill="none" stroke="rgba(61,4,5,0.16)" stroke-width="1.3" stroke-linecap="round"/>
      </symbol>
      <symbol id="bn-shell" viewBox="-12 -8 24 16" overflow="visible">
        <path d="M-11,3 C-10,-6 6,-8 11,0 C6,5 -4,7 -11,3 Z" fill="currentColor"/>
        <path d="M-8,2 C-4,-3 3,-4 8,0" fill="none" stroke="rgba(61,4,5,0.15)" stroke-width="1.1"/>
      </symbol>
      <symbol id="bn-bag" viewBox="-60 -170 140 180" overflow="visible">
        <g transform="rotate(30) scale(0.84)">
          <path d="M-8,-24 L8,-24 C16,-60 30,-100 40,-128 C22,-142 -22,-142 -40,-128 C-30,-100 -16,-60 -8,-24 Z" fill="rgba(255,255,255,0.62)" stroke="rgba(61,4,5,0.3)" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M-7,-27 L7,-27 C13,-50 21,-74 27,-90 C13,-97 -13,-97 -27,-90 C-21,-74 -13,-50 -7,-27 Z" fill="currentColor"/>
          <path d="M-27,-90 C-13,-97 13,-97 27,-90" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2"/>
          <path d="M-31,-116 C-21,-88 -13,-60 -7,-32" stroke="#fff" stroke-width="3.2" opacity="0.75" fill="none" stroke-linecap="round"/>
          <path d="M-40,-128 C-22,-142 22,-142 40,-128 C30,-138 14,-150 0,-152 C-14,-150 -30,-138 -40,-128 Z" fill="rgba(255,255,255,0.8)" stroke="rgba(61,4,5,0.26)" stroke-width="1.2"/>
          <path d="M-5,-150 C-9,-160 -5,-169 0,-173 C5,-169 9,-160 5,-150 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(61,4,5,0.26)" stroke-width="1.2"/>
          <rect x="-10" y="-31" width="20" height="8" rx="2.5" fill="#f1f2f5" stroke="rgba(40,40,48,0.35)" stroke-width="0.9"/>
          <path d="M-3,-1 L3,-1 L8,-23 L-8,-23 Z" fill="url(#bn-steel)" stroke="rgba(40,40,48,0.4)" stroke-width="0.8"/>
        </g>
      </symbol>
      <symbol id="bn-knife" viewBox="-20 -200 160 280" overflow="visible">
        <path d="M-7,-66 C-7,-72 7,-72 7,-66 L7,62 C7,70 -7,70 -7,62 Z" fill="url(#bn-steel)" stroke="rgba(40,40,48,0.35)" stroke-width="1"/>
        <path d="M0,-66 C2,-84 18,-90 30,-100" fill="none" stroke="#9a9ca3" stroke-width="7" stroke-linecap="round"/>
        <path d="M28,-98 L74,-168" stroke="url(#bn-wood)" stroke-width="16" stroke-linecap="round"/>
      </symbol>
      <symbol id="bn-teaspoon" viewBox="-30 -160 60 200" overflow="visible">
        <path d="M-3,-14 C-4,-60 -6,-110 -5,-150 C-5,-156 5,-156 5,-150 C6,-110 4,-60 3,-14 Z" fill="url(#bn-steel)" stroke="rgba(40,40,48,0.3)" stroke-width="0.8"/>
        <ellipse cx="0" cy="12" rx="17" ry="25" fill="url(#bn-steel)" stroke="rgba(40,40,48,0.3)" stroke-width="0.8"/>
        <ellipse cx="-3" cy="9" rx="10" ry="16" fill="#fff" opacity="0.55"/>
      </symbol>
    </defs></svg>`;
    document.body.prepend(host.firstElementChild);
  }

  /* ───────── the lettering: fitted inside the ring of rosettes, one or two lines (the top is 100 across the radius) ───────── */
  const RT = 100;
  const meas = document.createElement("canvas").getContext("2d");
  function lettering(text, nozzle) {
    const n = NOZZLES[nozzle] || NOZZLES.script;
    const words = String(text || "").trim();
    let lines = [words];
    if (words.length > 11) {
      const mid = words.lastIndexOf(" ", Math.ceil(words.length / 2) + 2);
      const alt = words.indexOf(" ", Math.floor(words.length / 2) - 1);
      const cut = mid > 0 ? mid : alt;
      if (cut > 0) lines = [words.slice(0, cut), words.slice(cut + 1)];
    }
    meas.font = `${n.w} 100px ${n.ff}`;
    const ws = lines.map((l) => Math.max(1, meas.measureText(l).width) / 100);
    const maxW = lines.length > 1 ? RT * 1.3 : RT * 1.4;
    let fs = Math.min(n.max * (lines.length > 1 ? 0.86 : 1), ...ws.map((w) => maxW / w));
    if (nozzle === "bold") fs = Math.min(fs, lines.length > 1 ? 22 : 26);
    const lh = fs * (nozzle === "bold" ? 1.15 : 0.98);
    const shift = nozzle === "bold" ? 0.36 : nozzle === "hand" ? 0.3 : 0.26;
    const y0 = -((lines.length - 1) * lh) / 2 + fs * shift;
    return { n, fs, lines: lines.map((t, i) => ({ t, w: ws[i] * fs, y: y0 + i * lh })), lh };
  }

  /* ───────── the top of the cake, seen from above ───────── */
  function topSVG(d, id, hide) {
    const c = CREAMS[d.color] || CREAMS.powder;
    const ink = inkOf(c);
    const pip = pipOf(d.color);
    const dark = isDark(c);
    const lt = lettering(d.text, d.font);
    const r = rng(7 + (d.text || "").length);
    let flat = "";
    // sprinkles in the band between the lettering and the rosettes
    if (d.decor !== "light") {
      const cols = dark ? ["#f5bcc8", "#fbe6b8", "#ffffff", "#bcd6f3"] : ["#6d0809", "#e2849a", "#7fb6e8", "#f2c94c", "#ffffff", "#9ed9b8"];
      for (let i = 0; i < 30; i++) {
        const a = r() * Math.PI * 2, rr = RT * (0.62 + r() * 0.12);
        flat += `<rect class="bn-spr" style="--i:${i}" x="${f1(Math.cos(a) * rr - 1.5)}" y="${f1(Math.sin(a) * rr - 5)}" width="3" height="10" rx="1.5" fill="${cols[i % cols.length]}" transform="rotate(${(r() * 180) | 0} ${f1(Math.cos(a) * rr)} ${f1(Math.sin(a) * rr)})"/>`;
      }
    }
    // the ring of rosettes and, with more decor, pearls between them
    let ring = "";
    const N = 20;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      ring += `<use href="#bn-ros" x="-12" y="-12" width="24" height="24" transform="translate(${f1(Math.cos(a) * RT * 0.85)} ${f1(Math.sin(a) * RT * 0.85)}) rotate(${(i * 37) % 360}) scale(1.12)"/>`;
    }
    let pearls = "";
    if (d.decor !== "light") {
      for (let i = 0; i < N; i++) {
        const a = ((i + 0.5) / N) * Math.PI * 2 - Math.PI / 2;
        pearls += `<circle cx="${f1(Math.cos(a) * RT * 0.85)}" cy="${f1(Math.sin(a) * RT * 0.85)}" r="3.4" fill="${d.decor === "complex" ? "url(#bn-gold)" : "#fff"}"/>`;
      }
    }
    // the shell border round the edge
    let shells = "";
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * 360;
      shells += `<use href="#bn-shell" x="-12" y="-8" width="24" height="16" transform="rotate(${a.toFixed(1)}) translate(0 ${-RT * 0.985}) scale(0.95)"/>`;
    }
    const cherries = d.decor === "complex"
      ? `<image class="bn-cherry" href="${assetPath("img/cakes/cherries.png")}" x="38" y="-96" width="58" height="58" transform="rotate(18 67 -67)"/>`
      : "";
    const lines = lt.lines.map((l, i) => `<text x="0" y="${f1(l.y)}" data-l="${i}">${esc(l.t)}</text>`).join("");
    const masks = lt.lines.map((l, i) => `<rect data-m="${i}" x="${-RT}" y="${f1(l.y - lt.fs * 1.05)}" width="${hide ? 0 : 2 * RT}" height="${f1(lt.lh + lt.fs * 0.5)}" fill="#fff"/>`).join("");
    const svg = `<svg class="fb__svg" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="${id}-t" cx="0.34" cy="0.3" r="0.9"><stop offset="0" stop-color="${shade(c, 0.07)}"/><stop offset="0.55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.07)}"/></radialGradient>
        <mask id="${id}-m" maskUnits="userSpaceOnUse" x="-112" y="-112" width="224" height="224">${masks}</mask>
      </defs>
      <circle r="${RT * 1.08}" fill="url(#bn-gold)"/>
      <circle r="${RT}" fill="url(#${id}-t)"/>
      <g class="bn-sprs">${flat}</g>
      <g class="bn-ink" mask="url(#${id}-m)"><g filter="url(#bn-pipe)" text-anchor="middle" font-family="${lt.n.ff}" font-weight="${lt.n.w}" font-size="${f1(lt.fs)}" fill="${ink}" letter-spacing="${d.font === "bold" ? "-0.4" : "0"}">${lines}</g></g>
      <g filter="url(#bn-pipe)" style="color:${pip}">${ring}${pearls}${shells}</g>
      ${cherries}
    </svg>`;
    return { svg, lt, ink };
  }

  /* ───────── the box: real CSS 3D, seen from above ─────────
     o.yaw turns the whole box on the table (the lettering and the print inside the lid stay upright),
     o.open is the lid in degrees (0 shut, 180 lying open on the table), o.side draws what only a tilted camera sees */
  const WALLS = ["n", "e", "s", "w"];
  function box(d, o = {}) {
    defs();
    const id = `fb${++uid}`;
    const el = document.createElement("div");
    el.className = "fb" + (o.cls ? " " + o.cls : "");
    // without o.yaw the stylesheet turns the box (it differs between a phone and a wide screen)
    if (o.yaw != null) el.style.setProperty("--yaw", `${o.yaw}deg`);
    if (o.tilt) el.style.setProperty("--tilt", `${o.tilt}deg`);
    // a wall: kraft outside, paper inside (the outside of the tray only shows to a tilted camera)
    const wall = (k, cls, inner = "") => `<i class="${cls} ${cls}--${k}"><b class="o">${inner}</b><b class="i"></b></i>`;
    // the cake's sides only for a camera tipped well over (with the walls too the browser mis-sorts them at a shallow angle)
    const strips = o.side ? [...Array(24)].map((_, i) => `<i style="--a:${i * 15}deg"></i>`).join("") : "";
    el.innerHTML = `<div class="fb__cam">
        <i class="fb__shadow"></i><i class="fb__shadow fb__shadow--lid"></i>
        <div class="fb__box">
          <i class="fb__floor"></i>
          ${WALLS.map((k) => wall(k, "fb__wall")).join("")}
          ${strips ? `<div class="fb__side">${strips}</div>` : ""}
          <div class="fb__top"><div class="fb__face">
            <div class="fb__disc"></div>
            <svg class="fb__tools" viewBox="-112 -112 224 224" aria-hidden="true" focusable="false">
              <g data-knife class="bn-knife"><use href="#bn-knife" x="-20" y="-200" width="160" height="280" transform="scale(0.8)"/></g>
              <g data-bag class="bn-bag"><use href="#bn-bag" x="-60" y="-170" width="140" height="180" transform="scale(0.8)"/></g>
            </svg>
          </div></div>
          <div class="fb__lid">
            <div class="fb__panel">
              <b class="o"><span class="fb__stamp">Mariday</span>
                <svg class="fb__twine" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="50" y1="0" x2="50" y2="100" pathLength="1"/><line x1="0" y1="50" x2="100" y2="50" pathLength="1"/></svg>
                <span class="fb__bow"><i></i><i></i><u></u></span></b>
              <b class="i"><span class="fb__print"><em>Mariday</em><small>made with love</small></span></b>
            </div>
            ${WALLS.map((k) => wall(k, "fb__lip", k === "s" ? '<span class="fb__seal">M</span>' : "")).join("")}
          </div>
        </div>
      </div>`;
    if (o.tag) {
      const t = document.createElement("span");
      t.className = "fb__tag";
      t.innerHTML = `<span>${esc(o.tag)}</span>`;
      $(".fb__cam", el).append(t);
    }
    const disc = $(".fb__disc", el);
    const face = $(".fb__face", el);
    const bag = $("[data-bag]", el);
    const knife = $("[data-knife]", el);
    const api = { el, d: { ...d }, open: o.open ?? 180, busy: false };

    api.paint = (hide) => {
      const t = topSVG(api.d, `${id}-${++uid}`, hide);
      disc.innerHTML = t.svg;
      api.lt = t.lt;
      api.svg = disc.firstElementChild;
      const c = CREAMS[api.d.color] || CREAMS.powder;
      el.style.setProperty("--cream", c);
      el.style.setProperty("--cream-d", shade(c, -0.12));
      el.style.setProperty("--pip", pipOf(api.d.color));
      bag.style.color = inkOf(c);
      {
        // the sides of the cake: lit from the top left, as everything on the table
        const yaw = ((o.yaw ?? (parseFloat(getComputedStyle(el).getPropertyValue("--yaw")) || 0)) * Math.PI) / 180;
        $$(".fb__side i", el).forEach((s, i) => {
          const a = (i * 15 * Math.PI) / 180 + yaw;
          const lit = (Math.sin(a) - Math.cos(a)) / Math.SQRT2; // −1 … 1
          s.style.background = shade(c, -0.1 + lit * 0.07);
        });
      }
      return api.svg;
    };
    api.setOpen = (deg) => {
      api.open = deg;
      el.style.setProperty("--open", `${deg.toFixed(1)}deg`);
      el.style.setProperty("--lidsh", clamp((deg - 100) / 80, 0, 1).toFixed(2)); // the open lid's own shadow on the table
    };
    api.flip = (to, ms = 1000, ez = ease.back) => { const from = api.open; return tween(ms, (q) => api.setOpen(from + (to - from) * q), ez); };
    api.tie = (on) => {
      el.classList.remove("is-tied");
      if (on) { void el.offsetWidth; el.classList.add("is-tied"); }
    };
    const place = (g, x, y, rot = 0) => g.setAttribute("transform", `translate(${f1(x)} ${f1(y)}) rotate(${rot})`);

    // the bag writes the lettering line by line, its nozzle riding the edge of what is already piped
    api.pipe = async (ms) => {
      const lt = api.lt;
      const rects = $$("[data-m]", api.svg);
      const total = lt.lines.reduce((s, l) => s + Math.max(l.w, 8), 0);
      const dur = ms ?? clamp(380 + lt.lines.reduce((s, l) => s + l.t.length, 0) * 60, 700, 2200);
      if (reduce) { rects.forEach((r) => r.setAttribute("width", 2 * RT)); return; }
      rects.forEach((r) => r.setAttribute("width", 0));
      bag.classList.add("is-on");
      let acc = 0;
      for (let i = 0; i < lt.lines.length; i++) {
        const l = lt.lines[i];
        const w = Math.max(l.w, 8);
        const x0 = -w / 2;
        const part = (w / total) * dur;
        const r = rects[i];
        await tween(part, (q, t) => {
          const edge = x0 + w * t;
          r.setAttribute("width", f1(edge + RT + 2));
          const wob = Math.sin((acc + t * part) / 38) * lt.fs * 0.22;
          place(bag, edge, l.y - lt.fs * 0.32 + wob);
        }, (t) => t);
        r.setAttribute("width", 2 * RT);
        acc += part;
      }
      const last = lt.lines[lt.lines.length - 1];
      const X = Math.max(last.w, 8) / 2, Y = last.y - lt.fs * 0.32;
      await tween(260, (q) => place(bag, X + q * 24, Y - q * 36));
      bag.classList.remove("is-on");
    };
    // while typing: the text is there at once and the bag hovers at its end, as if it had just written it
    let hoverT = 0;
    api.peek = () => {
      if (reduce) return;
      const last = api.lt.lines[api.lt.lines.length - 1];
      place(bag, Math.max(last.w, 8) / 2 + 4, last.y - api.lt.fs * 0.32);
      bag.classList.add("is-on", "is-quick");
      clearTimeout(hoverT);
      hoverT = setTimeout(() => bag.classList.remove("is-on", "is-quick"), 900);
    };
    // the palette knife sweeps across; behind it lies the new cream (the old top is peeled away)
    api.smooth = async (next, ms = 900) => {
      const old = api.svg;
      Object.assign(api.d, next);
      if (reduce || !old) { api.paint(false); return; }
      const ghost = old.cloneNode(true);
      ghost.classList.add("bn-ghost");
      api.paint(true);
      disc.appendChild(ghost);
      knife.classList.add("is-on");
      await tween(ms, (q) => {
        const x = -104 + 208 * q;
        ghost.style.clipPath = `inset(0 0 0 ${(((x + 112) / 224) * 100).toFixed(1)}%)`;
        place(knife, x, 0, -6 + q * 10);
      }, ease.inOut);
      ghost.remove();
      knife.classList.remove("is-on");
    };
    api.paint(!!o.hide);
    api.setOpen(api.open);
    if (o.tied) el.classList.add("is-tied", "is-still");
    return api;
  }

  /* ───────── headings: glazed letters jump in, the script word is piped after them ───────── */
  function headings() {
    const hs = $$(".bn-h2");
    hs.forEach((h) => {
      const w = $("[data-bn-split]", h);
      if (!w) return;
      const text = w.textContent;
      w.textContent = "";
      [...text].forEach((ch, i) => {
        const s = document.createElement("span");
        s.className = "bn-ch";
        s.style.setProperty("--i", i);
        s.style.setProperty("--cr", `${i % 2 ? 12 : -12}deg`);
        s.textContent = ch === " " ? " " : ch;
        w.appendChild(s);
      });
    });
    if (reduce || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("bn-js");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -8% 0px" });
    hs.forEach((h) => io.observe(h));
  }

  // runs on() while el is near the screen, off() when it leaves
  const whenSeen = (el, on, off) => {
    if (!("IntersectionObserver" in window)) return on();
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? on() : off && off())), { rootMargin: "80px 0px" }).observe(el);
  };
  const teaspoon = (cls = "") => `<svg class="bn-teaspoon ${cls}" viewBox="-30 -160 60 200" aria-hidden="true"><use href="#bn-teaspoon"/></svg>`;

  /* ───────── ① the hero: untie, flip open, write — smooth over, write again; then the dive ───────── */
  const HERO = [
    { text: "Love you", color: "powder", font: "script", decor: "complex" },
    { text: "Шеф, ти топ", color: "butter", font: "bold", decor: "medium" },
    { text: "З днем народження!", color: "sky", font: "hand", decor: "medium" },
    { text: "Ти — мій торт", color: "lilac", font: "script", decor: "complex" },
    { text: "Мир?", color: "white", font: "bold", decor: "light" },
    { text: "Просто так", color: "ice", font: "hand", decor: "medium" },
  ];
  function hero() {
    const sec = $("[data-bn-hero]");
    const host = $("[data-bn-hero-box]");
    if (!sec || !host) return;
    $$("[data-bn-spoon]", sec).forEach((s) => (s.innerHTML = teaspoon()));
    const from = $("[data-bn-from]", sec);
    if (from) from.textContent = `від ${eur(minPrice())} · від 1 дня`;
    const b = box(HERO[0], { open: reduce ? 180 : 0, hide: !reduce, tied: !reduce, cls: "fb--hero" });
    host.prepend(b.el);
    const dive = $("[data-bn-dive]", sec);
    // the colour the camera dives into is where «Що написати?» begins
    const wsec = $("[data-bn-words]");
    const setDive = () => {
      const c = b.d.color === "cherry" ? CREAMS.powder : CREAMS[b.d.color];
      dive && dive.style.setProperty("--dive", c);
      if (wsec && !wsec.dataset.tinted) wsec.style.setProperty("--wc", c);
    };
    setDive();
    if (reduce) return;
    let seen = false, started = false, k = 0, hold = false;
    const loop = async () => {
      // tied when the page opens: the twine slips off, the lid flips open on its hinge
      await sleep(350);
      b.tie(false);
      b.el.classList.remove("is-still");
      await sleep(250);
      await b.flip(180, 1100);
      host.classList.add("is-open");
      await b.pipe();
      for (;;) {
        await sleep(2600);
        while (!seen || hold || document.hidden) await sleep(400);
        k = (k + 1) % HERO.length;
        await b.smooth(HERO[k], 950);
        setDive();
        await sleep(100);
        await b.pipe();
      }
    };
    whenSeen(host, () => { seen = true; if (!started) { started = true; fonts().then(loop); } }, () => (seen = false));

    // the dive: scrolling on, the stage leans in and the cream of the cake spreads over the whole screen
    if (!window.gsap || !window.ScrollTrigger || !dive) return;
    const pin = $(".bn-hero__pin", sec);
    const at = () => {
      const t = $(".fb__top", b.el).getBoundingClientRect(), p = pin.getBoundingClientRect();
      return [((t.left + t.width / 2 - p.left) / p.width) * 100, ((t.top + t.height / 2 - p.top) / p.height) * 100];
    };
    let ctr = [70, 55];
    const words = $$(".bn-dive__say span", dive);
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec, start: "top top", end: () => "+=" + Math.round(innerHeight * 0.9), pin, scrub: 0.5, anticipatePin: 1,
        onRefresh: () => { if (!tl || tl.progress() === 0) ctr = at(); },
        onToggle: (st) => { hold = st.isActive && st.progress > 0.02; },
        onUpdate: (st) => { hold = st.progress > 0.02; },
      },
    });
    tl.fromTo(dive, { "--r": "0%" }, { "--r": "150%", ease: "power2.in", duration: 1 }, 0)
      .to($(".bn-hero__copy", sec), { y: -60, opacity: 0, ease: "power1.in", duration: 0.5 }, 0)
      .to(host, { scale: 1.7, ease: "power2.in", duration: 1 }, 0)
      .to($(".bn-hero__props", sec), { scale: 1.4, opacity: 0, ease: "power2.in", duration: 0.8 }, 0)
      .fromTo(words, { clipPath: "inset(-40% 100% -40% -10%)" }, { clipPath: "inset(-40% -10% -40% -10%)", ease: "none", duration: 0.32, stagger: 0.12 }, 0.5);
    gsap.set(dive, { "--x": () => ctr[0] + "%", "--y": () => ctr[1] + "%" });
    ScrollTrigger.addEventListener("refreshInit", () => { gsap.set(host, { scale: 1 }); });
    ScrollTrigger.addEventListener("refresh", () => { ctr = at(); dive.style.setProperty("--x", ctr[0] + "%"); dive.style.setProperty("--y", ctr[1] + "%"); });
  }

  /* ───────── ② «Що написати?»: the messages piped big, a bento lands with each ───────── */
  const WORDS = [
    { text: "Love you", who: "коханим", color: "powder", font: "script", decor: "complex", flavor: "berry-forest", say: "класика, яку щоразу читають уголос" },
    { text: "Шеф, ти топ", who: "шефу", color: "butter", font: "bold", decor: "light", flavor: "snickers", say: "офіс з’їсть за 4 хвилини" },
    { text: "Мир?", who: "після сварки", color: "lilac", font: "hand", decor: "light", flavor: "pistachio-raspberry", say: "працює краще за довгі повідомлення" },
    { text: "Мамі ♥", who: "мамі", color: "white", font: "script", decor: "medium", flavor: "berry-forest", say: "без приводу — найкращий привід" },
    { text: "18!", who: "на повноліття", color: "sky", font: "bold", decor: "complex", flavor: "snickers", say: "свічка вже в коробці" },
    { text: "Просто так", who: "без приводу", color: "ice", font: "hand", decor: "medium", flavor: "lemon-raspberry", say: "для вівторка, який схотів свята" },
  ];
  let studioApi = null;
  function wordsSection() {
    const sec = $("[data-bn-words]");
    const list = $("[data-bn-list]");
    if (!sec || !list) return;
    list.innerHTML = WORDS.map((d, i) => `<li class="bn-word bn-word--${d.font}${i % 2 ? " is-flip" : ""}" style="--c:${CREAMS[d.color]}">
        <p class="bn-word__say" aria-hidden="true"><span>${esc(d.text)}</span></p>
        <div class="bn-word__side">
          <button type="button" class="bn-word__box" data-w="${i}" aria-label="Взяти дизайн «${esc(d.text)}» (${esc(d.who)}) у майстерню"></button>
          <p class="bn-word__note bn-hand"><b>${esc(d.who)}</b> — ${esc(d.say)}</p>
          <span class="bn-word__take" aria-hidden="true">в майстерню ✦</span>
        </div>
      </li>`).join("");
    const boxes = $$(".bn-word", list).map((li, i) => {
      const d = WORDS[i];
      const b = box(d, { yaw: i % 2 ? -90 : 90, open: reduce ? 180 : 0, hide: !reduce, tied: false, cls: "fb--mini" });
      $(".bn-word__box", li).append(b.el);
      return b;
    });
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-w]");
      if (!btn) return;
      const li = btn.closest(".bn-word");
      li.classList.remove("is-taken");
      void li.offsetWidth;
      li.classList.add("is-taken");
      studioApi?.load(WORDS[+btn.dataset.w]);
    });
    if (reduce || !("IntersectionObserver" in window)) { sec.classList.add("is-static"); return; }
    sec.classList.add("is-js");

    // each bento lands on the table as its message comes up, then opens and gets it piped
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const i = $$(".bn-word", list).indexOf(e.target);
      const b = boxes[i];
      e.target.classList.add("is-in");
      fonts().then(async () => {
        await sleep(380);
        await b.flip(180, 900);
        await b.pipe(900);
      });
    }), { rootMargin: "0px 0px -18% 0px" });
    $$(".bn-word", list).forEach((li) => io.observe(li));

    if (!window.gsap || !window.ScrollTrigger) { $$(".bn-word", list).forEach((li) => li.classList.add("is-piped")); return; }
    // the big message is piped as it comes up the screen; the room takes on its cream
    $$(".bn-word", list).forEach((li, i) => {
      const say = $(".bn-word__say span", li);
      gsap.fromTo(say, { clipPath: "inset(-40% 100% -40% -12%)" }, {
        clipPath: "inset(-40% -12% -40% -12%)", ease: "none",
        scrollTrigger: { trigger: li, start: "top 88%", end: "top 38%", scrub: 0.4 },
      });
      ScrollTrigger.create({
        trigger: li, start: "top 60%", end: "bottom 40%",
        onToggle: (st) => { if (st.isActive) { sec.dataset.tinted = "1"; gsap.to(sec, { "--wc": CREAMS[WORDS[i].color], duration: 0.8, ease: "power2.out", overwrite: "auto" }); } },
      });
    });
  }

  /* ───────── ③ the studio ───────── */
  function studio() {
    const root = $("#bn-studio");
    if (!root) return;
    const st0 = { text: "З днем народження!", color: "powder", font: "script", decor: (M().bentoDecor || [])[0]?.id || "light", flavor: FLAVORS[0] };
    const decor = M().bentoDecor || [];
    const cut = (id) => { const ls = layersOf(id); const rows = []; ls.forEach((col, i) => { rows.push(col); if (i < ls.length - 1) rows.push("#fbf3e6"); }); return rows.reverse().map((col) => `<i style="background:${col}"></i>`).join(""); };
    root.innerHTML = `
      <div class="bn-studio__stage">
        <div class="bn-studio__table">
          <div class="bn-studio__box" data-st-box></div>
          <div class="bn-taste" data-st-taste aria-hidden="true">
            <span class="bn-taste__cut" data-st-cut></span>
            <small>начинка</small><b data-st-flv></b>
            ${teaspoon("bn-taste__spoon")}
          </div>
          <div class="bn-tag" data-st-tag aria-hidden="true"><span class="bn-tag__paper"><small>бенто</small><b data-st-price></b></span></div>
        </div>
        <p class="bn-hand bn-studio__note" aria-hidden="true">~400 г · 1–2 особи · від 1 дня</p>
      </div>
      <div class="bn-studio__panel">
        <div class="bn-group bn-group--text">
          <label class="bn-label" for="bn-text">Напис <small>до 25 символів</small></label>
          <div class="bn-field"><input class="bn-input" id="bn-text" type="text" maxlength="25" autocomplete="off" spellcheck="false" placeholder="Ваш напис" value="${esc(st0.text)}"><span class="bn-field__n" data-st-left>${25 - st0.text.length}</span></div>
          <div class="bn-ideas" role="group" aria-label="Ідеї для напису">${IDEAS.map((t, i) => `<button type="button" class="bn-idea" data-idea="${esc(t)}" style="--r:${[-3, 2, -1.5, 3, -2, 1.5, -2.5, 2][i % 8]}deg">${esc(t)}</button>`).join("")}</div>
        </div>
        <div class="bn-group">
          <p class="bn-label" id="bn-l-font">Насадка</p>
          <div class="bn-nozzles" role="group" aria-labelledby="bn-l-font">${Object.entries(NOZZLES).map(([id, n]) => `<button type="button" class="bn-nozzle" data-font="${id}" aria-pressed="false"><svg viewBox="0 0 40 48" aria-hidden="true"><path d="M12,2 L28,2 L24,34 L16,34 Z" fill="url(#bn-steel)" stroke="rgba(40,40,48,0.4)"/>${id === "bold" ? '<rect x="17" y="34" width="6" height="8" rx="1" fill="#9a9ca3"/>' : id === "hand" ? '<path d="M16,34 L24,34 L22,44 L18,44 Z" fill="#9a9ca3"/>' : '<path d="M16,34 L24,34 L20.5,46 L19.5,46 Z" fill="#9a9ca3"/>'}<path d="M15,8 L17,32 M25,8 L23,32 M20,6 L20,32" stroke="rgba(40,40,48,0.25)"/></svg><b style="font-family:${n.ff};font-weight:${n.w}">Aa</b><small>${n.name}</small></button>`).join("")}</div>
        </div>
        <div class="bn-group">
          <p class="bn-label" id="bn-l-cream">Колір крему <small data-st-cream></small></p>
          <div class="bn-creams" role="group" aria-labelledby="bn-l-cream">${Object.entries(CREAMS).map(([id, c]) => `<button type="button" class="bn-cream" data-color="${id}" aria-pressed="false" aria-label="${CREAM_NAMES[id]} крем" style="--c:${c};--c2:${shade(c, -0.14)}"><span class="bn-cream__jar" aria-hidden="true"><i></i></span></button>`).join("")}</div>
        </div>
        <div class="bn-group">
          <p class="bn-label" id="bn-l-flv">Начинка <small>ложечки вже в коробці</small></p>
          <div class="bn-flavors" role="group" aria-labelledby="bn-l-flv">${FLAVORS.map((id) => `<button type="button" class="bn-flavor" data-flavor="${id}" aria-pressed="false"><span class="bn-flavor__cut" aria-hidden="true">${cut(id)}</span><b>${esc(flavor(id).name)}</b></button>`).join("")}</div>
        </div>
        <div class="bn-group">
          <p class="bn-label" id="bn-l-dec">Декор</p>
          <div class="bn-decors" role="group" aria-labelledby="bn-l-dec">${decor.map((x) => `<button type="button" class="bn-decor" data-decor="${esc(x.id)}" aria-pressed="false"><span class="bn-decor__pic bn-decor__pic--${esc(x.id)}" aria-hidden="true"></span><b>${esc(String(x.name).replace(/\s*декор$/i, ""))} <span>+€${Number(x.price) || 0}</span></b><small>${esc(x.note || "")}</small></button>`).join("")}</div>
        </div>
        <div class="bn-total">
          <div><small>База €${Number(M().bentoBase) || 0} + декор</small><b data-st-total></b></div>
          <button type="button" class="p-btn p-btn--big bn-pack" data-st-add><span>Запакувати в кошик</span></button>
        </div>
      </div>`;

    const s = box(st0, { open: 180, hide: !reduce, cls: "fb--studio" });
    $("[data-st-box]", root).append(s.el);
    const input = $("#bn-text", root);
    const tag = $("[data-st-tag]", root);
    const taste = $("[data-st-taste]", root);
    let price = -1;
    const paintUI = () => {
      const d = s.d;
      [["data-font", "font"], ["data-color", "color"], ["data-flavor", "flavor"], ["data-decor", "decor"]].forEach(([a, k]) =>
        $$(`[${a}]`, root).forEach((b) => { const on = b.getAttribute(a) === d[k]; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); }));
      $$("[data-idea]", root).forEach((b) => b.classList.toggle("is-on", b.dataset.idea === d.text));
      $("[data-st-cream]", root).textContent = `· ${CREAM_NAMES[d.color].toLowerCase()}`;
      $("[data-st-left]", root).textContent = 25 - d.text.length;
      $("[data-st-cut]", root).innerHTML = cut(d.flavor);
      $("[data-st-flv]", root).textContent = flavor(d.flavor).name;
      const p = priceOf(d);
      $("[data-st-price]", root).textContent = eur(p);
      $("[data-st-total]", root).textContent = eur(p);
      if (p !== price && price >= 0 && !reduce) { tag.classList.remove("is-swing"); void tag.offsetWidth; tag.classList.add("is-swing"); }
      price = p;
    };
    paintUI();
    // the first time the studio is seen, the bag writes the starting text
    let first = true;
    whenSeen(root, () => { if (!first) return; first = false; fonts().then(() => { s.paint(true); s.pipe(); }); });
    fonts().then(() => { if (first) s.paint(!reduce); });

    let queue = Promise.resolve();
    const run = (fn) => (queue = queue.then(fn).catch(() => {}));
    const set = (k, v) => {
      if (s.d[k] === v || s.busy) return;
      if (k === "color") { run(async () => { await s.smooth({ color: v }, 800); await s.pipe(500); paintUI(); }); s.d.color = v; paintUI(); return; }
      s.d[k] = v;
      if (k === "flavor") {
        if (!reduce) { taste.classList.remove("is-hop"); void taste.offsetWidth; taste.classList.add("is-hop"); }
      } else if (k === "font") {
        run(async () => { s.paint(true); await s.pipe(); });
      } else if (k === "decor") {
        s.paint(false);
        s.svg.classList.add("is-decor");
      }
      paintUI();
    };
    root.addEventListener("click", (e) => {
      for (const [a, k] of [["data-font", "font"], ["data-color", "color"], ["data-flavor", "flavor"], ["data-decor", "decor"]]) {
        const b = e.target.closest(`[${a}]`);
        if (b) return set(k, b.getAttribute(a));
      }
      const idea = e.target.closest("[data-idea]");
      if (idea) {
        input.value = s.d.text = idea.dataset.idea;
        run(async () => { s.paint(true); await s.pipe(); });
        return paintUI();
      }
      if (e.target.closest("[data-st-add]")) pack();
    });
    input.addEventListener("input", () => {
      s.d.text = input.value;
      s.paint(false);
      s.peek();
      paintUI();
    });

    // closing the box: the lid flips over shut, the twine is tied, the seal stamped — and off to the cart
    async function pack() {
      if (s.busy) return;
      s.busy = true;
      root.classList.add("is-packing");
      const d = { ...s.d };
      const f = flavor(d.flavor);
      const btn = $("[data-st-add]", root);
      await s.flip(0, 760, ease.in);
      s.el.classList.remove("is-thud");
      void s.el.offsetWidth;
      s.el.classList.add("is-thud");
      s.tie(true);
      await sleep(900);
      addToCartAndNotify({ id: "bento", name: "Бенто-торт", price: priceOf(d), flavor: d.flavor, variant: `${d.color}-${d.font}-${d.text}`, image: M().img("pink"), meta: `${f.name} · ${decorOf(d.decor).name.toLowerCase()} · напис «${d.text || "без напису"}»` }, $("[data-st-box]", root));
      window.burstConfetti?.(btn);
      await sleep(1400);
      s.tie(false);
      await sleep(250);
      await s.flip(180, 950);
      root.classList.remove("is-packing");
      s.busy = false;
    }

    studioApi = {
      // a design from «Що написати?»: the studio comes into view and the cake is redone in it
      load(d) {
        const go = () => run(async () => {
          input.value = d.text;
          await s.smooth({ text: d.text, color: d.color, font: d.font, decor: d.decor, flavor: d.flavor }, 760);
          paintUI();
          await s.pipe();
        });
        const y = root.getBoundingClientRect().top;
        if (y > innerHeight * 0.4 || y < -root.offsetHeight * 0.5) {
          window.MaridayLenis ? MaridayLenis.scrollTo(root, { offset: -90, duration: 1.2 }) : root.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
          setTimeout(go, reduce ? 0 : 900);
        } else go();
      },
    };
  }

  /* ───────── ④ why bento: the facts slide onto the table ───────── */
  function why() {
    const sec = $("[data-bn-why]");
    if (!sec) return;
    $$("[data-bn-spoon]", sec).forEach((s) => (s.innerHTML = teaspoon()));
    // the scale's dial: every 50 g a tick, every 200 g a number
    const ticks = $("[data-bn-ticks]", sec);
    const MAXG = 600, A0 = -135, A1 = 135;
    const ang = (g) => A0 + ((A1 - A0) * g) / MAXG;
    let t = "";
    for (let g = 0; g <= MAXG; g += 50) {
      const a = (ang(g) * Math.PI) / 180, big = g % 200 === 0;
      const x = Math.sin(a), y = -Math.cos(a);
      t += `<line x1="${f1(x * 74)}" y1="${f1(y * 74)}" x2="${f1(x * (big ? 62 : 67))}" y2="${f1(y * (big ? 62 : 67))}" class="${big ? "is-big" : ""}"/>`;
      if (big) t += `<text x="${f1(x * 50)}" y="${f1(y * 50 + 4)}">${g}</text>`;
    }
    ticks.innerHTML = t;
    const needle = $("[data-bn-needle]", sec);
    const read = $("[data-bn-read]", sec);
    const setG = (g) => { needle.setAttribute("transform", `rotate(${ang(g).toFixed(1)})`); read.textContent = Math.round(g); };
    // the letter tiles spell a message of up to 25 signs
    const tiles = $("[data-bn-tiles]", sec);
    const MSG = "ТИ МІЙ ТОРТ";
    tiles.innerHTML = [...MSG].map((ch, i) => ch === " " ? '<i class="is-gap"></i>' : `<b style="--i:${i};--x:${((i * 53) % 9) - 4};--y:${((i * 31) % 7) - 3};--r:${((i * 47) % 50) - 25}deg">${ch}<sub>${i + 1}</sub></b>`).join("") + `<em class="bn-tiles__count">${MSG.length} / 25</em>`;

    if (reduce || !("IntersectionObserver" in window)) { sec.classList.add("is-in"); setG(400); return; }
    sec.classList.add("is-js");
    setG(0);
    new IntersectionObserver((es, io) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      sec.classList.add("is-in");
      // the needle swings past 400 and settles on it
      setTimeout(() => tween(1600, (q) => setG(400 * q), ease.back), 600);
    }), { rootMargin: "0px 0px -15% 0px" }).observe($(".bn-why__table", sec));
  }

  /* ───────── ⑤ the finale: the little one among the big cakes ───────── */
  // the growth chart: scrolling, the bento grows — and pops into a 1.5 kg cake, then a bigger one, then the tiered one.
  // A pencil rides the ruler at the cake's top and marks every height on the wall, like a child's on a door frame.
  const GROW = [
    { say: "А я ще підросту!", what: "побачення" },
    { say: "На день народження — якраз!", what: "день народження" },
    { say: "Ювілей? Легко!", what: "ювілей" },
    { say: "Весілля? Я готовий!", what: "весілля" },
  ];
  const PENCIL = `<svg viewBox="0 0 120 22" aria-hidden="true"><path d="M0,11 L22,3 L22,19 Z" fill="#e9c9a0"/><path d="M0,11 L8,8 L8,14 Z" fill="#3d0405"/>
    <rect x="22" y="3" width="80" height="16" fill="#f5bcc8"/><rect x="22" y="3" width="80" height="5" fill="#fbd6de"/><rect x="22" y="14" width="80" height="5" fill="#e2849a"/>
    <rect x="102" y="2" width="6" height="18" rx="1" fill="#c9a24a"/><rect x="108" y="2" width="12" height="18" rx="4" fill="#6d0809"/></svg>`;
  function finale() {
    const chart = $("[data-bn-giants]");
    const stage = $("[data-bn-stage]", chart || document);
    if (!chart || !stage) return;
    const sec = chart.closest("section");
    const wall = $(".bn-wall", sec);
    const CROPPED = ["berries", "slice", "strawslice", "tiramisu", "meringue"];
    const whole = (c) => (M().cutout ? (c.cutout || !CROPPED.includes(c.img) ? M().cutout(c) : "") : "");
    const pool = (M().cakes || []).filter((c) => whole(c));
    const tiered = (c) => (c.tags || []).includes("ярусні");
    const top = pool.find(tiered);
    const big = [...pool.filter((c) => c !== top && !tiered(c)).slice(0, top ? 2 : 3), top].filter(Boolean);
    const S = M().sizes || [];
    const sizes = [S[0], S[Math.floor((S.length - 1) / 2)], S[S.length - (top ? 1 : 2)]];
    const steps = [{ kg: "бенто", who: "на двох" }, ...big.map((c, i) => ({ cake: c, kg: sizes[i] ? sizes[i].label : "", who: sizes[i] ? sizes[i].serves : "" }))];
    const N = steps.length;

    stage.innerHTML = `
      <div class="bn-marks">${steps.map((s, k) => `<span class="bn-mark" style="--k:${k}" aria-hidden="true"><b>${esc(GROW[k].what)}<small>${esc(s.kg)} · ${esc(s.who)}</small></b></span>`).join("")}</div>
      <span class="bn-level" aria-hidden="true"></span>
      <span class="bn-pencil" aria-hidden="true">${PENCIL}</span>
      <div class="bn-spot">
        ${steps.map((s, k) => k
          ? `<a class="bn-gcake" href="product.html?id=${encodeURIComponent(s.cake.id)}" aria-label="${esc(s.cake.name)}" tabindex="-1"><img src="${esc(whole(s.cake))}" alt="" draggable="false"></a>`
          : `<span class="bn-gcake bn-gcake--bento" aria-hidden="true"><span class="bn-tiny__hop" data-bn-tiny></span></span>`).join("")}
        <span class="bn-say" aria-hidden="true"><span></span></span>
        <span class="bn-puff" aria-hidden="true"></span>
      </div>
      <span class="bn-scrollme bn-hand" aria-hidden="true">гортайте — він росте ↓</span>`;
    const tiny = box({ text: "Я теж торт!", color: "powder", font: "hand", decor: "complex" }, { open: 112, tilt: 58, side: true, cls: "fb--tiny" });
    $("[data-bn-tiny]", stage).append(tiny.el);

    // party bunting across the top of the wall: two swags, the flags swing a little
    const flags = document.createElement("div");
    flags.className = "bn-bunting";
    flags.setAttribute("aria-hidden", "true");
    wall.prepend(flags);
    const bunting = () => {
      const W = wall.clientWidth, sag = W < 600 ? 56 : Math.min(80, W * 0.09), step = W < 600 ? 30 : 46, fw = step * 0.72, fh = fw * 1.25;
      const COLS = ["#f5bcc8", "#dbefed", "#fbe6b8", "#6d0809", "#fffaf3", "#e2849a"];
      let path = "", tri = "", n = 0;
      [[0, W / 2], [W / 2, W]].forEach(([x0, x1]) => {
        const cx = (x0 + x1) / 2, cy = sag * 2;
        path += `M${x0},0 Q${cx},${cy} ${x1},0 `;
        const cnt = Math.max(3, Math.floor((x1 - x0) / step));
        for (let i = 1; i < cnt; i++) {
          const t = i / cnt, u = 1 - t;
          const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = 2 * u * t * cy;
          const ang = (Math.atan2(2 * u * cy * 1 - 2 * t * cy, 2 * u * (cx - x0) + 2 * t * (x1 - cx)) * 180) / Math.PI;
          tri += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})"><path class="bn-flag" style="--d:${((n++ % 7) * 0.23).toFixed(2)}s" d="M${-fw / 2},0 L${fw / 2},0 L0,${fh} Z" fill="${COLS[n % COLS.length]}"/></g>`;
        }
      });
      flags.innerHTML = `<svg width="${W}" height="${sag + fh + 10}" viewBox="0 -2 ${W} ${sag + fh + 10}"><path d="${path}" fill="none" stroke="rgba(109,8,9,.55)" stroke-width="1.5"/>${tri}</svg>`;
    };
    bunting();
    const items = $$(".bn-gcake", stage), marks = $$(".bn-mark", stage);
    const level = $(".bn-level", stage), pencil = $(".bn-pencil", stage), say = $(".bn-say", stage), sayText = $(".bn-say span", stage);
    const spot = $(".bn-spot", stage), puff = $(".bn-puff", stage);

    // every one stands as tall as its rung — or less, if a wide cake has to keep within the wall;
    // then the ones before it give way, so the rungs always climb and the notes never sit on each other
    const RUNG = [0.26, 0.5, 0.72, 0.96].slice(-N);
    RUNG[0] = 0.26;
    let H = [];
    const layout = () => {
      // on a narrow wall the cakes run out of width before height: then the chart comes down to the tallest one
      stage.style.height = "";
      const narrow = stage.clientWidth < 520, w = stage.clientWidth * (narrow ? 0.86 : 0.72);
      const ar = items.map((it) => { const im = $("img", it); return im && im.naturalWidth ? im.naturalWidth / im.naturalHeight : 1; });
      let h = stage.clientHeight;
      const tall = N > 1 ? Math.min(h * RUNG[N - 1], w / ar[N - 1]) : h;
      if (N > 1 && tall < h * RUNG[N - 1] * 0.9) { h = Math.max(220, tall / RUNG[N - 1]); stage.style.height = h.toFixed(0) + "px"; }
      const gap = Math.max(46, h * 0.12);
      H = items.map((it, k) => (k ? Math.min(h * RUNG[k], w / ar[k]) : h * RUNG[0]));
      for (let k = N - 2; k >= 0; k--) H[k] = Math.min(H[k], H[k + 1] - gap);
      items.forEach((it, k) => (k ? ($("img", it).style.height = H[k].toFixed(1) + "px") : it.style.setProperty("--s", (H[0] / 1.7).toFixed(1) + "px")));
      marks.forEach((m, k) => m.style.setProperty("--y", H[k].toFixed(1) + "px"));
      paint();
    };

    // p in 0..1 → which cake stands and how far it has grown towards the next rung
    let cur = -1, p = 0;
    const REST = 0.34; // a share of every step the cake just stands there, before growing on
    const at = (p) => {
      const x = p * (N - 1) * (1 + 0.2) - 0.1;
      const k = clamp(Math.floor(x), 0, N - 1);
      const t = k >= N - 1 ? 0 : clamp((x - k - REST) / (1 - REST), 0, 1);
      return [k, t];
    };
    const sprinkle = () => {
      if (reduce) return;
      const cols = ["#f5bcc8", "#dbefed", "#fbe6b8", "#6d0809", "#e2849a"];
      for (let i = 0; i < 14; i++) {
        const b = document.createElement("i");
        const a = -Math.PI * (0.1 + 0.8 * Math.random()), d = 50 + Math.random() * 90;
        b.style.cssText = `--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d).toFixed(0)}px;--r:${(Math.random() * 360).toFixed(0)}deg;background:${cols[i % cols.length]}`;
        puff.appendChild(b);
        setTimeout(() => b.remove(), 900);
      }
    };
    const paint = () => {
      if (!H.length) return;
      const [k, t] = at(p);
      const e = ease.inOut(t);
      const h = k < N - 1 ? H[k] + (H[k + 1] - H[k]) * e : H[k];
      if (k !== cur) {
        const up = k > cur && cur >= 0;
        items.forEach((it, i) => it.classList.toggle("is-on", i === k));
        items.forEach((it) => it.setAttribute("tabindex", "-1"));
        if (items[k].tagName === "A") items[k].removeAttribute("tabindex");
        marks.forEach((m, i) => m.classList.toggle("is-on", i <= k));
        sayText.textContent = GROW[k].say;
        if (up) {
          items[k].classList.remove("is-pop"); void items[k].offsetWidth; items[k].classList.add("is-pop");
          say.classList.remove("is-pop"); void say.offsetWidth; say.classList.add("is-pop");
          pencil.classList.remove("is-draw"); void pencil.offsetWidth; pencil.classList.add("is-draw");
          sprinkle();
        }
        cur = k;
      }
      // the one standing swells (with a little wobble, as if holding its breath) right up to the next rung
      const s = h / H[k], wob = t > 0 && t < 1 ? Math.sin(t * Math.PI * 6) * 0.025 * (1 - t) : 0;
      items[k].style.scale = `${(s * (1 - wob)).toFixed(4)} ${(s * (1 + wob)).toFixed(4)}`;
      items.forEach((it, i) => { if (i !== k) it.style.scale = ""; });
      stage.style.setProperty("--h", h.toFixed(1) + "px");
      sec.classList.toggle("is-growing", t > 0 && t < 1);
      sec.classList.toggle("is-started", p > 0.04);
    };

    const imgs = $$("img", stage);
    imgs.forEach((im) => (im.complete ? 0 : im.addEventListener("load", layout, { once: true })));
    let rz;
    addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { layout(); bunting(); }, 120); });

    // «більший» swells as the section scrolls up
    const grow = $("[data-bn-grow]", sec);
    if (grow && !reduce && window.gsap && window.ScrollTrigger) {
      gsap.fromTo(grow, { fontSize: "0.5em" }, { fontSize: "1.08em", ease: "none", scrollTrigger: { trigger: sec, start: "top 90%", end: "top 15%", scrub: 0.6 } });
    }
    // without scroll animation it is all grown up already, every mark on the wall
    if (reduce || !window.gsap || !window.ScrollTrigger) { p = 1; layout(); sec.classList.add("is-in", "is-static"); return; }
    layout();
    sec.classList.add("is-js");
    whenSeen(stage, () => sec.classList.add("is-in"));
    const st = { p: 0 };
    gsap.to(st, {
      p: 1, ease: "none",
      onUpdate: () => { p = st.p; paint(); },
      scrollTrigger: { trigger: wall, start: "top top", end: () => "+=" + Math.round(innerHeight * 1.5), pin: wall, scrub: 0.5, anticipatePin: 1 },
    });
  }

  /* ───────── ⑥ the love stamp: two thumbprints — yours and ours — pressed into a heart; the heart opens the catalogue ───────── */
  // a whorl: wobbly loops round a core, broken into ridges; the print is faded at the edge by a mask
  const FP = { rx: 64, ry: 104 };
  function thumbprint(seed) {
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const out = [];
    for (let k = 0, r = 4; r < 132; k++, r += 6.4) {
      const p1 = rnd() * 6.28, p2 = rnd() * 6.28, sq = 0.84 + rnd() * 0.06;
      const at = (t) => {
        const w = 1 + (0.045 * Math.sin(3 * t + p1) + 0.025 * Math.sin(5 * t + p2)) * Math.min(1, r / 30);
        return [r * sq * Math.cos(t) * w, -16 + r * 1.06 * Math.sin(t) * w];
      };
      // where the ridge breaks: the core opens at the bottom like a loop, outer rings break once or twice
      const breaks = r < 14 ? [[Math.PI / 2, 1.5]] : [...Array(1 + (rnd() < 0.55) + (rnd() < 0.2))].map(() => [rnd() * 6.28, 7 / r + rnd() * 9 / r]);
      breaks.sort((a, b) => a[0] - b[0]);
      const t0 = breaks[0][0] + breaks[0][1] / 2;
      const runs = breaks.map((b, i) => {
        const end = (breaks[i + 1] ? breaks[i + 1][0] : breaks[0][0] + 6.283) - (breaks[i + 1] || breaks[0])[1] / 2;
        return [i ? b[0] + b[1] / 2 : t0, end];
      });
      runs.forEach(([a, b]) => {
        if (b - a < 0.15) return;
        const n = Math.max(6, Math.round((b - a) * r / 4.5));
        const pts = [...Array(n + 1)].map((_, j) => at(a + ((b - a) * j) / n).map((v) => v.toFixed(1)).join(","));
        out.push(`<path d="M${pts.join("L")}" pathLength="1" style="--k:${k}"/>`);
      });
    }
    return out.join("");
  }

  function love() {
    const a = $("[data-bn-love]");
    if (!a) return;
    const half = (side, seed) => `<span class="bn-love__p bn-love__p--${side}" aria-hidden="true"><svg viewBox="-145 -118 290 206">
      <g transform="translate(${side === "l" ? -46 : 46} -14) rotate(${side === "l" ? -42 : 42})"><g mask="url(#bn-fp-mask)" class="bn-fp">${thumbprint(seed)}</g></g></svg></span>`;
    a.innerHTML = `<svg class="bn-defs" aria-hidden="true"><defs>
        <radialGradient id="bn-fp-fade"><stop offset="0.8" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
        <mask id="bn-fp-mask" maskUnits="userSpaceOnUse" x="-110" y="-130" width="220" height="260"><ellipse rx="${FP.rx}" ry="${FP.ry}" fill="url(#bn-fp-fade)"/></mask>
      </defs></svg>
      <span class="bn-love__beat">${half("l", 4243)}${half("r", 917)}
        <span class="bn-love__tag"><b>Обрати</b><em>свій торт</em><i aria-hidden="true">→</i></span>
      </span>
      <span class="bn-love__note bn-love__note--l bn-hand" aria-hidden="true">ваш<svg viewBox="0 0 60 40" fill="none"><path d="M6,6 C20,8 36,18 48,34" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M38,32 L49,35 L50,23" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="bn-love__note bn-love__note--r bn-hand" aria-hidden="true">наш<svg viewBox="0 0 60 40" fill="none"><path d="M54,6 C40,8 24,18 12,34" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M22,32 L11,35 L10,23" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="bn-love__fx" aria-hidden="true"></span>`;

    // a little burst of hearts from (x, y) inside the stamp
    const fx = $(".bn-love__fx", a);
    const burst = (x, y, n = 9) => {
      if (reduce) return;
      for (let i = 0; i < n; i++) {
        const h = document.createElement("i");
        const ang = (i / n) * 6.283 + Math.random() * 0.5;
        const d = 60 + Math.random() * 70;
        h.textContent = "♥";
        h.style.cssText = `left:${x}px;top:${y}px;--x:${(Math.cos(ang) * d).toFixed(0)}px;--y:${(Math.sin(ang) * d - 30).toFixed(0)}px;--r:${(Math.random() * 60 - 30).toFixed(0)}deg;--s:${(0.6 + Math.random() * 0.8).toFixed(2)};color:${["#f5bcc8", "#dbefed", "#fff", "#e2849a"][i % 4]}`;
        fx.appendChild(h);
        setTimeout(() => h.remove(), 1100);
      }
      const ring = document.createElement("b");
      ring.style.cssText = `left:${x}px;top:${y}px`;
      fx.appendChild(ring);
      setTimeout(() => ring.remove(), 900);
    };
    const mid = () => [a.clientWidth / 2, a.clientHeight * 0.6];

    // the prints lean after the pointer
    if (fine && !reduce) {
      a.addEventListener("pointermove", (e) => {
        const r = a.getBoundingClientRect();
        a.style.setProperty("--mx", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
        a.style.setProperty("--my", (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
      });
      a.addEventListener("pointerleave", () => { a.style.setProperty("--mx", 0); a.style.setProperty("--my", 0); });
    }
    // press: both prints squeeze together, hearts fly, then off to the catalogue
    a.addEventListener("click", (e) => {
      if (reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      if (a.classList.contains("is-pressed")) return;
      const r = a.getBoundingClientRect();
      a.classList.add("is-pressed");
      burst(e.clientX ? e.clientX - r.left : mid()[0], e.clientY ? e.clientY - r.top : mid()[1], 14);
      setTimeout(() => { location.href = a.href; }, 720);
    });
    addEventListener("pageshow", () => a.classList.remove("is-pressed"));

    if (reduce || !("IntersectionObserver" in window)) { a.classList.add("is-in"); return; }
    a.classList.add("is-js");
    new IntersectionObserver((es, io) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      a.classList.add("is-in");
      setTimeout(() => burst(...mid(), 10), 820); // the moment the two prints touch
      setTimeout(() => a.classList.add("is-done"), 2200); // so a hover doesn't replay the intro
      io.disconnect();
    }), { threshold: 0.15 }).observe(a);
  }

  MARIDAY.onReady(() => {
    if (!M()) return;
    defs();
    headings();
    hero();
    wordsSection();
    studio();
    why();
    finale();
    love();
  });
})();
