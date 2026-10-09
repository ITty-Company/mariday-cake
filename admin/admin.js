/* Mariday admin panel: every collection of the site (cakes, desserts, flavours, sizes, FAQ, reviews, contacts…),
   the photos, and a door into editing any page right on the site.
   Changes are saved as soon as you press «Зберегти» in a card — the site picks them up on the next page load. */
(function () {
  const M = window.MARIDAY;
  const S = M.store;
  const app = document.getElementById("app");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (v) => JSON.parse(JSON.stringify(v ?? null));
  const pad = (n) => String(n).padStart(2, "0");
  const CHERRY = "../img/cakes/cherries.png";
  const PHOTOS = ["berries", "blackoreo", "brownie", "cherrycup", "cherrymint", "cherrypair", "choccup", "cookie", "cupcakes", "donuts", "drip", "forest", "fraisier", "gold", "lilac", "macarons", "meringue", "mint", "mousse", "oreo", "pastel", "pink", "pinkmac", "piping", "pour", "raspberries", "redvelvet", "roses", "slice", "strawberries", "strawslice", "swirl", "tiramisu", "vanilla", "yellow"];
  const src = (v) => (v ? M.img(v) : "");

  // ── what each part of the site is made of
  const opt = (key, skip = "all") => () => (data[key] || []).filter((o) => o.id !== skip).map((o) => ({ v: o.id, l: o.label || o.name }));
  const SCHEMA = {
    cakes: {
      title: "Торти", icon: "🎂", hint: "Каталог, сторінка торта, вітрина «Обрані роботи» на головній (перші 8 за порядком). Перетягуйте картки, щоб змінити порядок.",
      cards: true, title1: (c) => c.name, sub: (c) => `від €${c.price ?? "—"} · ${c.days ?? "?"} дн.`, photo: (c) => c.img,
      link: (c) => `../pages/product.html?id=${encodeURIComponent(c.id)}`,
      blank: () => ({ name: "", price: 150, img: "", cats: ["all"], tags: [], days: 5, desc: "" }),
      fields: [
        { k: "name", t: "text", l: "Назва", req: true },
        { k: "img", t: "image", l: "Фото", hint: "Квадратне або горизонтальне фото торта — для каталогу й сторінки торта." },
        { k: "cutout", t: "image", l: "Фото без фону — для вітрини на головній", hint: "PNG або WebP з прозорим фоном (напр. з remove.bg). Без нього на вітрині стоїть звичайне фото в рамці.", cut: true },
        { row: [{ k: "price", t: "number", l: "Ціна від, €" }, { k: "days", t: "number", l: "Замовляти за, днів" }] },
        { k: "desc", t: "textarea", l: "Опис" },
        { k: "cats", t: "multi", l: "Для кого / привід (фільтри каталогу)", opts: opt("categories") },
        { k: "tags", t: "chips", l: "Теги", hint: "Enter після кожного тегу" },
        { sep: "Вітрина" },
        { row: [{ k: "bg", t: "color", l: "Колір кімнати" }, { k: "accent", t: "color", l: "Акцент" }] },
        { sep: "Додатково" },
        { k: "id", t: "slug", l: "Адреса сторінки", from: "name", hint: "product.html?id=… Змінюйте обережно: старі посилання перестануть працювати." },
        { k: "hidden", t: "bool", l: "Сховати з сайту (залишиться тут)" },
      ],
      fix: (c) => { c.cats = [...new Set(["all", ...(c.cats || [])])]; },
    },
    desserts: {
      title: "Десерти", icon: "🧁", hint: "Сторінка «Десерти і candy bar».", cards: true,
      title1: (d) => d.name, sub: (d) => `€${d.price ?? "—"} · ${d.unit || ""}`, photo: (d) => d.img,
      blank: () => ({ name: "", price: 30, img: "", cat: "sets", unit: "", desc: "" }),
      fields: [
        { k: "name", t: "text", l: "Назва", req: true },
        { k: "img", t: "image", l: "Фото" },
        { row: [{ k: "price", t: "number", l: "Ціна, €" }, { k: "unit", t: "text", l: "Фасування", ph: "6 шт / 10–15 гостей" }] },
        { k: "cat", t: "select", l: "Розділ", opts: opt("dessertCats") },
        { k: "desc", t: "textarea", l: "Опис" },
        { sep: "Додатково" },
        { k: "id", t: "slug", l: "Код", from: "name" },
        { k: "hidden", t: "bool", l: "Сховати з сайту" },
      ],
    },
    flavors: {
      title: "Начинки", icon: "🍒", hint: "Карта смаків, вибір начинки в торті, конструктор, дегустація на головній.", cards: true,
      title1: (f) => f.name, sub: (f) => (f.desc || "").slice(0, 60) + "…", photo: (f) => (data.flavorMeta[f.id] || {}).img,
      blank: () => ({ name: "", desc: "" }),
      fields: [
        { k: "name", t: "text", l: "Назва", req: true },
        { k: "desc", t: "textarea", l: "Склад і опис", hint: "Шари через кому, потім крапка і настрій: «Шоколадний бісквіт, кремчиз, карамель. Насичено й текстурно.»" },
        { k: "meta.img", t: "image", l: "Фото розрізу" },
        { sep: "Як виглядає розріз" },
        { k: "meta.tone", t: "color", l: "Головний колір" },
        { k: "meta.layers", t: "colors", l: "Шари знизу вгору" },
        { k: "meta.moods", t: "multi", l: "Настрій (фільтри карти смаків)", opts: opt("moods") },
        { row: [{ k: "meta.sweet", t: "range", l: "Солодкість", min: 1, max: 5 }, { k: "meta.sour", t: "range", l: "Кислинка", min: 1, max: 5 }] },
        { sep: "Додатково" },
        { k: "id", t: "slug", l: "Код", from: "name" },
        { k: "hidden", t: "bool", l: "Сховати з сайту" },
      ],
      metaDefault: () => ({ img: "slice", tone: "#f5bcc8", layers: ["#f0dca0", "#f7efe6", "#c2263f"], moods: [], sweet: 3, sour: 3 }),
    },
    sizes: {
      title: "Вага і порції", icon: "⚖️", hint: "Кнопки ваги на сторінці торта. Ціна = ціна торта × множник.",
      title1: (s) => s.label, sub: (s) => `${s.serves} · ×${s.priceMult}`,
      blank: () => ({ label: "", serves: "", priceMult: 1 }),
      fields: [
        { row: [{ k: "label", t: "text", l: "Назва", ph: "2 кг", req: true }, { k: "serves", t: "text", l: "Скільки гостей", ph: "10–12 осіб" }] },
        { k: "priceMult", t: "number", l: "Множник ціни", step: 0.05, hint: "1 = базова ціна, 1.25 = на 25% дорожче" },
        { k: "id", t: "slug", l: "Код", from: "label" },
      ],
    },
    bentoDecor: {
      title: "Бенто", icon: "🍱", hint: "Калькулятор на сторінці «Бенто».",
      title1: (d) => d.name, sub: (d) => `+€${d.price} · ${d.note || ""}`,
      blank: () => ({ name: "", price: 10, note: "" }),
      fields: [
        { row: [{ k: "name", t: "text", l: "Рівень декору", req: true }, { k: "price", t: "number", l: "Доплата, €" }] },
        { k: "note", t: "text", l: "Що входить" },
        { k: "id", t: "slug", l: "Код", from: "name" },
      ],
      extra: "bentoBase",
    },
    faq: {
      title: "FAQ — головні", icon: "❓", hint: "Перші питання на сторінці FAQ і в чат-помічнику.",
      title1: (q) => q.q, sub: (q) => q.a, tag: (q) => (data.faqCats.find((c) => c.id === q.cat) || {}).label,
      blank: () => ({ cat: "order", q: "", a: "" }),
      fields: [
        { k: "cat", t: "select", l: "Розділ", opts: opt("faqCats") },
        { k: "q", t: "text", l: "Питання", req: true },
        { k: "a", t: "textarea", l: "Відповідь" },
        { k: "hidden", t: "bool", l: "Сховати з сайту" },
      ],
    },
    faqMore: { title: "FAQ — база знань", icon: "📚", hint: "Решта питань: база знань і чат-помічник." },
    reviews: {
      title: "Відгуки", icon: "💌", hint: "Листівки на головній і стіна відгуків. «Приклад» = ще не справжній відгук (на сайті з'являється позначка).", cards: true,
      title1: (r) => r.name, sub: (r) => `${"★".repeat(r.stars || 5)} · ${r.occasion || ""}`, photo: (r) => r.img,
      blank: () => ({ name: "", city: "", occasion: "День народження", product: "", stars: 5, img: "", text: "" }),
      fields: [
        { row: [{ k: "name", t: "text", l: "Ім'я", req: true }, { k: "city", t: "text", l: "Місто" }] },
        { row: [{ k: "occasion", t: "text", l: "Привід" }, { k: "product", t: "text", l: "Що замовляли" }] },
        { k: "stars", t: "range", l: "Оцінка", min: 1, max: 5 },
        { k: "text", t: "textarea", l: "Текст відгуку" },
        { k: "img", t: "image", l: "Фото (марка на листівці)" },
        { k: "sample", t: "bool", l: "Це приклад, а не справжній відгук" },
        { k: "hidden", t: "bool", l: "Сховати з сайту" },
      ],
    },
    priceFactors: {
      title: "З чого ціна", icon: "🧾", hint: "Сторінка «З чого складається ціна».",
      title1: (f) => f.title, sub: (f) => f.text, blank: () => ({ title: "", text: "" }),
      fields: [{ k: "title", t: "text", l: "Заголовок", req: true }, { k: "text", t: "textarea", l: "Пояснення" }],
    },
    categories: {
      title: "Приводи (каталог)", icon: "🏷️", hint: "Фільтри каталогу тортів. «Усі» має залишитись першим.",
      title1: (c) => c.label, sub: (c) => c.id, blank: () => ({ label: "" }),
      fields: [{ k: "label", t: "text", l: "Назва", req: true }, { k: "id", t: "slug", l: "Код", from: "label", hint: "Торти прив'язані до коду — після зміни перевірте торти." }],
    },
    dessertCats: { title: "Розділи десертів", icon: "🏷️", hint: "Фільтри на сторінці десертів." },
    moods: { title: "Настрої смаків", icon: "🏷️", hint: "Фільтри карти смаків." },
    faqCats: {
      title: "Розділи FAQ", icon: "🏷️", hint: "Вкладки на сторінці FAQ.",
      title1: (c) => `${c.emoji || ""} ${c.label}`, sub: (c) => c.id, blank: () => ({ label: "", emoji: "✦" }),
      fields: [{ row: [{ k: "emoji", t: "text", l: "Емодзі" }, { k: "label", t: "text", l: "Назва", req: true }] }, { k: "id", t: "slug", l: "Код", from: "label" }],
    },
    reviewOccasions: { title: "Приводи відгуків", icon: "🏷️", hint: "Вибір приводу у формі відгуку." },
    contacts: {
      title: "Контакти", icon: "☎️", hint: "Використовуються в шапці, футері, кошику й на сторінці контактів.", object: true,
      fields: [
        { row: [{ k: "whatsapp", t: "text", l: "WhatsApp (лише цифри)", ph: "31612345678" }, { k: "whatsappLabel", t: "text", l: "Як показувати номер" }] },
        { k: "email", t: "text", l: "Email" },
        { row: [{ k: "instagram", t: "text", l: "Instagram (посилання)" }, { k: "instagramHandle", t: "text", l: "Instagram (нік)" }] },
        { k: "city", t: "text", l: "Місто" },
        { row: [{ k: "hours.from", t: "number", l: "Працюємо з, год" }, { k: "hours.to", t: "number", l: "до, год" }] },
      ],
    },
  };
  // small id/label lists share one form
  ["dessertCats", "moods", "reviewOccasions"].forEach((k) => Object.assign(SCHEMA[k], {
    title1: (c) => c.label, sub: (c) => c.id, blank: () => ({ label: "" }),
    fields: [{ k: "label", t: "text", l: "Назва", req: true }, { k: "id", t: "slug", l: "Код", from: "label" }],
  }));
  Object.assign(SCHEMA.faqMore, { title1: SCHEMA.faq.title1, sub: SCHEMA.faq.sub, tag: SCHEMA.faq.tag, blank: SCHEMA.faq.blank, fields: SCHEMA.faq.fields });

  const NAV = [
    ["Вітрина", ["cakes", "desserts", "flavors", "sizes", "bentoDecor"]],
    ["Гостям", ["reviews", "faq", "faqMore", "priceFactors"]],
    ["Сайт", ["pages", "media", "contacts"]],
    ["Довідники", ["categories", "dessertCats", "moods", "faqCats", "reviewOccasions"]],
  ];
  const VIEWS = { pages: { title: "Сторінки", icon: "🖋️" }, media: { title: "Медіатека", icon: "🖼️" } };
  const PAGES = [
    ["index", "Головна"], ["pages/cakes", "Каталог тортів"], ["pages/product", "Сторінка торта"], ["pages/constructor", "Конструктор"],
    ["pages/bento", "Бенто"], ["pages/flavors", "Карта смаків"], ["pages/desserts", "Десерти і candy bar"], ["pages/weddings", "Весільні торти"],
    ["pages/cake-price", "З чого ціна"], ["pages/about", "Про нас"], ["pages/delivery", "Доставка і оплата"], ["pages/contacts", "Контакти"],
    ["pages/faq", "FAQ"], ["pages/reviews", "Відгуки"], ["pages/gift", "Сертифікат"], ["pages/corporate", "Для бізнесу"],
    ["pages/journal", "Журнал"], ["pages/journal-bento", "Журнал · написи на бенто"], ["pages/journal-candybar", "Журнал · candy bar"],
    ["pages/journal-flavors", "Журнал · начинки"], ["pages/journal-storage", "Журнал · зберігання"], ["pages/journal-wedding", "Журнал · весілля"],
    ["pages/journal-weight", "Журнал · вага"], ["pages/offer", "Публічна оферта"], ["pages/privacy", "Конфіденційність"],
  ];

  // ── state: a working copy of everything (defaults from data.js + what was saved)
  let data = {};
  let view = (location.hash.slice(1) || "cakes");

  // ── helpers
  function toast(msg, bad) {
    const t = document.createElement("div");
    t.className = "a-toast" + (bad ? " is-bad" : "");
    t.innerHTML = `<img src="${CHERRY}" alt=""><span>${esc(msg)}</span>`;
    document.body.append(t);
    setTimeout(() => t.remove(), bad ? 6000 : 2800);
  }
  const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const setPath = (o, p, v) => {
    const ks = p.split(".");
    let cur = o;
    ks.slice(0, -1).forEach((k) => { if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {}; cur = cur[k]; });
    cur[ks[ks.length - 1]] = v;
  };
  const uniqueId = (list, base, self) => {
    let id = S.slug(base) || "item";
    let n = 2;
    const taken = (x) => list.some((it) => it !== self && it.id === x);
    const root = id;
    while (taken(id)) id = `${root}-${n++}`;
    return id;
  };
  async function save(key, msg = "Збережено ✓") {
    try {
      await S.saveContent(key, data[key]);
      toast(S.live && !S.session.demo ? `${msg} Зміни вже на сайті.` : `${msg} (пробний режим — бачите лише ви)`);
      return true;
    } catch (e) { toast(e.message, true); return false; }
  }

  // ── login / setup
  function loginView() {
    app.className = "";
    app.innerHTML = `<div class="a-login">
      <div class="a-login__art">
        <div class="a-logo"><img src="${CHERRY}" alt="">Mariday<em>admin</em></div>
        <p class="a-login__big">Кухня<span>за вітриною</span></p>
      </div>
      <div class="a-login__form">
        <h1>Вхід в адмінку</h1>
        ${S.live ? `<p>Увійдіть email і паролем, які ви створили в Supabase (Authentication → Users).</p>
        <form data-login>
          <label class="a-field"><span>Email</span><input class="a-input" type="email" name="email" autocomplete="username" required></label>
          <label class="a-field"><span>Пароль</span><input class="a-input" type="password" name="password" autocomplete="current-password" required></label>
          <div class="a-login__err" data-err></div>
          <button class="a-btn" type="submit">Увійти</button>
        </form>` : `<p>Supabase ще не підключено, тому зміни нікуди зберігати для всіх відвідувачів.</p>
        <div class="a-setup"><b>Як підключити (≈5 хвилин)</b><ol>
          <li>Створіть безкоштовний проєкт на <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>.</li>
          <li>SQL Editor → вставте вміст файлу <code>supabase/setup.sql</code> → Run.</li>
          <li>Authentication → Users → Add user: ваш email і пароль. Додайте email у таблицю <code>admins</code> (останній рядок setup.sql).</li>
          <li>Project Settings → API: скопіюйте Project URL і anon key у <code>MARIDAY.backend</code> у файлі <code>js/data.js</code>.</li>
        </ol></div>
        <p>А поки можна все спробувати в пробному режимі — зміни побачите лише ви, у цьому браузері.</p>
        <button class="a-btn a-btn--pink" type="button" data-demo>Спробувати в пробному режимі</button>`}
      </div>
    </div>`;
    const form = $("[data-login]");
    if (form) form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("button", form);
      btn.disabled = true;
      $("[data-err]").textContent = "";
      try {
        await S.login(form.email.value.trim(), form.password.value);
        start();
      } catch (err) { $("[data-err]").textContent = err.message; }
      btn.disabled = false;
    });
    const demo = $("[data-demo]");
    if (demo) demo.addEventListener("click", () => { S.startDemo(); start(); });
  }

  // ── the shell
  async function start() {
    app.className = "a-boot";
    app.innerHTML = `<img src="${CHERRY}" alt="">`;
    let saved = {};
    try { saved = await S.loadContent(); }
    catch (e) {
      toast(e.message, true);
      if (/увійти|Сесія/.test(e.message)) return loginView();
    }
    data = {};
    M.contentKeys.forEach((k) => { data[k] = clone(k in saved ? saved[k] : M.defaults[k]); });
    shell();
  }

  function shell() {
    app.className = "a-shell";
    const live = S.live && !S.session.demo;
    app.innerHTML = `
      <aside class="a-side">
        <div class="a-logo"><img src="${CHERRY}" alt="">Mariday<em>admin</em></div>
        <nav class="a-nav">${NAV.map(([g, keys]) => `<h6>${g}</h6>${keys.map((k) => {
          const s = SCHEMA[k] || VIEWS[k];
          const n = Array.isArray(data[k]) ? `<b>${data[k].length}</b>` : "";
          return `<a href="#${k}" data-view="${k}"><i>${s.icon}</i>${s.title}${n}</a>`;
        }).join("")}`).join("")}</nav>
        <div class="a-side__foot">
          ${live ? '<span class="a-badge a-badge--live">● Сайт онлайн</span>' : '<span class="a-badge">Пробний режим</span>'}
          <small>${esc(S.email || "")}</small>
          <a class="a-btn a-btn--sm" href="../index.html" target="_blank" rel="noopener">Відкрити сайт ↗</a>
          <button class="a-btn a-btn--sm" type="button" data-logout>Вийти</button>
        </div>
      </aside>
      <main class="a-main" data-main></main>
      <div class="a-drawer" data-drawer><div class="a-drawer__veil" data-close></div><div class="a-drawer__box"></div></div>`;
    $("[data-logout]").addEventListener("click", async () => { await S.logout(); loginView(); });
    $$(".a-nav a").forEach((a) => a.addEventListener("click", () => app.classList.remove("is-menu")));
    $("[data-drawer]").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeDrawer(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
    renderView();
  }
  addEventListener("hashchange", () => { view = location.hash.slice(1) || "cakes"; if ($("[data-main]")) renderView(); });

  function head(title, sub, acts = "") {
    return `<div class="a-head">
      <div style="display:flex;gap:10px;align-items:flex-start"><button class="a-icon a-burger" type="button" data-burger aria-label="Меню">☰</button><h1>${esc(title)}<span>${esc(sub || "")}</span></h1></div>
      <div class="a-head__acts">${acts}</div>
    </div>`;
  }
  function counts() {
    $$(".a-nav a").forEach((a) => {
      a.classList.toggle("is-on", a.dataset.view === view);
      const b = $("b", a);
      if (b && Array.isArray(data[a.dataset.view])) b.textContent = data[a.dataset.view].length;
    });
  }

  function renderView() {
    const main = $("[data-main]");
    counts();
    if (view === "pages") return pagesView(main);
    if (view === "media") return mediaView(main);
    const s = SCHEMA[view];
    if (!s) { view = "cakes"; return renderView(); }
    if (s.object) return objectView(main, view, s);
    return listView(main, view, s);
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-burger]")) app.classList.toggle("is-menu"); });

  // ── a collection: cards (with photos) or rows
  function listView(main, key, s) {
    const list = data[key];
    const acts = `<button class="a-btn a-btn--ghost a-btn--sm" type="button" data-reset>↺ Стандартні</button><button class="a-btn" type="button" data-add>+ Додати</button>`;
    main.innerHTML = head(s.title, `${list.length} ${list.length === 1 ? "позиція" : "позицій"}`, acts)
      + `<p class="a-note">${esc(s.hint || "")}</p>`
      + (list.length > 8 ? `<div class="a-tools"><label class="a-search"><input class="a-input" type="search" placeholder="Пошук…" data-q></label></div>` : "")
      + (key === "bentoDecor" ? `<div class="a-panel" style="margin-bottom:18px"><label class="a-field"><span>Ціна бенто без декору, €</span><input class="a-input" type="number" min="0" step="1" value="${esc(data.bentoBase)}" data-base></label><div><button class="a-btn a-btn--sm" type="button" data-base-save>Зберегти ціну</button></div></div>` : "")
      + `<div class="${s.cards ? "a-grid" : "a-list"}" data-list></div>`;
    const host = $("[data-list]", main);
    const draw = (q = "") => {
      const ql = q.trim().toLowerCase();
      host.innerHTML = list.map((it, i) => {
        if (ql && !JSON.stringify(it).toLowerCase().includes(ql)) return "";
        const t = esc(s.title1(it) || "Без назви");
        const sub = esc(s.sub ? s.sub(it) : "");
        if (s.cards) {
          const ph = s.photo && s.photo(it);
          return `<article class="a-card${it.hidden ? " is-hidden" : ""}" draggable="true" data-i="${i}">
            <div class="a-card__pic">${ph ? `<img src="${esc(src(ph))}" alt="" loading="lazy">` : ""}${it.hidden ? "<span>сховано</span>" : it.sample ? "<span>приклад</span>" : ""}</div>
            <span class="a-card__no">${pad(i + 1)}</span>
            <div class="a-card__body"><b>${t}</b><small>${sub}</small></div>
            <span class="a-card__grip" title="Перетягніть">⠿</span>
          </article>`;
        }
        const tag = s.tag ? s.tag(it) : "";
        return `<div class="a-item${it.hidden ? " is-hidden" : ""}" draggable="true" data-i="${i}">
          <span class="a-item__grip" title="Перетягніть">⠿</span>
          <span class="a-item__main"><b>${t}</b><small>${sub}</small></span>
          ${tag ? `<span class="a-item__tag">${esc(tag)}</span>` : it.hidden ? '<span class="a-item__tag">сховано</span>' : ""}
        </div>`;
      }).join("") + (s.cards && !ql ? `<button class="a-card a-card--add" type="button" data-add><span><i>+</i>Додати</span></button>` : "");
    };
    draw();
    const q = $("[data-q]", main);
    if (q) q.addEventListener("input", () => draw(q.value));
    main.onclick = (e) => {
      if (e.target.closest("[data-add]")) return editItem(key, -1);
      const card = e.target.closest("[data-i]");
      if (card && !e.target.closest(".a-card__grip, .a-item__grip")) editItem(key, +card.dataset.i);
    };
    $("[data-reset]", main).addEventListener("click", async () => {
      if (!confirm(`Повернути «${s.title}» до стандартного вмісту сайту? Ваші зміни в цьому розділі буде втрачено.`)) return;
      try { await S.resetContent(key); data[key] = clone(M.defaults[key]); if (key === "flavors") { await S.resetContent("flavorMeta"); data.flavorMeta = clone(M.defaults.flavorMeta); } toast("Повернуто стандартні"); renderView(); }
      catch (err) { toast(err.message, true); }
    });
    const baseSave = $("[data-base-save]", main);
    if (baseSave) baseSave.addEventListener("click", () => { data.bentoBase = +$("[data-base]", main).value || 0; save("bentoBase"); });

    // drag to reorder; the order is the order on the site
    let from = null;
    host.addEventListener("dragstart", (e) => { const c = e.target.closest("[data-i]"); if (!c) return; from = +c.dataset.i; c.classList.add("is-drag"); e.dataTransfer.effectAllowed = "move"; });
    host.addEventListener("dragend", () => { $$(".is-drag, .is-over", host).forEach((n) => n.classList.remove("is-drag", "is-over")); });
    host.addEventListener("dragover", (e) => {
      const c = e.target.closest("[data-i]");
      if (from == null || !c) return;
      e.preventDefault();
      $$(".is-over", host).forEach((n) => n.classList.remove("is-over"));
      c.classList.add("is-over");
    });
    host.addEventListener("drop", async (e) => {
      const c = e.target.closest("[data-i]");
      if (from == null || !c) return;
      e.preventDefault();
      const to = +c.dataset.i;
      if (to !== from) {
        const [it] = list.splice(from, 1);
        list.splice(to, 0, it);
        draw(q ? q.value : "");
        await save(key, "Порядок збережено ✓");
      }
      from = null;
    });
  }

  // ── one object (contacts)
  function objectView(main, key, s) {
    main.innerHTML = head(s.title, "налаштування", `<button class="a-btn a-btn--ghost a-btn--sm" type="button" data-reset>↺ Стандартні</button>`)
      + `<p class="a-note">${esc(s.hint || "")}</p><form class="a-panel" data-form></form>`;
    const form = $("[data-form]", main);
    const work = clone(data[key]);
    form.append(buildFields(s.fields, work, key));
    const foot = document.createElement("div");
    foot.innerHTML = `<button class="a-btn" type="submit">Зберегти</button>`;
    form.append(foot);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      data[key] = work;
      await save(key);
    });
    $("[data-reset]", main).addEventListener("click", async () => {
      if (!confirm("Повернути стандартні контакти?")) return;
      try { await S.resetContent(key); data[key] = clone(M.defaults[key]); renderView(); toast("Повернуто стандартні"); } catch (err) { toast(err.message, true); }
    });
  }

  // ── form fields
  function buildFields(fields, obj, key) {
    const wrap = document.createDocumentFragment();
    fields.forEach((f) => {
      if (f.sep) {
        const p = document.createElement("p");
        p.className = "a-sep";
        p.textContent = f.sep;
        wrap.append(p);
      } else if (f.row) {
        const row = document.createElement("div");
        row.className = "a-row";
        f.row.forEach((ff) => row.append(field(ff, obj, key)));
        wrap.append(row);
      } else wrap.append(field(f, obj, key));
    });
    return wrap;
  }
  function field(f, obj, key) {
    const el = document.createElement("div");
    el.className = "a-field";
    const val = getPath(obj, f.k);
    const set = (v) => setPath(obj, f.k, v);
    const label = `<span>${esc(f.l)}${f.req ? " *" : ""}</span>`;
    const hint = f.hint ? `<small>${esc(f.hint)}</small>` : "";
    switch (f.t) {
      case "text":
      case "slug":
        el.innerHTML = `${label}<input class="a-input" type="text" value="${esc(val)}" placeholder="${esc(f.ph || "")}" ${f.req ? "required" : ""}>${hint}`;
        $("input", el).addEventListener("input", (e) => set(e.target.value));
        if (f.t === "slug") el.dataset.slug = f.from;
        break;
      case "number":
        el.innerHTML = `${label}<input class="a-input" type="number" step="${f.step || 1}" value="${esc(val)}">${hint}`;
        $("input", el).addEventListener("input", (e) => set(e.target.value === "" ? null : +e.target.value));
        break;
      case "textarea":
        el.innerHTML = `${label}<textarea class="a-textarea">${esc(val)}</textarea>${hint}`;
        $("textarea", el).addEventListener("input", (e) => set(e.target.value));
        break;
      case "bool":
        el.innerHTML = `<label class="a-check"><input class="a-switch" type="checkbox" ${val ? "checked" : ""}>${esc(f.l)}</label>${hint}`;
        $("input", el).addEventListener("change", (e) => set(e.target.checked || undefined));
        break;
      case "select": {
        const opts = f.opts();
        el.innerHTML = `${label}<select class="a-select">${opts.map((o) => `<option value="${esc(o.v)}" ${o.v === val ? "selected" : ""}>${esc(o.l)}</option>`).join("")}</select>${hint}`;
        $("select", el).addEventListener("change", (e) => set(e.target.value));
        if (val == null && opts[0]) set(opts[0].v);
        break;
      }
      case "multi": {
        const cur = new Set(val || []);
        el.innerHTML = `${label}<div class="a-opts">${f.opts().map((o) => `<label class="a-opt"><input type="checkbox" value="${esc(o.v)}" ${cur.has(o.v) ? "checked" : ""}><span>${esc(o.l)}</span></label>`).join("")}</div>${hint}`;
        el.addEventListener("change", () => set([...(val || []).filter((v) => !f.opts().some((o) => o.v === v)), ...$$("input:checked", el).map((i) => i.value)]));
        break;
      }
      case "chips": {
        const list = [...(val || [])];
        el.innerHTML = `${label}<div class="a-chips"></div>${hint}`;
        const box = $(".a-chips", el);
        const draw = () => {
          box.innerHTML = list.map((t, i) => `<span class="a-chip">${esc(t)}<button type="button" data-x="${i}" aria-label="Прибрати">×</button></span>`).join("") + `<input type="text" placeholder="новий тег…">`;
          const inp = $("input", box);
          inp.addEventListener("keydown", (e) => {
            if ((e.key === "Enter" || e.key === ",") && inp.value.trim()) { e.preventDefault(); list.push(inp.value.trim()); set([...list]); draw(); $("input", box).focus(); }
            if (e.key === "Backspace" && !inp.value && list.length) { list.pop(); set([...list]); draw(); $("input", box).focus(); }
          });
          inp.addEventListener("blur", () => { if (inp.value.trim()) { list.push(inp.value.trim()); set([...list]); draw(); } });
        };
        box.addEventListener("click", (e) => { const x = e.target.closest("[data-x]"); if (x) { list.splice(+x.dataset.x, 1); set([...list]); draw(); } });
        draw();
        break;
      }
      case "color":
        el.innerHTML = `${label}<div class="a-colors"><span class="a-color"><input type="color" value="${esc(val || "#f5bcc8")}"></span><small>${val ? esc(val) : "за замовчуванням"}</small></div>${hint}`;
        $("input", el).addEventListener("input", (e) => { set(e.target.value); $("small", el).textContent = e.target.value; });
        break;
      case "colors": {
        const list = [...(val || [])];
        el.innerHTML = `${label}<div class="a-colors"></div>${hint}`;
        const box = $(".a-colors", el);
        const draw = () => {
          box.innerHTML = list.map((c, i) => `<span class="a-color"><input type="color" value="${esc(c)}" data-c="${i}"><button type="button" data-x="${i}">×</button></span>`).join("") + `<button class="a-btn a-btn--ghost a-btn--sm" type="button" data-plus>+ шар</button>`;
        };
        box.addEventListener("input", (e) => { const i = e.target.dataset.c; if (i != null) { list[+i] = e.target.value; set([...list]); } });
        box.addEventListener("click", (e) => {
          if (e.target.closest("[data-plus]")) { list.push(list[list.length - 1] || "#f7efe6"); set([...list]); draw(); }
          const x = e.target.closest("[data-x]");
          if (x) { list.splice(+x.dataset.x, 1); set([...list]); draw(); }
        });
        draw();
        break;
      }
      case "range":
        el.innerHTML = `${label}<div class="a-range"><input type="range" min="${f.min}" max="${f.max}" value="${esc(val ?? f.max)}"><b>${esc(val ?? f.max)}</b></div>${hint}`;
        $("input", el).addEventListener("input", (e) => { set(+e.target.value); $("b", el).textContent = e.target.value; });
        if (val == null) set(f.max);
        break;
      case "image":
        photoField(el, f, val, set, label, hint);
        break;
    }
    return el;
  }

  // a photo: preview, upload (or drop a file onto it), choose from the library or the site's own photos
  function photoField(el, f, val, set, label, hint) {
    el.innerHTML = `${label}<div class="a-photo">
      <div class="a-photo__pic${f.cut ? " is-cut" : ""}">${val ? `<img src="${esc(src(val))}" alt="">` : "немає фото"}</div>
      <div class="a-photo__acts">
        <button class="a-btn a-btn--sm" type="button" data-up>Завантажити</button>
        <button class="a-btn a-btn--ghost a-btn--sm" type="button" data-lib>Вибрати</button>
        ${val ? '<button class="a-btn a-btn--danger a-btn--sm" type="button" data-rm>Прибрати</button>' : ""}
      </div></div>${hint}`;
    const pic = $(".a-photo__pic", el);
    const put = (v) => { set(v || undefined); photoField(el, f, v, set, label, hint); };
    const upload = async (file) => {
      if (!file) return;
      pic.classList.add("a-photo__busy");
      try { put(await S.upload(file, "uploads")); }
      catch (e) { toast(e.message, true); pic.classList.remove("a-photo__busy"); }
    };
    $("[data-up]", el).addEventListener("click", () => pickFile("image/*").then(upload));
    $("[data-lib]", el).addEventListener("click", () => picker().then((v) => v && put(v)));
    const rm = $("[data-rm]", el);
    if (rm) rm.addEventListener("click", () => put(""));
    pic.addEventListener("dragover", (e) => { e.preventDefault(); pic.classList.add("is-drop"); });
    pic.addEventListener("dragleave", () => pic.classList.remove("is-drop"));
    pic.addEventListener("drop", (e) => { e.preventDefault(); pic.classList.remove("is-drop"); upload(e.dataTransfer.files[0]); });
  }
  function pickFile(accept, multiple) {
    return new Promise((res) => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = accept;
      inp.multiple = !!multiple;
      inp.onchange = () => res(multiple ? [...inp.files] : inp.files[0] || null);
      inp.click();
    });
  }

  // the photo chooser: uploaded files or the photos the site came with
  function picker() {
    return new Promise((resolve) => {
      const m = document.createElement("div");
      m.className = "a-modal";
      m.innerHTML = `<div class="a-modal__box">
        <div class="a-modal__head"><h3>Вибрати фото</h3><div class="a-tabs"><button type="button" class="is-on" data-tab="mine">Завантажені</button><button type="button" data-tab="site">Фото сайту</button></div><button class="a-icon" type="button" data-x aria-label="Закрити">✕</button></div>
        <div class="a-modal__body"><div class="a-media" data-grid></div></div></div>`;
      document.body.append(m);
      const done = (v) => { m.remove(); resolve(v); };
      m.addEventListener("click", (e) => {
        if (e.target === m || e.target.closest("[data-x]")) return done(null);
        const t = e.target.closest("[data-tab]");
        if (t) { $$("[data-tab]", m).forEach((b) => b.classList.toggle("is-on", b === t)); fill(t.dataset.tab); }
        const fig = e.target.closest("[data-v]");
        if (fig) done(fig.dataset.v);
      });
      const grid = $("[data-grid]", m);
      const fill = async (tab) => {
        if (tab === "site") {
          grid.innerHTML = PHOTOS.map((p) => `<figure data-v="${p}"><img src="${src(p)}" alt="" loading="lazy"><figcaption>${p}</figcaption></figure>`).join("");
          return;
        }
        grid.innerHTML = `<p class="a-empty">Завантажую…</p>`;
        try {
          const files = (await S.listMedia()).filter((f) => /^image\//.test(f.type || "image/"));
          grid.innerHTML = files.length ? files.map((f) => `<figure data-v="${esc(f.url)}"><img src="${esc(f.url)}" alt="" loading="lazy"><figcaption>${esc(f.name)}</figcaption></figure>`).join("")
            : `<p class="a-empty">${S.live && !S.session.demo ? "Ще нічого не завантажено — натисніть «Завантажити» біля фото." : "У пробному режимі медіатеки немає — завантажуйте фото прямо в картці."}</p>`;
        } catch (e) { grid.innerHTML = `<p class="a-empty">${esc(e.message)}</p>`; }
      };
      fill("mine");
    });
  }

  // ── the drawer with one item
  function closeDrawer() {
    const d = $("[data-drawer]");
    if (d) d.classList.remove("is-on");
  }
  function editItem(key, i) {
    const s = SCHEMA[key];
    const list = data[key];
    const isNew = i < 0;
    const work = isNew ? s.blank() : clone(list[i]);
    // a flavour's look (photo, colours of the cut, moods) lives next to it in flavorMeta
    if (key === "flavors") work.meta = clone(data.flavorMeta[work.id] || s.metaDefault());
    const d = $("[data-drawer]");
    const box = $(".a-drawer__box", d);
    box.innerHTML = `<div class="a-drawer__head"><h2>${isNew ? "Новий запис" : esc(s.title1(list[i]) || "Без назви")}</h2><button class="a-icon" type="button" data-close aria-label="Закрити">✕</button></div>
      <form class="a-drawer__body" data-form novalidate></form>
      <div class="a-drawer__foot">
        <button class="a-btn" type="button" data-save>Зберегти</button>
        ${!isNew && s.link ? `<a class="a-btn a-btn--ghost" href="${esc(s.link(list[i]))}" target="_blank" rel="noopener">На сайті ↗</a>` : ""}
        <span class="a-spacer"></span>
        ${!isNew ? '<button class="a-btn a-btn--ghost a-btn--sm" type="button" data-dup>Дублювати</button><button class="a-btn a-btn--danger a-btn--sm" type="button" data-del>Видалити</button>' : ""}
      </div>`;
    const form = $("[data-form]", box);
    form.append(buildFields(s.fields, work, key));
    // the id follows the name until it is touched by hand
    const slugEl = $("[data-slug]", form);
    if (slugEl && isNew) {
      const src2 = s.fields.flatMap((f) => f.row || [f]).find((f) => f.k === slugEl.dataset.slug);
      let auto = true;
      $("input", slugEl).addEventListener("input", () => { auto = false; });
      form.addEventListener("input", (e) => {
        if (!auto || e.target.closest("[data-slug]")) return;
        const v = getPath(work, src2.k);
        work.id = uniqueId(list, v, null);
        $("input", slugEl).value = work.id;
      });
    }
    d.classList.add("is-on");
    setTimeout(() => { const f = $("input, textarea", form); if (f && isNew) f.focus(); }, 300);

    $("[data-save]", box).addEventListener("click", async () => {
      const req = s.fields.flatMap((f) => f.row || [f]).filter((f) => f.req);
      const miss = req.find((f) => !String(getPath(work, f.k) || "").trim());
      if (miss) return toast(`Заповніть «${miss.l}»`, true);
      if ("id" in work || s.fields.some((f) => f.k === "id")) {
        if (!work.id) work.id = uniqueId(list, s.title1(work), isNew ? null : list[i]);
        if (list.some((it, k) => k !== i && it.id === work.id)) return toast("Такий код уже є — змініть «Код»", true);
      }
      let meta = null;
      if (key === "flavors") { meta = work.meta; delete work.meta; }
      if (s.fix) s.fix(work);
      Object.keys(work).forEach((k) => { if (work[k] === undefined || work[k] === "") delete work[k]; });
      const oldId = isNew ? null : list[i].id;
      if (isNew) list.push(work); else list[i] = work;
      let ok = await save(key);
      if (ok && meta) {
        if (oldId && oldId !== work.id) delete data.flavorMeta[oldId];
        data.flavorMeta[work.id] = meta;
        ok = await save("flavorMeta");
      }
      if (ok) { closeDrawer(); renderView(); }
    });
    const del = $("[data-del]", box);
    if (del) del.addEventListener("click", async () => {
      if (!confirm(`Видалити «${s.title1(list[i])}»? Якщо хочете лише прибрати з сайту — краще «Сховати».`)) return;
      const [gone] = list.splice(i, 1);
      if (await save(key, "Видалено ✓")) {
        if (key === "flavors" && gone) { delete data.flavorMeta[gone.id]; await save("flavorMeta", "Видалено ✓"); }
        closeDrawer();
        renderView();
      }
    });
    const dup = $("[data-dup]", box);
    if (dup) dup.addEventListener("click", async () => {
      const copy = clone(list[i]);
      if ("name" in copy) copy.name += " (копія)";
      if (copy.id) copy.id = uniqueId(list, copy.id + "-copy", null);
      list.splice(i + 1, 0, copy);
      if (key === "flavors") data.flavorMeta[copy.id] = clone(data.flavorMeta[list[i].id] || {});
      if (await save(key, "Скопійовано ✓")) {
        if (key === "flavors") await save("flavorMeta", "Скопійовано ✓");
        closeDrawer();
        renderView();
        editItem(key, i + 1);
      }
    });
  }

  // ── pages: edit any page right on the site
  async function pagesView(main) {
    main.innerHTML = head("Сторінки", "тексти й фото прямо на сайті")
      + `<p class="a-note">Натисніть <b>«Редагувати»</b> — сторінка відкриється в режимі правок: клікаєте на будь-який текст і пишете, клікаєте на фото чи відео — замінюєте. Внизу — кнопка <b>«Зберегти»</b>. Картки тортів, десертів, FAQ тощо редагуються в розділах зліва.</p>
      <div class="a-pages" data-pages></div>`;
    let c = {};
    try { c = await S.editCounts(); } catch (e) { toast(e.message, true); }
    $("[data-pages]", main).innerHTML = PAGES.map(([k, name]) => {
      const href = `../${k === "index" ? "index" : k}.html`;
      const n = c[k] || 0;
      return `<div class="a-page"><b>${esc(name)}</b><small>${n ? `${n} ${n === 1 ? "правка" : n < 5 ? "правки" : "правок"}` : "без правок"}</small>
        <div><a class="a-btn a-btn--sm" href="${href}?edit=1" target="_blank" rel="noopener">✎ Редагувати</a><a class="a-btn a-btn--ghost a-btn--sm" href="${href}" target="_blank" rel="noopener">Відкрити</a>
        ${n ? `<button class="a-btn a-btn--danger a-btn--sm" type="button" data-wipe="${k}">↺ Скинути</button>` : ""}</div></div>`;
    }).join("");
    main.onclick = async (e) => {
      const w = e.target.closest("[data-wipe]");
      if (!w) return;
      if (!confirm("Скинути всі правки цієї сторінки? Тексти й фото повернуться до початкових.")) return;
      try { await S.resetEdits(w.dataset.wipe); toast("Правки сторінки скинуто"); pagesView(main); } catch (err) { toast(err.message, true); }
    };
  }

  // ── media library
  async function mediaView(main) {
    const live = S.live && !S.session.demo;
    main.innerHTML = head("Медіатека", "фото й відео сайту")
      + `<p class="a-note">Перетягніть сюди фото або відео. Фото автоматично зменшуються до ~1800 px і стискаються — сайт лишається швидким. Клік по файлу копіює посилання.</p>`
      + (live ? `<div class="a-drop" data-drop><b>Перетягніть файли сюди</b><span>або натисніть, щоб вибрати</span></div><div class="a-media" data-grid style="margin-top:18px"></div>`
        : `<p class="a-empty">Медіатека працює після підключення Supabase. У пробному режимі фото завантажуються прямо в картках.</p>`);
    if (!live) return;
    const grid = $("[data-grid]", main);
    const load = async () => {
      grid.innerHTML = `<p class="a-empty">Завантажую…</p>`;
      try {
        const files = await S.listMedia();
        grid.innerHTML = files.length ? files.map((f) => `<figure data-url="${esc(f.url)}">${/^video/.test(f.type || "") ? `<video src="${esc(f.url)}" muted></video>` : `<img src="${esc(f.url)}" alt="" loading="lazy">`}<figcaption>${esc(f.name)}</figcaption><button class="a-icon" type="button" data-rm title="Видалити">🗑</button></figure>`).join("")
          : `<p class="a-empty">Тут поки порожньо.</p>`;
      } catch (e) { grid.innerHTML = `<p class="a-empty">${esc(e.message)}</p>`; }
    };
    const up = async (files) => {
      for (const f of files) {
        try { await S.upload(f, "uploads"); } catch (e) { toast(`${f.name}: ${e.message}`, true); }
      }
      toast("Завантажено ✓");
      load();
    };
    const drop = $("[data-drop]", main);
    drop.addEventListener("click", () => pickFile("image/*,video/mp4,video/webm", true).then(up));
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("is-over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("is-over"));
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("is-over"); up([...e.dataTransfer.files]); });
    grid.addEventListener("click", async (e) => {
      const fig = e.target.closest("[data-url]");
      if (!fig) return;
      if (e.target.closest("[data-rm]")) {
        if (!confirm("Видалити файл? Якщо він використовується на сайті, там зникне фото.")) return;
        try { await S.removeMedia(fig.dataset.url); load(); } catch (err) { toast(err.message, true); }
        return;
      }
      navigator.clipboard && navigator.clipboard.writeText(fig.dataset.url).then(() => toast("Посилання скопійовано"));
    });
    load();
  }

  // ── go
  M.ready.then(() => (S.session ? start() : loginView()));
})();
