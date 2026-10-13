/* Mariday admin panel: the shop's collections (cakes, desserts, flavours, sizes, bento, reviews and their lists) and the photos.
   The pages themselves, the contacts, the FAQ and «З чого ціна» are not edited here — the panel is shared by the team.
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
  // the password-free trial mode is only offered on the owner's own computer, never on the published site
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname);
  const PHOTOS = ["berries", "blackoreo", "brownie", "cherrycup", "cherrymint", "cherrypair", "choccup", "cookie", "cupcakes", "donuts", "drip", "forest", "fraisier", "gold", "lilac", "macarons", "meringue", "mint", "mousse", "oreo", "pastel", "pink", "pinkmac", "piping", "pour", "raspberries", "redvelvet", "roses", "slice", "strawberries", "strawslice", "swirl", "tiramisu", "vanilla", "yellow"];
  const src = (v) => (v ? M.img(v) : "");

  // ── what each part of the site is made of
  const opt = (key, skip = "all") => () => (data[key] || []).filter((o) => o.id !== skip).map((o) => ({ v: o.id, l: o.label || o.name }));
  const SCHEMA = {
    cakes: {
      title: "Торти", icon: "🎂", hint: "Каталог, сторінка торта, вітрина «Обрані роботи» на головній (перші 8 за порядком). Перетягуйте картки, щоб змінити порядок.",
      cards: true, title1: (c) => c.name, sub: (c) => `від €${c.price ?? "—"} · ${c.days ?? "?"} дн.`, photo: (c) => c.img,
      link: (c) => `../pages/product.html?id=${encodeURIComponent(c.id)}`,
      blank: () => ({ name: "", price: 150, img: "", cats: ["all"], tags: [], days: 5, desc: "", sizes: data.sizes.map((x) => x.id), flavors: data.flavors.map((x) => x.id) }),
      fields: [
        { k: "name", t: "text", l: "Назва", req: true },
        { k: "img", t: "image", l: "Фото", hint: "Завантажте фото торта — фон приберемо самі, і торт без фону одразу стане на вітрину.", cutTo: "cutout" },
        { k: "cutout", t: "image", l: "Торт без фону — для вітрини", hint: "З'являється сам після завантаження фото. Можна поставити й свій PNG/WebP з прозорим фоном.", cut: true, cutFrom: "img" },
        { row: [{ k: "price", t: "number", l: "Ціна від, €" }, { k: "days", t: "number", l: "Замовляти за, днів" }] },
        { k: "desc", t: "textarea", l: "Опис" },
        { sep: "Що можна замовити" },
        { k: "sizes", t: "sizes", l: "Вага і порції", hint: "Позначте розміри цього торта — лише вони будуть на його сторінці." },
        { k: "flavors", t: "flavors", l: "Начинки", hint: "Які начинки можна обрати до цього торта." },
        { sep: "Де показувати" },
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
        { sep: "Як виглядає розріз" },
        { k: "meta", t: "slice", l: "Шари знизу вгору", hint: "Натисніть на шар у торті або в списку й оберіть колір. Так начинка виглядатиме на сайті: у виборі начинки, на карті смаків, у конструкторі." },
        { k: "meta.img", t: "image", l: "Фото розрізу" },
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
    reviews: {
      title: "Відгуки", icon: "💌", hint: "Листівки, які ви додаєте самі (на головній і на стіні відгуків; «приклад» = ще не справжній відгук). Нижче — відгуки, які гості написали на сайті: їх можна виправити, сховати або видалити.", cards: true,
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
    categories: {
      title: "Приводи (каталог)", icon: "🏷️", hint: "Фільтри каталогу тортів. «Усі» має залишитись першим.",
      title1: (c) => c.label, sub: (c) => c.id, blank: () => ({ label: "" }),
      fields: [{ k: "label", t: "text", l: "Назва", req: true }, { k: "id", t: "slug", l: "Код", from: "label", hint: "Торти прив'язані до коду — після зміни перевірте торти." }],
    },
    dessertCats: { title: "Розділи десертів", icon: "🏷️", hint: "Фільтри на сторінці десертів." },
    moods: { title: "Настрої смаків", icon: "🏷️", hint: "Фільтри карти смаків." },
    reviewOccasions: { title: "Приводи відгуків", icon: "🏷️", hint: "Вибір приводу у формі відгуку." },
  };
  // small id/label lists share one form
  ["dessertCats", "moods", "reviewOccasions"].forEach((k) => Object.assign(SCHEMA[k], {
    title1: (c) => c.label, sub: (c) => c.id, blank: () => ({ label: "" }),
    fields: [{ k: "label", t: "text", l: "Назва", req: true }, { k: "id", t: "slug", l: "Код", from: "label" }],
  }));

  const NAV = [
    ["Замовлення", ["orders"]],
    ["Вітрина", ["cakes", "desserts", "flavors", "sizes", "bentoDecor"]],
    ["Гостям", ["reviews"]],
    ["Сайт", ["media"]],
    ["Довідники", ["categories", "dessertCats", "moods", "reviewOccasions"]],
  ];
  const VIEWS = { media: { title: "Медіатека", icon: "🖼️" }, orders: { title: "Заявки", icon: "🔔" } };

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
  // The staff door of the shop at night: on the left the window — «Кухня» in cherry glaze and the site's real cakes
  // taking turns on a cake stand; on the right the kitchen door with the form on a sign hanging from a nail.
  // The window lights up as the email and password go in; when the door opens the sign turns round to «Відчинено».
  const CROPPED = ["berries", "slice", "strawslice", "tiramisu", "meringue"]; // their photos cut the cake at the edge
  const STILL = matchMedia("(prefers-reduced-motion: reduce)");
  function loginView() {
    app.className = "";
    const h = new Date().getHours();
    const hi = h < 5 ? "Нічна зміна?" : h < 12 ? "Доброго ранку!" : h < 18 ? "Доброго дня!" : "Добрий вечір!";
    const own = (M.cakes || []).filter((c) => c.cutout || !CROPPED.includes(c.img)).map(M.cutout).filter(Boolean);
    const cakes = (own.length ? own : ["roses", "pink", "lilac", "gold", "drip", "fraisier"].map((n) => `../img/cutouts/gl-${n}.webp`)).slice(0, 8);
    const word = [..."Кухня"].map((ch, i) => `<i style="--i:${i}">${ch}</i>`).join("");
    const eye = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="a-pass__slash" d="M4 4l16 16"/></svg>`;
    app.innerHTML = `<div class="a-login" style="--lamp:0.5">
      <section class="a-login__art">
        <div class="a-logo"><img src="${CHERRY}" alt="">Mariday<em>admin</em></div>
        <i class="a-login__beam" aria-hidden="true"></i>
        <div class="a-login__scene" aria-hidden="true">
          <p class="a-login__big"><span class="a-login__w">${word}</span><span class="a-login__s">за вітриною</span></p>
          <div class="a-login__stand">
            <div class="a-login__cakes">${cakes.map((u, i) => `<img src="${esc(u)}" alt="" draggable="false"${i ? "" : ' class="is-on"'}>`).join("")}</div>
            <i class="a-login__plate"></i>
          </div>
          <p class="a-login__note">тільки для своїх ♥<svg viewBox="0 0 120 60"><path d="M4 40 C 40 58, 82 52, 112 14"/><path d="M98 14 L 113 12 L 110 27"/></svg></p>
          <img class="a-login__berry a-login__berry--1" src="${CHERRY}" alt="">
          <img class="a-login__berry a-login__berry--2" src="${CHERRY}" alt="">
          <img class="a-login__berry a-login__berry--3" src="${CHERRY}" alt="">
        </div>
      </section>
      <section class="a-login__door">
        <i class="a-door__fan" aria-hidden="true"></i>
        <i class="a-door__knob" aria-hidden="true"></i>
        <div class="a-sign" data-sign><div class="a-sign__swing">
          <svg class="a-sign__cord" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><path d="M16 60 L50 4 L84 60"/></svg>
          <i class="a-sign__nail" aria-hidden="true"></i>
          <div class="a-sign__card">
            <div class="a-sign__face">
              <p class="a-sign__hi">${hi}</p>
              <h1>Службовий вхід</h1>
              <p class="a-sign__lede">Лише для команди Mariday. Введіть свій email і пароль.</p>
              <form data-login>
                <label class="a-field"><span>Email</span><input class="a-input" type="email" name="email" autocomplete="username" required></label>
                <label class="a-field"><span>Пароль</span><span class="a-pass"><input class="a-input" type="password" name="password" autocomplete="current-password" required><button class="a-pass__eye" type="button" aria-label="Показати пароль" aria-pressed="false" data-eye>${eye}</button></span></label>
                <div class="a-login__err" role="alert" data-err></div>
                <button class="a-btn a-sign__go" type="submit" data-go><span>Увійти на кухню</span><b aria-hidden="true">→</b></button>
              </form>
              ${S.live || !LOCAL ? "" : `<div class="a-sign__trial">
                <p>Supabase ще не підключено, тому вхід поки не працює і зміни нікуди зберігати для всіх відвідувачів. А поки можна все спробувати в пробному режимі — зміни побачите лише ви, у цьому браузері.</p>
                <button class="a-btn a-btn--pink" type="button" data-demo>Спробувати в пробному режимі</button>
                <details class="a-setup"><summary>Як підключити (≈5 хвилин)</summary><ol>
                  <li>Створіть безкоштовний проєкт на <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>.</li>
                  <li>SQL Editor → вставте вміст файлу <code>supabase/setup.sql</code> → Run.</li>
                  <li>Authentication → Users → Add user: ваш email і пароль. Додайте email у таблицю <code>admins</code> (останній рядок setup.sql).</li>
                  <li>Project Settings → API: скопіюйте Project URL і anon key у <code>MARIDAY.backend</code> у файлі <code>js/data.js</code>.</li>
                </ol></details>
              </div>`}
              <a class="a-login__back" href="../index.html">← Повернутися на сайт</a>
            </div>
            <div class="a-sign__back" aria-hidden="true"><img src="${CHERRY}" alt=""><b>Відчинено</b><span>смачної зміни!</span></div>
          </div>
        </div></div>
        <i class="a-door__plate" aria-hidden="true"></i>
      </section>
    </div>`;
    const root = $(".a-login");
    const sign = $("[data-sign]");
    const form = $("[data-login]");

    // the window lights up as the door gets to know you
    const light = () => {
      const lit = 0.5 + (form.email.validity.valid && form.email.value ? 0.25 : 0) + (form.password.value ? 0.25 : 0);
      root.style.setProperty("--lamp", lit);
    };
    ["input", "change"].forEach((ev) => form.addEventListener(ev, light));
    setTimeout(light, 700); // the browser's saved password fills the fields without telling anyone

    // the glaze catches the light where the pointer is
    const art = $(".a-login__art");
    art.addEventListener("pointermove", (e) => {
      const r = art.getBoundingClientRect();
      root.style.setProperty("--gx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    });

    // the cakes take turns on the stand: one hops off, the next drops in
    const pics = $$(".a-login__cakes img");
    let on = 0;
    if (pics.length > 1 && !STILL.matches) {
      const turn = setInterval(() => {
        if (!root.isConnected) return clearInterval(turn);
        if (document.hidden) return;
        const was = pics[on];
        on = (on + 1) % pics.length;
        was.classList.remove("is-on");
        was.classList.add("is-off");
        setTimeout(() => was.classList.remove("is-off"), 900);
        pics[on].classList.add("is-on");
      }, 3200);
    }

    $("[data-eye]").addEventListener("click", (e) => {
      const b = e.currentTarget;
      const show = form.password.type === "password";
      form.password.type = show ? "text" : "password";
      b.setAttribute("aria-pressed", show);
      b.setAttribute("aria-label", show ? "Сховати пароль" : "Показати пароль");
      form.password.focus();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("[data-go]");
      btn.disabled = true;
      btn.firstChild.textContent = "Відчиняємо…";
      $("[data-err]").textContent = "";
      sign.classList.remove("is-wrong");
      try {
        await S.login(form.email.value.trim(), form.password.value);
        root.style.setProperty("--lamp", 1);
        sign.classList.add("is-open");
        setTimeout(start, STILL.matches ? 300 : 1500);
        return;
      } catch (err) {
        $("[data-err]").textContent = err.message;
        void sign.offsetWidth; // so the sign swings again on every wrong try
        sign.classList.add("is-wrong");
      }
      btn.disabled = false;
      btn.firstChild.textContent = "Увійти на кухню";
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
        <button class="a-btn a-btn--pink a-new" type="button" data-new>+ Додати</button>
        <nav class="a-nav">${NAV.map(([g, keys]) => `<h6>${g}</h6>${keys.map((k) => {
          const s = SCHEMA[k] || VIEWS[k];
          const n = Array.isArray(data[k]) ? `<b>${data[k].length}</b>` : k === "orders" ? `<b class="a-nav__new" data-new-badge hidden></b>` : "";
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
    $("[data-new]").addEventListener("click", () => { app.classList.remove("is-menu"); addWhat(); });
    $$(".a-nav a").forEach((a) => a.addEventListener("click", () => app.classList.remove("is-menu")));
    $("[data-drawer]").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeDrawer(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
    renderView();
    watchOrders();
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
    if (view === "media") return mediaView(main);
    if (view === "orders") return ordersView(main);
    const s = SCHEMA[view];
    if (!s) { view = "cakes"; return renderView(); }
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
      + `<div class="${s.cards ? "a-grid" : "a-list"}" data-list></div>`
      + (key === "reviews" ? `<section class="a-guests" data-guests></section>` : "");
    const host = $("[data-list]", main);
    if (key === "reviews") guestReviews($("[data-guests]", main));
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
        photoField(el, f, val, set, label, hint, obj);
        break;
      case "sizes":
      case "flavors": {
        // the sizes and fillings this cake comes in: tiles to tick, the same ones the guest will see on its page
        const all = data[f.t];
        const cur = new Set(val || all.map((x) => x.id));
        const tile = f.t === "sizes"
          ? (x, i) => `<i class="a-tier" style="--n:${Math.min(i + 1, 4)}" aria-hidden="true"></i><b>${esc(x.label)}</b><small>${esc(x.serves || "")}</small>`
          : (x) => `${stripes(x.id)}<b>${esc(x.name)}</b>`;
        el.innerHTML = `${label}<div class="a-pick a-pick--${f.t}">${all.map((x, i) => `<label class="a-pick__it"><input type="checkbox" value="${esc(x.id)}" ${cur.has(x.id) ? "checked" : ""}><span>${tile(x, i)}</span></label>`).join("")}</div>
          <div class="a-pick__acts"><button class="a-btn a-btn--ghost a-btn--sm" type="button" data-all>Усі</button><button class="a-btn a-btn--ghost a-btn--sm" type="button" data-none>${f.t === "sizes" ? "Жодного" : "Жодної"}</button></div>${hint}`;
        const sync = () => set($$("input:checked", el).map((i) => i.value));
        el.addEventListener("change", sync);
        $("[data-all]", el).addEventListener("click", () => { $$("input", el).forEach((i) => (i.checked = true)); sync(); });
        $("[data-none]", el).addEventListener("click", () => { $$("input", el).forEach((i) => (i.checked = false)); sync(); });
        if (val == null) sync();
        break;
      }
      case "slice":
        sliceField(el, val, label, hint);
        break;
    }
    return el;
  }

  // a flavour as the site draws it: its layers bottom → top with cream between them
  const metaOf = (id) => data.flavorMeta[id] || SCHEMA.flavors.metaDefault();
  function stripes(id, layers = metaOf(id).layers) {
    const rows = layers.flatMap((c, i) => (i ? ['<i class="is-cream"></i>', `<i style="background:${esc(c)}"></i>`] : [`<i style="background:${esc(c)}"></i>`]));
    return `<span class="a-stripes" aria-hidden="true">${rows.reverse().join("")}</span>`;
  }

  // ── the cut of a flavour: a slice of cake you colour layer by layer
  const PALETTE = [
    ["Ванільний бісквіт", "#f2dfa6"], ["Шоколадний бісквіт", "#4a2418"], ["Червоний оксамит", "#9b1b30"], ["Горіховий бісквіт", "#d8c48e"],
    ["Фісташка", "#b9cf8f"], ["Матча", "#8fae5a"], ["Кремчиз", "#f7efe6"], ["Вершковий крем", "#fbf3dc"],
    ["Карамель", "#c27a2c"], ["Банан", "#e3c26b"], ["Лимон", "#f3e08a"], ["Манго", "#f2a541"],
    ["Полуниця", "#e58aa0"], ["Малина", "#c2263f"], ["Вишня", "#7a0b1c"], ["Чорниця", "#4b3a6b"],
    ["Шоколадний ганаш", "#3e1c14"], ["Молочний шоколад", "#c79a6b"], ["Oreo", "#2b1610"], ["Кава", "#6b3a2a"],
  ];
  const colorName = (hex) => (PALETTE.find(([, c]) => c.toLowerCase() === String(hex).toLowerCase()) || ["свій колір"])[0];
  function sliceField(el, meta, label, hint) {
    meta.layers = meta.layers && meta.layers.length ? meta.layers : ["#f2dfa6", "#f7efe6", "#c2263f"];
    let on = meta.layers.length - 1;
    el.innerHTML = `${label}<div class="a-slice">
      <div class="a-slice__stage"><div class="a-slice__cake" data-cake></div><span class="a-slice__plate" aria-hidden="true"></span></div>
      <div class="a-slice__side">
        <ol class="a-slice__list" data-list></ol>
        <button class="a-btn a-btn--ghost a-btn--sm" type="button" data-add>+ шар</button>
      </div>
      <div class="a-slice__pal">
        <p>Колір шару <b data-now></b></p>
        <div class="a-slice__sw">${PALETTE.map(([n, c]) => `<button type="button" style="--c:${c}" data-sw="${c}" title="${esc(n)}"><span>${esc(n)}</span></button>`).join("")}
          <label class="a-slice__own" title="Свій колір"><input type="color" data-own><span>свій</span></label></div>
        <p>Головний колір начинки <small>(картка на карті смаків)</small></p>
        <div class="a-slice__tone"><span class="a-color"><input type="color" data-tone value="${esc(meta.tone || meta.layers[meta.layers.length - 1])}"></span>
          <button class="a-btn a-btn--ghost a-btn--sm" type="button" data-tone-top>як верхній шар</button></div>
      </div></div>${hint}`;
    const cake = $("[data-cake]", el);
    const list = $("[data-list]", el);
    const draw = () => {
      const L = meta.layers;
      on = Math.min(on, L.length - 1);
      // the slice: sponge and fillings with cream between, a glaze of the main colour poured over the top
      cake.innerHTML = `<span class="a-slice__glaze" style="--c:${esc(meta.tone || L[L.length - 1])}"></span>`
        + L.map((c, i) => `${i ? '<span class="a-slice__cream"></span>' : ""}<button type="button" class="a-slice__layer${i === on ? " is-on" : ""}" style="--c:${esc(c)}" data-l="${i}" aria-label="Шар ${i + 1}: ${esc(colorName(c))}"></button>`).reverse().join("");
      list.innerHTML = L.map((c, i) => `<li class="${i === on ? "is-on" : ""}" data-l="${i}">
        <i style="background:${esc(c)}"></i><span>${i === 0 ? "низ · " : i === L.length - 1 ? "верх · " : ""}${esc(colorName(c))}</span>
        <button type="button" data-up="${i}" title="Вище" ${i === L.length - 1 ? "disabled" : ""}>↑</button><button type="button" data-down="${i}" title="Нижче" ${i === 0 ? "disabled" : ""}>↓</button><button type="button" data-x="${i}" title="Прибрати" ${L.length < 2 ? "disabled" : ""}>×</button></li>`).reverse().join("");
      $("[data-now]", el).textContent = `${on + 1} — ${colorName(L[on])}`;
      $("[data-own]", el).value = L[on];
      $$("[data-sw]", el).forEach((b) => b.classList.toggle("is-on", b.dataset.sw.toLowerCase() === L[on].toLowerCase()));
    };
    const paint = (c) => { meta.layers[on] = c; draw(); };
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button, li");
      if (!t) return;
      const L = meta.layers;
      if (t.dataset.sw) return paint(t.dataset.sw);
      if (t.dataset.up != null) { const i = +t.dataset.up; [L[i], L[i + 1]] = [L[i + 1], L[i]]; on = i + 1; return draw(); }
      if (t.dataset.down != null) { const i = +t.dataset.down; [L[i], L[i - 1]] = [L[i - 1], L[i]]; on = i - 1; return draw(); }
      if (t.dataset.x != null) { L.splice(+t.dataset.x, 1); return draw(); }
      if (t.hasAttribute("data-add")) { L.push(L[on] === "#f7efe6" ? "#f2dfa6" : "#f7efe6"); on = L.length - 1; return draw(); }
      if (t.hasAttribute("data-tone-top")) { meta.tone = L[L.length - 1]; $("[data-tone]", el).value = meta.tone; return draw(); }
      if (t.dataset.l != null) { on = +t.dataset.l; draw(); }
    });
    $("[data-own]", el).addEventListener("input", (e) => paint(e.target.value));
    $("[data-tone]", el).addEventListener("input", (e) => { meta.tone = e.target.value; draw(); });
    draw();
  }

  // a photo: preview, upload (or drop a file onto it), choose from the library or the site's own photos.
  // A cake's photo also feeds its cut-out: the background is taken off right here and the cake goes onto the showcase.
  function photoField(el, f, val, set, label, hint, obj) {
    el.innerHTML = `${label}<div class="a-photo">
      <div class="a-photo__pic${f.cut ? " is-cut" : ""}">${val ? `<img src="${esc(src(val))}" alt="">` : f.cut ? "з'явиться після фото" : "немає фото"}</div>
      <div class="a-photo__acts">
        ${f.cutFrom ? `<button class="a-btn a-btn--pink a-btn--sm" type="button" data-magic ${getPath(obj, f.cutFrom) ? "" : "disabled"}>✨ Прибрати фон з фото</button>` : ""}
        <button class="a-btn ${f.cutFrom ? "a-btn--ghost " : ""}a-btn--sm" type="button" data-up>Завантажити</button>
        <button class="a-btn a-btn--ghost a-btn--sm" type="button" data-lib>Вибрати</button>
        ${val ? '<button class="a-btn a-btn--danger a-btn--sm" type="button" data-rm>Прибрати</button>' : ""}
      </div></div>${hint}`;
    const pic = $(".a-photo__pic", el);
    const put = (v) => { set(v || undefined); photoField(el, f, v, set, label, hint, obj); };
    // the field that takes the cut-out of this photo, if there is one
    const cutField = () => (f.cutTo ? $(`[data-cut-field="${f.cutTo}"]`, el.closest("form") || document) : null);
    const changed = (source) => { const cf = cutField(); if (cf && cf.makeCut) cf.makeCut(source); };
    const upload = async (file) => {
      if (!file) return;
      pic.classList.add("a-photo__busy");
      try { put(await S.upload(file, "uploads")); changed(file); }
      catch (e) { toast(e.message, true); pic.classList.remove("a-photo__busy"); }
    };
    $("[data-up]", el).addEventListener("click", () => pickFile("image/*").then(upload));
    $("[data-lib]", el).addEventListener("click", () => picker().then((v) => { if (v) { put(v); changed(src(v)); } }));
    const rm = $("[data-rm]", el);
    if (rm) rm.addEventListener("click", () => put(""));
    pic.addEventListener("dragover", (e) => { e.preventDefault(); pic.classList.add("is-drop"); });
    pic.addEventListener("dragleave", () => pic.classList.remove("is-drop"));
    pic.addEventListener("drop", (e) => { e.preventDefault(); pic.classList.remove("is-drop"); upload(e.dataTransfer.files[0]); });

    if (!f.cutFrom) return;
    el.dataset.cutField = f.k;
    let busy = false;
    el.makeCut = async (source) => {
      if (busy) return;
      busy = true;
      pic.classList.add("a-photo__busy", "is-magic");
      pic.dataset.say = "Прибираю фон…";
      const acts = $(".a-photo__acts", el);
      acts.hidden = true;
      try {
        const res = await removeBg(source, (pct) => { pic.dataset.say = pct == null ? "Прибираю фон…" : `Готую чарівну паличку… ${pct}%`; });
        if (!res) throw new Error("Не вдалося знайти торт на фото — спробуйте інше фото.");
        const file = new File([res.blob], "cutout.webp", { type: "image/webp" });
        const keep = async () => { put(await S.upload(file, "uploads")); toast("Фон прибрано ✓ Торт стоїть на вітрині"); };
        if (!res.edge) await keep();
        else {
          // the cake runs off the photo: on the showcase that cut edge would show — let the person decide
          pic.classList.remove("a-photo__busy", "is-magic");
          pic.innerHTML = `<img src="${URL.createObjectURL(res.blob)}" alt="">`;
          acts.hidden = false;
          acts.innerHTML = `<p class="a-warn">Торт на цьому фото обрізаний краєм кадру — на вітрині він виглядатиме зрізаним. Краще фото, де торт цілий. Без вирізки в каталозі буде звичайне фото.</p>
            <button class="a-btn a-btn--sm" type="button" data-keep>Все одно поставити</button><button class="a-btn a-btn--ghost a-btn--sm" type="button" data-skip>Не треба</button>`;
          busy = false;
          $("[data-keep]", acts).addEventListener("click", () => keep().catch((e) => toast(e.message, true)));
          $("[data-skip]", acts).addEventListener("click", () => put(""));
          return;
        }
      } catch (e) {
        toast(e.message, true);
        photoField(el, f, getPath(obj, f.k), set, label, hint, obj);
      }
      busy = false;
    };
    const magic = $("[data-magic]", el);
    if (magic) magic.addEventListener("click", () => el.makeCut(src(getPath(obj, f.cutFrom))));
  }

  // ── taking the background off a cake photo, right in the browser (the model is fetched once, then cached)
  const BG_LIB = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";
  let bgLib = null;
  async function removeBg(source, onProgress) {
    const blob = source instanceof Blob ? source : await (await fetch(source)).blob();
    // a photo that already has no background (a PNG cut out elsewhere) is only tidied — no model needed.
    // Such files are often cropped tight to the cake, so touching the edge says nothing about the cake being cut off
    if (await hasAlpha(blob)) return tidy(blob, false);
    bgLib = bgLib || import(BG_LIB);
    let lib;
    try { lib = await bgLib; } catch (e) { bgLib = null; throw new Error("Не вдалося завантажити інструмент для фону — перевірте інтернет і спробуйте ще раз."); }
    const raw = await lib.removeBackground(await fitBlob(blob, 1600), {
      model: "isnet_fp16",
      output: { format: "image/png" },
      progress: (key, cur, total) => onProgress && onProgress(/^fetch/.test(key) && total ? Math.round((cur / total) * 100) : null),
    });
    return tidy(raw);
  }
  async function hasAlpha(blob) {
    if (/jpe?g/.test(blob.type)) return false;
    const bmp = await createImageBitmap(blob);
    const k = Math.min(1, 200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(bmp.width * k));
    c.height = Math.max(1, Math.round(bmp.height * k));
    const g = c.getContext("2d");
    g.drawImage(bmp, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let clear = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 200) clear++;
    return clear > (d.length / 4) * 0.02;
  }
  // big phone photos are scaled down first: quicker, and the cut-out needs no more
  async function fitBlob(blob, max) {
    const bmp = await createImageBitmap(blob);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (k === 1) return blob;
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((r) => c.toBlob(r, "image/png"));
  }
  // the raw cut-out leaves ghosts (shadows, a table edge, crumbs): make the cake solid, drop the rest, trim the margins
  async function tidy(blob, checkEdge = true) {
    const bmp = await createImageBitmap(blob);
    const W = bmp.width, H = bmp.height;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    g.drawImage(bmp, 0, 0);
    const im = g.getImageData(0, 0, W, H);
    const d = im.data;
    const LO = 70, HI = 190;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] <= LO ? 0 : d[i] >= HI ? 255 : Math.round(((d[i] - LO) / (HI - LO)) * 255);
    // islands on a coarse grid: the cake and anything big next to it stay, stray bits go
    const s = Math.min(1, 320 / Math.max(W, H));
    const gw = Math.max(1, Math.round(W * s)), gh = Math.max(1, Math.round(H * s));
    const cell = (x, y) => Math.min(gh - 1, Math.floor(y * s)) * gw + Math.min(gw - 1, Math.floor(x * s));
    const on = new Uint8Array(gw * gh);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3]) on[cell(x, y)] = 1;
    const lab = new Int32Array(gw * gh);
    const sizes = [0];
    for (let i = 0; i < on.length; i++) {
      if (!on[i] || lab[i]) continue;
      const id = sizes.length;
      let n = 0;
      const st = [i];
      lab[i] = id;
      while (st.length) {
        const p = st.pop();
        n++;
        const x = p % gw, y = (p - x) / gw;
        for (const q of [x > 0 ? p - 1 : -1, x < gw - 1 ? p + 1 : -1, y > 0 ? p - gw : -1, y < gh - 1 ? p + gw : -1]) if (q >= 0 && on[q] && !lab[q]) { lab[q] = id; st.push(q); }
      }
      sizes.push(n);
    }
    const big = sizes.reduce((m, n) => Math.max(m, n), 0);
    if (!big) return null;
    const keep = sizes.map((n) => n >= big * 0.08);
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4 + 3;
      if (!d[i]) continue;
      if (!keep[lab[cell(x, y)]]) { d[i] = 0; continue; }
      if (d[i] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return null;
    g.putImageData(im, 0, 0);
    // a cake that touches the top or a side of the photo was cut off by the frame (the bottom is where it stands)
    const share = (n, at) => { let k = 0; for (let j = 0; j < n; j++) if (d[at(j) * 4 + 3] > 128) k++; return k / n; };
    const edge = checkEdge && (share(W, (x) => W + x) > 0.04 || share(H, (y) => y * W + 1) > 0.04 || share(H, (y) => y * W + W - 2) > 0.04);
    const m = Math.round(Math.max(W, H) * 0.01);
    x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W - 1, x1 + m); y1 = Math.min(H - 1, y1 + m);
    const o = document.createElement("canvas");
    o.width = x1 - x0 + 1;
    o.height = y1 - y0 + 1;
    o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
    return { blob: await new Promise((r) => o.toBlob(r, "image/webp", 0.9)), edge };
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

  // ── reviews guests wrote on the site (the `reviews` table in Supabase): read them, fix a typo, hide or delete
  async function guestReviews(host) {
    host.innerHTML = `<div class="a-head a-head--sub"><h2>Від гостей<span>написані на сайті через форму</span></h2></div><div class="a-list" data-g-list><p class="a-empty">Завантажую…</p></div>`;
    const box = $("[data-g-list]", host);
    let rows;
    try { rows = await S.guestReviews(); }
    catch (e) {
      box.innerHTML = `<p class="a-empty">${esc(/schema cache|does not exist/i.test(e.message) ? "Таблиці відгуків у Supabase ще немає — виконайте supabase/setup.sql у SQL Editor (README)." : e.message)}</p>`;
      return;
    }
    if (rows == null) { box.innerHTML = `<p class="a-empty">Відгуки гостей з'являться тут, коли сайт підключено до Supabase.</p>`; return; }
    const date = (d) => (d ? new Date(d).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" }) : "");
    const draw = () => {
      box.innerHTML = rows.length ? rows.map((r, i) => `<div class="a-gr${r.approved ? "" : " is-hidden"}" data-g="${i}">
        <div class="a-gr__top"><b>${esc(r.name)}</b>${r.city ? `<span>${esc(r.city)}</span>` : ""}<span class="a-gr__stars">${"★".repeat(r.rating || 5)}${"☆".repeat(5 - (r.rating || 5))}</span><small>${esc(date(r.created_at))}</small>${r.approved ? "" : '<span class="a-item__tag">сховано</span>'}</div>
        <p>${esc(r.text)}</p>
        <div class="a-gr__acts"><button class="a-btn a-btn--ghost a-btn--sm" type="button" data-edit>Редагувати</button><button class="a-btn a-btn--ghost a-btn--sm" type="button" data-toggle>${r.approved ? "Сховати з сайту" : "Показати на сайті"}</button><button class="a-btn a-btn--danger a-btn--sm" type="button" data-del>Видалити</button></div>
      </div>`).join("") : `<p class="a-empty">Гості ще нічого не написали.</p>`;
    };
    draw();
    box.onclick = async (e) => {
      const it = e.target.closest("[data-g]");
      if (!it) return;
      const r = rows[+it.dataset.g];
      try {
        if (e.target.closest("[data-edit]")) return editGuest(r, draw);
        if (e.target.closest("[data-toggle]")) { await S.updateGuestReview(r.id, { approved: !r.approved }); r.approved = !r.approved; draw(); toast(r.approved ? "Відгук знову на сайті ✓" : "Відгук сховано ✓"); }
        if (e.target.closest("[data-del]")) {
          if (!confirm(`Видалити відгук від «${r.name}» назавжди? Якщо лише прибрати з сайту — краще «Сховати».`)) return;
          await S.deleteGuestReview(r.id);
          rows.splice(+it.dataset.g, 1);
          draw();
          toast("Видалено ✓");
        }
      } catch (err) { toast(err.message, true); }
    };
  }
  function editGuest(r, done) {
    const work = { name: r.name, city: r.city || "", rating: r.rating || 5, text: r.text };
    const fields = [
      { row: [{ k: "name", t: "text", l: "Ім'я", req: true }, { k: "city", t: "text", l: "Місто" }] },
      { k: "rating", t: "range", l: "Оцінка", min: 1, max: 5 },
      { k: "text", t: "textarea", l: "Текст відгуку" },
    ];
    const d = $("[data-drawer]");
    const box = $(".a-drawer__box", d);
    box.innerHTML = `<div class="a-drawer__head"><h2>Відгук · ${esc(r.name)}</h2><button class="a-icon" type="button" data-close aria-label="Закрити">✕</button></div>
      <form class="a-drawer__body" data-form novalidate></form>
      <div class="a-drawer__foot"><button class="a-btn" type="button" data-save>Зберегти</button></div>`;
    $("[data-form]", box).append(buildFields(fields, work, "guest"));
    d.classList.add("is-on");
    $("[data-save]", box).addEventListener("click", async () => {
      const v = { name: work.name.trim(), city: work.city.trim(), rating: work.rating, text: work.text.trim() };
      if (v.name.length < 2 || v.name.length > 40) return toast("Ім'я — від 2 до 40 символів", true);
      if (v.text.length < 10 || v.text.length > 400) return toast("Текст — від 10 до 400 символів", true);
      if (v.city.length > 30) return toast("Місто — до 30 символів", true);
      try { await S.updateGuestReview(r.id, v); Object.assign(r, v); closeDrawer(); done(); toast("Збережено ✓"); }
      catch (err) { toast(err.message, true); }
    });
  }

  // ── orders from the site's cart («Заявки»). A new one rings here — badge, a ding, a toast and a system
  // notification while the panel is open — and, sent by the database itself, in Telegram. The team moves each
  // one along: нова → в роботі → готово.
  const ST = { new: "нова", work: "в роботі", done: "готово" };
  const NEXT = { new: ["work", "Взяти в роботу"], work: ["done", "Готово ✓"], done: ["work", "Повернути в роботу"] };
  const TITLE = document.title;
  const SEEN = "mariday-admin-seen-order";
  let orderTab = "new";
  let orders = null; // everything loaded in «Заявки»
  let fresh = []; // status «нова», kept up to date by watchOrders()
  let seenId = +(localStorage.getItem(SEEN) || 0); // the newest order this browser has already announced
  const eur = (n) => "€" + (Math.round((+n || 0) * 100) / 100).toLocaleString("uk-UA");
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "")) ? String(u) : "");
  const noSetup = (m) => /schema cache|does not exist|Could not find/i.test(m);
  // a Dutch 06… number still opens in WhatsApp
  const waOf = (phone) => {
    let d = String(phone || "").replace(/\D/g, "");
    if (/^00/.test(d)) d = d.slice(2);
    else if (/^0/.test(d)) d = "31" + d.slice(1);
    return d.length >= 9 ? `https://wa.me/${d}` : "";
  };
  const when = (d) => {
    const t = new Date(d);
    const time = t.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
    const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 864e5);
    return days === 0 ? `сьогодні, ${time}` : days === 1 ? `вчора, ${time}` : t.toLocaleDateString("uk-UA", { day: "numeric", month: "long" }) + `, ${time}`;
  };

  function paintNew() {
    const b = $("[data-new-badge]");
    if (b) { b.hidden = !fresh.length; b.textContent = fresh.length; }
    const tab = $("[data-otab='new'] b");
    if (tab) tab.textContent = fresh.length;
    document.title = (fresh.length ? `(${fresh.length}) ` : "") + TITLE;
  }
  function ding() {
    try {
      const ctx = ding.ctx || (ding.ctx = new (window.AudioContext || window.webkitAudioContext)());
      ctx.resume();
      [[880, 0], [1318.5, 0.15]].forEach(([f, t]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), at = ctx.currentTime + t;
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
        o.connect(g).connect(ctx.destination);
        o.start(at);
        o.stop(at + 0.65);
      });
    } catch (e) { /* no sound on this device */ }
  }
  async function checkOrders(first) {
    if (!S.session || !(S.live && !S.session.demo)) return;
    try { fresh = await S.newOrders(); } catch (e) { return; }
    paintNew();
    const arrived = fresh.filter((o) => o.id > seenId);
    if (!arrived.length) return;
    seenId = Math.max(seenId, ...arrived.map((o) => o.id));
    try { localStorage.setItem(SEEN, seenId); } catch (e) { /* storage off */ }
    if (view === "orders" && ordersView.reload) ordersView.reload();
    if (first) return toast(`🔔 Нових заявок: ${arrived.length}`);
    ding();
    arrived.forEach((o) => toast(`🔔 Нова заявка ${o.number} — ${o.name}, ${eur(o.total)}`));
    if ("Notification" in window && Notification.permission === "granted") {
      arrived.forEach((o) => {
        try {
          const n = new Notification(`Нова заявка ${o.number}`, { body: `${o.name} · ${eur(o.total)}`, icon: CHERRY, tag: `order-${o.id}` });
          n.onclick = () => { focus(); location.hash = "orders"; n.close(); };
        } catch (e) { /* notifications off */ }
      });
    }
  }
  function watchOrders() {
    checkOrders(true);
    if (watchOrders.on) return;
    watchOrders.on = true;
    setInterval(() => checkOrders(), 20000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) checkOrders(); });
  }

  function orderHTML(o) {
    const items = Array.isArray(o.items) ? o.items : [];
    const pics = (o.photos || []).map(safeUrl).filter(Boolean);
    const wa = waOf(o.phone);
    const [to, label] = NEXT[o.status] || NEXT.new;
    return `<article class="a-ord a-ord--${esc(o.status)}" data-o="${o.id}">
      <header class="a-ord__top"><b class="a-ord__no">${esc(o.number)}</b><span class="a-ord__st">${esc(ST[o.status] || o.status)}</span><small>${esc(when(o.created_at))}</small><strong class="a-ord__sum">${eur(o.total)}</strong></header>
      <div class="a-ord__who"><b>${esc(o.name)}</b>${o.phone ? `<a href="tel:${esc(o.phone.replace(/[^\d+]/g, ""))}">${esc(o.phone)}</a>` : ""}${wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp ↗</a>` : ""}${o.email ? `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a>` : ""}</div>
      <p class="a-ord__when"><span>📅 ${esc(o.date || "дата не вказана")}</span><span>${o.way === "delivery" ? `🚚 доставка${o.address ? " — " + esc(o.address) : ""}` : "🏪 самовивіз"}</span></p>
      <ul class="a-ord__items">${items.map((i) => {
        const img = safeUrl(i.image), link = safeUrl(i.link);
        return `<li>${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<img class="is-ph" src="${CHERRY}" alt="">`}<span><span><b>${esc(i.name)}</b> ×${+i.qty || 1}</span>${i.meta ? `<small>${esc(i.meta)}</small>` : ""}${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">Відкрити дизайн ↗</a>` : ""}</span><em>${eur((+i.price || 0) * (+i.qty || 1))}</em></li>`;
      }).join("")}</ul>
      ${items.filter((i) => i.idea).map((i) => `<blockquote class="a-ord__q"><span>Ідея гостя</span>${esc(i.idea)}</blockquote>`).join("")}
      ${o.comment ? `<blockquote class="a-ord__q a-ord__q--note"><span>Коментар</span>${esc(o.comment)}</blockquote>` : ""}
      ${pics.length ? `<div class="a-ord__pics">${pics.map((u, k) => `<button type="button" data-pic="${k}" aria-label="Фото ${k + 1} з ${pics.length}"><img src="${esc(u)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
      <footer class="a-ord__acts"><button class="a-btn a-btn--sm" type="button" data-ost="${to}">${label}</button><button class="a-btn a-btn--ghost a-btn--sm" type="button" data-ocopy>Скопіювати текст</button><button class="a-btn a-btn--danger a-btn--sm" type="button" data-odel>Видалити</button></footer>
    </article>`;
  }

  async function ordersView(main) {
    const live = S.live && !S.session.demo;
    const canNotify = "Notification" in window && Notification.permission !== "granted";
    const acts = live ? `${canNotify ? '<button class="a-btn a-btn--ghost a-btn--sm" type="button" data-notify>🔔 Сповіщення на цьому пристрої</button>' : ""}<button class="a-btn a-btn--sm" type="button" data-tg>✈️ Telegram</button>` : "";
    main.innerHTML = head("Заявки", "з кошика на сайті", acts)
      + `<p class="a-note">Заявка з'являється тут одразу після «Сформувати заявку» на сайті — з контактами, тортом, ідеєю й фото гостя. Підключіть Telegram, щоб отримувати їх і тоді, коли адмінка закрита.</p>`
      + (live
        ? `<div class="a-otabs">${[["new", "Нові"], ["work", "В роботі"], ["done", "Готові"], ["all", "Усі"]].map(([k, l]) => `<button type="button" class="a-otab${orderTab === k ? " is-on" : ""}" data-otab="${k}">${l}${k === "new" ? ` <b>${fresh.length}</b>` : ""}</button>`).join("")}</div><div class="a-orders" data-orders><p class="a-empty">Завантажую…</p></div>`
        : `<p class="a-empty">Заявки з'являються тут, коли сайт підключено до Supabase.</p>`);
    ordersView.reload = null;
    if (!live) return;
    const box = $("[data-orders]", main);
    const draw = () => {
      const list = orders.filter((o) => orderTab === "all" || o.status === orderTab);
      box.innerHTML = list.length ? list.map(orderHTML).join("")
        : `<p class="a-empty">${orderTab === "new" ? "Нових заявок немає — усе розібрано ♥" : "Тут поки порожньо."}</p>`;
    };
    const load = async () => {
      try { orders = await S.orders(); }
      catch (e) {
        box.innerHTML = `<p class="a-empty">${esc(noSetup(e.message) ? "Таблиці заявок у Supabase ще немає — виконайте supabase/setup.sql у SQL Editor (README)." : e.message)}</p>`;
        return;
      }
      if (box.isConnected) draw();
    };
    ordersView.reload = load;
    main.onclick = async (e) => {
      if (e.target.closest("[data-tg]")) return telegramSetup();
      if (e.target.closest("[data-notify]")) {
        const p = await Notification.requestPermission();
        toast(p === "granted" ? "Сповіщення увімкнено — поки адмінка відкрита, нові заявки спливатимуть на екрані" : "Браузер не дозволив сповіщення", p !== "granted");
        if (p === "granted") e.target.closest("[data-notify]").remove();
        return;
      }
      const tab = e.target.closest("[data-otab]");
      if (tab) {
        orderTab = tab.dataset.otab;
        $$("[data-otab]", main).forEach((b) => b.classList.toggle("is-on", b === tab));
        return orders && draw();
      }
      const card = e.target.closest("[data-o]");
      const o = card && orders && orders.find((x) => x.id === +card.dataset.o);
      if (!o) return;
      const pic = e.target.closest("[data-pic]");
      if (pic) return lightbox((o.photos || []).map(safeUrl).filter(Boolean), +pic.dataset.pic);
      try {
        const st = e.target.closest("[data-ost]");
        if (st) {
          await S.updateOrder(o.id, { status: st.dataset.ost });
          o.status = st.dataset.ost;
          toast(o.status === "work" ? `${o.number} — в роботі` : o.status === "done" ? `${o.number} — готово ✓` : "Повернуто");
          draw();
          checkOrders();
        }
        if (e.target.closest("[data-ocopy]")) {
          const photos = (o.photos || []).length ? `\n\nФото:\n${o.photos.join("\n")}` : "";
          await navigator.clipboard.writeText((o.text || o.number) + photos);
          toast("Текст заявки скопійовано");
        }
        if (e.target.closest("[data-odel]")) {
          if (!confirm(`Видалити заявку ${o.number} від «${o.name}» разом з її фото? Це назавжди.`)) return;
          await S.deleteOrder(o);
          orders = orders.filter((x) => x !== o);
          draw();
          checkOrders();
          toast("Видалено ✓");
        }
      } catch (err) { toast(err.message, true); }
    };
    load();
  }

  // a photo full-screen: ← → between the order's photos, Esc closes
  function lightbox(urls, at) {
    if (!urls.length) return;
    let i = at || 0;
    const lb = document.createElement("div");
    lb.className = "a-lb";
    lb.innerHTML = `<button class="a-icon a-lb__x" type="button" data-lb-x aria-label="Закрити">✕</button>${urls.length > 1 ? '<button class="a-lb__nav" type="button" data-lb="-1" aria-label="Попереднє фото">‹</button><button class="a-lb__nav a-lb__nav--next" type="button" data-lb="1" aria-label="Наступне фото">›</button>' : ""}<figure><img alt=""><figcaption></figcaption></figure>`;
    const show = () => {
      $("img", lb).src = urls[i];
      $("figcaption", lb).innerHTML = `${i + 1} / ${urls.length} · <a href="${esc(urls[i])}" target="_blank" rel="noopener">Відкрити оригінал ↗</a>`;
    };
    const go = (d) => { i = (i + d + urls.length) % urls.length; show(); };
    const key = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    const close = () => { lb.remove(); removeEventListener("keydown", key); };
    lb.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-lb]");
      if (nav) go(+nav.dataset.lb);
      else if (e.target === lb || e.target.closest("[data-lb-x]")) close();
    });
    addEventListener("keydown", key);
    document.body.append(lb);
    show();
    $("[data-lb-x]", lb).focus();
  }

  // Telegram: a bot from @BotFather, the chat found by itself once someone writes to the bot, a test message
  async function telegramSetup() {
    const d = $("[data-drawer]");
    const box = $(".a-drawer__box", d);
    box.innerHTML = `<div class="a-drawer__head"><h2>Заявки в Telegram</h2><button class="a-icon" type="button" data-close aria-label="Закрити">✕</button></div>
      <div class="a-drawer__body a-tg">
        <p class="a-note">Кожна нова заявка з сайту прийде в Telegram — з контактами, тортом, ідеєю і фото. Навіть коли адмінка закрита.</p>
        <ol class="a-tg__steps">
          <li><p><b>Створіть бота.</b> У Telegram відкрийте <a href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a> → <code>/newbot</code> → придумайте назву. Він дасть токен — вставте його сюди:</p>
            <label class="a-field"><span>Токен бота</span><input class="a-input" data-tg-token autocomplete="off" spellcheck="false" placeholder="123456789:AA…"></label></li>
          <li><p><b>Напишіть боту.</b> Відкрийте свого бота й натисніть «Start». Щоб заявки бачила вся команда — додайте бота в спільну групу й напишіть там будь-що. Потім:</p>
            <div><button class="a-btn a-btn--ghost a-btn--sm" type="button" data-tg-find>Знайти чат</button></div>
            <div class="a-tg__chats" data-tg-chats></div>
            <label class="a-field"><span>Chat ID</span><input class="a-input" data-tg-chat autocomplete="off" spellcheck="false" placeholder="заповниться саме"></label></li>
          <li><p><b>Перевірте.</b> «Надіслати тест» — бот напише в обраний чат.</p></li>
        </ol>
        <p class="a-tg__res" data-tg-res role="status" hidden></p>
      </div>
      <div class="a-drawer__foot"><button class="a-btn a-btn--ghost" type="button" data-tg-save>Зберегти</button><button class="a-btn" type="button" data-tg-test>Надіслати тест</button></div>`;
    d.classList.add("is-on");
    const token = $("[data-tg-token]", box), chat = $("[data-tg-chat]", box), res = $("[data-tg-res]", box);
    const say = (msg, ok) => { res.hidden = false; res.className = `a-tg__res ${ok ? "is-ok" : "is-bad"}`; res.textContent = msg; };
    const setupHint = "Спершу виконайте supabase/setup.sql у SQL Editor (README), потім відкрийте це вікно знову.";
    const explain = (m) => (/chat not found/i.test(m) ? "Telegram не знайшов чат — напишіть боту «/start» і натисніть «Знайти чат»"
      : /unauthorized|not found/i.test(m) ? "Токен не підходить — скопіюйте його з @BotFather ще раз"
      : /blocked|kicked/i.test(m) ? "Бота заблоковано або видалено з чату — додайте його знову" : m);
    try {
      const t = await S.telegram();
      token.value = t.bot_token || "";
      chat.value = t.chat_id || "";
    } catch (e) { say(noSetup(e.message) ? setupHint : e.message); }
    $("[data-tg-find]", box).addEventListener("click", async () => {
      const tk = token.value.trim();
      if (!/^\d+:[\w-]{20,}$/.test(tk)) return say("Спершу вставте токен від @BotFather");
      try {
        const r = await fetch(`https://api.telegram.org/bot${tk}/getUpdates`).then((x) => x.json());
        if (!r.ok) return say(explain(r.description || ""));
        const chats = new Map();
        r.result.forEach((u) => {
          const c = (u.message || u.edited_message || u.channel_post || u.my_chat_member || {}).chat;
          if (c) chats.set(String(c.id), c.title || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.username || String(c.id));
        });
        if (!chats.size) return say("Бот ще не бачить жодного чату — напишіть йому «/start» і натисніть ще раз");
        $("[data-tg-chats]", box).innerHTML = [...chats].map(([id, n]) => `<button type="button" data-tg-pick="${esc(id)}"${chats.size === 1 ? ' class="is-on"' : ""}>${esc(n)}<small>${+id < 0 ? "група" : "особисто"}</small></button>`).join("");
        if (chats.size === 1) chat.value = [...chats.keys()][0];
        say(chats.size === 1 ? "Чат знайдено ✓ Тепер «Надіслати тест»" : "Оберіть чат, куди слати заявки", true);
      } catch (e) { say("Не вдалося зв'язатися з Telegram — перевірте інтернет або вставте Chat ID вручну"); }
    });
    box.onclick = (e) => {
      const p = e.target.closest("[data-tg-pick]");
      if (!p) return;
      chat.value = p.dataset.tgPick;
      $$("[data-tg-pick]", box).forEach((b) => b.classList.toggle("is-on", b === p));
    };
    const keep = () => S.saveTelegram({ bot_token: token.value.trim(), chat_id: chat.value.trim(), admin_url: location.href.split("#")[0] + "#orders" });
    $("[data-tg-save]", box).addEventListener("click", async () => {
      try { await keep(); say(token.value.trim() ? "Збережено ✓" : "Telegram вимкнено", true); }
      catch (e) { say(noSetup(e.message) ? setupHint : e.message); }
    });
    $("[data-tg-test]", box).addEventListener("click", async (e) => {
      const b = e.currentTarget;
      if (!token.value.trim() || !chat.value.trim()) return say("Потрібні токен і Chat ID");
      b.disabled = true;
      say("Надсилаю…", true);
      try {
        await keep();
        const r = await S.telegramTest();
        if (r.ok) say("✓ Готово! Повідомлення вже в Telegram — нові заявки приходитимуть туди.", true);
        else say(explain(r.error));
      } catch (err) { say(noSetup(err.message) ? setupHint : err.message); }
      b.disabled = false;
    });
  }

  // ── the drawer with one item
  function closeDrawer() {
    const d = $("[data-drawer]");
    if (d) d.classList.remove("is-on");
  }
  // «+ Додати»: first what it is — a cake, a dessert of one of the sections, a filling — and it lands where it belongs
  function addWhat() {
    const m = document.createElement("div");
    m.className = "a-modal";
    m.innerHTML = `<div class="a-modal__box a-what">
      <div class="a-modal__head"><h3>Що додаємо?</h3><button class="a-icon" type="button" data-x aria-label="Закрити">✕</button></div>
      <div class="a-modal__body">
        <button class="a-what__it" type="button" data-to="cakes"><img src="../img/cutouts/gl-roses.webp" alt=""><b>Торт</b><span>фото, ціна, вага й порції, начинки — і він у каталозі та на вітрині</span></button>
        <div class="a-what__it a-what__it--dessert"><img src="../img/cakes/macarons.jpg" alt=""><b>Десерт</b><span>оберіть розділ — туди він і стане:</span>
          <div class="a-what__cats">${(data.dessertCats || []).filter((c) => c.id !== "all").map((c) => `<button class="a-btn a-btn--ghost a-btn--sm" type="button" data-to="desserts" data-cat="${esc(c.id)}">${esc(c.label)}</button>`).join("")}</div></div>
        <button class="a-what__it" type="button" data-to="flavors"><span class="a-what__flv">${stripes("", ["#4a2418", "#c2263f", "#f2dfa6"])}</span><b>Начинка</b><span>назва, склад і кольори шарів розрізу</span></button>
      </div></div>`;
    document.body.append(m);
    m.addEventListener("click", (e) => {
      if (e.target === m || e.target.closest("[data-x]")) return m.remove();
      const t = e.target.closest("[data-to]");
      if (!t) return;
      m.remove();
      if (location.hash.slice(1) !== t.dataset.to) location.hash = t.dataset.to;
      editItem(t.dataset.to, -1, t.dataset.cat ? { cat: t.dataset.cat } : null);
    });
  }

  function editItem(key, i, preset) {
    const s = SCHEMA[key];
    const list = data[key];
    const isNew = i < 0;
    const work = isNew ? Object.assign(s.blank(), preset) : clone(list[i]);
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
  M.ready.then(() => (S.session && (!S.session.demo || LOCAL) ? start() : loginView()));
})();
