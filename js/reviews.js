/* Mariday — "Пошта від гостей": review store, postcard renderer and the postcard composer.
   Home: postcards pegged on a clothesline that slides on by itself (#reviews). pages/reviews.html: the full mail wall.
   Reviews go to Supabase when MARIDAY.reviewsBackend is filled in, otherwise to this browser's storage. */
(function () {
  const M = window.MARIDAY || {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const live = !!window.gsap && !reduce;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const ROOT = location.pathname.includes("/pages/") ? "../" : "";
  const LOCAL_KEY = "mariday.reviews.v1";
  const LAST_KEY = "mariday.reviews.last";
  const SPRINKLES = ["#6d0809", "#f5bcc8", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff", "#9ed9b8"];

  const COLORS = {
    pink: { bg: "#f5bcc8", ink: "#6d0809", label: "Рожевий" },
    mint: { bg: "#e9f6f4", ink: "#6d0809", label: "М'ятний" },
    butter: { bg: "#fbe6b8", ink: "#6d0809", label: "Вершковий" },
    sky: { bg: "#bcd6f3", ink: "#3d0405", label: "Блакитний" },
    cherry: { bg: "#6d0809", ink: "#f5bcc8", label: "Вишневий" },
  };
  const STAMPS = {
    roses: "Троянди",
    pink: "Рожевий торт",
    cherrycup: "Вишневий капкейк",
    macarons: "Макарони",
    strawberries: "Полуниця",
    redvelvet: "Червоний оксамит",
    cupcakes: "Капкейки",
    forest: "Чорний ліс",
  };
  // any photo from img/cakes may be a stamp (seed reviews use `img`); the composer cycles through STAMPS
  const PHOTOS = new Set([...Object.keys(STAMPS), "berries", "blackoreo", "brownie", "cherrymint", "cherrypair", "choccup", "cookie", "donuts", "drip", "fraisier", "gold", "lilac", "meringue", "mint", "mousse", "oreo", "pastel", "pinkmac", "piping", "raspberries", "slice", "strawslice", "swirl", "tiramisu", "vanilla", "yellow"]);
  const OCC = new Map((M.reviewOccasions || []).map((o) => [o.id, o.label]));
  const OCC_BY_LABEL = new Map([...OCC].map(([id, label]) => [label.toLowerCase(), id]));
  const hash = (str) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  // a stamp is one of the site's photos, or — for reviews added in the admin panel — an uploaded photo
  const isUpload = (k) => /^(https:\/\/|data:image\/)/.test(String(k || ""));
  const stampSrc = (k) => (isUpload(k) ? k : `${ROOT}img/cakes/${k}.jpg`);
  const plural = (n, forms) => {
    const a = n % 10, b = n % 100;
    return forms[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 1 : 2];
  };
  const fmtDate = (d) => new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));

  /* ───────── Store ───────── */
  const cfg = M.reviewsBackend || {};
  const remote = !!(cfg.supabaseUrl && cfg.supabaseKey);
  const endpoint = remote ? `${cfg.supabaseUrl.replace(/\/+$/, "")}/rest/v1/${cfg.table || "reviews"}` : "";
  const authHeaders = remote ? { apikey: cfg.supabaseKey, Authorization: `Bearer ${cfg.supabaseKey}` } : {};

  // Every review passes through here — from seeds, storage, the network or the form — so nothing unexpected reaches the page
  function clean(r) {
    if (!r || typeof r !== "object") return null;
    const name = String(r.name || "").replace(/\s+/g, " ").trim().slice(0, 40);
    const text = String(r.text || "").trim().slice(0, 400);
    if (!name || text.length < 3) return null;
    const raw = r.date || r.created_at;
    const date = raw ? new Date(raw) : null;
    const h = hash(name + text);
    const occ = String(r.occasion || "");
    const colorKeys = Object.keys(COLORS);
    const stampKeys = Object.keys(STAMPS);
    return {
      id: String(r.id || `s${h.toString(36)}`).slice(0, 64),
      name,
      text,
      city: String(r.city || "").replace(/\s+/g, " ").trim().slice(0, 30),
      product: String(r.product || "").replace(/\s+/g, " ").trim().slice(0, 60),
      rating: Math.min(5, Math.max(1, Math.round(+(r.rating ?? r.stars)) || 5)),
      occasion: OCC.has(occ) ? occ : OCC_BY_LABEL.get(occ.toLowerCase()) || "justbecause",
      color: COLORS[r.color] ? r.color : colorKeys[h % colorKeys.length],
      stamp: PHOTOS.has(r.stamp) ? r.stamp : PHOTOS.has(r.img) || (r.seed && isUpload(r.img)) ? r.img : stampKeys[h % stampKeys.length],
      date: date && !isNaN(date) ? date.toISOString() : "",
      sample: !!r.sample,
    };
  }

  function readLocal() {
    try {
      const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      return Array.isArray(list) ? list.map(clean).filter(Boolean) : [];
    } catch { return []; }
  }
  function writeLocal(list) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 50))); } catch { /* storage unavailable */ }
  }

  let cache = null;
  const mine = new Set(readLocal().map((r) => r.id));

  async function load() {
    if (cache) return cache;
    let rows = [];
    if (remote) {
      try {
        const res = await fetch(`${endpoint}?select=id,name,text,city,rating,occasion,color,stamp,created_at&order=created_at.desc&limit=300`, { headers: authHeaders });
        if (res.ok) rows = await res.json();
      } catch { /* offline: fall back to seeds + local */ }
    }
    // the same postcard can come back from storage and from the server under different ids
    const seen = new Set();
    // seed postcards without a paper colour take turns, so neighbours on the line never match
    const paper = Object.keys(COLORS);
    // `seed`: written by the shop (data.js / admin panel), so its uploaded photo may be used; guests only pick site photos
    const seeds = (M.reviews || []).map((r, i) => ({ ...r, seed: true, color: r.color || paper[i % paper.length] }));
    cache = [...readLocal(), ...(Array.isArray(rows) ? rows : []), ...seeds]
      .map(clean)
      .filter((r) => r && !seen.has(`${r.name}|${r.text}`) && seen.add(`${r.name}|${r.text}`))
      .sort((a, b) => b.date.localeCompare(a.date)); // undated seed postcards keep their order at the end
    return cache;
  }

  async function add(input) {
    const r = clean({ ...input, date: new Date().toISOString() });
    if (!r) throw new Error("invalid");
    if (remote) {
      const { name, text, city, rating, occasion, color, stamp } = r;
      const res = await fetch(endpoint, {
        method: "POST",
        // return=minimal: with moderation on, a guest can't read back their own unapproved row
        headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ name, text, city, rating, occasion, color, stamp }),
      });
      if (!res.ok) throw new Error("network");
    }
    r.id = "l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    writeLocal([r, ...readLocal()]);
    mine.add(r.id);
    if (cache) cache = [r, ...cache];
    else await load(); // first load picks r up from storage
    document.dispatchEvent(new CustomEvent("mariday:review", { detail: r }));
    return r;
  }

  function stats(list) {
    const dist = [0, 0, 0, 0, 0];
    list.forEach((r) => dist[r.rating - 1]++);
    const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 5;
    return { count: list.length, avg, dist };
  }

  /* ───────── Bits of paper ───────── */
  const CHERRY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="st" d="M12.5 3.2c-1.2 4.4-3.6 7.3-6.4 9.4M12.5 3.2c.4 4.5 1.9 7.8 4.6 9.8M12.5 3.2c1.6-1 3.6-1 5.2.1"/><circle cx="6.4" cy="16.4" r="4.4"/><circle cx="17.2" cy="17" r="4.4"/></svg>';
  const cherries = (n) => Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? "on" : ""}">${CHERRY}</i>`).join("");

  let pmSeq = 0;
  function postmark(date) {
    const id = `xpm${++pmSeq}`;
    const d = date ? new Date(date) : null;
    const lines = [40, 52, 64, 76].map((y) => `<path d="M118,${y} q9,-7 18,0 t18,0 t18,0 t18,0"/>`).join("");
    return `<svg viewBox="0 0 200 120" aria-hidden="true">
      <defs><path id="${id}" d="M60,60 m-39,0 a39,39 0 1,1 78,0 a39,39 0 1,1 -78,0"/></defs>
      <g fill="none" stroke="currentColor"><circle cx="60" cy="60" r="52" stroke-width="2.6"/><circle cx="60" cy="60" r="27" stroke-width="1.4"/><g stroke-width="2.4" stroke-linecap="round">${lines}</g></g>
      <text class="ring" fill="currentColor" textLength="240" lengthAdjust="spacing"><textPath href="#${id}">ALKMAAR ✦ MARIDAY CAKE ✦ NL ✦</textPath></text>
      <text class="day" x="60" y="${d ? 60 : 66}" text-anchor="middle" fill="currentColor">${d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}` : "✦"}</text>
      ${d ? `<text class="yr" x="60" y="75" text-anchor="middle" fill="currentColor">${d.getFullYear()}</text>` : ""}
    </svg>`;
  }

  // the guest's city goes round the postmark ring (textContent, never markup)
  function stampCity(root, city) {
    const tp = $("textPath", root);
    if (tp && city) tp.textContent = `${city.toUpperCase()} ✦ MARIDAY CAKE ✦ `;
  }

  // Static structure from a template; anything a guest typed is set with textContent only
  function card(r, { clamp = false } = {}) {
    const c = COLORS[r.color];
    const el = document.createElement("article");
    el.className = `x-pc${clamp ? " x-pc--clamp" : ""}${r.color === "cherry" ? " x-pc--dark" : ""}`;
    el.style.setProperty("--pc", c.bg);
    el.style.setProperty("--pt", c.ink);
    el.dataset.id = r.id;
    el.innerHTML = `
      <div class="x-pc__inner">
        <div class="x-pc__face x-pc__front">
          <div class="x-pc__msg">
            <p class="x-pc__text"></p>
            ${r.product ? '<p class="x-pc__about"><i>про:</i> <span></span></p>' : ""}
            <p class="x-pc__sign"><span></span></p>
          </div>
          <div class="x-pc__side">
            <span class="x-pc__stamp"><img src="${stampSrc(r.stamp)}" alt="" loading="lazy" draggable="false"></span>
            <span class="x-pc__pm">${postmark(r.date)}</span>
            <span class="x-pc__rate" role="img" aria-label="Оцінка ${r.rating} з 5">${cherries(r.rating)}</span>
            <span class="x-pc__line"><i>привід:</i> <b></b></span>
            <span class="x-pc__line"><i>кому:</i> Mariday Cake</span>
          </div>
        </div>
        <div class="x-pc__face x-pc__back" aria-hidden="true">
          <img src="${stampSrc(r.stamp)}" alt="" loading="lazy" draggable="false">
          <span class="x-pc__hello">Привіт від</span>
          <b class="x-pc__big">Mari<br>day</b>
          <span class="x-pc__meta"></span>
        </div>
      </div>
      <button type="button" class="x-pc__flip" aria-pressed="false" aria-label="Перевернути листівку">↻</button>`;
    $(".x-pc__text", el).textContent = r.text;
    $(".x-pc__sign span", el).textContent = r.name;
    $(".x-pc__line b", el).textContent = OCC.get(r.occasion) || "";
    if (r.product) $(".x-pc__about span", el).textContent = r.product;
    $(".x-pc__meta", el).textContent = `${r.city || "Alkmaar"} ✦ ${r.date ? fmtDate(r.date) : "Mariday Cake"}`;
    stampCity($(".x-pc__pm", el), r.city);
    if (mine.has(r.id)) el.insertAdjacentHTML("afterbegin", '<span class="x-pc__mine">ваша ♥</span>');
    return el;
  }

  // Click anywhere on a postcard (or its ↻ button) to turn it over
  function flippable(root, isDrag = () => false) {
    root.addEventListener("click", (e) => {
      const pc = e.target.closest(".x-pc");
      const btn = pc && $(".x-pc__flip", pc);
      if (!btn || !root.contains(pc) || isDrag() || e.target.closest("a")) return;
      btn.setAttribute("aria-pressed", String(pc.classList.toggle("is-flipped")));
    });
  }

  /* ───────── Little celebrations ───────── */
  function burst(x, y, n = 34) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("i");
      s.className = "x-burst";
      s.style.cssText = `left:${x}px;top:${y}px;background:${SPRINKLES[i % SPRINKLES.length]}`;
      document.body.appendChild(s);
      const a = Math.random() * Math.PI * 2;
      const d = 80 + Math.random() * 160;
      s.animate(
        [{ transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 90}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 }],
        { duration: 900 + Math.random() * 600, easing: "cubic-bezier(.15,.8,.3,1)" }
      ).onfinish = () => s.remove();
    }
  }

  function toast(msg) {
    let t = $(".x-rvtoast");
    if (!t) {
      t = document.createElement("p");
      t.className = "x-rvtoast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove("is-on"), 3600);
  }

  /* ───────── Composer: the form is a postcard you write on ───────── */
  let cmpSeq = 0;
  function composer(host, { onSent } = {}) {
    if (!host) return;
    const u = `xc${++cmpSeq}`;
    const stampKeys = Object.keys(STAMPS);
    let stampIdx = 0;
    host.innerHTML = `
      <form class="x-cmp" novalidate>
        <div class="x-cmp__card">
          <div class="x-cmp__msg">
            <label class="x-cmp__dear" for="${u}-text">Дорога Mariday,</label>
            <textarea id="${u}-text" name="text" rows="5" maxlength="400" required placeholder="Торт був… Гості сказали… Найбільше сподобалось…"></textarea>
            <div class="x-cmp__sign"><label for="${u}-name">з любов'ю,</label><input id="${u}-name" name="name" maxlength="40" autocomplete="given-name" required placeholder="ваше ім'я"></div>
          </div>
          <div class="x-cmp__side">
            <button type="button" class="x-cmp__stamp" data-stamp><img src="${stampSrc(stampKeys[0])}" alt=""><span>↻ інша марка</span></button>
            <fieldset class="x-cmp__rate" data-rate="5">
              <legend>Оцінка</legend>
              ${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="rating" value="${n}"${n === 5 ? " checked" : ""}>${CHERRY}<span class="x-sr">${n} з 5</span></label>`).join("")}
            </fieldset>
            <label class="x-cmp__line"><i>звідки:</i><input name="city" maxlength="30" autocomplete="address-level2" placeholder="Alkmaar"></label>
            <label class="x-cmp__line"><i>привід:</i><select name="occasion">${[...OCC].map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}</select></label>
            <span class="x-cmp__line"><i>кому:</i> Mariday Cake</span>
          </div>
          <div class="x-cmp__pm" aria-hidden="true"></div>
        </div>
        <div class="x-cmp__bar">
          <fieldset class="x-cmp__colors">
            <legend>Папір</legend>
            ${Object.entries(COLORS).map(([id, c], i) => `<label style="--sw:${c.bg}"><input type="radio" name="color" value="${id}"${i === 0 ? " checked" : ""}><span class="x-sr">${c.label}</span></label>`).join("")}
          </fieldset>
          <span class="x-cmp__count" aria-hidden="true"><b>0</b> / 400</span>
          <label class="x-cmp__hp" aria-hidden="true">Не заповнюйте<input name="website" tabindex="-1" autocomplete="off"></label>
          <button type="submit" class="x-cmp__send"><span>Надіслати листівку</span> <i aria-hidden="true">✉</i></button>
        </div>
        <p class="x-cmp__err" role="alert"></p>
      </form>`;

    const form = $("form", host);
    const paper = $(".x-cmp__card", form);
    const stampBtn = $("[data-stamp]", form);
    const rate = $(".x-cmp__rate", form);
    const err = $(".x-cmp__err", form);
    const send = $(".x-cmp__send", form);
    const text = form.elements.text;
    const count = $(".x-cmp__count b", form);

    const setStamp = () => {
      const k = stampKeys[stampIdx];
      $("img", stampBtn).src = stampSrc(k);
      stampBtn.setAttribute("aria-label", `Марка: ${STAMPS[k]}. Натисніть, щоб змінити`);
    };
    const setColor = () => {
      const c = COLORS[form.elements.color.value] || COLORS.pink;
      paper.style.setProperty("--pc", c.bg);
      paper.style.setProperty("--pt", c.ink);
    };
    setStamp();
    setColor();

    stampBtn.addEventListener("click", () => {
      stampIdx = (stampIdx + 1) % stampKeys.length;
      if (live) gsap.fromTo(stampBtn, { rotation: -14, scale: 0.8 }, { rotation: 4, scale: 1, duration: 0.6, ease: "back.out(3)" });
      setStamp();
    });
    form.addEventListener("change", (e) => {
      if (e.target.name === "color") setColor();
      if (e.target.name === "rating") rate.dataset.rate = e.target.value;
    });
    // hovering the cherries previews the score
    $$("label", rate).forEach((l, i) => l.addEventListener("pointerenter", () => { rate.dataset.hover = i + 1; }));
    rate.addEventListener("pointerleave", () => { delete rate.dataset.hover; });
    text.addEventListener("input", () => {
      count.textContent = text.value.length;
      err.textContent = "";
    });
    form.elements.name.addEventListener("input", () => { err.textContent = ""; });

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    let busy = false;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      if (form.elements.website.value) return; // bots fill hidden fields
      const name = form.elements.name.value.trim();
      const msg = text.value.trim();
      if (msg.length < 10) { err.textContent = "Напишіть хоча б кілька слів — від 10 символів."; return text.focus(); }
      if (name.length < 2) { err.textContent = "Підпишіть листівку — як вас звати?"; return form.elements.name.focus(); }
      try {
        if (Date.now() - (+localStorage.getItem(LAST_KEY) || 0) < 30000) { err.textContent = "Листівка щойно пішла — зачекайте пів хвилини перед наступною."; return; }
      } catch { /* storage unavailable */ }

      busy = true;
      send.disabled = true;
      $("span", send).textContent = "Надсилаємо…";
      try {
        const r = await add({ name, text: msg, city: form.elements.city.value, rating: form.elements.rating.value, occasion: form.elements.occasion.value, color: form.elements.color.value, stamp: stampKeys[stampIdx] });
        try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch { /* storage unavailable */ }
        // the postmark slams down, then the card flies off
        const pm = $(".x-cmp__pm", form);
        pm.innerHTML = postmark(r.date);
        stampCity(pm, r.city);
        if (live) {
          await gsap.fromTo(pm, { scale: 2.6, opacity: 0, rotation: -40 }, { scale: 1, opacity: 0.9, rotation: -14, duration: 0.32, ease: "power4.in" });
          gsap.fromTo(paper, { y: 0 }, { y: 7, duration: 0.07, yoyo: true, repeat: 1 });
          await wait(450);
          await gsap.to(paper, { y: -80, x: 60, rotation: 10, scale: 0.55, opacity: 0, duration: 0.6, ease: "power3.in" });
        } else {
          pm.style.opacity = 0.9;
          await wait(700);
        }
        form.reset();
        rate.dataset.rate = "5";
        count.textContent = "0";
        stampIdx = 0;
        setStamp();
        setColor();
        pm.innerHTML = "";
        pm.style.opacity = "";
        if (live) gsap.fromTo(paper, { y: 40, x: 0, rotation: 0, scale: 1, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "expo.out", clearProps: "transform,opacity" });
        onSent?.(r);
      } catch {
        err.textContent = "Не вдалося надіслати. Перевірте з'єднання й спробуйте ще раз.";
      } finally {
        busy = false;
        send.disabled = false;
        $("span", send).textContent = "Надіслати листівку";
      }
    });
    return form;
  }

  /* ───────── Seal with the average score ───────── */
  function seal(host, list) {
    if (!host) return;
    const s = stats(list);
    let bumps = "";
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      bumps += `<circle cx="${(100 + Math.cos(a) * 86).toFixed(1)}" cy="${(100 + Math.sin(a) * 86).toFixed(1)}" r="11"/>`;
    }
    const label = `${s.count} ${plural(s.count, ["листівка", "листівки", "листівок"])}`;
    host.setAttribute("aria-label", `Середня оцінка ${s.avg.toFixed(1)} з 5, ${label}`);
    host.innerHTML = `
      <svg class="x-rvseal__bg" viewBox="0 0 200 200" aria-hidden="true"><g>${bumps}<circle cx="100" cy="100" r="88"/></g></svg>
      <svg class="x-rvseal__ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="xseal" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0"/></defs>
        <text textLength="436" lengthAdjust="spacing"><textPath href="#xseal">ПОШТА ВІД ГОСТЕЙ ✦ ${label.toUpperCase()} ✦ ALKMAAR ✦</textPath></text></svg>
      <span class="x-rvseal__core" aria-hidden="true"><b>${s.avg.toFixed(1)}</b><small>середня</small><span class="x-rvseal__rate">${cherries(Math.round(s.avg))}</span></span>`;
  }

  /* ───────── Home: the clothesline ───────── */
  async function initHome() {
    const sec = $("[data-reviews-home]");
    if (!sec) return;
    const line = $("[data-line]", sec);
    const nEl = $("[data-line-n]", sec);
    const totalEl = $("[data-line-total]", sec);
    const dlg = $("#x-mail");
    const SHOW = 12;
    const AUTO_MS = 5000;
    let hangs = [];

    const pegColors = ["#f5bcc8", "#6d0809", "#bcd6f3", "#fbe6b8", "#e2849a"];
    const slot = (child, i) => {
      const li = document.createElement("li");
      li.className = "x-line__slot";
      li.innerHTML = `<div class="x-line__hang" style="--tilt:${(((i * 37) % 5) - 2) * 0.6}deg"><span class="x-line__peg" style="--peg:${pegColors[i % pegColors.length]}" aria-hidden="true"></span></div>`;
      $(".x-line__hang", li).appendChild(child);
      return li;
    };

    const ctaCard = () => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "x-pc x-pc--cta";
      b.innerHTML = `<span class="x-pc__ctaq">Ваша листівка — наступна?</span><span class="x-pc__ctago">✎ Написати</span><span class="x-pc__stamp"><img src="${ROOT}img/ig-profile.jpg" alt="" loading="lazy"></span>`;
      b.addEventListener("click", openMail);
      return b;
    };

    function render(list, fresh) {
      line.innerHTML = "";
      list.slice(0, SHOW).forEach((r, i) => line.appendChild(slot(card(r, { clamp: true }), i)));
      line.appendChild(slot(ctaCard(), Math.min(list.length, SHOW)));
      hangs = $$(".x-line__hang", line);
      if (totalEl) totalEl.textContent = pad(hangs.length);
      seal($("[data-rv-seal]", sec), list);
      counter();
      if (fresh && live) {
        gsap.from(hangs[0].parentNode, { y: -300, opacity: 0, duration: 1.1, ease: "bounce.out" });
      }
    }

    function counter() {
      const step = hangs[0]?.parentNode.offsetWidth || 1;
      const i = Math.min(hangs.length - 1, Math.round(line.scrollLeft / step));
      if (nEl) nEl.textContent = pad(i + 1);
    }
    line.addEventListener("scroll", counter, { passive: true });

    // trackpad side-swipes scroll the line instead of being eaten by the page's smooth scroll
    line.addEventListener("wheel", (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation(); }, { passive: true });

    // mouse drag scrolls the line; a drag never counts as a click that flips a card
    let drag = null;
    let dragged = false;
    line.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button > 0) return;
      drag = { x: e.clientX, s: line.scrollLeft };
      dragged = false;
    });
    addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!dragged && Math.abs(dx) > 6) { dragged = true; line.classList.add("is-drag"); }
      if (dragged) line.scrollLeft = drag.s - dx;
    });
    addEventListener("pointerup", () => {
      if (!drag) return;
      drag = null;
      line.classList.remove("is-drag");
      setTimeout(() => { dragged = false; }, 0);
    });
    flippable(line, () => dragged);

    // one card per step; past the last card it wraps back to the first
    const behavior = reduce ? "auto" : "smooth";
    function stepBy(dir) {
      const max = line.scrollWidth - line.clientWidth;
      if (dir > 0 && line.scrollLeft >= max - 4) return line.scrollTo({ left: 0, behavior });
      if (dir < 0 && line.scrollLeft <= 4) return line.scrollTo({ left: max, behavior });
      line.scrollBy({ left: dir * (hangs[0]?.parentNode.offsetWidth || 300), behavior });
    }
    $$("[data-line-go]", sec).forEach((b) => b.addEventListener("click", () => { stepBy(+b.dataset.lineGo); restart(); }));
    line.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); stepBy(1); restart(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); stepBy(-1); restart(); }
    });

    // Autoplay: the line moves on by itself, and holds still while someone is reading or handling it
    let timer = 0;
    let inView = false;
    let hover = false;
    const held = () => hover || drag || line.matches(":focus-visible") || $(":focus-visible", line) || dlg?.open || document.hidden;
    function restart() {
      clearTimeout(timer);
      if (reduce || !inView) return;
      timer = setTimeout(() => { if (!held()) stepBy(1); restart(); }, AUTO_MS);
    }
    line.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hover = true; });
    line.addEventListener("pointerleave", () => { hover = false; restart(); });
    line.addEventListener("pointerdown", restart);
    line.addEventListener("wheel", restart, { passive: true });
    line.addEventListener("touchstart", restart, { passive: true });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; restart(); }, { threshold: 0.4 }).observe(line);

    /* the composer lives in a dialog on the home page */
    const lenis = () => window.marLenis || window.MaridayLenis;
    function openMail() {
      if (!dlg) return;
      dlg.showModal();
      lenis()?.stop();
      if (live) gsap.fromTo($(".x-mail__box", dlg), { y: 80, rotation: -4, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "expo.out" });
    }
    if (dlg) {
      $$("[data-mail-open]").forEach((b) => b.addEventListener("click", openMail));
      $$("[data-mail-close]", dlg).forEach((b) => b.addEventListener("click", () => dlg.close()));
      dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener("close", () => lenis()?.start());
      composer($("[data-composer]", dlg), {
        onSent: () => {
          dlg.close();
          line.scrollTo({ left: 0, behavior: "auto" });
          const top = sec.getBoundingClientRect().top + scrollY - 40;
          if (lenis()) lenis().scrollTo(top, { duration: 1 }); else scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
          setTimeout(() => {
            const b = line.getBoundingClientRect();
            burst(b.left + Math.min(b.width, 400) / 2 + 40, b.top + 120);
          }, 500);
          toast("Дякуємо! Ваша листівка вже на мотузці ♥");
        },
      });
    }

    document.addEventListener("mariday:review", () => render(cache, true));
    render(await load(), false);

    // cards drop onto the line when the section scrolls in
    if (live && window.ScrollTrigger) {
      const slots = $$(".x-line__slot", line);
      gsap.from(slots, {
        y: -220,
        opacity: 0,
        duration: 1,
        stagger: 0.09,
        ease: "back.out(1.6)",
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: line, start: "top 82%", once: true },
      });
    }
  }

  /* ───────── pages/reviews.html: the wall ───────── */
  async function initPage() {
    const wall = $("[data-wall]");
    if (!wall) return;
    const chips = $("[data-wall-chips]");
    const sortSel = $("[data-wall-sort]");
    const more = $("[data-wall-more]");
    const empty = $("[data-wall-empty]");
    const PAGE = 12;
    let list = await load();
    let filter = "all";
    let shown = PAGE;
    let cols = 0;
    let freshId = null;

    function renderStats() {
      const s = stats(list);
      seal($("[data-rv-seal]"), list);
      $$("[data-rv-avg]").forEach((el) => { el.textContent = s.avg.toFixed(1); });
      $$("[data-rv-count]").forEach((el) => { el.textContent = `${s.count} ${plural(s.count, ["листівка", "листівки", "листівок"])}`; });
      const note = $("[data-wall-note]");
      if (note) note.hidden = !list.some((r) => r.sample);
      const bars = $("[data-rv-dist]");
      if (bars) {
        const max = Math.max(1, ...s.dist);
        bars.innerHTML = [5, 4, 3, 2, 1].map((n) => `<li><span class="x-dist__k">${n} ${CHERRY}</span><span class="x-dist__bar"><i style="--w:${((s.dist[n - 1] / max) * 100).toFixed(0)}%"></i></span><b>${s.dist[n - 1]}</b></li>`).join("");
      }
    }

    function renderChips() {
      if (!chips) return;
      const n = (id) => list.filter((r) => id === "all" || r.occasion === id).length;
      chips.innerHTML = [["all", "Усі"], ...OCC].map(([id, label]) => `<button type="button" class="x-rvchip${id === filter ? " is-on" : ""}" data-occ="${id}" aria-pressed="${id === filter}">${label} <small>${n(id)}</small></button>`).join("");
    }

    function visible() {
      const out = list.filter((r) => filter === "all" || r.occasion === filter);
      if (sortSel?.value === "best") out.sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date));
      return out;
    }

    function renderWall(anim) {
      const items = visible();
      const n = innerWidth >= 1100 ? 3 : innerWidth >= 680 ? 2 : 1;
      cols = n;
      wall.innerHTML = "";
      const columns = Array.from({ length: n }, () => {
        const c = document.createElement("div");
        c.className = "x-wall2__col";
        wall.appendChild(c);
        return c;
      });
      const cards = items.slice(0, shown).map((r, i) => {
        const el = card(r);
        el.style.setProperty("--tilt", `${((i * 53) % 7) - 3}deg`);
        columns[i % n].appendChild(el);
        return el;
      });
      if (empty) empty.hidden = items.length > 0;
      if (more) more.hidden = items.length <= shown;
      if (live && anim) gsap.fromTo(cards, { y: 60, opacity: 0, rotation: (i) => (i % 2 ? 6 : -6) }, { y: 0, opacity: 1, rotation: 0, duration: 0.9, stagger: 0.05, ease: "expo.out", clearProps: "transform,opacity" });
      const fresh = freshId && cards.find((c) => c.dataset.id === freshId);
      if (fresh) {
        fresh.classList.add("is-fresh");
        if (live) gsap.from(fresh, { y: -200, rotation: -25, scale: 0.5, duration: 1.1, ease: "back.out(1.4)", clearProps: "transform" });
        freshId = null;
      }
    }

    chips?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-occ]");
      if (!b) return;
      filter = b.dataset.occ;
      shown = PAGE;
      renderChips();
      renderWall(true);
    });
    sortSel?.addEventListener("change", () => { shown = PAGE; renderWall(true); });
    more?.addEventListener("click", () => { shown += PAGE; renderWall(false); });
    addEventListener("resize", () => {
      const n = innerWidth >= 1100 ? 3 : innerWidth >= 680 ? 2 : 1;
      if (n !== cols) renderWall(false);
    });
    flippable(wall);

    composer($("[data-composer]"), {
      onSent: (r) => {
        filter = "all";
        if (sortSel) sortSel.value = "new";
        shown = Math.max(shown, PAGE);
        freshId = r.id;
        const top = wall.getBoundingClientRect().top + scrollY - 160;
        if (window.MaridayLenis) window.MaridayLenis.scrollTo(top, { duration: 1.2 }); else scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
        setTimeout(() => {
          const b = wall.getBoundingClientRect();
          burst(b.left + 160, Math.max(120, b.top + 120));
        }, 900);
        toast("Дякуємо! Ваша листівка вже на стіні ♥");
      },
    });

    document.addEventListener("mariday:review", () => {
      list = cache;
      renderStats();
      renderChips();
      renderWall(false);
    });

    renderStats();
    renderChips();
    renderWall(false);
  }

  window.MaridayReviews = { load, add, stats, card, composer };

  function init() {
    initHome();
    initPage();
  }
  MARIDAY.onReady(init);
})();
