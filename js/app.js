/* Page logic for inner pages: catalog, product, constructor, bento, flavors, price, desserts, delivery, contacts, FAQ, legal */
(function () {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => window.escapeHTML(s);
  const M = () => window.MARIDAY;
  const motion = () => window.MaridayMotion || { reveal() {}, stagger() {}, refresh() {}, live: false };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const params = new URLSearchParams(location.search);
  const CHERRY = () => assetPath("img/cakes/cherries.png");

  function productHref(id) {
    const base = location.pathname.includes("/pages/") ? "product.html" : "pages/product.html";
    return `${base}?id=${encodeURIComponent(id)}`;
  }

  function flavorById(id) {
    return M().flavors.find((f) => f.id === id) || M().flavors[0];
  }
  function metaOf(id) {
    return M().flavorMeta[id] || { img: "slice", tone: "#f5bcc8", layers: ["#f0dca0", "#f7efe6", "#c2263f"], moods: [], sweet: 3, sour: 3 };
  }

  // Horizontal cross-section: sponge / cream / filling stripes
  function stripesHTML(id, cls = "") {
    const m = metaOf(id);
    const rows = [];
    m.layers.forEach((c, i) => {
      rows.push(`<i style="background:${c}"></i>`);
      if (i < m.layers.length - 1) rows.push('<i class="is-cream"></i>');
    });
    return `<span class="p-stripes ${cls}" aria-hidden="true">${rows.reverse().join("")}</span>`;
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

  function stickers(list, active, attr, counts) {
    return list
      .map((c, i) => `<button type="button" class="p-sticker${c.id === active ? " is-on" : ""}" ${attr}="${c.id}" aria-pressed="${c.id === active}" style="--r:${[-3, 2, -1.5, 3, -2.5, 1.5, -1, 2.5][i % 8]}deg">${c.emoji ? `<span aria-hidden="true">${c.emoji}</span> ` : ""}${esc(c.label)}${counts ? `<sup>${counts[c.id] ?? 0}</sup>` : ""}</button>`)
      .join("");
  }

  // Rooms for cakes that have no colour of their own yet (new ones from the admin panel)
  const ROOMS = [["#f6dbe0", "#c9506d"], ["#e5ddf3", "#7b5ea7"], ["#f6e6bf", "#a3701a"], ["#dbefed", "#2f8f83"], ["#efd3cd", "#8e2a22"], ["#f9d6e3", "#cf467f"]];

  // A cake in the catalog is an exhibit, as on the home page: its own room, a marble plinth with its number,
  // the cake cut out of its photo (or a framed photo); on hover the lamp lights it
  function cakeCard(c, i) {
    const fav = MaridayFavs.has(c.id);
    const cut = M().cutout ? M().cutout(c) : "";
    const [bg, ac] = c.bg ? [c.bg, c.accent || "#c9506d"] : ROOMS[i % ROOMS.length];
    return `
      <article class="p-card ex-card" data-id="${c.id}" style="--room:${bg};--accent:${ac}" data-tilt>
        <a class="ex-card__room" href="${productHref(c.id)}" aria-label="${esc(c.name)}">
          <span class="ex-card__lamp" aria-hidden="true"></span>
          <span class="ex-card__cake"><img class="${cut ? "" : "is-photo"}" src="${cut || c.image}" alt="${esc(c.name)}" loading="lazy" draggable="false"></span>
          <span class="ex-card__plinth" aria-hidden="true"></span>
          <span class="p-card__price ex-card__price"><small>від</small><b>€${c.price}</b></span>
        </a>
        <button type="button" class="p-fav${fav ? " is-on" : ""}" data-fav="${c.id}" aria-pressed="${fav}" aria-label="Додати «${esc(c.name)}» в обране">♥</button>
        <div class="p-card__body">
          <h3><a href="${productHref(c.id)}">${esc(c.name)}</a></h3>
          <ul class="p-tags">${(c.tags || []).slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          <div class="p-card__row"><span class="p-card__days">⏳ від ${c.days || 5} дн.</span><a class="p-card__go" href="${productHref(c.id)}">Обрати →</a></div>
        </div>
      </article>`;
  }

  function bindFavs(root) {
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-fav]");
      if (!btn) return;
      e.preventDefault();
      const on = MaridayFavs.toggle(btn.dataset.fav).includes(btn.dataset.fav);
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.remove("is-pop");
      void btn.offsetWidth;
      btn.classList.add("is-pop");
      // on pages with js/favs.js the cake itself pops up in the note; elsewhere the plain toast
      window.MaridayFavNote ? MaridayFavNote.show(btn.dataset.fav, on, btn) : showToast(on ? "Додано в обране ♥" : "Прибрано з обраного");
    });
  }

  /* ═════════════ Catalog ═════════════ */
  window.renderCatalog = function () {
    const grid = qs("#catalog-grid");
    if (!grid || !M()) return;
    const tabs = qs("#catalog-tabs");
    const sortHost = qs("#catalog-sort");
    const countEl = qs("#catalog-count");
    const favBtn = qs("#catalog-favs");
    const cats = M().categories;
    let active = cats.some((c) => c.id === params.get("cat")) ? params.get("cat") : "all";
    let sort = "pop";
    let favOnly = params.get("fav") === "1";

    const counts = {};
    cats.forEach((c) => (counts[c.id] = M().cakes.filter((k) => c.id === "all" || (k.cats || []).includes(c.id)).length));
    // the hero's «( 15 дизайнів · від €145 )» follows the catalog as it is edited in the admin panel
    const eyebrow = qs(".p-hero .p-eyebrow");
    if (eyebrow && /дизайн/.test(eyebrow.textContent) && M().cakes.length) {
      const n = M().cakes.length;
      eyebrow.textContent = `( ${n} ${n % 10 === 1 && n % 100 !== 11 ? "дизайн" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "дизайни" : "дизайнів"} · від €${Math.min(...M().cakes.map((k) => +k.price || 0))} )`;
    }

    function paintTabs() {
      tabs.innerHTML = stickers(cats, active, "data-cat", counts);
      sortHost.innerHTML = [["pop", "Популярні"], ["asc", "Дешевші"], ["desc", "Дорожчі"]]
        .map(([id, l]) => `<button type="button" class="${sort === id ? "is-on" : ""}" data-sort="${id}" aria-pressed="${sort === id}">${l}</button>`).join("");
      const fc = MaridayFavs.get().length;
      favBtn.classList.toggle("is-on", favOnly);
      favBtn.setAttribute("aria-pressed", String(favOnly));
      favBtn.querySelector("b").textContent = fc;
    }

    function paint(animate) {
      let list = M().cakes.filter((c) => active === "all" || (c.cats || []).includes(active));
      if (favOnly) list = list.filter((c) => MaridayFavs.has(c.id));
      if (sort === "asc") list = [...list].sort((a, b) => a.price - b.price);
      if (sort === "desc") list = [...list].sort((a, b) => b.price - a.price);
      countEl.textContent = `${list.length} ${list.length === 1 ? "дизайн" : list.length > 1 && list.length < 5 ? "дизайни" : "дизайнів"}`;
      grid.innerHTML = list.length
        ? list.map(cakeCard).join("")
        : `<div class="p-empty"><img src="${CHERRY()}" alt=""><h3>${favOnly ? "В обраному поки порожньо" : "Тут поки немає тортів"}</h3><p>${favOnly ? "Натисніть ♥ на торті, щоб зберегти його сюди." : "Спробуйте іншу категорію або зберіть власний дизайн."}</p><a class="p-btn" href="constructor.html"><span>Відкрити конструктор</span></a></div>`;
      paintTabs();
      motion().reveal(grid);
      if (animate) motion().stagger(qsa(".p-card, .p-empty", grid));
      motion().refresh();
      const url = new URL(location.href);
      active === "all" ? url.searchParams.delete("cat") : url.searchParams.set("cat", active);
      favOnly ? url.searchParams.set("fav", "1") : url.searchParams.delete("fav");
      history.replaceState(null, "", url);
    }

    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b || b.dataset.cat === active) return;
      active = b.dataset.cat;
      paint(true);
    });
    sortHost.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sort]");
      if (!b) return;
      sort = b.dataset.sort;
      paint(true);
    });
    favBtn.addEventListener("click", () => {
      favOnly = !favOnly;
      paint(true);
    });
    bindFavs(grid);
    document.addEventListener("mariday:favs", () => {
      paintTabs();
      if (favOnly) paint(false);
    });
    paint(false);
  };

  /* ═════════════ Product ═════════════ */
  window.renderProduct = function () {
    const root = qs("#product-root");
    if (!root || !M()) return;
    const id = params.get("id");
    const cake = M().cakes.find((c) => c.id === id);
    if (!cake) {
      root.innerHTML = `<div class="p-empty p-empty--big"><img src="${CHERRY()}" alt=""><h1 class="p-h2">Цей торт уже з'їли 🍒</h1><p>Можливо, дизайн оновився. Подивіться всю колекцію.</p><a class="p-btn" href="cakes.html"><span>До каталогу</span></a></div>`;
      return;
    }
    document.title = `${cake.name} — Mariday Cake`;
    qs("[data-crumb-name]") && (qs("[data-crumb-name]").textContent = cake.name);

    // a cake may come in only some sizes and fillings (ticked in the admin panel); none ticked = all of them
    const only = (all, ids) => { const l = Array.isArray(ids) ? all.filter((x) => ids.includes(x.id)) : []; return l.length ? l : all; };
    const sizes = only(M().sizes, cake.sizes);
    const flavors = only(M().flavors, cake.flavors);
    let size = sizes[0];
    let flavor = flavors[0];
    let view = "stand";
    let text = "";
    const price = () => Math.round(cake.price * size.priceMult);
    const cut = M().cutout ? M().cutout(cake) : "";
    // the name as on the home showcase: heavy glazed words, the last one piped across in cream
    const words = cake.name.trim().split(/\s+/);
    const heavy = words.length > 1 ? words.slice(0, -1).join(" ") : cake.name;
    const piped = words.length > 1 ? words[words.length - 1] : "";
    root.style.setProperty("--room", cake.bg || "#f6dbe0");
    root.style.setProperty("--accent", cake.accent || "#c9506d");
    // the whole page glows in the colour picked for this cake in the admin («Колір кімнати»); no colour = the site's mint
    document.body.classList.toggle("is-roomlit", !!cake.bg);
    if (cake.bg) document.body.style.setProperty("--room", cake.bg);

    root.innerHTML = `
      <div class="p-prod__stage pr-stage">
        <div class="pr-room" data-room>
          <span class="pr-beam" aria-hidden="true"></span>
          <i class="pr-lamp" aria-hidden="true"></i>
          <svg class="p-prod__badge" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="p-prod-c" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0"/></defs><text><textPath href="#p-prod-c">handmade ✦ mariday ✦ alkmaar ✦ </textPath></text></svg>

          <figure class="pr-view pr-stand is-on" data-view="stand">
            <span class="pr-plates" data-plates aria-hidden="true"></span>
            <span class="pr-guests" data-guests></span>
            <span class="pr-cake" data-cake><img class="${cut ? "" : "is-photo"}" src="${cut || cake.image}" alt="${esc(cake.name)}" draggable="false"></span>
            <span class="pr-plinth" aria-hidden="true"><span class="pr-plinth__orn">✦</span><b>${esc(cake.name)}</b></span>
            <span class="pr-plaque" data-plaque hidden><span data-plaque-text></span></span>
          </figure>

          <figure class="pr-view pr-cutview" data-view="cut">
            <span class="pr-cut__plate" aria-hidden="true"></span>
            <span class="pr-slice" data-slice></span>
            <div class="pr-cut__parts"><p>що всередині</p><ol data-cut-parts></ol></div>
            <span class="pr-flv-photo"><img data-flavor-photo src="" alt=""></span>
            <figcaption><b data-cut-name></b><span class="pr-cut__meter" data-cut-meter></span></figcaption>
          </figure>

          <img class="p-prod__cherry" src="${CHERRY()}" alt="" data-depth="1.3">
        </div>
        <div class="p-prod__views pr-tabs" role="tablist" aria-label="Вигляд">
          <button type="button" role="tab" class="is-on" data-show="stand" aria-selected="true"><img src="${cut || cake.image}" alt="" class="${cut ? "is-cut" : ""}"><span>Вітрина</span></button>
          <button type="button" role="tab" data-show="cut" aria-selected="false"><span class="p-prod__views-cut" data-cut-thumb></span><span>Розріз</span></button>
        </div>
      </div>
      <div class="p-prod__info">
        <ul class="p-tags">${(cake.tags || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <h1 class="pr-title" aria-label="${esc(cake.name)}"><span class="pr-title__w" aria-hidden="true">${esc(heavy)}</span>${piped ? `<span class="pr-title__s" aria-hidden="true">${esc(piped)}</span>` : ""}</h1>
        <div class="pr-desc" data-desc><div class="pr-desc__text" data-desc-text>${String(cake.desc || "").trim().split(/\n\s*\n/).map((t) => `<p>${esc(t).replace(/\n/g, "<br>")}</p>`).join("")}</div><button type="button" class="pr-desc__more" data-desc-more hidden aria-expanded="false"><span>Читати далі</span></button></div>
        <div class="p-prod__price pr-price"><b data-price>${formatEUR(price())}</b><span data-per>≈ ${formatEUR(price() / 8)} / гість</span></div>
        <div class="pr-quick" data-quick>
          <button type="button" class="p-btn p-btn--big pr-buy" data-add><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16l-1.3 11.2a2 2 0 0 1-2 1.8H7.3a2 2 0 0 1-2-1.8z"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/><path d="M12 11.5v5M9.5 14h5"/></svg><span>У кошик · <b data-buy-price>${formatEUR(price())}</b></span><i class="pr-buy__shine" aria-hidden="true"></i></button>
        </div>
        <p class="pr-quick__note"><span class="pr-quick__ok" aria-hidden="true">✓</span><span><b data-quick-meta>${esc(size.label)} · ${esc(flavor.name)}</b> — <a href="#pr-opts" data-to-opts>змінити</a></span><span class="pr-quick__trust">одне натискання — і торт у кошику</span></p>

        <div class="p-opt" id="pr-opts">
          <p class="p-opt__label">Вага <span data-serves>${size.serves}</span></p>
          <div class="p-sizes">${sizes.map((s, i) => `<button type="button" class="p-size${s.id === size.id ? " is-on" : ""}" data-size="${s.id}" aria-pressed="${s.id === size.id}"><i style="--h:${12 + i * 5}px;--w:${18 + i * 4}px" aria-hidden="true"></i>${s.label}</button>`).join("")}</div>
        </div>

        <div class="p-opt">
          <p class="p-opt__label">Начинка <span data-flavor-name>${esc(flavor.name)}</span></p>
          ${flavors.length > 1 ? `<div class="p-flv">${flavors.map((f) => `<button type="button" class="p-flv__btn${f.id === flavor.id ? " is-on" : ""}" data-flavor="${f.id}" aria-pressed="${f.id === flavor.id}" title="${esc(f.name)}">${stripesHTML(f.id)}<span>${esc(f.name)}</span></button>`).join("")}</div>
          <p class="p-flv__desc" data-flavor-desc>${esc(flavor.desc)}</p>`
          : `<button type="button" class="pr-oneflv" data-see-cut>${stripesHTML(flavor.id, "pr-oneflv__s")}<span><small>начинка цього торта</small><b>${esc(flavor.name)}</b><span data-flavor-desc>${esc(flavor.desc)}</span><em>подивитися розріз →</em></span></button>`}
        </div>

        <label class="p-opt p-field">
          <span class="p-opt__label">Напис на торті <small>з'явиться на шоколадній табличці</small></span>
          <input type="text" maxlength="30" data-text placeholder="Напр.: З днем народження, Аню!">
        </label>

        <div class="p-prod__actions" data-actions>
          <button type="button" class="p-btn p-btn--big pr-buy" data-add><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16l-1.3 11.2a2 2 0 0 1-2 1.8H7.3a2 2 0 0 1-2-1.8z"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/><path d="M12 11.5v5M9.5 14h5"/></svg><span>У кошик · <b data-price-btn>${formatEUR(price())}</b></span><i class="pr-buy__shine" aria-hidden="true"></i></button>
          <button type="button" class="p-fav p-fav--big${MaridayFavs.has(cake.id) ? " is-on" : ""}" data-fav="${cake.id}" aria-pressed="${MaridayFavs.has(cake.id)}" aria-label="В обране">♥</button>
        </div>
        <a class="p-link" href="constructor.html?flavor=${flavor.id}" data-ctor-link>Хочу свій дизайн → конструктор</a>

        <div class="p-acc">
          <details open><summary>Терміни</summary><p>Цей дизайн готуємо від ${cake.days || 5} днів. Термінове замовлення на наступний день — +20% (якщо є вільне вікно).</p></details>
          <details><summary>Отримання</summary><p>Самовивіз у Alkmaar безкоштовно. Доставка по Нідерландах — індивідуальний розрахунок. <a href="delivery.html">Детальніше →</a></p></details>
          <details><summary>Зберігання</summary><p>У холодильнику при +2…+6 °C до 72 годин. Діставайте за 30–40 хвилин до подачі.</p></details>
        </div>
      </div>
      <div class="pr-dock" data-dock aria-hidden="true">
        <img src="${cut || cake.image}" alt="" class="${cut ? "is-cut" : ""}">
        <span><b>${esc(cake.name)}</b><small data-dock-meta></small></span>
        <button type="button" class="p-btn pr-buy" data-add tabindex="-1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16l-1.3 11.2a2 2 0 0 1-2 1.8H7.3a2 2 0 0 1-2-1.8z"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/><path d="M12 11.5v5M9.5 14h5"/></svg><span>У кошик · <b data-dock-price>${formatEUR(price())}</b></span><i class="pr-buy__shine" aria-hidden="true"></i></button>
      </div>`;

    const gs = !reduce && window.gsap ? window.gsap : null;
    const priceEl = qs("[data-price]", root);
    const animPrice = (to) => {
      const from = parseInt(priceEl.textContent.replace(/\D/g, ""), 10) || to;
      if (!gs) { priceEl.textContent = formatEUR(to); return; }
      const o = { v: from };
      gs.to(o, { v: to, duration: 0.7, ease: "power3.out", onUpdate: () => (priceEl.textContent = formatEUR(o.v)) });
    };

    // The cut: a slice of the chosen flavour standing in 3D — sponge and filling layers with cream between, as listed in its recipe
    const sliceHTML = (f) => {
      const m = metaOf(f.id);
      const bands = [];
      [...m.layers, ...m.layers].forEach((c, i, all) => {
        bands.push(`<i style="--c:${c};--i:${bands.length}"></i>`);
        if (i < all.length - 1) bands.push(`<i class="is-cream" style="--i:${bands.length}"></i>`);
      });
      const col = bands.slice().reverse().join("");
      return `<span class="pr-slice__box" style="--tone:${m.tone}">
        <span class="pr-slice__face pr-slice__front">${col}<b class="pr-slice__drip" aria-hidden="true"></b></span>
        <span class="pr-slice__face pr-slice__side">${col}<b class="pr-slice__drip" aria-hidden="true"></b></span>
        <span class="pr-slice__face pr-slice__top"><img src="${CHERRY()}" alt=""></span>
      </span>`;
    };
    // what is inside, from the recipe's first sentence: «Бісквіт, кремчиз, конфі та намазка. Настрій.»
    const partsOf = (f) => String(f.desc || "").split(/\.\s/)[0].replace(/\.$/, "")
      .split(/,\s*|\s+(?:та|і|й)\s+/).map((t) => t.trim()).filter(Boolean).slice(0, 6)
      .map((t) => t[0].toUpperCase() + t.slice(1));
    // guests around the plinth: a plate for each of them (up to 30), as the weight says
    const guestsOf = (s) => { const n = String(s.serves).match(/\d+/g); return n ? Math.min(24, +n[n.length - 1]) : 8; };
    function paintPlates() {
      const n = guestsOf(size);
      const host = qs("[data-plates]", root);
      host.innerHTML = Array.from({ length: n }, (_, i) => {
        const a = Math.PI * (0.06 + 0.88 * (n === 1 ? 0.5 : i / (n - 1)));
        const ring = n > 12 && i % 2 ? 0.7 : 1; // many guests: two rows of plates
        return `<i style="--x:${(Math.cos(a) * 43 * ring).toFixed(1)}%;--y:${(Math.sin(a) * 15 * ring).toFixed(1)}cqw;--d:${(i * 0.025).toFixed(3)}s"></i>`;
      }).join("");
      qs("[data-guests]", root).textContent = `${size.serves} ↓`;
    }
    function paintCake() {
      // scaled against every size the shop makes, so a 2 kg cake looks the same on every cake's page
      const all = M().sizes;
      const i = all.indexOf(size);
      const k = size.id === "tier" ? 1.08 : 0.86 + (i / Math.max(1, all.length - 2)) * 0.18;
      qs("[data-cake]", root).style.setProperty("--k", k.toFixed(3));
    }

    function paintView() {
      const m = metaOf(flavor.id);
      qs("[data-flavor-photo]", root).src = M().img(m.img);
      qs("[data-flavor-photo]", root).alt = flavor.name;
      qs("[data-slice]", root).innerHTML = sliceHTML(flavor);
      qs("[data-cut-name]", root).textContent = flavor.name;
      qs("[data-cut-parts]", root).innerHTML = partsOf(flavor).map((t, i) => `<li style="--i:${i}">${esc(t)}</li>`).join("");
      const dots = (n) => Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? "is-on" : ""}"></i>`).join("");
      qs("[data-cut-meter]", root).innerHTML = `<span>солодкість ${dots(m.sweet || 3)}</span><span>кислинка ${dots(m.sour || 3)}</span>`;
      qs("[data-cut-thumb]", root).innerHTML = stripesHTML(flavor.id);
      qsa("[data-view]", root).forEach((el) => el.classList.toggle("is-on", el.dataset.view === view));
      qsa("[data-show]", root).forEach((b) => { b.classList.toggle("is-on", b.dataset.show === view); b.setAttribute("aria-selected", String(b.dataset.show === view)); });
      // the slice assembles layer by layer, bottom first
      if (gs && view === "cut") {
        gs.from(qs(".pr-slice__box", root), { xPercent: 40, rotate: 8, opacity: 0, duration: 0.8, ease: "back.out(1.4)" });
        gs.from(qsa(".pr-slice__front i, .pr-slice__side i", root), { yPercent: -260, opacity: 0, duration: 0.5, ease: "back.out(2)", stagger: { each: 0.035, from: "end" }, delay: 0.2 });
        gs.from(qsa("[data-cut-parts] li", root), { x: 24, opacity: 0, duration: 0.5, ease: "back.out(1.6)", stagger: 0.09, delay: 0.45 });
        gs.from(qsa("[data-cut-meter] i.is-on", root), { scale: 0, duration: 0.4, ease: "back.out(3)", stagger: 0.05, delay: 0.7 });
      }
    }

    function paint() {
      const p = price();
      animPrice(p);
      qs("[data-price-btn]", root).textContent = formatEUR(p);
      qs("[data-dock-price]", root).textContent = formatEUR(p);
      qs("[data-buy-price]", root).textContent = formatEUR(p);
      qs("[data-dock-meta]", root).textContent = `${size.label} · ${flavor.name}`;
      qs("[data-quick-meta]", root).textContent = `${size.label} · ${flavor.name}`;
      const guests = parseInt(size.serves, 10) || 30;
      qs("[data-per]", root).textContent = `≈ ${formatEUR(p / guests)} / гість`;
      qs("[data-serves]", root).textContent = size.serves;
      qs("[data-flavor-name]", root).textContent = flavor.name;
      qs("[data-flavor-desc]", root).textContent = flavor.desc;
      qs("[data-ctor-link]", root).href = `constructor.html?flavor=${flavor.id}&size=${size.id}`;
      qsa("[data-size]", root).forEach((b) => { const on = b.dataset.size === size.id; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
      qsa("[data-flavor]", root).forEach((b) => { const on = b.dataset.flavor === flavor.id; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
      paintCake();
      paintPlates();
      paintView();
    }

    const showStand = () => { if (view !== "stand") { view = "stand"; paintView(); } };
    root.addEventListener("click", (e) => {
      const s = e.target.closest("[data-size]");
      const f = e.target.closest("[data-flavor]");
      const v = e.target.closest("[data-show]");
      if (s) { size = sizes.find((x) => x.id === s.dataset.size); showStand(); paint(); }
      if (f) { flavor = flavorById(f.dataset.flavor); view = "cut"; paint(); }
      if (v) { view = v.dataset.show; paintView(); }
      if (e.target.closest("[data-see-cut]")) { view = "cut"; paintView(); if (innerWidth <= 960) qs("[data-room]", root).scrollIntoView({ behavior: "smooth", block: "center" }); }
      const more = e.target.closest("[data-desc-more]");
      if (more) {
        const open = qs("[data-desc]", root).classList.toggle("is-open");
        more.setAttribute("aria-expanded", String(open));
        qs("span", more).textContent = open ? "Згорнути" : "Читати далі";
        if (!open) qs("[data-desc]", root).scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      const add = e.target.closest("[data-add]");
      if (add) {
        addToCartAndNotify(item(), qs("[data-room]", root));
        // the button that was pressed says so for a moment
        add.classList.remove("is-added");
        void add.offsetWidth;
        add.classList.add("is-added");
        clearTimeout(add._t);
        add._t = setTimeout(() => add.classList.remove("is-added"), 1600);
      }
      if (e.target.closest("[data-to-opts]")) {
        e.preventDefault();
        qs("#pr-opts", root).scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    });
    const item = () => ({
      id: cake.id,
      name: cake.name,
      price: price(),
      size: size.id,
      flavor: flavor.id,
      variant: text,
      image: cake.image,
      meta: `${size.label} · ${flavor.name}${text ? ` · напис «${text}»` : ""}`,
    });
    // the inscription is written on a chocolate plaque leaning on the plinth, as you type
    const plaque = qs("[data-plaque]", root);
    qs("[data-text]", root).addEventListener("input", (e) => {
      text = e.target.value.trim();
      plaque.hidden = !text;
      qs("[data-plaque-text]", root).textContent = text;
      showStand();
      plaque.classList.remove("is-write");
      void plaque.offsetWidth;
      plaque.classList.add("is-write");
    });

    // the cart bar rides along whenever neither «У кошик» (under the price, or after the options) is in view —
    // so the cake is always one tap from the cart, whichever part of the page they are reading
    const dock = qs("[data-dock]", root);
    const seen = new Map();
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => seen.set(en.target, en.isIntersecting));
      const on = seen.size === 2 && ![...seen.values()].some(Boolean);
      dock.classList.toggle("is-on", on);
      dock.setAttribute("aria-hidden", String(!on));
      qsa("button", dock).forEach((b) => (b.tabIndex = on ? 0 : -1));
    });
    io.observe(qs("[data-quick]", root));
    io.observe(qs("[data-actions]", root));

    bindFavs(root);
    paint();
    const descText = qs("[data-desc-text]", root);
    const fold = () => {
      const long = descText.scrollHeight > descText.clientHeight + 4 || qs("[data-desc]", root).classList.contains("is-open");
      qs("[data-desc]", root).classList.toggle("is-long", long);
      qs("[data-desc-more]", root).hidden = !long;
    };
    fold();
    document.fonts && document.fonts.ready.then(fold);

    // the light falls from under the header: the beam reaches up to the header's bottom edge wherever it is
    const room = qs("[data-room]", root);
    const bar = qs(".hdr__bar");
    if (bar) {
      let raf = 0;
      const sky = () => { raf = 0; room.style.setProperty("--sky", `${Math.max(0, Math.round(room.getBoundingClientRect().top - bar.getBoundingClientRect().bottom))}px`); };
      const ask = () => { raf ||= requestAnimationFrame(sky); };
      sky();
      addEventListener("scroll", ask, { passive: true });
      addEventListener("resize", ask);
      bar.closest(".hdr")?.addEventListener("transitionend", ask);
    }

    // walking in: the lamp stutters on, the cake is set down on its plinth, the plates are laid
    if (gs) {
      gs.timeline({ delay: 0.25 })
        .fromTo(room, { "--lamp": 0 }, { keyframes: [{ "--lamp": 0.9, duration: 0.06 }, { "--lamp": 0.1, duration: 0.1 }, { "--lamp": 1, duration: 0.08 }, { "--lamp": 0.5, duration: 0.05 }, { "--lamp": 1, duration: 0.2 }] })
        .from(qs("[data-cake] img", root), { yPercent: -60, opacity: 0, duration: 1, ease: "bounce.out" }, 0.2)
        .from(qs(".pr-plinth", root), { yPercent: 30, opacity: 0, duration: 0.8, ease: "expo.out" }, 0.1)
        .from(qsa(".pr-title > span", root), { yPercent: 60, opacity: 0, rotate: (i) => (i ? -14 : 4), duration: 1, stagger: 0.18, ease: "back.out(1.6)" }, 0.15);
    }

    // Related designs
    const rel = qs("#related-grid");
    if (rel) {
      const list = M().cakes.filter((c) => c.id !== cake.id && (c.cats || []).some((k) => k !== "all" && (cake.cats || []).includes(k))).slice(0, 4);
      rel.innerHTML = list.map(cakeCard).join("");
      bindFavs(rel);
    }
  };

  /* ═════════════ Constructor ═════════════ */
  const CTOR = {
    base: 95,
    coats: {
      smooth: { name: "Гладкий крем", add: 0, note: "класика, ідеально рівні грані" },
      ruffles: { name: "Рюші", add: 35, note: "пишні пелюстки вручну" },
      texture: { name: "Фактура", add: 20, note: "гребінець, хвилі, мазки" },
      drip: { name: "Дріп", add: 25, note: "глянцеві шоколадні патьоки" },
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
      light: { name: "Легкий", add: 0, note: "акуратний мінімалізм" },
      medium: { name: "Середній", add: 25, note: "бортики з перлин" },
      complex: { name: "Складний", add: 60, note: "перлини + гірлянди" },
      sculpt: { name: "Скульптура", add: 120, note: "об'ємне серце-топер" },
    },
    toppings: {
      berries: { name: "Ягоди", add: 12, emoji: "🫐" },
      flowers: { name: "Квіти", add: 18, emoji: "🌸" },
      cherries: { name: "Вишні", add: 8, emoji: "🍒" },
      gold: { name: "Золото", add: 15, emoji: "✨" },
      macarons: { name: "Макарони", add: 14, emoji: "🍬" },
      sprinkles: { name: "Посипка", add: 6, emoji: "🎉" },
      candles: { name: "Свічки", add: 5, emoji: "🕯️" },
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
      { name: "💍 Весільна класика", st: { size: "tier", flavor: "vanilla-berry", coat: "ruffles", color: "vanilla", decor: "complex", toppings: ["flowers"], text: "" } },
      { name: "🎈 Дитяче свято", st: { size: "2", flavor: "berry-forest", coat: "drip", color: "sky", decor: "medium", toppings: ["sprinkles", "macarons", "candles"], text: "Happy B-day" } },
      { name: "🍫 Шоколадний", st: { size: "2.5", flavor: "cherry-duo-choc", coat: "drip", color: "butter", decor: "medium", toppings: ["cherries", "gold"], text: "" } },
      { name: "🤍 Мінімалізм", st: { size: "1.5", flavor: "pistachio-raspberry", coat: "smooth", color: "powder", decor: "light", toppings: ["berries"], text: "" } },
      { name: "💘 Love", st: { size: "2", flavor: "lemon-raspberry", coat: "texture", color: "powder", decor: "sculpt", toppings: ["berries", "gold"], text: "Love you" } },
    ],
  };

  function rng(seed) {
    return () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  }

  const TAU = Math.PI * 2;
  const f1 = (n) => n.toFixed(1);

  /* Pseudo-3D cake: every tier is a cylinder; decorations live on its surface at an angle θ,
     so turning the cake (rot) moves them around and hides the ones on the back side. */
  function cakeSVG(st, o = {}) {
    const { cut = false, rot = 0, fx = {}, cherry = CHERRY(), noText = false } = o;
    const flv = metaOf(st.flavor);
    const coat = CTOR.colors[st.color].hex;
    const dark = shade(coat, -0.14);
    const light = shade(coat, 0.08);
    const darkCoat = isDark(coat);
    const has = (k) => st.toppings.includes(k);
    const tiers = CTOR.tiers[st.size] || CTOR.tiers["2"];
    const fall = (k) => (fx.fall && fx.fall.has(k) ? " c-fall" : "");
    let y = 352;
    let out = "";
    const geo = [];

    // plate with a rim pattern that turns with the cake
    let rim = "";
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * TAU + rot;
      const z = Math.cos(a);
      if (z < 0.05) continue;
      rim += `<circle cx="${f1(200 + 168 * Math.sin(a))}" cy="${f1(357 + 11 * z)}" r="${f1(2 + 1.4 * z)}" fill="rgba(109,8,9,${(0.12 + 0.18 * z).toFixed(2)})"/>`;
    }

    tiers.forEach(([w, h], ti) => {
      const R = w / 2;
      const x = 200 - R;
      const ry = Math.max(9, w * 0.06);
      y -= h;
      const P = (a, top) => { const t = a + rot; return { x: 200 + R * Math.sin(t), y: top + ry * Math.cos(t), z: Math.cos(t) }; };
      const ring = (n, phase = 0) => {
        const pts = [];
        for (let k = 0; k < n; k++) pts.push((k / n) * TAU + phase);
        return pts;
      };
      const side = `M${x},${y} L${x},${y + h} A${R},${ry} 0 0 0 ${x + w},${y + h} L${x + w},${y} Z`;
      let g = `<g class="c-tier" style="--i:${ti}">`;

      if (cut) {
        // the tier is sliced in half — repeating flavour layers stack up one by one
        const L = flv.layers;
        const rows = Math.max(3, Math.round(h / 18));
        const rh = (h - 14) / rows;
        let inner = "";
        for (let r = 0; r < rows; r++) {
          const col = r % 2 ? "#f7efe6" : L[Math.floor(r / 2) % L.length];
          const ry0 = y + h - 7 - (r + 1) * rh;
          inner += `<rect class="c-layer" style="--d:${(ti * rows + r) * 0.05}s" x="${x + 8}" y="${f1(ry0)}" width="${w - 16}" height="${f1(rh + 0.6)}" fill="${col}"/>`;
        }
        g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${coat}"/>${inner}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${dark}" stroke-width="1.5" opacity=".5"/>`;
      } else {
        g += `<defs><linearGradient id="cg${ti}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs>`;
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
            if (p.z > 0.1) g += `<g class="c-item${fall("sprinkles")}" style="--d:${dl}s"><rect x="${f1(p.x - 1.5)}" y="${f1(p.y - 4)}" width="${f1(3 * (0.5 + 0.5 * p.z))}" height="8" rx="1.5" fill="${c}" transform="rotate(${ang | 0} ${f1(p.x)} ${f1(p.y)})"/></g>`;
          }
        }

        g += `<path d="${side}" fill="url(#cg${ti})"/>`;
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
          if (p.z > 0.1) deco += `<path class="c-item${fall("gold")}" style="--d:${f1(k * 0.05)}s" d="M${f1(p.x)},${f1(p.y)} l${f1(s1 * p.z)},${f1(-s2)} l${f1(4 * p.z)},${f1(s3)} l${f1(-10 * p.z)},4 z" fill="#e3b94a" opacity="${(0.5 + 0.5 * p.z).toFixed(2)}"/>`;
        }
      }
      // items standing on the top disk, drawn back-to-front
      const items = [];
      const onTop = (a, rf) => { const t = a + rot; return { x: 200 + rf * top.R * Math.sin(t), y: top.y + rf * top.ry * Math.cos(t), z: Math.cos(t) * rf }; };
      if (has("berries")) {
        const r = rng(13);
        for (let k = 0; k < 11; k++) {
          const p = onTop(r() * TAU, 0.25 + r() * 0.6);
          const blue = k % 3 === 2;
          items.push({ z: p.z, svg: `<g class="c-item${fall("berries")}" style="--d:${f1(k * 0.04)}s">${blue ? `<circle cx="${f1(p.x)}" cy="${f1(p.y - 5)}" r="6" fill="#3b4a8c"/><circle cx="${f1(p.x - 2)}" cy="${f1(p.y - 7)}" r="1.6" fill="#fff" opacity=".6"/>` : `<circle cx="${f1(p.x)}" cy="${f1(p.y - 7)}" r="8" fill="#c2263f"/><circle cx="${f1(p.x - 2.5)}" cy="${f1(p.y - 9.5)}" r="2" fill="#fff" opacity=".5"/>`}</g>` });
        }
      }
      if (has("macarons")) {
        [[-1.1, "#f5bcc8"], [0.1, "#fbe6b8"], [1.3, "#bcd6f3"], [2.6, "#e9c6f0"]].forEach(([a, c], k) => {
          const p = onTop(a, 0.6);
          const sw = 14 + 3 * Math.abs(Math.cos(a + rot));
          items.push({ z: p.z, svg: `<g class="c-item${fall("macarons")}" style="--d:${f1(k * 0.08)}s"><rect x="${f1(p.x - sw)}" y="${f1(p.y - 25)}" width="${f1(sw * 2)}" height="10" rx="5" fill="${c}"/><rect x="${f1(p.x - sw + 1)}" y="${f1(p.y - 16)}" width="${f1(sw * 2 - 2)}" height="5" rx="2" fill="#fff8ee"/><rect x="${f1(p.x - sw)}" y="${f1(p.y - 11)}" width="${f1(sw * 2)}" height="10" rx="5" fill="${shade(c, -0.06)}"/></g>` });
        });
      }
      if (has("flowers")) {
        [[-0.9, 0.82, "#f5bcc8"], [-0.45, 0.88, "#ffffff"], [-1.35, 0.7, "#e2849a"], [2.2, 0.8, "#ffffff"]].forEach(([a, rf, c], k) => {
          const p = onTop(a, rf);
          items.push({ z: p.z, svg: `<g class="c-item${fall("flowers")}" style="--d:${f1(k * 0.08)}s"><path d="M${f1(p.x - 16)},${f1(p.y - 4)} q-8,-14 8,-12" fill="#7aa874"/><circle cx="${f1(p.x)}" cy="${f1(p.y - 12)}" r="14" fill="${c}" stroke="${shade(c, -0.12)}" stroke-width="1.5"/><path d="M${f1(p.x - 7)},${f1(p.y - 12)} a7,7 0 1,1 7,7 a4,4 0 1,1 -4,-4" fill="none" stroke="${shade(c, -0.18)}" stroke-width="1.6"/></g>` });
        });
      }
      if (has("cherries")) {
        [[0.7, 0.35, 64], [-2, 0.5, 48]].forEach(([a, rf, s], k) => {
          const p = onTop(a, rf);
          items.push({ z: p.z, svg: `<g class="c-item${fall("cherries")}" style="--d:${f1(k * 0.12)}s"><image href="${cherry}" x="${f1(p.x - s / 2)}" y="${f1(p.y - s + 6)}" width="${s}" height="${s}"/></g>` });
        });
      }
      if (has("candles")) {
        const cols = ["#f5bcc8", "#bcd6f3", "#fbe6b8", "#e9c6f0", "#ffffff"];
        for (let k = 0; k < 5; k++) {
          const p = onTop((k / 5) * TAU + 0.3, 0.55);
          const c = cols[k];
          items.push({ z: p.z, svg: `<g class="c-item c-candle${fall("candles")}" style="--d:${f1(k * 0.07)}s"><rect x="${f1(p.x - 3.5)}" y="${f1(p.y - 38)}" width="7" height="38" rx="2" fill="${c}" stroke="rgba(109,8,9,.25)"/><path d="M${f1(p.x - 3.5)},${f1(p.y - 30)} l7,-5 M${f1(p.x - 3.5)},${f1(p.y - 18)} l7,-5 M${f1(p.x - 3.5)},${f1(p.y - 6)} l7,-5" stroke="#e2849a" stroke-width="2"/><line x1="${f1(p.x)}" y1="${f1(p.y - 38)}" x2="${f1(p.x)}" y2="${f1(p.y - 43)}" stroke="#3d0405" stroke-width="1.5"/>${o.blown ? `<g class="c-smoke"><circle cx="${f1(p.x)}" cy="${f1(p.y - 48)}" r="4" fill="#bbb"/><circle cx="${f1(p.x + 3)}" cy="${f1(p.y - 56)}" r="5" fill="#ccc"/></g>` : `<g class="c-flame" style="transform-origin:${f1(p.x)}px ${f1(p.y - 43)}px"><ellipse cx="${f1(p.x)}" cy="${f1(p.y - 50)}" rx="5" ry="9" fill="#ffb347"/><ellipse cx="${f1(p.x)}" cy="${f1(p.y - 48)}" rx="2.5" ry="5" fill="#fff6c8"/><circle cx="${f1(p.x)}" cy="${f1(p.y - 50)}" r="14" fill="#ffd27a" opacity=".22"/></g>`}</g>` });
        }
      }
      if (st.decor === "sculpt") {
        const s = Math.cos(rot);
        items.push({ z: 0, svg: `<g class="c-topper"><line x1="200" y1="${top.y}" x2="200" y2="${top.y - 46}" stroke="#c9a24a" stroke-width="3"/><g transform="translate(200 ${top.y - 64}) scale(${Math.max(0.06, Math.abs(s)).toFixed(3)} 1)"><path d="M0,0 c-24,-26 -46,4 0,30 c46,-26 24,-56 0,-30z" transform="translate(0 -18)" fill="${s >= 0 ? "#c2263f" : "#9b1030"}" stroke="#6d0809" stroke-width="2"/>${s >= 0 ? '<path d="M-14,-10 q4,-8 12,-4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>' : ""}</g></g>` });
      }
      items.sort((a, b) => a.z - b.z).forEach((it) => (deco += it.svg));

      if (st.text && !noText) {
        const fs = Math.max(13, Math.min(30, (base.w * 1.7) / Math.max(st.text.length, 4)));
        const c = Math.cos(rot);
        if (c > 0.12) {
          const p = base.P(0, base.y + base.h / 2 + fs / 3);
          deco += `<text transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${c.toFixed(3)} 1)" text-anchor="middle" font-family="Great Vibes, cursive" font-size="${f1(fs)}" fill="${darkCoat ? "#f5bcc8" : "#6d0809"}" opacity="${Math.min(1, c * 1.6).toFixed(2)}">${esc(st.text)}</text>`;
        }
      }
    }

    return `<svg class="c-svg${cut ? " is-cut" : ""}${fx.drop ? " is-drop" : ""}" viewBox="0 0 400 420" role="img" aria-label="Попередній вигляд торта">
      <ellipse cx="200" cy="392" rx="150" ry="14" fill="rgba(61,4,5,.14)"/>
      <path d="M150,372 h100 l-14,24 h-72 z" fill="#fff" stroke="rgba(109,8,9,.15)"/>
      <ellipse cx="200" cy="360" rx="176" ry="17" fill="#fff" stroke="rgba(109,8,9,.15)"/>
      <ellipse cx="200" cy="356" rx="176" ry="14" fill="#f7fbfb"/>${rim}
      ${out}${deco}
    </svg>`;
  }

  window.renderConstructor = function () {
    const root = qs("#constructor-root");
    if (!root || !M()) return;
    const sizes = M().sizes;
    const st = {
      size: sizes.some((s) => s.id === params.get("size")) ? params.get("size") : "2",
      flavor: M().flavors.some((f) => f.id === params.get("flavor")) ? params.get("flavor") : M().flavors[0].id,
      coat: CTOR.coats[params.get("coat")] ? params.get("coat") : "smooth",
      color: CTOR.colors[params.get("color")] ? params.get("color") : "powder",
      decor: CTOR.decor[params.get("decor")] ? params.get("decor") : "medium",
      toppings: (params.get("top") ?? "berries,candles").split(",").filter((t) => CTOR.toppings[t]),
      text: (params.get("text") || "").slice(0, 24),
      idea: "",
    };
    const steps = ["Вага", "Смак", "Крем", "Декор", "Підсумок"];
    let step = Math.min(4, Math.max(0, parseInt(params.get("step"), 10) || 0));
    let cut = false;
    let blown = false;
    let lastTiers = 0;
    // rotation physics
    let rot = 0, vel = 0, dragging = false, raf = 0, dragged = false;

    const sizeObj = () => sizes.find((s) => s.id === st.size);
    const lines = () => [
      [`Основа ${sizeObj().label} · ${flavorById(st.flavor).name}`, Math.round(CTOR.base * sizeObj().priceMult)],
      [`Покриття: ${CTOR.coats[st.coat].name}`, CTOR.coats[st.coat].add],
      [`Декор: ${CTOR.decor[st.decor].name}`, CTOR.decor[st.decor].add],
      ...st.toppings.map((t) => [`${CTOR.toppings[t].emoji} ${CTOR.toppings[t].name}`, CTOR.toppings[t].add]),
    ];
    const price = () => lines().reduce((s, [, v]) => s + v, 0);

    root.innerHTML = `
      <div class="c-presets" role="group" aria-label="Готові ідеї">
        <span class="c-presets__label p-hand">готові ідеї →</span>
        ${CTOR.presets.map((p, i) => `<button type="button" class="c-preset" data-preset="${i}">${p.name}</button>`).join("")}
      </div>
      <div class="c-tabs" role="tablist" aria-label="Кроки конструктора">
        ${steps.map((s, i) => `<button type="button" role="tab" class="c-tab" data-step="${i}"><b>${pad(i + 1)}</b>${s}</button>`).join("")}
        <span class="c-tabs__bar" aria-hidden="true"><i></i></span>
      </div>
      <div class="c-layout">
        <div class="c-stage" data-stage>
          <div class="c-stage__ring" aria-hidden="true" data-ring><svg viewBox="0 0 200 200"><defs><path id="c-ring" d="M100,100 m-88,0 a88,88 0 1,1 176,0 a88,88 0 1,1 -176,0"/></defs><text><textPath href="#c-ring">ваш торт ✦ ваш смак ✦ ваше свято ✦ mariday ✦ </textPath></text></svg></div>
          <div class="c-stage__cake" data-cake tabindex="0" aria-label="Торт: тягніть або стрілки ← →, щоб покрутити"></div>
          <p class="c-stage__hint" data-hint aria-hidden="true"><i>↔</i> тягніть торт — він крутиться</p>
          <div class="c-price" data-price-tag><small>орієнтовно</small><b data-price>${formatEUR(price())}</b></div>
          <div class="c-stage__tools">
            <button type="button" class="c-toggle" data-spin>↻ Покрутити</button>
            <button type="button" class="c-toggle" data-cut aria-pressed="false">✂ Розріз</button>
            <button type="button" class="c-toggle" data-random>🎲 Сюрприз</button>
            <button type="button" class="c-toggle" data-png>⬇ Картинка</button>
            <button type="button" class="c-toggle" data-share>🔗 Посилання</button>
          </div>
          <p class="c-stage__caption" data-caption></p>
        </div>
        <div class="c-panel" data-panel></div>
      </div>`;

    const panel = qs("[data-panel]", root);
    const cakeHost = qs("[data-cake]", root);
    const stage = qs("[data-stage]", root);
    const ringEl = qs("[data-ring]", root);

    function syncURL() {
      const u = new URL(location.href);
      u.search = new URLSearchParams({ size: st.size, flavor: st.flavor, coat: st.coat, color: st.color, decor: st.decor, top: st.toppings.join(","), ...(st.text ? { text: st.text } : {}) }).toString();
      history.replaceState(null, "", u);
      return u.href;
    }

    // frame render: only geometry, no entrance effects
    const draw = (fx = {}) => {
      cakeHost.innerHTML = cakeSVG(st, { cut, rot, fx, blown });
      ringEl.style.transform = `rotate(${(rot * 57.3 * 0.35).toFixed(1)}deg)`;
    };

    function paintCake(fx = {}) {
      const tiers = (CTOR.tiers[st.size] || []).length;
      const anim = !reduce;
      draw({ drop: anim && tiers !== lastTiers, fall: anim ? fx.fall : null });
      lastTiers = tiers;
      stage.style.setProperty("--tint", CTOR.colors[st.color].hex);
      qs("[data-caption]", root).textContent = `${sizeObj().label} · ${sizeObj().serves} · ${flavorById(st.flavor).name} · ${CTOR.colors[st.color].name.toLowerCase()} ${CTOR.coats[st.coat].name.toLowerCase()}`;
      const tag = qs("[data-price-tag]", root);
      const priceEl = qs("[data-price]", root);
      const to = price();
      const from = parseInt(priceEl.textContent.replace(/\D/g, ""), 10) || to;
      if (motion().live && from !== to) {
        const o2 = { v: from };
        gsap.to(o2, { v: to, duration: 0.6, ease: "power3.out", onUpdate: () => (priceEl.textContent = formatEUR(o2.v)) });
      } else priceEl.textContent = formatEUR(to);
      tag.classList.remove("is-bump");
      void tag.offsetWidth;
      tag.classList.add("is-bump");
      syncURL();
    }

    /* ── turntable physics ── */
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
      if (cut || e.button !== 0) return;
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
        qs("[data-hint]", root).classList.add("is-gone");
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

    function blowCandles() {
      blown = !blown;
      draw();
      if (blown) {
        window.burstConfetti?.(stage);
        showToast("Бажання загадано ✨ Клікніть ще раз — свічки знову запаляться");
      }
    }

    function optCard(attr, id, on, title, sub, extra = "") {
      return `<button type="button" class="c-opt${on ? " is-on" : ""}" ${attr}="${id}" aria-pressed="${on}">${extra}<b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</button>`;
    }

    function paintPanel() {
      let body = "";
      if (step === 0) {
        body = `
          <h2 class="c-h">Оберіть <em>вагу</em></h2>
          <p class="c-sub">Орієнтир — 150–200 г на гостя. Не впевнені? Порахуємо:</p>
          <label class="c-guests">Гостей <input type="range" min="4" max="60" value="${parseInt(sizeObj().serves, 10) || 30}" data-guests><output data-guests-out>${parseInt(sizeObj().serves, 10) || 30}</output></label>
          <div class="c-grid c-grid--3">${sizes.map((s, i) => optCard("data-size", s.id, s.id === st.size, s.label, s.serves, `<i class="c-ico-tier" style="--n:${(CTOR.tiers[s.id] || []).length};--k:${i}" aria-hidden="true"></i>`)).join("")}</div>`;
      } else if (step === 1) {
        const f = flavorById(st.flavor);
        body = `
          <h2 class="c-h">Що <em>всередині?</em></h2>
          <p class="c-sub">9 начинок — оберіть, і торт покаже себе в розрізі.</p>
          <div class="c-grid c-grid--flv">${M().flavors.map((x) => optCard("data-flavor", x.id, x.id === st.flavor, esc(x.name), "", stripesHTML(x.id))).join("")}</div>
          <p class="c-note"><b>${esc(f.name)}:</b> ${esc(f.desc)}</p>`;
      } else if (step === 2) {
        body = `
          <h2 class="c-h">Крем і <em>колір</em></h2>
          <p class="c-label">Покриття</p>
          <div class="c-grid c-grid--2">${Object.entries(CTOR.coats).map(([id, c]) => optCard("data-coat", id, id === st.coat, c.name + (c.add ? ` <span>+€${c.add}</span>` : ""), c.note)).join("")}</div>
          <p class="c-label">Колір крему · <span>${CTOR.colors[st.color].name}</span></p>
          <div class="c-swatches">${Object.entries(CTOR.colors).map(([id, c]) => `<button type="button" class="c-swatch${id === st.color ? " is-on" : ""}" data-color="${id}" aria-pressed="${id === st.color}" aria-label="${c.name}" title="${c.name}" style="--c:${c.hex}"></button>`).join("")}</div>`;
      } else if (step === 3) {
        body = `
          <h2 class="c-h">Декор і <em>напис</em></h2>
          <div class="c-grid c-grid--2">${Object.entries(CTOR.decor).map(([id, d]) => optCard("data-decor", id, id === st.decor, d.name + (d.add ? ` <span>+€${d.add}</span>` : ""), d.note)).join("")}</div>
          <p class="c-label">Топінги <small>(можна кілька — дивіться, як падають)</small></p>
          <div class="c-chips">${Object.entries(CTOR.toppings).map(([id, t]) => `<button type="button" class="p-sticker${st.toppings.includes(id) ? " is-on" : ""}" data-top="${id}" aria-pressed="${st.toppings.includes(id)}">${t.emoji} ${t.name} <sup>+€${t.add}</sup></button>`).join("")}</div>
          <label class="c-field">Напис на торті<input type="text" maxlength="24" data-ctext value="${esc(st.text)}" placeholder="Happy birthday!"></label>
          <label class="c-field">Ідея / референс<textarea rows="3" data-idea placeholder="Опишіть ідею або залиште посилання на фото">${esc(st.idea)}</textarea></label>`;
      } else {
        const ls = lines();
        body = `
          <h2 class="c-h">Ваш <em>торт</em></h2>
          <div class="c-receipt">
            <p class="c-receipt__head">Mariday Cake · чек №${pad((Date.now() / 1000) % 97 | 0)}</p>
            ${ls.map(([n, v]) => `<div class="c-receipt__row"><span>${esc(n)}</span><i></i><b>${v ? formatEUR(v) : "вкл."}</b></div>`).join("")}
            ${st.text ? `<div class="c-receipt__row"><span>Напис «${esc(st.text)}»</span><i></i><b>вкл.</b></div>` : ""}
            <div class="c-receipt__total"><span>Разом орієнтовно</span><b>${formatEUR(price())}</b></div>
            <p class="c-receipt__foot">Фінальну ціну підтвердить менеджер ✦ дякуємо!</p>
          </div>`;
      }
      panel.innerHTML = `
        <div class="c-step" data-step-body>${body}</div>
        <div class="c-nav">
          <button type="button" class="p-btn p-btn--ghost" data-prev ${step === 0 ? "disabled" : ""}><span>← Назад</span></button>
          ${step < 4
            ? `<button type="button" class="p-btn" data-next><span>Далі · ${formatEUR(price())}</span></button>`
            : `<button type="button" class="p-btn" data-add><span>У кошик · ${formatEUR(price())}</span></button><a class="p-btn p-btn--ghost" data-wa target="_blank" rel="noopener"><span>Обговорити у WhatsApp</span></a>`}
        </div>`;
      if (step === 4) {
        const msg = `Вітаю! Хочу торт з конструктора:\n${lines().map(([n, v]) => `• ${n}${v ? " — €" + v : ""}`).join("\n")}${st.text ? `\n• Напис: «${st.text}»` : ""}${st.idea ? `\n• Ідея: ${st.idea}` : ""}\nРазом орієнтовно: ${formatEUR(price())}\n${syncURL()}`;
        qs("[data-wa]", panel).href = `https://wa.me/${M().contacts.whatsapp}?text=${encodeURIComponent(msg)}`;
      }
      qsa("[data-step]", root).forEach((b) => {
        const i = +b.dataset.step;
        b.classList.toggle("is-on", i === step);
        b.classList.toggle("is-done", i < step);
        b.setAttribute("aria-selected", String(i === step));
      });
      qs(".c-tabs__bar i", root).style.transform = `scaleX(${(step + 1) / steps.length})`;
      if (motion().live) gsap.from(qs("[data-step-body]", panel).children, { y: 24, opacity: 0, duration: 0.6, stagger: 0.04, ease: "expo.out" });
    }

    function update(fx, rePanel = true) {
      paintCake(fx);
      if (rePanel) paintPanel();
      else {
        const nb = qs("[data-next] span, [data-add] span", panel);
        if (nb) nb.textContent = `${step < 4 ? "Далі" : "У кошик"} · ${formatEUR(price())}`;
      }
    }

    function setCut(on) {
      cut = on;
      qs("[data-cut]", root).setAttribute("aria-pressed", String(cut));
      if (cut) { rot = 0; vel = 0; }
    }

    function goStep(i) {
      step = Math.max(0, Math.min(4, i));
      paintPanel();
      const top = root.getBoundingClientRect().top + scrollY - 100;
      if (innerWidth >= 960 && scrollY > top + 200) {
        window.MaridayLenis ? window.MaridayLenis.scrollTo(top, { duration: 1 }) : scrollTo({ top, behavior: "smooth" });
      } else if (innerWidth < 960) {
        const pt = panel.getBoundingClientRect().top + scrollY - stage.offsetHeight - 20;
        window.MaridayLenis ? window.MaridayLenis.scrollTo(pt, { duration: 1 }) : scrollTo({ top: pt, behavior: "smooth" });
      }
    }

    // ⬇ PNG of the current design (inscription drawn on the canvas so the script font is kept)
    let cherryData = null;
    async function exportPNG() {
      try {
        if (!cherryData) {
          const blob = await (await fetch(CHERRY())).blob();
          cherryData = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
        }
        const svg = cakeSVG(st, { rot: 0, cherry: cherryData, noText: true, blown }).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="840" ');
        const img = new Image();
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        await img.decode();
        const cv = document.createElement("canvas");
        cv.width = 1080;
        cv.height = 1350;
        const ctx = cv.getContext("2d");
        const tint = CTOR.colors[st.color].hex;
        const grd = ctx.createRadialGradient(540, 620, 60, 540, 620, 760);
        grd.addColorStop(0, "#ffffff");
        grd.addColorStop(1, isDark(tint) ? "#f5bcc8" : tint);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 1080, 1350);
        ctx.drawImage(img, 140, 250, 800, 840);
        await document.fonts.ready;
        if (st.text) {
          const base = CTOR.tiers[st.size][0];
          const baseY = 352 - base[1];
          const fs = Math.max(13, Math.min(30, (base[0] * 1.7) / Math.max(st.text.length, 4)));
          ctx.fillStyle = isDark(tint) ? "#f5bcc8" : "#6d0809";
          ctx.textAlign = "center";
          ctx.font = `${fs * 2}px "Great Vibes", cursive`;
          ctx.fillText(st.text, 140 + 200 * 2, 250 + (baseY + base[1] / 2 + fs / 3 + Math.max(9, base[0] * 0.06)) * 2);
        }
        ctx.fillStyle = "#6d0809";
        ctx.textAlign = "center";
        ctx.font = '800 64px "Unbounded", sans-serif';
        ctx.fillText("MARIDAY", 540, 150);
        ctx.font = '64px "Great Vibes", cursive';
        ctx.fillStyle = "#e2849a";
        ctx.fillText("мій торт", 690, 205);
        ctx.font = '500 34px "Caveat", cursive';
        ctx.fillStyle = "#6d0809";
        ctx.fillText(qs("[data-caption]", root).textContent, 540, 1170);
        ctx.font = '600 30px "Unbounded", sans-serif';
        ctx.fillText(`орієнтовно ${formatEUR(price())}  ·  @mariday.cake`, 540, 1250);
        const a = document.createElement("a");
        a.download = "mariday-moi-tort.png";
        a.href = cv.toDataURL("image/png");
        a.click();
        showToast("Картинку збережено — надішліть її менеджеру ♥");
      } catch {
        showToast("Не вдалося зберегти картинку — скористайтеся посиланням");
      }
    }

    root.addEventListener("click", (e) => {
      const t = e.target;
      const pick = (attr, key) => {
        const b = t.closest(`[${attr}]`);
        if (!b) return false;
        st[key] = b.getAttribute(attr);
        return true;
      };
      if (t.closest("[data-step]")) return goStep(+t.closest("[data-step]").dataset.step);
      if (t.closest("[data-next]")) return goStep(step + 1);
      if (t.closest("[data-prev]")) return goStep(step - 1);
      const pre = t.closest("[data-preset]");
      if (pre) {
        Object.assign(st, JSON.parse(JSON.stringify(CTOR.presets[+pre.dataset.preset].st)));
        qsa("[data-preset]", root).forEach((b) => b.classList.toggle("is-on", b === pre));
        setCut(false);
        blown = false;
        lastTiers = 0;
        update({ fall: new Set(st.toppings) });
        vel = 0.22;
        setTimeout(kick, 900);
        return;
      }
      if (t.closest("[data-flavor]") && pick("data-flavor", "flavor")) {
        setCut(true);
        return update({});
      }
      if (pick("data-size", "size") || pick("data-coat", "coat") || pick("data-color", "color") || pick("data-decor", "decor")) {
        setCut(false);
        return update({});
      }
      const top = t.closest("[data-top]");
      if (top) {
        const id = top.dataset.top;
        const adding = !st.toppings.includes(id);
        st.toppings = adding ? [...st.toppings, id] : st.toppings.filter((x) => x !== id);
        if (id === "candles") blown = false;
        setCut(false);
        return update({ fall: adding ? new Set([id]) : null });
      }
      if (t.closest("[data-cut]")) {
        setCut(!cut);
        return paintCake({});
      }
      if (t.closest("[data-spin]")) {
        if (cut) setCut(false);
        vel += 0.3;
        qs("[data-hint]", root).classList.add("is-gone");
        return kick();
      }
      if (t.closest("[data-random]")) {
        const pickOne = (o) => o[Math.floor(Math.random() * o.length)];
        st.size = pickOne(sizes).id;
        st.flavor = pickOne(M().flavors).id;
        st.coat = pickOne(Object.keys(CTOR.coats));
        st.color = pickOne(Object.keys(CTOR.colors));
        st.decor = pickOne(Object.keys(CTOR.decor));
        st.toppings = Object.keys(CTOR.toppings).filter(() => Math.random() > 0.6);
        setCut(false);
        blown = false;
        lastTiers = 0;
        update({ fall: new Set(st.toppings) });
        return;
      }
      if (t.closest("[data-png]")) return exportPNG();
      if (t.closest("[data-share]")) {
        const url = syncURL();
        (navigator.clipboard?.writeText(url) || Promise.reject())
          .then(() => showToast("Посилання на ваш дизайн скопійовано"))
          .catch(() => showToast("Скопіюйте адресу сторінки — у ній збережено дизайн"));
        return;
      }
      if (t.closest("[data-add]")) {
        const f = flavorById(st.flavor);
        const meta = [sizeObj().label, f.name, `${CTOR.colors[st.color].name} ${CTOR.coats[st.coat].name.toLowerCase()}`, `декор: ${CTOR.decor[st.decor].name.toLowerCase()}`, ...st.toppings.map((x) => CTOR.toppings[x].name.toLowerCase()), st.text ? `напис «${st.text}»` : "", st.idea ? `ідея: ${st.idea}` : ""].filter(Boolean).join(" · ");
        addToCartAndNotify({ id: "custom", name: "Торт за вашим дизайном", price: price(), size: st.size, flavor: st.flavor, variant: syncURL(), meta }, cakeHost);
        window.burstConfetti?.(qs("[data-price-tag]", root));
        vel = 0.35;
        kick();
      }
    });
    root.addEventListener("input", (e) => {
      if (e.target.matches("[data-ctext]")) {
        st.text = e.target.value.slice(0, 24);
        if (Math.abs(Math.cos(rot)) < 0.9) rot = 0;
        draw();
        syncURL();
      }
      if (e.target.matches("[data-idea]")) st.idea = e.target.value;
      if (e.target.matches("[data-guests]")) {
        const g = +e.target.value;
        qs("[data-guests-out]", root).textContent = g;
        const need = g * 0.175;
        const pickSize = sizes.find((s) => s.id !== "tier" && parseFloat(s.id) >= need) || sizes.find((s) => s.id === "tier");
        if (pickSize.id !== st.size) {
          st.size = pickSize.id;
          qsa("[data-size]", panel).forEach((b) => { const on = b.dataset.size === st.size; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
          update({}, false);
        }
      }
    });
    // first render: tiers stack up, then toppings rain down
    update({ fall: new Set(st.toppings) });
  };

  /* ═════════════ Bento ═════════════ */
  window.renderBento = function () {
    const root = qs("#bento-root");
    if (!root || !M()) return;
    const flavors = ["berry-forest", "snickers", "pistachio-raspberry", "lemon-raspberry"];
    const colors = { powder: "#f5bcc8", ice: "#dbefed", butter: "#fbe6b8", sky: "#bcd6f3", lilac: "#e9c6f0", cherry: "#6d0809", white: "#fbf6ee" };
    const fonts = { script: ["Каліграфія", "Great Vibes, cursive", 44], hand: ["Рукописний", "Caveat, cursive", 40], bold: ["Жирний", "Unbounded, sans-serif", 22] };
    const st = { flavor: flavors[0], color: "powder", font: "script", decor: M().bentoDecor[0].id, text: "З днем народження!" };
    const decorObj = () => M().bentoDecor.find((d) => d.id === st.decor);
    const price = () => M().bentoBase + decorObj().price;

    root.innerHTML = `
      <div class="b-layout">
        <div class="b-stage">
          <div class="b-box" data-box>
            <div class="b-box__base"></div>
            <div class="b-box__cake" data-cake></div>
            <div class="b-box__lid" aria-hidden="true"><span>Mariday</span><em>cake</em></div>
          </div>
          <div class="c-price" data-price-tag><small>бенто</small><b data-price></b></div>
          <p class="b-stage__note p-hand">~400 г · 1–2 особи · готово від 1 дня</p>
        </div>
        <div class="b-panel">
          <div class="b-group">
            <p class="c-label"><b>01</b> Напис</p>
            <input class="b-input" type="text" maxlength="25" data-text value="${esc(st.text)}" placeholder="Ваш напис">
            <div class="b-ideas">${["З днем народження!", "Ти — мій торт", "Happy B-day", "Love you", "Просто так ♥", "Шеф, ти топ", "Я тебе 🍒"].map((t) => `<button type="button" data-idea="${esc(t)}">${esc(t)}</button>`).join("")}</div>
            <div class="b-fonts">${Object.entries(fonts).map(([id, [n, ff]]) => `<button type="button" class="b-font${id === st.font ? " is-on" : ""}" data-font="${id}" aria-pressed="${id === st.font}" style="font-family:${ff}">${n}</button>`).join("")}</div>
          </div>
          <div class="b-group">
            <p class="c-label"><b>02</b> Колір крему</p>
            <div class="c-swatches">${Object.entries(colors).map(([id, hex]) => `<button type="button" class="c-swatch${id === st.color ? " is-on" : ""}" data-color="${id}" aria-pressed="${id === st.color}" aria-label="Колір ${id}" style="--c:${hex}"></button>`).join("")}</div>
          </div>
          <div class="b-group">
            <p class="c-label"><b>03</b> Начинка</p>
            <div class="c-grid c-grid--2">${flavors.map((id) => { const f = flavorById(id); return `<button type="button" class="c-opt${id === st.flavor ? " is-on" : ""}" data-flavor="${id}" aria-pressed="${id === st.flavor}">${stripesHTML(id)}<b>${esc(f.name)}</b></button>`; }).join("")}</div>
          </div>
          <div class="b-group">
            <p class="c-label"><b>04</b> Декор</p>
            <div class="c-grid c-grid--3">${M().bentoDecor.map((d) => `<button type="button" class="c-opt${d.id === st.decor ? " is-on" : ""}" data-decor="${d.id}" aria-pressed="${d.id === st.decor}"><b>${d.name.replace(" декор", "")} <span>+€${d.price}</span></b><small>${d.note}</small></button>`).join("")}</div>
          </div>
          <div class="b-total">
            <div><small>База €${M().bentoBase} + декор</small><b data-price2></b></div>
            <button type="button" class="p-btn p-btn--big" data-add><span>Запакувати в кошик</span></button>
          </div>
        </div>
      </div>`;

    function svg() {
      const c = colors[st.color];
      const dark = isDark(c);
      const pip = dark ? "#f5bcc8" : "#ffffff";
      const ink = dark ? "#f5bcc8" : "#6d0809";
      const [, ff, fs0] = fonts[st.font];
      const words = st.text.trim();
      // wrap into up to 2 lines
      let l1 = words, l2 = "";
      if (words.length > 12) {
        const mid = words.lastIndexOf(" ", Math.ceil(words.length / 2) + 2);
        if (mid > 0) { l1 = words.slice(0, mid); l2 = words.slice(mid + 1); }
      }
      const longest = Math.max(l1.length, l2.length, 1);
      const fs = Math.min(fs0, (fs0 * 11) / Math.max(longest, 8) * (st.font === "bold" ? 1 : 1.05));
      let piping = "";
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        piping += `<circle cx="${(180 + Math.cos(a) * 121).toFixed(1)}" cy="${(180 + Math.sin(a) * 121).toFixed(1)}" r="10" fill="${pip}" stroke="${shade(c, -0.12)}" stroke-width="1"/>`;
      }
      let deco = "";
      const r = rng(5);
      if (st.decor !== "light") {
        const cols = ["#6d0809", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff", "#9ed9b8"];
        for (let i = 0; i < 26; i++) {
          const a = r() * Math.PI * 2, d = 70 + r() * 32;
          deco += `<rect x="${(180 + Math.cos(a) * d).toFixed(1)}" y="${(180 + Math.sin(a) * d).toFixed(1)}" width="3" height="10" rx="1.5" fill="${cols[i % cols.length]}" transform="rotate(${(r() * 180) | 0} ${(180 + Math.cos(a) * d).toFixed(1)} ${(180 + Math.sin(a) * d).toFixed(1)})"/>`;
        }
      }
      if (st.decor === "complex") {
        deco += `<image href="${CHERRY()}" x="218" y="64" width="78" height="78"/><g transform="translate(92 238) rotate(-14)"><path d="M0,0 c-26,-18 -26,18 0,0 c26,-18 26,18 0,0" fill="${dark ? "#f5bcc8" : "#6d0809"}"/><circle r="5" fill="${dark ? "#fff" : "#f5bcc8"}"/></g>`;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          deco += `<path d="M${(180 + Math.cos(a) * 100).toFixed(1)},${(180 + Math.sin(a) * 100).toFixed(1)} l3,-6 l3,6 l-3,6z" fill="#e3b94a"/>`;
        }
      }
      const ty = l2 ? 180 - fs * 0.25 : 180 + fs * 0.33;
      return `<svg viewBox="0 0 360 360" role="img" aria-label="Бенто з написом ${esc(words)}">
        <defs><radialGradient id="b-top" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="${shade(c, 0.07)}"/><stop offset="1" stop-color="${shade(c, -0.05)}"/></radialGradient></defs>
        <circle cx="180" cy="186" r="134" fill="rgba(61,4,5,.18)"/>
        <circle cx="180" cy="180" r="132" fill="url(#b-top)"/>
        ${deco}${piping}
        <text text-anchor="middle" font-family="${ff}" font-size="${fs.toFixed(1)}" font-weight="${st.font === "bold" ? 800 : 400}" fill="${ink}" letter-spacing="${st.font === "bold" ? "-0.5" : "0"}">
          <tspan x="180" y="${ty.toFixed(1)}">${esc(l1)}</tspan>${l2 ? `<tspan x="180" dy="${(fs * 1.05).toFixed(1)}">${esc(l2)}</tspan>` : ""}
        </text>
      </svg>`;
    }

    function paint(full) {
      qs("[data-cake]", root).innerHTML = svg();
      qs("[data-price]", root).textContent = formatEUR(price());
      qs("[data-price2]", root).textContent = formatEUR(price());
      const tag = qs("[data-price-tag]", root);
      tag.classList.remove("is-bump");
      void tag.offsetWidth;
      tag.classList.add("is-bump");
      if (full) {
        [["data-flavor", "flavor"], ["data-color", "color"], ["data-decor", "decor"], ["data-font", "font"]].forEach(([a, k]) =>
          qsa(`[${a}]`, root).forEach((b) => { const on = b.getAttribute(a) === st[k]; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); }));
      }
    }

    root.addEventListener("click", (e) => {
      for (const [a, k] of [["data-flavor", "flavor"], ["data-color", "color"], ["data-decor", "decor"], ["data-font", "font"]]) {
        const b = e.target.closest(`[${a}]`);
        if (b) { st[k] = b.getAttribute(a); return paint(true); }
      }
      const idea = e.target.closest("[data-idea]");
      if (idea) {
        st.text = idea.dataset.idea;
        qs("[data-text]", root).value = st.text;
        return paint();
      }
      if (e.target.closest("[data-add]")) {
        const box = qs("[data-box]", root);
        box.classList.add("is-closed");
        const f = flavorById(st.flavor);
        setTimeout(() => {
          addToCartAndNotify({ id: "bento", name: "Бенто-торт", price: price(), flavor: st.flavor, variant: `${st.color}-${st.font}-${st.text}`, image: M().img("pink"), meta: `${f.name} · ${decorObj().name.toLowerCase()} · напис «${st.text || "без напису"}»` }, box);
        }, reduce ? 0 : 700);
        setTimeout(() => box.classList.remove("is-closed"), reduce ? 400 : 2200);
      }
    });
    qs("[data-text]", root).addEventListener("input", (e) => { st.text = e.target.value; paint(); });
    paint(true);
  };

  /* ═════════════ Flavors ═════════════ */
  window.renderFlavors = function () {
    const host = qs("#flavors-grid");
    if (!host || !M()) return;
    const moodsHost = qs("#flavor-moods");
    let mood = "all";
    const dots = (n, kind) => `<span class="f-meter" aria-label="${kind}: ${n} з 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
    const counts = {};
    M().moods.forEach((m) => (counts[m.id] = M().flavors.filter((f) => m.id === "all" || metaOf(f.id).moods.includes(m.id)).length));

    function paint(anim) {
      moodsHost.innerHTML = stickers(M().moods, mood, "data-mood", counts);
      const list = M().flavors.map((f, i) => [f, i]).filter(([f]) => mood === "all" || metaOf(f.id).moods.includes(mood));
      host.innerHTML = list.map(([f, i]) => {
        const m = metaOf(f.id);
        return `
        <article class="f-card" style="--tone:${m.tone}" data-tilt>
          <div class="f-card__media"><img src="${M().img(m.img)}" alt="${esc(f.name)}" loading="lazy"><span class="f-card__n">${pad(i + 1)}</span></div>
          ${stripesHTML(f.id, "p-stripes--slice")}
          <div class="f-card__body">
            <h3>${esc(f.name)}</h3>
            <p>${esc(f.desc)}</p>
            <div class="f-card__meters"><span>солодкість ${dots(m.sweet, "солодкість")}</span><span>кислинка ${dots(m.sour, "кислинка")}</span></div>
            <a class="p-link" href="constructor.html?flavor=${f.id}&step=1">Зібрати торт з цим смаком →</a>
          </div>
        </article>`;
      }).join("");
      motion().reveal(host);
      if (anim) motion().stagger(qsa(".f-card", host));
      motion().refresh();
    }
    moodsHost.addEventListener("click", (e) => {
      const b = e.target.closest("[data-mood]");
      if (!b) return;
      mood = b.dataset.mood;
      paint(true);
    });
    paint(false);

    // Quiz
    const quiz = qs("#flavor-quiz");
    if (quiz) {
      const Q = [
        { q: "Шоколад чи ягоди?", a: [["🍫 Шоколад", { choc: 2 }], ["🍓 Ягоди", { berry: 2 }], ["💞 І те, і те", { choc: 1, berry: 1 }]] },
        { q: "Який настрій у свята?", a: [["☁️ Легкий", { light: 2 }], ["🔥 Насичений", { choc: 1, nut: 1, caramel: 1 }], ["🥜 Горіховий", { nut: 2 }]] },
        { q: "Кислинка — так чи ні?", a: [["🍋 Так!", { sour: 1 }], ["🍯 Краще солодше", { sweet: 1 }]] },
      ];
      let i = 0;
      let score = {};
      const draw = () => {
        if (i < Q.length) {
          quiz.innerHTML = `
            <p class="q-step">Питання ${i + 1} / ${Q.length}</p>
            <div class="q-bar"><i style="transform:scaleX(${i / Q.length})"></i></div>
            <h3 class="q-title">${Q[i].q}</h3>
            <div class="q-answers">${Q[i].a.map(([l], k) => `<button type="button" class="p-sticker" data-ans="${k}" style="--r:${[-3, 2, -1][k]}deg">${l}</button>`).join("")}</div>`;
        } else {
          const best = M().flavors.map((f) => {
            const m = metaOf(f.id);
            let s = m.moods.reduce((t, x) => t + (score[x] || 0), 0);
            s += score.sour ? m.sour * 0.3 : 0;
            s += score.sweet ? m.sweet * 0.3 : 0;
            return [f, s];
          }).sort((a, b) => b[1] - a[1])[0][0];
          const m = metaOf(best.id);
          quiz.innerHTML = `
            <p class="q-step">Ваш смак ✦</p>
            <div class="q-result">
              <img src="${M().img(m.img)}" alt="">
              <div>
                <h3 class="q-title">${esc(best.name)}</h3>
                <p>${esc(best.desc)}</p>
                <div class="q-actions"><a class="p-btn" href="constructor.html?flavor=${best.id}&step=1"><span>Зібрати торт</span></a><button type="button" class="p-link" data-restart>Пройти ще раз ↻</button></div>
              </div>
            </div>`;
          motion().burst(quiz.closest("[data-sprinkles]"), quiz.offsetWidth / 2, 120, 80);
        }
        if (motion().live) gsap.from(quiz.children, { y: 20, opacity: 0, duration: 0.6, stagger: 0.06, ease: "expo.out" });
      };
      quiz.addEventListener("click", (e) => {
        const a = e.target.closest("[data-ans]");
        if (a) {
          Object.entries(Q[i].a[+a.dataset.ans][1]).forEach(([k, v]) => (score[k] = (score[k] || 0) + v));
          i++;
          draw();
        }
        if (e.target.closest("[data-restart]")) { i = 0; score = {}; draw(); }
      });
      draw();
    }

    // Tasting set: 9 mini trifles
    const cups = qs("#tasting-cups");
    if (cups) {
      cups.innerHTML = M().flavors.map((f) => `<div class="t-cup" title="${esc(f.name)}" data-pop>${metaOf(f.id).layers.map((c) => `<i style="background:${c}"></i><i class="is-cream"></i>`).join("")}<span>${esc(f.name)}</span></div>`).join("");
      motion().reveal(cups.parentElement);
      qs("#tasting-add")?.addEventListener("click", (e) => {
        const d = M().desserts.find((x) => x.id === "trifle-set");
        addToCartAndNotify({ id: d.id, name: d.name, price: d.price, image: d.image, dessert: true, meta: d.unit }, e.currentTarget);
      });
    }
  };

  /* ═════════════ Price calculator ═════════════ */
  window.renderPriceCalc = function () {
    const root = qs("#price-calc");
    if (!root || !M()) return;
    const decor = { light: ["Легкий", 0], medium: ["Середній", 25], complex: ["Складний", 60], sculpt: ["Скульптура", 120] };
    const st = { guests: 16, grams: 175, decor: "medium", urgent: false, delivery: false };
    root.innerHTML = `
      <div class="pc-panel">
        <label class="pc-row"><span>Скільки гостей?</span><output data-g-out>16</output></label>
        <input class="pc-range" type="range" min="2" max="80" value="16" data-guests aria-label="Кількість гостей">
        <div class="pc-scale" aria-hidden="true"><span>2</span><span>20</span><span>40</span><span>60</span><span>80</span></div>
        <p class="c-label">Формат свята</p>
        <div class="c-grid c-grid--2">
          <button type="button" class="c-opt" data-grams="150"><b>Бенкет</b><small>150 г на гостя — торт після вечері</small></button>
          <button type="button" class="c-opt is-on" data-grams="175"><b>Свято</b><small>175 г — торт як головний десерт</small></button>
          <button type="button" class="c-opt" data-grams="200"><b>Солодкий стіл</b><small>200 г — для ласунів</small></button>
          <button type="button" class="c-opt" data-grams="120"><b>+ Candy bar</b><small>120 г — якщо є інші десерти</small></button>
        </div>
        <p class="c-label">Складність декору</p>
        <div class="c-chips">${Object.entries(decor).map(([id, [n, a]]) => `<button type="button" class="p-sticker${id === st.decor ? " is-on" : ""}" data-decor="${id}">${n}${a ? ` <sup>+€${a}</sup>` : ""}</button>`).join("")}</div>
        <div class="pc-toggles">
          <label class="pc-switch"><input type="checkbox" data-urgent><i></i><span>Терміново — на завтра <small>+20%</small></span></label>
          <label class="pc-switch"><input type="checkbox" data-delivery><i></i><span>Доставка по NL <small>окремий розрахунок</small></span></label>
        </div>
      </div>
      <div class="c-receipt pc-receipt" aria-live="polite" data-receipt></div>`;

    const paint = () => {
      const kg = (st.guests * st.grams) / 1000;
      const size = M().sizes.find((s) => s.id !== "tier" && parseFloat(s.id) >= kg) || M().sizes.find((s) => s.id === "tier");
      const base = Math.round(95 * size.priceMult);
      const dec = decor[st.decor][1];
      const sub = base + dec;
      const urg = st.urgent ? Math.round(sub * 0.2) : 0;
      const total = sub + urg;
      qs("[data-g-out]", root).textContent = st.guests;
      qs("[data-receipt]", root).innerHTML = `
        <p class="c-receipt__head">Ваш розрахунок</p>
        <div class="pc-big"><span>потрібно</span><b>${kg.toFixed(1).replace(".", ",")} кг</b><span>→ торт ${size.label}</span></div>
        <div class="c-receipt__row"><span>Основа ${size.label} (${size.serves})</span><i></i><b>${formatEUR(base)}</b></div>
        <div class="c-receipt__row"><span>Декор: ${decor[st.decor][0].toLowerCase()}</span><i></i><b>${dec ? formatEUR(dec) : "вкл."}</b></div>
        ${st.urgent ? `<div class="c-receipt__row"><span>Терміновість +20%</span><i></i><b>${formatEUR(urg)}</b></div>` : ""}
        <div class="c-receipt__row"><span>${st.delivery ? "Доставка" : "Самовивіз Alkmaar"}</span><i></i><b>${st.delivery ? "за розрахунком" : "€0"}</b></div>
        <div class="c-receipt__total"><span>Від</span><b>${formatEUR(total)}</b></div>
        <p class="c-receipt__foot">≈ ${formatEUR(total / st.guests)} на гостя · фінал — після погодження дизайну</p>
        <a class="p-btn p-btn--block" href="constructor.html?size=${size.id}&decor=${st.decor}"><span>Зібрати такий торт →</span></a>`;
    };
    root.addEventListener("input", (e) => {
      if (e.target.matches("[data-guests]")) { st.guests = +e.target.value; paint(); }
    });
    root.addEventListener("change", (e) => {
      if (e.target.matches("[data-urgent]")) st.urgent = e.target.checked;
      if (e.target.matches("[data-delivery]")) st.delivery = e.target.checked;
      paint();
    });
    root.addEventListener("click", (e) => {
      const g = e.target.closest("[data-grams]");
      const d = e.target.closest("[data-decor]");
      if (g) { st.grams = +g.dataset.grams; qsa("[data-grams]", root).forEach((b) => b.classList.toggle("is-on", b === g)); paint(); }
      if (d) { st.decor = d.dataset.decor; qsa("[data-decor]", root).forEach((b) => b.classList.toggle("is-on", b === d)); paint(); }
    });
    paint();
  };

  window.renderPriceFactors = function () {
    const host = qs("#price-factors");
    if (!host || !M()) return;
    const tints = ["#f5bcc8", "#fbe6b8", "#ffffff", "#bcd6f3", "#e9c6f0"];
    host.innerHTML = M().priceFactors.map((f, i) => `
      <article class="pf-card" style="--c:${tints[i % tints.length]};--r:${[-2, 1.5, -1, 2, -1.5][i % 5]}deg" data-up>
        <span class="pf-card__n">${pad(i + 1)}</span>
        <h3>${esc(f.title)}</h3>
        <p>${esc(f.text)}</p>
      </article>`).join("");
  };

  /* ═════════════ Desserts / candy bar ═════════════ */
  window.renderDesserts = function () {
    const host = qs("#desserts-grid");
    if (!host || !M()) return;
    const tabs = qs("#dessert-cats");
    const tray = qs("#tray");
    let cat = "all";
    const sel = {};
    const counts = {};
    M().dessertCats.forEach((c) => (counts[c.id] = M().desserts.filter((d) => c.id === "all" || d.cat === c.id).length));

    function paintTray() {
      const items = Object.entries(sel).filter(([, q]) => q > 0).map(([id, q]) => [M().desserts.find((d) => d.id === id), q]);
      const n = items.reduce((s, [, q]) => s + q, 0);
      const total = items.reduce((s, [d, q]) => s + d.price * q, 0);
      tray.classList.toggle("is-on", n > 0);
      tray.setAttribute("aria-hidden", String(n === 0));
      qs("[data-tray-imgs]", tray).innerHTML = items.slice(0, 6).map(([d]) => `<img src="${d.image}" alt="">`).join("");
      qs("[data-tray-n]", tray).textContent = `${n} ${n === 1 ? "позиція" : n > 1 && n < 5 ? "позиції" : "позицій"}`;
      qs("[data-tray-total]", tray).textContent = formatEUR(total);
    }
    function paint(anim) {
      tabs.innerHTML = stickers(M().dessertCats, cat, "data-dcat", counts);
      const list = M().desserts.filter((d) => cat === "all" || d.cat === cat);
      host.innerHTML = list.map((d) => `
        <article class="d-card${sel[d.id] ? " is-picked" : ""}" data-id="${d.id}">
          <div class="d-card__media"><img src="${d.image}" alt="${esc(d.name)}" loading="lazy"><span class="d-card__unit">${esc(d.unit)}</span></div>
          <div class="d-card__body">
            <h3>${esc(d.name)}</h3>
            <p>${esc(d.desc)}</p>
            <div class="d-card__row">
              <b>${formatEUR(d.price)}</b>
              <div class="qty qty--big" aria-label="Кількість ${esc(d.name)}"><button type="button" data-dq="-" aria-label="Менше">−</button><span data-q>${sel[d.id] || 0}</span><button type="button" data-dq="+" aria-label="Більше">+</button></div>
            </div>
          </div>
        </article>`).join("");
      motion().reveal(host);
      if (anim) motion().stagger(qsa(".d-card", host));
      motion().refresh();
    }
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("[data-dcat]");
      if (!b) return;
      cat = b.dataset.dcat;
      paint(true);
    });
    host.addEventListener("click", (e) => {
      const b = e.target.closest("[data-dq]");
      if (!b) return;
      const card = b.closest(".d-card");
      const id = card.dataset.id;
      sel[id] = Math.max(0, Math.min(20, (sel[id] || 0) + (b.dataset.dq === "+" ? 1 : -1)));
      qs("[data-q]", card).textContent = sel[id];
      card.classList.toggle("is-picked", sel[id] > 0);
      if (b.dataset.dq === "+") {
        const q = qs("[data-q]", card);
        q.classList.remove("is-bump"); void q.offsetWidth; q.classList.add("is-bump");
      }
      paintTray();
    });
    qs("[data-tray-add]", tray).addEventListener("click", (e) => {
      const items = Object.entries(sel).filter(([, q]) => q > 0);
      if (!items.length) return;
      items.forEach(([id, q]) => {
        const d = M().desserts.find((x) => x.id === id);
        MaridayCart.add({ id: d.id, name: d.name, price: d.price, qty: q, image: d.image, dessert: true, meta: d.unit });
      });
      flyToCart(e.currentTarget, M().desserts.find((x) => x.id === items[0][0]).image);
      showToast("Солодкий стіл у кошику!", { label: "Відкрити", run: () => window.openCartDrawer?.() });
      Object.keys(sel).forEach((k) => (sel[k] = 0));
      paint(false);
      paintTray();
    });
    qs("[data-tray-clear]", tray).addEventListener("click", () => {
      Object.keys(sel).forEach((k) => (sel[k] = 0));
      paint(false);
      paintTray();
    });
    paint(false);
    paintTray();
  };

  // Delivery, contacts, FAQ and about live in js/info-pages.js

  /* ═════════════ Legal: table of contents + active section ═════════════ */
  window.renderLegal = function () {
    const art = qs(".lg-doc");
    const toc = qs("#lg-toc");
    if (!art || !toc) return;
    const hs = qsa("h2", art);
    hs.forEach((h, i) => {
      h.id = h.id || `s${i + 1}`;
      h.insertAdjacentHTML("afterbegin", `<span class="lg-doc__n">${pad(i + 1)}</span>`);
    });
    toc.innerHTML = hs.map((h, i) => `<a href="#${h.id}" data-toc="${h.id}"><b>${pad(i + 1)}</b>${esc(h.textContent.replace(/^\d+\.?\s*/, "").replace(/^\d{2}/, "").trim())}</a>`).join("");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) qsa("[data-toc]", toc).forEach((a) => a.classList.toggle("is-on", a.dataset.toc === en.target.id));
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    hs.forEach((h) => io.observe(h));
  };

  MARIDAY.onReady(() => {
    const page = document.body.dataset.page;
    const run = {
      cakes: [renderCatalog],
      product: [renderProduct],
      flavors: [renderFlavors],
      desserts: [renderDesserts],
      constructor: [renderConstructor],
      bento: [renderBento],
      price: [renderPriceFactors, renderPriceCalc],
      legal: [renderLegal],
    }[page];
    (run || []).forEach((fn) => fn());
  });
})();
