/* Mariday — the flavour map (pages/flavors.html, css/flavors.css). From the glaze on top to the board at the bottom:
   ① the top: cherry glaze, the title in pink sugar; every filling's real cake peeks over the piped cream edge —
     they pop up on arrival and sink back behind the cream as you scroll in; touch one to fly to its place on the map
   ② the island: a cream island in a mint sea, every filling is a place on it (its land comes from its mood) with its
     real cake standing there; the stage stays on screen while you scroll — the camera drops from the whole island
     onto the road, a cherry rolls from cake to cake, each cake jumps up as it arrives and its passport slides out;
     at the end the camera rises again over the whole road. The legend lights up the places of one mood
   ③ the pastry ring: every answer drops a layer into a ring on a gold board, the last one glazes the top,
     a cherry lands, the ring lifts and the real cake of your filling stands in its place
   ④ the gift box: the lid lifts as it scrolls in, a little cake pops up in every paper cup; «Замовити сет» puts the lid
     back on and sends the box to the cart
   ⑤ the board: the filling you found stands here as a real cake next to the button that builds it
   Works without GSAP; with reduced motion everything is simply shown. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const M = () => window.MARIDAY;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const live = !!(window.gsap && window.ScrollTrigger) && !reduce;
  const esc = (s) => window.escapeHTML(s);
  const motion = () => window.MaridayMotion || { reveal() {}, refresh() {}, burst() {}, live: false };

  const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many);
  // colours come from the admin panel: only plain #hex ones go into the styles
  const hex = (c, d = "#f5bcc8") => (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || "").trim()) ? String(c).trim() : d);
  const meta = (id) => {
    const m = M().flavorMeta[id] || { img: "slice", tone: "#f5bcc8", layers: ["#f0dca0", "#f7efe6", "#c2263f"], moods: [], sweet: 3, sour: 3 };
    return { ...m, tone: hex(m.tone), layers: (m.layers && m.layers.length ? m.layers : ["#f0dca0", "#f7efe6", "#c2263f"]).map((c) => hex(c, "#f7efe6")), moods: m.moods || [], sweet: +m.sweet || 0, sour: +m.sour || 0 };
  };
  const ctorHref = (id) => `constructor.html?flavor=${encodeURIComponent(id)}&step=1`;
  const scrollToEl = (el, offset = -110) => {
    if (window.MaridayLenis) MaridayLenis.scrollTo(el, { offset, duration: 1.2 });
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  /* ───────── colours: a tint of the filling for its layer, a deep shade for the cut edge of the letters ───────── */
  const rgb = (h) => {
    let s = h.slice(1);
    if (s.length === 3) s = [...s].map((c) => c + c).join("");
    const n = parseInt(s, 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  const mix = (a, b, t) => {
    const A = rgb(a), B = rgb(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  };
  const lum = (h) => { const [r, g, b] = rgb(h); return (r * 0.299 + g * 0.587 + b * 0.114) / 255; };
  const CREAM = "#fff8f0";
  // the letters of a name are filled with the filling's layers, bottom (sponge) to top, a line of cream between them
  const stripes = (layers) => {
    const w = layers.map((_, i) => (i === 0 ? 1.3 : 1));
    const sep = 0.16;
    const total = w.reduce((a, b) => a + b, 0) + sep * (layers.length - 1);
    let at = 0;
    const stops = [];
    layers.forEach((c, i) => {
      const a = (at / total) * 100;
      at += w[i];
      const b = (at / total) * 100;
      stops.push(`${c} ${a.toFixed(1)}% ${b.toFixed(1)}%`);
      if (i < layers.length - 1) {
        const s = ((at + sep) / total) * 100;
        stops.push(`${CREAM} ${b.toFixed(1)}% ${s.toFixed(1)}%`);
        at += sep;
      }
    });
    return `linear-gradient(to top, ${stops.join(", ")})`;
  };
  const deepOf = (m) => {
    const dark = [...m.layers, m.tone].sort((a, b) => lum(a) - lum(b))[0];
    return mix(lum(dark) < 0.35 ? dark : m.tone, "#2a0605", lum(dark) < 0.35 ? 0.35 : 0.62);
  };
  const MOOD_C = { choc: "#4a2418", berry: "#c2263f", nut: "#c79a6b", light: "#fff8f0", caramel: "#c27a2c" };
  const moodLabel = (id) => (M().moods.find((x) => x.id === id) || {}).label || id;

  /* ───────── every filling has its own real cake: a cut-out that looks like it ───────── */
  const CAKE_OF = {
    "pistachio-raspberry": "gl-slice", snickers: "gl-drip", "berry-forest": "gl-berries", "banana-caramel": "gl-gold",
    "cherry-duo-choc": "gl-forest", "vanilla-berry": "gl-strawslice", kinder: "gl-piping", "lemon-raspberry": "gl-fraisier", plombir: "ds-blackoreo",
  };
  const POOL = ["gl-roses", "gl-lilac", "gl-meringue", "gl-tiramisu", "ds-choccup", "ds-redvelvet", "gl-pink", "ds-cupcake", "ds-mint"];
  // some cut-outs end where their photo ended: those edges are faded out instead of showing a straight cut
  const EDGE = { "gl-slice": "r b", "gl-berries": "l b", "ds-blackoreo": "l", "gl-gold": "l", "gl-tiramisu": "r", "ds-redvelvet": "b" };
  const nameOf = (f, k) => CAKE_OF[f.id] || POOL[k % POOL.length];
  const cakeOf = (f, k) => `${M().root}img/cutouts/${nameOf(f, k)}.webp`;
  const imgOf = (f, k, extra = "") => {
    const e = EDGE[nameOf(f, k)];
    return `<img src="${esc(cakeOf(f, k))}" alt="" draggable="false"${e ? ` data-edge="${e}"` : ""}${extra}>`;
  };
  const cakes = () => M().flavors.map((f, k) => ({ f, src: cakeOf(f, k), k }));

  /* ───────── the filling the visitor found: the board at the end shows its cake ───────── */
  let chosen = null;
  let mapApi = null;
  const choose = (f, from) => {
    if (!f) return;
    const changed = !chosen || chosen.id !== f.id;
    chosen = f;
    const pick = $("[data-fl-pick]");
    const go = $("[data-fl-go]");
    if (pick) pick.textContent = `ваш смак — ${f.name} ♥`;
    if (go) go.href = ctorHref(f.id);
    if (changed) endCake(f);
    if (from) note(from, "♥ запам’ятали — чекає внизу");
  };
  // a little hand-written note pops up over what was touched and floats away
  function note(el, text) {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    const n = document.createElement("span");
    n.className = "fl-note";
    n.textContent = text;
    n.style.left = `${r.left + r.width / 2}px`;
    n.style.top = `${r.top + Math.min(r.height * 0.25, 80)}px`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 1700);
  }

  /* ───────── glazed section headings, letters drop in when the heading comes into view ───────── */
  function splitInto(el, text) {
    el.textContent = "";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "fl-ch";
      s.style.setProperty("--i", i);
      s.style.setProperty("--cr", `${i % 2 ? 12 : -12}deg`);
      s.textContent = ch === " " ? "\u00a0" : ch;
      el.appendChild(s);
    });
  }
  // things that play when they come into view: headings, layers, the box
  const onSeen = (el, fn, margin = "0px 0px -12% 0px") => {
    if (reduce || !("IntersectionObserver" in window)) { fn(el); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      fn(e.target);
      io.unobserve(e.target);
    }), { rootMargin: margin });
    io.observe(el);
  };
  function headings() {
    const hs = $$(".fl-h2");
    hs.forEach((h) => { const w = $("[data-fl-split]", h); if (w) splitInto(w, w.textContent); });
    if (!reduce) document.body.classList.add("fl-js");
    hs.forEach((h) => onSeen(h, (t) => t.classList.add("is-in"), "0px 0px -6% 0px"));
  }

  /* ───────── ① the top of the cake ───────── */
  function top() {
    const sec = $("[data-fl-top]");
    const row = $("[data-fl-row]");
    if (!sec || !row) return;
    // the sticky header sits over the glaze, so the glaze runs up behind it
    const hdr = $("#site-header");
    const fit = () => document.documentElement.style.setProperty("--fl-hdr", `${hdr ? hdr.offsetHeight : 0}px`);
    fit();
    if (hdr && "ResizeObserver" in window) new ResizeObserver(fit).observe(hdr);
    // Safari paints its status bar with the body colour: cherry while the glaze is up there
    const edge = () => document.body.classList.toggle("is-edge-dark", scrollY < 2);
    addEventListener("scroll", edge, { passive: true });
    edge();

    const list = cakes();
    const mid = (list.length - 1) / 2;
    row.innerHTML = list.map(({ f, src, k }) => {
      const d = Math.abs(k - mid) / Math.max(1, mid); // 0 in the middle, 1 at the ends
      return `<a class="fl-peek${Math.abs(k - mid) > 2 ? " is-far" : ""}" href="#karta" data-k="${k}" style="--d:${d.toFixed(3)};--k:${k};--z:${list.length - Math.round(Math.abs(k - mid) * 2)}" aria-label="${esc(f.name)} — на карті">
        <span class="fl-peek__cake"><img src="${esc(src)}" alt="" draggable="false"></span>
        <span class="fl-peek__flag" aria-hidden="true"><i></i><b>${esc(f.name)}</b></span>
      </a>`;
    }).join("");
    const peeks = $$(".fl-peek", row);
    // touching a cake sends you down to its place on the map
    row.addEventListener("click", (e) => {
      const a = e.target.closest(".fl-peek");
      if (!a || !mapApi) return;
      e.preventDefault();
      e.stopPropagation(); // the site's own anchor scrolling would take it to the top of the map instead
      mapApi.go(+a.dataset.k);
    });

    if (!live) return;
    // they pop up over the cream from the middle out, then breathe; on the way down they sink back behind it
    const cakesIn = peeks.map((p) => $(".fl-peek__cake", p));
    gsap.fromTo(cakesIn, { yPercent: 105 }, { yPercent: 0, duration: 0.85, ease: "back.out(1.5)", delay: 0.15, stagger: { each: 0.06, from: "center" } });
    gsap.to(row, { yPercent: 38, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: 0.4 } });
    // the light on the glaze follows the pointer
    if (fine) {
      const glaze = $(".fl-top__glaze", sec);
      sec.addEventListener("pointermove", (e) => {
        const r = sec.getBoundingClientRect();
        glaze.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        glaze.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      });
    }
  }

  /* ───────── ② the island: every filling is a place on the map, the cherry rolls from cake to cake ───────── */
  // each mood is a kind of land; a place takes the first mood of its filling, the next place of the same land gets the next name
  const PLACES = {
    choc: ["Шоколадні гори", "Какао-перевал", "Брауні-плато"],
    berry: ["Ягідна долина", "Малинові пагорби", "Вишневий гай"],
    nut: ["Горіховий гай", "Фісташкова бухта", "Арахісовий мис"],
    caramel: ["Карамельні дюни", "Ірисковий берег", "Медова коса"],
    light: ["Вершкові хмари", "Ванільна затока", "Пломбірні поля"],
  };
  const LAND = { choc: "#ecd3c3", berry: "#fbd3db", nut: "#e6e2bf", caramel: "#f8deaa", light: "#ffffff" };
  const landOf = (f) => meta(f.id).moods.find((m) => PLACES[m]) || "light";
  // a little prop of each land, drawn around its cake (the cakes themselves are always real photos)
  const PROP = {
    choc: (s) => `<g transform="scale(${s})"><path d="M-96 0C-66-38-34-118 0-132 34-118 66-38 96 0Z" fill="#5a2c1c"/><path d="M-96 0C-66-38-34-118 0-132-18-108-38-40-46 0Z" fill="#3e1c14" opacity=".45"/><path d="M-40-90C-26-114-12-128 0-132 12-128 26-114 40-90 34-80 30-60 22-76 16-58 9-56 3-74-3-50-12-56-15-74-22-60-32-66-40-90Z" fill="#fff8f0"/><circle cx="-12" cy="-118" r="5" fill="#fff"/></g>`,
    berry: (s) => `<g transform="scale(${s})"><circle cx="-34" cy="-34" r="38" fill="#6f9c4f"/><circle cx="30" cy="-38" r="42" fill="#7fae5a"/><circle cx="-2" cy="-66" r="38" fill="#8fc067"/><g fill="#c2263f"><circle cx="-40" cy="-44" r="10"/><circle cx="20" cy="-56" r="10"/><circle cx="44" cy="-26" r="9"/><circle cx="-8" cy="-84" r="9"/><circle cx="-14" cy="-26" r="8"/></g><g fill="#fff" opacity=".7"><circle cx="-43" cy="-47" r="3"/><circle cx="17" cy="-59" r="3"/><circle cx="-11" cy="-87" r="3"/></g></g>`,
    nut: (s) => `<g transform="scale(${s})"><rect x="-9" y="-70" width="18" height="70" rx="6" fill="#8a5a3a"/><circle cx="0" cy="-108" r="56" fill="#9fbf6e"/><circle cx="-22" cy="-124" r="30" fill="#b9cf8f"/><g transform="translate(46 -8)"><ellipse rx="17" ry="14" fill="#c79a6b"/><path d="M-17-3C-12-18 12-18 17-3Z" fill="#7a4f2a"/></g><g transform="translate(-50 -4) rotate(-20)"><ellipse rx="14" ry="12" fill="#c79a6b"/><path d="M-14-3C-10-15 10-15 14-3Z" fill="#7a4f2a"/></g></g>`,
    caramel: (s) => `<g transform="scale(${s})"><path d="M-130 0Q-70-84 0-46Q66-104 130 0Z" fill="#e0a54f"/><path d="M-96-26Q-58-62-12-44M28-56Q66-80 100-28" fill="none" stroke="#fff3d6" stroke-width="9" stroke-linecap="round"/><path d="M-130 0Q-70-84 0-46Q-60-50-84 0Z" fill="#b8792c" opacity=".4"/></g>`,
    light: (s) => `<g transform="scale(${s})"><ellipse cx="0" cy="6" rx="96" ry="14" fill="#9fc9c5" opacity=".35"/><circle cx="-48" cy="-30" r="36" fill="#fff"/><circle cx="4" cy="-52" r="48" fill="#fff"/><circle cx="54" cy="-26" r="34" fill="#fff"/><rect x="-82" y="-32" width="168" height="34" rx="17" fill="#fff"/><circle cx="-10" cy="-70" r="12" fill="#f3fbfa"/></g>`,
  };
  // where the props stand around a cake: at its sides and a little behind it
  const PROPS_AT = [[-250, -10, 0.95], [240, -40, 0.8], [-170, -250, 0.62], [190, -270, 0.68]];

  // a smooth line through the points (Catmull–Rom as cubic Béziers); closed for the island's coast
  const smooth = (pts, closed) => {
    const P = (i) => pts[closed ? (i + pts.length) % pts.length : Math.max(0, Math.min(pts.length - 1, i))];
    const n = closed ? pts.length : pts.length - 1;
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += `C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d + (closed ? "Z" : "");
  };
  const wob = (k, a) => Math.sin(k * 12.9898 + a * 78.233) * 0.5; // a steady wobble, the same on every visit
  const blob = (x, y, r, k) => smooth(Array.from({ length: 12 }, (_, i) => {
    const t = (i / 12) * Math.PI * 2;
    const rr = r * (1 + 0.16 * Math.sin(3 * t + k) + 0.08 * Math.sin(5 * t + k * 2));
    return { x: x + Math.cos(t) * rr, y: y + Math.sin(t) * rr * 0.78 };
  }), true);

  // the places and the road between them: rows that snake across a wide screen, a zigzag down a tall one
  function plan(n, tall) {
    let pts = [];
    const turns = [];
    if (tall) {
      for (let k = 0; k < n; k++) pts.push({ x: (k % 2 ? 1000 : 420) + wob(k, 1) * 70, y: k * 330 + wob(k, 2) * 40 });
    } else {
      const rows = n <= 4 ? 1 : n <= 8 ? 2 : 3;
      const cols = Math.ceil(n / rows);
      for (let k = 0; k < n; k++) {
        const r = Math.floor(k / cols), c = k % cols, cc = r % 2 ? cols - 1 - c : c;
        pts.push({ x: cc * 720 + wob(k, 1) * 90, y: r * 640 + (c % 2 ? 70 : -30) + wob(k, 2) * 50 });
        // at the end of a row the road swings out in a wide U and comes back on the next one
        if (c === cols - 1 && k < n - 1) turns.push({ after: k, x: cc * 720 + (r % 2 ? -330 : 330), y: r * 640 + 340 });
      }
    }
    const a = pts[0], b = pts[1] || { x: a.x + 400, y: a.y };
    const z = pts[n - 1], y = pts[n - 2] || { x: z.x - 400, y: z.y };
    const out = (p, q, len) => { const dx = p.x - q.x, dy = p.y - q.y, l = Math.hypot(dx, dy) || 1; return { x: p.x + (dx / l) * len, y: p.y + (dy / l) * len }; };
    const start = tall ? { x: a.x + 30, y: a.y - 330 } : out(a, b, 360);
    const end = tall ? { x: z.x + (n % 2 ? 260 : -260), y: z.y + 300 } : out(z, y, 360);
    const road = [start];
    pts.forEach((p, k) => { road.push(p); turns.filter((t) => t.after === k).forEach((t) => road.push(t)); });
    road.push(end);
    // everything is moved so the island sits in the middle of a margin of sea
    const all = [...road];
    const minX = Math.min(...all.map((p) => p.x)), maxX = Math.max(...all.map((p) => p.x));
    const minY = Math.min(...all.map((p) => p.y)), maxY = Math.max(...all.map((p) => p.y));
    const padX = 330, padTop = 380, padBot = 300, sea = 260;
    const dx = sea + padX - minX, dy = sea + padTop - minY;
    const mv = (p) => ({ ...p, x: p.x + dx, y: p.y + dy });
    pts = pts.map(mv);
    const W = maxX - minX + 2 * (padX + sea), H = maxY - minY + padTop + padBot + 2 * sea;
    // the coast: a rounded square with a gently wavy edge
    const cx = W / 2, cy = (sea + padTop - 60 + H - sea - padBot + 80) / 2;
    const rx = W / 2 - sea + 10, ry = (H - 2 * sea) / 2 + 20;
    const coast = Array.from({ length: 44 }, (_, i) => {
      const t = (i / 44) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      const f = 1 + 0.035 * Math.sin(3 * t + 1) + 0.03 * Math.sin(7 * t) + 0.018 * Math.sin(11 * t + 2);
      return { x: cx + rx * Math.sign(c) * Math.abs(c) ** 0.55 * f, y: cy + ry * Math.sign(s) * Math.abs(s) ** 0.55 * f };
    });
    return { W, H, pts, road: road.map(mv), start: mv(start), end: mv(end), coast: smooth(coast, true), sea };
  }

  function map() {
    const sec = $("[data-fl-map]");
    if (!sec) return null;
    const view = $("[data-fl-view]", sec);
    const world = $("[data-fl-world]", sec);
    const land = $("[data-fl-land]", sec);
    const pinsEl = $("[data-fl-pins]", sec);
    const cherry = $("[data-fl-cherry]", sec);
    const label = $("[data-fl-label]", sec);
    const legend = $("[data-fl-legend]", sec);
    const pass = $("[data-fl-pass]", sec);
    const flavors = M().flavors;
    const n = flavors.length;
    const count = $("[data-fl-count]", sec);
    if (count) count.textContent = `${n} ${plural(n, "начинка", "начинки", "начинок")} · гортайте — вишня проведе дорогою`;

    // every place gets its land and a name of its own
    const used = {};
    const places = flavors.map((f, k) => {
      const l = landOf(f);
      const name = PLACES[l][(used[l] = (used[l] ?? -1) + 1) % PLACES[l].length];
      return { f, k, land: l, name, m: meta(f.id) };
    });

    let P = null; // the current plan
    let lens = []; // the length of the road at each place
    let total = 0;
    let samples = []; // points along the road every few units
    let mood = null;
    let sel = 0; // the place whose passport is out
    const STEP = 6;

    function build(tall) {
      P = plan(n, tall);
      const { W, H, sea } = P;
      world.style.width = `${W}px`;
      world.style.height = `${H}px`;
      land.setAttribute("viewBox", `0 0 ${W} ${H}`);
      land.setAttribute("width", W);
      land.setAttribute("height", H);
      const roadD = smooth(P.road, false);
      const sprinkle = ["#f5bcc8", "#c2263f", "#f0d54a", "#9fd3cd", "#c79a6b"];
      land.innerHTML = `
        <defs>
          <pattern id="fl-waves" width="220" height="130" patternUnits="userSpaceOnUse"><path d="M20 40q24-20 48 0t48 0M130 104q24-20 48 0t48 0" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="6" stroke-linecap="round"/></pattern>
          <pattern id="fl-spr" width="170" height="150" patternUnits="userSpaceOnUse">${[[20, 30, 20], [90, 70, -40], [140, 20, 70], [40, 115, 110], [120, 130, -10], [70, 10, 150]].map(([x, y, r], i) => `<rect x="${x}" y="${y}" width="18" height="6" rx="3" fill="${sprinkle[i % sprinkle.length]}" transform="rotate(${r} ${x + 9} ${y + 3})"/>`).join("")}</pattern>
        </defs>
        <rect x="${-W}" y="${-H}" width="${W * 3}" height="${H * 3}" fill="url(#fl-waves)"/>
        <path d="${P.coast}" fill="#b5dbd6" transform="translate(0 34)"/>
        <path d="${P.coast}" fill="#fff8f0"/>
        <path d="${P.coast}" fill="url(#fl-spr)" opacity=".55"/>
        ${places.map((p) => `<path class="fl-land" data-k="${p.k}" d="${blob(P.pts[p.k].x, P.pts[p.k].y - 70, tall ? 330 : 360, p.k)}" fill="${LAND[p.land]}"/>`).join("")}
        <path d="${P.coast}" fill="none" stroke="#f1d9c8" stroke-width="10"/>
        <path d="${P.coast}" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round" stroke-dasharray="0 46"/>
        <path d="${P.coast}" fill="none" stroke="#fff" stroke-width="14" stroke-opacity=".9"/>
        ${places.map((p) => {
          const { x, y } = P.pts[p.k];
          return `<g class="fl-props" data-k="${p.k}">${PROPS_AT.map(([ox, oy, s], j) => `<g transform="translate(${(x + ox + wob(p.k, j + 3) * 30).toFixed(0)} ${(y + oy).toFixed(0)})">${PROP[p.land](s)}</g>`).join("")}</g>`;
        }).join("")}
        <path d="${roadD}" fill="none" stroke="#e9cdbd" stroke-width="54" stroke-linecap="round" transform="translate(0 10)"/>
        <path d="${roadD}" fill="none" stroke="#fffdf9" stroke-width="54" stroke-linecap="round"/>
        <path d="${roadD}" fill="none" stroke="#f5bcc8" stroke-width="7" stroke-linecap="round" stroke-dasharray="20 26"/>
        <path class="fl-road__done" data-fl-done d="${roadD}" fill="none" stroke="#e0475e" stroke-width="16" stroke-linecap="round"/>
        ${places.map((p) => {
          const { x, y } = P.pts[p.k];
          return `<text class="fl-place" data-k="${p.k}" x="${x.toFixed(0)}" y="${(y + 135).toFixed(0)}" transform="rotate(${(wob(p.k, 9) * 6).toFixed(1)} ${x.toFixed(0)} ${(y + 135).toFixed(0)})">${esc(p.name)}</text>`;
        }).join("")}
        <text class="fl-place fl-place--sign" x="${P.start.x.toFixed(0)}" y="${(P.start.y - 70).toFixed(0)}">старт</text>
        <text class="fl-place fl-place--sign" x="${P.end.x.toFixed(0)}" y="${(P.end.y + 110).toFixed(0)}">далі — тест ↓</text>`;
      // real little cakes and cherries float in the sea around the island
      // at the sides only: whatever floats under the island would be cut off by the bottom of the screen at the end
      const sx = [sea * 0.45, W - sea * 0.5, sea * 0.5, W - sea * 0.45, W - sea * 0.4];
      const sy = [sea * 1.4, sea * 0.9, H * 0.72, H - sea * 1.6, H * 0.45];
      const floats = ["candy-mac", "cherries", "candy-mac", "ds-cupcake", "candy-mac"];
      pinsEl.innerHTML = places.map((p) => {
        const { x, y } = P.pts[p.k];
        return `<button type="button" class="fl-pin" data-k="${p.k}" data-land="${p.land}" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--k:${p.k}" aria-label="${esc(p.f.name)} — ${esc(p.name)}">
          <span class="fl-pin__ring" aria-hidden="true"></span>
          <span class="fl-pin__cake">${imgOf(p.f, p.k, ' loading="lazy"')}</span>
          <span class="fl-pin__spr" aria-hidden="true">${Array.from({ length: 8 }, (_, j) => `<i style="--a:${j * 45 + 10}deg;--c:${sprinkle[j % sprinkle.length]}"></i>`).join("")}</span>
          <span class="fl-pin__flag" aria-hidden="true"><i></i><b>${esc(p.f.name)}</b></span>
        </button>`;
      }).join("") + floats.map((img, j) => {
        const src = img === "cherries" ? `${M().root}img/cakes/cherries.png` : `${M().root}img/cutouts/${img}.webp`;
        return `<img class="fl-float" src="${src}" alt="" aria-hidden="true" loading="lazy" style="left:${sx[j].toFixed(0)}px;top:${sy[j].toFixed(0)}px;--k:${j}">`;
      }).join("");
      // the road is measured once: a table of points, and where each place sits on it
      const path = $("[data-fl-done]", land);
      total = path.getTotalLength();
      path.style.strokeDasharray = `${total} ${total}`;
      samples = [];
      for (let l = 0; l <= total; l += STEP) { const q = path.getPointAtLength(l); samples.push([q.x, q.y]); }
      let from = 0;
      lens = P.pts.map((p) => {
        let best = from, bd = Infinity;
        for (let i = from; i < samples.length; i++) {
          const d = (samples[i][0] - p.x) ** 2 + (samples[i][1] - p.y) ** 2;
          if (d < bd) { bd = d; best = i; }
          if (d > bd && bd < 400) break;
        }
        from = best;
        return best * STEP;
      });
      paintMood();
    }
    const at = (l) => {
      const i = Math.max(0, Math.min(samples.length - 2, Math.floor(l / STEP)));
      const t = Math.max(0, Math.min(1, l / STEP - i));
      const a = samples[i], b = samples[i + 1];
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, dx: b[0] - a[0], dy: b[1] - a[1] };
    };

    /* the passport of a place: the cake on a stamp, the name cut from its layers, what's inside */
    const cube = (on) => `<i class="${on ? "on" : ""}"></i>`;
    const card = (p) => {
      const { f, m } = p;
      const longest = Math.max(...f.name.split(/\s+/).flatMap((w) => w.split(/(?<=[–—-])/)).map((w) => [...w].length), 4);
      const style = [`--tone:${m.tone}`, `--bg:${mix(m.tone, CREAM, 0.84)}`, `--deep:${deepOf(m)}`, `--stripes:${stripes(m.layers)}`, `--L:${longest}`].join(";");
      const tags = m.moods.map((id) => `<span style="--c:${hex(MOOD_C[id], "#f5bcc8")}">${esc(moodLabel(id).toLowerCase())}</span>`).join("");
      return `<div class="fl-pass__card" style="${style}">
        <span class="fl-pass__stamp" aria-hidden="true">${imgOf(f, p.k)}</span>
        <p class="fl-hand fl-pass__place">${esc(p.name)}</p>
        <h3 class="fl-pass__name"><span>${esc(f.name)}</span></h3>
        ${tags ? `<p class="fl-tags">${tags}</p>` : ""}
        <p class="fl-pass__desc">${esc(f.desc || "")}</p>
        <div class="fl-meters">
          <span class="fl-meter"><em>солодкість</em><span class="fl-cubes" role="img" aria-label="солодкість: ${m.sweet} з 5">${[1, 2, 3, 4, 5].map((v) => cube(v <= m.sweet)).join("")}</span></span>
          <span class="fl-meter"><em>кислинка</em><span class="fl-lemons" role="img" aria-label="кислинка: ${m.sour} з 5">${[1, 2, 3, 4, 5].map((v) => cube(v <= m.sour)).join("")}</span></span>
        </div>
        <div class="fl-pass__row"><a class="p-btn fl-pass__go" href="${ctorHref(f.id)}"><span>Зібрати торт</span></a><button type="button" class="fl-pass__love" data-love>♥ <span>обрати</span></button></div>
      </div>`;
    };
    pass.innerHTML = `<div class="fl-pass__slot" data-fl-slot></div>
      <div class="fl-pass__nav">
        <button type="button" class="fl-pass__arrow" data-step="-1" aria-label="Попереднє місце">←</button>
        <span class="fl-pass__dots">${places.map((p) => `<button type="button" data-dot="${p.k}" style="--c:${hex(MOOD_C[p.land], "#f5bcc8")}" aria-label="${esc(p.f.name)}"></button>`).join("")}</span>
        <button type="button" class="fl-pass__arrow" data-step="1" aria-label="Наступне місце">→</button>
      </div>`;
    const slot = $("[data-fl-slot]", pass);
    let shown = -1;
    const show = (k) => {
      if (k === shown) return;
      const dir = k > shown ? 1 : -1;
      shown = k;
      const old = slot.firstElementChild;
      slot.insertAdjacentHTML("beforeend", card(places[k]));
      const nu = slot.lastElementChild;
      $$("[data-dot]", pass).forEach((d) => d.classList.toggle("is-on", +d.dataset.dot === k));
      $$(".fl-pin", pinsEl).forEach((pin) => pin.classList.toggle("is-sel", +pin.dataset.k === k));
      if (!live) { if (old) old.remove(); return; }
      if (old) {
        old.classList.add("is-leaving");
        gsap.to(old, { xPercent: -14 * dir, yPercent: -4, rotation: -5 * dir, opacity: 0, duration: 0.32, ease: "power2.in", onComplete: () => old.remove() });
      }
      gsap.fromTo(nu, { xPercent: 18 * dir, yPercent: 6, rotation: 5 * dir, opacity: 0 }, { xPercent: 0, yPercent: 0, rotation: -1.2, opacity: 1, duration: 0.6, ease: "back.out(1.6)", delay: old ? 0.12 : 0 });
      gsap.fromTo($(".fl-pass__stamp", nu), { scale: 0.3, rotation: -40 }, { scale: 1, rotation: 8, duration: 0.7, ease: "back.out(2.4)", delay: old ? 0.3 : 0.15 });
    };

    /* the legend: one land lights up, the others go quiet; the cherry is sent to the nearest place of that land */
    legend.innerHTML = `<p class="fl-hand fl-legend__t">легенда</p>` + M().moods.filter((m) => PLACES[m.id]).map((m) => `<button type="button" class="fl-mood" data-mood="${esc(m.id)}" aria-pressed="false"><i style="--c:${hex(MOOD_C[m.id], "#f5bcc8")}"></i>${esc(m.label)}</button>`).join("");
    const fits = (p) => !mood || p.m.moods.includes(mood);
    function paintMood() {
      $$("[data-mood]", legend).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mood === mood)));
      $$(".fl-pin", pinsEl).forEach((pin) => pin.classList.toggle("is-off", !fits(places[+pin.dataset.k])));
      $$("[data-dot]", pass).forEach((d) => d.classList.toggle("is-off", !fits(places[+d.dataset.dot])));
      $$("[data-k]", land).forEach((el) => el.classList.toggle("is-off", !fits(places[+el.dataset.k])));
    }

    /* the scroll: the island from above → down onto the road → place by place → up again to see the whole road */
    const A = 1.1, S = 0.78, B = 0.9; // screens for the way in, each place, the way out
    const T = A + Math.max(1, n - 1) * S + B;
    const a = A / T, b = B / T;
    const pAt = (k) => a + (n > 1 ? k / (n - 1) : 0) * (1 - a - b);
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
    const clamp = (v) => Math.max(0, Math.min(1, v));
    function stateAt(p) {
      if (p < a) {
        const t = p / a;
        const f = ease(clamp((t - 0.3) / 0.7));
        return { z: ease(clamp(t / 0.85)), d: f * lens[0], q: 0, move: Math.sin(Math.PI * f) };
      }
      if (p > 1 - b) {
        const t = (p - (1 - b)) / b;
        const f = ease(clamp(t / 0.7));
        return { z: 1 - ease(clamp((t - 0.15) / 0.85)), d: lens[n - 1] + f * (total - lens[n - 1]), q: n - 1, move: Math.sin(Math.PI * f) };
      }
      const tt = n > 1 ? ((p - a) / (1 - a - b)) * (n - 1) : 0;
      const seg = Math.min(n - 2, Math.floor(tt));
      if (seg < 0) return { z: 1, d: lens[0], q: 0, move: 0 };
      const f = ease(clamp((tt - seg - 0.2) / 0.6));
      return { z: 1, d: lens[seg] + f * (lens[seg + 1] - lens[seg]), q: seg + f, move: Math.sin(Math.PI * f) };
    }

    // the camera: from the whole island to the cherry, with the passport's side of the screen left free
    let V = { w: 0, h: 0, top: 0, tall: false, side: 0, under: 0 };
    function measure() {
      const tall = innerWidth < 900 || innerHeight > innerWidth * 1.15;
      const hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fl-hdr")) || 80;
      const r = view.getBoundingClientRect();
      if (!P || tall !== V.tall) build(tall);
      V = { w: r.width, h: r.height, top: Math.min(hdr + 10, r.height * 0.2), tall, side: tall ? 0 : pass.offsetWidth + 48, under: tall ? pass.offsetHeight + 16 : 0 };
      const legendH = tall ? 0 : 90;
      // a tall screen sees the island as wide as it is and flies over it; a wide one sees all of it at once
      V.s0 = tall ? (V.w - 14) / P.W : Math.min((V.w - 40) / P.W, (V.h - V.top - legendH) / P.H);
      V.s1 = tall ? Math.max(V.s0 * 1.6, Math.min(0.5, V.w / 820)) : Math.max(V.s0 * 1.7, Math.min(0.92, V.w / 1900));
    }
    let last = { k: -1, here: -1 };
    function render(p) {
      if (!P) return;
      const st = live ? stateAt(p) : { z: 0, d: total, q: sel, move: 0 };
      const { z, d, q, move } = st;
      const outro = live && p > 1 - b;
      const c = at(d);
      const s = V.s0 + (V.s1 - V.s0) * z;
      // the point that is looked at goes from the middle of the island to the cherry
      const ox = V.w / 2, oy = V.top + (V.h - V.top - (V.tall ? 50 : 70)) / 2;
      // from above, a tall screen shows the top of the island on the way in and its bottom on the way out
      let y0 = P.H / 2;
      if (V.tall && P.H * V.s0 > V.h - V.top) y0 = outro ? P.H - P.sea * 0.6 - (V.h - 20 - oy) / V.s0 : P.sea * 0.75 - (V.top + 70 - oy) / V.s0;
      const lx = P.W / 2 + (c.x - P.W / 2) * z, ly = y0 + (c.y - 60 - y0) * z;
      const fx = V.tall ? V.w / 2 : (V.w - V.side) * 0.5, fy = V.tall ? V.top + (V.h - V.top - V.under) * 0.62 : V.top + (V.h - V.top) * 0.6;
      const tx = ox + (fx - ox) * z - lx * s, ty = oy + (fy - oy) * z - ly * s;
      world.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
      world.style.setProperty("--z", z.toFixed(3));
      world.style.setProperty("--inv", (1 / s).toFixed(3));
      $("[data-fl-done]", land).style.strokeDashoffset = (total - d).toFixed(1);
      // the cherry leans the way the road turns, bounces as it rolls
      const lean = Math.max(-28, Math.min(28, (Math.atan2(c.dy, c.dx) * 180) / Math.PI * (c.dx < 0 ? -0.2 : 0.2)));
      const hop = -Math.abs(Math.sin(d / 46)) * 26 * move;
      cherry.style.transform = `translate(${c.x.toFixed(1)}px, ${(c.y + hop).toFixed(1)}px) rotate(${(lean + Math.sin(d / 30) * 7 * move).toFixed(1)}deg)`;
      cherry.style.opacity = live ? 1 : 0;
      // the map's label is there only at the start
      label.style.opacity = live ? (outro ? 0 : Math.max(0, 1 - z * 2.2)).toFixed(3) : 1;
      label.style.visibility = live && (outro || z > 0.48) ? "hidden" : "";
      sec.classList.toggle("is-near", z > 0.55);
      const k = Math.max(0, Math.min(n - 1, Math.round(q)));
      const here = live && z > 0.5 && Math.abs(q - k) < 0.22 ? k : -1;
      if (here !== last.here) {
        $$(".fl-pin", pinsEl).forEach((pin) => pin.classList.toggle("is-here", +pin.dataset.k === here));
        last.here = here;
      }
      if (live) $$(".fl-pin", pinsEl).forEach((pin) => pin.classList.toggle("is-past", +pin.dataset.k < q - 0.3));
      if (live && k !== last.k) { last.k = k; sel = k; show(k); }
    }

    // going to a place: the page scrolls to where the cherry stands at it
    let trig = null;
    const go = (k) => {
      k = Math.max(0, Math.min(n - 1, k));
      if (!live || !trig) { sel = k; show(k); render(0); return; }
      const y = trig.start + pAt(k) * (trig.end - trig.start) + 2;
      if (window.MaridayLenis) MaridayLenis.scrollTo(y, { duration: Math.min(2.4, 0.9 + Math.abs(k - sel) * 0.22) });
      else scrollTo({ top: y, behavior: "smooth" });
    };
    const nextFit = (from, dir) => {
      for (let i = from + dir; i >= 0 && i < n; i += dir) if (fits(places[i])) return i;
      return -1;
    };

    pinsEl.addEventListener("click", (e) => {
      const pin = e.target.closest(".fl-pin");
      if (!pin) return;
      const k = +pin.dataset.k;
      if (k === sel && sec.classList.contains("is-near")) {
        pin.classList.remove("is-hop");
        void pin.offsetWidth;
        pin.classList.add("is-hop");
        choose(places[k].f, pin);
      } else go(k);
    });
    pass.addEventListener("click", (e) => {
      const st = e.target.closest("[data-step]");
      if (st) {
        const k = nextFit(sel, +st.dataset.step);
        go(k < 0 ? sel + +st.dataset.step : k);
        return;
      }
      const dot = e.target.closest("[data-dot]");
      if (dot) { go(+dot.dataset.dot); return; }
      const love = e.target.closest("[data-love]");
      if (love) {
        choose(places[sel].f, love);
        const pin = $(`.fl-pin[data-k="${sel}"]`, pinsEl);
        if (pin) { pin.classList.remove("is-hop"); void pin.offsetWidth; pin.classList.add("is-hop"); }
      }
    });
    legend.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mood]");
      if (!btn) return;
      mood = btn.dataset.mood === mood ? null : btn.dataset.mood;
      paintMood();
      if (!mood) return;
      if (fits(places[sel])) { const pin = $(`.fl-pin[data-k="${sel}"]`, pinsEl); pin?.classList.remove("is-hop"); void pin?.offsetWidth; pin?.classList.add("is-hop"); return; }
      const k = [nextFit(sel, 1), nextFit(sel, -1)].filter((i) => i >= 0).sort((x, y) => Math.abs(x - sel) - Math.abs(y - sel))[0];
      if (k != null) go(k);
    });

    measure();
    show(0);
    measure(); // again, now that the passport has a card in it
    if (!live) {
      sec.classList.add("is-static", "is-near");
      render(0);
      addEventListener("resize", () => { measure(); render(0); });
      return { go };
    }
    sec.classList.add("is-live");
    // the section is as long as the trip; the stage stays on screen the whole way
    const setLen = () => { sec.style.height = `${Math.round(innerHeight * T + innerHeight)}px`; };
    setLen();
    let target = 0, cur = 0, dirty = true;
    trig = ScrollTrigger.create({
      trigger: sec,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => { target = s.progress; },
      onRefreshInit: setLen,
      onRefresh: (s) => { measure(); target = s.progress; cur = target; dirty = true; },
    });
    gsap.ticker.add(() => {
      const dlt = target - cur;
      if (Math.abs(dlt) < 0.00005 && !dirty) return;
      cur += dlt * 0.16;
      if (Math.abs(dlt) < 0.00005) cur = target;
      dirty = false;
      render(cur);
    });
    return { go };
  }

  /* ───────── ③ the pastry ring ───────── */
  function ring() {
    const box = $("#flavor-quiz");
    const stage = $("[data-fl-stage]");
    if (!box || !stage) return;
    const sec = stage.closest("section");
    const stack = $("[data-fl-stack]", stage);
    const ringEl = $("[data-fl-ring]", stage);
    const noteEl = $("[data-fl-note]", stage);
    const real = $("[data-fl-real]", stage);
    const tower = $(".fl-stage__tower", stage);
    // every answer is a layer: sponge first, then the cream, then the glaze on top
    const Q = [
      { q: "Шоколад чи ягоди?", a: [
        { t: "Шоколад", s: { choc: 2 }, l: { kind: "sponge", c: "#4a2418", b: "#2a1209" } },
        { t: "Ягоди", s: { berry: 2 }, l: { kind: "sponge", c: "#f0d9a0", b: "#c2263f" } },
        { t: "І те, і те", s: { choc: 1, berry: 1 }, l: { kind: "marble", c: "#f0d9a0", b: "#4a2418" } },
      ] },
      { q: "Який настрій у свята?", a: [
        { t: "Легкий", s: { light: 2 }, l: { kind: "cream", c: "#fffaf3", b: "#f3e6d8" } },
        { t: "Насичений", s: { choc: 1, nut: 1, caramel: 1 }, l: { kind: "cream", c: "#6b3a22", b: "#4a2418" } },
        { t: "Горіховий", s: { nut: 2 }, l: { kind: "cream", c: "#d9b48a", b: "#9a6a3a" } },
      ] },
      { q: "Кислинка — так чи ні?", a: [
        { t: "Так!", s: { sour: 1 }, l: { kind: "glaze", c: "#c2263f", b: "#7a0b1c" } },
        { t: "Краще солодше", s: { sweet: 1 }, l: { kind: "glaze", c: "#c98a3a", b: "#8a4f16" } },
      ] },
    ];
    const H = { sponge: 0.3, marble: 0.3, cream: 0.19, glaze: 0.09 }; // heights as a share of the ring's width
    let i = 0;
    let score = {};
    let built = [];

    const best = () => M().flavors.map((f) => {
      const m = meta(f.id);
      let s = m.moods.reduce((t, x) => t + (score[x] || 0), 0);
      s += score.sour ? m.sour * 0.3 : 0;
      s += score.sweet ? m.sweet * 0.3 : 0;
      return [f, s];
    }).sort((a, b) => b[1] - a[1])[0][0];

    // a layer in the ring: a short cylinder of its colour; sponge has pores, glaze runs down in drips
    const layerEl = (l, at) => {
      const el = document.createElement("span");
      el.className = `fl-lay fl-lay--${l.kind}`;
      el.style.setProperty("--c", l.c);
      el.style.setProperty("--b", l.b);
      el.style.setProperty("--h", H[l.kind]);
      el.style.setProperty("--at", at);
      // drips hang from the front edge of the top, which is an ellipse: lower in the middle, higher at the sides
      if (l.kind === "glaze") el.innerHTML = Array.from({ length: 7 }, (_, k) => {
        const x = 9 + k * 13.6;
        const yy = Math.sqrt(Math.max(0, 1 - ((x - 50) / 50) ** 2));
        return `<i style="--x:${x.toFixed(1)}%;--yy:${yy.toFixed(3)};--len:${(0.45 + (((k * 37) % 10) / 10) * 0.9).toFixed(2)}"></i>`;
      }).join("");
      return el;
    };
    const heightNow = () => built.reduce((t, l) => t + H[l.kind], 0);
    const drop = (l) => {
      const el = layerEl(l, heightNow());
      el.style.zIndex = built.length + 1;
      stack.appendChild(el);
      built.push(l);
      noteEl.classList.add("is-gone");
      if (!live) return;
      gsap.timeline()
        .fromTo(el, { yPercent: -420, scaleY: 1.1, opacity: 0 }, { yPercent: 0, opacity: 1, scaleY: 1, duration: 0.45, ease: "power3.in" })
        .to(el, { scaleY: 0.8, scaleX: 1.04, duration: 0.09, ease: "power1.out" })
        .to(el, { scaleY: 1, scaleX: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      gsap.fromTo(tower, { y: 0 }, { y: 6, duration: 0.08, delay: 0.45, yoyo: true, repeat: 1 });
    };

    const steps = () => `<span class="fl-quiz__steps" aria-hidden="true">${Q.map((_, k) => `<i class="${k < i ? "on" : k === i ? "now" : ""}"></i>`).join("")}</span>`;
    const swatch = (l) => `<span class="fl-sw fl-sw--${l.kind}" style="--c:${l.c};--b:${l.b}" aria-hidden="true"></span>`;
    const ask = () => {
      box.innerHTML = `${steps()}
        <h3 class="fl-quiz__q">${esc(Q[i].q)}</h3>
        <div class="fl-quiz__a">${Q[i].a.map((a, k) => `<button type="button" class="fl-ans" data-ans="${k}">${swatch(a.l)}<span>${esc(a.t)}</span></button>`).join("")}</div>`;
      if (live) gsap.from(box.children, { y: 16, opacity: 0, duration: 0.45, stagger: 0.05, ease: "expo.out" });
    };

    // after the last layer: the ring lifts, a cherry lands, then the real cake of that filling takes the place
    const reveal = () => {
      const f = best();
      const k = M().flavors.indexOf(f);
      const m = meta(f.id);
      real.innerHTML = `<span class="fl-pic">${imgOf(f, k)}</span><span class="fl-flag"><i></i><b>${esc(f.name)}</b></span>`;
      stage.style.setProperty("--tone", m.tone);
      const cherry = document.createElement("img");
      cherry.className = "fl-lay__cherry";
      cherry.src = `${M().root}img/cakes/cherries.png`;
      cherry.alt = "";
      cherry.style.setProperty("--at", heightNow());
      stack.appendChild(cherry);
      box.innerHTML = `${steps()}
        <div class="fl-quiz__got">
          <p class="fl-hand">а вийшло…</p>
          <h3 class="fl-quiz__q">${esc(f.name)}</h3>
          <p class="fl-quiz__desc">${esc(f.desc || "")}</p>
          <div class="fl-quiz__row"><a class="p-btn" href="${ctorHref(f.id)}"><span>Зібрати торт</span></a><button type="button" class="p-link fl-quiz__again" data-restart>Зібрати ще раз</button></div>
        </div>`;
      choose(f);
      const burst = () => {
        const r = real.getBoundingClientRect();
        const s = sec.getBoundingClientRect();
        motion().burst(sec, r.left - s.left + r.width / 2, r.top - s.top + r.height * 0.45, 90);
      };
      if (!live) { stage.classList.add("is-done"); return; }
      gsap.timeline()
        .to(ringEl, { yPercent: -150, opacity: 0, duration: 0.6, ease: "power2.inOut" }, 0.55)
        .fromTo(cherry, { yPercent: -900, rotation: -40 }, { yPercent: 0, rotation: 0, duration: 0.5, ease: "bounce.out" }, 0.75)
        .to(tower, { scale: 0.15, opacity: 0, duration: 0.42, ease: "back.in(2)" }, 1.75)
        .call(() => { stage.classList.add("is-done"); burst(); }, null, 2.1)
        .fromTo(real, { scale: 0.2, yPercent: 20, opacity: 0 }, { scale: 1, yPercent: 0, opacity: 1, duration: 0.85, ease: "back.out(1.7)" }, 2.1)
        .fromTo($(".fl-flag", real), { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(3)" }, 2.5);
      gsap.from(box.children, { y: 16, opacity: 0, duration: 0.5, stagger: 0.06, ease: "expo.out" });
    };

    const restart = () => {
      i = 0;
      score = {};
      built = [];
      stack.innerHTML = "";
      real.innerHTML = "";
      stage.classList.remove("is-done");
      noteEl.classList.remove("is-gone");
      if (live) {
        gsap.set([tower, real], { clearProps: "all" });
        gsap.fromTo(ringEl, { yPercent: -150, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "bounce.out" });
      }
      ask();
    };

    box.addEventListener("click", (e) => {
      const a = e.target.closest("[data-ans]");
      if (a && i < Q.length) {
        const ans = Q[i].a[+a.dataset.ans];
        Object.entries(ans.s).forEach(([k, v]) => (score[k] = (score[k] || 0) + v));
        drop(ans.l);
        i++;
        if (i < Q.length) ask();
        else reveal();
      }
      if (e.target.closest("[data-restart]")) restart();
    });
    ask();
  }

  /* ───────── ④ the gift box ───────── */
  function gift() {
    const grid = $("#tasting-cups");
    const box = $("[data-fl-box]");
    if (!grid || !box) return;
    const set = (M().desserts || []).find((x) => x.id === "trifle-set");
    const priceEl = $("[data-fl-set-price]");
    if (set && priceEl) priceEl.textContent = `€${set.price}`;
    const list = cakes();
    const cols = list.length <= 4 ? 2 : list.length <= 9 ? 3 : 4;
    grid.style.setProperty("--cols", cols);
    grid.innerHTML = list.map(({ f, k }) => {
      const m = meta(f.id);
      return `<button type="button" class="fl-cell" data-id="${esc(f.id)}" style="--tone:${m.tone};--paper:${mix(m.tone, CREAM, 0.55)};--k:${k}" aria-label="${esc(f.name)}">
        <span class="fl-cell__cake">${imgOf(f, k, ' loading="lazy"')}</span>
        <span class="fl-cell__cup" aria-hidden="true"></span>
        <small>${esc(f.name)}</small>
      </button>`;
    }).join("");
    const cells = $$(".fl-cell", grid);

    if (live) {
      // the lid lifts while the box scrolls in; once it is mostly off, the little cakes pop up from the back row
      gsap.fromTo(box, { "--lift": 0 }, { "--lift": 1, ease: "none", scrollTrigger: { trigger: box, start: "top 88%", end: "top 38%", scrub: 0.5, onUpdate: (st) => box.classList.toggle("is-open", st.progress > 0.55) } });
      gsap.set(cells.map((c) => $(".fl-cell__cake", c)), { yPercent: 70, scale: 0.6, opacity: 0 });
      ScrollTrigger.create({
        trigger: box,
        start: "top 62%",
        once: true,
        onEnter: () => gsap.to(cells.map((c) => $(".fl-cell__cake", c)), { yPercent: 0, scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2)", stagger: 0.05 }),
      });
    } else {
      box.style.setProperty("--lift", 1);
      box.classList.add("is-open");
    }

    grid.addEventListener("click", (e) => {
      const c = e.target.closest(".fl-cell");
      if (!c) return;
      c.classList.remove("is-hop");
      void c.offsetWidth;
      c.classList.add("is-hop");
      choose(M().flavors.find((x) => x.id === c.dataset.id), c);
    });

    $("#tasting-add")?.addEventListener("click", (e) => {
      const btn = e.currentTarget;
      if (!set) return;
      box.classList.add("is-closed");
      btn.disabled = true;
      setTimeout(() => {
        window.addToCartAndNotify({ id: set.id, name: set.name, price: set.price, image: set.image, dessert: true, meta: set.unit }, box);
      }, reduce ? 0 : 900);
      setTimeout(() => { box.classList.remove("is-closed"); btn.disabled = false; }, reduce ? 600 : 2800);
    });
  }

  /* ───────── ⑤ the board: the cake of the filling you found ───────── */
  function endCake(f) {
    const host = $("[data-fl-end-cake]");
    if (!host) return;
    const k = Math.max(0, M().flavors.indexOf(f));
    host.style.setProperty("--tone", meta(f.id).tone);
    host.innerHTML = `<span class="fl-pic">${imgOf(f, k)}</span><span class="fl-flag"><i></i><b>${esc(f.name)}</b></span>`;
    if (live && host.dataset.ready) {
      gsap.fromTo($(".fl-pic", host), { yPercent: 30, scale: 0.6, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.8)" });
      gsap.fromTo($(".fl-flag", host), { scale: 0 }, { scale: 1, duration: 0.5, delay: 0.3, ease: "back.out(3)" });
    }
    host.dataset.ready = "1";
  }
  function end() {
    const host = $("[data-fl-end-cake]");
    const fl = M().flavors;
    if (!host || !fl.length) return;
    // until something is chosen, the board shows the first filling whose cake is whole (no faded edge)
    const first = fl.find((f, k) => !EDGE[nameOf(f, k)]) || fl[0];
    endCake(first);
    const go = $("[data-fl-go]");
    if (go) go.href = ctorHref(first.id);
    if (!live) return;
    ScrollTrigger.create({
      trigger: host,
      start: "top 80%",
      once: true,
      onEnter: () => gsap.fromTo($(".fl-pic", host), { yPercent: 40, scale: 0.5, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, duration: 0.9, ease: "back.out(1.7)" }),
    });
  }

  function words() {
    // the page description follows the number of fillings as they are edited in the admin panel
    const n = M().flavors.length;
    const d = $('meta[name="description"]');
    if (d) d.content = `${n} ${plural(n, "начинка", "начинки", "начинок")} Mariday Cake у розрізі — шар за шаром, тест «який смак мій» і дегустаційний сет.`;
  }

  MARIDAY.onReady(() => {
    if (!M() || !M().flavors || !M().flavors.length) return;
    headings();
    mapApi = map();
    top();
    ring();
    gift();
    end();
    words();
    motion().refresh();
  });
})();
