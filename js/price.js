/* Mariday — «З чого ціна торта» (pages/cake-price.html, css/price.css).
   ① the anatomy: a real cake from the catalogue comes apart in three layers — decor, filling, weight — each with its note,
     the stand is the delivery and a little clock the timing; its own price tag swings below. Tap → the next cake
   ② the kitchen scale: guests sit down at the table plate by plate, the cake on the pan grows (a tall one for a tiered
     cake), the needle swings to the weight; the till prints the receipt, a rubber stamp slams down for an urgent order
   ③ the recipe of a price: five jars drop onto the pantry shelf — weights, sprinkles, layers of a real filling,
     an hourglass, a cake box — a tag hangs under each; tap a jar and its lid pops
   ④ when to order: tickets clipped onto the kitchen rail; slide the cherry to the day of the party
     and each ticket stamps itself «встигаємо», «терміново +20%» or «краще раніше»
   Works without GSAP; with reduced motion everything is simply shown. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const M = () => window.MARIDAY;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const live = !!(window.gsap && window.ScrollTrigger) && !reduce;
  const esc = (s) => window.escapeHTML(s);
  const eur = (n) => window.formatEUR(n);
  const motion = () => window.MaridayMotion || { reveal() {}, refresh() {}, burst() {}, live: false };
  const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many);
  const hex = (c, d = "#f5bcc8") => (/^#[0-9a-f]{3,8}$/i.test(String(c || "").trim()) ? String(c).trim() : d);
  const kgText = (kg) => kg.toFixed(1).replace(".", ",").replace(",0", "");
  // when GSAP is there, things that should appear on scroll start hidden (only then)
  if (live) document.body.classList.add("cp-js");

  /* ───────── the cakes: cut-outs from the live catalogue, trimmed to where the cake really is ───────── */
  const CROPPED = ["berries", "slice", "strawslice", "tiramisu", "meringue"];
  const cutOf = (c) => (M().cutout ? M().cutout(c) : "");
  const whole = (c) => (c.cutout || !CROPPED.includes(c.img) ? cutOf(c) : "");
  const PREFER = ["cherry-romance", "strawberry-love", "floral-poetry", "berry-romance", "a-little-bite-of-love"];
  const wholeCakes = () => {
    const pool = (M().cakes || []).filter(whole);
    return [...new Set([...PREFER.map((id) => pool.find((c) => c.id === id)).filter(Boolean), ...pool])];
  };
  // the cake for a big day: tagged wedding / tiered in the admin panel, or else the dearest one
  const grandCake = (skip) => {
    const pool = wholeCakes().filter((c) => c !== skip);
    const big = pool.find((c) => (c.cats || []).includes("wedding") || (c.tags || []).some((t) => /весіл|ярус/i.test(t)));
    return big || [...pool].sort((a, b) => (+b.price || 0) - (+a.price || 0))[0] || null;
  };
  const boxes = new Map();
  const trim = (src) => {
    if (boxes.has(src)) return boxes.get(src);
    const p = new Promise((done) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => {
        try {
          const W = 160;
          const H = Math.max(1, Math.round((W * im.naturalHeight) / im.naturalWidth));
          const cv = document.createElement("canvas");
          cv.width = W;
          cv.height = H;
          const cx = cv.getContext("2d", { willReadFrequently: true });
          cx.drawImage(im, 0, 0, W, H);
          const d = cx.getImageData(0, 0, W, H).data;
          let x0 = W, y0 = H, x1 = -1, y1 = -1;
          for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
              if (d[(y * W + x) * 4 + 3] < 40) continue;
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              y1 = y;
            }
          }
          if (x1 < 0) return done(null);
          const b = { x: x0 / W, y: y0 / H, w: (x1 + 1 - x0) / W, h: (y1 + 1 - y0) / H };
          b.ar = (b.h * im.naturalHeight) / (b.w * im.naturalWidth);
          done(b);
        } catch (e) {
          done({ x: 0, y: 0, w: 1, h: 1, ar: im.naturalHeight / im.naturalWidth || 1 });
        }
      };
      im.onerror = () => done(null);
      im.src = src;
    });
    boxes.set(src, p);
    return p;
  };
  // the picture placed so that the cake itself fills its box
  const fitCSS = (b) => `width:${(100 / b.w).toFixed(2)}%;left:${((-b.x / b.w) * 100).toFixed(2)}%;top:${((-b.y / b.h) * 100).toFixed(2)}%`;

  /* ───────── shared: glazed section headings, letters drop in when the heading comes into view ───────── */
  function splitInto(el, text) {
    el.textContent = "";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "cp-ch";
      s.style.setProperty("--i", i);
      s.style.setProperty("--cr", `${i % 2 ? 12 : -12}deg`);
      s.textContent = ch === " " ? " " : ch;
      el.appendChild(s);
    });
  }
  function headings() {
    const hs = $$(".cp-h2");
    hs.forEach((h) => { const w = $("[data-cp-split]", h); if (w) splitInto(w, w.textContent); });
    if (reduce || !("IntersectionObserver" in window)) { hs.forEach((h) => h.classList.add("is-in")); return; }
    document.body.classList.add("cp-heads");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -6% 0px" });
    hs.forEach((h) => io.observe(h));
  }

  /* ───────── shared: the shaped joins between the sections ───────── */
  function dripsPath(w, h, n, seed) {
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    let d = `M0 0 H${w} V4 `;
    const step = w / n;
    for (let k = n - 1; k >= 0; k--) {
      const x0 = k * step;
      const len = 8 + rnd() * (h - 14);
      const wd = step * (0.32 + rnd() * 0.3);
      const cx = x0 + step / 2 + (rnd() - 0.5) * step * 0.3;
      d += `L${(cx + wd / 2 + 6).toFixed(1)} 4 C${(cx + wd / 2).toFixed(1)} 6 ${(cx + wd / 2).toFixed(1)} ${(len - wd / 2).toFixed(1)} ${cx.toFixed(1)} ${len.toFixed(1)} C${(cx - wd / 2).toFixed(1)} ${(len - wd / 2).toFixed(1)} ${(cx - wd / 2).toFixed(1)} 6 ${(cx - wd / 2 - 6).toFixed(1)} 4 `;
    }
    return d + "L0 4 Z";
  }
  // a row of scallops standing on the seam (the shelf paper of the pantry)
  const scallopPath = (w, h, n) => {
    const step = w / n;
    let d = `M0 ${h} `;
    for (let k = 0; k < n; k++) d += `L${(k * step).toFixed(1)} ${h * 0.55} A${(step / 2).toFixed(1)} ${(h * 0.5).toFixed(1)} 0 0 1 ${((k + 1) * step).toFixed(1)} ${h * 0.55} `;
    return d + `L${w} ${h} Z`;
  };
  // a soft cream wave (the rail section rises over the pantry)
  const wavePath = (w, h) => `M0 ${h} V${h * 0.55} C${w * 0.12} ${h * 0.05} ${w * 0.26} ${h * 0.05} ${w * 0.38} ${h * 0.45} S${w * 0.62} ${h * 0.95} ${w * 0.76} ${h * 0.4} S${w * 0.93} ${h * 0.02} ${w} ${h * 0.3} V${h} Z`;

  function edges() {
    const set = (sel, d) => { const s = $(sel); if (s) s.innerHTML = `<path d="${d}"/>`; return s; };
    const ribbon = set("[data-cp-drips]", dripsPath(1200, 60, 22, 7));
    set("[data-cp-scallop]", scallopPath(1200, 40, 30));
    set("[data-cp-wave]", wavePath(1200, 50));
    if (!live) return;
    // the glaze runs further while the seam scrolls by
    if (ribbon) gsap.fromTo(ribbon, { scaleY: 0.35 }, { scaleY: 1.15, ease: "none", scrollTrigger: { trigger: ribbon, start: "top 95%", end: "top 25%", scrub: 0.6 } });
    $$(".cp-edge--scallop, .cp-edge--wave").forEach((svg) => {
      gsap.fromTo(svg, { scaleY: 0.3 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: svg.parentElement, start: "top bottom", end: "top 60%", scrub: 0.5 } });
    });
  }

  /* ═════════ ① the anatomy of the price ═════════ */
  function hero() {
    const root = $("[data-cp-x]");
    if (!root) return;
    const cakeEl = $("[data-cp-x-cake]", root);
    const tag = $("[data-cp-x-tag]", root);
    const cakes = wholeCakes();
    // the three layers of the cake: [top, bottom] as parts of its height
    const BANDS = [[0, 0.36], [0.36, 0.7], [0.7, 1]];
    let k = 0;
    let busy = false;
    let timer = 0;
    let seen = false;

    // the notes follow the cake: its box inside the scene, in px
    const measure = () => {
      const a = root.getBoundingClientRect();
      const b = cakeEl.getBoundingClientRect();
      if (!b.width) return;
      root.style.setProperty("--cx", `${(b.left - a.left).toFixed(1)}px`);
      root.style.setProperty("--cy", `${(b.top - a.top).toFixed(1)}px`);
      root.style.setProperty("--cw", `${b.width.toFixed(1)}px`);
      root.style.setProperty("--ch", `${b.height.toFixed(1)}px`);
    };
    addEventListener("resize", measure);

    async function load(c) {
      const src = whole(c);
      const b = (await trim(src)) || { x: 0, y: 0, w: 1, h: 1, ar: 1 };
      cakeEl.style.setProperty("--ar", Math.min(1.5, Math.max(0.55, b.ar)).toFixed(3));
      cakeEl.innerHTML = BANDS.map(([t, e], i) => `
        <span class="cp-x__band cp-x__band--${["top", "mid", "low"][i]}">
          <span class="cp-x__slice" style="clip-path:inset(${(t * 100).toFixed(1)}% -30% ${((1 - e) * 100).toFixed(1)}% -30%)"><img src="${esc(src)}" alt="" draggable="false" style="${fitCSS(b)}"></span>
        </span>`).join("");
      await Promise.all($$("img", cakeEl).map((im) => (im.decode ? im.decode().catch(() => {}) : null)));
      if (tag) {
        tag.hidden = false;
        tag.href = `product.html?id=${encodeURIComponent(c.id)}`;
        $("[data-cp-x-name]", tag).textContent = c.name;
        $("[data-cp-x-price]", tag).textContent = `від ${eur(+c.price || 0)}`;
        tag.setAttribute("aria-label", `${c.name} — від ${eur(+c.price || 0)}`);
      }
      root.classList.add("is-ready");
      measure();
    }

    const open = (to, d, ease) => (live ? gsap.to(root, { "--open": to, duration: d, ease, overwrite: true }) : root.style.setProperty("--open", to));

    async function next() {
      if (busy || !cakes.length) return;
      busy = true;
      clearTimeout(timer);
      root.classList.remove("is-open");
      if (live) {
        await open(0, 0.32, "power3.in");
        gsap.fromTo(cakeEl, { "--squash": 1 }, { "--squash": 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
        if (tag) gsap.fromTo(tag, { rotate: 0 }, { rotate: 360, duration: 0.7, ease: "back.out(1.4)", clearProps: "rotate" });
      }
      k = (k + 1) % cakes.length;
      await load(cakes[k]);
      reveal();
      busy = false;
    }
    function reveal() {
      root.classList.add("is-open");
      if (live) open(1, 1.1, "elastic.out(1, 0.55)");
      else root.style.setProperty("--open", 1);
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (!live || cakes.length < 2) return;
      timer = setTimeout(() => { if (seen && !document.hidden) next(); else schedule(); }, 4600);
    }

    $("[data-cp-x-go]", root).addEventListener("click", () => next());
    if (!cakes.length) { root.classList.add("is-ready", "is-open", "is-empty"); root.style.setProperty("--open", 1); return; }
    root.style.setProperty("--open", live ? 0 : 1);
    load(cakes[0]).then(() => setTimeout(reveal, live ? 450 : 0));
    new IntersectionObserver((es) => { seen = es[0].isIntersecting; }).observe(root);
    // scrolling away pulls the layers further apart
    if (live) {
      gsap.to(root, { "--scroll": 1, ease: "none", scrollTrigger: { trigger: root, start: "top 20%", end: "bottom top", scrub: 0.5 } });
      document.fonts?.ready.then(measure);
    }
  }

  /* ═════════ ② the kitchen scale ═════════ */
  const DECOR = { light: ["Легкий", 0, "мінімалізм"], medium: ["Середній", 25, "бортик з перлин"], complex: ["Складний", 60, "перлини й гірлянди"], sculpt: ["Скульптура", 120, "фігури й топери"] };
  const FORMATS = [
    [150, "Бенкет", "торт після вечері"],
    [175, "Свято", "торт — головний десерт"],
    [200, "Солодкий стіл", "для ласунів"],
    [120, "+ Candy bar", "є й інші десерти"],
  ];
  const BASE = 95; // the same base as the constructor
  const st = { guests: 16, grams: 175, decor: "medium", urgent: false, delivery: false };
  const result = () => {
    const kg = (st.guests * st.grams) / 1000;
    const sizes = M().sizes || [];
    const size = sizes.find((s) => s.id !== "tier" && parseFloat(s.id) >= kg - 0.05) || sizes.find((s) => s.id === "tier") || sizes[sizes.length - 1];
    const base = Math.round(BASE * (+size.priceMult || 1));
    const dec = DECOR[st.decor][1];
    const urg = st.urgent ? Math.round((base + dec) * 0.2) : 0;
    return { kg, size, base, dec, urg, total: base + dec + urg };
  };
  const ctorHref = () => {
    const r = result();
    return `constructor.html?size=${encodeURIComponent(r.size.id)}&decor=${st.decor}&step=1`;
  };
  const listeners = [];
  const onCalc = (fn) => listeners.push(fn);

  function calc() {
    const host = $("[data-cp-calc]");
    if (!host || !M().sizes) return;
    const MAXKG = 16;
    const ang = (kg) => -130 + 260 * Math.sqrt(Math.min(MAXKG, Math.max(0, kg)) / MAXKG);
    const at = (a, r) => [100 + r * Math.sin((a * Math.PI) / 180), 100 - r * Math.cos((a * Math.PI) / 180)];
    let ticks = "";
    for (let q = 0; q <= MAXKG; q += 0.5) {
      const major = [1, 2, 4, 8, 16].includes(q);
      const [x1, y1] = at(ang(q), major ? 70 : Number.isInteger(q) ? 74 : 77);
      const [x2, y2] = at(ang(q), 82);
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${major ? "is-major" : ""}"/>`;
    }
    const nums = [0, 1, 2, 4, 8, 16].map((q) => { const [x, y] = at(ang(q), 57); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}">${q}</text>`; }).join("");
    const guestsQ = () => ((st.guests - 2) / 78).toFixed(4);

    host.innerHTML = `
      <div class="cp-scale" data-scale>
        <div class="cp-scale__pan">
          <span class="cp-scale__cake" data-scale-cake></span>
          <i class="cp-scale__plate"></i>
        </div>
        <div class="cp-scale__body">
          <svg class="cp-scale__dial" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="92" class="cp-scale__rim"/>
            <circle cx="100" cy="100" r="84" class="cp-scale__face"/>
            <path d="M${at(ang(4.05), 84).map((v) => v.toFixed(1)).join(" ")} A84 84 0 0 1 ${at(ang(16), 84).map((v) => v.toFixed(1)).join(" ")} L${at(ang(16), 66).map((v) => v.toFixed(1)).join(" ")} A66 66 0 0 0 ${at(ang(4.05), 66).map((v) => v.toFixed(1)).join(" ")} Z" class="cp-scale__zone"/>
            <g class="cp-scale__ticks">${ticks}</g>
            <g class="cp-scale__nums">${nums}</g>
            <text x="100" y="138" class="cp-scale__unit">кг</text>
            <g class="cp-scale__needle" data-needle><path d="M100 104 L97.6 100 L100 26 L102.4 100 Z"/><circle cx="100" cy="100" r="7"/><circle cx="100" cy="100" r="2.6" class="cp-scale__pin"/></g>
          </svg>
          <span class="cp-scale__read" aria-hidden="true"><b data-kg>2,8</b><small>кг</small></span>
        </div>
        <div class="cp-table" aria-hidden="true">
          <div class="cp-table__plates" data-table>${Array.from({ length: 80 }, (_, i) => `<i style="--n:${i}"></i>`).join("")}</div>
        </div>
        <p class="cp-hand cp-table__cap" data-table-cap></p>
      </div>

      <div class="cp-ctrl">
        <div class="cp-guests">
          <label class="cp-label" for="cp-guests">Скільки гостей?</label>
          <output class="cp-guests__out" for="cp-guests" data-g-out>16</output>
          <div class="cp-range" style="--q:${guestsQ()}" data-range>
            <input id="cp-guests" type="range" min="2" max="80" value="${st.guests}" data-guests>
            <span class="cp-range__fill" aria-hidden="true"></span>
            <span class="cp-range__cherry" aria-hidden="true"></span>
          </div>
          <div class="cp-range__scale" aria-hidden="true"><span>2</span><span>20</span><span>40</span><span>60</span><span>80</span></div>
        </div>
        <p class="cp-label">Формат свята</p>
        <div class="cp-formats" role="group" aria-label="Формат свята">${FORMATS.map(([g, n, s]) => `<button type="button" class="cp-fmt${g === st.grams ? " is-on" : ""}" data-grams="${g}" aria-pressed="${g === st.grams}"><b>${n}</b><small>${g} г на гостя · ${s}</small></button>`).join("")}</div>
        <p class="cp-label">Декор</p>
        <div class="cp-decor" role="group" aria-label="Складність декору">${Object.entries(DECOR).map(([id, [n, a, s]], i) => `<button type="button" class="cp-sticker${id === st.decor ? " is-on" : ""}" data-decor="${id}" aria-pressed="${id === st.decor}" style="--r:${[-3, 2, -2, 3][i]}deg"><b>${n}</b><small>${a ? `+€${a}` : "у ціні"} · ${s}</small></button>`).join("")}</div>
        <div class="cp-toggles">
          <label class="cp-switch"><input type="checkbox" data-urgent><i aria-hidden="true"></i><span>Терміново — на завтра <small>+20%</small></span></label>
          <label class="cp-switch"><input type="checkbox" data-delivery><i aria-hidden="true"></i><span>Доставка по NL <small>окремий розрахунок</small></span></label>
        </div>
      </div>

      <div class="cp-till">
        <div class="cp-till__slot" aria-hidden="true"></div>
        <div class="cp-receipt" data-receipt>
          <p class="cp-receipt__shop">Mariday Cake <span>Alkmaar · ${new Date().toLocaleDateString("uk-UA")}</span></p>
          <div class="cp-receipt__rows" data-rows aria-live="polite"></div>
          <div class="cp-receipt__total"><span>Від</span><span class="cp-stamp" data-stamp aria-hidden="true">Терміново<small>+20%</small></span><b data-total>€0</b></div>
          <p class="cp-receipt__foot" data-per></p>
          <a class="p-btn p-btn--block cp-receipt__go" data-go href="constructor.html"><span>Зібрати такий торт →</span></a>
        </div>
      </div>`;

    const needle = $("[data-needle]", host);
    const scaleCake = $("[data-scale-cake]", host);
    const pan = $(".cp-scale__pan", host);
    const plates = $$("[data-table] i", host);
    const range = $("[data-range]", host);
    const totalEl = $("[data-total]", host);
    const stamp = $("[data-stamp]", host);
    const receipt = $("[data-receipt]", host);
    const shown = { total: 0, angle: ang(0), cake: null };

    // the cake on the pan: a usual one, or the grand one once the cake has to be tiered
    const small = wholeCakes()[0];
    const grand = grandCake(small) || small;
    const putCake = async (c) => {
      if (!c || shown.cake === c) return;
      shown.cake = c;
      const src = whole(c);
      const b = (await trim(src)) || { x: 0, y: 0, w: 1, h: 1, ar: 1 };
      if (shown.cake !== c) return;
      scaleCake.style.setProperty("--ar", Math.min(1.5, Math.max(0.55, b.ar)).toFixed(3));
      scaleCake.innerHTML = `<img src="${esc(src)}" alt="" draggable="false" style="${fitCSS(b)}">`;
      if (live) gsap.fromTo(scaleCake, { "--drop": 1 }, { "--drop": 0, duration: 0.7, ease: "bounce.out" });
    };

    function paint(how = "") {
      const r = result();
      const tiered = r.size.id === "tier";
      // the needle and the cake
      const to = ang(r.kg);
      if (live) {
        gsap.to(shown, { angle: to, duration: how === "drag" ? 0.5 : 1.1, ease: how === "drag" ? "power3.out" : "elastic.out(1, 0.35)", overwrite: true, onUpdate: () => needle.style.setProperty("--a", `${shown.angle}deg`) });
        if (how && how !== "drag") gsap.fromTo(pan, { "--dip": 1 }, { "--dip": 0, duration: 0.8, ease: "elastic.out(1, 0.35)" });
      } else needle.style.setProperty("--a", `${to}deg`);
      $("[data-kg]", host).textContent = kgText(r.kg);
      scaleCake.style.setProperty("--grow", Math.min(1, (r.kg - 0.3) / 4.2).toFixed(3));
      putCake(tiered ? grand : small);

      // the guests at the table
      plates.forEach((p, i) => p.classList.toggle("is-on", i < st.guests));
      $("[data-table-cap]", host).textContent = `${st.guests} ${plural(st.guests, "гість", "гості", "гостей")} × ${st.grams} г = ${kgText(r.kg)} кг`;
      $("[data-g-out]", host).textContent = st.guests;
      range.style.setProperty("--q", guestsQ());

      // the receipt
      $("[data-rows]", host).innerHTML = [
        [`Торт ${r.size.label}`, r.size.serves, eur(r.base)],
        [`Декор: ${DECOR[st.decor][0].toLowerCase()}`, DECOR[st.decor][2], r.dec ? `+${eur(r.dec)}` : "у ціні"],
        ["Начинка на вибір", "преміум — за домовленістю", "у ціні"],
        ...(st.urgent ? [["Терміновість", "на завтра", `+${eur(r.urg)}`]] : []),
        [st.delivery ? "Доставка по NL" : "Самовивіз", st.delivery ? "рахуємо окремо" : "Alkmaar", st.delivery ? "окремо" : "€0"],
      ].map(([a, s, b], i) => `<div class="cp-receipt__row" style="--n:${i}"><span>${esc(a)}<small>${esc(s)}</small></span><i></i><b>${b}</b></div>`).join("");
      if (live) {
        gsap.to(shown, { total: r.total, duration: 0.7, ease: "power3.out", overwrite: false, onUpdate: () => (totalEl.textContent = eur(Math.round(shown.total))) });
        if (how && how !== "drag") gsap.fromTo(receipt, { y: -10 }, { y: 0, duration: 0.5, ease: "back.out(2)" });
      } else totalEl.textContent = eur(r.total);
      $("[data-per]", host).textContent = `≈ ${eur(Math.round(r.total / st.guests))} на гостя · фінал — після погодження дизайну`;
      $("[data-go]", host).href = ctorHref();
      listeners.forEach((fn) => fn(r));
    }

    let dragT = 0;
    host.addEventListener("input", (e) => {
      if (!e.target.matches("[data-guests]")) return;
      st.guests = +e.target.value;
      paint("drag");
      clearTimeout(dragT);
      dragT = setTimeout(() => live && gsap.fromTo(pan, { "--dip": 0.6 }, { "--dip": 0, duration: 0.7, ease: "elastic.out(1, 0.35)" }), 160);
    });
    host.addEventListener("change", (e) => {
      if (e.target.matches("[data-urgent]")) {
        st.urgent = e.target.checked;
        stamp.classList.toggle("is-on", st.urgent);
        if (live && st.urgent) gsap.fromTo(stamp, { scale: 2.4, opacity: 0, rotate: -30 }, { scale: 1, opacity: 1, rotate: -14, duration: 0.45, ease: "back.out(2.2)", onComplete: () => gsap.fromTo(receipt, { x: -4 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }) });
        paint("tap");
      }
      if (e.target.matches("[data-delivery]")) { st.delivery = e.target.checked; paint("tap"); }
    });
    host.addEventListener("click", (e) => {
      const g = e.target.closest("[data-grams]");
      const d = e.target.closest("[data-decor]");
      if (g) {
        st.grams = +g.dataset.grams;
        $$("[data-grams]", host).forEach((b) => { b.classList.toggle("is-on", b === g); b.setAttribute("aria-pressed", String(b === g)); });
        paint("tap");
      }
      if (d) {
        st.decor = d.dataset.decor;
        $$("[data-decor]", host).forEach((b) => { b.classList.toggle("is-on", b === d); b.setAttribute("aria-pressed", String(b === d)); });
        if (live) gsap.fromTo(d, { rotate: 0, scale: 1.15 }, { rotate: d.style.getPropertyValue("--r") || 0, scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)", clearProps: "rotate,scale" });
        paint("tap");
      }
    });

    paint();
    // the first look: the receipt is printed, the guests sit down
    if (live) {
      const sec = host.closest("section");
      ScrollTrigger.create({
        trigger: host,
        start: "top 85%",
        once: true,
        onEnter: () => {
          sec.classList.add("is-in");
          gsap.fromTo(receipt, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 -40% 0)", duration: 1, ease: "steps(14)", clearProps: "clipPath" });
          gsap.fromTo(shown, { angle: ang(0) }, { angle: ang(result().kg), duration: 1.4, ease: "elastic.out(1, 0.35)", onUpdate: () => needle.style.setProperty("--a", `${shown.angle}deg`) });
        },
      });
    } else host.closest("section").classList.add("is-in");
  }

  /* ═════════ ③ the recipe of a price: the pantry shelf ═════════ */
  function pantry() {
    const host = $("[data-cp-shelf]");
    if (!host || !M().priceFactors) return;
    const kindOf = (t) => (/ваг/i.test(t) ? "kg" : /декор/i.test(t) ? "decor" : /начин/i.test(t) ? "fill" : /термін/i.test(t) ? "time" : /достав/i.test(t) ? "box" : "decor");
    const SHORT = { kg: "Вага", decor: "Декор", fill: "Начинка", time: "Терміни", box: "Доставка" };
    const LIDS = ["#c9a24a", "#f5bcc8", "#6d0809", "#bcd6f3", "#e9c6f0"];
    // the filling in its jar is a real one from the flavour list, layer by layer
    const metas = M().flavorMeta || {};
    const flavors = M().flavors || [];
    const fl = flavors[Math.floor(Math.random() * flavors.length)];
    const layers = ((fl && metas[fl.id] && metas[fl.id].layers) || ["#f0dca0", "#f7efe6", "#c2263f"]).map((c) => hex(c, "#f7efe6"));
    const SPR = ["#f5bcc8", "#fbe6b8", "#bcd6f3", "#e2849a", "#fff", "#c2263f", "#9fd3c7"];
    const inside = {
      kg: `<span class="cp-w cp-w--1">1 кг</span><span class="cp-w cp-w--2">500 г</span><span class="cp-w cp-w--3">200</span>`,
      decor: Array.from({ length: 34 }, (_, i) => `<i class="cp-spr${i % 5 === 0 ? " is-pearl" : ""}" style="--x:${(8 + ((i * 37) % 84)).toFixed(0)}%;--y:${(40 + ((i * 53) % 56)).toFixed(0)}%;--r:${(i * 47) % 180}deg;--c:${SPR[i % SPR.length]}"></i>`).join(""),
      fill: `<span class="cp-layers">${[...layers].reverse().map((c, i) => `<i style="--c:${c}" class="${i === layers.length - 1 ? "is-sponge" : ""}"></i>`).join('<i class="is-cream"></i>')}</span>${fl ? `<span class="cp-layers__name">${esc(fl.name)}</span>` : ""}`,
      time: `<span class="cp-glass"><i class="cp-glass__top"></i><i class="cp-glass__bot"></i><i class="cp-glass__stream"></i></span>`,
      box: `<span class="cp-box"><i class="cp-box__lid"></i><i class="cp-box__bow"></i></span>`,
    };
    host.innerHTML = M().priceFactors.map((f, i) => {
      const kind = kindOf(f.title);
      return `
      <article class="cp-jar cp-jar--${kind}" style="--lid:${LIDS[i % LIDS.length]};--k:${i};--tilt:${[-2, 1.5, -1, 2, -1.5][i % 5]}deg">
        <button type="button" class="cp-jar__glass" data-jar aria-label="Відкрити банку «${esc(f.title)}»">
          <span class="cp-jar__lid" aria-hidden="true"></span>
          <span class="cp-jar__body" aria-hidden="true">
            <span class="cp-jar__in">${inside[kind]}</span>
            <span class="cp-jar__label">${SHORT[kind] || esc(f.title)}</span>
          </span>
        </button>
        <span class="cp-jar__board" aria-hidden="true"></span>
        <div class="cp-jar__tag">
          <h3>${esc(f.title)}</h3>
          <p>${esc(f.text)}</p>
        </div>
      </article>`;
    }).join("");

    host.addEventListener("click", (e) => {
      const b = e.target.closest("[data-jar]");
      if (!b) return;
      const jar = b.closest(".cp-jar");
      jar.classList.remove("is-pop");
      void jar.offsetWidth;
      jar.classList.add("is-pop");
    });
    if (!live) { host.classList.add("is-in"); return; }
    ScrollTrigger.create({ trigger: host, start: "top 88%", once: true, onEnter: () => host.classList.add("is-in") });
  }

  /* ═════════ ④ when to order: the ticket rail ═════════ */
  function rail() {
    const host = $("[data-cp-rail]");
    if (!host) return;
    const cakes = wholeCakes();
    const classic = cakes[1] || cakes[0];
    const grand = grandCake(classic);
    const mini = [...cakes].sort((a, b) => (+a.price || 0) - (+b.price || 0))[0];
    const R = M().root || "../";
    const TICKETS = [
      { days: 1, when: "1 день", what: "Бенто", note: "без доплати за терміновість", art: "bento", cake: mini },
      { days: 5, when: "5–7 днів", what: "Класичні торти", note: "на завтра — можна, +20%", art: "cake", cake: classic, rush: true },
      { days: 7, when: "7 днів", what: "Candy bar", note: "солодкий стіл під ключ", art: "candy" },
      { days: 14, when: "2–3 тижні", what: "Весільні й скульптурні", note: "ярусні, фігури, розпис", art: "cake", cake: grand },
    ];
    const art = (t) => {
      if (t.art === "candy") return `<img class="cp-tk__img cp-tk__img--a" src="${R}img/cutouts/candy-mac.webp" alt="" loading="lazy"><img class="cp-tk__img cp-tk__img--b" src="${R}img/cutouts/cherrycup.webp" alt="" loading="lazy">`;
      const src = t.cake ? whole(t.cake) : "";
      if (!src) return "";
      if (t.art === "bento") return `<span class="cp-tk__bento"><i class="cp-tk__lid"></i><img class="cp-tk__img" src="${esc(src)}" alt="" loading="lazy"><i class="cp-tk__tray"></i></span>`;
      return `<img class="cp-tk__img" src="${esc(src)}" alt="" loading="lazy">`;
    };
    host.innerHTML = `
      <div class="cp-when">
        <label class="cp-label" for="cp-days">До свята залишилось</label>
        <output class="cp-when__out" for="cp-days" data-days-out></output>
        <div class="cp-range cp-range--days" data-days-range>
          <input id="cp-days" type="range" min="1" max="30" value="6" data-days>
          <span class="cp-range__fill" aria-hidden="true"></span>
          <span class="cp-range__cherry" aria-hidden="true"></span>
        </div>
        <div class="cp-range__scale" aria-hidden="true"><span>завтра</span><span>тиждень</span><span>2 тижні</span><span>3 тижні</span><span>місяць</span></div>
      </div>
      <ol class="cp-tickets" data-tickets>${TICKETS.map((t, i) => `
        <li class="cp-tk${t.art === "candy" ? " cp-tk--candy" : ""}" style="--k:${i};--tilt:${[-3, 2, -1.5, 2.5][i]}deg" data-need="${t.days}"${t.rush ? " data-rush" : ""}>
          <span class="cp-tk__clip" aria-hidden="true"></span>
          <div class="cp-tk__paper">
            <p class="cp-tk__head">Замовлення</p>
            <div class="cp-tk__art" aria-hidden="true">${art(t)}</div>
            <p class="cp-tk__when">${t.when}</p>
            <h3 class="cp-tk__what">${t.what}</h3>
            <p class="cp-tk__note">${t.note}</p>
            <span class="cp-tk__stamp" data-stamp></span>
          </div>
        </li>`).join("")}
      </ol>
      <p class="cp-hand cp-rail__foot">+20% — термінове замовлення на наступний день (крім бенто)</p>`;

    const input = $("[data-days]", host);
    const wrap = $("[data-days-range]", host);
    const out = $("[data-days-out]", host);
    const tks = $$(".cp-tk", host);
    const paint = (stampIt) => {
      const d = +input.value;
      wrap.style.setProperty("--q", ((d - 1) / 29).toFixed(4));
      out.textContent = d === 1 ? "1 день — це завтра" : `${d} ${plural(d, "день", "дні", "днів")}`;
      tks.forEach((li) => {
        const need = +li.dataset.need;
        const state = d >= need ? "ok" : li.hasAttribute("data-rush") ? "rush" : "late";
        if (li.dataset.state === state) return;
        li.dataset.state = state;
        const s = $("[data-stamp]", li);
        s.innerHTML = state === "ok" ? "встигаємо ✓" : state === "rush" ? "терміново<small>+20%</small>" : "краще раніше";
        if (stampIt && live) gsap.fromTo(s, { scale: 2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.4)", clearProps: "scale,opacity" });
      });
    };
    input.addEventListener("input", () => paint(true));
    paint(false);
    if (!live) { host.classList.add("is-in"); return; }
    ScrollTrigger.create({ trigger: host, start: "top 88%", once: true, onEnter: () => host.classList.add("is-in") });
  }

  MARIDAY.onReady(() => {
    if (!M() || !M().sizes) return;
    headings();
    edges();
    hero();
    calc();
    pantry();
    rail();
    motion().refresh();
  });
})();
