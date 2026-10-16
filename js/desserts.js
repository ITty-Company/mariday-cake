/* Mariday — the desserts page as a candy bar (pages/desserts.html, css/desserts.css).
   ① the sweet machine: a glass globe full of real desserts; turn the crank and a capsule rolls out with one inside
   ② pick & mix: candy-wrapper tabs, desserts on paper doilies; «+» flies the dessert onto the silver tray below
   ③ how many guests: the cherry slider fills the party table, the envelope with the right candy bar opens
   ④ the palette: a fan of paint chips, a roller repaints the backdrop and the whole section follows
   ⑤ the countdown: a tear-off calendar that loses a page as you scroll
   ⑥ the wheel of the year: turn it and the season under the cherry tells its flavours
   Works without GSAP; with reduced motion everything is simply shown. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const M = () => window.MARIDAY;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const esc = (s) => window.escapeHTML(String(s ?? ""));
  const eur = (n) => (window.formatEUR ? formatEUR(n) : `€${n}`);
  const T = (ms) => (reduce ? 0 : ms);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const replay = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many);

  /* ───────── the desserts and their cut-outs ───────── */
  // real cut-outs for the desserts of the menu; one added in the admin panel without its own is shown as a round photo
  const CUT = {
    "macaron-set": "candy-mac", "cupcakes-6": "ds-cupcake", "unicorn-cupcakes": "candy-cup",
    "oreo-cupcakes": "ds-blackoreo", "red-velvet-cupcakes": "ds-redvelvet", "cherry-cupcakes": "cherrycup", "donuts-6": "ds-donut1",
    "brownie-box": "ds-brownie", "cookie-box": "ds-cookie", "tiramisu-box": "gl-tiramisu", "trifle-set": "gl-slice",
  };
  const file = (name) => `../img/cutouts/${name}.webp`;
  const cut = (d) => (d.cutout && M().cutout ? M().cutout(d) : CUT[d.id] ? file(CUT[d.id]) : "");
  const shelf = () => M().desserts.filter((d) => d.cat !== "candybar");
  const packs = () => M().desserts.filter((d) => d.cat === "candybar").sort((a, b) => a.price - b.price);
  // little ones for the globe and the party table, beyond the menu's own
  const EXTRA = ["ds-donut3", "ds-donut5", "ds-choccup", "ds-mint", "ds-vanilla"].map(file);
  const pic = (d, cls = "") => {
    const c = cut(d);
    return `<img class="${cls}${c ? "" : " is-photo"}" src="${esc(c || d.image)}" alt="" draggable="false" loading="lazy">`;
  };

  /* ───────── section headings: glazed letters jump in, the script word is piped after them ───────── */
  function splitInto(el, text) {
    el.textContent = "";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "ds-ch";
      s.style.setProperty("--i", i);
      s.style.setProperty("--cr", `${i % 2 ? 12 : -12}deg`);
      s.textContent = ch === " " ? " " : ch;
      el.appendChild(s);
    });
  }
  function headings() {
    const hs = $$(".ds-h2");
    hs.forEach((h) => { const w = $("[data-ds-split]", h); if (w) splitInto(w, w.textContent); });
    if (reduce || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("ds-js");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    }), { threshold: 0.3 });
    hs.forEach((h) => io.observe(h));
  }

  function totals() {
    const list = shelf();
    if (!list.length) return;
    const c = $("[data-ds-count]");
    if (c) c.textContent = list.length;
    const m = $("[data-ds-min]");
    if (m) m.textContent = `від €${Math.min(...list.map((d) => d.price))}`;
  }

  /* ───────── the tray: what you've picked, riding at the bottom of the screen ───────── */
  const sel = {};
  const tray = (() => {
    const el = $("#ds-tray");
    if (!el) return { add() {}, paint() {} };
    const pile = $("[data-tray-pile]", el);
    const order = []; // the ids in the order they landed, so the newest sits on top
    const items = () => Object.entries(sel).filter(([, q]) => q > 0).map(([id, q]) => [M().desserts.find((d) => d.id === id), q]).filter(([d]) => d);

    function paint(landed) {
      const list = items();
      const n = list.reduce((s, [, q]) => s + q, 0);
      const total = list.reduce((s, [d, q]) => s + d.price * q, 0);
      el.classList.toggle("is-on", n > 0);
      el.setAttribute("aria-hidden", String(n === 0));
      $("[data-tray-n]", el).textContent = `${n} ${plural(n, "десерт", "десерти", "десертів")}`;
      $("[data-tray-total]", el).textContent = eur(total);
      // one little dessert per piece picked (up to nine), the last one landed in front
      const pieces = [];
      order.forEach((id) => { for (let k = 0; k < (sel[id] || 0); k++) pieces.push(id); });
      const shown = pieces.slice(-9);
      pile.innerHTML = shown.map((id, i) => {
        const d = M().desserts.find((x) => x.id === id);
        const last = landed && i === shown.length - 1;
        return `<span class="ds-tray__it${last ? " is-land" : ""}" style="--i:${i};--r:${[-8, 6, -3, 9, -6, 4, -10, 7, -2][i % 9]}deg">${pic(d)}</span>`;
      }).join("");
    }

    // a copy of the dessert flies in an arc from the shelf onto the tray
    function add(d, from) {
      sel[d.id] = (sel[d.id] || 0) + 1;
      if (!order.includes(d.id)) order.push(d.id);
      const was = el.classList.contains("is-on");
      if (reduce || !from || !from.animate) return paint(true);
      const a = from.getBoundingClientRect();
      el.classList.add("is-on");
      // where the pile will be once the tray has slid up
      const ty = was ? 0 : new DOMMatrix(getComputedStyle(el).transform).m42;
      const b = pile.getBoundingClientRect();
      const ghost = document.createElement("img");
      ghost.className = "ds-fly" + (cut(d) ? "" : " is-photo");
      ghost.src = cut(d) || d.image;
      ghost.alt = "";
      const w = Math.min(a.width, 160);
      Object.assign(ghost.style, { width: `${w}px`, left: `${a.left + a.width / 2 - w / 2}px`, top: `${a.top + a.height / 2 - w / 2}px` });
      document.body.appendChild(ghost);
      const dx = b.left + Math.min(b.width, 40 + Math.min(8, Object.values(sel).reduce((s, q) => s + q, 0)) * 22) - (a.left + a.width / 2);
      const dy = b.top - ty + b.height / 2 - (a.top + a.height / 2);
      const s = 52 / w;
      ghost.animate([
        { transform: "translate(0, 0) scale(1) rotate(0deg)" },
        { transform: `translate(${dx * 0.5}px, ${Math.min(0, dy) - 160}px) scale(${(1 + s) / 2}) rotate(-14deg)`, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(6deg)` },
      ], { duration: 820, easing: "cubic-bezier(0.45, 0, 0.3, 1)" }).onfinish = () => { ghost.remove(); paint(true); };
      if (!was) paint(false);
    }

    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-tray-clear]")) {
        Object.keys(sel).forEach((k) => delete sel[k]);
        order.length = 0;
        paint(false);
        document.dispatchEvent(new CustomEvent("ds:sel"));
        return;
      }
      const go = e.target.closest("[data-tray-add]");
      if (!go) return;
      const list = items();
      if (!list.length) return;
      list.forEach(([d, q]) => MaridayCart.add({ id: d.id, name: d.name, price: d.price, qty: q, image: d.image, dessert: true, meta: d.unit }));
      window.flyToCart?.(go, cut(list[0][0]) || list[0][0].image);
      window.showToast?.("Солодкий стіл у кошику!", { label: "Відкрити", run: () => window.openCartDrawer?.() });
      Object.keys(sel).forEach((k) => delete sel[k]);
      order.length = 0;
      paint(false);
      document.dispatchEvent(new CustomEvent("ds:sel"));
    });
    const drop = (id) => {
      sel[id] = Math.max(0, (sel[id] || 0) - 1);
      if (!sel[id]) order.splice(order.indexOf(id), 1);
      paint(false);
    };
    return { add, drop, paint };
  })();

  /* ───────── ① the sweet machine ───────── */
  // the heap inside the globe: [x, y, width] in % of the globe, front rows lower
  const HEAP = [
    [47, 22, 20], [30, 33, 21], [64, 31, 22], [18, 49, 22], [44, 44, 23], [72, 47, 23],
    [30, 60, 24], [56, 59, 25], [84, 63, 18], [14, 70, 21], [40, 76, 25], [66, 76, 25], [86, 80, 16], [22, 86, 20],
  ];
  function machine() {
    const box = $("[data-ds-machine]");
    if (!box) return;
    const pile = $("[data-ds-pile]", box);
    const ball = $("[data-ds-ball]", box);
    const ballImg = $("img", ball);
    const prize = $("[data-ds-prize]", box);
    const menu = shelf();
    const srcs = [...menu.map(cut).filter(Boolean), ...EXTRA];
    pile.innerHTML = HEAP.map(([x, y, w], i) =>
      `<img src="${esc(srcs[(i * 5) % srcs.length])}" alt="" draggable="false" style="--x:${x};--y:${y};--w:${w};--r:${[-14, 10, -6, 18, -20, 8, -4, 14, -12, 22, -8, 6, -16, 12][i]}deg;--jd:${(i % 5) * -0.13}s;z-index:${Math.round(y)}">`).join("");

    let bag = [];
    let last = "";
    const next = () => {
      if (!bag.length) bag = menu.map((d) => d.id).sort(() => Math.random() - 0.5);
      let id = bag.pop();
      if (id === last && bag.length) id = bag.pop();
      last = id;
      return M().desserts.find((d) => d.id === id);
    };
    let busy = false;
    let out = null;
    const show = (d) => {
      out = d;
      $("[data-ds-prize-name]", prize).textContent = d.name;
      $("[data-ds-prize-price]", prize).textContent = eur(d.price);
      $("[data-ds-prize-unit]", prize).textContent = d.unit || "";
      $("[data-ds-add]", prize).dataset.dsAdd = d.id;
      prize.hidden = false;
      replay(prize, "is-in");
    };
    const spin = () => {
      if (busy || !menu.length) return;
      busy = true;
      const go = () => {
        box.classList.remove("is-drop", "is-open", "is-clear");
        const d = next();
        ballImg.src = cut(d) || d.image;
        ballImg.classList.toggle("is-photo", !cut(d));
        ball.style.setProperty("--bc", ["#f5bcc8", "#fbe6b8", "#bcd6f3", "#e9c6f0", "#cdeae6"][Math.floor(Math.random() * 5)]);
        replay(box, "is-turn");
        setTimeout(() => replay(box, "is-drop"), T(820));
        setTimeout(() => {
          box.classList.add("is-open");
          show(d);
          busy = false;
        }, T(1850));
      };
      if (box.classList.contains("is-open")) {
        box.classList.add("is-clear");
        prize.classList.remove("is-in");
        setTimeout(() => { prize.hidden = true; go(); }, T(320));
      } else go();
    };
    box.addEventListener("click", (e) => {
      if (e.target.closest("[data-ds-crank]")) return spin();
      const add = e.target.closest("[data-ds-add]");
      if (add && out) {
        tray.add(out, $(".ds-ball__pic", ball));
        document.dispatchEvent(new CustomEvent("ds:sel"));
        replay(add, "is-pop");
      }
    });
    // the first capsule rolls out on its own, so the machine shows what it does
    if (reduce) {
      const d = next();
      ballImg.src = cut(d) || d.image;
      box.classList.add("is-drop", "is-open");
      show(d);
    } else setTimeout(spin, 900);
  }

  /* ───────── ② pick & mix ───────── */
  const TINTS = ["#fde3ea", "#fff1d6", "#e2f3f0", "#efe4f8", "#e3edf9", "#ffe9dc"];
  const WRAPS = [["#f5bcc8", "#e2849a"], ["#fbe6b8", "#e3b85c"], ["#cdeae6", "#7fc3b9"], ["#e9d3f3", "#b58ac9"], ["#c9dcf3", "#7ea8de"]];
  function cardHTML(d, i) {
    const q = sel[d.id] || 0;
    return `
      <article class="ds-card${q ? " is-picked" : ""}" data-id="${esc(d.id)}" style="--c:${TINTS[i % TINTS.length]};--fr:${[-10, 8, -6, 12, -8, 6][i % 6]}deg;--dl:${(i % 4) * 0.07}s">
        <div class="ds-card__plate">
          <span class="ds-card__doily" aria-hidden="true"></span>
          <span class="ds-card__pic"><span class="ds-card__hop">${pic(d)}</span></span>
          <span class="ds-card__flag" aria-hidden="true"><i>${eur(d.price)}</i></span>
          <span class="ds-card__n" data-n aria-hidden="true">${q}</span>
        </div>
        <div class="ds-card__body">
          <h3>${esc(d.name)}</h3>
          <p class="ds-card__unit">${esc(d.unit || "")}</p>
          <p class="ds-card__desc">${esc(d.desc || "")}</p>
          <div class="ds-card__row">
            <b class="ds-card__price">${eur(d.price)}</b>
            <div class="ds-qty">
              <button type="button" data-dq="-" aria-label="Прибрати: ${esc(d.name)}"${q ? "" : " disabled"}>−</button>
              <span data-q aria-live="polite">${q}</span>
              <button type="button" class="ds-plus" data-dq="+" aria-label="На піднос: ${esc(d.name)}">+</button>
            </div>
          </div>
        </div>
      </article>`;
  }
  function menu() {
    const grid = $("#ds-grid");
    const wraps = $("#ds-wraps");
    if (!grid || !wraps) return;
    const cats = M().dessertCats.filter((c) => c.id !== "candybar");
    const inCat = (d, id) => id === "all" || d.cat === id;
    let active = "all";

    wraps.innerHTML = cats.map((c, i) => {
      const n = shelf().filter((d) => inCat(d, c.id)).length;
      const [a, b] = WRAPS[i % WRAPS.length];
      return `<button type="button" class="ds-wrap" data-cat="${esc(c.id)}" aria-pressed="false" style="--a:${a};--b:${b};--r:${[-3, 2, -2, 3, -1][i % 5]}deg"><span class="ds-wrap__end" aria-hidden="true"></span><span class="ds-wrap__mid">${esc(c.label)}<sup>${n}</sup></span><span class="ds-wrap__end" aria-hidden="true"></span></button>`;
    }).join("");

    // cards pop off their doilies as the shelf scrolls into view
    const live = !reduce && "IntersectionObserver" in window;
    let io = null;
    if (live) {
      grid.classList.add("is-js");
      io = new IntersectionObserver((es) => {
        es.filter((e) => e.isIntersecting).forEach((e) => { e.target.classList.add("is-in"); io.unobserve(e.target); });
      }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
    }
    const paint = (animate) => {
      $$("[data-cat]", wraps).forEach((b) => {
        const on = b.dataset.cat === active;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      grid.innerHTML = shelf().filter((d) => inCat(d, active)).map(cardHTML).join("");
      $$(".ds-card", grid).forEach((c) => {
        if (!live) return;
        if (animate) c.classList.add("is-in");
        else io.observe(c);
      });
      MaridayMotion?.refresh?.();
    };
    wraps.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b || b.dataset.cat === active) return;
      active = b.dataset.cat;
      replay(b, "is-twist");
      paint(true);
    });
    const sync = (card) => {
      const q = sel[card.dataset.id] || 0;
      $("[data-q]", card).textContent = q;
      $("[data-n]", card).textContent = q;
      $("[data-dq='-']", card).disabled = !q;
      card.classList.toggle("is-picked", q > 0);
    };
    grid.addEventListener("click", (e) => {
      const b = e.target.closest("[data-dq]");
      if (!b) return;
      const card = b.closest(".ds-card");
      const d = M().desserts.find((x) => x.id === card.dataset.id);
      if (!d) return;
      if (b.dataset.dq === "+") {
        if ((sel[d.id] || 0) >= 20) return;
        tray.add(d, $(".ds-card__pic img", card));
        replay($(".ds-card__hop", card), "is-hop");
        replay($("[data-n]", card), "is-bump");
      } else tray.drop(d.id);
      sync(card);
    });
    document.addEventListener("ds:sel", () => $$(".ds-card", grid).forEach(sync));
    paint(false);
  }

  /* ───────── ③ how many guests ───────── */
  const TICKS = {
    "candy-bar-s": ["Капкейки, макарони й міні-трайфли", "≈ 3 десерти на кожного гостя", "Кольори крему під вашу палітру", "Пакування для самовивозу"],
    "candy-bar-m": ["Асорті з 4–5 видів десертів", "Брауні або печиво на вибір", "Топери й таблички з вашим написом", "Декор і кольори під тему свята"],
    "candy-bar-l": ["Торт-акцент у центрі столу", "Капкейки, макарони, трайфли, брауні", "Донати чи печиво з посипкою", "Оформлення столу та сетап на місці*"],
  };
  const STAMPS = ["candy-mac", "candy-cup", "candy-cake"];
  const ENV = [["#fde3ea", "#f5bcc8"], ["#fff1d6", "#f3d48a"], ["#e2f3f0", "#a9d8d1"]];
  // what lands on the table for each candy bar, as shares of the desserts (the accent cake comes on top for L)
  const MENU = {
    S: [["cup", 0.4], ["mac", 0.4], ["tri", 0.2]],
    M: [["cup", 0.3], ["mac", 0.3], ["bro", 0.2], ["tri", 0.2]],
    L: [["cup", 0.3], ["mac", 0.25], ["bro", 0.15], ["tri", 0.15], ["coo", 0.15]],
  };
  const KINDS = { cup: ["Капкейки", "ds-cupcake"], mac: ["Макарони", "candy-mac"], bro: ["Брауні", "ds-brownie"], tri: ["Міні-трайфли", "gl-slice"], coo: ["Печиво", "ds-cookie"], cake: ["Торт-акцент", "candy-cake"] };
  const CUPS = ["ds-cupcake", "cherrycup", "candy-cup", "ds-redvelvet", "ds-mint", "ds-choccup", "ds-blackoreo"];
  const FRONT = ["ds-cupcake", "ds-brownie", "cherrycup", "candy-mac", "ds-redvelvet", "ds-mint", "ds-choccup", "ds-brownie", "candy-cup", "ds-blackoreo", "candy-mac", "ds-vanilla"];
  // macarons tinted to the party palette
  const MACF = ["none", "sepia(0.3) saturate(2.6) hue-rotate(-28deg)", "saturate(1.6) hue-rotate(60deg) brightness(1.04)", "sepia(0.2) saturate(2.2) hue-rotate(-40deg) brightness(0.96)"];
  // the balloon garland wraps the round backdrop from the left foot over the top — closed at a full house
  const BALLOONS = (() => {
    const n = 30, out = [];
    const tone = ["var(--p1)", "#fff", "var(--p3)", "var(--butter, #fbe6b8)", "var(--p1)", "cherry", "#fff", "var(--p3)"];
    for (let k = 0; k < n; k++) {
      const a = ((205 - (k / (n - 1)) * 230) * Math.PI) / 180;
      const r = 50 + ((k * 7) % 3 - 1) * 3.2;
      const big = 13 + ((k * 5) % 4) * 1.6;
      const t = Math.max(0, (k - 3) / (n - 4));
      out.push({ x: 50 + r * Math.cos(a), y: 50 - r * Math.sin(a), s: big, c: tone[k % tone.length], t });
      if (k % 2 === 0) {
        const a2 = a + 0.09, r2 = r + 7;
        out.push({ x: 50 + r2 * Math.cos(a2), y: 50 - r2 * Math.sin(a2), s: 6.5 + (k % 3), c: tone[(k + 3) % tone.length], t });
      }
    }
    return out;
  })();
  function guests() {
    const box = $("[data-ds-guests]");
    if (!box) return;
    const range = $("[data-g-range]", box);
    const nEl = $("[data-g-n]", box);
    const wordEl = $("[data-g-word]", box);
    const dEl = $("[data-g-d]", box);
    const table = $("[data-g-table]", box);
    const host = $("[data-ds-envs]");
    const list = packs();
    const span = (d) => { const m = String(d.unit || "").match(/(\d+)\D+(\d+)/); return m ? [+m[1], +m[2]] : [0, 999]; };

    const party = $("[data-g-party]", box);
    const listEl = $("[data-g-list]", box);
    const signEl = $("[data-g-sign]", box);
    const letterOf = (d) => (d.name.match(/\b([SML])$/) || [])[1] || "";
    // where M and L start on the slider (from the packs' guest ranges), so the table changes with the envelope
    const p0 = (g) => clamp((g - range.min) / (range.max - range.min), 0, 1);
    const hiOf = (L) => { const d = list.find((x) => letterOf(x) === L); return d ? span(d)[1] : 0; };
    const pM = hiOf("S") ? p0(hiOf("S") + 1) : 0.12;
    const pL = hiOf("M") ? p0(hiOf("M") + 1) : 0.42;

    // the table, from the back: two cake stands, the macaron tower (the accent cake takes its place for L),
    // two little stands at the ends, then a front row filling from the middle outwards
    const img = (n, cls = "") => `<img class="${cls}" src="${esc(file(n))}" alt="" draggable="false">`;
    const step = (a, b, i, n) => (a + ((b - a) * i) / Math.max(1, n - 1)).toFixed(3);
    const stand = (x, side) => {
      const lo = [20, 50, 80].map((sx, i) => `<i class="ds-on" data-t="${step(pM + 0.03, pM + 0.14, i, 3)}" style="--x:${sx};--y:23;--w:31;z-index:${i === 1 ? 3 : 2}">${img(CUPS[(i + side * 2) % CUPS.length])}</i>`).join("");
      const up = [34, 66].map((sx, i) => `<i class="ds-on" data-t="${step(pM + 0.16, pM + 0.24, i, 2)}" style="--x:${sx};--y:65;--w:27;z-index:2">${img(CUPS[(i + 3 + side * 2) % CUPS.length])}</i>`).join("");
      return `<span class="ds-stand ds-on" data-t="${pM.toFixed(3)}" style="--x:${x};--y:30;--w:15;z-index:12"><span class="ds-stand__glass"></span>${lo}${up}</span>`;
    };
    const tower = (() => {
      const rows = [4, 3, 2, 1];
      let j = 0;
      const macs = rows.map((n, r) => Array.from({ length: n }, (_, k) => {
        const t = Math.max(0, j - 3) * (pM / 7);
        const html = `<i class="ds-on" data-t="${t.toFixed(3)}" style="--x:${50 + (k - (n - 1) / 2) * 24};--y:${r * 17};--w:27;--f:${MACF[(j * 3 + r) % MACF.length]};z-index:${r + 1}">${img("candy-mac")}</i>`;
        j++;
        return html;
      }).join("")).join("");
      return `<span class="ds-mtower ds-on" data-t="0" data-t2="${pL.toFixed(3)}" style="--x:50;--y:30;--w:14;z-index:14">${macs}<i class="ds-mtower__top ds-on" data-t="${(pM * 0.95).toFixed(3)}"><img src="../img/cakes/cherries.png" alt="" draggable="false"></i></span>`;
    })();
    const ends = [[7, "gl-tiramisu", pL + 0.2], [93, "gl-strawslice", pL + 0.3]].map(([x, n, t]) =>
      `<span class="ds-stand ds-stand--one ds-on" data-t="${t.toFixed(3)}" style="--x:${x};--y:30;--w:11;z-index:11"><span class="ds-stand__glass"></span><i class="ds-on" data-t="${(t + 0.04).toFixed(3)}" style="--x:50;--y:30;--w:84;z-index:2">${img(n)}</i></span>`).join("");
    const front = Array.from({ length: 16 }, (_, k) => ({ x: 6 + (k / 15) * 88, k })).filter((s) => Math.abs(s.x - 50) > 5)
      .sort((a, b) => Math.abs(a.x - 50) - Math.abs(b.x - 50))
      .map((s, i) => `<i class="ds-on ds-front" data-t="${(Math.max(0, i - 3) / 11 * 0.96).toFixed(3)}" style="--x:${s.x.toFixed(1)};--y:25.5;--w:5.6;--r:${[-5, 4, -2, 6, -6, 3][s.k % 6]}deg;z-index:${40 + (s.k % 2)}">${img(FRONT[s.k % FRONT.length])}</i>`).join("");
    table.innerHTML = `${stand(25, 0)}${stand(75, 1)}${tower}
      <span class="ds-place ds-on" data-t="${pL.toFixed(3)}" style="--x:50;--y:29.5;--w:12.5;z-index:15">${img("candy-cake")}</span>
      ${ends}${front}`;
    const its = $$(".ds-on", table);
    const balloons = $("[data-g-balloons]", box);
    balloons.innerHTML = BALLOONS.map((b, i) => `<i class="ds-on${b.c === "cherry" ? " is-cherry" : ""}" data-t="${b.t.toFixed(3)}" style="--x:${b.x.toFixed(1)};--y:${b.y.toFixed(1)};--s:${b.s};--c:${b.c === "cherry" ? "var(--cherry)" : b.c};--bob:${(i % 5) * -0.7}s"><b></b></i>`).join("");
    const bs = $$(".ds-on", balloons);

    // the shopping list on the left: one line per dessert, the numbers follow the slider
    const ORDER = ["cup", "mac", "bro", "tri", "coo", "cake"];
    listEl.innerHTML = ORDER.map((k) => `<li data-k="${k}"><div><span class="ds-list__pic">${img(KINDS[k][1])}</span><span class="ds-list__name">${KINDS[k][0]}</span><b>0</b></div></li>`).join("");
    const rows = Object.fromEntries($$("li", listEl).map((li) => [li.dataset.k, li]));
    const fillList = (L, nd) => {
      const menu = MENU[L] || MENU.M;
      const counts = Object.fromEntries(menu.map(([k, s]) => [k, Math.round(nd * s)]));
      counts[menu[0][0]] += nd - Object.values(counts).reduce((a, b) => a + b, 0);
      if (L === "L") counts.cake = 1;
      ORDER.forEach((k) => {
        const li = rows[k];
        const on = k in counts;
        li.classList.toggle("is-on", on);
        if (!on) return;
        const b = $("b", li);
        const v = k === "cake" ? "1" : String(counts[k]);
        if (b.textContent !== v) { b.textContent = v; if (!reduce) replay(b, "is-tick"); }
      });
    };
    let lastL = "";

    // the envelopes, addressed by hand, a dessert stamp in the corner; the chosen one opens and its letter rises
    if (host && list.length) {
      host.innerHTML = `
        <div class="ds-letter" data-ds-letter aria-live="polite"></div>
        <div class="ds-envs__row">${list.map((d, i) => {
          const [a, b] = ENV[i % ENV.length];
          const [lo, hi] = span(d);
          const short = (d.name.match(/\b([SML])$/) || [])[1] || "";
          return `<button type="button" class="ds-env" data-pack="${esc(d.id)}" aria-pressed="false" style="--a:${a};--b:${b};--r:${[-3, 1.5, -1.5][i % 3]}deg">
            <span class="ds-env__back" aria-hidden="true"></span>
            <span class="ds-env__flap" aria-hidden="true"></span>
            <span class="ds-env__front">
              <span class="ds-env__stamp" aria-hidden="true"><img src="${esc(file(STAMPS[i % STAMPS.length]))}" alt=""></span>
              <span class="ds-env__post" aria-hidden="true">Alkmaar</span>
              <span class="ds-env__to">${esc(d.name)}</span>
              <span class="ds-env__addr">${lo && hi < 999 ? `${lo}–${hi} гостей` : esc(d.unit || "")} · ${eur(d.price)}</span>
            </span>
            <span class="ds-env__seal" aria-hidden="true">${esc(short || "✦")}</span>
          </button>`;
        }).join("")}</div>`;
    }
    const letter = host && $("[data-ds-letter]", host);
    let chosen = "";
    const open = (id, user) => {
      if (!letter || id === chosen) return;
      chosen = id;
      const d = list.find((x) => x.id === id);
      const [lo, hi] = span(d);
      const per = hi < 999 ? Math.round(d.price / ((lo + hi) / 2)) : 0;
      const short = (d.name.match(/\b([SML])$/) || [])[1] || "";
      const env = $(`[data-pack="${CSS.escape(id)}"]`, host);
      $$("[data-pack]", host).forEach((b) => {
        const on = b === env;
        b.classList.toggle("is-open", on);
        b.setAttribute("aria-pressed", String(on));
      });
      letter.innerHTML = `
        <p class="ds-letter__k">${esc(d.unit || "")}</p>
        <h3 class="ds-letter__t">${esc(d.name)}</h3>
        <p class="ds-letter__price"><b>${eur(d.price)}</b>${per ? `<small>≈ €${per} на гостя</small>` : ""}</p>
        <ul class="ds-letter__ticks">${(TICKS[d.id] || [d.desc]).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <button type="button" class="p-btn" data-ds-pack="${esc(d.id)}"><span>Обрати ${esc(short || d.name)} · ${eur(d.price)}</span></button>`;
      letter.style.setProperty("--c", env.style.getPropertyValue("--a"));
      // the letter slides up out of its envelope
      if (!reduce && letter.animate) {
        const a = env.getBoundingClientRect();
        const b = letter.getBoundingClientRect();
        const dx = a.left + a.width / 2 - (b.left + b.width / 2);
        const dy = a.top + a.height * 0.35 - (b.top + b.height / 2);
        letter.animate([
          { transform: `translate(${dx}px, ${dy}px) scale(${(a.width * 0.8) / b.width})`, opacity: 0 },
          { opacity: 1, offset: 0.25 },
          { transform: "none", opacity: 1 },
        ], { duration: user ? 750 : 650, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.15)" });
      }
    };


    const set = (g, user) => {
      const p = (g - range.min) / (range.max - range.min);
      box.style.setProperty("--p", p.toFixed(4));
      nEl.textContent = g;
      wordEl.textContent = plural(g, "гість", "гості", "гостей");
      const nd = Math.round(g * 3.5);
      dEl.textContent = nd;
      if (dEl.nextSibling) dEl.nextSibling.textContent = ` ${plural(nd, "десерт", "десерти", "десертів")} на стіл`;
      // everything whose moment has come pops on, one after another; what is past its moment (the tower for L) bows out
      let k = 0;
      [...its, ...bs].forEach((it) => {
        const t = +it.dataset.t, t2 = it.dataset.t2 ? +it.dataset.t2 : 2;
        const on = p >= t - 1e-4 && p < t2 - 1e-4;
        if (on === it.classList.contains("is-on")) return;
        it.style.setProperty("--dl", `${on ? Math.min(k++, 14) * 0.035 : 0}s`);
        it.classList.toggle("is-on", on);
      });
      const pack = list.length ? list.find((d) => span(d)[1] >= g) || list[list.length - 1] : null;
      const L = (pack && letterOf(pack)) || (p >= pL ? "L" : p >= pM ? "M" : "S");
      fillList(L, nd);
      if (L !== lastL) {
        signEl.textContent = `candy bar · ${L}`;
        if (lastL && !reduce) replay(signEl.parentNode, "is-swing");
        lastL = L;
      }
      // a full house: the garland closes and the confetti goes up
      const full = g >= +range.max;
      if (full && !party.classList.contains("is-full") && !reduce) replay(party, "is-full");
      else if (!full) party.classList.remove("is-full");
      if (pack) open(pack.id, user);
    };
    range.addEventListener("input", () => set(+range.value, true));
    host?.addEventListener("click", (e) => {
      const env = e.target.closest("[data-pack]");
      if (env) {
        const d = list.find((x) => x.id === env.dataset.pack);
        const [lo, hi] = span(d);
        // the slider follows the envelope you opened
        if (+range.value < lo || +range.value > hi) { range.value = Math.round((lo + Math.min(hi, +range.max)) / 2); set(+range.value, true); }
        else open(d.id, true);
        return;
      }
      const take = e.target.closest("[data-ds-pack]");
      if (!take) return;
      const d = list.find((x) => x.id === take.dataset.dsPack);
      if (!d) return;
      MaridayCart.add({ id: d.id, name: d.name, price: d.price, image: d.image, dessert: true, meta: d.unit });
      window.flyToCart?.(take, $(".ds-env.is-open .ds-env__stamp img", host)?.src);
      window.showToast?.(`${d.name} — у кошику!`, { label: "Відкрити", run: () => window.openCartDrawer?.() });
    });
    // the table fills up when it scrolls into view
    if (!reduce && "IntersectionObserver" in window) {
      set(10, false);
      const io = new IntersectionObserver((es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        set(+range.value, false);
      }, { threshold: 0.35 });
      io.observe(table);
    } else set(+range.value, false);
  }

  /* ───────── ④ the palette ───────── */
  const TREATS = [["ds-cupcake", 20, 0], ["candy-mac", 13, 1], ["cherrycup", 19, 0], ["ds-donut3", 13, 1], ["ds-redvelvet", 19, 0]];
  function palette() {
    const sec = $("[data-ds-paint]");
    if (!sec) return;
    const fan = $("[data-ds-fan]", sec);
    const chips = $$("[data-pal]", fan);
    const wall = $(".ds-scene__wall", sec);
    const coat = $("[data-ds-coat]", sec);
    const roller = $("[data-ds-roller]", sec);
    const treats = $("[data-ds-treats]", sec);
    const root = document.body;
    const colors = (b) => b.dataset.pal.split(",");
    chips.forEach((b, i) => {
      const [p1, , p3] = colors(b);
      b.style.setProperty("--a", p1);
      b.style.setProperty("--b", p3);
      b.style.setProperty("--k", i - (chips.length - 1) / 2);
    });
    // the table: real desserts and a macaron tower in the colours of the palette
    treats.innerHTML = TREATS.map(([n, w, low]) => `<img class="ds-scene__t${low ? " is-low" : ""}" src="${file(n)}" alt="" style="--w:${w}" loading="lazy">`).join("")
      .replace(/(<img[^>]+>)(<img[^>]+>)(<img[^>]+>)/, `$1$2<span class="ds-tower"><i></i><i></i><i></i><i></i><i></i><i></i></span>$3`);
    let current = colors(chips[0]);
    const apply = (c) => ["--p1", "--p2", "--p3", "--p4"].forEach((k, i) => root.style.setProperty(k, c[i]));
    apply(current);
    wall.style.background = current[1];
    let busy = 0;
    const pick = (b) => {
      const c = colors(b);
      chips.forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      $("[data-pal-name]", sec).textContent = $("b", b).textContent;
      $("[data-pal-note]", sec).textContent = b.dataset.note;
      apply(c);
      current = c;
      if (reduce || !coat.animate) { wall.style.background = c[1]; return; }
      // the roller rolls the new colour over the backdrop, left to right
      clearTimeout(busy);
      coat.style.background = c[1];
      roller.style.setProperty("--rc", c[2]);
      const opts = { duration: 950, easing: "cubic-bezier(0.55, 0, 0.35, 1)", fill: "forwards" };
      coat.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }], opts);
      roller.animate([{ left: "-6%", opacity: 1 }, { opacity: 1, offset: 0.85 }, { left: "100%", opacity: 0 }], opts);
      busy = setTimeout(() => {
        wall.style.background = c[1];
        coat.getAnimations().forEach((a) => a.cancel());
        roller.getAnimations().forEach((a) => a.cancel());
      }, 980);
    };
    fan.addEventListener("click", (e) => { const b = e.target.closest("[data-pal]"); if (b) pick(b); });
    fan.addEventListener("keydown", (e) => {
      const i = chips.indexOf(document.activeElement);
      if (i < 0 || !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
      e.preventDefault();
      const n = chips[(i + (/Right|Down/.test(e.key) ? 1 : chips.length - 1)) % chips.length];
      n.focus();
      pick(n);
    });
    // the fan spreads open when it scrolls into view
    if (!reduce && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { fan.classList.add("is-open"); io.disconnect(); } }, { threshold: 0.5 });
      io.observe(fan);
    } else fan.classList.add("is-open");
  }

  /* ───────── ⑤ the countdown calendar: scroll tears the pages off ───────── */
  // every torn page flies over to the clothesline under the heading and stays pegged there,
  // so by the party the line holds the whole story; the room glows in the colour of the page on top
  function calendar() {
    const sec = $("[data-ds-cal]");
    if (!sec || reduce) return;
    const pages = $$(".ds-page", sec);
    sec.style.setProperty("--n", pages.length);
    sec.classList.add("is-js");
    pages.forEach((p, i) => (p.style.zIndex = pages.length - i));

    const line = document.createElement("div");
    line.className = "ds-line";
    line.setAttribute("aria-hidden", "true");
    line.innerHTML = `<svg viewBox="0 0 100 48" preserveAspectRatio="none"><path d="M0 2 Q50 46 100 2"/></svg>` +
      pages.map((pg, i) => {
        const x = (i + 0.6) / (pages.length + 0.2);
        return `<span class="ds-line__p" style="--c:${pg.style.getPropertyValue("--c")};--x:${x.toFixed(3)};--k:${i}"><b>${esc($(".ds-page__big", pg).textContent)}</b><small>${esc($("h3", pg).textContent)}</small></span>`;
      }).join("");
    $(".ds-cal__copy", sec).append(line);
    const minis = $$(".ds-line__p", line);

    const run = () => {
      const r = sec.getBoundingClientRect();
      const len = sec.offsetHeight - innerHeight;
      const p = len > 0 ? clamp(-r.top / len, 0, 1) * (pages.length + 0.3) : 0;
      let top = pages.length;
      pages.forEach((pg, i) => {
        const t = clamp((p - i - 0.25) / 0.75, 0, 1);
        pg.style.setProperty("--t", t.toFixed(3));
        minis[i].classList.toggle("is-hung", t > 0.9);
        if (t < 0.5 && top === pages.length) top = i;
      });
      sec.style.setProperty("--glow", top < pages.length ? pages[top].style.getPropertyValue("--c") : "#f5bcc8");
      sec.classList.toggle("is-done", p > pages.length);
    };
    track(sec, run);
  }

  // one scroll loop for everything that follows the scroll, only while it is near the screen
  const followers = [];
  let ticking = false;
  const tick = () => { ticking = false; followers.forEach((f) => f.near && f.fn()); };
  function track(el, fn) {
    const f = { el, fn, near: false };
    followers.push(f);
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => es.forEach((e) => { f.near = e.isIntersecting; if (f.near) fn(); }), { rootMargin: "30% 0px" }).observe(el);
    else f.near = true;
    fn();
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
  addEventListener("resize", () => requestAnimationFrame(tick));

  /* ───────── glaze edges between the sections: they drip further as they come up the screen ───────── */
  function dripPath(seed) {
    let r = seed;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    let d = "M0 0 H1200 V26 ";
    let x = 1200;
    while (x > 0) {
      const w = 46 + rnd() * 80;
      const nx = Math.max(0, x - w);
      const cx = (x + nx) / 2;
      if (rnd() < 0.5 && x - nx > 40) {
        const L = 46 + rnd() * 66;
        const dw = Math.min((x - nx) * 0.32, 18);
        d += `C${(x - 6).toFixed(1)} 26 ${(cx + dw * 1.3).toFixed(1)} 30 ${(cx + dw).toFixed(1)} ${(L - dw).toFixed(1)} A${dw.toFixed(1)} ${dw.toFixed(1)} 0 0 1 ${(cx - dw).toFixed(1)} ${(L - dw).toFixed(1)} C${(cx - dw * 1.3).toFixed(1)} 30 ${(nx + 6).toFixed(1)} 26 ${nx.toFixed(1)} 26 `;
      } else d += `Q${cx.toFixed(1)} ${(30 + rnd() * 12).toFixed(1)} ${nx.toFixed(1)} 26 `;
      x = nx;
    }
    return d + "Z";
  }
  function drips() {
    $$("[data-ds-drip]").forEach((el, i) => {
      el.innerHTML = `<svg viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true"><path d="${dripPath(17 + i * 131)}"/></svg>`;
      if (reduce) return el.style.setProperty("--dp", 1);
      track(el, () => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--dp", clamp((innerHeight - r.top) / (innerHeight * 0.7), 0, 1).toFixed(3));
      });
    });
  }

  /* ───────── ⑥ the wheel of the year ───────── */
  const EMOJI = { spring: "🌸", summer: "🍓", autumn: "🍂", winter: "❄️" };
  function year() {
    const wheel = $("[data-ds-wheel]");
    if (!wheel) return;
    const disc = $("[data-ds-disc]", wheel);
    const btns = $$("[data-season]", disc);
    const sec = wheel.closest("[data-ds-year]");
    const panels = $$("[data-panel]", sec);
    const emoji = $("[data-season-emoji]", wheel);
    const angle = (b) => parseFloat(b.style.getPropertyValue("--a"));
    let rot = 0;
    let active = "spring";
    const setRot = (v) => { rot = v; disc.style.setProperty("--rot", `${v}deg`); };
    const choose = (b) => {
      // the shortest way round to bring this season under the cherry
      const want = -angle(b);
      setRot(rot + ((((want - rot) % 360) + 540) % 360) - 180);
      if (b.dataset.season === active) return;
      active = b.dataset.season;
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      panels.forEach((p) => {
        const on = p.dataset.panel === active;
        p.hidden = !on;
        if (on && !reduce && p.animate) p.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 550, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" });
      });
      emoji.textContent = EMOJI[active] || "✦";
      replay(emoji, "is-pop");
      sec.style.setProperty("--season", getComputedStyle(b).getPropertyValue("--c"));
    };
    sec.style.setProperty("--season", getComputedStyle(btns[0]).getPropertyValue("--c"));
    // drag it round; let go and it settles on the nearest season
    let drag = null;
    const ang = (e) => {
      const r = disc.getBoundingClientRect();
      return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
    };
    disc.addEventListener("pointerdown", (e) => {
      if (e.button) return;
      drag = { a: ang(e), r: rot, moved: false, id: e.pointerId };
    });
    disc.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      let d = ang(e) - drag.a;
      d = ((d + 540) % 360) - 180;
      if (!drag.moved && Math.abs(d) > 4) { drag.moved = true; disc.setPointerCapture(e.pointerId); wheel.classList.add("is-drag"); }
      if (drag.moved) setRot(drag.r + d);
    });
    const up = () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      wheel.classList.remove("is-drag");
      if (!moved) return;
      const k = ((Math.round(-rot / 90) % 4) + 4) % 4;
      const b = btns.find((x) => angle(x) === k * 90) || btns[0];
      disc._skip = true;
      setTimeout(() => (disc._skip = false), 0);
      choose(b);
    };
    disc.addEventListener("pointerup", up);
    disc.addEventListener("pointercancel", up);
    disc.addEventListener("click", (e) => {
      if (disc._skip) return;
      const b = e.target.closest("[data-season]");
      if (b) choose(b);
    });
    setRot(0);
  }

  /* ───────── short answers: one note open at a time ───────── */
  function faq() {
    const acc = $("[data-ds-acc]");
    if (!acc) return;
    $$("details", acc).forEach((d) => d.addEventListener("toggle", () => {
      if (d.open) $$("details", acc).forEach((o) => { if (o !== d) o.open = false; });
    }));
  }

  MARIDAY.onReady(() => {
    if (!M() || !M().desserts) return;
    totals();
    headings();
    machine();
    menu();
    guests();
    palette();
    calendar();
    drips();
    year();
    faq();
    tray.paint(false);
  });
})();
