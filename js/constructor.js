/* Mariday — the cake constructor as a pastry workshop (pages/constructor.html, css/constructor.css).
   ① hero: the glazed title and the house recipes pegged on a string — every card holds a live little cake;
     a tap sends that recipe to the bench (the «?» card picks one at random)
   ② the workshop: a kitchen wall (utensils swinging on a rail, a shelf with a real cake under a cloche, a window
     behind the cake whose sky takes the station's colour while the sun crosses it) over a marble bench with a cherry front. The cake turns on its stand (drag, flick,
     arrows; a tap blows the candles out), a little printer on the wall prints the bill as you choose.
     Five stations, each with its own things on the bench: cake tins and a rolling pin for the guests (weight),
     glasses of filling (the cake is cut open), cream tools and piping bags (the new cream pours over the cake),
     jars of toppings (they fly out onto the cake), and packing (a box closes round the cake, ribbon, into the cart)
   ③ what happens next: order tickets slide along a kitchen rail
   The design lives in the URL (?size=…&flavor=…&step=…), so links from other pages open it ready.
   Prices are the same as the old constructor in app.js. Works without GSAP; with reduced motion things simply change. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const M = () => window.MARIDAY;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const esc = (s) => window.escapeHTML(s);
  const eur = (n) => window.formatEUR(n);
  const params = new URLSearchParams(location.search);
  const CHERRY = () => assetPath("img/cakes/cherries.png");
  const TAU = Math.PI * 2;
  const f1 = (n) => n.toFixed(1);
  const gs = () => (window.gsap && !reduce ? window.gsap : null);
  let UID = 0;
  const uid = (p = "mk") => `${p}${++UID}`;

  const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many);
  const guestsWord = (n) => plural(n, "гість", "гості", "гостей");

  /* ───────── what can be chosen (prices as before) ───────── */
  const CTOR = {
    base: 95,
    coats: {
      smooth: { name: "Гладкий крем", short: "Гладкий", add: 0, note: "рівні грані, палетка" },
      ruffles: { name: "Рюші", short: "Рюші", add: 35, note: "пелюстки вручну" },
      texture: { name: "Фактура", short: "Фактура", add: 20, note: "гребінець і хвилі" },
      drip: { name: "Дріп", short: "Дріп", add: 25, note: "шоколадні патьоки" },
    },
    colors: {
      vanilla: { name: "Ванільний", hex: "#fbf3dc" },
      powder: { name: "Пудровий", hex: "#f5bcc8" },
      ice: { name: "Льодяний", hex: "#dbefed" },
      sky: { name: "Небесний", hex: "#bcd6f3" },
      butter: { name: "Вершковий", hex: "#fbe6b8" },
      lilac: { name: "Лавандовий", hex: "#e9c6f0" },
      cherry: { name: "Вишневий", hex: "#6d0809" },
    },
    decor: {
      light: { name: "Легкий", add: 0, note: "мінімалізм" },
      medium: { name: "Середній", add: 25, note: "бортик з перлин" },
      complex: { name: "Складний", add: 60, note: "перлини й гірлянди" },
      sculpt: { name: "Скульптура", add: 120, note: "серце-топер" },
    },
    toppings: {
      berries: { name: "Ягоди", add: 12, lid: "#c2263f" },
      flowers: { name: "Квіти", add: 18, lid: "#e2849a" },
      cherries: { name: "Вишні", add: 8, lid: "#6d0809" },
      gold: { name: "Золото", add: 15, lid: "#c9a24a" },
      macarons: { name: "Макарони", add: 14, lid: "#9fc0e6" },
      sprinkles: { name: "Посипка", add: 6, lid: "#f5bcc8" },
      candles: { name: "Свічки", add: 5, lid: "#f2cf86" },
    },
    tiers: {
      "1.5": [[190, 120]],
      "2": [[220, 130]],
      "2.5": [[240, 112], [160, 92]],
      "3": [[262, 116], [182, 96]],
      "4": [[280, 120], [196, 102]],
      tier: [[292, 104], [212, 90], [142, 76]],
    },
    presets: [
      { name: "Весільна класика", st: { size: "tier", flavor: "vanilla-berry", coat: "ruffles", color: "vanilla", decor: "complex", toppings: ["flowers"], text: "" } },
      { name: "Дитяче свято", st: { size: "2", flavor: "berry-forest", coat: "drip", color: "sky", decor: "medium", toppings: ["sprinkles", "macarons", "candles"], text: "Happy B-day" } },
      { name: "Шоколадний", st: { size: "2.5", flavor: "cherry-duo-choc", coat: "drip", color: "butter", decor: "medium", toppings: ["cherries", "gold"], text: "" } },
      { name: "Мінімалізм", st: { size: "1.5", flavor: "pistachio-raspberry", coat: "smooth", color: "powder", decor: "light", toppings: ["berries"], text: "" } },
      { name: "Love", st: { size: "2", flavor: "lemon-raspberry", coat: "texture", color: "powder", decor: "sculpt", toppings: ["berries", "gold"], text: "Love you" } },
    ],
  };

  // the stations of the bench; the wall takes a colour of its own at each
  const STEPS = [
    { word: "Вага", script: "скільки гостей?", wash: "#fbe6b8" },
    { word: "Смак", script: "що всередині?", wash: "#f5bcc8" },
    { word: "Крем", script: "і колір", wash: null },
    { word: "Декор", script: "і напис", wash: "#cfe0f5" },
    { word: "Пакуємо", script: "ваш торт", wash: "#dbefed" },
  ];

  function rng(seed) {
    return () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
    const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  function isDark(hex) {
    const n = parseInt(hex.slice(1), 16);
    return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) < 140;
  }
  const flavorById = (id) => M().flavors.find((f) => f.id === id) || M().flavors[0];
  const metaOf = (id) => (M().flavorMeta || {})[id] || { img: "slice", tone: "#f5bcc8", layers: ["#f0dca0", "#f7efe6", "#c2263f"], moods: [], sweet: 3, sour: 3 };
  // sizes added in the admin panel get a cake shape by their weight
  const tiersFor = (id) => CTOR.tiers[id] || (parseFloat(id) >= 2.5 ? CTOR.tiers["3"] : CTOR.tiers["2"]);
  const colorOf = (id) => CTOR.colors[id] || CTOR.colors.powder;

  /* ───────── the cake: every tier is a cylinder; decorations live on its surface at an angle,
     so turning the cake (rot) moves them round and hides the ones at the back ───────── */
  function cakeSVG(st, o = {}) {
    const { cut = false, rot = 0, fx = {}, cherry = CHERRY(), noText = false, blown = false } = o;
    const u = uid("c");
    const flv = metaOf(st.flavor);
    const coat = colorOf(st.color).hex;
    const dark = shade(coat, -0.14);
    const light = shade(coat, 0.08);
    const darkCoat = isDark(coat);
    const has = (k) => st.toppings.includes(k);
    const tiers = tiersFor(st.size);
    const fall = (k) => (fx.fall && fx.fall.has(k) ? " mk-fall" : "");
    let y = 352;
    let out = "";
    const geo = [];

    // the stand's rim pattern turns with the cake
    let rim = "";
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * TAU + rot;
      const z = Math.cos(a);
      if (z < 0.05) continue;
      rim += `<circle cx="${f1(200 + 168 * Math.sin(a))}" cy="${f1(357 + 11 * z)}" r="${f1(2 + 1.4 * z)}" fill="rgba(109,8,9,${(0.12 + 0.18 * z).toFixed(2)})"/>`;
    }
    // a gold cake board under the bottom tier
    const b0 = tiers[0][0] / 2 + 9;
    const board = `<path d="M${200 - b0},352 v5 A${b0},${f1(b0 * 0.12)} 0 0 0 ${200 + b0},357 v-5 Z" fill="#b8913c"/><ellipse cx="200" cy="352" rx="${b0}" ry="${f1(b0 * 0.12)}" fill="#e6c675"/>`;

    tiers.forEach(([w, h], ti) => {
      const R = w / 2;
      const x = 200 - R;
      const ry = Math.max(9, w * 0.06);
      y -= h;
      const P = (a, top) => { const t = a + rot; return { x: 200 + R * Math.sin(t), y: top + ry * Math.cos(t), z: Math.cos(t) }; };
      const ring = (n, phase = 0) => Array.from({ length: n }, (_, k) => (k / n) * TAU + phase);
      const side = `M${x},${y} L${x},${y + h} A${R},${ry} 0 0 0 ${x + w},${y + h} L${x + w},${y} Z`;
      let g = `<g class="mk-tier" style="--i:${ti}">`;

      if (cut) {
        // the tier cut in half: its layers stack up one by one
        const L = flv.layers;
        const rows = Math.max(3, Math.round(h / 18));
        const rh = (h - 14) / rows;
        let inner = "";
        for (let r = 0; r < rows; r++) {
          const col = r % 2 ? "#f7efe6" : L[Math.floor(r / 2) % L.length];
          const ry0 = y + h - 7 - (r + 1) * rh;
          inner += `<rect class="mk-layer" style="--d:${((ti * rows + r) * 0.05).toFixed(2)}s" x="${x + 8}" y="${f1(ry0)}" width="${w - 16}" height="${f1(rh + 0.6)}" fill="${col}"/>`;
        }
        g += `<path d="M${x},${y} A${R},${ry} 0 0 1 ${x + w},${y} Z" fill="${light}" stroke="${dark}" stroke-width="1" stroke-opacity=".35"/>`;
        g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${coat}"/>${inner}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="${dark}" stroke-width="1.5" opacity=".5"/>`;
        g += `<rect x="${x + 8}" y="${y + 4}" width="${w - 16}" height="3" rx="1.5" fill="#fff" opacity=".35"/>`;
      } else {
        g += `<defs><linearGradient id="${u}g${ti}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".28" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>`;
        g += `<path d="${side}" fill="${coat}"/>`;

        if (st.coat === "ruffles") {
          const n = Math.round((Math.PI * w) / 17);
          for (let ry0 = y + 12, row = 0; ry0 < y + h - 4; ry0 += 13, row++) {
            const pts = ring(n, row % 2 ? Math.PI / n : 0).map((a) => P(a, ry0)).filter((p) => p.z > -0.05).sort((a, b) => a.x - b.x);
            if (pts.length < 2) continue;
            let d = `M${f1(pts[0].x)},${f1(pts[0].y)}`;
            for (let k = 1; k < pts.length; k++) {
              const p = pts[k - 1], q = pts[k];
              d += ` Q${f1((p.x + q.x) / 2)},${f1((p.y + q.y) / 2 + 9 * Math.max(0.2, (p.z + q.z) / 2))} ${f1(q.x)},${f1(q.y)}`;
            }
            g += `<path d="${d}" fill="none" stroke="${dark}" stroke-width="2.2" opacity=".55"/>`;
          }
        } else if (st.coat === "texture") {
          ring(Math.round((Math.PI * w) / 7)).forEach((a) => {
            const p = P(a, y + 6), q = P(a, y + h - 4);
            if (p.z > 0.02) g += `<line x1="${f1(p.x)}" y1="${f1(p.y)}" x2="${f1(q.x)}" y2="${f1(q.y)}" stroke="${dark}" stroke-width="${f1(0.8 + p.z)}" opacity="${(0.4 * p.z).toFixed(2)}"/>`;
          });
        }

        if (has("sprinkles")) {
          const r = rng(97 + ti);
          const cols = ["#6d0809", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff", "#9ed9b8"];
          for (let k = 0; k < Math.round(w / 3.4); k++) {
            const a = r() * TAU, hy = y + 10 + r() * (h - 22), ang = r() * 180, c = cols[k % cols.length];
            const p = P(a, hy);
            const dl = f1(r() * 0.4);
            if (p.z > 0.1) g += `<g class="mk-item${fall("sprinkles")}" style="--d:${dl}s"><rect x="${f1(p.x - 1.5)}" y="${f1(p.y - 4)}" width="${f1(3 * (0.5 + 0.5 * p.z))}" height="8" rx="1.5" fill="${c}" transform="rotate(${ang | 0} ${f1(p.x)} ${f1(p.y)})"/></g>`;
          }
        }

        g += `<path d="${side}" fill="url(#${u}g${ti})"/>`;
        g += `<ellipse cx="200" cy="${y}" rx="${R}" ry="${f1(ry)}" fill="${light}"/>`;
        g += `<ellipse cx="200" cy="${y}" rx="${R - 3}" ry="${f1(ry - 2)}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>`;

        if (st.coat === "drip") {
          const dc = darkCoat ? "#f5bcc8" : "#3e1c14";
          const r = rng(7 + ti);
          const n = Math.round((Math.PI * w) / 15);
          const lens = Array.from({ length: n }, () => 8 + r() * h * 0.5);
          let drips = "";
          ring(n).forEach((a, k) => {
            const p = P(a, y + 8);
            if (p.z <= 0.02) return;
            const dw = 4 + 3 * p.z;
            const L = lens[k] * (0.6 + 0.4 * p.z);
            drips += `<path d="M${f1(p.x - dw)},${f1(p.y - 4)} L${f1(p.x - dw)},${f1(p.y + L)} a${f1(dw)},${f1(dw)} 0 0 0 ${f1(dw * 2)},0 L${f1(p.x + dw)},${f1(p.y - 4)} Z" fill="${dc}"/>`;
          });
          g += `<path d="M${x},${y} L${x},${y + 8} A${R},${ry} 0 0 0 ${x + w},${y + 8} L${x + w},${y} Z" fill="${dc}"/>${drips}<ellipse cx="200" cy="${y}" rx="${R}" ry="${f1(ry)}" fill="${dc}"/><ellipse cx="${200 - R * 0.35}" cy="${y - ry * 0.25}" rx="${R * 0.25}" ry="${f1(ry * 0.3)}" fill="#fff" opacity=".18"/>`;
        }

        if ((st.decor === "complex" || st.decor === "sculpt") && ti === 0) {
          const sc = darkCoat ? "#f5bcc8" : "#e2849a";
          const pts = ring(Math.round((Math.PI * w) / 42)).map((a) => P(a, y + 22)).filter((p) => p.z > -0.1).sort((a, b) => a.x - b.x);
          for (let k = 1; k < pts.length; k++) {
            const p = pts[k - 1], q = pts[k];
            g += `<path d="M${f1(p.x)},${f1(p.y)} Q${f1((p.x + q.x) / 2)},${f1((p.y + q.y) / 2 + 26 * Math.max(0.25, (p.z + q.z) / 2))} ${f1(q.x)},${f1(q.y)}" fill="none" stroke="${sc}" stroke-width="3" stroke-linecap="round"/>`;
          }
          pts.forEach((p) => { if (p.z > 0) g += `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(2 + 2 * p.z)}" fill="${sc}"/>`; });
        }

        if (st.decor !== "light") {
          const bc = darkCoat ? "#f5bcc8" : "#ffffff";
          ring(Math.round((Math.PI * w) / 12))
            .map((a) => P(a, y + h - 3))
            .filter((p) => p.z > -0.15)
            .sort((a, b) => a.z - b.z)
            .forEach((p) => { g += `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(3 + 2.6 * Math.max(0, p.z))}" fill="${bc}" stroke="${dark}" stroke-width=".6"/>`; });
        }
      }
      g += "</g>";
      out += g;
      geo.push({ x, y, w, h, R, ry, P });
    });

    let deco = "";
    if (!cut) {
      const top = geo[geo.length - 1];
      const base = geo[0];
      if (has("gold")) {
        const r = rng(31);
        for (let k = 0; k < 9; k++) {
          const a = r() * TAU, hy = top.y + 14 + r() * (top.h - 34), s1 = 8 + r() * 8, s2 = 3 + r() * 4, s3 = 9 + r() * 6;
          const p = top.P(a, hy);
          if (p.z > 0.1) deco += `<path class="mk-item${fall("gold")}" style="--d:${f1(k * 0.05)}s" d="M${f1(p.x)},${f1(p.y)} l${f1(s1 * p.z)},${f1(-s2)} l${f1(4 * p.z)},${f1(s3)} l${f1(-10 * p.z)},4 z" fill="#e3b94a" opacity="${(0.5 + 0.5 * p.z).toFixed(2)}"/>`;
        }
      }
      // things standing on the top, drawn back to front
      const items = [];
      const onTop = (a, rf) => { const t = a + rot; return { x: 200 + rf * top.R * Math.sin(t), y: top.y + rf * top.ry * Math.cos(t), z: Math.cos(t) * rf }; };
      if (has("berries")) {
        const r = rng(13);
        for (let k = 0; k < 11; k++) {
          const p = onTop(r() * TAU, 0.25 + r() * 0.6);
          const blue = k % 3 === 2;
          items.push({ z: p.z, svg: `<g class="mk-item${fall("berries")}" style="--d:${f1(k * 0.04)}s">${blue ? `<circle cx="${f1(p.x)}" cy="${f1(p.y - 5)}" r="6" fill="#3b4a8c"/><circle cx="${f1(p.x - 2)}" cy="${f1(p.y - 7)}" r="1.6" fill="#fff" opacity=".6"/>` : `<circle cx="${f1(p.x)}" cy="${f1(p.y - 7)}" r="8" fill="#c2263f"/><circle cx="${f1(p.x - 2.5)}" cy="${f1(p.y - 9.5)}" r="2" fill="#fff" opacity=".5"/>`}</g>` });
        }
      }
      if (has("macarons")) {
        [[-1.1, "#f5bcc8"], [0.1, "#fbe6b8"], [1.3, "#bcd6f3"], [2.6, "#e9c6f0"]].forEach(([a, c], k) => {
          const p = onTop(a, 0.6);
          const sw = 14 + 3 * Math.abs(Math.cos(a + rot));
          items.push({ z: p.z, svg: `<g class="mk-item${fall("macarons")}" style="--d:${f1(k * 0.08)}s"><rect x="${f1(p.x - sw)}" y="${f1(p.y - 25)}" width="${f1(sw * 2)}" height="10" rx="5" fill="${c}"/><rect x="${f1(p.x - sw + 1)}" y="${f1(p.y - 16)}" width="${f1(sw * 2 - 2)}" height="5" rx="2" fill="#fff8ee"/><rect x="${f1(p.x - sw)}" y="${f1(p.y - 11)}" width="${f1(sw * 2)}" height="10" rx="5" fill="${shade(c, -0.06)}"/></g>` });
        });
      }
      if (has("flowers")) {
        [[-0.9, 0.82, "#f5bcc8"], [-0.45, 0.88, "#ffffff"], [-1.35, 0.7, "#e2849a"], [2.2, 0.8, "#ffffff"]].forEach(([a, rf, c], k) => {
          const p = onTop(a, rf);
          items.push({ z: p.z, svg: `<g class="mk-item${fall("flowers")}" style="--d:${f1(k * 0.08)}s"><path d="M${f1(p.x - 16)},${f1(p.y - 4)} q-8,-14 8,-12" fill="#7aa874"/><circle cx="${f1(p.x)}" cy="${f1(p.y - 12)}" r="14" fill="${c}" stroke="${shade(c, -0.12)}" stroke-width="1.5"/><path d="M${f1(p.x - 7)},${f1(p.y - 12)} a7,7 0 1,1 7,7 a4,4 0 1,1 -4,-4" fill="none" stroke="${shade(c, -0.18)}" stroke-width="1.6"/></g>` });
        });
      }
      if (has("cherries")) {
        [[0.7, 0.35, 64], [-2, 0.5, 48]].forEach(([a, rf, s], k) => {
          const p = onTop(a, rf);
          items.push({ z: p.z, svg: `<g class="mk-item${fall("cherries")}" style="--d:${f1(k * 0.12)}s"><image href="${cherry}" x="${f1(p.x - s / 2)}" y="${f1(p.y - s + 6)}" width="${s}" height="${s}"/></g>` });
        });
      }
      if (has("candles")) {
        const cols = ["#f5bcc8", "#bcd6f3", "#fbe6b8", "#e9c6f0", "#ffffff"];
        for (let k = 0; k < 5; k++) {
          const p = onTop((k / 5) * TAU + 0.3, 0.55);
          const c = cols[k];
          items.push({ z: p.z, svg: `<g class="mk-item mk-candle${fall("candles")}" style="--d:${f1(k * 0.07)}s"><rect x="${f1(p.x - 3.5)}" y="${f1(p.y - 38)}" width="7" height="38" rx="2" fill="${c}" stroke="rgba(109,8,9,.25)"/><path d="M${f1(p.x - 3.5)},${f1(p.y - 30)} l7,-5 M${f1(p.x - 3.5)},${f1(p.y - 18)} l7,-5 M${f1(p.x - 3.5)},${f1(p.y - 6)} l7,-5" stroke="#e2849a" stroke-width="2"/><line x1="${f1(p.x)}" y1="${f1(p.y - 38)}" x2="${f1(p.x)}" y2="${f1(p.y - 43)}" stroke="#3d0405" stroke-width="1.5"/>${blown ? `<g class="mk-smoke"><circle cx="${f1(p.x)}" cy="${f1(p.y - 48)}" r="4" fill="#bbb"/><circle cx="${f1(p.x + 3)}" cy="${f1(p.y - 56)}" r="5" fill="#ccc"/></g>` : `<g class="mk-flame" style="transform-origin:${f1(p.x)}px ${f1(p.y - 43)}px"><ellipse cx="${f1(p.x)}" cy="${f1(p.y - 50)}" rx="5" ry="9" fill="#ffb347"/><ellipse cx="${f1(p.x)}" cy="${f1(p.y - 48)}" rx="2.5" ry="5" fill="#fff6c8"/><circle cx="${f1(p.x)}" cy="${f1(p.y - 50)}" r="14" fill="#ffd27a" opacity=".22"/></g>`}</g>` });
        }
      }
      if (st.decor === "sculpt") {
        const s = Math.cos(rot);
        items.push({ z: 0, svg: `<g class="mk-topper"><line x1="200" y1="${top.y}" x2="200" y2="${top.y - 46}" stroke="#c9a24a" stroke-width="3"/><g transform="translate(200 ${top.y - 64}) scale(${Math.max(0.06, Math.abs(s)).toFixed(3)} 1)"><path d="M0,0 c-24,-26 -46,4 0,30 c46,-26 24,-56 0,-30z" transform="translate(0 -18)" fill="${s >= 0 ? "#c2263f" : "#9b1030"}" stroke="#6d0809" stroke-width="2"/>${s >= 0 ? '<path d="M-14,-10 q4,-8 12,-4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>' : ""}</g></g>` });
      }
      items.sort((a, b) => a.z - b.z).forEach((it) => (deco += it.svg));

      if (st.text && !noText) {
        const fs = Math.max(13, Math.min(30, (base.w * 1.7) / Math.max(st.text.length, 4)));
        const c = Math.cos(rot);
        if (c > 0.12) {
          const p = base.P(0, base.y + base.h / 2 + fs / 3);
          deco += `<text class="mk-text" transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${c.toFixed(3)} 1)" text-anchor="middle" font-family="Great Vibes, cursive" font-size="${f1(fs)}" fill="${darkCoat ? "#f5bcc8" : "#6d0809"}" opacity="${Math.min(1, c * 1.6).toFixed(2)}">${esc(st.text)}</text>`;
        }
      }
    }

    return `<svg class="mk-svg${cut ? " is-cut" : ""}${fx.drop ? " is-drop" : ""}" viewBox="0 0 400 400" role="img" aria-label="Попередній вигляд торта">
      <ellipse cx="200" cy="392" rx="150" ry="14" fill="rgba(61,4,5,.14)"/>
      <path d="M150,372 h100 l-14,24 h-72 z" fill="#fff" stroke="rgba(109,8,9,.15)"/>
      <ellipse cx="200" cy="360" rx="176" ry="17" fill="#fff" stroke="rgba(109,8,9,.15)"/>
      <ellipse cx="200" cy="356" rx="176" ry="14" fill="#f7fbfb"/>${rim}
      ${board}${out}${deco}
    </svg>`;
  }

  // where the top of the cake is, in the cake's own 400×400 frame (for flying toppings and the box)
  const cakeTopY = (st) => 352 - tiersFor(st.size).reduce((s, [, h]) => s + h, 0);

  /* ───────── things on the bench ───────── */
  // a cake tin (or a stack of them for the tiered cake), drawn to scale
  function tinSVG(tiers) {
    const k = 128 / 292;
    const parts = tiers.map(([w, h]) => ({ W: w * k, H: Math.max(15, h * 0.32) }));
    const VW = parts[0].W + 10;
    const cx = VW / 2;
    const ry0 = parts[0].W * 0.15;
    const total = parts.reduce((s, p) => s + p.H, 0) + parts.length * 2;
    const VH = total + ry0 * 2 + 8;
    let y = VH - ry0 - 3;
    let out = `<ellipse cx="${f1(cx)}" cy="${f1(y + 2)}" rx="${f1(parts[0].W / 2 + 3)}" ry="${f1(ry0 * 0.9)}" fill="rgba(61,4,5,.16)"/>`;
    parts.forEach((p) => {
      const R = p.W / 2, ry = p.W * 0.15, x = cx - R, top = y - p.H;
      out += `<path d="M${f1(x)},${f1(top)} V${f1(y)} A${f1(R)},${f1(ry)} 0 0 0 ${f1(x + p.W)},${f1(y)} V${f1(top)} Z" fill="url(#mkTin)"/>
        <path d="M${f1(x)},${f1(y - 4)} A${f1(R)},${f1(ry)} 0 0 0 ${f1(x + p.W)},${f1(y - 4)}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.4"/>
        <ellipse cx="${f1(cx)}" cy="${f1(top)}" rx="${f1(R)}" ry="${f1(ry)}" fill="#dfe5e8" stroke="#f4f7f8" stroke-width="2"/>
        <ellipse cx="${f1(cx)}" cy="${f1(top + ry * 0.22)}" rx="${f1(R - 4)}" ry="${f1(Math.max(2, ry - 2.5))}" fill="#aeb8be"/>
        <ellipse class="mk-tin__batter" cx="${f1(cx)}" cy="${f1(top + ry * 0.3)}" rx="${f1(R - 5)}" ry="${f1(Math.max(2, ry - 3.5))}" fill="#f3d48c"/>`;
      y = top + 1;
    });
    return `<svg class="mk-tin__svg" viewBox="0 0 ${f1(VW)} ${f1(VH)}" style="--vw:${f1(VW)}" aria-hidden="true">${out}</svg>`;
  }

  // a tall dessert glass with the filling's layers and a spoon in it
  function glassSVG(id) {
    const u = uid("g");
    const L = metaOf(id).layers;
    const rows = [];
    L.forEach((c, i) => { rows.push(c); if (i < L.length - 1) rows.push("#f7efe6"); });
    const bottom = 120, H = 86 / rows.length;
    let fill = "";
    rows.forEach((c, i) => {
      fill += `<rect class="mk-pour" style="--d:${(i * 0.08).toFixed(2)}s" x="0" y="${f1(bottom - (i + 1) * H)}" width="64" height="${f1(H + 0.8)}" fill="${c}"/>`;
    });
    const ty = bottom - rows.length * H;
    const topC = L[L.length - 1];
    fill += `<ellipse class="mk-pour" style="--d:${(rows.length * 0.08).toFixed(2)}s" cx="32" cy="${f1(ty)}" rx="22" ry="3.2" fill="${shade(topC, 0.1)}"/>`;
    return `<svg class="mk-glass__svg" viewBox="0 0 64 132" aria-hidden="true">
      <defs><clipPath id="${u}"><path d="M12.5,24 L51.5,24 L47.5,116 Q46.5,124 39,124 L25,124 Q17.5,124 16.5,116 Z"/></clipPath></defs>
      <ellipse cx="32" cy="128" rx="20" ry="3.5" fill="rgba(61,4,5,.14)"/>
      <path d="M47,2 L37,36" stroke="#cdd3d6" stroke-width="3.2" stroke-linecap="round"/>
      <g clip-path="url(#${u})">${fill}</g>
      <circle cx="40" cy="${f1(ty - 3.5)}" r="4.6" fill="#c2263f"/><circle cx="38.6" cy="${f1(ty - 5)}" r="1.3" fill="#fff" opacity=".55"/>
      <path d="M41,${f1(ty - 8)} q2,-5 7,-4" stroke="#5c7a2a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M11,20 L53,20 L48.5,117 Q47.5,126 39,126 L25,126 Q16.5,126 15.5,117 Z" fill="rgba(255,255,255,.16)" stroke="rgba(109,8,9,.24)" stroke-width="1.4"/>
      <ellipse cx="32" cy="20" rx="21" ry="3" fill="rgba(255,255,255,.35)" stroke="rgba(109,8,9,.24)" stroke-width="1.2"/>
      <path d="M17,30 L20.5,110" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>
      <path d="M46.5,40 L45.5,62" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".45"/>
    </svg>`;
  }

  // a piping bag of cream, nozzle down
  function bagSVG(hex) {
    const u = uid("b");
    const dk = shade(hex, -0.18), lt = shade(hex, 0.12);
    return `<svg class="mk-bag__svg" viewBox="0 0 64 152" aria-hidden="true">
      <defs><linearGradient id="${u}" x1="0" x2="1"><stop offset="0" stop-color="${lt}"/><stop offset=".5" stop-color="${hex}"/><stop offset="1" stop-color="${dk}"/></linearGradient></defs>
      <path d="M25,4 q7,-5 14,0 l3,18 h-20 z" fill="rgba(255,255,255,.8)" stroke="rgba(109,8,9,.2)" stroke-width="1"/>
      <path d="M28,6 l2,14 M34,5 l-1,15" stroke="rgba(109,8,9,.14)" stroke-width="1"/>
      <g class="mk-bag__body">
        <path d="M7,26 Q32,17 57,26 L38.5,118 Q32,124 25.5,118 Z" fill="url(#${u})" stroke="rgba(109,8,9,.22)" stroke-width="1.2"/>
        <path d="M14,31 L28.5,110" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".5"/>
        <path d="M7,26 Q32,17 57,26" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="2.2"/>
      </g>
      <path d="M22,19 h20" stroke="#c2263f" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M24.5,114 h15 l-3.2,22 h-8.6 z" fill="url(#mkMetal)"/>
      <path d="M27.5,136 l1.8,5 1.8,-5 1.8,5 1.8,-5 1.8,5 1.2,-5" fill="none" stroke="#8f989d" stroke-width="1.3"/>
      <path d="M28.5,141 q3.5,7 7,0 z" fill="${hex}" stroke="${dk}" stroke-width=".8"/>
    </svg>`;
  }

  // the cream tools: a palette knife, a petal nozzle, a comb scraper, a squeeze bottle of chocolate
  function toolSVG(kind) {
    const tools = {
      smooth: `<ellipse cx="62" cy="76" rx="48" ry="5" fill="rgba(61,4,5,.12)"/>
        <rect x="6" y="52" width="38" height="13" rx="6.5" fill="#c08a5c"/><rect x="8" y="54" width="34" height="3" rx="1.5" fill="#fff" opacity=".3"/>
        <rect x="42" y="53" width="9" height="11" rx="2" fill="url(#mkMetal)"/>
        <path d="M50,55 L106,40 Q115,38 114,46 Q113,52 106,53 L52,63 Z" fill="url(#mkMetal)" stroke="#8f989d" stroke-width=".8"/>
        <path d="M90,44 Q100,40 112,42 L111,49 Q101,51 92,51 Z" fill="var(--cream, #f5bcc8)" opacity=".95"/>`,
      ruffles: `<ellipse cx="60" cy="78" rx="44" ry="5" fill="rgba(61,4,5,.12)"/>
        <path d="M42,6 h36 l-9,46 h-18 z" fill="url(#mkMetal)" stroke="#8f989d" stroke-width=".8"/>
        <path d="M48,10 l6,38" stroke="#fff" stroke-width="2.5" opacity=".6" stroke-linecap="round"/>
        <path d="M53,52 q7,-7 14,0" stroke="#5c6266" stroke-width="2.4" fill="none"/>
        <path d="M14,70 q8,-14 16,0 t16,0 t16,0 t16,0 t16,0 t16,0" fill="none" stroke="var(--cream, #f5bcc8)" stroke-width="8" stroke-linecap="round"/>
        <path d="M14,70 q8,-14 16,0 t16,0 t16,0 t16,0 t16,0 t16,0" fill="none" stroke="#fff" stroke-width="2" opacity=".55" transform="translate(0 -2.5)"/>`,
      texture: `<ellipse cx="60" cy="78" rx="48" ry="5" fill="rgba(61,4,5,.12)"/>
        <path d="M12,18 h96 v34 l-6,12 -6,-12 -6,12 -6,-12 -6,12 -6,-12 -6,12 -6,-12 -6,12 -6,-12 -6,12 -6,-12 -6,12 -6,-12 -6,12 -6,-12 -6,12 -6,-12 -6,12 z" fill="#f5bcc8" stroke="#c9506d" stroke-width="1.4" stroke-linejoin="round"/>
        <rect x="18" y="24" width="84" height="5" rx="2.5" fill="#fff" opacity=".55"/>
        <circle cx="96" cy="36" r="5" fill="#fff" stroke="#c9506d" stroke-width="1.4"/>`,
      drip: `<ellipse cx="60" cy="80" rx="34" ry="5" fill="rgba(61,4,5,.12)"/>
        <path d="M52,24 L60,4 L68,24 Z" fill="#fff" stroke="rgba(109,8,9,.3)" stroke-width="1.2"/>
        <rect x="40" y="22" width="40" height="56" rx="12" fill="#fff" stroke="rgba(109,8,9,.3)" stroke-width="1.4"/>
        <path d="M41,50 h38 v16 q0,11 -11,11 h-16 q-11,0 -11,-11 z" fill="#4a2418"/>
        <path d="M41,50 q6,6 12,0 t12,0 t14,0" fill="#4a2418"/>
        <rect x="44" y="28" width="5" height="40" rx="2.5" fill="#fff" opacity=".7"/>
        <path d="M60,4 q4,6 0,12 q-4,-6 0,-12" fill="#4a2418"/>
        <rect x="38" y="20" width="44" height="8" rx="4" fill="#e2849a"/>`,
    };
    return `<svg class="mk-tool__svg" viewBox="0 0 120 86" aria-hidden="true">${tools[kind] || ""}</svg>`;
  }

  // a single topping, drawn small (for the jars and for the ones that fly out)
  function itemSVG(id, x = 0, y = 0, s = 1, k = 0) {
    const t = `transform="translate(${f1(x)} ${f1(y)}) scale(${s})"`;
    switch (id) {
      case "berries":
        return k % 3 === 2
          ? `<g ${t}><circle r="5" fill="#3b4a8c"/><circle cx="-1.6" cy="-1.8" r="1.4" fill="#fff" opacity=".6"/></g>`
          : `<g ${t}><circle r="6.5" fill="#c2263f"/><circle cx="-2.4" cy="1" r="1.6" fill="#de4a62"/><circle cx="2.2" cy="2.2" r="1.6" fill="#de4a62"/><circle cx="2.4" cy="-2.2" r="1.5" fill="#de4a62"/><circle cx="-2.2" cy="-2.8" r="1.6" fill="#fff" opacity=".45"/></g>`;
      case "flowers": {
        const c = ["#f5bcc8", "#ffffff", "#e2849a"][k % 3];
        return `<g ${t}><path d="M-9,5 q-4,-10 6,-9" fill="#7aa874"/><circle r="7.5" fill="${c}" stroke="${shade(c, -0.12)}" stroke-width="1.1"/><path d="M-3.8,0 a3.8,3.8 0 1,1 3.8,3.8 a2.2,2.2 0 1,1 -2.2,-2.2" fill="none" stroke="${shade(c, -0.2)}" stroke-width="1.2"/></g>`;
      }
      case "cherries":
        return `<g ${t}><image href="${CHERRY()}" x="-11" y="-15" width="22" height="22"/></g>`;
      case "gold":
        return `<g ${t}><path d="M-7,-2 L3,-7 L7,2 L-3,6 Z" fill="#e3b94a" transform="rotate(${(k * 47) % 90})"/><path d="M-7,-2 L3,-7" stroke="#fff3c4" stroke-width="1.2" transform="rotate(${(k * 47) % 90})"/></g>`;
      case "macarons": {
        const c = ["#f5bcc8", "#fbe6b8", "#bcd6f3", "#e9c6f0"][k % 4];
        return `<g ${t}><rect x="-9" y="-7" width="18" height="6.5" rx="3.2" fill="${c}"/><rect x="-8" y="-1.4" width="16" height="3" rx="1.5" fill="#fff8ee"/><rect x="-9" y="1.2" width="18" height="6.5" rx="3.2" fill="${shade(c, -0.07)}"/></g>`;
      }
      case "sprinkles": {
        const cs = ["#6d0809", "#e2849a", "#bcd6f3", "#f2cf86", "#9ed9b8", "#ffffff"];
        return `<g ${t}>${[0, 1, 2].map((j) => `<rect x="-1.5" y="-4.5" width="3" height="9" rx="1.5" fill="${cs[(k + j * 2) % 6]}" stroke="rgba(0,0,0,.08)" stroke-width=".5" transform="translate(${(j - 1) * 5} ${(j % 2) * 3 - 1}) rotate(${(k * 37 + j * 61) % 180})"/>`).join("")}</g>`;
      }
      case "candles": {
        const c = ["#f5bcc8", "#bcd6f3", "#fbe6b8", "#e9c6f0"][k % 4];
        return `<g ${t}><rect x="-2.6" y="-8" width="5.2" height="16" rx="1.5" fill="${c}" stroke="rgba(109,8,9,.25)" stroke-width=".6"/><path d="M-2.6,-4 l5.2,-3 M-2.6,1 l5.2,-3 M-2.6,6 l5.2,-3" stroke="#e2849a" stroke-width="1.2"/><ellipse cy="-12.5" rx="2.4" ry="4" fill="#ffb347"/><ellipse cy="-11.5" rx="1.2" ry="2.2" fill="#fff6c8"/></g>`;
      }
    }
    return "";
  }

  // a glass jar of a topping with a screw lid
  function jarSVG(id) {
    const u = uid("j");
    const lid = (CTOR.toppings[id] || {}).lid || "#e2849a";
    const r = rng(id.length * 31 + 7);
    let fill = "";
    const per = id === "sprinkles" ? 5 : 3;
    const rowsN = id === "sprinkles" ? 4 : 3;
    for (let row = 0; row < rowsN; row++) {
      for (let c = 0; c < per; c++) {
        const step = 50 / per;
        const x = 15 + step / 2 + c * step + (row % 2 ? step / 3 : 0) + (r() - 0.5) * 3;
        const yy = 98 - row * (id === "sprinkles" ? 9 : 13) + (r() - 0.5) * 3;
        fill += itemSVG(id, x, yy, id === "sprinkles" ? 0.75 : id === "candles" ? 1.1 : 1, row * per + c);
      }
    }
    return `<svg class="mk-jar__svg" viewBox="0 0 80 114" aria-hidden="true">
      <defs><clipPath id="${u}"><rect x="11" y="27" width="58" height="80" rx="12"/></clipPath></defs>
      <ellipse cx="40" cy="110" rx="30" ry="3.5" fill="rgba(61,4,5,.14)"/>
      <rect x="9" y="24" width="62" height="85" rx="14" fill="rgba(255,255,255,.42)" stroke="rgba(109,8,9,.2)" stroke-width="1.5"/>
      <g clip-path="url(#${u})">${fill}</g>
      <path d="M17,38 v54" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
      <path d="M62,42 v18" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>
      <rect x="13" y="19" width="54" height="8" rx="3" fill="rgba(255,255,255,.7)" stroke="rgba(109,8,9,.16)"/>
      <g class="mk-jar__lid"><rect x="9" y="5" width="62" height="16" rx="5" fill="${lid}"/><path d="M16,9 v8 M23,9 v8 M30,9 v8 M37,9 v8 M44,9 v8 M51,9 v8 M58,9 v8 M65,9 v8" stroke="rgba(0,0,0,.14)" stroke-width="2"/><rect x="9" y="5" width="62" height="5" rx="2.5" fill="#fff" opacity=".28"/></g>
    </svg>`;
  }

  const boxIcon = `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="7" y="15" width="26" height="19" rx="2" fill="#fff" stroke="#6d0809" stroke-width="1.6"/><rect x="5" y="11" width="30" height="6" rx="2" fill="#f5bcc8" stroke="#6d0809" stroke-width="1.6"/><path d="M20,11 v23" stroke="#c2263f" stroke-width="3"/><path d="M20,11 q-8,-9 -9,-1 q1,3 9,1 q8,2 9,-1 q-1,-8 -9,1" fill="#e2849a" stroke="#6d0809" stroke-width="1.2"/></svg>`;

  /* ═════════════ ② the workshop ═════════════ */
  function workshop() {
    const root = $("#maisternia");
    if (!root || !M()) return null;
    const sizes = M().sizes;
    const flavors = M().flavors;
    const st = {
      size: sizes.some((s) => s.id === params.get("size")) ? params.get("size") : (sizes.find((s) => s.id === "2") || sizes[0]).id,
      flavor: flavors.some((f) => f.id === params.get("flavor")) ? params.get("flavor") : flavors[0].id,
      coat: CTOR.coats[params.get("coat")] ? params.get("coat") : "smooth",
      color: CTOR.colors[params.get("color")] ? params.get("color") : "powder",
      decor: CTOR.decor[params.get("decor")] ? params.get("decor") : "medium",
      toppings: (params.get("top") ?? "berries,candles").split(",").filter((t) => CTOR.toppings[t]),
      text: (params.get("text") || "").slice(0, 24),
      idea: "",
      photos: [],
    };
    // the idea and its photos outlive a reload or a trip to the catalogue (this tab only)
    const IDEA_KEY = "mariday:ctor-idea";
    try { Object.assign(st, (({ idea = "", photos = [] }) => ({ idea: String(idea).slice(0, 1000), photos: photos.slice(0, 10) }))(JSON.parse(sessionStorage.getItem(IDEA_KEY)) || {})); } catch (e) { /* nothing kept */ }
    const keepIdea = () => { try { sessionStorage.setItem(IDEA_KEY, JSON.stringify({ idea: st.idea, photos: st.photos })); } catch (e) { /* storage off */ } };
    // photos for the idea: polaroids under the inscription (js/ideas.js, loaded by layout.js)
    let board = null;
    const withIdeas = (fn) => (window.MaridayIdeas ? fn(window.MaridayIdeas) : document.addEventListener("mariday:ideas", () => fn(window.MaridayIdeas), { once: true }));
    withIdeas((I) => {
      board = I.board({ photos: st.photos, hint: "торт, який сподобався, кольори, настрій — що завгодно", onChange: (urls) => { st.photos = urls; keepIdea(); } });
      board.mount($("[data-idea-photos]", root));
    });
    let step = Math.min(4, Math.max(0, parseInt(params.get("step"), 10) || 0));
    let cut = step === 1;
    let blown = false;
    let lastTiers = 0;
    let touched = false; // the URL is only rewritten once something has been chosen
    let rot = 0, vel = 0, dragging = false, raf = 0, dragged = false;
    let boxing = false;

    const route = $("[data-mk-route]", root);
    const pane = $("[data-mk-pane]", root);
    const nav = $("[data-mk-nav]", root);
    const turn = $("[data-mk-turn]", root);
    const cakeHost = $("[data-mk-cake]", root);
    const ghost = $("[data-mk-ghost]", root);
    const bill = $("[data-mk-bill]", root);
    const roll = $("[data-mk-roll]", root);
    const paper = $("[data-mk-paper]", root);
    const sticker = $("[data-mk-sticker] b", root);
    const hint = $("[data-mk-hint]", root);
    const hooks = $("[data-mk-hooks]", root);

    const sizeObj = () => sizes.find((s) => s.id === st.size) || sizes[0];
    const lines = () => [
      [`Основа ${sizeObj().label} · ${flavorById(st.flavor).name}`, Math.round(CTOR.base * sizeObj().priceMult)],
      [`Покриття: ${CTOR.coats[st.coat].name}`, CTOR.coats[st.coat].add],
      [`Декор: ${CTOR.decor[st.decor].name}`, CTOR.decor[st.decor].add],
      ...st.toppings.map((t) => [CTOR.toppings[t].name, CTOR.toppings[t].add]),
    ];
    const price = () => lines().reduce((s, [, v]) => s + v, 0);
    const caption = () => `${sizeObj().label} · ${sizeObj().serves} · ${flavorById(st.flavor).name} · ${colorOf(st.color).name.toLowerCase()} ${CTOR.coats[st.coat].name.toLowerCase()}`;
    const guestsOf = (s) => {
      const n = (String(s.serves).match(/\d+/g) || ["10"]).map(Number);
      return n.length > 1 ? Math.round((n[0] + n[1]) / 2) : n[0] + 4;
    };

    function syncURL(force) {
      if (!touched && !force) return location.href;
      const u = new URL(location.href);
      u.search = new URLSearchParams({ size: st.size, flavor: st.flavor, coat: st.coat, color: st.color, decor: st.decor, top: st.toppings.join(","), ...(st.text ? { text: st.text } : {}), step: String(step) }).toString();
      history.replaceState(null, "", u);
      return u.href;
    }

    /* ── the cake ── */
    const draw = (fx = {}) => {
      cakeHost.innerHTML = cakeSVG(st, { cut, rot, fx, blown });
    };
    function paintCake(fx = {}) {
      const tiers = tiersFor(st.size).length;
      draw({ drop: !reduce && (fx.drop || tiers !== lastTiers), fall: reduce ? null : fx.fall });
      lastTiers = tiers;
      root.style.setProperty("--tint", colorOf(st.color).hex);
      paintMoney(fx.print !== false);
      paintRoute();
      syncURL();
    }
    // the new cream pours over the old one from the top
    function wash() {
      const old = $("svg", cakeHost);
      if (!old || reduce || !ghost.animate) return;
      vel = 0;
      const copy = old.cloneNode(true);
      copy.classList.remove("is-drop");
      ghost.replaceChildren(copy);
      ghost.getAnimations?.().forEach((a) => a.cancel());
      const a = ghost.animate([{ clipPath: "inset(0% -20% -10% -20%)" }, { clipPath: "inset(100% -20% -10% -20%)" }], { duration: 760, easing: "cubic-bezier(.6,.05,.3,1)" });
      a.onfinish = () => ghost.replaceChildren();
    }

    /* ── the bill, the price sticker and the price on the button ── */
    let shownPrice = null;
    function paintMoney(print) {
      const to = price();
      const rows = lines().map(([n, v]) => `<p class="mk-bill__row"><span>${esc(n)}</span><b>${v ? eur(v) : "вкл."}</b></p>`).join("") + (st.text ? `<p class="mk-bill__row"><span>Напис «${esc(st.text)}»</span><b>вкл.</b></p>` : "");
      roll.innerHTML = `<p class="mk-bill__head">Mariday cake<small>Alkmaar · ручна робота</small></p>${rows}<p class="mk-bill__total"><span>Разом</span><b data-mk-total>${eur(to)}</b></p><p class="mk-bill__foot">орієнтовно ✦ дякуємо</p>`;
      paper.style.height = roll.offsetHeight + "px";
      if (print && shownPrice !== null && shownPrice !== to && !reduce) {
        bill.classList.remove("is-print");
        void bill.offsetWidth;
        bill.classList.add("is-print");
      }
      const from = shownPrice ?? to;
      shownPrice = to;
      const set = (v) => {
        const t = eur(v);
        sticker.textContent = t;
        $$("[data-nav-price]", root).forEach((el) => (el.textContent = t));
        const tt = $("[data-mk-ticket-total]", root);
        if (tt) tt.textContent = t;
      };
      const g = gs();
      if (g && from !== to) {
        const o = { v: from };
        g.to(o, { v: to, duration: 0.6, ease: "power3.out", onUpdate: () => set(Math.round(o.v)) });
      } else set(to);
      const stk = $("[data-mk-sticker]", root);
      stk.classList.remove("is-bump");
      void stk.offsetWidth;
      if (from !== to) stk.classList.add("is-bump");
    }

    /* ── the route along the top ── */
    const routeIcon = (i) => {
      if (i === 0) return tinSVG([[220, 130]]);
      if (i === 1) return glassSVG(st.flavor);
      if (i === 2) return bagSVG(colorOf(st.color).hex);
      if (i === 3) return jarSVG("cherries");
      return boxIcon;
    };
    const wave = "M0,22 C60,4 140,40 200,22 S340,4 400,22 S540,40 600,22 S740,4 800,22";
    route.innerHTML = `
      <span class="mk-route__line" aria-hidden="true"><svg viewBox="0 0 800 44" preserveAspectRatio="none"><path d="${wave}"/></svg></span>
      <span class="mk-route__line mk-route__cream" aria-hidden="true"><svg viewBox="0 0 800 44" preserveAspectRatio="none"><path d="${wave}"/><path class="mk-route__shine" d="${wave}"/></svg></span>
      ${STEPS.map((S, i) => `<button type="button" role="tab" class="mk-route__st" data-step="${i}" id="mk-tab-${i}" aria-controls="mk-pane"><span class="mk-route__ico" data-ico="${i}"></span><span class="mk-route__w">${S.word}</span></button>`).join("")}`;
    function paintRoute() {
      $$("[data-step]", route).forEach((b) => {
        const i = +b.dataset.step;
        b.classList.toggle("is-on", i === step);
        b.classList.toggle("is-done", i < step);
        b.setAttribute("aria-selected", String(i === step));
        b.tabIndex = i === step ? 0 : -1;
        const ico = $("[data-ico]", b);
        const html = routeIcon(i);
        if (ico.dataset.k !== `${i}:${st.flavor}:${st.color}`) {
          ico.innerHTML = html;
          ico.dataset.k = `${i}:${st.flavor}:${st.color}`;
        }
      });
      route.style.setProperty("--p", (step / (STEPS.length - 1)).toFixed(3));
      pane.setAttribute("aria-labelledby", `mk-tab-${step}`);
    }

    /* ── the stations ── */
    const chars = (w) => [...w].map((ch, i) => `<span class="mk-ch" style="--i:${i};--cr:${i % 2 ? 12 : -12}deg">${ch}</span>`).join("");
    const tag = (title, sub, extra = "") => `<span class="mk-tag"><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}${extra}</span>`;
    const pressed = (on) => `aria-pressed="${on}"`;
    const rows = (items, label) => {
      if (items.length <= 6) return `<div class="mk-row mk-row--bench" role="group" aria-label="${label}">${items.join("")}</div>`;
      const h = Math.ceil(items.length / 2);
      return `<div class="mk-row mk-row--shelf" role="group" aria-label="${label}">${items.slice(0, h).join("")}</div><div class="mk-row mk-row--bench" role="group" aria-label="${label}, далі">${items.slice(h).join("")}</div>`;
    };
    // a plate with a slice for every two guests
    const plates = (g) => Array.from({ length: Math.ceil(g / 2) }, () => '<i class="mk-plate"></i>').join("");
    const meter = (n, kind) => Array.from({ length: 5 }, (_, i) => `<i class="mk-meter__${kind}${i < n ? " is-on" : ""}"></i>`).join("");

    function stationHTML() {
      const S = STEPS[step];
      let body = "";
      let k = 0;
      const lede = [
        "Орієнтир — 150–200 г на гостя. Розкачайте тісто на свою кількість гостей — форму підберемо самі.",
        "Торт уже розрізано — дивіться на шари. Яку начинку пробуємо?",
        "Візьміть інструмент і мішечок — новий крем ляже просто на торт.",
        "Напис, складність і топінги — баночки відкриваються на тиць.",
        "Перевірте чек — і пакуємо в коробку з бантом.",
      ][step];
      if (step === 0) {
        const g = guestsOf(sizeObj());
        body = `
          <p class="mk-label">Тарілочки для гостей <span>— по шматочку кожному</span></p>
          <div class="mk-row mk-row--shelf mk-plates" data-plates aria-hidden="true">${plates(g)}</div>
          <div class="mk-dough" style="--v:${((g - 4) / 56).toFixed(3)}">
            <span class="mk-dough__sheet" aria-hidden="true"></span>
            <span class="mk-dough__pin" aria-hidden="true"><i></i></span>
            <input class="mk-dough__range" type="range" min="4" max="60" value="${g}" data-guests aria-label="Скільки гостей">
            <output class="mk-dough__out" data-guests-out><b>${g}</b> ${guestsWord(g)}</output>
          </div>
          ${rows(sizes.map((s) => `<button type="button" class="mk-obj mk-tin${s.id === st.size ? " is-on" : ""}" data-size="${esc(s.id)}" ${pressed(s.id === st.size)} style="--k:${k++};--s:${(tiersFor(s.id)[0][0] / 292).toFixed(3)}">${tinSVG(tiersFor(s.id))}${tag(esc(s.label), esc(s.serves))}</button>`), "Вага торта")}`;
      } else if (step === 1) {
        const f = flavorById(st.flavor), m = metaOf(st.flavor);
        body = `
          <div class="mk-recipe">
            <span class="mk-recipe__print"><img src="${esc(M().img(m.img))}" alt="" loading="lazy" draggable="false"></span>
            <div class="mk-recipe__txt">
              <h3>${esc(f.name)}</h3>
              <p>${esc(f.desc)}</p>
              <p class="mk-meters"><span>солодкість <span class="mk-meter">${meter(m.sweet, "sugar")}</span></span><span>кислинка <span class="mk-meter">${meter(m.sour, "lemon")}</span></span></p>
            </div>
          </div>
          ${rows(flavors.map((x) => `<button type="button" class="mk-obj mk-glass${x.id === st.flavor ? " is-on" : ""}" data-flavor="${esc(x.id)}" ${pressed(x.id === st.flavor)} style="--k:${k++}">${glassSVG(x.id)}${tag(esc(x.name))}</button>`), "Начинка")}`;
      } else if (step === 2) {
        body = `
          <p class="mk-label">Чим покриваємо <span>— інструмент майстра</span></p>
          <div class="mk-row mk-row--shelf" role="group" aria-label="Покриття">${Object.entries(CTOR.coats).map(([id, c]) => `<button type="button" class="mk-obj mk-tool${id === st.coat ? " is-on" : ""}" data-coat="${id}" data-tool="${id}" ${pressed(id === st.coat)} style="--k:${k++}">${toolSVG(id)}${tag(c.short + (c.add ? ` <em>+€${c.add}</em>` : ""), c.note)}</button>`).join("")}</div>
          <p class="mk-label">Колір крему <span>— ${colorOf(st.color).name.toLowerCase()}</span></p>
          <div class="mk-row mk-row--bench" role="group" aria-label="Колір крему">${Object.entries(CTOR.colors).map(([id, c]) => `<button type="button" class="mk-obj mk-bag${id === st.color ? " is-on" : ""}" data-color="${id}" ${pressed(id === st.color)} style="--k:${k++};--c:${c.hex}" aria-label="${c.name}">${bagSVG(c.hex)}<i class="mk-bag__drop" aria-hidden="true"></i>${tag(c.name)}</button>`).join("")}</div>`;
      } else if (step === 3) {
        body = `
          <div class="mk-write">
            <label class="mk-plaque"><span>Напис на торті</span><input type="text" maxlength="24" data-ctext value="${esc(st.text)}" placeholder="Happy birthday!" autocomplete="off"></label>
            <label class="mk-idea"><span>Ваша ідея</span><textarea rows="2" maxlength="1000" data-idea placeholder="Опишіть, що хочете: тема, кольори, настрій…">${esc(st.idea)}</textarea></label>
            <div class="mk-photos" data-idea-photos></div>
          </div>
          <div class="mk-row mk-row--shelf" role="group" aria-label="Складність декору">${Object.entries(CTOR.decor).map(([id, d]) => `<button type="button" class="mk-obj mk-mini${id === st.decor ? " is-on" : ""}" data-decor="${id}" ${pressed(id === st.decor)} style="--k:${k++}"><span class="mk-mini__cake" aria-hidden="true">${cakeSVG({ ...st, decor: id, text: "" }, { rot: 0.35 })}</span>${tag(d.name + (d.add ? ` <em>+€${d.add}</em>` : ""), d.note)}</button>`).join("")}</div>
          <p class="mk-label">Топінги <span>— можна кілька, тиць по баночці</span></p>
          <div class="mk-row mk-row--bench" role="group" aria-label="Топінги">${Object.entries(CTOR.toppings).map(([id, t]) => `<button type="button" class="mk-obj mk-jar${st.toppings.includes(id) ? " is-on" : ""}" data-top="${id}" ${pressed(st.toppings.includes(id))} style="--k:${k++}">${jarSVG(id)}${tag(t.name, `+€${t.add}`)}</button>`).join("")}</div>`;
      } else {
        body = `
          <div class="mk-ticket">
            <p class="mk-ticket__head">Mariday cake · ваш дизайн</p>
            ${lines().map(([n, v]) => `<p class="mk-ticket__row"><span>${esc(n)}</span><i></i><b>${v ? eur(v) : "вкл."}</b></p>`).join("")}
            ${st.text ? `<p class="mk-ticket__row"><span>Напис «${esc(st.text)}»</span><i></i><b>вкл.</b></p>` : ""}
            ${st.idea ? `<p class="mk-ticket__idea">«${esc(st.idea)}»</p>` : ""}
            ${st.photos.length ? `<p class="mk-ticket__pics">${st.photos.slice(0, 5).map((u) => `<img src="${esc(u)}" alt="" loading="lazy">`).join("")}<span>${st.photos.length} фото до ідеї</span></p>` : ""}
            <p class="mk-ticket__total"><span>Разом орієнтовно</span><b data-mk-ticket-total>${eur(price())}</b></p>
            <p class="mk-ticket__foot">Фінальну ціну підтвердить менеджер — після уточнення деталей ♥</p>
          </div>
          <div class="mk-actions">
            <a class="mk-chip mk-chip--wa" data-wa target="_blank" rel="noopener">Обговорити у WhatsApp</a>
            <button type="button" class="mk-chip" data-png>Зберегти картинку</button>
            <button type="button" class="mk-chip" data-share>Скопіювати посилання</button>
          </div>`;
      }
      return `
        <div class="mk-st mk-st--${step}">
          <h2 class="mk-h" aria-label="${S.word} — ${S.script}"><span class="mk-h__w" aria-hidden="true">${chars(S.word)}</span><span class="mk-h__s" aria-hidden="true">${S.script}</span></h2>
          <p class="mk-lede">${lede}</p>
          <div class="mk-st__body">${body}</div>
        </div>`;
    }

    function waLink() {
      const msg = `Вітаю! Хочу торт з конструктора:\n${lines().map(([n, v]) => `• ${n}${v ? " — €" + v : ""}`).join("\n")}${st.text ? `\n• Напис: «${st.text}»` : ""}${st.idea ? `\n• Ідея: ${st.idea}` : ""}${st.photos.length ? `\n• Фото:\n${st.photos.join("\n")}` : ""}\nРазом орієнтовно: ${eur(price())}\n${syncURL(true)}`;
      return `https://wa.me/${M().contacts.whatsapp}?text=${encodeURIComponent(msg)}`;
    }

    function paintNav() {
      nav.innerHTML = `
        <button type="button" class="mk-navbtn mk-navbtn--back" data-prev ${step === 0 ? "disabled" : ""}><span aria-hidden="true">←</span> Назад</button>
        ${step < 4
          ? `<button type="button" class="mk-navbtn mk-navbtn--go" data-next>Далі: ${STEPS[step + 1].word.toLowerCase()} <b data-nav-price>${eur(price())}</b></button>`
          : `<button type="button" class="mk-navbtn mk-navbtn--go is-final" data-add>Пакуємо в коробку <b data-nav-price>${eur(price())}</b></button>`}`;
    }

    let paneToken = 0;
    function paintPane(dir = 0, quiet = false) {
      const tok = ++paneToken;
      const put = () => {
        if (tok !== paneToken) return;
        pane.innerHTML = stationHTML();
        pane.classList.remove("is-leave");
        pane.style.setProperty("--dir", dir || 1);
        pane.classList.remove("is-enter");
        if (!quiet && !reduce) {
          void pane.offsetWidth;
          pane.classList.add("is-enter");
        }
        const wa = $("[data-wa]", pane);
        if (wa) wa.href = waLink();
        if (board) board.mount($("[data-idea-photos]", pane));
        paintNav();
      };
      if (quiet || reduce || !pane.firstElementChild) return put();
      pane.style.setProperty("--dir", dir || 1);
      pane.classList.add("is-leave");
      setTimeout(put, 200);
    }

    function setCut(on) {
      cut = on;
      $("[data-cut]", root)?.setAttribute("aria-pressed", String(cut));
      if (cut) { rot = 0; vel = 0; }
    }

    function goStep(i, opts = {}) {
      const to = Math.max(0, Math.min(4, i));
      if (to === step && !opts.force) return;
      const dir = to >= step ? 1 : -1;
      step = to;
      touched = true;
      root.style.setProperty("--pan", step);
      root.style.setProperty("--wash", STEPS[step].wash || washCream());
      bill.classList.toggle("is-torn", step === 4);
      swing(dir);
      const wasCut = cut;
      setCut(step === 1);
      if (wasCut !== cut) draw();
      else if (!cut && !reduce) { vel += 0.16 * dir; kick(); }
      paintPane(dir);
      paintRoute();
      syncURL();
      // on phones the station starts under the cake that rides along at the top
      if (innerWidth < 900 && opts.scroll !== false) {
        const zone = $(".mk-zone", root);
        const y = pane.getBoundingClientRect().top + scrollY - zone.offsetHeight - 16;
        if (Math.abs(scrollY - y) > 40) window.MaridayLenis ? MaridayLenis.scrollTo(y, { duration: 0.9 }) : scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      }
    }
    // a step along the bench sets the utensils on the rail swinging
    function swing(dir) {
      if (!hooks || reduce) return;
      hooks.style.setProperty("--dir", dir);
      hooks.classList.remove("is-swing");
      void hooks.offsetWidth;
      hooks.classList.add("is-swing");
    }
    const washCream = () => {
      const hex = colorOf(st.color).hex;
      return isDark(hex) ? "#f3c9d2" : hex;
    };

    /* ── the turntable ── */
    function loop() {
      if (!dragging) {
        rot += vel;
        vel *= 0.95;
        if (Math.abs(vel) < 0.003) {
          vel = 0;
          const target = Math.round(rot / TAU) * TAU;
          rot += (target - rot) * 0.09;
          if (Math.abs(target - rot) < 0.002) {
            rot = 0;
            draw();
            raf = 0;
            return;
          }
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    }
    const kick = () => { if (!raf && !cut) raf = requestAnimationFrame(loop); };

    let startX = 0, startRot = 0, lastX = 0, lastT = 0, downX = 0;
    cakeHost.addEventListener("pointerdown", (e) => {
      if (cut || boxing || e.button !== 0) return;
      dragging = true;
      dragged = false;
      startX = lastX = downX = e.clientX;
      startRot = rot;
      lastT = performance.now();
      vel = 0;
      cakeHost.setPointerCapture(e.pointerId);
      cakeHost.classList.add("is-grab");
      kick();
    });
    cakeHost.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const now = performance.now();
      rot = startRot + (e.clientX - startX) / 85;
      vel = ((e.clientX - lastX) / 85) * Math.min(1, 16 / Math.max(1, now - lastT));
      lastX = e.clientX;
      lastT = now;
      if (Math.abs(e.clientX - downX) > 5 && !dragged) {
        dragged = true;
        hint?.classList.add("is-gone");
      }
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      cakeHost.classList.remove("is-grab");
    };
    cakeHost.addEventListener("pointerup", () => {
      const wasDrag = dragged;
      endDrag();
      if (!wasDrag && st.toppings.includes("candles") && !cut) blowCandles();
    });
    cakeHost.addEventListener("pointercancel", endDrag);
    cakeHost.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        vel += e.key === "ArrowLeft" ? -0.06 : 0.06;
        kick();
      }
    });
    // a sideways swipe on the cake turns it — the page must not take it as a horizontal scroll
    cakeHost.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && !cut) {
        e.preventDefault();
        e.stopPropagation();
        vel += e.deltaX * -0.0012;
        kick();
      }
    }, { passive: false });

    function blowCandles() {
      blown = !blown;
      draw();
      if (blown) {
        window.burstConfetti?.(turn);
        showToast("Бажання загадано ✨ Тицьніть ще раз — свічки знову запаляться");
      }
    }

    /* ── toppings fly from the jar onto the cake ── */
    function flyFrom(el, id) {
      if (reduce || !el || !document.body.animate) return 0;
      const a = $("svg", el).getBoundingClientRect();
      const c = cakeHost.getBoundingClientRect();
      const tx = c.left + c.width / 2;
      const ty = c.top + (cakeTopY(st) / 400) * c.height;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const s = document.createElement("span");
        s.className = "mk-fly";
        s.innerHTML = `<svg viewBox="-14 -16 28 30">${itemSVG(id, 0, 0, 1, i)}</svg>`;
        document.body.appendChild(s);
        const sx = a.left + a.width * (0.3 + Math.random() * 0.4), sy = a.top + a.height * 0.35;
        const ex = tx + (Math.random() - 0.5) * c.width * 0.36, ey = ty + (Math.random() - 0.5) * 16;
        const r = (Math.random() - 0.5) * 540;
        const peak = Math.min(sy, ey) - 90 - Math.random() * 90;
        s.animate(
          [
            { transform: `translate(${sx}px, ${sy}px) rotate(0deg) scale(0.6)`, opacity: 0 },
            { transform: `translate(${sx}px, ${sy - 30}px) rotate(${r * 0.1}deg) scale(1)`, opacity: 1, offset: 0.12 },
            { transform: `translate(${(sx + ex) / 2}px, ${peak}px) rotate(${r * 0.6}deg) scale(1.15)`, opacity: 1, offset: 0.55 },
            { transform: `translate(${ex}px, ${ey}px) rotate(${r}deg) scale(0.8)`, opacity: 0 },
          ],
          { duration: 780 + i * 40, delay: i * 45, easing: "cubic-bezier(.35,0,.45,1)", fill: "both" }
        ).onfinish = () => s.remove();
      }
      return 520;
    }

    /* ── packing: the box closes round the cake, ribbon and bow, off to the cart ── */
    async function pack() {
      if (boxing) return;
      // the cake goes into the box with every photo, so ones still uploading are waited for
      if (board && board.busy()) {
        boxing = true;
        showToast("Секундочку — фото ще завантажуються…");
        await board.idle();
        boxing = false;
      }
      const f = flavorById(st.flavor);
      const idea = st.idea.trim();
      const meta = [sizeObj().label, f.name, `${colorOf(st.color).name} ${CTOR.coats[st.coat].name.toLowerCase()}`, `декор: ${CTOR.decor[st.decor].name.toLowerCase()}`, ...st.toppings.map((x) => CTOR.toppings[x].name.toLowerCase()), st.text ? `напис «${st.text}»` : "", idea ? `ідея: ${idea.length > 70 ? idea.slice(0, 68) + "…" : idea}` : "", st.photos.length ? `${st.photos.length} фото` : ""].filter(Boolean).join(" · ");
      // the same cake with another idea or other photos is another line in the cart
      const link = syncURL(true);
      const extra = idea || st.photos.length ? "-i" + [...idea + st.photos.join()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36) : "";
      const item = { id: "custom", name: "Торт за вашим дизайном", price: price(), size: st.size, flavor: st.flavor, variant: link, meta, ...(extra ? { uid: `custom-${st.size}-${st.flavor}-${link}${extra}`, idea, photos: st.photos.slice() } : {}) };
      const g = gs();
      const back = $("[data-mk-box-back]", root), front = $("[data-mk-box-front]", root);
      if (!g) {
        addToCartAndNotify(item, cakeHost);
        return;
      }
      boxing = true;
      setCut(false);
      rot = 0; vel = 0; draw();
      // the box is as tall as the cake
      const topY = cakeTopY(st) - (st.toppings.some((t) => ["candles", "flowers", "macarons", "cherries"].includes(t)) || st.decor === "sculpt" ? 58 : 18);
      turn.style.setProperty("--bh", (((356 - Math.max(8, topY)) / 400) * 100).toFixed(1) + "%");
      const lid = $(".mk-box__lid", front), ribbon = $$(".mk-box__ribbon", front), bow = $(".mk-box__bow", front);
      const panels = [back, $(".mk-box__body", front)];
      const tl = g.timeline({ onComplete: () => { boxing = false; } });
      tl.set([back, front], { autoAlpha: 1 })
        .fromTo(panels, { yPercent: 105 }, { yPercent: 0, duration: 0.6, ease: "back.out(1.3)" })
        .fromTo(lid, { yPercent: -420, rotation: -8 }, { yPercent: 0, rotation: 0, duration: 0.55, ease: "bounce.out" }, "-=0.1")
        .fromTo(ribbon, { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: "power2.out", stagger: 0.08 })
        .fromTo(bow, { scale: 0, rotation: -60 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(3)" }, "-=0.05")
        .to(front.parentNode, { y: -16, duration: 0.14, yoyo: true, repeat: 3, ease: "power1.out" })
        .add(() => {
          addToCartAndNotify(item, bow);
          window.burstConfetti?.(turn);
        })
        .to({}, { duration: 1.3 })
        .to(bow, { scale: 0, rotation: 40, duration: 0.25, ease: "power2.in" })
        .to(ribbon, { scaleY: 0, duration: 0.2 })
        .to(lid, { yPercent: -420, rotation: 10, duration: 0.5, ease: "power2.in" })
        .to(panels, { yPercent: 105, duration: 0.55, ease: "power2.in" }, "-=0.2")
        .set([back, front], { autoAlpha: 0 })
        .add(() => { vel = 0.3; kick(); });
    }

    /* ── ⬇ a picture of the design (the inscription is drawn on the canvas so the script font is kept) ── */
    let cherryData = null;
    async function exportPNG() {
      try {
        if (!cherryData) {
          const blob = await (await fetch(CHERRY())).blob();
          cherryData = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
        }
        const svg = cakeSVG(st, { rot: 0, cherry: cherryData, noText: true, blown }).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="800" ');
        const img = new Image();
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        await img.decode();
        const cv = document.createElement("canvas");
        cv.width = 1080;
        cv.height = 1350;
        const ctx = cv.getContext("2d");
        const tint = colorOf(st.color).hex;
        const grd = ctx.createRadialGradient(540, 620, 60, 540, 620, 760);
        grd.addColorStop(0, "#ffffff");
        grd.addColorStop(1, isDark(tint) ? "#f5bcc8" : tint);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 1080, 1350);
        ctx.drawImage(img, 140, 250, 800, 800);
        await document.fonts.ready;
        if (st.text) {
          const base = tiersFor(st.size)[0];
          const baseY = 352 - base[1];
          const fs = Math.max(13, Math.min(30, (base[0] * 1.7) / Math.max(st.text.length, 4)));
          ctx.fillStyle = isDark(tint) ? "#f5bcc8" : "#6d0809";
          ctx.textAlign = "center";
          ctx.font = `${fs * 2}px "Great Vibes", cursive`;
          ctx.fillText(st.text, 540, 250 + (baseY + base[1] / 2 + fs / 3 + Math.max(9, base[0] * 0.06)) * 2);
        }
        ctx.fillStyle = "#6d0809";
        ctx.textAlign = "center";
        ctx.font = '400 72px "Dela Gothic One", "Unbounded", sans-serif';
        ctx.fillText("MARIDAY", 540, 150);
        ctx.font = '60px "Pacifico", "Great Vibes", cursive';
        ctx.fillStyle = "#e2849a";
        ctx.fillText("мій торт", 700, 215);
        ctx.font = '500 34px "Caveat", cursive';
        ctx.fillStyle = "#6d0809";
        ctx.fillText(caption(), 540, 1170);
        ctx.font = '600 30px "Unbounded", sans-serif';
        ctx.fillText(`орієнтовно ${eur(price())}  ·  @mariday.cake`, 540, 1250);
        const a = document.createElement("a");
        a.download = "mariday-moi-tort.png";
        a.href = cv.toDataURL("image/png");
        a.click();
        showToast("Картинку збережено — надішліть її менеджеру ♥");
      } catch {
        showToast("Не вдалося зберегти картинку — скористайтеся посиланням");
      }
    }

    /* ── a whole design at once: a house recipe, the surprise or a shared link ── */
    function apply(next, { scroll = false } = {}) {
      const before = $("svg", cakeHost) && !cut;
      Object.assign(st, JSON.parse(JSON.stringify(next)));
      touched = true;
      blown = false;
      lastTiers = 0;
      setCut(step === 1);
      if (before) wash();
      root.style.setProperty("--wash", STEPS[step].wash || washCream());
      paintCake({ drop: true, fall: new Set(st.toppings) });
      paintPane(0, true);
      if (!reduce && !cut) setTimeout(() => { if (!dragging && !cut) { vel = 0.22; kick(); } }, 1900);
      if (scroll) {
        const y = root.getBoundingClientRect().top + scrollY;
        window.MaridayLenis ? MaridayLenis.scrollTo(y, { duration: 1.3 }) : scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      }
    }
    const randomDesign = () => {
      const pickOne = (o) => o[Math.floor(Math.random() * o.length)];
      return {
        size: pickOne(sizes).id,
        flavor: pickOne(flavors).id,
        coat: pickOne(Object.keys(CTOR.coats)),
        color: pickOne(Object.keys(CTOR.colors)),
        decor: pickOne(Object.keys(CTOR.decor)),
        toppings: Object.keys(CTOR.toppings).filter(() => Math.random() > 0.6),
        text: st.text,
      };
    };

    const bump = (el, cls) => {
      if (!el || reduce) return;
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    };
    const markOn = (attr, val) => $$(`[${attr}]`, pane).forEach((b) => {
      const on = attr === "data-top" ? st.toppings.includes(b.getAttribute(attr)) : b.getAttribute(attr) === val;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    root.addEventListener("click", (e) => {
      const t = e.target;
      const by = (sel) => t.closest(sel);
      if (by("[data-step]")) return goStep(+by("[data-step]").dataset.step);
      if (by("[data-next]")) return goStep(step + 1);
      if (by("[data-prev]")) return goStep(step - 1);
      if (boxing) return;
      let b;
      if ((b = by("[data-size]"))) {
        if (st.size === b.dataset.size) return bump(b, "is-hop");
        st.size = b.dataset.size;
        touched = true;
        markOn("data-size", st.size);
        bump(b, "is-hop");
        const g = guestsOf(sizeObj());
        const r = $("[data-guests]", pane);
        if (r) { r.value = g; setGuests(g, false); }
        setCut(false);
        return paintCake({});
      }
      if ((b = by("[data-flavor]"))) {
        st.flavor = b.dataset.flavor;
        touched = true;
        setCut(true);
        paintPane(0, true);
        bump($(`[data-flavor="${CSS.escape(st.flavor)}"]`, pane), "is-pour");
        return paintCake({});
      }
      if ((b = by("[data-coat]"))) {
        if (st.coat === b.dataset.coat) return bump(b, "is-act");
        st.coat = b.dataset.coat;
        touched = true;
        setCut(false);
        wash();
        markOn("data-coat", st.coat);
        bump(b, "is-act");
        return paintCake({});
      }
      if ((b = by("[data-color]"))) {
        bump(b, "is-squeeze");
        if (st.color === b.dataset.color) return;
        st.color = b.dataset.color;
        touched = true;
        setCut(false);
        wash();
        markOn("data-color", st.color);
        const lab = $$(".mk-label span", pane)[1];
        if (lab) lab.textContent = `— ${colorOf(st.color).name.toLowerCase()}`;
        if (step === 2) root.style.setProperty("--wash", washCream());
        return paintCake({});
      }
      if ((b = by("[data-decor]"))) {
        if (st.decor === b.dataset.decor) return bump(b, "is-hop");
        st.decor = b.dataset.decor;
        touched = true;
        setCut(false);
        wash();
        markOn("data-decor", st.decor);
        bump(b, "is-hop");
        return paintCake({});
      }
      if ((b = by("[data-top]"))) {
        const id = b.dataset.top;
        const adding = !st.toppings.includes(id);
        st.toppings = adding ? [...st.toppings, id] : st.toppings.filter((x) => x !== id);
        touched = true;
        if (id === "candles") blown = false;
        setCut(false);
        markOn("data-top", "");
        bump(b, adding ? "is-open" : "is-hop");
        if (adding) {
          const wait = flyFrom(b, id);
          paintMoney(true);
          setTimeout(() => { draw({ fall: reduce ? null : new Set([id]) }); paintRoute(); syncURL(); }, Math.max(0, wait - 260));
          // the decor previews on the shelf show the toppings too
          $$(".mk-mini__cake", pane).forEach((m, i) => (m.innerHTML = cakeSVG({ ...st, decor: Object.keys(CTOR.decor)[i], text: "" }, { rot: 0.35 })));
          return;
        }
        $$(".mk-mini__cake", pane).forEach((m, i) => (m.innerHTML = cakeSVG({ ...st, decor: Object.keys(CTOR.decor)[i], text: "" }, { rot: 0.35 })));
        return paintCake({});
      }
      if (by("[data-cut]")) {
        setCut(!cut);
        return draw();
      }
      if (by("[data-spin]")) {
        if (cut) setCut(false);
        vel += 0.3;
        hint?.classList.add("is-gone");
        return kick();
      }
      if (by("[data-random]")) return apply(randomDesign());
      if (by("[data-png]")) return exportPNG();
      if (by("[data-share]")) {
        const url = syncURL(true);
        (navigator.clipboard?.writeText(url) || Promise.reject())
          .then(() => showToast("Посилання на ваш дизайн скопійовано"))
          .catch(() => showToast("Скопіюйте адресу сторінки — у ній збережено дизайн"));
        return;
      }
      if (by("[data-add]")) return pack();
    });

    function setGuests(g, pick = true) {
      const dough = $(".mk-dough", pane);
      if (!dough) return;
      dough.style.setProperty("--v", ((g - 4) / 56).toFixed(3));
      $("[data-guests-out]", pane).innerHTML = `<b>${g}</b> ${guestsWord(g)}`;
      const shelf = $("[data-plates]", pane);
      if (shelf) {
        const have = shelf.children.length, need = Math.ceil(g / 2);
        if (need > have) shelf.insertAdjacentHTML("beforeend", Array.from({ length: need - have }, (_, i) => `<i class="mk-plate is-new" style="--k:${i}"></i>`).join(""));
        else for (let i = have; i > need; i--) shelf.lastElementChild.remove();
      }
      if (!pick) return;
      const need = g * 0.175;
      const s = sizes.find((x) => x.id !== "tier" && parseFloat(x.id) >= need) || sizes.find((x) => x.id === "tier") || sizes[sizes.length - 1];
      if (s.id !== st.size) {
        st.size = s.id;
        touched = true;
        markOn("data-size", st.size);
        bump($(`[data-size="${CSS.escape(st.size)}"]`, pane), "is-hop");
        setCut(false);
        paintCake({});
      }
    }

    root.addEventListener("input", (e) => {
      const t = e.target;
      if (t.matches("[data-ctext]")) {
        st.text = t.value.slice(0, 24);
        touched = true;
        if (Math.abs(Math.cos(rot)) < 0.9) rot = 0;
        if (cut) setCut(false);
        draw();
        paintMoney(false);
        syncURL();
      }
      if (t.matches("[data-idea]")) { st.idea = t.value.slice(0, 1000); keepIdea(); }
      if (t.matches("[data-guests]")) setGuests(+t.value);
    });

    // keyboard along the route: ← → between stations
    route.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      goStep(step + (e.key === "ArrowRight" ? 1 : -1), { scroll: false });
      $(`[data-step="${step}"]`, route)?.focus();
    });

    // first paint: the bench is set, the cake is built when it comes into view
    root.style.setProperty("--pan", step);
    root.style.setProperty("--wash", STEPS[step].wash || washCream());
    bill.classList.toggle("is-torn", step === 4);
    $("[data-cut]", root)?.setAttribute("aria-pressed", String(cut));
    paintPane(0, true);
    paintRoute();
    draw();
    paintMoney(false);
    lastTiers = tiersFor(st.size).length;
    if (!reduce && "IntersectionObserver" in window) {
      cakeHost.style.opacity = "0";
      pane.classList.add("is-wait");
      const io = new IntersectionObserver((ents) => {
        if (!ents.some((x) => x.isIntersecting)) return;
        io.disconnect();
        cakeHost.style.opacity = "";
        draw({ drop: true, fall: new Set(st.toppings) });
        pane.classList.remove("is-wait");
        pane.classList.add("is-enter");
        if (!cut) setTimeout(() => { if (!dragging) { vel = 0.24; kick(); } }, 2100);
      }, { threshold: 0.35 });
      io.observe(turn);
    }
    // under the glass cloche on the shelf: one of the real cakes from the catalogue (the shelf only shows on wide screens)
    const cloche = $("[data-mk-cloche]", root);
    if (cloche && matchMedia("(min-width: 1200px)").matches) Promise.resolve(M().ready).then(() => {
      const CROPPED = ["berries", "slice", "strawslice", "tiramisu", "meringue"];
      const whole = (M().cakes || []).filter((c) => M().cutout && M().cutout(c) && (c.cutout || !CROPPED.includes(c.img)));
      const c = whole[Math.floor(Math.random() * whole.length)];
      if (!c) return;
      const img = new Image();
      img.className = "mk-cloche__cake";
      img.alt = "";
      img.decoding = "async";
      img.onload = () => requestAnimationFrame(() => cloche.classList.add("is-in"));
      img.src = M().cutout(c);
      $(".mk-cloche__glass", cloche).before(img);
    });
    // a link from another page with a design in it: go straight to the bench
    if (["size", "flavor", "step", "decor", "color"].some((k) => params.has(k))) {
      touched = true;
      requestAnimationFrame(() => setTimeout(() => {
        const y = root.getBoundingClientRect().top + scrollY;
        window.MaridayLenis ? MaridayLenis.scrollTo(y, { immediate: true }) : scrollTo(0, y);
      }, 60));
    }

    return { apply, random: () => apply(randomDesign(), { scroll: true }), price: (s) => {
      const size = sizes.find((x) => x.id === s.size) || sizes[0];
      return Math.round(CTOR.base * size.priceMult) + CTOR.coats[s.coat].add + CTOR.decor[s.decor].add + s.toppings.reduce((a, t) => a + CTOR.toppings[t].add, 0);
    } };
  }

  /* ═════════════ ① the house recipes, pegged on a party garland ═════════════ */
  function recipes(shop) {
    const host = $("[data-mk-line]");
    if (!host || !shop) return;
    const inner = $(".mk-line__in", host);
    const rope = $(".mk-line__rope", host);
    const list = CTOR.presets.filter((p) => M().flavors.some((f) => f.id === p.st.flavor));
    const sizeOf = (st) => M().sizes.find((s) => s.id === st.size) || M().sizes[0];
    // every card is a different bit of paper: scalloped, torn, arched, stitched
    const cards = list.map((p, i) => `
      <button type="button" class="mk-card mk-card--v${i % 4}" data-preset="${i}" style="--i:${i}">
        <span class="mk-card__swing">
          <span class="mk-card__peg" aria-hidden="true"></span>
          <span class="mk-card__paper">
            <span class="mk-card__no" aria-hidden="true">№${String(i + 1).padStart(2, "0")}</span>
            <span class="mk-card__cake" aria-hidden="true">${cakeSVG(p.st, { rot: 0.3 })}</span>
            <span class="mk-card__name">${esc(p.name)}</span>
            <span class="mk-card__serves">${esc(sizeOf(p.st).label)} · ${esc(sizeOf(p.st).serves)}</span>
          </span>
          <span class="mk-card__tag"><b>≈ ${eur(shop.price(p.st))}</b></span>
        </span>
      </button>`);
    cards.push(`
      <button type="button" class="mk-card mk-card--q" data-surprise style="--i:${list.length}">
        <span class="mk-card__swing">
          <span class="mk-card__peg" aria-hidden="true"></span>
          <span class="mk-card__paper">
            <span class="mk-card__q" aria-hidden="true">?<i>✦</i><i>✦</i><i>✦</i></span>
            <span class="mk-card__name">Навмання</span>
            <span class="mk-card__serves">торт-сюрприз</span>
          </span>
          <span class="mk-card__tag"><b>тиць!</b></span>
        </span>
      </button>`);
    inner.innerHTML = cards.join("");
    const els = $$(".mk-card", inner);
    const sw = els.map(() => ({ a: 0, v: 0 }));

    // sprinkles scattered over the wall behind the title
    const spr = $("[data-mk-sprinkles]");
    if (spr) {
      const r = rng(11);
      const tones = ["#f5bcc8", "#c2263f", "#fbe6b8", "#9ed9b8", "#bcd6f3", "#e2849a", "#fffaf3"];
      spr.innerHTML = Array.from({ length: 30 }, (_, k) => {
        // mostly to the right of the title and in the gap under it
        const x = k < 20 ? 44 + r() * 54 : r() * 100;
        const y = k < 20 ? 4 + r() * 50 : 30 + r() * 26;
        return `<i class="${r() < 0.25 ? "is-dot" : ""}" style="left:${f1(x)}%;top:${f1(y)}%;--r:${Math.round(r() * 180)}deg;--c:${tones[k % tones.length]};--t:${f1(5 + r() * 5)}s;--d:${f1(r() * -8)}s"></i>`;
      }).join("");
    }

    // the cake on a card turns while the pointer is on it
    if (fine && !reduce) els.forEach((el, i) => {
      if (!list[i]) return;
      const box = $(".mk-card__cake", el);
      let rot = 0.3, on = false;
      const spin = () => {
        if (!on) return;
        rot += 0.045;
        box.innerHTML = cakeSVG(list[i].st, { rot });
        requestAnimationFrame(spin);
      };
      el.addEventListener("pointerenter", () => { if (!on) { on = true; requestAnimationFrame(spin); } });
      el.addEventListener("pointerleave", () => (on = false));
    });

    // the cards hang where the string sags; pennants and little bulbs fill the string between them
    const FLAGS = ["#f5bcc8", "#fffaf3", "#c2263f", "#fbe6b8", "#9ed9b8"];
    function layout() {
      const W = Math.max(host.clientWidth, inner.scrollWidth);
      const sag = Math.min(70, W * 0.045);
      const y0 = 14;
      const H = Math.round(y0 + sag * 2 + 60);
      rope.setAttribute("viewBox", `0 0 ${W} ${H}`);
      rope.style.width = W + "px";
      rope.style.height = H + "px";
      const yAt = (x) => y0 + 4 * sag * (x / W) * (1 - x / W);
      const spans = els.map((el) => {
        const x = el.offsetLeft + el.offsetWidth / 2;
        const u = x / W;
        el.style.setProperty("--drop", f1(yAt(x) - 8) + "px");
        el.style.setProperty("--lean", f1((0.5 - u) * -10) + "deg");
        return [el.offsetLeft - 6, el.offsetLeft + el.offsetWidth + 6];
      });
      let deco = "";
      for (let x = 16, k = 0; x < W - 8; x += 21) {
        if (spans.some(([a, b]) => x > a && x < b)) continue;
        const y = yAt(x);
        const ang = (Math.atan2(4 * sag * (1 - (2 * x) / W), W) * 180) / Math.PI;
        if (k % 2 === 0) {
          const c = FLAGS[(k / 2) % FLAGS.length];
          deco += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})"><path class="mk-line__flag" style="--d:${f1(-k * 0.37)}s" d="M-11 0 H11 L0 26 Z" fill="${c}"/></g>`;
        } else {
          deco += `<g transform="translate(${f1(x)} ${f1(y)})"><rect x="-2.5" y="0" width="5" height="5" rx="1" fill="#6d0809"/><ellipse class="mk-line__bulb" style="--d:${f1(-k * 0.53)}s" cx="0" cy="10" rx="4" ry="5.5"/></g>`;
        }
        k++;
      }
      rope.innerHTML = `<path d="M0,${y0} Q${W / 2},${y0 + sag * 2} ${W},${y0}"/>${deco}`;
    }
    layout();
    addEventListener("resize", layout);
    document.fonts?.ready.then(layout);

    // springy swinging: a gentle breeze, a push from the pointer passing by, a big swing on a tap
    let running = false, t0 = performance.now(), px = null, pvx = 0;
    function tick(now) {
      const t = (now - t0) / 1000;
      els.forEach((el, i) => {
        const s = sw[i];
        const breeze = Math.sin(t * 1.1 + i * 1.7) * 0.6;
        s.v += (breeze - s.a) * 0.035 - s.v * 0.06;
        s.a += s.v;
        el.style.setProperty("--sw", f1(s.a) + "deg");
      });
      if (running) requestAnimationFrame(tick);
    }
    if (!reduce) {
      new IntersectionObserver((ents) => {
        const vis = ents.some((x) => x.isIntersecting);
        if (vis && !running) { running = true; requestAnimationFrame(tick); }
        else if (!vis) running = false;
      }).observe(host);
      if (fine) host.addEventListener("pointermove", (e) => {
        if (px !== null) pvx = e.clientX - px;
        px = e.clientX;
        els.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const d = Math.abs(e.clientX - (r.left + r.width / 2));
          if (d < r.width * 0.6 && e.clientY > r.top - 30 && e.clientY < r.bottom) sw[i].v += Math.max(-1.4, Math.min(1.4, pvx * 0.05));
        });
      });
      host.addEventListener("pointerleave", () => (px = null));
    }

    host.addEventListener("click", (e) => {
      const card = e.target.closest(".mk-card");
      if (!card) return;
      const i = els.indexOf(card);
      if (i >= 0) sw[i].v += 7;
      els.forEach((el) => el.classList.toggle("is-on", el === card && !card.hasAttribute("data-surprise")));
      if (card.hasAttribute("data-surprise")) return shop.random();
      shop.apply(list[+card.dataset.preset].st, { scroll: true });
    });
  }

  /* ═════════════ ③ what happens next: tickets slide along the rail ═════════════ */
  function rail() {
    const host = $("[data-mk-rail]");
    if (!host) return;
    const tickets = $$(".mk-tk", host);
    const swing = (el, v) => {
      if (reduce || !el.animate) return;
      el.animate([{ rotate: "0deg" }, { rotate: `${v}deg` }, { rotate: `${-v * 0.55}deg` }, { rotate: `${v * 0.25}deg` }, { rotate: "0deg" }], { duration: 1300, easing: "ease-out", composite: "add" });
    };
    if (fine) tickets.forEach((el) => el.addEventListener("pointerenter", () => swing($(".mk-tk__paper", el), 6)));
    const g = gs();
    if (!g || !window.ScrollTrigger) return;
    g.set(tickets, { x: () => innerWidth * 0.9, rotation: 18 });
    ScrollTrigger.create({
      trigger: host,
      start: "top 78%",
      once: true,
      onEnter: () => g.to(tickets, { x: 0, rotation: 0, duration: 1.2, ease: "back.out(1.1)", stagger: 0.16, onComplete: () => g.set(tickets, { clearProps: "transform" }) }),
    });
  }

  /* ═════════════ ④ the finish: a shell border piped along the top of the footer, cherries on top ═════════════ */
  function outro() {
    const host = $("[data-mk-outro]");
    if (!host) return;
    const svg = $(".mk-outro__shells", host);
    // one shell: a puffy head pointing right, its tail tucked under the shell before it
    const shell = (x, y, k) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k})">
      <path d="M-38 8 C-26 8 -18 -14 -2 -14 C12 -14 18 -2 14 7 C10 15 -6 15 -20 12 C-28 10 -34 9 -38 8 Z" fill="url(#mkShellG)" stroke="rgba(109,8,9,.2)" stroke-width="1.2"/>
      <path d="M-30 8 C-16 6 -8 -6 8 -8 M-26 10 C-12 9 -2 3 14 2 M-32 7 C-20 2 -12 -11 0 -13" fill="none" stroke="#ead3c3" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M-8 -9 C-2 -12 4 -11 8 -9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></g>`;
    function build() {
      const H = svg.clientHeight || 60;
      const W = (host.clientWidth * 60) / H;
      const r = rng(5);
      const step = 34;
      let out = "";
      // drawn right to left, so every head sits over the next one's tail
      for (let x = Math.ceil(W / step + 1) * step; x > -step; x -= step) out += shell(x + r() * 2, 30 + (r() - 0.5) * 2.4, 0.94 + r() * 0.12);
      svg.setAttribute("viewBox", `0 0 ${f1(W)} 60`);
      svg.innerHTML = `<defs><linearGradient id="mkShellG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fffdf9"/><stop offset="1" stop-color="#f4e3d6"/></linearGradient></defs>${out}`;
    }
    build();
    addEventListener("resize", build);
    if (reduce || !("IntersectionObserver" in window)) return host.classList.add("is-in", "is-done");
    host.classList.add("is-armed");
    const io = new IntersectionObserver((ents) => {
      if (!ents.some((x) => x.isIntersecting)) return;
      io.disconnect();
      host.classList.add("is-in");
      setTimeout(() => host.classList.add("is-done"), 2700);
    }, { threshold: 0.6 });
    io.observe(host);
  }

  // the title of a section: letters jump in, the script is piped across when it comes into view
  function headings() {
    $$("[data-mk-split]").forEach((el) => {
      const w = el.textContent;
      el.innerHTML = [...w].map((ch, i) => `<span class="mk-ch" style="--i:${i};--cr:${i % 2 ? 12 : -12}deg">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
    });
    const hs = $$(".mk-h2");
    if (reduce || !("IntersectionObserver" in window)) return hs.forEach((h) => h.classList.add("is-in"));
    document.documentElement.classList.add("mk-js");
    const io = new IntersectionObserver((ents) => ents.forEach((x) => {
      if (!x.isIntersecting) return;
      x.target.classList.add("is-in");
      io.unobserve(x.target);
    }), { threshold: 0.4 });
    hs.forEach((h) => io.observe(h));
  }

  MARIDAY.onReady(() => {
    const shop = workshop();
    recipes(shop);
    rail();
    outro();
    headings();
  });
})();
