/* Mariday home — cinematic interactions (GSAP + ScrollTrigger + Lenis) */
(function () {
  const doc = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasLibs = !!(window.gsap && window.ScrollTrigger && window.Lenis);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");

  const FLAVOR_IMG = {
    "pistachio-raspberry": "slice",
    snickers: "brownie",
    "berry-forest": "raspberries",
    "banana-caramel": "pour",
    "cherry-duo-choc": "forest",
    "vanilla-berry": "strawslice",
    kinder: "mousse",
    "lemon-raspberry": "fraisier",
    plombir: "blackoreo",
  };
  // Cross-section colours follow the order of layers in each description; `note` covers flavours whose desc has no tagline
  const BUILTIN_META = {
    "pistachio-raspberry": { tone: "#b9cf8f", layers: ["#d8c48e", "#b9cf8f", "#c2263f"] },
    snickers: { tone: "#c27a2c", layers: ["#4a2418", "#d9b48a", "#c27a2c"] },
    "berry-forest": { tone: "#c23a5a", layers: ["#f0dca0", "#f7efe6", "#8e1b36"] },
    "banana-caramel": { tone: "#e3c26b", layers: ["#e3c26b", "#f7efe6", "#c27a2c"] },
    "cherry-duo-choc": { tone: "#a3203f", layers: ["#3e1c14", "#6b3a2a", "#e8d3b8", "#7a0b1c"], note: "Для тих, хто любить шоколад по-дорослому." },
    "vanilla-berry": { tone: "#e58aa0", layers: ["#f2dfa6", "#f7efe6", "#d2445e"] },
    kinder: { tone: "#c79a6b", layers: ["#4a2418", "#c79a6b", "#5b3020"], note: "Улюблений батончик — тільки у формі торта." },
    "lemon-raspberry": { tone: "#f0d54a", layers: ["#f3e08a", "#f2a7b6", "#b3173a", "#f5d742"], note: "Свіжо, яскраво й по-літньому." },
    plombir: { tone: "#e9dcc0", layers: ["#f0dca0", "#fbf3dc", "#2b1610"] },
  };
  // a flavour's look as edited in the admin panel (MARIDAY.flavorMeta), over the built-in palette and notes
  const FLAVOR_META = new Proxy({}, { get: (t, id) => {
    const own = (window.MARIDAY.flavorMeta || {})[id];
    const base = BUILTIN_META[id];
    return own || base ? { ...base, ...own } : undefined;
  } });
  const TRAIL_IMGS = ["strawberries", "roses", "cherrymint", "pink", "gold", "slice", "fraisier", "mousse", "forest", "pinkmac", "cherrycup", "raspberries", "strawslice", "lilac"];

  let lenis = null;
  let velocity = 0;
  let direction = 1;

  function seenIntro() {
    try { return sessionStorage.getItem("mariday-intro") === "1"; } catch (e) { return false; }
  }
  function markIntro() {
    try { sessionStorage.setItem("mariday-intro", "1"); } catch (e) { /* storage unavailable */ }
  }
  function refreshSoon(ms = 650) {
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), ms);
  }

  /* ───────── Content (static local catalogue data) ───────── */
  // Each cake tints the gallery: a soft pastel room (bg) and a deeper accent for small details (ac)
  const CAKE_TONE = {
    "rose-waltz": ["#f6dbe0", "#c9506d"],
    "berry-crown": ["#f4cfd3", "#b8243f"],
    "lilac-garden": ["#e5ddf3", "#7b5ea7"],
    "pink-icecream": ["#f9d6e3", "#cf467f"],
    "golden-macaron": ["#f6e6bf", "#a3701a"],
    "black-forest": ["#efd3cd", "#8e2a22"],
    "choco-crown": ["#ecdccd", "#7a4a2a"],
    "choco-ruffles": ["#f2e3d4", "#8c5634"],
  };

  // Each cake is exhibited cut out of its photo, standing on its own marble plinth with its name engraved on the front
  // extra plinth height (share of the card width) — a skyline instead of a flat row
  const PLINTH = [0.3, 0.1, 0.24, 0.04, 0.2, 0, 0.16, 0.08];
  const SPRINKLE = ["#e2849a", "#bcd6f3", "#fbe6b8", "#9ed9b8", "#6d0809", "#ffffff"];
  // a cake on the showcase stands cut out of its photo; a new cake without a cut-out stands as a framed photo
  const cutout = (c) => MARIDAY.cutout(c) || MARIDAY.img(c.img);
  const framed = (c) => (MARIDAY.cutout(c) ? "" : " is-photo");

  // Every cake brings its own moment under the lamp: the line its author opened the description with (emoji and all)
  // on the tag hanging from the lamp, and its own weather pouring through the beam — read from that line's emoji, then its tags
  const FX_EMOJI = [
    [/💙/u, "heart", "#3f7fe0"], [/💜/u, "heart", "#8a45c4"], [/❤|♥/u, "heart", "#d21f3c"], [/🩷/u, "heart", "#ef7fa8"],
    [/🩵/u, "heart", "#7cc4ef"], [/🤍/u, "heart", "#ffffff"], [/🤎/u, "heart", "#8a5634"], [/🧡/u, "heart", "#f08a2a"],
    [/💛/u, "heart", "#f2c230"], [/💚/u, "heart", "#4f9a4a"], [/🖤/u, "heart", "#2a1a1a"],
    [/❄|☃|⛄/u, "snow"], [/🍂|🍁|🎃/u, "leaf"], [/🌸|🌷|🌺|🌹|🥀|💐/u, "petal"], [/🦢|🪶/u, "feather"], [/🍓/u, "berry"], [/🍒/u, "cherry"],
    [/🐶|🐕|🐩|🐾/u, "paw"], [/🏁|🏎/u, "flag"], [/🎀/u, "bow"], [/☁/u, "cloud"], [/⭐|🌟|✨|🪄|🧸|🏛|👑/u, "star"],
  ];
  const FX_TAGS = [
    [/зимов|різдв|новоріч|сніж/i, "snow"], [/осін|гарбуз|halloween/i, "leaf"], [/квітк|троянд|орхіде|піон/i, "petal"],
    [/серц|романт|кохан/i, "heart"], [/вишн/i, "cherry"], [/полун/i, "berry"], [/пес|собак|шпіц|цуцен/i, "paw"],
    [/гонк|гоноч|^f1$|формул/i, "flag"], [/бант/i, "bow"], [/хмар/i, "cloud"], [/зір|казк|фе[їя]|принцес/i, "star"], [/дитяч|рочок|^1 рік/i, "confetti"],
  ];
  const YOURS_MOOD = { line: "Цей торт ще не спечений — придумаймо його разом ✍️", fx: [{ k: "confetti" }, { k: "star" }] };
  let MOODS = [];
  function cakeMood(c) {
    const paras = String(c.desc || "").split(/\n+/).map((p) => p.trim()).filter(Boolean);
    const para = paras.find((p) => (p.match(/\p{L}/gu) || []).length >= 12) || c.name;
    const first = para.length > 90 && para.match(/^.+?[.!?…](?=\s|$)/u);
    const line = first ? first[0] : para;
    const found = FX_EMOJI.map(([re, k, col]) => ({ k, col, at: para.search(re) })).filter((f) => f.at > -1).sort((a, b) => a.at - b.at);
    const fx = [];
    found.forEach((f) => { if (fx.length < 3 && !fx.some((g) => g.k === f.k)) fx.push(f); });
    // the tags only fill in when the line's own emoji leave the weather thin
    (c.tags || []).forEach((t) => FX_TAGS.forEach(([re, k]) => { if (re.test(t) && fx.length < 2 && !fx.some((g) => g.k === k)) fx.push({ k }); }));
    if (!fx.length) fx.push({ k: "heart" });
    if (fx.length < 2) fx.push({ k: fx[0].k === "star" ? "confetti" : "star" });
    return { line, fx };
  }

  function exhibitHTML(c, i, esc) {
    const name = esc(c.name);
    return `<span class="ex__stage"><i class="ex__ring" aria-hidden="true"></i><span class="ex__lift"><img class="ex__cake${framed(c)}" src="${cutout(c)}" alt="${name}" loading="lazy" draggable="false"></span></span>
      <span class="ex__plinth"><span class="ex__plate"><span class="ex__orn" aria-hidden="true">✦</span><b>${name}</b></span></span>`;
  }

  function renderCards() {
    const host = $("#x-cards");
    if (!host || !window.MARIDAY) return;
    const esc = window.escapeHTML || ((v) => String(v));
    const shown = MARIDAY.cakes.slice(0, 8);
    MOODS = shown.map(cakeMood);
    host.innerHTML = shown.map((c, i) => {
      const [bg, ac] = c.bg ? [c.bg, c.accent || "#c9506d"] : CAKE_TONE[c.id] || ["#f6dbe0", "#c9506d"];
      return `<a class="ex" href="pages/product.html?id=${encodeURIComponent(c.id)}" data-name="${esc(c.name)}" style="--bg:${bg};--ac:${ac};--ph:${PLINTH[i % PLINTH.length]}">${exhibitHTML(c, i, esc)}</a>`;
    }).join("");
    const now = $("[data-gl-now]");
    if (now && shown[0]) now.textContent = shown[0].name;
    // the cake stand under the title: every cake once more, in a ring
    const ring = $("[data-gl-carousel]");
    if (ring) ring.insertAdjacentHTML("beforeend", shown.map((c, i) => `<button type="button" tabindex="-1" class="gl__ride" data-i="${i}"><img class="${framed(c).trim()}" src="${cutout(c)}" alt="" draggable="false"></button>`).join(""));
    // the shelf along the bottom: a miniature of every cake, standing where its exhibit comes into focus
    const dots = $("[data-gl-dots]");
    if (dots) {
      dots.innerHTML = shown.map((c) => `<button type="button" tabindex="-1" data-name="${esc(c.name)}"><img class="${framed(c).trim()}" src="${cutout(c)}" alt="" draggable="false"></button>`).join("")
        + `<button type="button" tabindex="-1" class="is-plus" data-name="Ваш торт"><span>+</span></button>`;
    }
  }

  // ⑦ Flavours as a tasting set — each scroll step plates a new slice, assembled layer by layer, with its notes called out
  function flavorParts(f) {
    const cut = f.desc.indexOf(". ");
    const head = cut > -1 ? f.desc.slice(0, cut) : f.desc.replace(/\.$/, "");
    const layers = head.split(", ").map((t) => t.charAt(0).toUpperCase() + t.slice(1));
    const note = cut > -1 ? f.desc.slice(cut + 2) : FLAVOR_META[f.id]?.note || "";
    return { layers, note };
  }

  // Slice geometry in SVG units: the tip edge faces the viewer, two cut faces recede to the crust
  const SL = { P: 232, L: 46, R: 372, Pt: 170, Lt: 128, Rt: 116, H: 176, crown: 10 };
  const TASTE_ROLES = ["Верхня нота", "Нота серця", "Основа"];

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k));
    return `rgb(${c.join(",")})`;
  }

  function sliceSVG(f) {
    const { P, L, R, Pt, Lt, Rt, H, crown } = SL;
    const cols = (FLAVOR_META[f.id] || { layers: ["#f0dca0"] }).layers;
    const n = flavorParts(f).layers.length;
    const types = Array.from({ length: n }, (_, k) => k);
    const stack = [...types, ...types]; // bottom-up: the filling repeats twice, like a real cut
    const weight = (t) => (t === 0 ? 1.5 : 1);
    const total = stack.reduce((s, t) => s + weight(t), 0);
    const bands = [];
    let cur = H;
    stack.forEach((t, k) => {
      const h = (weight(t) / total) * (H - crown);
      bands.push({ t, k, a: cur - h, b: cur });
      cur -= h;
    });
    const faceA = (a, b) => `${L},${Lt + a} ${P},${Pt + a} ${P},${Pt + b} ${L},${Lt + b}`;
    const faceB = (a, b) => `${P},${Pt + a} ${R},${Rt + a} ${R},${Rt + b} ${P},${Pt + b}`;
    const band = ({ t, a, b }) => {
      const c = cols[t % cols.length];
      const pores = t === 0 ? `<polygon points="${faceA(a, b)}" fill="url(#xt-pores)"/><polygon points="${faceB(a, b)}" fill="url(#xt-pores)"/>` : "";
      return `<g class="x-tasting__band"><polygon points="${faceA(a, b)}" fill="${c}"/><polygon points="${faceA(a, b)}" fill="url(#xt-lit)"/><polygon points="${faceB(a, b)}" fill="${shade(c, -0.16)}"/>${pores}</g>`;
    };
    const top = cols[(n - 1) % cols.length];
    const berries = [[150, 99, 13], [203, 90, 15], [262, 95, 12]]
      .map(([x, y, r]) => `<g class="x-tasting__berry"><ellipse cx="${x}" cy="${y + r * 0.7}" rx="${r * 1.45}" ry="${r * 0.62}" fill="#fffaf3" stroke="rgba(150,110,80,0.18)"/><circle cx="${x}" cy="${y}" r="${r}" fill="${top}"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#xt-gloss)"/></g>`).join("");
    const crumbs = [[300, 372, 4], [318, 364, 2.6], [104, 340, 3.2], [92, 350, 2], [338, 352, 2.2]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${cols[0]}"/>`).join("");
    const upper = bands.filter((bd) => bd.k >= n);
    const anchors = upper.reverse().map((bd) => {
      const ax = P + (R - P) * 0.55;
      return { x: ax, y: Pt + (Rt - Pt) * 0.55 + (bd.a + bd.b) / 2, c: cols[bd.t % cols.length] };
    });
    const tagY = (j) => (n > 1 ? 112 + j * (224 / (n - 1)) : 224);
    const lines = anchors.map((p, j) => `<g class="x-tasting__lead"><path pathLength="1" d="M${p.x.toFixed(1)},${p.y.toFixed(1)} H404 L452,${tagY(j).toFixed(1)} H480"/><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${p.c}"/></g>`).join("");
    return {
      tagY,
      svg: `
        <g class="x-tasting__crumbs">${crumbs}</g>
        <g class="x-tasting__piece">
          <polygon class="x-tasting__shadow" points="${L + 10},${Lt + H + 4} ${P},${Pt + H + 8} ${R - 6},${Rt + H + 4}" />
          ${bands.map(band).join("")}
          <g class="x-tasting__top">
            <polygon points="${faceA(0, crown)}" fill="#fbf4ea"/><polygon points="${faceB(0, crown)}" fill="#efe3d4"/>
            <path d="M${P},${Pt} L${L},${Lt} Q205,40 ${R},${Rt} Z" fill="url(#xt-cream)"/>
            <line x1="${P}" y1="${Pt}" x2="${P}" y2="${Pt + H}" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
          </g>
          ${berries}
        </g>
        <g class="x-tasting__leads">${lines}</g>`,
    };
  }

  function renderWheel() {
    const host = $("#x-fill");
    if (!host || !window.MARIDAY) return;
    const list = MARIDAY.flavors;
    host.innerHTML = `
      <div class="x-tasting__stage">
        <p class="x-tasting__eyebrow x-eyebrow">( Дегустаційний сет · <span data-taste-count>01</span> / ${pad(list.length)} )</p>
        <div class="x-tasting__info">
          <figure class="x-tasting__photo" aria-hidden="true"><img data-taste-img src="img/cakes/slice.jpg" alt=""><figcaption>з нашої вітрини</figcaption></figure>
          <h3 class="x-tasting__name" data-taste-name aria-live="polite"></h3>
          <p class="x-tasting__note" data-taste-note></p>
          <dl class="x-tasting__meters" data-taste-meters></dl>
          <p class="x-tasting__moods" data-taste-moods></p>
          <div class="x-tasting__nav">
            <button class="x-tasting__arrow" type="button" data-taste-step="-1" aria-label="Попередня начинка">←</button>
            <button class="x-tasting__arrow" type="button" data-taste-step="1" aria-label="Наступна начинка">→</button>
            <a class="x-link" href="pages/constructor.html" data-taste-cta>Зібрати з цією начинкою →</a>
          </div>
        </div>
        <div class="x-tasting__plate">
          <div class="x-tasting__sun" aria-hidden="true"></div>
          <svg class="x-tasting__svg" viewBox="0 0 760 440" role="img" aria-label="Розріз торта">
            <defs>
              <linearGradient id="xt-lit" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.7" stop-color="#fff" stop-opacity="0"/></linearGradient>
              <linearGradient id="xt-cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf3"/><stop offset="1" stop-color="#f3e6d6"/></linearGradient>
              <radialGradient id="xt-gloss" cx="0.35" cy="0.3" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.75"/><stop offset="0.35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.25"/></radialGradient>
              <radialGradient id="xt-dish" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef6f5"/></radialGradient>
              <pattern id="xt-pores" width="14" height="9" patternUnits="userSpaceOnUse"><ellipse cx="4" cy="3" rx="1.8" ry="1" fill="rgba(80,40,10,0.18)"/><ellipse cx="11" cy="7" rx="1.2" ry="0.8" fill="rgba(255,255,255,0.3)"/></pattern>
              <filter id="xt-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
            </defs>
            <ellipse cx="214" cy="344" rx="214" ry="66" fill="rgba(61,4,5,0.12)" filter="url(#xt-blur)"/>
            <ellipse cx="212" cy="330" rx="210" ry="62" fill="url(#xt-dish)"/>
            <ellipse cx="212" cy="328" rx="176" ry="48" fill="none" stroke="rgba(109,8,9,0.2)" stroke-width="1.5" stroke-dasharray="3 6"/>
            <g data-taste-slice></g>
          </svg>
          <ol class="x-tasting__tags" data-taste-tags></ol>
        </div>
        <div class="x-tasting__menu" role="group" aria-label="Усі начинки">
          ${list.map((f, i) => {
            const cols = (FLAVOR_META[f.id] || { layers: ["#f0dca0"] }).layers;
            return `<button class="x-tasting__chip" type="button" data-taste-go="${i}" aria-label="${f.name}" title="${f.name}">
              <i aria-hidden="true">${[...cols].reverse().map((c) => `<b style="background:${c}"></b>`).join("")}</i>
              <span><small>${pad(i + 1)}</small><em>${f.name}</em></span>
            </button>`;
          }).join("")}
        </div>
        <p class="x-tasting__hint" aria-hidden="true">Гортайте — подаємо наступний шматочок <i>↓</i></p>
      </div>`;
  }

  function cakeWheel(scrolling) {
    const host = $("#x-fill");
    if (!host || !window.MARIDAY) return;
    const list = MARIDAY.flavors;
    const meta = MARIDAY.flavorMeta || {};
    const moods = Object.fromEntries((MARIDAY.moods || []).map((m) => [m.id, m.label.toLowerCase()]));
    const n = list.length;
    const animate = scrolling && hasLibs;
    const mobile = matchMedia("(max-width: 900px)");
    const svg = $(".x-tasting__svg", host);
    const slot = $("[data-taste-slice]", host);
    const tags = $("[data-taste-tags]", host);
    const chips = $$(".x-tasting__chip", host);
    let cur = -1;
    let swap = null;
    let st = null;

    const chars = (w) => [...w].map((ch) => `<span class="x-c"><span>${ch}</span></span>`).join("");
    const nameHTML = (s) => `<span>${s.split(" ").map((w) => w.split(/(?<=–)/).map((p) => `<span class="x-tasting__w">${chars(p)}</span>`).join("")).join(" ")}</span>`;
    const pips = (v) => Array.from({ length: 5 }, (_, k) => `<i${k < v ? ' class="is-on"' : ""}></i>`).join("");

    const fill = (i) => {
      const f = list[i];
      const m = meta[f.id] || {};
      const { layers, note } = flavorParts(f);
      const { svg: inner, tagY } = sliceSVG(f);
      host.style.setProperty("--tone", FLAVOR_META[f.id]?.tone || "var(--pink)");
      $("[data-taste-count]", host).textContent = pad(i + 1);
      const name = $("[data-taste-name]", host);
      name.innerHTML = nameHTML(f.name);
      name.setAttribute("aria-label", f.name);
      $("[data-taste-note]", host).textContent = note;
      $("[data-taste-img]", host).src = MARIDAY.img((MARIDAY.flavorMeta[f.id] || {}).img || FLAVOR_IMG[f.id] || "berries");
      $("[data-taste-meters]", host).innerHTML = [["Солодкість", m.sweet], ["Кислинка", m.sour]]
        .filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd aria-label="${v} з 5">${pips(v)}</dd></div>`).join("");
      $("[data-taste-moods]", host).textContent = (m.moods || []).map((id) => moods[id]).filter(Boolean).join(" · ");
      $("[data-taste-cta]", host).href = `pages/constructor.html?flavor=${f.id}&step=1`;
      slot.innerHTML = inner;
      const k = layers.length;
      tags.innerHTML = [...layers].reverse().map((t, j) => {
        const role = j === 0 ? TASTE_ROLES[0] : j === k - 1 ? TASTE_ROLES[2] : TASTE_ROLES[1];
        const c = FLAVOR_META[f.id]?.layers[(k - 1 - j) % FLAVOR_META[f.id].layers.length] || "#f0dca0";
        return `<li style="top:${((tagY(j) / 440) * 100).toFixed(2)}%;--c:${c}"><small>${role}</small><span>${t}</span></li>`;
      }).join("");
      chips.forEach((el, j) => {
        el.classList.toggle("is-on", j === i);
        el.setAttribute("aria-pressed", String(j === i));
      });
      const menu = chips[i].parentElement;
      if (menu.scrollWidth > menu.clientWidth) menu.scrollTo({ left: chips[i].offsetLeft - menu.clientWidth / 2 + chips[i].offsetWidth / 2, behavior: "smooth" });
    };

    const plateIn = () => {
      const tl = gsap.timeline();
      tl.fromTo($$(".x-tasting__band", slot), { y: -70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, stagger: 0.055, ease: "back.out(1.5)" })
        .fromTo($(".x-tasting__top", slot), { y: -90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "back.out(1.4)" }, "-=0.45")
        .fromTo($$(".x-tasting__berry", slot), { scale: 0, transformOrigin: "50% 100%" }, { scale: 1, duration: 0.6, stagger: 0.07, ease: "back.out(3)" }, "-=0.35")
        .fromTo($$(".x-tasting__crumbs circle", slot), { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.4, stagger: 0.03 }, "<")
        .fromTo($$(".x-tasting__lead path", slot), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, stagger: 0.08, ease: "power2.inOut" }, "-=0.5")
        .fromTo($$(".x-tasting__lead circle", slot), { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.4, stagger: 0.08, ease: "back.out(3)" }, "<")
        .fromTo($$("li", tags), { x: 16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "expo.out" }, "-=0.45");
      tl.fromTo($$(".x-tasting__name .x-c > span", host), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.018, ease: "expo.out" }, 0)
        .fromTo([$("[data-taste-note]", host), $("[data-taste-moods]", host)], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: "expo.out" }, 0.15)
        .fromTo($$(".x-tasting__meters i", host), { scale: 0 }, { scale: 1, duration: 0.5, stagger: 0.03, ease: "back.out(3)" }, 0.2)
        .fromTo($(".x-tasting__photo", host), { y: 30, rotation: 4, opacity: 0 }, { y: 0, rotation: -5, opacity: 1, duration: 0.9, ease: "back.out(1.6)" }, 0.1);
      return tl;
    };

    const setActive = (i) => {
      if (i === cur) return;
      const first = cur < 0;
      const back = i < cur;
      cur = i;
      if (!animate) return fill(i);
      swap?.kill();
      if (first) {
        fill(i);
        swap = plateIn().pause();
        ScrollTrigger.create({ trigger: host, start: "top 70%", once: true, onEnter: () => swap.play() });
        return;
      }
      // the old slice is taken off the plate, the new one is built in its place
      swap = gsap.timeline()
        .to($(".x-tasting__piece", slot), { x: back ? 80 : -80, rotation: back ? 5 : -5, opacity: 0, svgOrigin: `${SL.P} ${SL.Pt + SL.H}`, duration: 0.32, ease: "power2.in" })
        .to([$(".x-tasting__leads", slot), $(".x-tasting__crumbs", slot), ...$$("li", tags), $("[data-taste-note]", host), $("[data-taste-moods]", host)], { opacity: 0, duration: 0.2 }, 0)
        .to($(".x-tasting__photo", host), { y: -14, rotation: -12, opacity: 0, duration: 0.3, ease: "power2.in" }, 0)
        .to($$(".x-tasting__name .x-c > span", host), { yPercent: -110, duration: 0.3, stagger: 0.008, ease: "power2.in" }, 0)
        .add(() => {
          fill(i);
          swap = plateIn();
        });
    };

    const go = (i) => {
      i = (i + n) % n;
      if (st) {
        const y = st.start + (st.end - st.start) * (i / (n - 1));
        if (lenis) lenis.scrollTo(y, { duration: 1.2 });
        else scrollTo({ top: y, behavior: "smooth" });
        return;
      }
      setActive(i);
    };

    const fit = () => svg.setAttribute("viewBox", mobile.matches ? "0 24 428 392" : "0 0 760 440");
    mobile.addEventListener("change", fit);
    fit();

    host.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-taste-go]");
      const arrow = e.target.closest("[data-taste-step]");
      if (chip) go(Number(chip.dataset.tasteGo));
      else if (arrow) go(Math.max(cur, 0) + Number(arrow.dataset.tasteStep));
    });
    // phones: swipe the plate to change the slice
    let sx = null;
    const plate = $(".x-tasting__plate", host);
    plate.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    plate.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      sx = null;
      if (Math.abs(dx) > 50) go(Math.max(cur, 0) + (dx < 0 ? 1 : -1));
    });

    if (animate) {
      gsap.matchMedia().add("(min-width: 901px) and (min-height: 620px)", () => {
        st = ScrollTrigger.create({
          trigger: host,
          start: "top top",
          end: () => "+=" + innerHeight * 0.55 * (n - 1),
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: { snapTo: 1 / (n - 1), duration: { min: 0.2, max: 0.6 }, delay: 0.15, ease: "power2.inOut" },
          onUpdate: (self) => setActive(Math.round(self.progress * (n - 1))),
        });
        return () => { st = null; };
      });
    }
    setActive(0);
  }

  function renderFaq() {
    const host = $("#x-faq");
    if (!host || !window.MARIDAY?.faq) return;
    host.innerHTML = MARIDAY.faq.map((q, i) => `
      <div class="x-q">
        <button class="x-q__btn" type="button" aria-expanded="false" aria-controls="x-qa-${i}">
          <span>${q.q}</span><i class="x-q__icon" aria-hidden="true"></i>
        </button>
        <div class="x-q__a" id="x-qa-${i}" role="region"><div><p>${q.a}</p></div></div>
      </div>`).join("");
    host.addEventListener("click", (e) => {
      const btn = e.target.closest(".x-q__btn");
      if (!btn) return;
      const item = btn.parentElement;
      const open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      refreshSoon();
    });
  }

  /* ───────── Text splitting ───────── */
  function splitChars(el) {
    const text = el.textContent.trim();
    el.textContent = "";
    el.setAttribute("aria-hidden", "true");
    [...text].forEach((ch) => {
      const outer = document.createElement("span");
      const inner = document.createElement("span");
      outer.className = "x-c";
      inner.textContent = ch;
      outer.appendChild(inner);
      el.appendChild(outer);
    });
    return $$(".x-c > span", el);
  }

  // mode "fade": .x-w spans; mode "rise": .x-rl > .x-ri masks
  function splitWords(el, mode) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            const span = document.createElement("span");
            if (mode === "rise") {
              span.className = "x-rl";
              const inner = document.createElement("span");
              inner.className = "x-ri";
              inner.textContent = part;
              span.appendChild(inner);
            } else {
              span.className = "x-w";
              span.textContent = part;
            }
            frag.appendChild(span);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR" && !n.classList.contains("x-pill")) {
          walk(n);
        }
      });
    };
    walk(el);
    return $$(mode === "rise" ? ".x-ri" : ".x-w", el);
  }

  /* ───────── Smooth scroll ───────── */
  function setupLenis() {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    window.marLenis = lenis;
    const progress = $(".x-progress");
    lenis.on("scroll", (l) => {
      ScrollTrigger.update();
      velocity = l.velocity;
      if (l.direction) direction = l.direction;
      document.body.classList.toggle("is-scrolled", l.scroll > 80);
      progress.style.transform = `scaleX(${l.limit ? l.scroll / l.limit : 0})`;
    });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    ["cart-drawer", "order-modal", "mobile-nav"].forEach((id) => document.getElementById(id)?.setAttribute("data-lenis-prevent", ""));
    document.addEventListener("mariday:menu", (e) => (e.detail.open ? lenis.stop() : lenis.start()));
  }

  /* ───────── Preloader: cherry rain + filling logo ───────── */
  function dripPath(seed = 11) {
    const W = 1440;
    const base = 24;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    let d = `M0,0 L${W},0 L${W},${base}`;
    let x = W;
    while (x > 60) {
      x -= 24 + rnd() * 110;
      if (x < 60) break;
      d += ` L${x.toFixed(1)},${base}`;
      const w = 22 + rnd() * 46;
      const len = Math.min(134, base + 26 + rnd() * 110);
      const x1 = x - w;
      const xm = x - w / 2;
      d += ` C${x.toFixed(1)},${base + 16} ${(x - w * 0.08).toFixed(1)},${len.toFixed(1)} ${xm.toFixed(1)},${len.toFixed(1)}`;
      d += ` C${(x1 + w * 0.08).toFixed(1)},${len.toFixed(1)} ${x1.toFixed(1)},${base + 16} ${x1.toFixed(1)},${base}`;
      x = x1;
    }
    return d + ` L0,${base} Z`;
  }

  function wavePoly(level, t, amp, phase) {
    const pts = ["0% 100%"];
    const top = 96 - level * 104;
    for (let i = 0; i <= 24; i++) {
      const y = top + Math.sin(i * 0.55 + t * 2.6 + phase) * amp;
      pts.push(`${((i / 24) * 100).toFixed(2)}% ${y.toFixed(2)}%`);
    }
    pts.push("100% 100%");
    return `polygon(${pts.join(",")})`;
  }

  // Cherries fall, bounce off each other and pile up at the bottom
  function cherryRain(canvas, quick) {
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = "img/cakes/cherries.png";
    let W = 0, H = 0, dpr = 1;
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth || innerWidth;
      H = canvas.clientHeight || innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    };
    size();
    addEventListener("resize", size);

    const clamp = gsap.utils.clamp;
    const base = clamp(36, 74, W / 21);
    const total = Math.round(quick ? clamp(24, 50, W / 30) : clamp(60, 160, W / 9));
    const spawnMs = quick ? 800 : 2600;
    const bodies = [];
    const start = performance.now();
    let floor = true;
    let acc = 0;
    let px = -999, py = -999;
    const onMove = (e) => { px = e.clientX; py = e.clientY; };
    addEventListener("pointermove", onMove);

    function spawn() {
      const s = base * (0.75 + Math.random() * 0.55);
      bodies.push({
        x: s + Math.random() * (W - 2 * s),
        y: -s - Math.random() * 160,
        vx: (Math.random() - 0.5) * 2.4,
        vy: 2 + Math.random() * 4,
        a: (Math.random() - 0.5) * 1.6,
        va: (Math.random() - 0.5) * 0.12,
        s,
        r: s * 0.36,
      });
    }

    function step() {
      const due = Math.min(total, Math.floor(((performance.now() - start) / spawnMs) * total));
      while (bodies.length < due) spawn();
      const g = floor ? 0.42 : 0.95;
      for (const b of bodies) {
        b.vy += g;
        b.vx *= 0.995;
        const dx = b.x - px, dy = b.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < 9000 && d2 > 1) {
          const d = Math.sqrt(d2);
          b.vx += (dx / d) * 1.4;
          b.vy += (dy / d) * 1.4;
        }
        b.x += b.vx;
        b.y += b.vy;
        b.a += b.va;
        b.va *= 0.97;
        if (floor && b.y > H - b.r) {
          b.y = H - b.r;
          b.vy *= -0.3;
          b.vx *= 0.85;
          b.va += b.vx * 0.015;
          if (Math.abs(b.vy) < 0.5) b.vy = 0;
        }
        if (b.x < b.r) { b.x = b.r; b.vx *= -0.5; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -0.5; }
      }
      if (!floor) return;
      for (let k = 0; k < 2; k++) {
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const A = bodies[i], B = bodies[j];
            const dx = B.x - A.x, dy = B.y - A.y;
            const min = A.r + B.r;
            const d2 = dx * dx + dy * dy;
            if (d2 === 0 || d2 >= min * min) continue;
            const d = Math.sqrt(d2);
            const nx = dx / d, ny = dy / d;
            const push = (min - d) / 2;
            A.x -= nx * push; A.y -= ny * push;
            B.x += nx * push; B.y += ny * push;
            const rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
            if (rv < 0) {
              const imp = -rv * 0.55;
              A.vx -= imp * nx; A.vy -= imp * ny;
              B.vx += imp * nx; B.vy += imp * ny;
              A.va -= imp * 0.008; B.va += imp * 0.008;
            }
          }
        }
      }
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!img.complete || !img.naturalWidth) return;
      const ratio = img.naturalHeight / img.naturalWidth;
      for (const b of bodies) {
        if (b.y - b.s > H + 40) continue;
        const h = b.s * ratio;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.a);
        ctx.drawImage(img, -b.s / 2, -h * 0.74, b.s, h);
        ctx.restore();
      }
    }

    const tick = (time, dt) => {
      acc = Math.min(acc + dt, 70);
      while (acc >= 16.67) { step(); acc -= 16.67; }
      draw();
    };
    gsap.ticker.add(tick);

    return {
      drop() {
        floor = false;
        bodies.forEach((b) => {
          b.vy = -3 - Math.random() * 6;
          b.vx += (Math.random() - 0.5) * 6;
          b.va += (Math.random() - 0.5) * 0.3;
        });
      },
      stop() {
        gsap.ticker.remove(tick);
        removeEventListener("pointermove", onMove);
        removeEventListener("resize", size);
      },
    };
  }

  // Zig-zag path of a wide brush covering the whole screen
  function creamPath(W, H, bw) {
    const passes = Math.ceil((H - bw * 0.7) / (bw * 0.6)) + 1;
    const gap = passes > 1 ? (H - bw * 0.7) / (passes - 1) : 0;
    const segs = [];
    let total = 0;
    for (let i = 0; i < passes; i++) {
      const y0 = bw * 0.35 + i * gap;
      const ltr = i % 2 === 0;
      let prev = null;
      for (let k = 0; k <= 60; k++) {
        const f = ltr ? k / 60 : 1 - k / 60;
        const pt = { x: -0.15 * W + f * 1.3 * W, y: y0 + Math.sin(f * Math.PI * 1.6 + i * 1.3) * H * 0.035 };
        if (prev) {
          const len = Math.hypot(pt.x - prev.x, pt.y - prev.y);
          segs.push({ a: prev, b: pt, from: total, len });
          total += len;
        }
        prev = pt;
      }
    }
    return { segs, total };
  }

  function runPath(path, duration, step, stamp, onProgress) {
    let drawn = 0;
    const state = { p: 0 };
    return new Promise((resolve) => {
      gsap.to(state, {
        p: 1,
        duration,
        ease: "power1.inOut",
        onUpdate: () => {
          const target = state.p * path.total;
          for (const sg of path.segs) {
            if (sg.from + sg.len < drawn) continue;
            if (sg.from > target) break;
            const dx = (sg.b.x - sg.a.x) / sg.len;
            const dy = (sg.b.y - sg.a.y) / sg.len;
            for (let d = Math.max(0, drawn - sg.from); d <= Math.min(sg.len, target - sg.from); d += step) {
              stamp(sg.a.x + dx * d, sg.a.y + dy * d, -dy, dx);
            }
          }
          drawn = target;
          if (onProgress) onProgress(state.p);
        },
        onComplete: resolve,
      });
    });
  }

  // The brush paints a soft mask; through it a pre-rendered glossy buttercream texture appears
  // Offset palette knife: steel blade across the stroke, cherry handle trailing behind
  function makeSpatula(bw) {
    const c = document.createElement("canvas");
    const S = Math.ceil(bw * 1.9);
    c.width = c.height = S;
    const g = c.getContext("2d");
    const cx = S / 2, cy = S / 2;
    const L = bw * 1.04, T = bw * 0.13;
    g.save();
    g.translate(cx, cy);
    g.rotate(-0.12);
    // neck
    g.lineCap = "round";
    const neck = () => {
      g.beginPath();
      g.moveTo(-T * 0.1, -L * 0.36);
      g.quadraticCurveTo(-bw * 0.2, -L * 0.48, -bw * 0.4, -L * 0.62);
      g.stroke();
    };
    g.strokeStyle = "#8e98a2";
    g.lineWidth = T * 0.75;
    neck();
    g.strokeStyle = "#dfe4e8";
    g.lineWidth = T * 0.45;
    neck();
    // handle
    g.save();
    g.translate(-bw * 0.42, -L * 0.62);
    g.rotate(-0.95);
    const hg = g.createLinearGradient(0, -T * 0.6, 0, T * 0.6);
    hg.addColorStop(0, "#9c1a1c");
    hg.addColorStop(0.45, "#6d0809");
    hg.addColorStop(1, "#3d0405");
    g.fillStyle = hg;
    g.beginPath();
    g.roundRect ? g.roundRect(-bw * 0.62, -T * 0.55, bw * 0.62, T * 1.1, T * 0.55) : g.rect(-bw * 0.62, -T * 0.55, bw * 0.62, T * 1.1);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.25)";
    g.fillRect(-bw * 0.56, -T * 0.38, bw * 0.48, T * 0.12);
    g.restore();
    // blade
    const bg = g.createLinearGradient(-T / 2, 0, T / 2, 0);
    bg.addColorStop(0, "#d9dee3");
    bg.addColorStop(0.35, "#ffffff");
    bg.addColorStop(0.6, "#b8c1ca");
    bg.addColorStop(1, "#e8ecef");
    g.fillStyle = bg;
    g.strokeStyle = "rgba(90,100,110,0.55)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.roundRect ? g.roundRect(-T / 2, -L / 2, T, L, T / 2) : g.rect(-T / 2, -L / 2, T, L);
    g.fill();
    g.stroke();
    // cream on the blade edge
    g.fillStyle = "rgba(205,226,238,0.95)";
    g.beginPath();
    g.roundRect ? g.roundRect(T * 0.05, -L * 0.47, T * 0.55, L * 0.94, T * 0.3) : g.rect(T * 0.05, -L * 0.47, T * 0.55, L * 0.94);
    g.fill();
    g.restore();
    return c;
  }

  function paintCream(canvas, duration, onAlmost) {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const tex = new Image();
    tex.src = W >= H ? "img/cakes/cream-wide.jpg?v=2" : "img/cakes/cream-tall.jpg?v=2";
    const ready = tex.decode ? tex.decode().then(() => true, () => false) : new Promise((r) => { tex.onload = () => r(true); tex.onerror = () => r(false); });

    return ready.then((ok) => {
      if (!ok) return paintCreamFlat(canvas, duration);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mask = document.createElement("canvas");
      mask.width = canvas.width;
      mask.height = canvas.height;
      const mx = mask.getContext("2d");
      mx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const dab = document.createElement("canvas");
      dab.width = dab.height = 64;
      const dg = dab.getContext("2d");
      const grad = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.6, "rgba(0,0,0,0.9)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      dg.fillStyle = grad;
      dg.fillRect(0, 0, 64, 64);

      // cover-fit the texture
      const sc = Math.max(W / tex.naturalWidth, H / tex.naturalHeight);
      const tw = tex.naturalWidth * sc;
      const th = tex.naturalHeight * sc;
      const tx = (W - tw) / 2;
      const ty = (H - th) / 2;

      const bw = Math.max(H / 2.3, 240);
      const bristles = Array.from({ length: 26 }, (_, i) => ({
        u: i / 25 - 0.5,
        size: bw * (0.1 + Math.random() * 0.07),
        ph: Math.random() * Math.PI * 2,
      }));
      const tool = makeSpatula(bw);
      const head = { x: -999, y: 0, tilt: 0, sx: 1, on: false };
      let travelled = 0;
      const width = 1;
      const stamp = (x, y, nx, ny) => {
        travelled++;
        head.on = true;
        head.x = x;
        head.y = y;
        const mdx = ny, mdy = -nx;
        head.sx += ((mdx >= 0 ? 1 : -1) - head.sx) * 0.22;
        head.tilt += (Math.atan2(mdy, Math.abs(mdx)) - head.tilt) * 0.3;
        for (const b of bristles) {
          const o = b.u * bw * width + Math.sin(travelled * 0.04 + b.ph) * 5;
          const sz = b.size * (0.6 + width * 0.4);
          mx.drawImage(dab, x + nx * o - sz / 2, y + ny * o - sz / 2, sz, sz);
        }
      };

      let dirty = true;
      const render = () => {
        if (!dirty) return;
        dirty = false;
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(mask, 0, 0, W, H);
        ctx.globalCompositeOperation = "source-in";
        ctx.drawImage(tex, tx, ty, tw, th);
        ctx.globalCompositeOperation = "source-over";
        if (head.on) {
          const k = 0.55 + width * 0.45;
          ctx.save();
          ctx.translate(head.x, head.y);
          ctx.scale(head.sx, 1);
          ctx.rotate(head.tilt);
          ctx.scale(k, k);
          ctx.shadowColor = "rgba(40, 0, 0, 0.32)";
          ctx.shadowBlur = 22;
          ctx.shadowOffsetX = 8;
          ctx.shadowOffsetY = 14;
          ctx.drawImage(tool, -tool.width / 2, -tool.height / 2);
          ctx.restore();
        }
      };
      gsap.ticker.add(render);
      const paint = (...args) => { stamp(...args); dirty = true; };

      let fired = false;
      const almost = (p) => {
        if (!fired && p > 0.93) {
          fired = true;
          if (onAlmost) onAlmost();
        }
      };
      return runPath(creamPath(W, H, bw), duration, 9, paint, almost)
        .then(() => {
          head.on = false;
          mx.setTransform(1, 0, 0, 1, 0, 0);
          mx.fillRect(0, 0, mask.width, mask.height);
          dirty = true;
          render();
          gsap.ticker.remove(render);
        });
    });
  }

  // Fallback without WebGL: soft coloured dabs
  function paintCreamFlat(canvas, duration) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const bw = Math.max(H / 2.3, 240);
    const colors = ["#cfe5ee", "#d6ebf0", "#c8e0ea", "#dbeff1", "#b9d3e1"];
    const stamp = (x, y, nx, ny) => {
      for (let i = 0; i < 30; i++) {
        const o = (i / 29 - 0.5) * bw;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(x + nx * o, y + ny * o, bw * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    return runPath(creamPath(W, H, bw), duration, 6, stamp);
  }

  // Safari fills its status bar with the body colour (css/home.css .is-edge-cream) and re-reads it only while the page
  // scrolls, so a 1px scroll there and back makes it notice
  function edgeLoader(on) {
    document.body.classList.toggle("is-edge-cream", on);
    const y = scrollY;
    scrollTo(0, y + 1);
    requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(0, y)));
  }

  function runLoader(onReveal) {
    const loader = $(".x-loader");
    if (!loader) return onReveal();
    const quick = seenIntro();
    const count = $("[data-loader-count]", loader);
    const logo = $(".x-loader__logo", loader);
    const cream = $(".x-loader__layer--cream", loader);
    const pink = $(".x-loader__layer--pink", loader);
    const bar = $(".x-loader__bar i", loader);
    $(".x-loader__drip path", loader).setAttribute("d", dripPath());
    $(".x-loader__cream-drip path", loader).setAttribute("d", dripPath(29));
    const rain = cherryRain($(".x-loader__canvas", loader), quick);

    const state = { v: 0 };
    let t = 0;
    const wave = (time, dt) => {
      t += dt / 1000;
      const lv = state.v / 100;
      const amp = 3.4 * (1 - lv * 0.5);
      cream.style.clipPath = wavePoly(lv, t, amp, 0);
      pink.style.clipPath = wavePoly(Math.min(1.05, lv + 0.07), t * 1.1, amp, 1.9);
      bar.style.transform = `scaleX(${lv})`;
      count.textContent = Math.round(state.v);
    };
    gsap.ticker.add(wave);

    const intro = gsap.timeline()
      .fromTo(logo, { letterSpacing: "0.5em", opacity: 0, filter: "blur(14px)" }, { letterSpacing: "0.02em", opacity: 1, filter: "blur(0px)", duration: quick ? 0.8 : 1.6, ease: "expo.out" }, 0)
      .from(".x-loader__kicker", { opacity: 0, y: 14, duration: 0.9, ease: "expo.out" }, 0.2)
      .from([".x-loader__bar", ".x-loader__meta"], { opacity: 0, y: 12, duration: 0.8, stagger: 0.1, ease: "expo.out" }, 0.4)
      .to(state, { v: 82, duration: quick ? 0.8 : 2.2, ease: "power1.inOut" }, 0.2)
      .to(".x-loader__script", { clipPath: "inset(-20% -10% -20% 0%)", duration: 1.1, ease: "power2.inOut" }, quick ? 0.5 : 1.4);

    const loaded = new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true })));
    const cap = new Promise((r) => setTimeout(r, quick ? 1000 : 3400));

    Promise.all([intro.then(), Promise.race([loaded, cap])]).then(() => {
      const cream = $(".x-loader__cream", loader);
      gsap.timeline()
        .to(state, { v: 100, duration: 0.55, ease: "power2.out" })
        .to(logo, { scale: 1.05, duration: 0.55, ease: "power2.inOut" }, "<")
        .add(() => {
          const paintTime = quick ? 0.85 : 1.35;
          // the cream has covered the screen: Safari's status bar turns cream with it (bordeaux until now)
          gsap.to($(".x-loader__cream-base", loader), { opacity: 1, duration: 0.4, delay: paintTime * 0.75, onStart: () => edgeLoader(true) });
          let lifted = false;
          const lift = () => {
            if (lifted) return;
            lifted = true;
            gsap.ticker.remove(wave);
            rain.stop();
            gsap.set([".x-loader__curtain", ".x-loader__canvas", ".x-loader__center"], { autoAlpha: 0 });
            gsap.timeline({ onComplete: () => { loader.remove(); markIntro(); } })
              .to(cream, { yPercent: -100, duration: 1.0, ease: "power1.inOut" }, 0)
              .add(onReveal, 0.3)
              .add(() => edgeLoader(false), 0.85);
          };
          paintCream($(".x-loader__brush", loader), paintTime, lift).then(lift);
        }, "+=0.05");
    });
  }

  function heroIntro() {
    gsap.timeline()
      .from(".x-hero__video", { scale: 1.4, duration: 2.4, ease: "expo.out" }, 0)
      .from(".x-hero__word .x-c > span", { yPercent: 118, duration: 1.5, stagger: 0.065, ease: "expo.out" }, 0.05)
      .from("[data-hero-script]", { opacity: 0, scale: 0.5, rotation: -30, duration: 1.6, ease: "expo.out" }, 0.55)
      .from("[data-hero-fade]", { y: 30, opacity: 0, duration: 1.2, stagger: 0.08, ease: "expo.out" }, 0.6)
      .fromTo([".hdr__ticker", ".hdr__bar"], { yPercent: -120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: "expo.out", clearProps: "transform,opacity" }, 0.7)
      .from(".x-hero__cherry", { scale: 0, opacity: 0, duration: 1.4, stagger: 0.12, ease: "back.out(1.8)" }, 0.8);
  }

  function heroLive() {
    const hero = $(".x-hero");
    if (!hero) return;
    const cherries = $$(".x-hero__cherry", hero);
    cherries.forEach((c, i) => {
      gsap.to(c, { rotation: i % 2 ? 8 : -8, y: "+=14", duration: 2.6 + i * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
    });
    if (!fine) return;

    const center = $(".x-hero__center", hero);
    const script = $(".x-hero__script", hero);
    gsap.set(center, { transformPerspective: 1200 });
    const rx = gsap.quickTo(center, "rotationX", { duration: 1, ease: "power3.out" });
    const ry = gsap.quickTo(center, "rotationY", { duration: 1, ease: "power3.out" });
    const sx = gsap.quickTo(script, "x", { duration: 1.2, ease: "power3.out" });
    const sy = gsap.quickTo(script, "y", { duration: 1.2, ease: "power3.out" });
    const cherryTo = cherries.map((c) => ({
      d: parseFloat(c.dataset.depth),
      x: gsap.quickTo(c, "x", { duration: 1.4, ease: "power3.out" }),
    }));
    hero.addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      ry(nx * 8);
      rx(-ny * 6);
      sx(-nx * 40);
      sy(-ny * 24);
      cherryTo.forEach((c) => c.x(nx * -60 * c.d));
    });
    hero.addEventListener("pointerleave", () => { rx(0); ry(0); sx(0); sy(0); cherryTo.forEach((c) => c.x(0)); });

    $$(".x-hero__word .x-c > span", hero).forEach((ch) => {
      ch.addEventListener("pointerenter", () => gsap.to(ch, { yPercent: -10, duration: 0.5, ease: "back.out(3)" }));
      ch.addEventListener("pointerleave", () => gsap.to(ch, { yPercent: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" }));
    });
  }

  /* ───────── Scroll scenes ───────── */
  function heroScroll() {
    gsap.timeline({ scrollTrigger: { trigger: ".x-hero", start: "top top", end: "bottom top", scrub: true } })
      .to(".x-hero__frame", { clipPath: "inset(7% 4% 16% 4% round 44px)", ease: "none" }, 0)
      .to(".x-hero__video", { scale: 1.32, ease: "none" }, 0)
      .to(".x-hero__inner", { yPercent: -16, opacity: 0, ease: "none" }, 0)
      .to(".x-badge", { yPercent: -120, rotation: 200, ease: "none" }, 0)
      .to(".x-hero__cherry", { yPercent: (i, el) => -260 * parseFloat(el.dataset.depth), ease: "none" }, 0);
  }

  function marquees() {
    $$("[data-marquee]").forEach((row) => {
      const track = row.firstElementChild;
      const speed = parseFloat(row.dataset.speed || "1");
      const rev = row.hasAttribute("data-reverse") ? -1 : 1;
      [...track.children].forEach((node) => {
        const clone = node.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        if (clone.tagName === "IMG") clone.alt = "";
        if (clone.tagName === "A") clone.tabIndex = -1;
        track.appendChild(clone);
      });
      // Ribbon text is short: repeat until it overflows wide screens
      while (track.scrollWidth < innerWidth * 2.4 && track.children.length < 200) {
        [...track.children].forEach((node) => {
          const clone = node.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          if (clone.tagName === "IMG") clone.alt = "";
          if (clone.tagName === "A") clone.tabIndex = -1;
          track.appendChild(clone);
        });
      }
      let x = 0;
      let half = 0;
      let visible = false;
      let slow = 1;
      let slowTarget = 1;
      if (fine) {
        row.addEventListener("pointerenter", () => { slowTarget = 0.12; });
        row.addEventListener("pointerleave", () => { slowTarget = 1; });
      }
      const measure = () => { half = track.scrollWidth / 2; };
      measure();
      $$("img", track).forEach((img) => img.complete || img.addEventListener("load", measure, { once: true }));
      addEventListener("resize", measure);
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(row);

      gsap.ticker.add((time, dt) => {
        if (!visible || !half) return;
        const boost = 1 + Math.min(Math.abs(velocity) * 0.12, 8);
        slow += (slowTarget - slow) * 0.08;
        x -= speed * boost * slow * rev * direction * dt * 0.06;
        x = ((x % half) - half) % half;
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
    });
  }

  function ribbons() {
    const sec = $(".x-ribbons");
    if (!sec) return;
    const st = { trigger: sec, start: "top bottom", end: "bottom top", scrub: true };
    gsap.fromTo(".x-ribbon--cherry", { rotation: -11 }, { rotation: -1.5, ease: "none", scrollTrigger: st });
    gsap.fromTo(".x-ribbon--pink", { rotation: 10 }, { rotation: 1.5, ease: "none", scrollTrigger: { ...st } });

    const peek = $(".x-peek", sec);
    if (!fine || !peek) return;
    const imgs = {};
    $$("[data-img]", sec).forEach((el) => {
      const key = el.dataset.img;
      if (!imgs[key]) {
        const img = new Image();
        img.src = `img/cakes/${key}.jpg`;
        img.alt = "";
        peek.appendChild(img);
        imgs[key] = img;
      }
    });
    let cur = null, on = false, z = 1, s = 0;
    let tx = 0, ty = 0, x = 0, y = 0;
    const show = (key) => {
      if (key === cur) return;
      cur = key;
      const img = imgs[key];
      img.style.zIndex = ++z;
      gsap.fromTo(img, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.25 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 0.8, ease: "expo.out" });
    };
    sec.addEventListener("pointermove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      const hit = e.target.closest("[data-img]");
      if (hit) {
        if (!on) { x = tx; y = ty; }
        on = true;
        show(hit.dataset.img);
      } else {
        on = false;
      }
    });
    sec.addEventListener("pointerleave", () => { on = false; });
    gsap.ticker.add(() => {
      s += ((on ? 1 : 0) - s) * 0.14;
      if (s < 0.005 && !on) {
        if (peek.style.opacity !== "0") { peek.style.opacity = "0"; cur = null; }
        return;
      }
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      const rot = Math.max(-16, Math.min(16, (tx - x) * 0.1));
      peek.style.opacity = s.toFixed(3);
      peek.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot.toFixed(2)}deg) scale(${(0.5 + s * 0.5).toFixed(3)})`;
    });
  }

  // Illustrated cake layers (600-unit wide side view): side wall + top cut face
  const CAKE_T = { plate: 20, sponge: 74, cream: 32, berry: 34, choco: 70, top: 48 };
  function cakeLayerSVG(kind) {
    const t = CAKE_T[kind];
    const H = t + 120;
    const id = `${kind}${Math.random().toString(36).slice(2, 7)}`;
    const side = `M20,60 L20,${60 + t} A280,60 0 0 0 580,${60 + t} L580,60 A280,60 0 0 1 20,60 Z`;
    const frontY = (x) => 60 + 60 * Math.sqrt(Math.max(0, 1 - ((x - 300) / 280) ** 2));
    const grad = (gid, stops, vertical) => `<linearGradient id="${gid}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
    const radial = (gid, inner, outer) => `<radialGradient id="${gid}" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="${inner}"/><stop offset="1" stop-color="${outer}"/></radialGradient>`;
    const pores = (gid, c) => `<pattern id="${gid}" width="18" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(-11) scale(0.75)"><ellipse cx="5" cy="4" rx="2.3" ry="1.4" fill="${c}"/><ellipse cx="13" cy="9.5" rx="1.6" ry="1.1" fill="${c}"/><ellipse cx="15" cy="2.5" rx="1" ry="0.7" fill="${c}"/></pattern>`;
    const drips = (color, n, maxLen, seed) => {
      let r = seed;
      const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
      let d = `<path d="M20,60 A280,60 0 0 0 580,60" fill="none" stroke="${color}" stroke-width="12"/>`;
      for (let i = 0; i < n; i++) {
        const x = 40 + (i + rnd() * 0.6) * (520 / n);
        const y = frontY(x) - 4;
        const w = 12 + rnd() * 14;
        const L = 14 + rnd() * maxLen;
        d += `<path d="M${x - w / 2},${y} L${x - w / 2},${y + L} A${w / 2},${w / 2} 0 0 0 ${x + w / 2},${y + L} L${x + w / 2},${y} Z" fill="${color}"/>`;
        d += `<path d="M${x - w / 4},${y + 4} L${x - w / 4},${y + L - 2}" stroke="rgba(255,255,255,0.35)" stroke-width="2.5" stroke-linecap="round"/>`;
      }
      return d;
    };
    const gloss = `<path d="M70,${60 + t * 0.35} A250,52 0 0 0 200,${60 + t * 0.35 + 34}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="5" stroke-linecap="round"/>`;
    let defs = "";
    let body = "";
    if (kind === "plate") {
      defs = grad(`s${id}`, [[0, "#c9cfd4"], [0.5, "#ffffff"], [1, "#c2c9ce"]]) + radial(`t${id}`, "#ffffff", "#e3e8ea") + `<filter id="b${id}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>`;
      body = `<ellipse cx="305" cy="${72 + t}" rx="300" ry="54" fill="rgba(61,4,5,0.28)" filter="url(#b${id})"/>
        <path d="M0,60 L0,${60 + t} A300,64 0 0 0 600,${60 + t} L600,60 Z" fill="url(#s${id})"/>
        <ellipse cx="300" cy="60" rx="300" ry="64" fill="url(#t${id})"/>
        <ellipse cx="300" cy="60" rx="250" ry="50" fill="none" stroke="#d7dde1" stroke-width="2"/>`;
      return `<svg viewBox="-10 -10 620 ${H + 30}" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
    }
    let seed = kind.length * 97 + t;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const band = (y0, h, color) => `<path d="M20,${y0} L20,${y0 + h} A280,60 0 0 0 580,${y0 + h} L580,${y0} A280,60 0 0 1 20,${y0} Z" fill="${color}"/>`;
    const sideShade = `<path d="${side}" fill="url(#v${id})"/>`;
    defs += grad(`v${id}`, [[0, "rgba(0,0,0,0.28)"], [0.16, "rgba(0,0,0,0)"], [0.62, "rgba(255,255,255,0.10)"], [0.86, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.3)"]]);
    if (kind === "sponge" || kind === "choco") {
      const choco = kind === "choco";
      defs += grad(`s${id}`, choco ? [[0, "#3a1d11"], [0.5, "#6e3d27"], [1, "#3a1d11"]] : [[0, "#d8a052"], [0.5, "#f6d592"], [1, "#d39a4d"]])
        + radial(`t${id}`, choco ? "#6a3a25" : "#fbe4ae", choco ? "#4a2617" : "#eec27a")
        + pores(`p${id}`, choco ? "rgba(25,10,4,0.28)" : "rgba(176,110,42,0.2)")
        + `<pattern id="c${id}" width="9" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(23) scale(1.3 0.8)"><circle cx="2" cy="2" r="0.9" fill="${choco ? "rgba(255,220,190,0.12)" : "rgba(255,255,255,0.45)"}"/><circle cx="6.5" cy="5" r="0.7" fill="${choco ? "rgba(20,8,3,0.4)" : "rgba(180,115,45,0.35)"}"/></pattern>`;
      const crust = choco ? "#2b140a" : "#b9762f";
      body = `<path d="${side}" fill="url(#s${id})"/><path d="${side}" fill="url(#p${id})"/><path d="${side}" fill="url(#c${id})"/>
        ${band(60, 7, crust)}${band(60 + t - 7, 7, crust)}${sideShade}
        <ellipse cx="300" cy="60" rx="280" ry="60" fill="url(#t${id})"/><ellipse cx="300" cy="60" rx="280" ry="60" fill="url(#p${id})"/><ellipse cx="300" cy="60" rx="280" ry="60" fill="url(#c${id})"/>
        <ellipse cx="300" cy="60" rx="272" ry="56" fill="none" stroke="${crust}" stroke-width="7" opacity="0.85"/>`;
      if (choco) {
        body += `<ellipse cx="300" cy="60" rx="262" ry="52" fill="url(#g${id})"/>
          <path d="M150,48 C220,28 380,28 460,50" fill="none" stroke="rgba(255,235,220,0.45)" stroke-width="5" stroke-linecap="round"/>
          <path d="M210,74 C270,84 340,84 400,74" fill="none" stroke="rgba(255,235,220,0.18)" stroke-width="4" stroke-linecap="round"/>`;
        defs += `<radialGradient id="g${id}" cx="0.45" cy="0.35" r="0.75"><stop offset="0" stop-color="#5a2a17"/><stop offset="0.7" stop-color="#3b1a0d"/><stop offset="1" stop-color="#2c1208"/></radialGradient>`;
      }
    } else if (kind === "cream") {
      defs += grad(`s${id}`, [[0, "#b9d2df"], [0.22, "#e3f0f4"], [0.5, "#fbfeff"], [0.8, "#e0eef3"], [1, "#b4ceda"]]) + radial(`t${id}`, "#ffffff", "#d6e8ef")
        + `<pattern id="m${id}" width="26" height="${t}" patternUnits="userSpaceOnUse"><rect width="2" height="${t}" fill="rgba(255,255,255,0.55)"/><rect x="11" width="1.5" height="${t}" fill="rgba(90,130,160,0.18)"/></pattern>`;
      let spiral = "M300,60";
      for (let i = 1; i <= 90; i++) {
        const a = i * 0.21;
        const r = i * 2.9;
        spiral += ` L${(300 + Math.cos(a) * r).toFixed(1)},${(60 + Math.sin(a) * r * 0.21).toFixed(1)}`;
      }
      let border = "";
      for (let i = 0; i <= 30; i++) {
        const bx = 24 + (i / 30) * 552;
        const by = frontY(bx);
        border += `<circle cx="${bx.toFixed(1)}" cy="${(by - 2).toFixed(1)}" r="11" fill="url(#k${id})"/>`;
      }
      defs += `<radialGradient id="k${id}" cx="0.4" cy="0.3" r="0.75"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#e3f0f5"/><stop offset="1" stop-color="#b3cddb"/></radialGradient>`;
      body = `<path d="${side}" fill="url(#s${id})"/><path d="${side}" fill="url(#m${id})"/>${sideShade}
        <ellipse cx="300" cy="60" rx="280" ry="60" fill="url(#t${id})"/>${border}
        <path d="${spiral}" fill="none" stroke="rgba(150,185,205,0.55)" stroke-width="2.4"/>
        <path d="M110,48 C200,26 390,26 490,52" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="4" stroke-linecap="round"/>`;
    } else if (kind === "berry") {
      defs += grad(`s${id}`, [[0, "#4a0405"], [0.3, "#8f1418"], [0.55, "#bd2a30"], [1, "#4f0506"]]) + radial(`t${id}`, "#c9343e", "#7a0c10")
        + `<radialGradient id="r${id}" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#ff8a9b"/><stop offset="0.55" stop-color="#dc3049"/><stop offset="1" stop-color="#8e1023"/></radialGradient>`
        + `<radialGradient id="u${id}" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#7f86c4"/><stop offset="0.6" stop-color="#3a3f74"/><stop offset="1" stop-color="#1f2244"/></radialGradient>`;
      const rasp = (x, y, r) => {
        let g = "";
        const pts = [[0, 0], [-0.55, -0.2], [0.55, -0.2], [-0.3, 0.45], [0.3, 0.45], [0, -0.6], [-0.6, 0.35], [0.6, 0.35]];
        for (const [px, py] of pts) g += `<circle cx="${(x + px * r).toFixed(1)}" cy="${(y + py * r * 0.8).toFixed(1)}" r="${(r * 0.42).toFixed(1)}" fill="url(#r${id})"/>`;
        return g + `<circle cx="${x - r * 0.35}" cy="${y - r * 0.55}" r="${r * 0.14}" fill="rgba(255,255,255,0.8)"/>`;
      };
      let fruit = "";
      for (let i = 0; i < 22; i++) {
        const ang = rnd() * Math.PI * 2;
        const rad = Math.sqrt(rnd()) * 0.84;
        const bx = 300 + Math.cos(ang) * 250 * rad;
        const by = 60 + Math.sin(ang) * 50 * rad;
        if (rnd() < 0.25) {
          const br = 9 + rnd() * 3;
          fruit += `<circle cx="${bx}" cy="${by - br * 0.4}" r="${br}" fill="url(#u${id})"/><circle cx="${bx - 2}" cy="${by - br * 0.9}" r="${br * 0.5}" fill="rgba(255,255,255,0.35)"/>`;
        } else fruit += rasp(bx, by - 8, 13 + rnd() * 5);
      }
      body = `<path d="${side}" fill="url(#s${id})"/>${drips("#7a0b10", 9, 22, 21)}${sideShade}${gloss}
        <ellipse cx="300" cy="60" rx="280" ry="60" fill="url(#t${id})"/>
        <path d="M120,50 C220,30 380,30 470,52" fill="none" stroke="rgba(255,190,200,0.4)" stroke-width="5" stroke-linecap="round"/>${fruit}`;
    } else if (kind === "top") {
      defs += grad(`s${id}`, [[0, "#e9b3bf"], [0.22, "#f8d5dc"], [0.5, "#fff3f5"], [0.8, "#f6cfd8"], [1, "#e2a9b6"]]) + radial(`t${id}`, "#fffafb", "#f6d3db")
        + `<radialGradient id="q${id}" cx="0.4" cy="0.3" r="0.75"><stop offset="0" stop-color="#ffffff"/><stop offset="0.65" stop-color="#fbe1e6"/><stop offset="1" stop-color="#e3a6b4"/></radialGradient>`;
      let back = "", front = "";
      for (let i = 0; i < 18; i++) {
        const ang = (i / 18) * Math.PI * 2;
        const rx = 300 + Math.cos(ang) * 250;
        const ry = 60 + Math.sin(ang) * 46;
        const size = 16 + (Math.sin(ang) + 1) * 4.5;
        const cy = ry - size * 0.55;
        const ros = `<circle cx="${rx}" cy="${cy}" r="${size}" fill="url(#q${id})"/>
          <path d="M${rx - size * 0.7},${cy + size * 0.1} a${size * 0.7},${size * 0.55} 0 1 1 ${size * 1.2},${-size * 0.25} a${size * 0.45},${size * 0.35} 0 1 1 ${-size * 0.75},${size * 0.05}" fill="none" stroke="rgba(214,140,160,0.55)" stroke-width="1.8"/>`;
        if (Math.sin(ang) < 0) back += ros; else front += ros;
      }
      let sprinkles = "";
      for (let i = 0; i < 40; i++) {
        const ang = rnd() * Math.PI * 2;
        const rad = Math.sqrt(rnd()) * 0.7;
        sprinkles += `<circle cx="${(300 + Math.cos(ang) * 250 * rad).toFixed(1)}" cy="${(60 + Math.sin(ang) * 46 * rad).toFixed(1)}" r="${(1.6 + rnd() * 1.6).toFixed(1)}" fill="${rnd() < 0.7 ? "#d8b46a" : "#ffffff"}"/>`;
      }
      body = `<path d="${side}" fill="url(#s${id})"/>${sideShade}<g class="x-cut__drip">${drips("#6d0809", 13, 34, 13)}</g><ellipse cx="300" cy="60" rx="280" ry="60" fill="url(#t${id})"/>${sprinkles}${back}${front}`;
    }
    return `<svg viewBox="0 0 600 ${H}" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
  }

  // Every step card carries one of the cakes in the catalogue right now: one cake per step, never the whole catalogue.
  // Whole cut-outs come first (a cropped one would show its cut edge on the card's corner), then the other cut-outs,
  // then a cake that only has its photo, framed
  const STEP_CROPPED = ["berries", "slice", "strawslice", "tiramisu", "meringue"];
  function stepCakes(sec) {
    const cards = $$(".x-cut__card", sec);
    const all = window.MARIDAY?.cakes || [];
    const rank = (c) => (MARIDAY.cutout(c) ? (c.cutout || !STEP_CROPPED.includes(c.img) ? 0 : 1) : 2);
    const picks = [0, 1, 2].flatMap((r) => all.filter((c) => rank(c) === r)).slice(0, cards.length);
    picks.forEach((c, k) => {
      const photo = rank(c) === 2;
      const img = new Image();
      img.className = `x-cut__thumb${photo ? " is-photo" : ""}`;
      img.loading = "lazy";
      img.draggable = false;
      img.alt = c.name || "";
      img.src = photo ? MARIDAY.img(c.img) : MARIDAY.cutout(c);
      $(".x-cut__n", cards[k]).after(img);
    });
  }

  // ─── Phones: the cake isn't taken apart, it is built in front of you. Each layer drops onto the plate in turn and
  // lands with its own little scene (crumbs and a puff of flour, a piping bag piping the cream on, a rain of berries
  // with a couple rolling off, a heavy chocolate thud with shavings, glaze running down and cherries on top), while
  // the card above swaps to that layer and one of the catalogue cakes hops up out of it. A dashed outline shows the
  // cake to be; the finale throws confetti and brings in the button.
  const BUILD_NOTE = { sponge: "м'який і вологий", cream: "ніжний, але тримає форму", berry: "та сама кислинка ♡", choco: "обирайте свій смак", top: "вишенька на торті" };
  const cutFront = (x) => 60 + 60 * Math.sqrt(Math.max(0, 1 - ((x - 300) / 280) ** 2)); // front edge of a layer's top
  const BAG_SVG = `<svg class="fx-bag" viewBox="0 0 120 210"><defs>
    <linearGradient id="xcb-bag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3a7b8"/><stop offset="0.45" stop-color="#fde3ea"/><stop offset="1" stop-color="#e98aa1"/></linearGradient>
    <linearGradient id="xcb-tip" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa5ae"/><stop offset="0.5" stop-color="#f4f6f8"/><stop offset="1" stop-color="#8e99a3"/></linearGradient></defs>
    <path d="M30,30 Q60,14 92,30 L66,168 Q60,176 54,168 Z" fill="url(#xcb-bag)" stroke="rgba(109,8,9,0.25)" stroke-width="1.5"/>
    <path d="M44,40 Q58,90 58,150" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="3" stroke-linecap="round"/>
    <path d="M30,30 Q44,6 60,14 Q78,2 92,30 Q62,20 30,30 Z" fill="#e98aa1"/>
    <path d="M52,166 L68,166 L63,200 L57,200 Z" fill="url(#xcb-tip)"/><circle cx="60" cy="204" r="6" fill="#fbfeff"/></svg>`;

  // The phone's story cards (one per layer, read from the layer's own card) and the props of the build. All of it is
  // hidden on wider screens, where the cake comes apart instead.
  function cutStory(sec, cake, layers) {
    const story = document.createElement("div");
    story.className = "x-cut__story";
    layers.forEach((L) => {
      const card = $(".x-cut__card", L);
      if (!card) return;
      const kind = L.dataset.kind;
      const page = document.createElement("article");
      page.className = "x-cut__page";
      page.dataset.kind = kind;
      page.innerHTML = `<p class="x-cut__note"></p><div class="x-cut__ptxt"><strong></strong><p></p><ul class="x-cut__chips"></ul></div>`;
      $(".x-cut__note", page).textContent = BUILD_NOTE[kind] || "";
      $("strong", page).textContent = $(".x-cut__txt strong", card)?.textContent || "";
      $(".x-cut__ptxt p", page).textContent = $(".x-cut__txt p", card)?.textContent || "";
      $$(".x-cut__chips li", card).forEach((li) => $("ul", page).append(li.cloneNode(true)));
      const thumb = $(".x-cut__thumb", card);
      if (thumb) {
        const img = thumb.cloneNode();
        img.className = `x-cut__pcake${thumb.classList.contains("is-photo") ? " is-photo" : ""}`;
        img.loading = "eager";
        page.append(img);
      }
      story.append(page);
    });
    $(".x-cut__head", sec).after(story);

    // the cake to be, as a dashed outline from the sponge's foot to the glaze's top
    const total = layers.reduce((s, L) => s + CAKE_T[L.dataset.kind], 0) + 120;
    const foot = total - CAKE_T[layers[0].dataset.kind] - 60;
    cake.insertAdjacentHTML("afterbegin", `<svg class="x-cut__ghost" viewBox="0 0 600 ${total}" aria-hidden="true"><path d="M20,60 L20,${foot} A280,60 0 0 0 580,${foot} L580,60"/><ellipse cx="300" cy="60" rx="280" ry="60"/></svg>`);

    // each layer's props sit in a box of their own right above it (not inside it, so they don't repaint its shadow)
    let seed = 11;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    layers.forEach((L) => {
      const kind = L.dataset.kind;
      const H = CAKE_T[kind] + 120;
      const at = (x, y) => `left:${(x / 6).toFixed(2)}%;top:${((y / H) * 100).toFixed(2)}%`;
      let html = "";
      if (kind === "sponge") {
        for (let i = 0; i < 12; i++) html += `<i class="fx-crumb" style="${at(150 + rnd() * 300, H - 4 - rnd() * 12)};--s:${(3 + rnd() * 4).toFixed(1)}px"></i>`;
        html += `<i class="fx-puff" style="${at(40, H - 12)}"></i><i class="fx-puff" style="${at(560, H - 12)}"></i>`;
      } else if (kind === "cream") html = BAG_SVG;
      else if (kind === "berry") {
        const spots = [[72, 66, -1], [528, 66, 1]];
        for (let i = 0; i < 7; i++) {
          const a = rnd() * Math.PI * 2, r = 0.2 + Math.sqrt(rnd()) * 0.55;
          spots.push([300 + Math.cos(a) * 250 * r, 60 + Math.sin(a) * 46 * r, 0]);
        }
        spots.forEach(([x, y, roll], i) => (html += `<i class="fx-berry${i % 3 === 2 ? " is-blue" : ""}" style="${at(x, y)}"${roll ? ` data-roll="${roll}"` : ""}></i>`));
      } else if (kind === "choco") {
        for (let i = 0; i < 9; i++) html += `<i class="fx-shave" style="${at(300 + (rnd() - 0.5) * 70, 60 + (rnd() - 0.5) * 20)};--r:${Math.round(rnd() * 180)}deg"></i>`;
      } else if (kind === "top") {
        const tones = ["#d8b46a", "#ffffff", "#f5bcc8", "#e9c77e"];
        for (let i = 0; i < 16; i++) html += `<i class="fx-spark" style="${at(300 + (rnd() - 0.5) * 90, 44)};--c:${tones[i % 4]}"></i>`;
      }
      if (!html) return;
      L.insertAdjacentHTML("afterend", `<div class="x-cut__fx" aria-hidden="true" style="bottom:${L.style.bottom};z-index:${L.style.zIndex};aspect-ratio:600/${H}">${html}</div>`);
    });
    const tones = ["#6d0809", "#f5bcc8", "#d8b46a", "#ffffff", "#c9506d", "#9cc9c3"];
    let party = "";
    for (let i = 0; i < 24; i++) party += `<i style="--c:${tones[i % tones.length]};--h:${6 + (i % 3) * 3}px"></i>`;
    cake.insertAdjacentHTML("beforeend", `<div class="x-cut__party" aria-hidden="true">${party}</div>`);
  }

  // One paused timeline holds the whole build, with a label after every layer; scrolling picks the label to reach and
  // the timeline plays there in real time (faster when several layers are skipped, quicker still backwards), so each
  // landing keeps its bounce however the page is scrolled. The sponge lands as the section arrives, the rest while
  // it is pinned. Returns the cleanup for gsap.matchMedia.
  function cutBuild(sec, cake, layers) {
    const pin = $(".x-cut__pin", sec);
    const pages = $$(".x-cut__page", sec);
    const hint = $(".x-cut__hint", sec);
    const fin = $(".x-cut__final", sec);
    const facts = $(".x-cut__facts", sec);
    const fxOf = (L) => (L.nextElementSibling?.classList.contains("x-cut__fx") ? L.nextElementSibling : null);
    const fx = (L, s) => (fxOf(L) ? $$(s, fxOf(L)) : []);
    const cream = layers.find((L) => L.dataset.kind === "cream");
    const creamSvg = cream && $("svg", cream);
    let seed = 5;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

    gsap.set([cake, ...layers], { transformOrigin: "50% 100%" });
    gsap.set(layers.slice(1).filter((L) => L !== cream), { y: () => -innerHeight, autoAlpha: 0 });
    gsap.set([...pages, fin, facts, ...$$(".x-cut__fx > *, .x-cut__party > *", sec)].filter(Boolean), { autoAlpha: 0 });
    gsap.set($$(".x-cut__note", sec), { clipPath: "inset(0% 100% 0% 0%)" });
    gsap.set($$(".x-cut__page .x-cut__chips li", sec), { autoAlpha: 0, scale: 0 });
    gsap.set($$(".x-cut__pcake", sec), { autoAlpha: 0 });
    const drip = $(".x-cut__drip", sec);
    if (drip) gsap.set(drip, { scaleY: 0, transformOrigin: "50% 0%" });
    const cherries = $(".x-cut__cherries", sec);
    if (cherries) gsap.set(cherries, { autoAlpha: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.addLabel("s0", 0);
    let shown = null;
    // the card for a layer: the last one leaves, this one swings in, its note is written on, the chips pop and the
    // catalogue cake hops up out of its corner
    const turn = (L, at) => {
      if (shown) tl.to(shown, { autoAlpha: 0, y: -16, scale: 0.96, duration: 0.25, ease: "power2.in" }, at);
      const p = pages.find((pg) => pg.dataset.kind === L.dataset.kind);
      shown = p || null;
      if (!p) return;
      const k = pages.indexOf(p);
      const tilt = k % 2 ? 1.2 : -1.2;
      tl.fromTo(p, { autoAlpha: 0, y: 30, scale: 0.92, rotation: tilt * 3 }, { autoAlpha: 1, y: 0, scale: 1, rotation: tilt, duration: 0.55, ease: "back.out(1.7)", immediateRender: false }, at + 0.12)
        .to($(".x-cut__note", p), { clipPath: "inset(0% 0% 0% 0%)", duration: 0.45, ease: "power2.out" }, at + 0.34)
        .to($$(".x-cut__chips li", p), { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(2.6)", stagger: 0.07 }, at + 0.46);
      const img = $(".x-cut__pcake", p);
      if (img) {
        tl.set(img, { autoAlpha: 1 }, at + 0.5)
          .fromTo(img, { y: 50, scale: 0.4, rotation: -tilt * 10 }, { y: 0, scale: 1, rotation: tilt * 5, duration: 0.6, ease: "back.out(2.2)", immediateRender: false }, at + 0.5);
      }
    };
    // a layer falls from a screen above, squashes as it lands and springs back; the whole cake gives a little under it
    const land = (L, at, heavy) => {
      const d = heavy ? 0.36 : 0.46;
      tl.set(L, { autoAlpha: 1 }, at)
        .to(L, { y: 0, duration: d, ease: "power2.in" }, at)
        .fromTo(L, { rotation: rnd() < 0.5 ? -7 : 7 }, { rotation: 0, duration: d, ease: "power1.out", immediateRender: false }, at)
        .to(L, { scaleY: heavy ? 0.74 : 0.84, scaleX: heavy ? 1.09 : 1.05, duration: 0.08, ease: "power1.out" }, at + d)
        .to(L, { scaleY: 1, scaleX: 1, duration: 0.7, ease: "elastic.out(1.2, 0.32)" }, at + d + 0.08)
        .to(cake, { scaleY: heavy ? 0.95 : 0.975, duration: 0.08, ease: "power1.out" }, at + d)
        .to(cake, { scaleY: 1, duration: 0.5, ease: "elastic.out(1, 0.35)" }, at + d + 0.08);
      return at + d;
    };
    // bits thrown up from a point that come down again: up to dy at the top of the arc, then down to land
    const toss = (el, at, dx, dy, land, spin) => {
      tl.set(el, { autoAlpha: 1, x: 0, y: 0, rotation: 0 }, at)
        .to(el, { keyframes: [{ x: dx * 0.55, y: dy, rotation: spin / 2, duration: 0.24, ease: "power2.out" }, { x: dx, y: land, rotation: spin, duration: 0.32, ease: "power2.in" }] }, at);
    };
    const SCENE = {
      sponge(L, hit) {
        fx(L, ".fx-crumb").forEach((c) => {
          const dir = parseFloat(c.style.left) < 50 ? -1 : 1;
          toss(c, hit, dir * (26 + rnd() * 60), -(18 + rnd() * 34), 8 + rnd() * 10, dir * 240);
          tl.to(c, { autoAlpha: 0, duration: 0.3 }, hit + 0.8);
        });
        fx(L, ".fx-puff").forEach((pf) => {
          tl.set(pf, { autoAlpha: 0.9, scale: 0.3 }, hit).to(pf, { autoAlpha: 0, scale: 2, duration: 0.75, ease: "power2.out" }, hit);
        });
        return hit + 0.9;
      },
      berry(L, hit) {
        const bs = fx(L, ".fx-berry");
        bs.forEach((b, i) => {
          const at = hit + 0.04 + i * 0.05;
          tl.set(b, { autoAlpha: 1 }, at)
            .fromTo(b, { y: -(180 + rnd() * 120), rotation: rnd() * 180 - 90 }, { y: 0, rotation: 0, duration: 0.62, ease: "bounce.out", immediateRender: false }, at);
        });
        // the two at the edges bounce off and roll down the side to the plate
        bs.filter((b) => b.dataset.roll).forEach((b) => {
          const dir = +b.dataset.roll;
          tl.to(b, { x: () => dir * cake.offsetWidth * 0.05, y: () => cake.offsetHeight - fxOf(L).offsetTop - b.offsetTop - cake.offsetWidth * 0.07, rotation: dir * 420, duration: 0.5, ease: "power2.in" }, hit + 0.8);
        });
        return hit + 1.35;
      },
      choco(L, hit) {
        tl.to(cake, { keyframes: { x: [0, -6, 6, -4, 3, 0], easeEach: "none" }, duration: 0.36 }, hit);
        fx(L, ".fx-shave").forEach((s) => {
          const dx = (rnd() - 0.5) * 150;
          toss(s, hit + 0.04, dx, -(34 + rnd() * 50), (rnd() - 0.5) * 16, (dx > 0 ? 1 : -1) * 300);
        });
        return hit + 0.95;
      },
      top(L, hit) {
        if (drip) tl.to(drip, { scaleY: 1, duration: 0.75, ease: "power2.out" }, hit + 0.02);
        if (cherries) {
          tl.set(cherries, { autoAlpha: 1 }, hit + 0.3)
            .fromTo(cherries, { y: -240, rotation: 50 }, { y: 0, rotation: -8, duration: 0.65, ease: "bounce.out", immediateRender: false }, hit + 0.3);
        }
        fx(L, ".fx-spark").forEach((s) => {
          const a = -Math.PI * (0.08 + 0.84 * rnd()), r = 50 + rnd() * 100;
          toss(s, hit + 0.45, Math.cos(a) * r, Math.sin(a) * r, Math.sin(a) * r + 50, rnd() * 360);
          tl.to(s, { autoAlpha: 0, duration: 0.25 }, hit + 1.05);
        });
        return hit + 1.3;
      },
    };
    // the cream isn't dropped: a piping bag comes in and pipes it on from left to right along its front edge
    const pipe = (L, at) => {
      const bag = fx(L, ".fx-bag")[0];
      const H = CAKE_T.cream + 120;
      const pp = { p: 0 };
      const put = () => {
        const xu = 20 + 560 * pp.p;
        if (bag) {
          bag.style.left = `${xu / 6}%`;
          bag.style.top = `${((cutFront(xu) - 3) / H) * 100}%`;
        }
        creamSvg.style.clipPath = `inset(0% ${(100 - pp.p * 100).toFixed(2)}% 0% 0%)`;
      };
      put();
      if (bag) {
        tl.set(bag, { autoAlpha: 1 }, at)
          .fromTo(bag, { x: 150, y: -150, rotation: 30 }, { x: 0, y: 0, rotation: -8, duration: 0.36, ease: "power2.out", immediateRender: false }, at)
          .to(bag, { rotation: -24, duration: 0.85, ease: "sine.inOut" }, at + 0.34)
          .to(bag, { x: 140, y: -180, rotation: 26, autoAlpha: 0, duration: 0.36, ease: "power2.in" }, at + 1.2);
      }
      tl.to(pp, { p: 1, duration: 0.85, ease: "sine.inOut", onUpdate: put }, at + 0.34);
      return at + 1.5;
    };

    let t = 0;
    layers.slice(1).forEach((L, i) => {
      const kind = L.dataset.kind;
      const at = t;
      turn(L, at);
      if (i === 1 && hint) tl.to(hint, { autoAlpha: 0, duration: 0.3 }, at);
      let end;
      if (L === cream) end = pipe(L, at + 0.05);
      else {
        const hit = land(L, at + 0.05, kind === "choco");
        end = SCENE[kind] ? SCENE[kind](L, hit) : hit + 0.7;
      }
      // the label waits for the last bit of the step to settle (crumbs fading, sparks falling)
      t = Math.max(end, tl.duration(), at + 1.1);
      tl.addLabel(`s${i + 1}`, t);
    });
    // finale: the last card goes, the caption and button come in, the cake hops and throws confetti, facts pop up
    const ft = t;
    if (shown) tl.to(shown, { autoAlpha: 0, y: -16, scale: 0.96, duration: 0.25, ease: "power2.in" }, ft);
    if (fin) tl.fromTo(fin, { autoAlpha: 0, y: 26, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.7)", immediateRender: false }, ft + 0.15);
    tl.to(".x-cut__ghost", { autoAlpha: 0, duration: 0.3 }, ft)
      .to(cake, { keyframes: [{ y: -18, duration: 0.2, ease: "power2.out" }, { y: 0, duration: 0.55, ease: "bounce.out" }] }, ft + 0.05);
    $$(".x-cut__party > i", sec).forEach((c) => {
      const a = -Math.PI * (0.06 + 0.88 * rnd()), r = 90 + rnd() * 150;
      const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
      tl.set(c, { autoAlpha: 1, x: 0, y: 0 }, ft + 0.12)
        .to(c, { keyframes: [{ x: dx, y: dy, rotation: rnd() * 360, duration: 0.42, ease: "power2.out" }, { x: dx * 1.2, y: dy + 140 + rnd() * 90, rotation: 360 + rnd() * 360, duration: 0.9, ease: "power1.in" }] }, ft + 0.12)
        .to(c, { autoAlpha: 0, duration: 0.3 }, ft + 1.15);
    });
    if (facts) {
      tl.set(facts, { autoAlpha: 1 }, ft + 0.35)
        .fromTo(facts.children, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(2)", stagger: 0.08, immediateRender: false }, ft + 0.35);
    }
    tl.addLabel(`s${layers.length}`, Math.max(tl.duration(), ft + 1.5));

    // pin progress at which each later layer, then the finale, comes in
    const steps = layers.length - 1;
    const marks = Array.from({ length: steps }, (_, j) => 0.06 + (j * 0.76) / (steps - 1));
    let goal = 0, run = null;
    const want = (k) => {
      if (k === goal) return;
      const n = Math.abs(k - goal);
      goal = k;
      run?.kill();
      const to = tl.labels[`s${k}`], now = tl.time();
      run = gsap.to(tl, { time: to, duration: Math.abs(to - now) / (to < now ? 2.5 : n > 1 ? n * 1.2 : 1), ease: "none" });
    };
    const pinST = ScrollTrigger.create({ trigger: sec, start: "top top", end: "+=250%", pin, anticipatePin: 1 });
    let intro = null;
    const sync = () => {
      if (!intro) return;
      const y = pinST.scroll();
      if (y < intro.start) return want(0);
      if (y < pinST.start) return want(1);
      const p = (y - pinST.start) / Math.max(1, pinST.end - pinST.start);
      want(1 + marks.filter((v) => p >= v).length);
    };
    intro = ScrollTrigger.create({ trigger: sec, start: "top 30%", end: () => pinST.end, onUpdate: sync, onToggle: sync, onRefresh: sync });
    sync();
    return () => {
      run?.kill();
      if (creamSvg) creamSvg.style.clipPath = "";
    };
  }

  function cutCake() {
    const sec = $(".x-cut");
    if (!sec) return;
    const cake = $(".x-cut__cake", sec);
    const layers = $$(".x-cut__layer", sec);
    let bottom = 0;
    layers.forEach((L, k) => {
      const kind = L.dataset.kind;
      L.insertAdjacentHTML("afterbegin", cakeLayerSVG(kind));
      L.style.zIndex = k + 1;
      L.style.bottom = `calc(var(--w) * ${bottom} / 600)`;
      bottom += CAKE_T[kind];
    });
    cake.style.height = `calc(var(--w) * ${bottom + 120} / 600)`;
    const priceEl = $("[data-min-price]", sec);
    if (priceEl && window.MARIDAY?.cakes?.length) priceEl.textContent = `€${Math.min(...MARIDAY.cakes.map((c) => c.price))}`;
    stepCakes(sec);
    cutStory(sec, cake, layers);
    // without the animation libraries the phone simply lists the cards under the built cake
    if (!hasLibs) return sec.classList.add("is-still");

    const W = () => cake.offsetWidth;
    const gap = () => W() * (innerWidth < 760 ? 0.22 : 0.18);
    const labels = layers.map((L) => $(".x-cut__label", L));
    const explode = (L, k) => ({ y: -k * gap(), x: 0, rotation: 0 });

    // Assembled cake is shown big and centred; it shrinks to make room while the layers fly apart
    const stage = $(".x-cut__stage", sec);
    const hero = () => {
      const hs = stage.clientHeight;
      const ch = cake.offsetHeight;
      const mb = parseFloat(getComputedStyle(cake).marginBottom) || 0;
      // on phones the closing caption sits under the cake, so the cake is centred in the band above it
      const fin = $(".x-cut__final", sec);
      const band = matchMedia("(max-width: 760px)").matches ? fin.offsetTop - stage.offsetTop - 16 : hs;
      const sc = Math.min(1.45, (band * 0.78) / ch, (stage.clientWidth * 0.96) / cake.offsetWidth);
      return { scale: sc, y: band / 2 + (ch * sc) / 2 - (hs - mb) };
    };

    // Cards hang off their layers but are spread down each side of the exploded cake so none overlap; each wire
    // bends from its layer to its card's seal. Garnish is then nudged clear of the cards, the cake and the captions.
    const garnish = $$(".x-cut__garnish > *", sec);
    const spread = () => {
      const cards = labels.map((l) => l && $(".x-cut__card", l));
      sec.classList.remove("is-snug", "is-tight", "is-tighter");
      cards.forEach((c) => c && (c.style.marginTop = ""));
      garnish.forEach((el) => { el.style.margin = ""; el.style.visibility = ""; });
      const g = gap(), w = W(), cx = cake.offsetLeft, cy = cake.offsetTop;
      const lo = 6 - cy, hi = stage.clientHeight - cy - 6; // stage edges in cake coordinates
      const SEAL = 30, AIR = 14; // the seal pokes out above a card; air between two cards
      // a card's cake stands up out of its top corner: that much room is kept clear of the card above it, so no card
      // ever covers a cake (its box plus a little for the tilt; a cake hidden on tablets takes no room). The cakes get
      // a little smaller on short screens, so it is measured again for each fallback
      const overOf = (c) => {
        const t = c && $(".x-cut__thumb", c);
        return t && t.offsetParent ? Math.max(SEAL, 8 - t.offsetTop) : SEAL;
      };
      let over = cards.map(overOf);
      const busy = [];
      // phones show the cards as pills on the layers themselves, so only the garnish needs placing there
      if (!matchMedia("(max-width: 760px)").matches) {
        const sideKs = (s) => labels.map((l, k) => k).filter((k) => labels[k]?.classList.contains(`x-cut__label--${s}`)).reverse();
        const off = [];
        for (const mode of ["", "is-snug", "is-tight", "is-tighter"]) {
          if (mode) sec.classList.add(mode);
          over = cards.map(overOf);
          let fits = true;
          for (const ks of [sideKs("r"), sideKs("l")]) {
            const pin = ks.map((k) => layers[k].offsetTop + layers[k].offsetHeight / 2 - k * g);
            const h = ks.map((k) => cards[k].offsetHeight);
            const t = pin.map((p, i) => p - h[i] / 2);
            const o = ks.map((k) => over[k]);
            for (let i = 0; i < t.length; i++) t[i] = Math.max(t[i], i ? t[i - 1] + h[i - 1] + o[i] + AIR : lo + o[0]);
            const z = t.length - 1;
            if (t[z] + h[z] > hi) {
              t[z] = hi - h[z];
              for (let i = z - 1; i >= 0; i--) t[i] = Math.min(t[i], t[i + 1] - AIR - o[i + 1] - h[i]);
            }
            if (t[0] < lo + o[0]) fits = false;
            ks.forEach((k, i) => (off[k] = t[i] - pin[i]));
          }
          if (fits) break;
      }
      labels.forEach((l, k) => {
        if (!l) return;
        const card = cards[k];
        const wire = $(".x-cut__wire", l);
        card.style.marginTop = `${off[k]}px`;
        const ww = parseFloat(getComputedStyle(wire).width), end = off[k] + 4, top = Math.min(0, end) - 6, hh = Math.abs(end) + 12;
        const y0 = -top, y1 = end - top;
        wire.style.marginTop = `${top}px`;
        wire.style.height = `${hh}px`;
        wire.setAttribute("viewBox", `0 0 ${ww} ${hh}`);
        $("path", wire).setAttribute("d", `M2,${y0} C${ww * 0.55},${y0} ${ww * 0.45},${y1} ${ww},${y1}`);
        $("circle", wire).setAttribute("cy", y0);
        const x = cx + layers[k].offsetLeft + l.offsetLeft + card.offsetLeft;
        const y = cy + layers[k].offsetTop - k * g + l.offsetTop + card.offsetTop;
        busy.push({ x: x - 44, y: y - over[k], w: card.offsetWidth + 88, h: card.offsetHeight + over[k] });
      });
      }
      const n = layers.length;
      const topY = cy + layers[n - 1].offsetTop - (n - 1) * g - w * 0.14;
      busy.push({ x: cx - 10, y: topY, w: w + 20, h: cy + cake.offsetHeight - topY });
      if (!reduce) {
        const { scale: s, y: hy } = hero();
        const bot = cy + cake.offsetHeight + hy;
        busy.push({ x: cx + w / 2 - (w * s) / 2 - 10, y: bot - cake.offsetHeight * s - w * s * 0.14, w: w * s + 20, h: cake.offsetHeight * s + w * s * 0.14 });
      }
      $$(".x-cut__head, .x-cut__final, .x-cut__facts", sec).forEach((el) => busy.push({ x: el.offsetLeft - stage.offsetLeft, y: el.offsetTop - stage.offsetTop, w: el.offsetWidth, h: el.offsetHeight }));
      const hit = (a) => busy.some((b) => a.x < b.x + b.w + 8 && b.x < a.x + a.w + 8 && a.y < b.y + b.h + 8 && b.y < a.y + a.h + 8);
      const sw = stage.clientWidth;
      garnish.forEach((el, i) => {
        const d = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 1;
        // where it ends up: lifted by 40·d and turned by i·25° (see the timeline), so test the turned box
        const a = (i * 25 * Math.PI) / 180, w0 = el.offsetWidth, h0 = el.offsetHeight || w0;
        const gw = Math.abs(w0 * Math.cos(a)) + Math.abs(h0 * Math.sin(a)), gh = Math.abs(w0 * Math.sin(a)) + Math.abs(h0 * Math.cos(a));
        const r0 = { x: el.offsetLeft + (w0 - gw) / 2, y: el.offsetTop - 40 * d + (h0 - gh) / 2, w: gw, h: gh };
        const dir = r0.x + gw / 2 < sw / 2 ? -1 : 1;
        for (const dy of [0, -40, 40, -80, 80, -120, 120]) {
          for (let dx = 0; dx <= sw / 2; dx += 16) {
            const r = { ...r0, x: r0.x + dir * dx, y: r0.y + dy };
            if (r.x < 0 || r.x + gw > sw) break;
            if (!hit(r)) {
              el.style.margin = `${dy}px 0 0 ${dir * dx}px`;
              busy.push(r);
              return;
            }
          }
        }
        el.style.visibility = "hidden";
      });
    };
    // phones build the cake up layer by layer (see cutBuild); wider screens take it apart
    const mm = gsap.matchMedia();
    mm.add("(max-width: 760px)", () => {
      if (!reduce) return cutBuild(sec, cake, layers);
      sec.classList.add("is-still");
      return () => sec.classList.remove("is-still");
    });
    mm.add("(min-width: 761px)", () => apart());

    function apart() {
      let live = true;
      spread();
      document.fonts?.ready.then(() => live && spread());

      if (reduce) {
        addEventListener("resize", spread);
        layers.forEach((L, k) => { if (k) gsap.set(L, explode(L, k)); });
        gsap.set(labels.filter(Boolean).map((l) => $(".x-cut__card", l)), { opacity: 1 });
        gsap.set(labels.filter(Boolean).map((l) => $(".x-cut__wire path", l)), { strokeDashoffset: 0 });
        gsap.set([".x-cut__final", ".x-cut__facts"], { opacity: 1 });
        gsap.set(labels.filter(Boolean).map((l) => $(".x-cut__wire", l)), { opacity: 1 });
        return () => { live = false; removeEventListener("resize", spread); };
      }

      ScrollTrigger.addEventListener("refreshInit", spread);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, start: "top top", end: "+=110%", pin: ".x-cut__pin", scrub: 0.6, invalidateOnRefresh: true },
      });
      const heroVars = { scale: () => hero().scale, y: () => hero().y };
      gsap.set(cake, { transformOrigin: "50% 100%" });
      tl.fromTo(cake, heroVars, { scale: 1, y: 0, duration: 0.45, ease: "power2.inOut", immediateRender: true }, 0);
      const n = layers.length;
      for (let k = n - 1; k >= 1; k--) {
        const at = 0.05 + (n - 1 - k) * 0.17;
        tl.to(layers[k], { y: () => explode(layers[k], k).y, x: () => explode(layers[k], k).x, rotation: explode(layers[k], k).rotation, duration: 1, ease: "power2.out" }, at);
        if (labels[k]) {
          const wire = $(".x-cut__wire path", labels[k]);
          const card = $(".x-cut__card", labels[k]);
          tl.set(wire.parentNode, { opacity: 1 }, at + 0.4)
            .fromTo(wire, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, at + 0.4)
            .fromTo(card, { opacity: 0, x: k % 2 ? -24 : 24, scale: 0.94 }, { opacity: 1, x: 0, scale: 1, duration: 0.45, ease: "back.out(1.6)" }, at + 0.55)
            .fromTo($(".x-cut__n", card), { scale: 0, rotation: -120 }, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(2.2)" }, at + 0.62);
          // the cake hops up out of the card (more steps than cakes in the catalogue leaves a card without one)
          const thumb = $(".x-cut__thumb", card);
          if (thumb) tl.fromTo(thumb, { y: 40, scale: 0.5, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)" }, at + 0.68);
        }
      }
      garnish.forEach((g, i) => {
        const d = parseFloat(getComputedStyle(g).getPropertyValue("--d")) || 1;
        tl.fromTo(g, { opacity: 0, scale: 0.3, y: 60 * d, rotation: -40 + i * 20 }, { opacity: 1, scale: 1, y: -40 * d, rotation: i * 25, duration: 1.4, ease: "power2.out" }, 0.3 + i * 0.08);
      });
      tl.to(".x-cut__hint", { opacity: 0, duration: 0.3 }, 0.2)
        .to({}, { duration: 0.2 })
        .addLabel("assemble")
        .to(labels.filter(Boolean).map((l) => $(".x-cut__card", l)), { opacity: 0, y: -10, duration: 0.3 }, "assemble")
        .to(labels.filter(Boolean).map((l) => $(".x-cut__wire", l)), { opacity: 0, duration: 0.25 }, "assemble")
        .to(cake, { ...heroVars, duration: 0.8, ease: "power3.inOut" }, "assemble+=0.15")
        .to(layers.slice(1), { y: 0, x: 0, rotation: 0, duration: 0.8, ease: "bounce.out", stagger: { each: 0.04, from: "start" } }, "assemble")
        .fromTo([".x-cut__final", ".x-cut__facts"], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }, "assemble+=0.5");
      return () => { live = false; ScrollTrigger.removeEventListener("refreshInit", spread); };
    }
  }

  // The manifesto's side walls: the cakes in the catalogue right now, dealt out to the two walls in turn, no captions.
  // Whole cut-outs first; cropped cut-outs, then framed photos, only when the catalogue runs short of whole ones
  function sideCakes(sec) {
    const walls = $$(".x-ing", sec);
    const all = window.MARIDAY?.cakes || [];
    const rank = (c) => (MARIDAY.cutout(c) ? (c.cutout || !STEP_CROPPED.includes(c.img) ? 0 : 1) : 2);
    let picks = [];
    for (let r = 0; r < 3 && picks.length < 4; r++) picks = picks.concat(all.filter((c) => rank(c) === r));
    picks.forEach((c, k) => {
      const photo = rank(c) === 2;
      const fig = document.createElement("figure");
      fig.className = "x-ing__item";
      const img = new Image();
      if (photo) img.className = "is-photo";
      if (k > 1) img.loading = "lazy";
      img.draggable = false;
      img.alt = c.name || "";
      img.src = photo ? MARIDAY.img(c.img) : MARIDAY.cutout(c);
      fig.appendChild(img);
      walls[k % walls.length].appendChild(fig);
    });
  }

  // Manifesto 1/3: letters (and cherries) fall, pile up and can be thrown around; then a piping bag writes in cream.
  // On a phone the pile is a stage: a catalogue cake stands on «МИ НЕ» under a beam and rides whatever its letters do.
  // A tap makes a letter jump, a sideways swipe throws it (vertical swipes still scroll), tilting the phone rolls cherries
  function dropLetters() {
    const sec = $(".x-drop");
    if (!sec) return;
    sideCakes(sec);
    const world = $(".x-drop__world", sec);
    const phoneMQ = matchMedia("(max-width: 760px)");
    let started = false;
    let visible = false;
    let stop = null;
    let builtW = 0;
    // -1…1: how far the phone leans sideways (deviceorientation gamma), 0 until motion is allowed
    let tilt = 0;
    let asked = false;
    // starts once a quarter of the section is in view, so even a visitor scrolling straight on sees the phrase land
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !started) {
        started = true;
        stop = start(true);
      }
    }, { threshold: 0.25 }).observe(sec);
    // a phone turned sideways gets the phrase dropped anew for its new width
    let rt = 0;
    addEventListener("resize", () => {
      if (!stop || Math.abs(sec.clientWidth - builtW) < 40) return;
      clearTimeout(rt);
      rt = setTimeout(() => { stop(); stop = start(false); }, 300);
    });
    // iOS asks for motion on the first tap in the section; elsewhere it simply starts
    const motion = () => {
      if (asked || !phoneMQ.matches || !window.DeviceOrientationEvent) return;
      asked = true;
      const listen = () => addEventListener("deviceorientation", (e) => {
        const g = e.gamma || 0;
        tilt = Math.abs(g) < 5 ? 0 : Math.max(-1, Math.min(1, (g - Math.sign(g) * 5) / 25));
      });
      if (typeof DeviceOrientationEvent.requestPermission === "function") DeviceOrientationEvent.requestPermission().then((s) => s === "granted" && listen()).catch(() => {});
      else listen();
    };
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") world.addEventListener("click", motion);
    else motion();

    function start(first) {
      const ac = new AbortController();
      const on = { signal: ac.signal };
      const timers = [];
      const W = sec.clientWidth;
      const H = sec.clientHeight;
      const phone = phoneMQ.matches;
      builtW = W;
      // rows from the floor up; "*" is a cherry, " " an empty slot. Each row sits on the grid of the row below
      const rows = [
        { t: "*ТОРТИ»*", pink: true },
        { t: "«ПРОСТО", pink: true },
        { t: "ПЕЧЕМО", pink: false },
        { t: "МИ НЕ", pink: false },
      ];
      const slots = rows[0].t.length;
      const floor = H - 8;
      let lastPlay = 0;
      const fs = Math.min(190, (W * 0.94) / (slots * 0.92), (H - 290) / 3.75);
      const bodies = [];
      const r = fs * 0.46;
      const row0 = (W - slots * r * 2) / 2 + r;

      const makeBody = (el, rad, x, y, delay, mass, slotY) => {
        el.style.width = el.style.height = `${rad * 2}px`;
        world.appendChild(el);
        // letters are thrown down rather than dropped from rest, so the whole phrase is in place in about a second
        const b = { el, r: rad, m: mass, still: 0, sleep: false, landY: slotY, homeX: slotY ? x : undefined, homeY: slotY, x, y, vx: 0, vy: slotY ? 9 : 0, a: slotY ? 0 : (Math.random() - 0.5) * 0.1, va: 0, born: performance.now() + delay, grab: false, tx: 0, ty: 0 };
        el.style.transform = `translate3d(${x - rad}px, -400px, 0)`;
        bodies.push(b);
        return b;
      };
      const cherry = () => {
        const el = document.createElement("span");
        el.className = "x-drop__letter";
        el.innerHTML = '<img src="img/cakes/cherries.png" alt="">';
        return el;
      };

      // made before the letters, so the beam and the cake stay behind them
      const stage = phone ? cakeStage(W, r, floor, bodies, on, timers) : null;

      let delay = 0;
      rows.forEach((row, ri) => {
        const offset = Math.floor((slots - row.t.length) / 2 + 0.5);
        [...row.t].forEach((ch, ci) => {
          if (ch !== " ") {
            const x = row0 + (offset + ci) * r * 2;
            const el = ch === "*" ? cherry() : document.createElement("span");
            if (ch !== "*") {
              el.className = `x-drop__letter${row.pink ? " is-pink" : ""}`;
              el.textContent = ch;
              // the wide letters are set a touch smaller, so «М» doesn't climb over its neighbours
              el.style.fontSize = `${fs * ("МШЖЮ".includes(ch) ? 0.9 : 1)}px`;
            }
            const rad = ch === "*" ? r * 0.92 : r;
            makeBody(el, rad, x, -rad - Math.random() * 30, delay, 4, floor - r - ri * r * 2 + (r - rad));
          }
          delay += 15;
        });
        delay += 80;
      });
      for (let i = 0, n = phone ? 6 : 12; i < n; i++) {
        // on a phone they land on the pyramid's shoulders, clear of the cake on top
        const x = phone ? (i % 2 ? W - r - Math.random() * r * 2.5 : r + Math.random() * r * 2.5) : r + Math.random() * (W - 2 * r);
        makeBody(cherry(), fs * 0.3, x, -200 - Math.random() * 300, delay - 200 + i * 60, 1);
      }
      if (stage) stage.drop(performance.now() + delay + 250);
      else ingredients(W, r, floor, on, timers);

      const wake = (b) => bodies.forEach((o) => { if (o !== b && Math.hypot(o.x - b.x, o.y - b.y) < (o.r + b.r) * 2.2) { o.sleep = false; o.still = 0; } });
      const grab = (b) => {
        b.grab = true;
        b.sleep = false;
        b.landY = undefined;
        wake(b);
        b.el.classList.add("is-drag");
        if (stage) stage.hold();
      };
      const release = (b) => {
        b.grab = false;
        lastPlay = performance.now();
        b.el.classList.remove("is-drag");
      };
      // a tap: the letter jumps and flips, knocking whatever stands on it — the cake included
      const kick = (b) => {
        b.sleep = false;
        b.landY = undefined;
        b.still = 0;
        b.vy = -(9 + Math.random() * 2.5);
        b.vx = (Math.random() - 0.5) * 5;
        b.va = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.2);
        wake(b);
        lastPlay = performance.now();
        if (stage) stage.hold();
        if (navigator.vibrate) navigator.vibrate(8);
      };

      // mouse: grab & throw (a click without moving kicks). Touch: vertical swipes stay the page's (touch-action: pan-y),
      // a sideways swipe takes the letter and throws it, a tap kicks it
      bodies.forEach((b) => {
        b.el.addEventListener("pointerdown", (e) => {
          const rect = sec.getBoundingClientRect();
          const sx = e.clientX, sy = e.clientY, t0 = performance.now();
          const mouse = e.pointerType === "mouse";
          let held = mouse;
          const follow = (ev) => { b.tx = ev.clientX - rect.left; b.ty = ev.clientY - rect.top; };
          if (mouse) {
            e.preventDefault();
            b.el.setPointerCapture(e.pointerId);
            grab(b);
            follow(e);
          }
          const move = (ev) => {
            const dx = Math.abs(ev.clientX - sx);
            if (!held && dx > 8 && dx > Math.abs(ev.clientY - sy)) {
              held = true;
              grab(b);
            }
            if (held) follow(ev);
          };
          const end = (ev) => {
            b.el.removeEventListener("pointermove", move);
            b.el.removeEventListener("pointerup", end);
            b.el.removeEventListener("pointercancel", end);
            const tap = ev.type === "pointerup" && performance.now() - t0 < 450 && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 10;
            if (held) release(b);
            if (tap) kick(b);
          };
          b.el.addEventListener("pointermove", move);
          b.el.addEventListener("pointerup", end);
          b.el.addEventListener("pointercancel", end);
        });
      });

      const step = (now) => {
        const goHome = lastPlay && now - lastPlay > 3200 && !bodies.some((o) => o.grab);
        for (const b of bodies) {
          // after a pause, scattered letters glide back to their places so the phrase reads again
          if (goHome && b.homeY !== undefined && (Math.abs(b.x - b.homeX) > 0.5 || Math.abs(b.y - b.homeY) > 0.5 || Math.abs(b.a) > 0.01)) {
            b.sleep = false;
            b.landY = undefined;
            b.x += (b.homeX - b.x) * 0.1;
            b.y += (b.homeY - b.y) * 0.1;
            b.a *= 0.85;
            b.vx = b.vy = b.va = 0;
            if (Math.abs(b.x - b.homeX) < 0.6 && Math.abs(b.y - b.homeY) < 0.6) { b.x = b.homeX; b.y = b.homeY; b.a = 0; b.sleep = true; }
            continue;
          }
          if (now < b.born || b.sleep) continue;
          // letters drop straight into their grid slot and bounce, so the phrase always lands readable
          if (b.landY !== undefined && !b.grab) {
            b.vy += 1.6;
            b.y += b.vy;
            if (b.y >= b.landY) {
              b.y = b.landY;
              b.vy *= -0.24;
              if (Math.abs(b.vy) < 1.2) { b.vy = 0; b.sleep = true; b.landY = undefined; }
            }
            continue;
          }
          if (b.grab) {
            b.vx = (b.tx - b.x) * 0.3;
            b.vy = (b.ty - b.y) * 0.3;
          } else {
            b.vy += 0.55;
            // the loose cherries roll downhill when the phone leans
            if (tilt && b.m === 1) b.vx += tilt * 0.35;
          }
          b.vx *= 0.995;
          if (!b.grab && b.m > 1 && Math.abs(b.vy) < 1.2) b.vx *= 0.8;
          b.x += b.vx;
          b.y += b.vy;
          if (b.y > floor - b.r) {
            b.y = floor - b.r;
            b.vy *= -0.2;
            b.vx *= b.m > 1 ? 0.6 : 0.86;
            b.va = b.m > 1 ? b.va * 0.5 : (b.vx / b.r) * 0.6;
          }
          if (b.x < b.r) { b.x = b.r; b.vx *= -0.5; }
          if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -0.5; }
          if (b.y < -600) b.y = -600;
          b.a += b.va;
          b.va *= 0.9;
          // heavy letters fall asleep once settled, so the phrase stays readable
          if (b.m > 1 && !b.grab && Math.abs(b.vx) + Math.abs(b.vy) < 0.25) {
            if (++b.still > 40) { b.sleep = true; b.vx = b.vy = 0; }
          } else b.still = 0;
        }
        for (let it = 0; it < 3; it++) {
          for (let i = 0; i < bodies.length; i++) {
            const A = bodies[i];
            if (now < A.born || A.landY !== undefined) continue;
            for (let j = i + 1; j < bodies.length; j++) {
              const B = bodies[j];
              if (now < B.born || B.landY !== undefined) continue;
              const dx = B.x - A.x, dy = B.y - A.y;
              const min = A.r + B.r;
              const d2 = dx * dx + dy * dy;
              if (d2 === 0 || d2 >= min * min) continue;
              const d = Math.sqrt(d2);
              const nx = dx / d, ny = dy / d;
              // inverse-mass split: heavy letters barely move when a cherry lands on them; grabbed bodies are immovable
              const hit = Math.abs((B.vx - A.vx) * (dx / Math.sqrt(d2)) + (B.vy - A.vy) * (dy / Math.sqrt(d2)));
              if (A.sleep && (hit > 6 && B.m > 1 || B.grab)) A.sleep = false;
              if (B.sleep && (hit > 6 && A.m > 1 || A.grab)) B.sleep = false;
              const ia = A.grab || A.sleep ? 0 : 1 / A.m, ib = B.grab || B.sleep ? 0 : 1 / B.m;
              if (!ia && !ib) continue;
              const sum = ia + ib || 1;
              A.x -= nx * (min - d) * (ia / sum); A.y -= ny * (min - d) * (ia / sum);
              B.x += nx * (min - d) * (ib / sum); B.y += ny * (min - d) * (ib / sum);
              const rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
              if (rv < 0) {
                const imp = (-rv * 1.3) / sum;
                A.vx -= imp * nx * ia; A.vy -= imp * ny * ia;
                B.vx += imp * nx * ib; B.vy += imp * ny * ib;
              }
            }
          }
        }
        if (stage) stage.step(now);
      };
      let acc = 0;
      // keeps falling off-screen until everything has landed: scrolled past mid-drop, the phrase is waiting on the way back
      const landBy = performance.now() + delay + 2500;
      const tick = (time, dt) => {
        const now = performance.now();
        if (!visible && now > landBy) return;
        acc = Math.min(acc + dt, 70);
        while (acc >= 16.67) { step(now); acc -= 16.67; }
        for (const b of bodies) {
          if (now < b.born) continue;
          b.el.style.transform = `translate3d(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px, 0) rotate(${b.a.toFixed(3)}rad)`;
        }
        if (stage) stage.render();
      };
      gsap.ticker.add(tick);

      // the cream line is piped while the letters are still falling, not after them
      if (first) setTimeout(pipe, 150);
      timers.push(setTimeout(() => sec.classList.add("is-done"), delay));

      return () => {
        gsap.ticker.remove(tick);
        ac.abort();
        timers.forEach(clearTimeout);
        world.textContent = "";
        sec.classList.remove("is-lit");
        const box = $(".x-drop__ing", sec);
        box?.classList.remove("is-off");
        $$(".x-ing__item", sec).forEach((el) => gsap.set(el, { visibility: "hidden" }));
      };
    }

    // Phone: no room for the side walls, so the cake takes the stage — it stands on top of the letter pile under a soft
    // beam, rides whatever the letters under it do (a kicked «И» throws it up, a thrown «М» tips it over), leans with
    // the phone, and a tap (or every few seconds) serves the next cake from the catalogue, dropped in from above
    function cakeStage(W, r, floor, bodies, on, timers) {
      const srcs = [...new Set($$(".x-ing__item img", sec).filter((i) => !i.classList.contains("is-photo")).map((i) => i.src))];
      const topY = $(".x-drop__top", sec).getBoundingClientRect().bottom - sec.getBoundingClientRect().top + 10;
      // the top of «МИ НЕ» at rest; the cake's foot sinks a little into the letters' round bodies
      const base = floor - r * 7.8;
      const h = Math.min(base - topY, W * 0.8);
      if (!srcs.length || h < 120) return null;
      const w = Math.min(W * 0.74, h);
      srcs.forEach((s) => { new Image().src = s; });

      const beam = document.createElement("i");
      beam.className = "x-stage__beam";
      beam.style.height = `${(base + r * 4).toFixed(0)}px`;
      const el = document.createElement("div");
      el.className = "x-stage";
      el.style.width = `${w.toFixed(0)}px`;
      el.style.height = `${h.toFixed(0)}px`;
      el.innerHTML = '<i class="x-stage__pool"></i><span class="x-stage__cake"><img alt="" draggable="false"></span>';
      world.append(beam, el);
      const cake = $(".x-stage__cake", el);
      const img = $("img", el);
      let k = 0;
      img.src = srcs[0];

      const c = { x: W / 2, vx: 0, y: -h - 60, vy: 0, a: 0, prev: null, born: Infinity, touched: 0, landed: false };
      // sugar dust thrown up where the cake lands
      const sparks = () => {
        for (let i = 0; i < 12; i++) {
          const s = document.createElement("i");
          s.className = "x-stage__spark";
          world.appendChild(s);
          const side = i % 2 ? 1 : -1;
          gsap.fromTo(s,
            { x: c.x + side * gsap.utils.random(w * 0.1, w * 0.42), y: c.y - 6, scale: gsap.utils.random(0.6, 1.4), opacity: 1 },
            { x: `+=${side * gsap.utils.random(20, 70)}`, y: `-=${gsap.utils.random(30, 110)}`, opacity: 0, duration: gsap.utils.random(0.6, 1.1), ease: "power2.out", onComplete: () => s.remove() });
        }
      };
      const land = (v) => {
        c.landed = true;
        sec.classList.add("is-lit");
        gsap.fromTo(cake, { scaleX: 1 + Math.min(0.2, v * 0.006), scaleY: 1 - Math.min(0.24, v * 0.007) }, { scaleX: 1, scaleY: 1, duration: 0.9, ease: "elastic.out(1.1, 0.35)", overwrite: true });
        if (v < 14) return;
        sparks();
        // the thud makes the cherries on the shoulders hop
        for (const b of bodies) {
          if (b.m !== 1 || Math.abs(b.x - c.x) > w * 0.8) continue;
          b.vy -= 3 + Math.random() * 4;
          b.vx += Math.sign(b.x - c.x) * (1 + Math.random() * 2);
        }
      };
      const serve = () => {
        if (srcs.length < 2 || !c.landed) return;
        c.landed = false;
        k = (k + 1) % srcs.length;
        gsap.to(cake, { scale: 0, rotation: gsap.utils.random(-25, 25), duration: 0.3, ease: "back.in(2)", overwrite: true, onComplete: () => {
          img.src = srcs[k];
          gsap.set(cake, { scale: 1, rotation: 0 });
          c.y = -h - 60;
          c.vy = 0;
          c.prev = null;
        } });
      };
      el.addEventListener("click", () => { c.touched = performance.now(); serve(); }, on);
      timers.push(setInterval(() => {
        if (visible && !document.hidden && performance.now() - c.touched > 5000) serve();
      }, 4200));

      return {
        drop(at) { c.born = at; },
        // while someone plays with the letters, the cake on show stays
        hold() { c.touched = performance.now(); },
        step(now) {
          if (now < c.born) return;
          // a leaning phone slides it along the top of the phrase as on a tray; level again, it drifts back to the middle
          c.vx = (c.vx + (c.landed ? tilt * 0.5 : 0) + (W / 2 - c.x) * 0.004) * 0.9;
          c.x = Math.max(W / 2 - r * 2.6, Math.min(W / 2 + r * 2.6, c.x + c.vx));
          // the highest letter under each half of the cake's foot holds that half up
          const reach = Math.max(40, -c.vy * 2);
          let yl = Infinity, yr = Infinity, xl = 0, xr = 0;
          for (const b of bodies) {
            if (b.m === 1 || now < b.born) continue;
            const dx = b.x - c.x;
            const top = b.y - b.r * 0.8;
            if (Math.abs(dx) > w * 0.4 || top < c.y - reach) continue;
            if (dx < 0 && top < yl) { yl = top; xl = dx; }
            if (dx >= 0 && top < yr) { yr = top; xr = dx; }
          }
          const both = yl < Infinity && yr < Infinity;
          const hi = Math.min(yl, yr, floor);
          const rest = both ? (yl + yr) / 2 : hi;
          let lean = both ? Math.atan2(yr - yl, Math.max(r * 2, xr - xl)) : yl < Infinity ? 0.3 : yr < Infinity ? -0.3 : 0;
          lean = Math.max(-0.4, Math.min(0.4, lean + tilt * 0.12));
          c.a += (lean - c.a) * 0.15;
          const lift = c.prev == null ? 0 : hi - c.prev;
          c.prev = hi;
          c.vy += 1.3;
          c.y += c.vy;
          if (lift < -2 && hi < c.y) {
            // a letter shooting up from below throws the cake up with it
            c.y = hi;
            c.vy = Math.max(-13, Math.min(c.vy, lift * 1.1));
          } else if (c.y >= rest) {
            const v = c.vy;
            c.y = rest;
            c.vy = v > 6 ? -v * 0.16 : 0;
            if (v > 6) land(v);
          }
        },
        render() {
          el.style.transform = `translate3d(${(c.x - w / 2).toFixed(1)}px, ${(c.y - h).toFixed(1)}px, 0) rotate(${c.a.toFixed(3)}rad)`;
          beam.style.transform = `translateX(${(c.x - W / 2).toFixed(1)}px)`;
        },
      };
    }

    // The side walls: one catalogue cake per side pops out, then the sides take turns serving the next one.
    // They hang beside the two upper rows (the widest free wall), between the cream line and «ПРОСТО»
    function ingredients(W, r, floor, on, timers) {
      const box = $(".x-drop__ing", sec);
      if (!box) return;
      if (!$(".x-ing__item", box)) { box.classList.add("is-off"); return; }
      const top = $(".x-drop__top", sec).getBoundingClientRect().bottom - sec.getBoundingClientRect().top + 6;
      const bottom = floor - r * 4;
      const side = (W - r * 12) / 2;
      const w = Math.min(side * 0.74, 280, (bottom - top) / 1.2);
      if (w < 110) { box.classList.add("is-off"); return; }
      box.style.setProperty("--side", side.toFixed(0) + "px");
      box.style.setProperty("--mid", ((top + bottom) / 2).toFixed(0) + "px");
      box.style.setProperty("--wmax", w.toFixed(0) + "px");
      const walls = $$(".x-ing", box).map((wall) => ({ wall, items: $$(".x-ing__item", wall), i: 0, touched: 0 })).filter((wl) => wl.items.length);
      const popIn = (el, delay) => gsap.fromTo(el,
        { visibility: "visible", scale: 0, yPercent: 30, rotation: gsap.utils.random(-25, 25) },
        { scale: 1, yPercent: 0, rotation: 0, duration: 0.75, delay, ease: "back.out(2.2)", overwrite: "auto" });
      const popOut = (el) => gsap.to(el, { scale: 0, yPercent: 25, rotation: gsap.utils.random(-30, 30), duration: 0.32, ease: "back.in(2)", overwrite: "auto", onComplete: () => gsap.set(el, { visibility: "hidden" }) });
      const swap = (wl) => {
        if (wl.items.length < 2) return;
        popOut(wl.items[wl.i]);
        wl.i = (wl.i + 1) % wl.items.length;
        popIn(wl.items[wl.i], 0.22);
      };
      walls.forEach((wl, k) => {
        popIn(wl.items[0], 0.2 + k * 0.12);
        // a click serves the next cake at once; a hover makes the one on show wobble like jelly
        wl.wall.addEventListener("click", () => { wl.touched = performance.now(); swap(wl); }, on);
        if (fine) wl.wall.addEventListener("pointerenter", () => {
          gsap.fromTo($("img", wl.items[wl.i]), { scaleX: 1.12, scaleY: 0.86, transformOrigin: "50% 100%" }, { scaleX: 1, scaleY: 1, duration: 0.9, ease: "elastic.out(1.2, 0.35)", overwrite: "auto" });
        }, on);
      });
      let turn = 0;
      timers.push(setInterval(() => {
        const wl = walls[turn++ % walls.length];
        if (visible && !document.hidden && performance.now() - wl.touched > 2500) swap(wl);
      }, 1700));
    }

    function pipe() {
      const text = $(".x-pipe__text", sec);
      const bag = $(".x-pipe__bag", sec);
      const st = { p: 0 };
      const bb = bag.getBoundingClientRect();
      const bw = bb.width;
      const bh = bb.height;
      gsap.set(bag, { opacity: 1 });
      gsap.to(st, {
        p: 1,
        duration: 1.5,
        ease: "none",
        onUpdate: () => {
          const w = text.offsetWidth;
          const h = text.offsetHeight;
          text.style.clipPath = `inset(-20% ${(100 - st.p * 100).toFixed(2)}% -20% 0)`;
          const x = w * st.p;
          const y = h * (0.6 + Math.sin(st.p * 70) * 0.16);
          bag.style.transform = `translate(${(x - bw * 0.5).toFixed(1)}px, ${(y - bh * 0.95).toFixed(1)}px) rotate(${(-20 + Math.sin(st.p * 45) * 8).toFixed(1)}deg)`;
        },
        onComplete: () => gsap.to(bag, { opacity: 0, duration: 0.6 }),
      });
    }
  }

  // Manifesto 2/3: each photo opens inside the previous one
  function zoomScenes() {
    const sec = $(".x-zoom");
    if (!sec) return;
    const layers = $$(".x-zoom__layer", sec);
    const n = layers.length;
    const count = $("[data-zoom-n]", sec);
    gsap.set(layers.slice(1), { scale: 0.16, borderRadius: 280, autoAlpha: 0 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec,
        start: "top top",
        end: `+=${(n - 1) * 90 + 30}%`,
        pin: ".x-zoom__pin",
        scrub: 0.6,
        onUpdate: (self) => { count.textContent = pad(Math.min(n, Math.round(self.progress * (n - 1)) + 1)); },
      },
    });
    layers.forEach((L, i) => {
      if (!i) return;
      const at = i - 1;
      tl.set(L, { autoAlpha: 1 }, at)
        .to(L, { scale: 1, borderRadius: 0, duration: 1, ease: "power2.inOut" }, at)
        .to(layers[i - 1], { scale: 3.2, duration: 1, ease: "power2.in" }, at)
        .to($("h3", layers[i - 1]), { opacity: 0, duration: 0.3 }, at)
        .fromTo($("h3", L), { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35 }, at + 0.65);
    });
    tl.to({}, { duration: 0.3 });
  }

  // Manifesto 3/3: a solid mosaic heart of cake photos assembles around the sticker
  function heartCollage() {
    const sec = $(".x-heart");
    if (!sec) return;
    const pin = $(".x-heart__pin", sec);
    const mosaic = $(".x-heart__mosaic", sec);
    const PHOTOS = ["roses", "pink", "berries", "gold", "lilac", "slice", "fraisier", "cherrycup", "pinkmac", "strawslice", "forest", "mousse", "macarons", "redvelvet", "swirl", "cupcakes", "tiramisu", "oreo", "cookie", "meringue", "mint", "donuts", "vanilla", "piping", "strawberries", "raspberries", "cherrymint", "drip", "blackoreo", "choccup"];

    const build = () => {
      mosaic.innerHTML = "";
      const size = Math.min(pin.clientWidth * 0.86, (pin.clientHeight - 140) * 1.12);
      const cols = innerWidth < 760 ? 11 : 15;
      const g = size / cols;
      const tiles = [];
      for (let row = -Math.ceil(cols * 0.6); row <= Math.ceil(cols * 0.6); row++) {
        for (let col = -Math.ceil(cols / 2); col <= Math.ceil(cols / 2); col++) {
          const u = (col * g) / (size / 2) * 1.16;
          const v = -(row * g) / (size / 2) * 1.16 + 0.18;
          const f = (u * u + v * v - 1) ** 3 - u * u * v ** 3;
          if (f > 0) continue;
          const el = document.createElement("i");
          el.className = "x-heart__tile";
          el.style.width = el.style.height = `${(g - 4).toFixed(1)}px`;
          el.style.marginLeft = el.style.marginTop = `${(-(g - 4) / 2).toFixed(1)}px`;
          el.style.backgroundImage = `url("img/cakes/${PHOTOS[(tiles.length * 7) % PHOTOS.length]}.jpg")`;
          el.dataset.x = (col * g).toFixed(1);
          el.dataset.y = (row * g).toFixed(1);
          mosaic.appendChild(el);
          tiles.push(el);
        }
      }
      return tiles;
    };

    let tiles = build();
    if (!hasLibs || reduce) {
      tiles.forEach((t) => gsap.set(t, { x: +t.dataset.x, y: +t.dataset.y }));
      return;
    }
    const tl = gsap.timeline({
      scrollTrigger: { trigger: sec, start: "top top", end: "+=170%", pin: ".x-heart__pin", scrub: 0.7 },
    });
    // tiles closest to the centre arrive last, so the heart fills from its outline inward
    const sorted = [...tiles].sort((a, b) => Math.hypot(b.dataset.x, b.dataset.y) - Math.hypot(a.dataset.x, a.dataset.y));
    sorted.forEach((t, i) => {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.max(innerWidth, innerHeight) * (0.7 + Math.random() * 0.5);
      tl.fromTo(t, { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, rotation: gsap.utils.random(-180, 180), scale: 0.4, opacity: 0 }, {
        x: +t.dataset.x,
        y: +t.dataset.y,
        rotation: gsap.utils.random(-6, 6),
        scale: 1,
        opacity: 1,
        duration: 0.9,
        ease: "power3.out",
      }, (i / sorted.length) * 1.1);
    });
    tl.fromTo(".x-heart__sticker", { scale: 0, rotation: -40 }, { scale: 1, rotation: -4, duration: 0.45, ease: "back.out(2)" }, 1.25)
      .to({}, { duration: 0.45 })
      .addLabel("drain")
      // the heart drains down like a whirlpool into the next section
      .to(sorted.slice().reverse(), {
        x: () => gsap.utils.random(-40, 40),
        y: () => pin.clientHeight * 0.8,
        scale: 0.12,
        rotation: () => gsap.utils.random(-540, 540),
        opacity: 0,
        duration: 0.9,
        ease: "power2.in",
        stagger: { each: 0.004 },
      }, "drain")
      .to(".x-heart__sticker", { y: () => pin.clientHeight * 0.6, scale: 0.3, rotation: 40, opacity: 0, duration: 0.7, ease: "back.in(1.6)" }, "drain+=0.35");
  }

  // Instagram-style stories in a phone: auto-advance, tap zones, live stickers and a heart fountain
  function storyPhone() {
    const sec = $(".x-story");
    if (!sec || !window.gsap) return;
    const drips = $(".x-story__drips path", sec);
    if (drips) drips.setAttribute("d", dripPath(41));
    const slides = $$(".x-slide", sec);
    const bars = $$(".x-phone__bars u", sec);
    const tabs = $$("[data-story-tab]", sec);
    const n = slides.length;
    let idx = 0;
    let timer = null;
    let visible = false;
    let held = false;

    const agoEl = $("[data-story-ago]", sec);
    const AGO = ["2 год", "5 год", "9 год", "14 год"];
    const show = (i) => {
      const next = (i + n) % n;
      if (next !== idx && tabs[idx]) tabs[idx].classList.add("is-seen");
      idx = next;
      if (agoEl) agoEl.textContent = AGO[idx % AGO.length];
      slides.forEach((sl, k) => sl.classList.toggle("is-active", k === idx));
      tabs.forEach((t, k) => t.classList.toggle("is-active", k === idx));
      bars.forEach((b, k) => gsap.set(b, { scaleX: k < idx ? 1 : 0 }));
      if (timer) timer.kill();
      timer = gsap.fromTo(bars[idx], { scaleX: 0 }, { scaleX: 1, duration: 5, ease: "none", onComplete: () => show(idx + 1) });
      if (!visible || held) timer.pause();
    };
    const pause = () => { held = true; if (timer) timer.pause(); };
    const resume = () => { held = false; if (timer && visible) timer.resume(); };

    $(".x-phone__nav--next", sec).addEventListener("click", () => show(idx + 1));
    $(".x-phone__nav--prev", sec).addEventListener("click", () => show(idx - 1));
    tabs.forEach((t, k) => t.addEventListener("click", () => show(k)));
    const screen = $(".x-phone__screen", sec);
    screen.addEventListener("pointerdown", pause);
    addEventListener("pointerup", () => { if (held) resume(); });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!timer) return;
      if (visible && !held) timer.resume();
      else timer.pause();
    }, { threshold: 0.3 }).observe(screen);

    // heart fountain
    const hearts = $(".x-phone__hearts", sec);
    const COLORS = ["#ff5577", "#f5bcc8", "#e2849a", "#ffffff", "#ff8fa6"];
    const heart = () => {
      const h = document.createElement("i");
      h.textContent = "♥";
      h.style.color = COLORS[(Math.random() * COLORS.length) | 0];
      h.style.setProperty("--dx", `${gsap.utils.random(-90, 30)}px`);
      h.style.setProperty("--rot", `${gsap.utils.random(-40, 40)}deg`);
      hearts.appendChild(h);
      setTimeout(() => h.remove(), 1900);
    };
    const like = $(".x-phone__like", sec);
    like.addEventListener("click", () => {
      like.classList.add("is-on");
      for (let i = 0; i < 10; i++) setTimeout(heart, i * 70);
    });
    setInterval(() => { if (visible && !document.hidden) heart(); }, 1400);

    // quick reactions: the emoji bursts up across the story
    const sent = $("[data-react-sent]", sec);
    let sentT = 0;
    $$("[data-react]", sec).forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const emo = b.dataset.react;
      const scr = $(".x-phone__screen", sec).getBoundingClientRect();
      const r = b.getBoundingClientRect();
      for (let k = 0; k < 9; k++) {
        const f = document.createElement("i");
        f.className = "x-react-fly";
        f.textContent = emo;
        f.style.left = `${r.left - scr.left + r.width / 2 - 16}px`;
        f.style.top = `${r.top - scr.top - 8}px`;
        f.style.setProperty("--dx", `${gsap.utils.random(-110, 110)}px`);
        f.style.setProperty("--dy", `${gsap.utils.random(-380, -160)}px`);
        f.style.setProperty("--s", gsap.utils.random(0.9, 1.8).toFixed(2));
        f.style.setProperty("--rot", `${gsap.utils.random(-50, 50)}deg`);
        f.style.animationDelay = `${k * 45}ms`;
        screen.appendChild(f);
        setTimeout(() => f.remove(), 1600 + k * 45);
      }
      if (sent) {
        sent.textContent = `Реакцію ${emo} надіслано`;
        sent.classList.add("is-on");
        clearTimeout(sentT);
        sentT = setTimeout(() => sent.classList.remove("is-on"), 1400);
      }
    }));

    // "Стежити" turns into "Ви стежите" (the link still opens Instagram)
    const follow = $("[data-follow]");
    follow?.addEventListener("click", () => {
      follow.classList.add("is-on");
      follow.textContent = "Ви стежите ✓";
    });

    // emoji slider sticker
    const track = $(".x-sticker-slider__track", sec);
    const knob = $("button", track);
    const fill = $("i", track);
    knob.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      pause();
      knob.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const r = track.getBoundingClientRect();
        const p = gsap.utils.clamp(0, 1, (ev.clientX - r.left) / r.width);
        knob.style.left = fill.style.width = `${(p * 100).toFixed(1)}%`;
        knob.style.fontSize = `${1.4 + p * 1.2}rem`;
      };
      const up = () => {
        knob.removeEventListener("pointermove", move);
        knob.removeEventListener("pointerup", up);
        for (let i = 0; i < 8; i++) setTimeout(heart, i * 60);
        resume();
      };
      knob.addEventListener("pointermove", move);
      knob.addEventListener("pointerup", up);
    });

    // poll sticker
    const poll = $(".x-sticker-poll", sec);
    $$("button", poll).forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      $$("button", poll).forEach((o) => o.classList.toggle("is-picked", o === b));
      poll.classList.add("is-voted");
      heart();
    }));

    show(0);

    // notifications take turns
    const toasts = $$(".x-toast", sec);
    let ti = 0;
    setInterval(() => {
      if (!visible) return;
      toasts.forEach((t, k) => t.classList.toggle("is-on", k === ti));
      ti = (ti + 1) % (toasts.length + 1);
    }, 2600);

    // 3D tilt + glass shine following the pointer
    const phone = $(".x-phone", sec);
    const stage = $(".x-story__stage", sec);
    if (fine) {
      gsap.set(phone, { transformPerspective: 1100 });
      const ry = gsap.quickTo(phone, "rotationY", { duration: 0.9, ease: "power3.out" });
      const rx = gsap.quickTo(phone, "rotationX", { duration: 0.9, ease: "power3.out" });
      stage.addEventListener("pointermove", (e) => {
        const r = stage.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        ry(nx * 26);
        rx(-ny * 18);
        phone.style.setProperty("--shine", `${(50 - nx * 120).toFixed(1)}%`);
      });
      stage.addEventListener("pointerleave", () => { ry(-8); rx(4); });
      ry(-8);
      rx(4);
    }

    if (hasLibs && !reduce) {
      gsap.fromTo(drips.parentNode, { scaleY: 0.15 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "top 20%", scrub: true } });
      // the phone surfaces from the cherry glaze as you scroll in
      gsap.fromTo(phone, { y: 260, scale: 0.82, rotationZ: -14 }, { y: 0, scale: 1, rotationZ: 0, ease: "power2.out", scrollTrigger: { trigger: sec, start: "top 85%", end: "top 15%", scrub: 0.8 } });
      gsap.fromTo(".x-story__ring", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: sec, start: "top 70%", end: "top 10%", scrub: 0.8 } });
      const doodle = $$(".x-story__doodle path", sec);
      if (doodle.length) gsap.fromTo(doodle, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, stagger: 0.5, ease: "power2.inOut", scrollTrigger: { trigger: ".x-story__stage", start: "top 65%" } });
      gsap.from(".x-igp", { rotation: -8, scale: 0.9, duration: 1.2, ease: "elastic.out(1, 0.6)", scrollTrigger: { trigger: ".x-igp", start: "top 85%" } });
      gsap.from([".x-story__tag", ".x-story__float", ".x-story__badge"], { scale: 0, opacity: 0, duration: 0.8, stagger: 0.08, ease: "back.out(2)", scrollTrigger: { trigger: ".x-story__stage", start: "top 70%" } });
    }
  }

  // Section-to-section transitions: waves, irises, knife cuts, frosting scallops, piped cream, sprinkles, stacking
  const EDGES = [
    { before: ".x-drop", type: "wave", color: "var(--cherry)", bg: "var(--bg)", gloss: true },
    { before: ".gl", type: "glaze" },
    { before: ".x-order", type: "wave", color: "var(--bg)", bg: "var(--cherry)" },
    { before: "#how-to-order", type: "scallop", color: "#fff7ef", bg: "var(--bg)" },
    { before: ".x-dress", type: "drip", color: "#fff7ef", bg: "var(--bg)" },
    { before: ".x-dress", type: "sprinkles" },
    { before: "#site-footer", type: "drip", color: "var(--bg)", bg: "var(--pink)" },
  ];
  const SPRINKLE_COLORS = ["#6d0809", "#f5bcc8", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff", "#9ed9b8"];
  // the wave's edge across a 1440-wide box: shared by the edge that rises out of the cake section and the band that
  // hangs over its top (cutCap), so both ends of the section wear the same wave
  const waveY = (x, base, amp, ph) => base + Math.sin((x / 1440) * Math.PI * 3 + ph) * amp * 0.6 + Math.sin((x / 1440) * Math.PI * 7 - ph * 0.6) * amp * 0.25;
  // glints along a glossy wave: short strokes that follow its edge just inside the cherry and drift with it
  const waveShine = (ys, dy, ph) => {
    let d = "", pen = false;
    ys.forEach((y, i) => {
      const x = i * 40;
      const lit = x > 30 && x < 1410 && Math.sin((x / 1440) * Math.PI * 5 + ph * 0.4) > 0.15;
      if (lit) d += `${pen ? " L" : " M"}${x},${(y + dy).toFixed(1)}`;
      pen = lit;
    });
    return d;
  };

  // insert divider elements first, so pinned sections get their spacers around the right nodes
  function buildEdges() {
    EDGES.forEach((cfg) => {
      if (!cfg.before) return;
      const next = $(cfg.before);
      if (!next) return;
      const edge = document.createElement("div");
      edge.className = `x-edge x-edge--${cfg.type}`;
      if (cfg.bg) edge.style.setProperty("--edge-bg", cfg.bg);
      edge.setAttribute("aria-hidden", "true");
      if (cfg.type === "wave" || cfg.type === "scallop" || cfg.type === "drip") {
        edge.innerHTML = `<svg class="x-edge__svg" viewBox="0 0 1440 140" preserveAspectRatio="none"><path style="fill:${cfg.color}"/>${cfg.gloss ? '<path class="x-wave-shine"/>' : ""}</svg>`;
        if (cfg.gloss) edge.classList.add("x-edge--gloss");
        if (cfg.big) edge.style.setProperty("--eh", "clamp(110px, 13vw, 210px)");
        if (cfg.type === "drip") $("path", edge).setAttribute("d", dripPath(53));
        if (cfg.type === "scallop") {
          const n = 24, w = 1440 / n;
          let d = "";
          for (let i = 0; i < n; i++) d += `<circle cx="${(i * w + w / 2).toFixed(1)}" cy="140" r="${(w * 0.62).toFixed(1)}" style="fill:${cfg.color}"/>`;
          $("svg", edge).innerHTML = `<rect x="0" y="139" width="1440" height="2" style="fill:${cfg.color}"/>${d}`;
        }
      } else if (cfg.type === "dollops") {
        edge.innerHTML = `<div class="x-edge__dollops">${"<i></i>".repeat(innerWidth < 760 ? 9 : 17)}</div>`;
      } else if (cfg.type === "sprinkles") {
        let h = "";
        const count = innerWidth < 760 ? 30 : 60;
        for (let i = 0; i < count; i++) {
          h += `<i style="left:${(Math.random() * 98).toFixed(1)}%;top:${(15 + Math.random() * 60).toFixed(0)}%;background:${SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]};rotate:${(Math.random() * 180).toFixed(0)}deg"></i>`;
        }
        edge.innerHTML = `<div class="x-edge__sprinkles">${h}</div>`;
      } else if (cfg.type === "glaze") {
        edge.innerHTML = `<svg class="x-edge__glaze"><defs><linearGradient id="x-glaze" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="200"><stop offset="0" stop-color="#6d0809"/><stop offset="0.5" stop-color="#7c0b10"/><stop offset="1" stop-color="#a01a22"/></linearGradient><linearGradient id="x-glaze-feather" gradientUnits="userSpaceOnUse" x1="0" y1="-30" x2="0" y2="0"><stop offset="0" stop-color="#6d0809" stop-opacity="0"/><stop offset="1" stop-color="#6d0809"/></linearGradient></defs><rect class="x-glaze__feather" x="0" y="-30" height="31" fill="url(#x-glaze-feather)"/><path class="x-glaze__body" fill="url(#x-glaze)"/><path class="x-glaze__shine"/></svg>`;
      }
      next.parentNode.insertBefore(edge, next);
      cfg.el = edge;
    });
  }

  // Cherry glaze running off the manifesto onto the gallery: the drips stretch as the seam rises up the screen,
  // stretch further on a fast scroll and spring back when it stops, then leave with the cherry section as the gallery pins
  function glazeEdge(edge) {
    const svg = $("svg", edge);
    const body = $(".x-glaze__body", svg);
    const shine = $(".x-glaze__shine", svg);
    const BAND = 8;
    let drips = [], W = 0, H = 0;
    const layout = () => {
      W = edge.offsetWidth || innerWidth;
      const k = Math.min(1.15, Math.max(0.6, W / 1440));
      let seed = 23;
      const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      drips = [];
      let x = rnd() * 40 * k;
      for (;;) {
        const r = (12 + rnd() * 20) * k;
        const f = Math.min(r * 0.8, 12 * k);
        const min = f + r * 1.1 + 2 + rnd() * 10 * k;
        const max = Math.max(min + 14 * k, (rnd() < 0.24 ? 150 + rnd() * 120 : 30 + rnd() * 90) * k);
        x += f + r;
        if (x + r + f > W) break;
        drips.push({ x, r, f, min, max, lag: rnd() * 0.4, ph: rnd() * 6.3 });
        x += r + f + (4 + rnd() * 54) * k;
      }
      H = Math.ceil(Math.max(0, ...drips.map((d) => d.max)) * 1.5 + BAND + 60);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.style.height = H + "px";
      // a soft lip of glaze above the seam: whatever lies on the manifesto's floor sinks into it
      $(".x-glaze__feather", svg).setAttribute("width", W);
      shine.setAttribute("stroke-width", (3.2 * k).toFixed(1));
      // the band stays the exact cherry of the section above, so the seam can't show; only the drips warm up towards their tips
      const grad = $("linearGradient", svg);
      grad.setAttribute("y1", BAND + 4);
      grad.setAttribute("y2", Math.round(BAND + Math.max(0, ...drips.map((d) => d.max)) * 1.1));
    };
    // p: how far the seam has risen (0 at the bottom of the screen, 1 at the top); s: the springy stretch from scroll speed
    const draw = (p, s, t) => {
      let d = `M0,-2 L0,${BAND}`;
      let hi = "";
      drips.forEach((dr) => {
        const g = Math.min(1, Math.max(0, (p - dr.lag) / (1 - dr.lag)));
        const { x, r, f } = dr;
        const L = Math.max(f + r + 1, dr.min + (dr.max - dr.min) * (1 - (1 - g) * (1 - g)) + s * dr.max * 0.4 + Math.sin(t * 1.7 + dr.ph) * 2.5);
        // the drop at the end swells only once the drip is long enough to carry it, and thins when it is pulled fast
        const rb = r * (1 + Math.min(1, (L - f - r) / (r * 3)) * (0.12 - 0.16 * Math.max(0, s)));
        const yb = BAND + Math.max(f, L - rb);
        const c = BAND + f + (yb - BAND - f) * 0.5;
        const c2 = Math.max(c, yb - rb * 0.9);
        d += ` L${(x - r - f).toFixed(1)},${BAND} Q${(x - r).toFixed(1)},${BAND} ${(x - r).toFixed(1)},${(BAND + f).toFixed(1)}`;
        d += ` C${(x - r).toFixed(1)},${c.toFixed(1)} ${(x - rb).toFixed(1)},${c2.toFixed(1)} ${(x - rb).toFixed(1)},${yb.toFixed(1)}`;
        d += ` A${rb.toFixed(1)},${rb.toFixed(1)} 0 0 0 ${(x + rb).toFixed(1)},${yb.toFixed(1)}`;
        d += ` C${(x + rb).toFixed(1)},${c2.toFixed(1)} ${(x + r).toFixed(1)},${c.toFixed(1)} ${(x + r).toFixed(1)},${(BAND + f).toFixed(1)}`;
        d += ` Q${(x + r).toFixed(1)},${BAND} ${(x + r + f).toFixed(1)},${BAND}`;
        // a streak of light down the drip and a glint on its drop
        if (yb - rb * 0.4 > BAND + f + 6) hi += `M${(x - r * 0.42).toFixed(1)},${(BAND + f + 2).toFixed(1)} L${(x - rb * 0.46).toFixed(1)},${(yb - rb * 0.4).toFixed(1)} `;
        hi += `M${(x - rb * 0.4).toFixed(1)},${(yb + rb * 0.18).toFixed(1)} l0.1,0 `;
      });
      body.setAttribute("d", `${d} L${W},${BAND} L${W},-2 Z`);
      shine.setAttribute("d", hi);
    };

    let pp = 0, s = 0, sv = 0, prevTop = null;
    const tick = (time, dtMs) => {
      const top = edge.getBoundingClientRect().top;
      const vh = innerHeight;
      const dt = Math.max(1 / 240, (dtMs || 16) / 1000);
      // screens per second, positive while scrolling down: the glaze lags behind the rising seam and pulls longer
      const speed = prevTop == null ? 0 : (prevTop - top) / vh / dt;
      prevTop = top;
      sv += (Math.max(-0.45, Math.min(1, speed * 0.3)) - s) * 0.1;
      sv *= 0.8;
      s += sv;
      pp += (Math.min(1, Math.max(0, 1 - top / vh)) - pp) * 0.2;
      draw(pp, s, time);
    };
    layout();
    draw(0, 0, 0);
    ScrollTrigger.create({
      trigger: edge,
      start: "top bottom",
      end: () => `top -${H}px`,
      onToggle: (self) => {
        if (self.isActive) {
          prevTop = null;
          gsap.ticker.add(tick);
        } else {
          gsap.ticker.remove(tick);
          pp = self.progress > 0.5 ? 1 : 0;
          s = sv = 0;
          draw(pp, 0, 0);
        }
      },
    });
    let lastW = W;
    addEventListener("resize", () => {
      if (edge.offsetWidth === lastW) return;
      lastW = edge.offsetWidth;
      layout();
      draw(pp, 0, 0);
    });
  }

  function animateEdges() {
    EDGES.forEach((cfg) => {
      if (cfg.el) {
        const st = { trigger: cfg.el, start: "top bottom", end: "top 35%", scrub: 0.6 };
        if (cfg.type === "glaze") {
          glazeEdge(cfg.el);
        } else if (cfg.type === "wave") {
          const path = $("path", cfg.el);
          const shine = $(".x-wave-shine", cfg.el);
          const draw = (p) => {
            const base = 140 - p * 110;
            const amp = 34 * Math.sin(Math.min(1, p) * Math.PI) + 10 * p;
            const ys = [];
            for (let x = 0; x <= 1440; x += 40) ys.push(Math.min(141, waveY(x, base, amp, p * 5)));
            path.setAttribute("d", `M0,141 ${ys.map((y, i) => `L${i * 40},${y.toFixed(1)}`).join(" ")} L1440,141 Z`);
            if (shine) shine.setAttribute("d", p > 0.15 ? waveShine(ys, 9, p * 5) : "");
          };
          draw(0);
          ScrollTrigger.create({ ...st, onUpdate: (self) => draw(self.progress) });
        } else if (cfg.type === "scallop") {
          gsap.fromTo($$("circle", cfg.el), { scale: 0, transformOrigin: "50% 100%" }, { scale: 1, stagger: { each: 0.04, from: "center" }, ease: "back.out(2)", scrollTrigger: st });
        } else if (cfg.type === "drip") {
          gsap.fromTo($("svg", cfg.el), { scaleY: 0.1 }, { scaleY: 1, ease: "none", scrollTrigger: { ...st, end: "top 20%" } });
        } else if (cfg.type === "dollops") {
          gsap.fromTo($$("i", cfg.el), { scale: 0, y: 20 }, { scale: 1, y: 0, stagger: { each: 0.05, from: "start" }, ease: "back.out(2.5)", scrollTrigger: { ...st, end: "top 55%" } });
        } else if (cfg.type === "sprinkles") {
          $$("i", cfg.el).forEach((sp) => {
            gsap.fromTo(sp, { y: -gsap.utils.random(150, 420), opacity: 0, rotation: gsap.utils.random(-200, 200) }, { y: 0, opacity: 1, rotation: 0, ease: "bounce.out", scrollTrigger: { ...st, end: `top ${gsap.utils.random(40, 65).toFixed(0)}%` } });
          });
        }
        return;
      }
      const target = $(cfg.target);
      const trigger = $(cfg.trigger);
      if (!target || !trigger) return;
      const st = { trigger, start: "top bottom", end: "top top", scrub: 0.6 };
      if (cfg.type === "iris") {
        gsap.fromTo(target, { clipPath: `circle(0% at ${cfg.at})` }, { clipPath: `circle(150% at ${cfg.at})`, ease: "power2.in", scrollTrigger: st });
      } else if (cfg.type === "cut") {
        gsap.fromTo(target, { clipPath: "polygon(0% 100%, 100% 135%, 100% 100%, 0% 100%)" }, { clipPath: "polygon(0% -35%, 100% 0%, 100% 100%, 0% 100%)", ease: "none", scrollTrigger: st });
      } else if (cfg.type === "stack") {
        gsap.fromTo(target, { scale: 1, filter: "brightness(1)" }, { scale: 0.88, filter: "brightness(0.6)", borderRadius: 40, transformOrigin: "50% 100%", ease: "none", scrollTrigger: { ...st, end: "top 15%" } });
      }
    });
  }

  // Phones: Safari paints its status bar in the body colour. As the cake section takes the screen, a cherry band pours
  // down out of the status bar (which turns cherry with it), wearing the same glossy wave as the edge that rises at
  // the section's end. It hangs there, rippling, until that wave comes up to meet it; the status bar stays cherry over
  // the manifesto and lets go once the gallery reaches the top
  function cutCap() {
    const sec = $(".x-cut");
    const edge = EDGES.find((c) => c.before === ".x-drop")?.el;
    const gl = $(".gl");
    if (!sec || !edge) return;
    const phone = matchMedia("(max-width: 760px)");
    const cap = document.createElement("div");
    cap.className = "x-cap";
    cap.setAttribute("aria-hidden", "true");
    cap.innerHTML = '<svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path class="x-cap__body"/><path class="x-wave-shine"/></svg>';
    document.body.appendChild(cap);
    const body = $(".x-cap__body", cap);
    const shine = $(".x-wave-shine", cap);
    let g = 0, s = 0, sv = 0, prev = null, running = false;

    const state = () => {
      const live = phone.matches;
      const top = sec.getBoundingClientRect().top;
      // pours in over the last quarter of a screen before the section reaches the top, and stays until the rising
      // wave has slid under it all the way
      const k = Math.min(1, Math.max(0, 1 - top / (innerHeight * 0.25)));
      // how far down the rising edge's own mint still shows: the band covers at least 13px, and draws back up only
      // once the cherry below has closed that gap
      const gap = edge.getBoundingClientRect().top + edge.offsetHeight * 0.28 + 2;
      g = live ? (1 - (1 - k) * (1 - k)) * Math.min(1, Math.max(0, gap / 13)) : 0;
      // Safari tints its status bar from a fixed box along the top edge: the band's lip is that box, solid cherry and
      // always inside the wave, and a 2px lip stays over the manifesto until the gallery comes up
      const dark = live && k > 0.1 && (!gl || gl.getBoundingClientRect().top > 0);
      cap.classList.toggle("is-on", g > 0 || dark);
      cap.style.height = dark ? `${Math.max(2, 13 * g).toFixed(1)}px` : "0px";
      return top;
    };
    const draw = (t) => {
      const ph = scrollY / 380 + t * 0.5;
      const base = g * (46 + s * 30), amp = g * (22 + s * 30);
      const ys = [];
      for (let x = 0; x <= 1440; x += 40) ys.push(waveY(x, base, amp, ph));
      body.setAttribute("d", `M0,-2 ${ys.map((y, i) => `L${i * 40},${y.toFixed(1)}`).join(" ")} L1440,-2 Z`);
      shine.setAttribute("d", g > 0.5 ? waveShine(ys, -9, ph) : "");
    };
    // while it hangs, the glaze keeps rippling and swings deeper on a fast scroll, springing back when it stops
    const frame = (time, dtMs) => {
      const top = state();
      const dt = Math.max(1 / 240, (dtMs || 16) / 1000);
      const speed = prev == null ? 0 : Math.abs(prev - top) / innerHeight / dt;
      prev = top;
      sv += (Math.min(1, speed * 0.3) - s) * 0.1;
      sv *= 0.8;
      s += sv;
      draw(time);
      if (!g) {
        running = false;
        prev = null;
        s = sv = 0;
        gsap.ticker.remove(frame);
      }
    };
    const check = () => {
      state();
      if (g && !running) {
        running = true;
        gsap.ticker.add(frame);
      }
    };
    addEventListener("scroll", check, { passive: true });
    addEventListener("resize", check);
    check();
  }

  function reveals() {
    $$("[data-rise]").forEach((el) => {
      gsap.from(splitWords(el, "rise"), {
        yPercent: 115,
        rotate: 5,
        duration: 1.3,
        stagger: 0.07,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });

    const ups = $$("[data-up]");
    gsap.set(ups, { y: 50, opacity: 0 });
    ScrollTrigger.batch(ups, {
      start: "top 92%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: "expo.out" }),
    });

    $$("[data-to]").forEach((el) => {
      const to = Number(el.dataset.to);
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () => gsap.to(o, { v: to, duration: 2.2, ease: "power3.out", onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString("uk-UA"); } }),
      });
    });

    $$("[data-float]").forEach((el) => {
      const speed = parseFloat(el.dataset.float);
      gsap.to(el, {
        yPercent: speed * 70,
        rotation: "+=" + speed * -25,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }

  function doodle() {
    const path = $(".x-why__path path");
    if (!path) return;
    gsap.fromTo(path, { strokeDasharray: 1, strokeDashoffset: 1 }, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: { trigger: ".x-why__points", start: "top 75%", end: "bottom 60%", scrub: true },
    });
    $$(".x-point__n").forEach((n) => {
      gsap.from(n, { scale: 0, rotation: -90, duration: 0.9, ease: "back.out(2.5)", scrollTrigger: { trigger: n, start: "top 82%" } });
    });
  }

  function tilt() {
    if (!fine) return;
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotationY: x * 16, rotationX: -y * 16, transformPerspective: 700, duration: 0.6, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { rotationY: 0, rotationX: 0, duration: 1, ease: "elastic.out(1, 0.5)" }));
    });
  }

  /* ───────── ⑥ Each cake's own moment under the lamp ───────── */
  // A paper tag hangs from the lamp's rim on a string — a real pendulum, pushed about as the lamp travels the rail —
  // and twirls round to the line of the cake it reaches. The cake hops onto its plinth, a ring of light runs out under it,
  // and the lamp pours that cake's own weather: snow falling, petals and leaves fluttering, hearts rising off the cake,
  // cherries bouncing on the plinth, paw prints walking over the top. It keeps falling softly for as long as you stay
  const FX_ART = {
    heart: (c) => `<svg viewBox="0 0 24 24"><path fill="${c}" d="M12 21.2s-7.6-4.7-9.7-9.5C.9 8.4 2.9 4.8 6.4 4.8c2.3 0 3.7 1.3 4.5 2.7a1.3 1.3 0 0 0 2.2 0c.8-1.4 2.2-2.7 4.5-2.7 3.5 0 5.5 3.6 4.1 6.9-2.1 4.8-9.7 9.5-9.7 9.5z"/><ellipse cx="7.4" cy="8.6" rx="2.3" ry="1.3" fill="#fff" opacity=".55" transform="rotate(-38 7.4 8.6)"/></svg>`,
    snow: () => `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9.6 3.6 12 5.6l2.4-2M9.6 20.4 12 18.4l2.4 2M3.9 10.1l3.1-.6-.9-3M20.1 13.9l-3.1.6.9 3M3.9 13.9l3.1.6-.9 3M20.1 10.1l-3.1-.6.9-3"/></svg>`,
    petal: (c) => `<svg viewBox="0 0 24 24"><path fill="${c}" d="M12 1.5c4.6 4 6.3 9.6 0 21-6.3-11.4-4.6-17 0-21z"/><path d="M12 5c1.4 3.6 1.4 8 0 13" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`,
    leaf: (c) => `<svg viewBox="0 0 24 24"><path fill="${c}" d="M3.5 20.5C3 11 9 3.8 21 3c-.6 12-7.6 18-17.5 17.5z"/><path d="M3.5 20.5 15.5 8.5M9 15l-.6-4.2M12.4 11.6l-.2-3.6M9 15l4 .3M12.4 11.6l3.4.4" stroke="#fff" stroke-opacity=".35" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>`,
    feather: () => `<svg viewBox="0 0 24 24"><path fill="#fff" d="M19.8 2.6c-7.4 1.2-13 7.2-14 16.4 7.8-1.4 13-7.6 14-16.4z"/><path d="M3.6 21.4 19 3.4" stroke="#cdbfb0" stroke-width=".9" stroke-linecap="round"/></svg>`,
    star: (c) => `<svg viewBox="0 0 24 24"><path fill="${c}" d="M12 0c.9 6.6 4.4 10.4 12 12-7.6 1.6-11.1 5.4-12 12-.9-6.6-4.4-10.4-12-12C7.6 10.4 11.1 6.6 12 0z"/></svg>`,
    confetti: (c) => `<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="6" rx="3" fill="${c}"/></svg>`,
    cloud: () => `<svg viewBox="0 0 32 24"><path fill="#fff" d="M9 21h15.5a6 6 0 0 0 .7-12A8 8 0 0 0 9.8 8.3 6.4 6.4 0 0 0 9 21z"/></svg>`,
    bow: (c) => `<svg viewBox="0 0 24 24"><g fill="${c}"><path d="M12 11.5C9 6.5 3.5 4.6 2.6 8c-.8 3 3.6 6 9.4 3.5zM12 11.5c3-5 8.5-6.9 9.4-3.5.8 3-3.6 6-9.4 3.5z"/><path d="M11.2 12.2 8 21l2.2-.9 1.3 2 .9-9.4zM12.8 12.2 16 21l-2.2-.9-1.3 2-.9-9.4z"/></g><circle cx="12" cy="11.8" r="2.2" fill="${c}" stroke="rgba(0,0,0,.18)" stroke-width=".8"/></svg>`,
    paw: (c) => `<svg viewBox="0 0 24 24" fill="${c}"><ellipse cx="12" cy="16.2" rx="5.2" ry="4.4"/><ellipse cx="5.4" cy="10.4" rx="2.1" ry="2.7" transform="rotate(-20 5.4 10.4)"/><ellipse cx="9.6" cy="6.6" rx="2.1" ry="2.8" transform="rotate(-6 9.6 6.6)"/><ellipse cx="14.4" cy="6.6" rx="2.1" ry="2.8" transform="rotate(6 14.4 6.6)"/><ellipse cx="18.6" cy="10.4" rx="2.1" ry="2.7" transform="rotate(20 18.6 10.4)"/></svg>`,
    flag: () => `<svg viewBox="0 0 24 24"><path d="M5 2.5v20" stroke="#2a1a1a" stroke-width="1.6" stroke-linecap="round"/><path fill="#fff" stroke="#2a1a1a" stroke-width=".8" d="M5.8 3h14v10h-14z"/><path fill="#2a1a1a" d="M5.8 3h3.5v2.5H5.8zm7 0h3.5v2.5h-3.5zM9.3 5.5h3.5V8H9.3zm7 0h3.5V8h-3.5zM5.8 8h3.5v2.5H5.8zm7 0h3.5v2.5h-3.5zM9.3 10.5h3.5V13H9.3zm7 0h3.5V13h-3.5z"/></svg>`,
    berry: () => `<svg viewBox="0 0 24 24"><path fill="#e3263a" d="M12 22.5c-6.4-3.6-8.6-9-7-12.4 1.4-2.8 4.6-2.6 7-1.4 2.4-1.2 5.6-1.4 7 1.4 1.6 3.4-.6 8.8-7 12.4z"/><ellipse cx="8.4" cy="11.4" rx="1.6" ry="1" fill="#fff" opacity=".35" transform="rotate(-40 8.4 11.4)"/><g fill="#ffe28a"><ellipse cx="8.6" cy="13.4" rx=".55" ry=".85"/><ellipse cx="12" cy="12.4" rx=".55" ry=".85"/><ellipse cx="15.4" cy="13.4" rx=".55" ry=".85"/><ellipse cx="10.2" cy="16.4" rx=".55" ry=".85"/><ellipse cx="13.8" cy="16.4" rx=".55" ry=".85"/><ellipse cx="12" cy="19.4" rx=".55" ry=".85"/></g><path fill="#3f8f3a" d="M12 9.2C10.4 6.4 7.6 6 6.4 6.6 7.8 7 8.6 7.8 8.8 8.6 7.6 8.6 6.6 9.2 6.2 9.8 8.4 10.4 10.4 10 12 9.2zm0 0c1.6-2.8 4.4-3.2 5.6-2.6-1.4.4-2.2 1.2-2.4 2 1.2 0 2.2.6 2.6 1.2-2.2.6-4.2.2-5.8-.6z"/><path d="M12 9V5" stroke="#3f8f3a" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    cherry: () => `<img src="${MARIDAY.root}img/cakes/cherries.png" alt="" draggable="false">`,
  };
  const FX_MODE = { heart: "rise", cloud: "rise", star: "twinkle", paw: "stamp", berry: "heavy", cherry: "heavy" }; // the rest fall
  const FX_SIZE = { heart: [18, 34], cloud: [30, 46], snow: [12, 28], petal: [15, 26], leaf: [18, 30], feather: [22, 34], confetti: [13, 20], bow: [20, 30], flag: [22, 32], paw: [18, 26], star: [16, 30], berry: [20, 28], cherry: [28, 38] };
  const FX_FLIP = new Set(["petal", "leaf", "confetti", "feather", "bow"]);
  const LEAVES = ["#e07b28", "#b4441c", "#e6a93a", "#8a3a16"];
  const hex6 = (h) => (/^#[0-9a-f]{6}$/i.test(h || "") ? h : "#c9506d");

  function lampMoments(sec, track, items, state) {
    const lamp = $(".gl__lamp", sec);
    if (!lamp || !items.length) return;
    const R = gsap.utils.random;
    const clamp = gsap.utils.clamp;
    const moods = items.map((el, i) => (el.classList.contains("ex--yours") ? YOURS_MOOD : MOODS[i] || YOURS_MOOD));
    const accents = items.map((el) => hex6(el.style.getPropertyValue("--ac").trim()));
    const bodyOf = (item) => $(".ex__cake", item) || $(".ex__ghost", item) || $(".ex__stage", item);

    // the tag: a string from the lamp's rim, a paper tag with a punched hole and a gold eyelet
    const tag = document.createElement("div");
    tag.className = "gl__tag";
    tag.setAttribute("aria-hidden", "true");
    tag.innerHTML = '<i class="gl__tag-string"></i><span class="gl__tag-hang"><span class="gl__tag-card"><span class="gl__tag-text"></span></span></span>';
    // it lives in the row, over the cakes and under the weather; it is placed back at the lamp every frame
    track.append(tag);
    const str = $(".gl__tag-string", tag);
    const hang = $(".gl__tag-hang", tag);
    const card = $(".gl__tag-card", tag);
    const text = $(".gl__tag-text", tag);
    let shown = -1, cardH = 0, cardW = 0, len = 0, vis = 0, th = 0, w = 0, ppx = null, pvx = 0, axs = 0, twirl = null;
    const measure = () => { cardH = card.offsetHeight; cardW = card.offsetWidth; };
    const write = (i) => { text.textContent = moods[i].line; shown = i; measure(); };
    addEventListener("resize", measure);
    if (document.fonts) document.fonts.ready.then(measure);

    // the weather rides along with the row, so what fell on a cake moves on with it
    const layer = document.createElement("div");
    layer.className = "gl__fx";
    layer.setAttribute("aria-hidden", "true");
    track.append(layer);
    const MAX = fine ? 46 : 24;
    const pool = [];
    const live = [];
    const popEase = gsap.parseEase("back.out(2.6)");

    // measured once a frame, before anything in it is written (a read after a write lays the page out again)
    const geo = (i, tr, sr, lampTop) => {
      const s = state();
      const t = (s.tilt * Math.PI) / 180;
      const c = bodyOf(items[i]).getBoundingClientRect();
      const p = $(".ex__plinth", items[i]).getBoundingClientRect();
      return {
        cx: c.left + c.width / 2 - tr.left, top: c.top - tr.top, w: Math.max(c.width, 60), h: Math.max(c.height, 60),
        pl: p.left - tr.left, pw: p.width, floor: p.top - tr.top,
        // the bulb under the shade, where the weather pours from
        bx: s.lx - 33 * Math.sin(t) - tr.left, by: sr.top + lampTop + 33 * Math.cos(t) - tr.top,
      };
    };
    const paint = (k, f, ac) => {
      if (k === "heart") return f.col || ac;
      if (k === "petal") return shade(ac, R([0.3, 0.5, 0.72]));
      if (k === "leaf") return R(LEAVES);
      if (k === "bow") return shade(ac, R([0.25, 0.55]));
      if (k === "confetti") return R([...SPRINKLE.slice(0, 4), ac]);
      if (k === "star") return R(["#f3cc63", "#ffe9a8", "#fff6d8"]);
      if (k === "paw") return shade(ac, -0.12);
      return "#fff";
    };
    let stampN = 0;
    const spawn = (i, f, g) => {
      if (live.length >= MAX || !g) return;
      const k = f.k;
      const mode = FX_MODE[k] || "fall";
      const col = paint(k, f, accents[i]);
      const el = pool.pop() || layer.appendChild(document.createElement("i"));
      el.className = `gl__p gl__p--${k}` + (k === "snow" || k === "cloud" || k === "feather" || col === "#ffffff" ? " is-white" : "");
      el.innerHTML = FX_ART[k](col);
      const s = R(FX_SIZE[k][0], FX_SIZE[k][1]);
      el.style.setProperty("--s", s.toFixed(0) + "px");
      const p = { el, k, mode, t: 0, r: R(-30, 30), vr: R(-90, 90), ph: R(0, 6.28), amp: 0, fw: 1, bounces: 0, rest: 0 };
      if (mode === "fall" || mode === "heavy") {
        // fruit drops out of the lamp; light things fall all through the upper part of the beam
        const sky = mode === "heavy" ? 0 : R(0, 1) ** 0.7 * Math.max(0, g.top - 40 - g.by);
        p.x = g.bx + R(-6, 6) + R(-0.5, 0.5) * sky * 1.3;
        p.y = g.by + R(0, 14) + sky;
        const tx = g.pl + g.pw * R(0.1, 0.9); // it comes down over the plinth
        p.floor = g.floor + R(-0.02, 0.05) * g.pw;
        const D = Math.max(60, p.floor - p.y);
        if (mode === "heavy") {
          p.vy = R(0, 40);
          p.vx = (tx - p.x) / Math.sqrt((2 * D) / 1500);
        } else {
          p.vt = k === "feather" ? R(70, 100) : k === "snow" ? R(90, 130) : R(115, 170);
          p.vy = 70;
          p.vx = (tx - p.x) / (D / p.vt);
          p.amp = R(10, 26);
          p.fw = R(1.6, 3);
          if (k === "snow") p.vr = R(-40, 40);
        }
      } else if (mode === "rise") {
        p.x = g.cx + R(-0.4, 0.4) * g.w;
        p.y = g.top + g.h * R(0.1, 0.5);
        p.vy = -R(30, 55);
        p.vx = R(-8, 8);
        p.life = R(2.2, 3.2);
        p.amp = R(6, 16);
        p.fw = R(1.5, 2.6);
      } else if (mode === "twinkle") {
        p.x = g.cx + R(-0.75, 0.75) * g.w;
        p.y = g.top + R(-0.35, 0.55) * g.h;
        p.vy = R(4, 14);
        p.vx = 0;
        p.vr = R(-40, 40);
        p.life = R(1.1, 1.7);
      } else {
        // paw prints run round the cake — up one side, over its top, down the other — left foot, right foot
        const u = Math.PI * (0.85 + ((stampN++ % 11) / 10) * 1.3);
        const rx = g.w * 0.5 + 30, ry = g.h * 0.55 + 4, cy = g.top + g.h * 0.55;
        const side = stampN % 2 ? 1 : -1;
        const a = Math.atan2(ry * Math.cos(u), -rx * Math.sin(u)); // the way it runs, clockwise
        p.x = g.cx + rx * Math.cos(u) - Math.sin(a) * side * 8;
        p.y = cy + ry * Math.sin(u) + Math.cos(a) * side * 8;
        p.r = (a * 180) / Math.PI + 90;
        p.vx = p.vy = p.vr = 0;
        p.life = 2.4;
      }
      live.push(p);
    };

    // a cake reaching the light: it hops onto its plinth, the ring runs out, the tag twirls round, the weather bursts out
    const hops = new Map();
    const hopVals = new Map();
    let lit = -1, queue = [], emitAt = 0, trickle = 0;
    const arrive = (i, time) => {
      const item = items[i];
      hops.get(item)?.kill();
      // the hop runs on plain numbers written out each frame: a tween of the page's own values reads them first,
      // and that read lays out the whole hall in the middle of the scroll
      let h = hopVals.get(item);
      if (!h) hopVals.set(item, (h = { hop: 0, sx: 1, sy: 1, rg: 0 }));
      const out = () => {
        item.style.setProperty("--hop", h.hop.toFixed(2));
        item.style.setProperty("--sx", h.sx.toFixed(3));
        item.style.setProperty("--sy", h.sy.toFixed(3));
        item.style.setProperty("--rg", h.rg.toFixed(3));
      };
      hops.set(item, gsap.timeline({ onUpdate: out })
        .to(h, { hop: 26, sx: 0.95, sy: 1.06, duration: 0.22, ease: "power2.out" })
        .to(h, { hop: 0, sx: 1, sy: 1, duration: 0.2, ease: "power2.in" })
        .to(h, { sx: 1.07, sy: 0.92, duration: 0.07, ease: "power1.out" })
        .fromTo(h, { rg: 0 }, { rg: 1, duration: 0.9, ease: "power2.out" }, "<")
        .to(h, { sx: 1, sy: 1, duration: 0.8, ease: "elastic.out(1, 0.35)" }, "<0.07"));
      if (shown < 0 || vis < 0.05) write(i);
      else if (shown !== i) {
        if (twirl) twirl.kill();
        w += (Math.random() < 0.5 ? -1 : 1) * 1.4;
        twirl = gsap.timeline()
          .to(card, { rotationY: 90, duration: 0.16, ease: "power2.in" })
          .call(() => write(i))
          .fromTo(card, { rotationY: -90 }, { rotationY: 0, duration: 1.1, ease: "elastic.out(1, 0.45)" });
      }
      stampN = 0;
      const fx = moods[i].fx;
      queue = Array.from({ length: fine ? 18 : 10 }, (_, n) => ({ i, f: fx[n % fx.length], at: time + 0.12 + n * 0.055 }));
      emitAt = time + 1.2;
    };

    gsap.ticker.add((time, dtMs) => {
      const st = state();
      if (!st.active || st.lx == null) return;
      const dt = clamp(1 / 240, 1 / 20, dtMs / 1000);

      // a cake still flying off the stand gets its moment once it has landed
      if (st.aim !== lit) {
        const body = st.aim >= 0 && $(".ex__cake", items[st.aim]);
        if (!body || body.style.opacity !== "0") {
          lit = st.aim;
          if (lit >= 0) arrive(lit, time);
          else queue = [];
        }
      }
      // every measurement of the frame first
      const tr = track.getBoundingClientRect(), sr = sec.getBoundingClientRect();
      const lampTop = lamp.offsetTop;
      const due = lit >= 0 && live.length < MAX && ((queue.length && queue[0].at <= time) || time >= emitAt);
      const g = due ? geo(lit, tr, sr, lampTop) : null;
      const litTop = lit >= 0 && shown >= 0 && cardH ? bodyOf(items[lit]).getBoundingClientRect().top : 0;
      while (queue.length && queue[0].at <= time) { const q = queue.shift(); if (q.i === lit) spawn(q.i, q.f, g); }
      if (lit >= 0 && time >= emitAt) {
        emitAt = time + (fine ? 0.17 : 0.3);
        const fx = moods[lit].fx;
        spawn(lit, fx[trickle++ % fx.length], g);
      }

      // the tag hangs from the rim of the shade, for as long as there is room above the cake in the light
      const t = (st.tilt * Math.PI) / 180;
      const px = st.lx + 20 * Math.cos(t) - 31 * Math.sin(t);
      const py = lampTop + 20 * Math.sin(t) + 31 * Math.cos(t);
      let want = 0, sc = 1, fits = false;
      if (lit >= 0 && shown >= 0 && cardH) {
        const top = litTop - sr.top;
        const room = top - py - 14;
        sc = Math.min(1, (room - 16) / cardH);
        // and only once the whole tag is on screen: while a cake is still sliding in at the edge, it waits rolled up
        fits = sc > 0.62 && px - (cardW * sc) / 2 > 6 && px + (cardW * sc) / 2 < innerWidth - 6;
        want = fits ? Math.min(110, room - cardH * sc) : 0;
      }
      vis += ((fits ? 1 : 0) - vis) * (fits ? 0.07 : 0.16);
      len += (want - len) * 0.1;
      // a pendulum on a moving lamp: gravity pulls it straight, the lamp's acceleration swings it, a breath of air keeps it alive
      const vx = ppx == null ? 0 : (px - ppx) / dt;
      ppx = px;
      axs += (clamp(-5000, 5000, (vx - pvx) / dt) - axs) * 0.35;
      pvx = vx;
      const L = Math.max(40, len * vis + cardH * sc * 0.55);
      w += ((-2400 * Math.sin(th) + axs * Math.cos(th)) / L - 2.6 * w + Math.sin(time * 1.3) * 0.35) * dt;
      th = clamp(-0.75, 0.75, th + w * dt);
      const drop = len * vis;
      tag.style.transform = `translate(${(px - tr.left).toFixed(1)}px, ${(py + sr.top - tr.top).toFixed(1)}px) rotate(${th.toFixed(4)}rad)`;
      str.style.height = (drop + 11 * sc).toFixed(1) + "px";
      hang.style.transform = `translateY(${drop.toFixed(1)}px) scale(${(sc * (0.55 + vis * 0.45)).toFixed(3)})`;
      hang.style.opacity = vis.toFixed(3);
      tag.style.visibility = vis < 0.01 ? "hidden" : "";

      // the weather
      for (let n = live.length - 1; n >= 0; n--) {
        const p = live[n];
        p.t += dt;
        let x = p.x, sx = 1, sy = 1, op = 1, dead = false;
        if (p.mode === "fall") {
          p.vy += (p.vt - p.vy) * Math.min(1, dt * 2.5);
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.r += p.vr * dt;
          x = p.x + Math.sin(p.t * p.fw + p.ph) * p.amp;
          if (FX_FLIP.has(p.k)) sx = Math.cos(p.t * p.fw * 1.7 + p.ph);
          op = Math.min(1, p.t / 0.25) * clamp(0, 1, (p.floor - p.y) / 36);
          dead = p.y >= p.floor || p.t > 12;
        } else if (p.mode === "heavy") {
          if (!p.rest) {
            p.vy += 1500 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.r += p.vr * dt;
            if (p.y >= p.floor) {
              p.y = p.floor;
              if (p.bounces++ < 2 && p.vy > 140) { p.vy *= -0.36; p.vx *= 0.45; p.vr *= 0.5; } else { p.rest = p.t; p.vy = 0; }
            }
          }
          x = p.x;
          op = Math.min(1, p.t / 0.15) * (p.rest ? clamp(0, 1, 1 - (p.t - p.rest - 0.9) / 0.5) : 1);
          dead = (p.rest && p.t - p.rest > 1.4) || p.t > 8;
        } else if (p.mode === "rise") {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          x = p.x + Math.sin(p.t * p.fw + p.ph) * p.amp;
          p.r = Math.sin(p.t * p.fw + p.ph) * 14;
          sx = sy = 0.3 + 0.7 * popEase(Math.min(1, p.t / 0.4));
          op = clamp(0, 1, p.t / 0.15) * clamp(0, 1, (p.life - p.t) / 0.8);
          dead = p.t > p.life;
        } else if (p.mode === "twinkle") {
          p.y += p.vy * dt;
          p.r += p.vr * dt;
          sx = sy = Math.max(0, Math.sin((Math.PI * p.t) / p.life));
          dead = p.t > p.life;
        } else {
          sx = sy = popEase(Math.min(1, p.t / 0.3));
          op = clamp(0, 1, (p.life - p.t) / 0.7);
          dead = p.t > p.life;
        }
        if (dead) {
          p.el.style.opacity = 0;
          pool.push(p.el);
          live.splice(n, 1);
          continue;
        }
        p.el.style.transform = `translate3d(${x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotate(${p.r.toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
        p.el.style.opacity = op.toFixed(3);
      }
    }, false, true); // first in the frame: it measures the page as last painted, before the hall's own frame writes to it
  }

  function horizontal() {
    const sec = $(".gl");
    const track = $(".gl__track", sec);
    if (!sec || !track) return;
    const items = $$(".ex", sec);
    // the row travels until its last card stands in the middle, under the lamp
    const tail = items[items.length - 1];
    const dist = () => Math.max(0, tail ? tail.offsetLeft + tail.offsetWidth / 2 - innerWidth / 2 : track.scrollWidth - innerWidth);

    // Phones: nothing travels sideways. The hall becomes a stage with a trapdoor under the lamp: the title rises away
    // like a curtain, and the cakes come up through the floor on their plinths one at a time — each one holds the light,
    // then sinks back as the next comes up behind it. Scroll steps are in "stops": the title, then one per cake
    const liftMQ = matchMedia("(max-width: 760px)");
    let lift = liftMQ.matches;
    const hall = $(".gl__hall", sec);
    const N = items.length;
    const LIFT_IN = 1, LIFT_OUT = 0.35;
    const stops = () => LIFT_IN + (N - 1) + LIFT_OUT;
    const len = () => (lift ? stops() * innerHeight * 0.42 : dist() * 0.75);
    // how far a cake has come up out of the floor, by its distance in stops from the one being shown: the one leaving
    // goes down quickly, and the next is already on its way up behind it
    const liftH = (d) => {
      const t = d < 0 ? (0.75 + d) / 0.6 : (0.45 - d) / 0.37;
      const k = Math.min(1, Math.max(0, t));
      return k * k * (3 - 2 * k);
    };
    // a stop never rests half-way through the floor: the scroll settles on the nearest cake standing in full
    const liftSnap = (v) => {
      const T = stops();
      const at = [0, ...items.map((c, i) => (LIFT_IN + i) / T), 1];
      return at.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
    };
    const tween = gsap.to(track, {
      x: () => (lift ? 0 : -dist()),
      ease: "none",
      scrollTrigger: {
        trigger: sec, start: "top top", end: () => "+=" + len(), invalidateOnRefresh: true, pin: true, scrub: 0.8, anticipatePin: 1,
        snap: { snapTo: (v, st) => (lift ? liftSnap(v) : st.progress), duration: { min: 0.2, max: 0.6 }, delay: 0.15, ease: "power2.inOut" },
      },
    });
    gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + len(), scrub: 1 } })
      .to($$(".gl__berry", sec), { x: (i) => -innerWidth * (0.45 + i * 0.25), y: (i) => (i ? -60 : 40), rotation: (i) => (i ? 40 : -30), ease: "none" }, 0);
    // while the room holds the top of the screen the body wears its colour: Safari paints its status bar and the strip
    // under its bottom bar with the body, so on a phone the room runs edge to edge instead of sitting in cherry/mint bands
    const pinned = tween.scrollTrigger;
    document.body.style.setProperty("--edge-gl", getComputedStyle(sec).getPropertyValue("--bg").trim());
    sec.style.setProperty("--edge-gl", document.body.style.getPropertyValue("--edge-gl"));
    ScrollTrigger.create({
      start: () => pinned.start,
      end: () => pinned.end + sec.offsetHeight,
      onToggle: (st) => document.body.classList.toggle("is-edge-gl", st.isActive),
    });

    // the stage floor with its trapdoor, in two sheets of the same floor: the far one behind the plinths with the dark
    // hole in it, the near one in front with the hole's front half cut out, so a plinth comes up out of the hole
    const back = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const front = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    back.setAttribute("class", "gl__floor gl__floor--back");
    front.setAttribute("class", "gl__floor gl__floor--front");
    [back, front].forEach((s) => s.setAttribute("aria-hidden", "true"));
    track.prepend(back);
    track.append(front);
    let liftHt = [];
    const layoutLift = () => {
      if (!lift) return;
      const W = sec.clientWidth, H = sec.clientHeight;
      const cw = items[0] ? items[0].offsetWidth : W * 0.6;
      const F = Math.round(gsap.utils.clamp(84, 130, H * 0.15));
      const rx = cw * 0.47, ry = rx * 0.24, depth = 22;
      const y0 = depth + ry, Hf = Math.ceil(F + y0), cx = W / 2;
      sec.style.setProperty("--floor", F + "px");
      sec.style.setProperty("--hry", ry.toFixed(1) + "px");
      [back, front].forEach((s) => { s.setAttribute("viewBox", `0 0 ${W} ${Hf}`); s.style.height = Hf + "px"; });
      const f = (n) => n.toFixed(1);
      back.innerHTML = `<defs>
          <linearGradient id="gl-floor" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${Hf}"><stop offset="0" class="gl__floor-far"/><stop offset="1" class="gl__floor-near"/></linearGradient>
          <radialGradient id="gl-floor-hi" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(y0)}" r="${f(W * 0.62)}" gradientTransform="translate(${f(cx)} ${f(y0)}) scale(1 0.42) translate(${f(-cx)} ${f(-y0)})"><stop offset="0" stop-color="#fffaf0" stop-opacity="0.75"/><stop offset="1" stop-color="#fffaf0" stop-opacity="0"/></radialGradient>
          <radialGradient id="gl-hole" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(y0 - ry * 0.35)}" r="${f(rx)}" gradientTransform="translate(${f(cx)} ${f(y0)}) scale(1 0.3) translate(${f(-cx)} ${f(-y0)})"><stop offset="0" stop-color="#1c0102"/><stop offset="0.7" stop-color="#3d0305"/><stop offset="1" stop-color="#7c1a1c"/></radialGradient>
          <radialGradient id="gl-puff" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(y0)}" r="${f(rx)}" gradientTransform="translate(${f(cx)} ${f(y0)}) scale(1 0.3) translate(${f(-cx)} ${f(-y0)})"><stop offset="0" stop-color="#fff3d6" stop-opacity="0.95"/><stop offset="0.6" stop-color="#ffd9a8" stop-opacity="0.35"/><stop offset="1" stop-color="#ffd9a8" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="${W}" height="${Hf}" fill="url(#gl-floor)"/>
        <rect class="gl__floor-hi" width="${W}" height="${Hf}" fill="url(#gl-floor-hi)"/>
        <path class="gl__floor-seam" d="M0,0.75 H${W}"/>
        <ellipse cx="${f(cx)}" cy="${f(y0)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#gl-hole)"/>
        <ellipse class="gl__floor-puff" cx="${f(cx)}" cy="${f(y0)}" rx="${f(rx * 0.92)}" ry="${f(ry * 0.8)}" fill="url(#gl-puff)"/>`;
      // the near sheet starts a hair under the seam, so the seam line drawn on the far one stays in view
      front.innerHTML = `<path d="M0,1.5 H${f(cx - rx)} V${f(y0)} A${f(rx)},${f(ry)} 0 0 0 ${f(cx + rx)},${f(y0)} V1.5 H${W} V${Hf} H0 Z" fill="url(#gl-floor)"/>
        <path class="gl__floor-hi" d="M0,1.5 H${f(cx - rx)} V${f(y0)} A${f(rx)},${f(ry)} 0 0 0 ${f(cx + rx)},${f(y0)} V1.5 H${W} V${Hf} H0 Z" fill="url(#gl-floor-hi)"/>
        <path class="gl__floor-rim" d="M${f(cx - rx)},${f(y0)} A${f(rx)},${f(ry)} 0 0 0 ${f(cx + rx)},${f(y0)}"/>`;
      liftHt = items.map((c) => c.offsetHeight);
    };
    // leaving the stage for the row: whatever the stage wrote on the hall and the plinths is taken back
    const unlift = () => {
      items.forEach((c) => ["--sink", "visibility", "z-index"].forEach((p) => put(c, p, "")));
      if (hall) ["transform", "opacity"].forEach((p) => put(hall, p, ""));
      put(sec, "--puff", "");
    };
    sec.classList.toggle("is-lift", lift);
    layoutLift();
    addEventListener("resize", layoutLift);
    ScrollTrigger.addEventListener("refreshInit", layoutLift);
    liftMQ.addEventListener("change", () => {
      lift = liftMQ.matches;
      sec.classList.toggle("is-lift", lift);
      if (lift) layoutLift(); else unlift();
    });
    const FOCUS = 0.5; // where on screen a card counts as "in focus": the middle, under the title

    // Intro: the title waits in the dark; as the lamp comes on above it, «Обрані» rises letter by letter,
    // a glint runs across the gold of «роботи», the 8 counts up, the words light up as if the beam passes over them
    const w1 = $(".gl__w1", sec);
    const chars = [];
    if (w1) {
      w1.innerHTML = [...w1.textContent].map((ch) => `<i class="gl__ch"><i>${ch}</i></i>`).join("");
      chars.push(...$$(".gl__ch > i", w1));
    }
    // each letter knows where it sits in the word, so the lamp's light runs across the word as one surface
    const placeChars = () => chars.forEach((ch) => ch.style.setProperty("--cx", ch.parentNode.offsetLeft + "px"));
    placeChars();
    if (document.fonts) document.fonts.ready.then(placeChars);
    addEventListener("resize", placeChars);
    let introDone = false;

    // The film poured into «Обрані»: one video spans the whole word, each letter draws its own part of it,
    // cut to the letter's outline — so the letters can still rise and wobble one by one
    const reel = $(".gl__reel", sec);
    const reelOn = !!(reel && w1 && chars.length);
    // the film is re-coloured as cherry glaze (a duotone: its shadows deep cherry, its lights red), whatever the scene
    const REEL = { light: "#c0202a", dark: "#3d0305", fx: 0.5, fy: 0.42, zoom: 1.15 };
    let pens = [];
    const reelLayout = () => {
      if (!reelOn) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const cs = getComputedStyle(chars[0]);
      const size = parseFloat(cs.fontSize);
      const lh = parseFloat(cs.lineHeight) || size * 0.9;
      const font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      pens = chars.map((ch) => {
        let cv = $("canvas", ch);
        if (!cv) { cv = document.createElement("canvas"); ch.append(cv); }
        const w = ch.offsetWidth, h = ch.offsetHeight;
        cv.width = Math.ceil(w * dpr);
        cv.height = Math.ceil(h * dpr);
        const ctx = cv.getContext("2d");
        ctx.font = font;
        const letter = ch.firstChild.textContent.toUpperCase();
        const m = ctx.measureText(letter);
        // where CSS puts the baseline in a line box of this height: half the leading, then the font's ascent
        const base = (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent + (h - lh) / 2;
        return { cv, ctx, dpr, w, h, letter, base, font, x: ch.offsetLeft, y: ch.offsetTop };
      });
      reelW = w1.offsetWidth;
      reelH = w1.offsetHeight;
      reelL = -1;
    };
    // the word's size is measured with the letters, not on every frame (a read there would force a layout each time)
    let reelW = 0, reelH = 0, reelL = -1, reelAt = 0;
    const reelDraw = () => {
      if (!pens.length || reel.readyState < 2) return;
      const W = reelW, H = reelH;
      const lxt = parseFloat(w1.style.getPropertyValue("--lxt")) || W / 2;
      // the film runs at 30 frames a second and a phone screen refreshes at 60–120: paint the letters only when there
      // can be a new frame of it, or when the light on them has moved
      const now = performance.now();
      if ((reel.paused || now - reelAt < 30) && Math.abs(lxt - reelL) < 0.5) return;
      reelAt = now;
      reelL = lxt;
      const vw = reel.videoWidth, vh = reel.videoHeight;
      const k = Math.max(W / vw, H / vh) * REEL.zoom;
      const ox = (W - vw * k) * REEL.fx, oy = (H - vh * k) * REEL.fy;
      pens.forEach((p) => {
        const { ctx, dpr, w, h } = p;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(reel, ox - p.x, oy - p.y, vw * k, vh * k);
        // cherry duotone: drain the colour, multiply by the red, lift the blacks to deep cherry; then the lamp's highlight
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = "#808080";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = REEL.light;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = REEL.dark;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "screen";
        const g = ctx.createRadialGradient(lxt - p.x, -h * 0.4, 0, lxt - p.x, -h * 0.4, h * 2.6);
        g.addColorStop(0, "rgba(255, 190, 180, 0.55)");
        g.addColorStop(0.4, "rgba(255, 150, 150, 0.12)");
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "destination-in";
        ctx.font = p.font;
        ctx.fillStyle = "#000";
        ctx.fillText(p.letter, 0, p.base);
      });
    };
    if (reelOn) {
      const ready = () => { reelLayout(); w1.classList.add("is-reel"); };
      const whenFonts = document.fonts ? document.fonts.ready : Promise.resolve();
      whenFonts.then(() => (reel.readyState >= 2 ? ready() : reel.addEventListener("loadeddata", ready, { once: true })));
      addEventListener("resize", reelLayout);
    }

    // the visitor's torch: over the text the pointer becomes a warm light, and the letters' shadows turn away from it
    let torch = null;
    const introBox = $(".gl__intro", sec);
    if (fine && introBox) {
      introBox.addEventListener("pointermove", (e) => {
        const r = introBox.getBoundingClientRect();
        torch = { x: e.clientX, y: e.clientY };
        introBox.style.setProperty("--mx", (e.clientX - r.left + r.width * 0.12).toFixed(0) + "px");
        introBox.style.setProperty("--my", (e.clientY - r.top + r.height * 0.12).toFixed(0) + "px");
        introBox.style.setProperty("--torch", 1);
      });
      introBox.addEventListener("pointerleave", () => { torch = null; introBox.style.setProperty("--torch", 0); });
    }
    // starts while the hall is still opening and is all in place within about a second, so nobody walks into an empty room
    gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 65%" } })
      .from(chars, { yPercent: 115, rotate: 10, duration: 0.8, stagger: 0.035, ease: "expo.out" }, 0.1)
      .fromTo($(".gl__light", sec), { opacity: 0, scale: 0.6, rotation: -20, "--gp": "100%" }, { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" }, 0.3)
      .from($$(".gl__berry", sec), { scale: 0, opacity: 0, duration: 0.9, stagger: 0.1, ease: "back.out(1.8)" }, 0.35)
      .from($$(".gl__call", sec), { opacity: 0, y: (i) => (i ? 16 : -16), duration: 0.6, stagger: 0.12, ease: "power3.out" }, 0.5)
      .to($(".gl__light", sec), { "--gp": "0%", duration: 1.2, ease: "power2.inOut" }, 0.4)
      .call(() => { introDone = true; }, null, 1.6);

    // touch a letter and it wobbles like jelly
    if (fine) chars.forEach((ch) => ch.parentNode.addEventListener("pointerenter", () => {
      gsap.fromTo(ch, { scaleX: 1.25, scaleY: 0.72 }, { scaleX: 1, scaleY: 1, duration: 1, ease: "elastic.out(1.2, 0.3)", overwrite: "auto" });
    }));

    // Miniatures on the shelf: each stands where its cake reaches focus, a click scrolls there
    const dots = $$("[data-gl-dots] button", sec);
    let marks = [];
    const place = () => {
      const d = dist() || 1;
      const x0 = track.getBoundingClientRect().left;
      marks = items.map((c, i) => {
        if (lift) return (LIFT_IN + i) / stops();
        const r = c.getBoundingClientRect();
        return gsap.utils.clamp(0, 1, (r.left - x0 + r.width / 2 - innerWidth * FOCUS) / d);
      });
      dots.forEach((b, i) => { b.style.left = (i / Math.max(1, dots.length - 1)) * 100 + "%"; });
    };
    // the miniatures stand evenly spaced, so scroll progress is remapped: the cherry reaches each one exactly as its cake reaches the lamp
    const along = (p) => {
      const n = marks.length;
      if (n < 2) return p;
      for (let i = 0; i < n - 1; i++) {
        const a = marks[i], b = marks[i + 1];
        if (p <= b || i === n - 2) return (i + (b > a ? gsap.utils.clamp(0, 1, (p - a) / (b - a)) : 1)) / (n - 1);
      }
      return 1;
    };
    place();
    ScrollTrigger.addEventListener("refreshInit", place);
    dots.forEach((b, i) => b.addEventListener("click", () => {
      const st = tween.scrollTrigger;
      const y = st.start + (marks[i] ?? 0) * (st.end - st.start);
      if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else scrollTo(0, y);
    }));

    const nowEl = $("[data-gl-now]", sec);
    const bar = $(".gl__bar", sec);
    const swap = (el, text) => {
      if (!el || el.textContent === text) return;
      gsap.timeline()
        .fromTo(el, { yPercent: 0, opacity: 1 }, { yPercent: -50, opacity: 0, duration: 0.18, ease: "power2.in" })
        .call(() => { el.textContent = text; })
        .fromTo(el, { yPercent: 50, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "expo.out" });
    };
    // each cake's colours sit in its own style attribute; the computed style is the fallback
    const tone = (el) => {
      const bg = el.style.getPropertyValue("--bg").trim(), ac = el.style.getPropertyValue("--ac").trim();
      if (bg && ac) return { bg, ac };
      const cs = getComputedStyle(el);
      return { bg: cs.getPropertyValue("--bg").trim(), ac: cs.getPropertyValue("--ac").trim() };
    };
    // the hall's colours now, kept here so the colour change never reads them back from the page
    let hue = null;
    const focus = (i) => {
      const t = tone(items[i]);
      const name = items[i].dataset.name || "Ваш торт";
      if (!hue) hue = tone(sec);
      gsap.to(hue, {
        bg: t.bg, ac: t.ac, duration: 0.9, ease: "power2.out", overwrite: "auto",
        onUpdate: () => { sec.style.setProperty("--bg", hue.bg); sec.style.setProperty("--ac", hue.ac); },
      });
      // set at once, not tweened: a value changing on the body restyles the whole page on every frame,
      // and Safari only re-reads its bar colour while scrolling anyway
      document.body.style.setProperty("--edge-gl", t.bg);
      sec.style.setProperty("--edge-gl", t.bg); // the body's copy does not reach the room (css/home.css @property)
      swap(nowEl, name);
      dots.forEach((b, k) => b.classList.toggle("is-on", k === i));
    };

    let active = false;
    let last = -1;
    let hallK = 0; // on the stage: how far the title has risen out of the way (1 = gone)
    let aim = -1; // the cake the lamp is lighting right now; -1 while it is on the title
    let lx = null;
    let tilt = 0;
    let il = 1;
    const intro = $(".gl__intro", sec);
    const note = intro;
    const titleEl = intro && $(".gl__title", intro);
    const golds = $$(".gl__light", sec).map((el) => ({ el, p: 0 }));
    const lampY = 110;

    // walking in, the hall is dim; the lamp stutters on and lands its beam on the first cake
    gsap.set(sec, { "--lamp": 0, "--dim": 1 });
    gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 65%" } })
      .to(sec, { keyframes: [
        { "--lamp": 0.9, duration: 0.05 }, { "--lamp": 0.1, duration: 0.07 }, { "--lamp": 0.7, duration: 0.04 },
        { "--lamp": 0.05, duration: 0.1 }, { "--lamp": 1, duration: 0.06 }, { "--lamp": 0.6, duration: 0.04 }, { "--lamp": 1, duration: 0.12 },
      ], ease: "none" }, 0)
      .to(sec, { "--dim": 0, duration: 0.9, ease: "power2.out" }, 0.3);
    new IntersectionObserver(([e]) => { active = e.isIntersecting; }).observe(sec);
    // a style value that has not changed is not written again: every write makes the browser restyle the hall
    const written = new WeakMap();
    const put = (el, prop, v) => {
      let m = written.get(el);
      if (!m) written.set(el, (m = {}));
      if (m[prop] === v) return;
      m[prop] = v;
      el.style.setProperty(prop, v);
    };
    gsap.ticker.add(() => {
      if (!active) return;
      const vw = innerWidth;
      let best = Infinity;
      let idx = last < 0 ? 0 : last;
      // all the measuring first, then all the writing: a read after a write forces a fresh layout, on every frame
      const rects = items.map((c) => c.getBoundingClientRect());
      const nr = note && note.getBoundingClientRect();
      const tt = titleEl && titleEl.getBoundingClientRect();
      const w1Left = w1 && tt ? w1.getBoundingClientRect().left : 0;
      const goldRects = introDone && tt ? golds.map((g) => g.el.getBoundingClientRect()) : null;
      let onNote;
      if (lift) {
        // the stage: where the scroll is, in stops after the title; each cake's height out of the floor follows from it
        const s = tween.progress() * stops() - LIFT_IN;
        idx = gsap.utils.clamp(0, N - 1, Math.round(s));
        let puff = 0;
        items.forEach((c, i) => {
          const d = s - i;
          // the last one stays up as the stage scrolls away
          const h = i === N - 1 && d > 0 ? 1 : liftH(d);
          if (h > 0 && h < 1) puff = Math.max(puff, Math.sin(Math.PI * h));
          put(c, "--sink", ((1 - h) * ((liftHt[i] || 400) + 30)).toFixed(1) + "px");
          put(c, "--on", h.toFixed(3));
          put(c, "visibility", h > 0.001 ? "" : "hidden");
          // the one coming up stands in front of the one going down
          put(c, "z-index", d < 0 ? "2" : "1");
        });
        put(sec, "--puff", puff.toFixed(3));
        // the title and the cake stand rise out of the way like a curtain as the first cake comes up
        hallK = gsap.utils.clamp(0, 1, (s + LIFT_IN) / 0.5);
        if (hall) {
          put(hall, "transform", `translateY(${(-hallK * innerHeight * 0.8).toFixed(1)}px)`);
          put(hall, "opacity", (1 - hallK * hallK).toFixed(3));
        }
        onNote = s < -0.45;
        aim = onNote || (idx < N - 1 || s < idx ? liftH(s - idx) : 1) < 0.97 ? -1 : idx;
      } else {
        items.forEach((c, i) => {
          const r = rects[i];
          if (r.right < -100 || r.left > vw + 100) { put(c, "--on", "0"); return; }
          const d = (r.left + r.width / 2 - vw * FOCUS) / vw;
          if (Math.abs(d) < best) { best = Math.abs(d); idx = i; }
          const dc = gsap.utils.clamp(-1, 1, d);
          put(c, "--on", gsap.utils.clamp(0, 1, 1 - Math.abs(d) * 2.6).toFixed(3));
          put(c, "--d", dc.toFixed(3));
          put(c, "--ad", Math.abs(dc).toFixed(3));
        });
        // while the title is nearer the middle than any cake (at the very start), the lamp lights the title
        onNote = !!nr && Math.abs(nr.left + nr.width / 2 - vw * FOCUS) / vw < best;
        aim = onNote ? -1 : idx;
      }
      if (idx !== last) { last = idx; focus(idx); }

      // the lamp rides the rail towards the cake in focus; on the way its beam tilts so it stays aimed at the cake
      // (on the stage everything stands in the middle, so the lamp stays put)
      const onIntro = onNote;
      il += ((onIntro ? 1 : 0) - il) * 0.08;
      put(sec, "--il", il.toFixed(3));
      const tr = onNote ? nr : rects[idx];
      const tx = tr.left + tr.width / 2;
      lx = lx == null ? tx : lx + (tx - lx) * 0.07;
      const reach = Math.max(200, tr.top + tr.height * 0.45 - lampY);
      tilt += (gsap.utils.clamp(-38, 38, (-Math.atan2(tx - lx, reach) * 180) / Math.PI) - tilt) * 0.25;
      put(sec, "--lx", lx.toFixed(1) + "px");
      put(sec, "--tilt", tilt.toFixed(2) + "deg");

      // the title casts a shadow on the wall away from the lamp: straight down under it, longer and softer as the lamp moves off
      if (titleEl) {
        const t = tt;
        if (t.right > -200 && t.left < innerWidth + 200) {
          // the light source is the visitor's torch while the pointer is over the text, otherwise the lamp
          const srcX = torch ? torch.x : lx;
          const dx = t.left + t.width / 2 - srcX;
          const dy = torch ? t.top + t.height / 2 - torch.y : Math.max(60, t.top + t.height / 2 - lampY);
          const len = Math.hypot(dx, dy) || 1;
          const shx = gsap.utils.clamp(-48, 48, dx * 0.06);
          const shy = torch ? gsap.utils.clamp(-30, 30, dy * 0.08) : gsap.utils.clamp(8, 30, 6 + dy * 0.03 + Math.abs(dx) * 0.012);
          put(intro, "--shx", shx.toFixed(1) + "px");
          put(intro, "--shy", shy.toFixed(1) + "px");
          put(intro, "--shb", (6 + Math.abs(dx) * 0.02).toFixed(1) + "px");
          put(intro, "--ux", (dx / len).toFixed(3));
          put(intro, "--uy", (dy / len).toFixed(3));
          if (w1) put(w1, "--lxt", (srcX - w1Left).toFixed(1) + "px");
          reelDraw();
          // the gold catches the light where the lamp is
          if (goldRects) golds.forEach((g, j) => {
            const r = goldRects[j];
            const target = gsap.utils.clamp(0, 100, (0.5 - (srcX - r.left - r.width / 2) / r.width / 1.6) * 100);
            g.p += (target - g.p) * 0.1;
            put(g.el, "--gp", g.p.toFixed(2) + "%");
          });
        }
      }
      if (bar) put(bar, "--p", along(tween.progress()).toFixed(4));
    });

    lampMoments(sec, track, items, () => ({ aim, lx, tilt, active }));

    // The cake stand under the title: the cakes ride an ellipse — large and in full colour at the front, small and dim at the back.
    // It turns slowly by itself, slower still under the pointer; scrolling gives it a spin. A click goes to that cake's plinth
    const ring = $("[data-gl-carousel]", sec);
    const rides = ring ? $$(".gl__ride", ring) : [];
    if (rides.length) {
      ring.classList.add("is-live");
      let geo = null;
      const measure = () => {
        const h = ring.clientHeight;
        const ci = rides[0].offsetWidth;
        const rx = Math.min(innerWidth * 0.36, 560);
        const ry = h * 0.2;
        geo = { rx, ry, base: h - ry - ci * 0.1 };
        ring.style.setProperty("--rx", rx.toFixed(0) + "px");
        ring.style.setProperty("--ry", ry.toFixed(0) + "px");
        ring.style.setProperty("--base", geo.base.toFixed(0) + "px");
      };
      measure();
      addEventListener("resize", measure);
      let spin = 0;
      let slow = false;
      let lastP = tween.progress();
      if (fine) {
        ring.addEventListener("pointerenter", () => { slow = true; });
        ring.addEventListener("pointerleave", () => { slow = false; });
      }
      rides.forEach((el) => el.addEventListener("click", () => dots[+el.dataset.i]?.click()));
      // Scrolling on, the stand empties: one after another the cakes leave it in an arc and land on their own plinths.
      // The flight runs while the title's screen slides away; until a cake lands, its place on the plinth stays empty
      const homes = rides.map((el, i) => items[i] && $(".ex__cake", items[i]));
      const imgs = rides.map((el) => $("img", el));
      const fly = gsap.parseEase("power2.inOut");
      let settled = false;
      gsap.ticker.add((time, dt) => {
        const p = tween.progress();
        const kick = p - lastP;
        lastP = p;
        if (!active) return;
        // on the stage the cakes stay on the stand and leave with it, up and away with the title
        if (lift && hallK >= 1) { homes.forEach((h) => h && put(h, "opacity", "")); return; }
        const f = lift ? 0 : gsap.utils.clamp(0, 1, -hall.getBoundingClientRect().left / (innerWidth * 0.8));
        if (f >= 1 && settled) return;
        settled = f >= 1;
        spin += (dt / 1000) * (slow ? 0.05 : 0.3) + kick * 14 * (1 - f);
        const rr = ring.getBoundingClientRect();
        const cx = rr.left + rr.width / 2;
        // measure every landing spot before moving any cake (reads between writes would lay the page out per cake)
        const fis = rides.map((el, i) => (lift ? 0 : gsap.utils.clamp(0, 1, (f - i * 0.045) / 0.62)));
        const spots = rides.map((el, i) => {
          const home = homes[i];
          if (!(fis[i] > 0 && home)) return null;
          // where the cake stands on its plinth right now (a lazy image not loaded yet: the stage it will fill)
          let t = home.getBoundingClientRect();
          if (t.height < 2) {
            const st = home.closest(".ex__stage").getBoundingClientRect();
            t = { left: st.left, width: st.width, bottom: st.bottom, height: st.height * 0.8 };
          }
          return { t, ih: imgs[i].offsetHeight };
        });
        rides.forEach((el, i) => {
          const a = spin + (i / rides.length) * Math.PI * 2;
          const k = (Math.cos(a) + 1) / 2; // 1 at the front, 0 at the back
          let x = Math.sin(a) * geo.rx;
          let y = geo.base + Math.cos(a) * geo.ry;
          let sc = 0.42 + k * 0.58;
          let rot = 0;
          let lit = k;
          const fi = fis[i];
          const home = homes[i];
          if (home) put(home, "opacity", lift || fi >= 1 ? "" : "0");
          put(el, "visibility", !lift && fi >= 1 ? "hidden" : "");
          if (spots[i]) {
            const { t, ih } = spots[i];
            const e = fly(fi);
            const arc = Math.sin(Math.PI * fi);
            x += (t.left + t.width / 2 - cx - x) * e;
            y += (t.bottom - rr.top - y) * e - arc * innerHeight * 0.04; // a low hop: the path stays under the title
            sc += ((ih ? t.height / ih : 1) - sc) * e;
            rot = arc * (i % 2 ? 14 : -14);
            lit += (1 - lit) * e;
          }
          put(el, "transform", `translate(calc(-50% + ${x.toFixed(1)}px), calc(-100% + ${y.toFixed(1)}px)) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`);
          put(el, "z-index", String(fi > 0 ? 200 + i : 1 + Math.round(k * 100)));
          // on a touch screen the light moves in fine steps: a new filter value repaints the cake, and a phone repaints all of them every frame
          if (!fine) lit = Math.round(lit * 16) / 16;
          put(el, "filter", `brightness(${(0.8 + lit * 0.2).toFixed(3)}) saturate(${(0.55 + lit * 0.45).toFixed(3)})`);
        });
      });
      // as the lamp comes on, the cakes drop onto the stand one after another
      gsap.from($$("img", ring), { yPercent: -140, opacity: 0, duration: 0.85, stagger: 0.06, ease: "bounce.out", scrollTrigger: { trigger: sec, start: "top 65%" }, delay: 0.3 });
    }

    // A cake can be lifted off its plinth and carried about; let go and it drops back with a little wobble
    if (fine) $$(".ex__cake", sec).forEach((cake) => {
      const card = cake.closest(".ex");
      let sx = 0, sy = 0, moved = false, held = false;
      cake.addEventListener("pointerdown", (e) => {
        held = true; moved = false; sx = e.clientX; sy = e.clientY;
        cake.setPointerCapture(e.pointerId);
        card.classList.add("is-held");
        gsap.to(cake, { y: -18, scale: 1.05, duration: 0.35, ease: "power3.out", overwrite: "auto" });
      });
      cake.addEventListener("pointermove", (e) => {
        if (!held) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.hypot(dx, dy) > 6) moved = true;
        gsap.to(cake, { x: dx, y: dy - 18, rotation: gsap.utils.clamp(-14, 14, dx * 0.05), duration: 0.35, ease: "power3.out", overwrite: "auto" });
      });
      const drop = () => {
        if (!held) return;
        held = false;
        card.classList.remove("is-held");
        gsap.to(cake, { x: 0, y: 0, rotation: 0, scale: 1, duration: 1.3, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
      };
      cake.addEventListener("pointerup", drop);
      cake.addEventListener("pointercancel", drop);
      cake.addEventListener("click", (e) => { if (moved) { e.preventDefault(); moved = false; } });
    });
  }

  /* ───────── ⑨ Order: cake turntable — scroll spins the plate, each step serves a new dish ───────── */
  function doilySVG() {
    const C = 200, n = 40, step = (Math.PI * 2) / n;
    const at = (r, a) => `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;
    let d = `M ${at(186, 0)}`;
    for (let k = 0; k < n; k++) d += ` Q ${at(208, (k + 0.5) * step)} ${at(186, (k + 1) * step)}`;
    const ring = (count, r, size, off = 0) => Array.from({ length: count }, (_, k) => {
      const a = (k + off) * ((Math.PI * 2) / count);
      return `<circle cx="${(C + r * Math.cos(a)).toFixed(2)}" cy="${(C + r * Math.sin(a)).toFixed(2)}" r="${size}"/>`;
    }).join("");
    // candy-stripe sunburst in the middle, tinted with the current dish colour
    const rays = Array.from({ length: 16 }, (_, k) => {
      const a0 = k * (Math.PI / 8), a1 = a0 + Math.PI / 16;
      return `<path d="M200 200 L ${at(158, a0)} A 158 158 0 0 1 ${at(158, a1)} Z"/>`;
    }).join("");
    return `<defs><mask id="x-doily-mask"><path d="${d} Z" fill="#fff"/><g fill="#000">${ring(n, 191, 3.4, 0.5)}${ring(80, 177, 1.7)}${ring(n, 169, 2.6, 0.5)}</g></mask></defs>
      <rect width="400" height="400" fill="#fffaf8" mask="url(#x-doily-mask)"/>
      <g fill="currentColor" opacity="0.75">${rays}</g>
      <circle cx="200" cy="200" r="183" fill="none" stroke="#f0c6d0" stroke-width="1"/>
      <circle cx="200" cy="200" r="163" fill="none" stroke="#e2849a" stroke-width="1.2" stroke-dasharray="2 5"/>`;
  }

  // The «Торти» course on the plate is one of the cakes in the catalogue right now: the two-tier «Cherry Romance» with
  // its cherries while it is on sale (tiers, as the card beside it promises, and the cherry the whole site runs on),
  // else the first whole cut-out. Its width follows its shape, so a tall cake stands as high on the plate as a wide one
  function orderStar(sec) {
    const span = $(".x-treat span", sec);
    const whole = (window.MARIDAY?.cakes || []).filter((c) => MARIDAY.cutout(c) && (c.cutout || !STEP_CROPPED.includes(c.img)));
    const c = whole.find((k) => k.id === "cherry-romance") || whole[0];
    if (!span || !c) return;
    const img = $("img", span);
    const src = MARIDAY.cutout(c);
    const fit = () => {
      if (img.naturalWidth) span.style.setProperty("--w", Math.min(80, (84 * img.naturalWidth) / img.naturalHeight).toFixed(1) + "%");
    };
    img.alt = c.name || "";
    if (img.getAttribute("src") === src && img.complete) return fit();
    img.addEventListener("load", fit, { once: true });
    img.src = src;
  }

  function orderMenu(live) {
    const sec = $(".x-order");
    if (!sec) return;
    orderStar(sec);
    const pin = $(".x-order__pin", sec);
    const stage = $(".x-order__stage", sec);
    const dish = $(".x-dish", sec);
    const plate = $(".x-dish__plate", sec);
    const treatsBox = $(".x-dish__treats", sec);
    const treats = $$(".x-treat", sec);
    const words = $$(".x-order__giant span", sec);
    const btns = $$(".x-order__nav button", sec);
    const cards = $$(".x-menu", sec);
    const cherry = $(".x-order__cherry", sec);
    const barFill = $(".x-order__bar i", sec);
    const flood = $(".x-order__flood", sec);
    const burst = $(".x-dish__burst", sec);
    const steps = btns.length;
    const SPRINKLES = ["#f5bcc8", "#fbe6b8", "#bcd6f3", "#a9dcc0", "#6d0809", "#fffaf8"];
    let cur = 0;
    let st = null;

    $(".x-dish__doily", sec).innerHTML = doilySVG();
    $$(".x-dish__orbit i", sec).forEach((el, k) => {
      el.style.setProperty("--a", k * 30 + "deg");
      el.style.setProperty("--r", ((k * 47) % 80) - 40 + "deg");
      el.style.setProperty("--c", SPRINKLES[k % SPRINKLES.length]);
    });
    words.forEach((w) => {
      const text = w.textContent;
      w.style.setProperty("--n", text.length);
      w.replaceChildren(...[...text].map((ch, k) => {
        const b = document.createElement("b");
        b.style.setProperty("--i", k);
        b.style.setProperty("--tilt", ((k * 37) % 9) - 4 + "deg");
        b.textContent = ch === " " ? " " : ch;
        return b;
      }));
    });

    // menu titles roll in letter by letter
    cards.forEach((c) => {
      const h = $("h3", c);
      const text = h.textContent;
      h.setAttribute("aria-label", text);
      h.replaceChildren(...[...text].map((ch, k) => {
        const sp = document.createElement("span");
        sp.setAttribute("aria-hidden", "true");
        sp.style.setProperty("--i", k);
        sp.textContent = ch === " " ? "\u00a0" : ch;
        return sp;
      }));
    });
    flood.style.backgroundColor = cards[0].dataset.tint;
    const crumbs = Array.from({ length: 28 }, (_, k) => {
      const el = document.createElement("i");
      el.style.background = SPRINKLES[k % SPRINKLES.length];
      burst.appendChild(el);
      return el;
    });

    // new colour splashes out of the plate across the whole panel
    function splash(color) {
      if (!live) { flood.style.backgroundColor = color; return; }
      const fr = flood.getBoundingClientRect();
      const dr = dish.getBoundingClientRect();
      const cx = dr.left + dr.width / 2 - fr.left;
      const cy = dr.top + dr.height / 2 - fr.top;
      const R = Math.hypot(Math.max(cx, fr.width - cx), Math.max(cy, fr.height - cy));
      const layer = document.createElement("i");
      layer.style.backgroundColor = color;
      flood.appendChild(layer);
      gsap.fromTo(layer, { clipPath: `circle(0px at ${cx}px ${cy}px)` }, {
        clipPath: `circle(${R}px at ${cx}px ${cy}px)`, duration: 1.15, ease: "power3.inOut",
        onComplete: () => { flood.style.backgroundColor = color; layer.remove(); },
      });
    }

    // sprinkles jump off the lace plate when a dessert lands on it
    function pop() {
      const r = dish.offsetWidth / 2;
      const cy = dish.offsetHeight * 0.28;
      crumbs.forEach((el) => {
        const a = Math.random() * Math.PI * 2;
        const x0 = Math.cos(a) * r * 0.55, y0 = cy + Math.sin(a) * r * 0.2;
        const spread = 1.5 + Math.random() * 0.7;
        const spin = gsap.utils.random(-540, 540);
        gsap.killTweensOf(el);
        gsap.timeline()
          .fromTo(el, { x: x0, y: y0, rotation: gsap.utils.random(0, 180), scale: 0.3, opacity: 1 },
            { x: x0 * spread, y: y0 - gsap.utils.random(60, 170), rotation: `+=${spin}`, scale: 1, duration: 0.55, ease: "power2.out" })
          .to(el, { y: `+=${gsap.utils.random(140, 220)}`, rotation: `+=${spin / 3}`, duration: 0.75, ease: "power2.in" }, 0.5)
          .to(el, { opacity: 0, duration: 0.3 }, 0.95);
      });
    }

    // the old dessert is whisked off sideways, the new one drops onto the plate and squashes like jelly
    function serve(next, prev, dir) {
      treats.forEach((t) => { if (t !== next && t !== prev) t.classList.remove("was-on"); });
      if (prev) {
        prev.classList.add("was-on");
        const out = $$("img", prev);
        gsap.killTweensOf(out);
        gsap.to(out, {
          xPercent: -70 * dir, yPercent: -12, rotation: -28 * dir, scale: 0.6, autoAlpha: 0, duration: 0.45, ease: "power2.in", stagger: 0.04,
          onComplete: () => prev.classList.remove("was-on"),
        });
        gsap.to($$("span", prev), { "--land": 0, duration: 0.35 });
      }
      $$("span", next).forEach((s, k) => {
        const img = $("img", s);
        gsap.killTweensOf([img, s]);
        gsap.timeline({ delay: 0.16 + k * 0.13 })
          .fromTo(img, { xPercent: 35 * dir, yPercent: -110, rotation: 22 * dir, scale: 0.72, autoAlpha: 0 },
            { xPercent: 0, yPercent: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 0.5, ease: "power3.in", immediateRender: true })
          .fromTo(s, { "--land": 0 }, { "--land": 1, duration: 0.5, ease: "power3.in", immediateRender: true }, 0)
          .to(img, { scaleY: 0.82, scaleX: 1.14, duration: 0.09, ease: "power2.out" })
          .to(img, { scaleY: 1, scaleX: 1, duration: 1, ease: "elastic.out(1, 0.28)" })
          .call(() => {
            if (k) return;
            pop();
            gsap.fromTo(plate, { "--dip": 1 }, { "--dip": 0, duration: 0.9, ease: "elastic.out(1, 0.35)" });
          }, null, 0.5);
      });
    }

    const moveCherry = () => {
      const b = btns[cur];
      const row = matchMedia("(max-width: 900px)").matches;
      const x = row ? b.offsetLeft + b.offsetWidth / 2 - 11 : b.offsetLeft - 40;
      const y = row ? b.offsetTop - 24 : b.offsetTop + b.offsetHeight / 2 - 22;
      cherry.style.transform = `translate(${x}px, ${y}px)`;
    };

    function show(i) {
      if (i === cur) return;
      const dir = i > cur ? 1 : -1;
      const inWord = words[i];
      inWord.style.setProperty("--y", dir > 0 ? "110%" : "-110%");
      inWord.classList.add("is-snap");
      void inWord.offsetWidth;
      inWord.classList.remove("is-snap");
      words[cur].style.setProperty("--y", dir > 0 ? "-110%" : "110%");

      const prev = treats[cur];
      treats.forEach((t, k) => t.classList.toggle("is-on", k === i));
      inWord.style.setProperty("--f", live ? 0 : 1);
      words.forEach((w, k) => w.classList.toggle("is-on", k === i));
      cards.forEach((c, k) => c.classList.toggle("is-on", k === i));
      btns.forEach((b, k) => {
        b.classList.toggle("is-on", k === i);
        b.setAttribute("aria-pressed", String(k === i));
      });
      sec.style.setProperty("--tint", cards[i].dataset.tint);
      splash(cards[i].dataset.tint);
      cur = i;
      moveCherry();
      if (live) serve(treats[i], prev, dir);
    }

    btns.forEach((b) => b.addEventListener("click", () => {
      const k = Number(b.dataset.dish);
      if (st && lenis) lenis.scrollTo(st.start + (st.end - st.start) * ((k + 0.5) / steps), { duration: 1.4 });
      else show(k);
    }));
    dish.addEventListener("click", () => { location.href = $(".x-menu__go", cards[cur]).href; });
    moveCherry();
    addEventListener("resize", moveCherry);
    document.fonts?.ready.then(moveCherry);
    if (!live) return;

    st = ScrollTrigger.create({
      trigger: sec,
      pin,
      start: "top top",
      end: () => "+=" + innerHeight * steps * 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const at = Math.min(steps - 1, Math.floor(self.progress * steps));
        show(at);
        words[at].style.setProperty("--f", gsap.utils.clamp(0, 1, (self.progress * steps - at) * 1.25).toFixed(3));
        barFill.style.transform = `scaleX(${Math.max(1 / steps, self.progress)})`;
      },
    });

    gsap.timeline({
      scrollTrigger: { trigger: sec, start: "top bottom", end: () => "+=" + innerHeight * (1 + steps * 0.5), scrub: 1.2, invalidateOnRefresh: true },
    })
      .to(".x-dish__doily", { rotation: 220, ease: "none" }, 0)
      .to(".x-dish__ring", { rotation: -160, ease: "none" }, 0)
      .to(".x-dish__orbit", { rotation: 300, ease: "none" }, 0);

    gsap.fromTo(dish, { scale: 0.5, rotation: -40, yPercent: 30 }, {
      scale: 1, rotation: 0, yPercent: 0, ease: "none",
      scrollTrigger: { trigger: sec, start: "top 85%", end: "top top", scrub: 1 },
    });
    // the first dessert is served onto the plate as the section arrives
    gsap.set($$("img", treats[0]), { autoAlpha: 0 });
    let served = false;
    ScrollTrigger.create({
      trigger: sec, start: "top 45%", end: "bottom top",
      onToggle: (self) => { if (self.isActive && !served) { served = true; serve(treats[cur], null, 1); } },
    });

    gsap.fromTo(flood, { scale: 0.86, "--round": 1 }, {
      scale: 1, "--round": 0, ease: "none",
      scrollTrigger: { trigger: sec, start: "top 90%", end: "top top", scrub: 1 },
    });

    if (fine) {
      sec.addEventListener("pointermove", (e) => {
        const r = stage.getBoundingClientRect();
        const x = gsap.utils.clamp(-1, 1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2));
        const y = gsap.utils.clamp(-1, 1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2));
        gsap.to(stage, { rotationY: x * 14, rotationX: -y * 14, transformPerspective: 900, duration: 0.9, ease: "power3.out" });
        gsap.to(treatsBox, { x: x * 18, y: y * 10, duration: 1.1, ease: "power3.out" });
      });
      sec.addEventListener("pointerleave", () => gsap.to(stage, { rotationY: 0, rotationX: 0, duration: 1.2, ease: "elastic.out(1, 0.5)" }));
    }
  }

  function trail() {
    const sec = $(".x-trail");
    const stage = $("#x-trail");
    if (!sec || !stage) return;
    const pool = TRAIL_IMGS.map((name) => {
      const img = new Image();
      img.src = `img/cakes/${name}.jpg`;
      img.alt = "";
      img.className = "x-trail__img";
      img.decoding = "async";
      stage.appendChild(img);
      return img;
    });
    let idx = 0;
    let z = 1;
    let last = null;
    let lastUser = 0;
    let visible = false;
    let t = 0;
    let count = 0;
    const counter = $("#x-trail-count");

    // Headline letters lean towards the pointer
    const big = $("[data-trail-letters]", sec);
    let chars = [];
    if (big) {
      big.innerHTML = [...big.textContent].map((c) => `<span class="ch">${c}</span>`).join("");
      chars = [...big.children].map((el) => ({ el, y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" }), r: gsap.quickTo(el, "rotation", { duration: 0.5, ease: "power3.out" }) }));
    }
    const lean = (cx, cy) => {
      chars.forEach((c) => {
        const b = c.el.getBoundingClientRect();
        const dx = cx - (b.left + b.width / 2);
        const dy = cy - (b.top + b.height / 2);
        const f = Math.max(0, 1 - Math.hypot(dx, dy) / 320);
        c.y(-f * 0.28 * b.height);
        c.r(f * Math.sign(dx || 1) * -10);
      });
    };
    sec.addEventListener("pointerleave", () => chars.forEach((c) => { c.y(0); c.r(0); }));

    const spawn = (x, y) => {
      if (counter) counter.textContent = String(++count % 1000).padStart(3, "0");
      const img = pool[idx++ % pool.length];
      gsap.killTweensOf(img);
      img.style.zIndex = ++z;
      gsap.timeline()
        .set(img, { x, y, xPercent: -50, yPercent: -50, opacity: 1, scale: 0.3, rotation: gsap.utils.random(-16, 16) })
        .to(img, { scale: 1, duration: 0.55, ease: "expo.out" })
        .to(img, { opacity: 0, scale: 0.5, y: y + 90, duration: 0.9, ease: "power2.in" }, 0.5);
    };
    const move = (x, y) => {
      if (!last || Math.hypot(x - last.x, y - last.y) > 85) {
        last = { x, y };
        spawn(x, y);
      }
    };

    sec.addEventListener("pointermove", (e) => {
      const r = sec.getBoundingClientRect();
      lastUser = performance.now();
      move(e.clientX - r.left, e.clientY - r.top);
      lean(e.clientX, e.clientY);
    });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.35 }).observe(sec);

    // Self-playing demo until someone touches it
    gsap.ticker.add((time, dt) => {
      if (!visible || performance.now() - lastUser < 2200) return;
      t += dt / 1000;
      const w = sec.clientWidth;
      const h = sec.clientHeight;
      move(w / 2 + Math.sin(t * 1.25) * w * 0.36, h / 2 + Math.sin(t * 2.3) * h * 0.3);
    });
  }

  // Finds the centre of the first vertical stroke of the given glyph, so the zoom lands inside the letter
  function stemOffset(glyph, font) {
    const cv = document.createElement("canvas");
    const ctx = cv.getContext("2d");
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(glyph).width) + 4;
    const h = 400;
    cv.width = w;
    cv.height = h;
    ctx.font = font;
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, 0, h / 2);
    const row = ctx.getImageData(0, h / 2 + 10, w, 1).data;
    let start = -1;
    for (let x = 0; x < w; x++) {
      const filled = row[x * 4 + 3] > 128;
      if (filled && start < 0) start = x;
      if (!filled && start >= 0) return { x: (start + x) / 2, w };
    }
    return { x: w * 0.15, w };
  }

  function videoMask() {
    const sec = $(".x-mask");
    const cover = $(".x-mask__cover");
    const word = $(".x-mask__cover span");
    if (!sec || !cover || !word) return;

    // Ice-blue cover with the letters cut out, so the video shows through without blend modes
    const cv = document.createElement("canvas");
    cover.appendChild(cv);
    cover.classList.add("has-canvas");
    const paintCover = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cover.offsetWidth;
      const h = cover.offsetHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      const ctx = cv.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#dbefed";
      ctx.fillRect(0, 0, w, h);
      const cs = getComputedStyle(word);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.textBaseline = "alphabetic";
      ctx.globalCompositeOperation = "destination-out";
      const node = word.firstChild;
      const c = cover.getBoundingClientRect();
      const scale = c.width / w || 1;
      const m = ctx.measureText("СМАК");
      const ascent = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent;
      for (let i = 0; i < node.length; i++) {
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getBoundingClientRect();
        ctx.fillText(node.data[i], (r.left - c.left) / scale, (r.top - c.top) / scale + ascent);
      }
    };

    const setOrigin = () => {
      const node = word.firstChild;
      const range = document.createRange();
      range.setStart(node, 1);
      range.setEnd(node, 2);
      const r = range.getBoundingClientRect();
      const c = cover.getBoundingClientRect();
      const scale = c.width / cover.offsetWidth || 1;
      const cs = getComputedStyle(word);
      const stem = stemOffset("М", `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`);
      const ox = (r.left - c.left) / scale + stem.x;
      const oy = (r.top - c.top + r.height * 0.52) / scale;
      gsap.set(cover, { transformOrigin: `${ox}px ${oy}px` });
    };

    // Layers are listed top-down in the markup; they land bottom-up, like a real cake
    const layers = $$(".x-layer", sec).reverse();
    const count = $(".x-mask__count", sec);
    const landed = { n: 0 };
    const setCount = () => { count.firstChild.data = "0" + Math.round(landed.n); };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec,
        start: "top top",
        end: "+=290%",
        pin: true,
        scrub: 1,
        onRefreshInit: () => gsap.set(cover, { scale: 1 }),
        onRefresh: () => { setOrigin(); paintCover(); },
      },
    })
      .to(cover, { scale: 40, ease: "power3.in", duration: 1 }, 0)
      .to(cover, { opacity: 0, ease: "none", duration: 0.15 }, 0.85)
      .to(".x-mask__shade", { opacity: 1, ease: "none", duration: 0.25 }, 0.9)
      .fromTo(".x-mask__caption", { y: 40, opacity: 0 }, { y: 0, opacity: 1, ease: "power2.out", duration: 0.3 }, 0.95)
      .fromTo(".x-mask__line > span", { yPercent: 115 }, { yPercent: 0, ease: "power3.out", duration: 0.3, stagger: 0.08 }, 0.97)
      // "вручну" is written out left to right, like a piping bag
      .fromTo(".x-mask h2 em",
        { clipPath: "inset(-40% 100% -50% 0%)" },
        { clipPath: "inset(-40% -10% -50% -10%)", ease: "power1.inOut", duration: 0.32 }, 1.08)
      .fromTo(".x-mask__stack", { y: 80, opacity: 0, rotate: 4 }, { y: 0, opacity: 1, rotate: 0, ease: "power3.out", duration: 0.25 }, 1.15)
      .fromTo(".x-mask__count", { scale: 0.6 }, { scale: 1, ease: "back.out(3)", duration: 0.1 }, 1.3);

    layers.forEach((layer, i) => {
      const at = 1.3 + i * 0.15;
      tl.fromTo($(".x-layer__slab", layer),
        { y: -160, opacity: 0, rotate: i % 2 ? 5 : -5 },
        { y: 0, opacity: 1, rotate: 0, ease: "bounce.out", duration: 0.24 }, at)
        .fromTo($(".x-layer__label", layer), { x: 30, opacity: 0 }, { x: 0, opacity: 1, ease: "power2.out", duration: 0.16 }, at + 0.08);
    });

    tl.fromTo(landed, { n: 0 }, { n: layers.length, ease: "none", duration: layers.length * 0.15, onUpdate: setCount }, 1.38)
      .fromTo(".x-layer--deco .x-layer__slab i",
        { y: -50, opacity: 0, scale: 0 },
        { y: 0, opacity: 1, scale: 1, ease: "back.out(2.5)", duration: 0.12, stagger: { each: 0.015, from: "random" } }, 1.85)
      .fromTo(".x-mask__note",
        { clipPath: "inset(-30% 100% -30% 0%)" },
        { clipPath: "inset(-30% -5% -30% -5%)", ease: "power1.inOut", duration: 0.2 }, 1.95);
  }

  function steps() {
    const cards = $$(".x-step");
    cards.forEach((card, i) => {
      gsap.from($("img", card), {
        scale: 1.35,
        ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "top 30%", scrub: true },
      });
      if (i === cards.length - 1) return;
      gsap.fromTo(card, { scale: 1, filter: "brightness(1)" }, {
        scale: 0.9 + i * 0.03,
        filter: "brightness(0.78)",
        ease: "none",
        scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top 30%", scrub: true },
      });
    });
  }

  function stickers() {
    const area = $("#x-board");
    if (!area) return;
    const items = $$(".x-sticker", area);
    let z = 10;

    gsap.from(items, {
      scale: 0,
      rotation: () => gsap.utils.random(-60, 60),
      duration: 1,
      stagger: 0.07,
      ease: "back.out(2)",
      scrollTrigger: { trigger: area, start: "top 75%" },
    });

    items.forEach((el) => {
      el.addEventListener("dragstart", (e) => e.preventDefault());
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        el.classList.add("is-drag");
        el.style.zIndex = ++z;
        const startX = e.clientX;
        const startY = e.clientY;
        const baseX = gsap.getProperty(el, "x");
        const baseY = gsap.getProperty(el, "y");
        const a = area.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const minX = baseX + (a.left - r.left);
        const maxX = baseX + (a.right - r.right);
        const minY = baseY + (a.top - r.top);
        const maxY = baseY + (a.bottom - r.bottom);
        let lastX = e.clientX;
        gsap.to(el, { scale: 1.12, duration: 0.3, ease: "power3.out" });

        const move = (ev) => {
          const nx = gsap.utils.clamp(minX, maxX, baseX + ev.clientX - startX);
          const ny = gsap.utils.clamp(minY, maxY, baseY + ev.clientY - startY);
          const tiltBy = gsap.utils.clamp(-20, 20, (ev.clientX - lastX) * 1.2);
          lastX = ev.clientX;
          gsap.to(el, { x: nx, y: ny, rotation: tiltBy, duration: 0.25, ease: "power3.out", overwrite: "auto" });
        };
        const up = () => {
          el.classList.remove("is-drag");
          gsap.to(el, { scale: 1, rotation: gsap.utils.random(-10, 10), duration: 0.9, ease: "elastic.out(1, 0.45)" });
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerup", up);
          el.removeEventListener("pointercancel", up);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
      });
    });
  }

  function magnets() {
    if (!fine) return;
    $$(".x-magnet, .x-badge").forEach((el) => {
      const inner = el.querySelector("span");
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const ix = inner && gsap.quickTo(inner, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const iy = inner && gsap.quickTo(inner, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * 0.35);
        yTo(dy * 0.35);
        if (inner) { ix(dx * 0.18); iy(dy * 0.18); }
      });
      el.addEventListener("pointerleave", () => {
        xTo(0); yTo(0);
        if (inner) { ix(0); iy(0); }
      });
    });
  }

  function sprinkles() {
    const sec = $(".x-cta");
    const cv = $(".x-cta__canvas");
    if (!sec || !cv) return;
    const ctx = cv.getContext("2d");
    const COLORS = ["#f5bcc8", "#dbefed", "#fbe6b8", "#ffffff", "#bcd6f3", "#e2849a"];
    let parts = [];
    let running = false;
    let dpr = 1;
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = sec.clientWidth * dpr;
      cv.height = sec.clientHeight * dpr;
    };
    size();
    addEventListener("resize", size);

    const add = (p) => parts.push(Object.assign({
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      w: 3 + Math.random() * 3,
      h: 9 + Math.random() * 11,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      life: 1,
    }, p));

    function burst(x, y, n = 70) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 3 + Math.random() * 11;
        add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6 });
      }
      start();
    }
    function shower(n = 110) {
      const w = sec.clientWidth;
      for (let i = 0; i < n; i++) add({ x: Math.random() * w, y: -20 - Math.random() * 300, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 4 });
      start();
    }
    function start() {
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    }
    function tick() {
      const H = cv.height / dpr;
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts = parts.filter((p) => p.life > 0 && p.y < H + 40);
      parts.forEach((p) => {
        p.vy += 0.3;
        p.vx *= 0.985;
        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        p.life -= 0.005;
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
    }

    sec.addEventListener("pointerdown", (e) => {
      const r = sec.getBoundingClientRect();
      burst(e.clientX - r.left, e.clientY - r.top);
    });
    ScrollTrigger.create({ trigger: sec, start: "top 40%", onEnter: () => shower(), onEnterBack: () => shower(60) });
  }

  function pageTransitions() {
    const curtain = $(".x-curtain");
    const panels = $$("i", curtain);
    gsap.set(panels, { yPercent: 101 });

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) {
        e.preventDefault();
        lenis.scrollTo(url.hash, { duration: 1.6 });
        return;
      }
      e.preventDefault();
      curtain.style.visibility = "visible";
      lenis.stop();
      gsap.to(panels, {
        yPercent: 0,
        duration: 0.85,
        stagger: 0.09,
        ease: "expo.inOut",
        onComplete: () => { location.href = url.href; },
      });
    });

    addEventListener("pageshow", (e) => {
      if (!e.persisted) return;
      gsap.set(panels, { yPercent: 101 });
      curtain.style.visibility = "";
      lenis.start();
    });
  }

  // Videos must never stay paused: restart on any pause, tab return, or first user gesture
  function keepVideosPlaying() {
    const videos = $$("video");
    // a film plays only while it is near the screen: two full-HD films decoding all the way down the page wear a phone out
    const near = new Map(videos.map((v) => [v, true]));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        near.set(e.target, e.isIntersecting);
        if (e.isIntersecting) play(e.target);
        else e.target.pause();
      }), { rootMargin: "50% 0px" });
      videos.forEach((v) => io.observe(v));
    }
    const play = (v) => {
      if (document.hidden || !near.get(v)) return;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      if (v.paused) v.play().catch(() => {});
    };
    const playAll = () => videos.forEach(play);
    videos.forEach((v) => {
      v.setAttribute("muted", "");
      v.setAttribute("playsinline", "");
      ["pause", "ended", "stalled", "suspend", "canplay"].forEach((ev) => v.addEventListener(ev, () => play(v)));
    });
    document.addEventListener("visibilitychange", playAll);
    addEventListener("pageshow", playAll);
    ["pointerdown", "touchstart", "keydown", "wheel", "scroll"].forEach((ev) => addEventListener(ev, playAll, { passive: true }));
    setInterval(playAll, 1500);
    playAll();
  }

  function staticMode() {
    doc.classList.add("x-static");
    storyPhone();
    const world = $(".x-drop__world");
    if (world) world.innerHTML = '<p class="x-mani-static">Ми не печемо <span>«просто торти»</span></p>';
    const drop = $(".x-drop");
    if (drop) sideCakes(drop);
    cutCake();
    cakeWheel(false);
    orderMenu(false);
    $(".x-loader")?.remove();
    $$("[data-to]").forEach((el) => { el.textContent = Number(el.dataset.to).toLocaleString("uk-UA"); });
    const onScroll = () => document.body.classList.toggle("is-scrolled", scrollY > 80);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function edgeTint() {
    const set = () => document.body.classList.toggle("is-edge-dark", scrollY < 2);
    addEventListener("scroll", set, { passive: true });
    set();
  }

  // Phones: Safari tints its status bar from a fixed box along the top edge and the strip under its bottom bar from
  // the body, re-reading both as the page scrolls. Past the hero, each takes the colour of the section at that edge of
  // the screen (css/home.css .x-tint, .is-edge-sec), so every section runs on into both bars. The cherry cap over the
  // cake section and the header's cherry ticker, when they are up, keep the top cherry
  function edgeColors() {
    const touch = matchMedia("(hover: none) and (pointer: coarse)");
    const box = document.createElement("div");
    box.className = "x-tint";
    box.setAttribute("aria-hidden", "true");
    document.body.appendChild(box);
    const secs = [...document.querySelectorAll("main section")].filter((s) => !s.parentElement.closest("section"));
    const foot = $("#site-footer");
    if (foot) secs.push(foot);
    const clear = (c) => !c || c === "transparent" || /rgba\(.*,\s*0\)$/.test(c);
    const colour = (y, side) => {
      let hit = null;
      for (const s of secs) {
        const r = s.getBoundingClientRect();
        if (r.height && r.top <= y && r.bottom > y) hit = s;
      }
      const page = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
      if (!hit) return page;
      const cs = getComputedStyle(hit);
      const own = cs.getPropertyValue(side).trim();
      return own || (clear(cs.backgroundColor) ? page : cs.backgroundColor);
    };
    let queued = false;
    const set = () => {
      queued = false;
      const on = touch.matches && scrollY >= 2;
      document.body.classList.toggle("is-edge-sec", on);
      if (!on) return;
      const tick = $(".hdr__ticker");
      const t = tick?.getBoundingClientRect();
      const cherry = $(".x-cap.is-on") || (t && t.height > 1 && t.bottom > 1);
      box.style.background = cherry ? "var(--cherry)" : colour(1, "--edge-top");
      document.body.style.setProperty("--edge-b", colour(innerHeight - 2, "--edge-bot"));
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(set);
    };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    touch.addEventListener?.("change", queue);
    set();
  }

  function init() {
    edgeTint();
    edgeColors();
    renderCards();
    renderWheel();
    renderFaq();
    keepVideosPlaying();
    if (hasLibs) gsap.registerPlugin(ScrollTrigger);
    if (!hasLibs || reduce) {
      staticMode();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    scrollTo(0, 0);

    splitChars($(".x-hero__word"));
    buildEdges();
    setupLenis();
    heroScroll();
    heroLive();
    marquees();
    ribbons();
    cutCake();
    dropLetters();
    zoomScenes();
    heartCollage();
    storyPhone();
    reveals();
    doodle();
    tilt();
    horizontal();
    cakeWheel(true);
    orderMenu(true);
    trail();
    videoMask();
    steps();
    stickers();
    magnets();
    sprinkles();
    pageTransitions();

    animateEdges();
    cutCap();
    ScrollTrigger.sort();
    // a breakpoint crossed (a phone turned, a window narrowed): the sections that rebuild themselves for it create their
    // pins anew, after the pins further down — which then measure from the old page and pin over the manifesto.
    // Put them back in page order and measure again
    ["(max-width: 760px)", "(max-width: 900px)", "(min-width: 901px) and (min-height: 620px)"].forEach((q) =>
      matchMedia(q).addEventListener("change", () => setTimeout(() => { ScrollTrigger.sort(); ScrollTrigger.refresh(); }, 60)));

    runLoader(() => {
      lenis.start();
      heroIntro();
    });

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    addEventListener("load", () => ScrollTrigger.refresh());
    // a lazy image or a late font can still grow a section after the last refresh, and every pin below it would then
    // start too early (Safari sizes unloaded lazy images at 0) — so whenever the page's height changes, re-measure
    if (window.ResizeObserver) {
      let pageH = document.documentElement.scrollHeight, wait = 0;
      new ResizeObserver(() => {
        const h = document.documentElement.scrollHeight;
        if (Math.abs(h - pageH) < 2) return;
        pageH = h;
        clearTimeout(wait);
        wait = setTimeout(() => ScrollTrigger.refresh(), 200);
      }).observe(document.body);
    }
  }

  MARIDAY.onReady(init);
})();
