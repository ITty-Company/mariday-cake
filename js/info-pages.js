/* About, delivery, contacts, FAQ — interactive pieces (day timeline, polaroid wall, NL map, calendar, mini-game, live clock, chat bot) */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => window.escapeHTML(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const live = () => !!(window.gsap && window.ScrollTrigger) && !reduce;
  const M = () => window.MARIDAY;
  const C = () => M().contacts;
  const CHERRY = () => assetPath("img/cakes/cherries.png");
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const MONTHS = ["січень", "лютий", "березень", "квітень", "травень", "червень", "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"];

  // Current time in Alkmaar, whatever the visitor's timezone
  function nlTime() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hour: "numeric", minute: "numeric", second: "numeric", hour12: false, weekday: "short" }).formatToParts(new Date());
    const g = (t) => parts.find((p) => p.type === t)?.value;
    return { h: +g("hour") % 24, m: +g("minute"), s: +g("second"), wd: g("weekday") };
  }

  function setHands(root, h, m, s) {
    const hh = $("[data-hour]", root), mm = $("[data-min]", root), ss = $("[data-sec]", root);
    if (hh) hh.style.transform = `rotate(${((h % 12) + m / 60) * 30}deg)`;
    if (mm) mm.style.transform = `rotate(${(m + (s || 0) / 60) * 6}deg)`;
    if (ss) ss.style.transform = `rotate(${(s || 0) * 6}deg)`;
  }

  /* ═════════════ ABOUT ═════════════ */

  // A day in the studio: the track slides sideways while the clock runs 06:00 → 18:00
  function aboutDay() {
    const sec = $("#day");
    if (!sec) return;
    const view = $("[data-day-view]", sec);
    const track = $("[data-day-track]", sec);
    const cards = $$(".day-card", track);
    const timeEl = $("[data-day-time]", sec);
    const bar = $("[data-day-bar]", sec);
    const setTime = (p) => {
      const mins = 360 + p * 720;
      const h = Math.floor(mins / 60), m = Math.floor(mins % 60);
      timeEl.textContent = `${pad(h)}:${pad(Math.floor(m / 5) * 5)}`;
      setHands(sec, h, m, 0);
      bar.style.transform = `scaleX(${p})`;
      const idx = Math.round(p * (cards.length - 1));
      cards.forEach((c, i) => c.classList.toggle("is-now", i === idx));
    };
    setTime(0);
    const wide = matchMedia("(min-width: 900px)").matches;
    if (live() && wide) {
      sec.classList.add("is-pinned");
      const dist = () => Math.max(0, track.scrollWidth - view.clientWidth);
      gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: () => "+=" + dist() * 1.15,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (s) => setTime(s.progress),
        },
      });
    } else {
      view.addEventListener("scroll", () => {
        const max = view.scrollWidth - view.clientWidth;
        setTime(max > 0 ? view.scrollLeft / max : 0);
      }, { passive: true });
    }
  }

  function aboutFlips() {
    $$(".flip").forEach((b) => {
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => {
        const on = !b.classList.contains("is-flipped");
        b.classList.toggle("is-flipped", on);
        b.setAttribute("aria-pressed", String(on));
      });
    });
  }

  // Polaroids you can grab, throw and reshuffle
  function aboutWall() {
    const board = $("[data-wall]");
    if (!board) return;
    const items = $$(".pola", board);
    let z = 10;
    const place = (el) => { el.style.transform = `translate(${el._x.toFixed(1)}px, ${el._y.toFixed(1)}px) rotate(${el._r.toFixed(1)}deg)`; };
    const visible = () => items.filter((el) => el.offsetParent !== null);

    function scatter(animate) {
      const W = board.clientWidth, H = board.clientHeight;
      const list = visible();
      const cols = W < 700 ? 2 : W < 1100 ? 4 : 5;
      const rows = Math.ceil(list.length / cols);
      list.forEach((el, i) => {
        const w = el.offsetWidth, h = el.offsetHeight;
        const cx = (((i % cols) + 0.5) / cols) * W;
        const cy = ((Math.floor(i / cols) + 0.5) / rows) * H;
        el._x = clamp(cx - w / 2 + rand(-70, 70), 0, W - w);
        el._y = clamp(cy - h / 2 + rand(-60, 60), 0, H - h);
        el._r = rand(-16, 16);
        el.style.transition = animate && !reduce ? `transform 0.9s cubic-bezier(0.34, 1.5, 0.5, 1) ${i * 0.04}s` : "none";
        place(el);
      });
    }

    items.forEach((el) => {
      let sx = 0, sy = 0, ox = 0, oy = 0, lx = 0, ly = 0, vx = 0, vy = 0, lt = 0, raf = 0, down = false;
      const throwIt = () => {
        const W = board.clientWidth - el.offsetWidth, H = board.clientHeight - el.offsetHeight;
        const step = () => {
          el._x += vx; el._y += vy;
          if (el._x < 0 || el._x > W) { vx *= -0.55; el._x = clamp(el._x, 0, W); }
          if (el._y < 0 || el._y > H) { vy *= -0.55; el._y = clamp(el._y, 0, H); }
          vx *= 0.92; vy *= 0.92;
          el._r += vx * 0.25;
          place(el);
          if (Math.abs(vx) + Math.abs(vy) > 0.3) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      };
      el.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        cancelAnimationFrame(raf);
        down = true;
        el.setPointerCapture(e.pointerId);
        el.style.transition = "none";
        el.style.zIndex = ++z;
        el.classList.add("is-drag");
        sx = lx = e.clientX; sy = ly = e.clientY; ox = el._x; oy = el._y; vx = vy = 0; lt = performance.now();
      });
      el.addEventListener("pointermove", (e) => {
        if (!down) return;
        const now = performance.now();
        const W = board.clientWidth - el.offsetWidth, H = board.clientHeight - el.offsetHeight;
        el._x = clamp(ox + e.clientX - sx, -20, W + 20);
        el._y = clamp(oy + e.clientY - sy, -20, H + 20);
        const dt = Math.max(1, now - lt);
        vx = ((e.clientX - lx) / dt) * 16; vy = ((e.clientY - ly) / dt) * 16;
        lx = e.clientX; ly = e.clientY; lt = now;
        el._r = clamp(el._r + vx * 0.15, -25, 25);
        place(el);
      });
      const up = () => {
        if (!down) return;
        down = false;
        el.classList.remove("is-drag");
        throwIt();
      };
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
      el.addEventListener("keydown", (e) => {
        const k = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[e.key];
        if (!k) return;
        e.preventDefault();
        el.style.zIndex = ++z;
        el._x = clamp(el._x + k[0], 0, board.clientWidth - el.offsetWidth);
        el._y = clamp(el._y + k[1], 0, board.clientHeight - el.offsetHeight);
        place(el);
      });
    });

    const imgsReady = Promise.all($$("img", board).map((i) => (i.complete ? 1 : new Promise((r) => { i.onload = i.onerror = r; }))));
    imgsReady.then(() => scatter(false));
    scatter(false);
    board.classList.add("is-ready");
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => scatter(false), 200); });
    $("[data-wall-shuffle]")?.addEventListener("click", () => {
      scatter(true);
      window.burstConfetti?.(board);
    });
    // drop in when first seen
    if (!reduce && "IntersectionObserver" in window) {
      board.classList.add("is-waiting");
      const io = new IntersectionObserver((en) => {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        board.classList.remove("is-waiting");
        scatter(true);
      }, { threshold: 0.25 });
      io.observe(board);
    }
  }

  // The founder's note writes itself, letter by letter
  function aboutLetter() {
    const el = $("[data-write]");
    if (!el || reduce || !("IntersectionObserver" in window)) return;
    const text = el.textContent;
    el.setAttribute("aria-label", text);
    el.innerHTML = [...text].map((ch, i) => `<span aria-hidden="true" style="--i:${i}">${ch === " " ? " " : esc(ch)}</span>`).join("");
    const io = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      el.classList.add("is-writing");
    }, { threshold: 0.5 });
    io.observe(el);
  }

  /* ═════════════ DELIVERY ═════════════ */

  const NL = [[3.37, 51.37], [3.83, 51.21], [4.25, 51.37], [4.77, 51.5], [5.04, 51.48], [5.68, 51.26], [5.85, 51.15], [5.64, 50.85], [5.7, 50.76], [6.02, 50.75], [6.08, 51.17], [6.21, 51.4], [6.12, 51.6], [5.95, 51.77], [6.4, 51.83], [6.72, 51.9], [6.98, 52.22], [7.07, 52.4], [6.71, 52.48], [7.03, 52.63], [7.21, 53.24], [6.9, 53.35], [6.19, 53.41], [5.6, 53.3], [5.35, 53.08], [5.4, 52.85], [5.65, 52.6], [5.4, 52.3], [5.1, 52.4], [5.07, 52.65], [5.3, 52.72], [5.1, 52.93], [4.73, 52.96], [4.63, 52.75], [4.5, 52.38], [4.2, 52.05], [4.0, 51.95], [3.7, 51.7], [3.45, 51.55]];
  const CITIES = [
    { id: "alkmaar", n: "Alkmaar", lon: 4.75, lat: 52.63, km: 0, lx: -14, ly: 5, a: "end" },
    { id: "denhelder", n: "Den Helder", lon: 4.76, lat: 52.96, km: 42, lx: 12, ly: 4 },
    { id: "hoorn", n: "Hoorn", lon: 5.06, lat: 52.64, km: 27, lx: 12, ly: 4 },
    { id: "zaandam", n: "Zaandam", lon: 4.82, lat: 52.44, km: 30, lx: 12, ly: -4 },
    { id: "haarlem", n: "Haarlem", lon: 4.64, lat: 52.38, km: 33, lx: -12, ly: 4, a: "end" },
    { id: "amsterdam", n: "Amsterdam", lon: 4.9, lat: 52.37, km: 40, lx: 8, ly: 22 },
    { id: "almere", n: "Almere", lon: 5.22, lat: 52.37, km: 60, lx: 12, ly: 4 },
    { id: "leiden", n: "Leiden", lon: 4.49, lat: 52.16, km: 70, lx: -12, ly: 4, a: "end" },
    { id: "denhaag", n: "Den Haag", lon: 4.3, lat: 52.08, km: 85, lx: -12, ly: 10, a: "end" },
    { id: "utrecht", n: "Utrecht", lon: 5.12, lat: 52.09, km: 85, lx: 12, ly: 4 },
    { id: "amersfoort", n: "Amersfoort", lon: 5.39, lat: 52.16, km: 95, lx: 12, ly: 4 },
    { id: "rotterdam", n: "Rotterdam", lon: 4.48, lat: 51.92, km: 105, lx: -12, ly: 6, a: "end" },
    { id: "eindhoven", n: "Eindhoven", lon: 5.47, lat: 51.44, km: 165, lx: 12, ly: 4 },
    { id: "groningen", n: "Groningen", lon: 6.57, lat: 53.22, km: 185, lx: 12, ly: 4 },
  ];
  const proj = (lon, lat) => [(lon - 3.2) * 150, (53.65 - lat) * 245];

  function deliveryMap() {
    const svg = $("[data-map]");
    if (!svg) return;
    const chips = $("[data-cities]");
    const info = $("[data-city-info]");
    const home = CITIES[0];
    const [hx, hy] = proj(home.lon, home.lat);
    const outline = NL.map(([lo, la], i) => { const [x, y] = proj(lo, la); return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ") + " Z";
    svg.innerHTML = `
      <defs><pattern id="dm-dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="rgba(219,239,237,.22)"/></pattern></defs>
      <path class="dm-land" d="${outline}"/>
      <path class="dm-land dm-land--dots" d="${outline}" fill="url(#dm-dots)"/>
      <path class="dm-route" data-route d=""/>
      ${CITIES.map((c) => {
        const [x, y] = proj(c.lon, c.lat);
        return `<g class="dm-city${c.km ? "" : " is-home"}" data-city="${c.id}" tabindex="${c.km ? 0 : -1}" role="button" aria-label="${c.n}">
          <circle class="dm-city__halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="18"/>
          <circle class="dm-city__dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${c.km ? 6 : 10}"/>
          <text x="${(x + c.lx).toFixed(1)}" y="${(y + c.ly).toFixed(1)}" text-anchor="${c.a || "start"}">${c.n}${c.km ? "" : " ♥"}</text>
        </g>`;
      }).join("")}
      <image class="dm-rider" data-rider href="${CHERRY()}" width="46" height="46" x="${hx - 23}" y="${hy - 40}"/>`;
    chips.innerHTML = CITIES.slice(1, 12).map((c, i) => `<button type="button" class="p-sticker" data-city="${c.id}" aria-pressed="false" style="--r:${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg">${c.n}</button>`).join("");
    const route = $("[data-route]", svg);
    const rider = $("[data-rider]", svg);
    let anim = 0;

    function pick(id) {
      const c = CITIES.find((x) => x.id === id);
      if (!c || !c.km) return;
      $$("[data-city]").forEach((el) => {
        const on = el.dataset.city === id;
        el.classList.toggle("is-on", on);
        if (el.tagName === "BUTTON") el.setAttribute("aria-pressed", String(on));
      });
      const [x, y] = proj(c.lon, c.lat);
      const mx = (hx + x) / 2, my = (hy + y) / 2;
      const dx = x - hx, dy = y - hy;
      const len = Math.hypot(dx, dy) || 1;
      const bend = Math.min(90, len * 0.35);
      const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
      route.setAttribute("d", `M${hx.toFixed(1)},${hy.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`);
      const L = route.getTotalLength();
      route.style.strokeDasharray = `${L} ${L}`;
      cancelAnimationFrame(anim);
      const t0 = performance.now();
      const dur = reduce ? 1 : 1300;
      const frame = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        route.style.strokeDashoffset = L * (1 - e);
        const pt = route.getPointAtLength(L * e);
        rider.setAttribute("x", (pt.x - 23).toFixed(1));
        rider.setAttribute("y", (pt.y - 40).toFixed(1));
        if (p < 1) anim = requestAnimationFrame(frame);
      };
      anim = requestAnimationFrame(frame);
      const mins = Math.round(c.km * 1.05 + 8);
      const zone = c.km <= 45 ? ["1", "Noord-Holland поруч", "#f5bcc8"] : c.km <= 110 ? ["2", "Рандстад", "#fbe6b8"] : ["3", "за домовленістю", "#bcd6f3"];
      info.innerHTML = `
        <div class="dm-info" style="--z:${zone[2]}">
          <span class="dm-info__zone">Зона ${zone[0]} · ${zone[1]}</span>
          <b class="dm-info__city">${esc(c.n)}</b>
          <div class="dm-info__stats"><span><b data-km>${c.km}</b> км</span><span>~<b>${mins}</b> хв у дорозі</span></div>
          <p>Вартість — індивідуально, залежить від розміру торта. Ярусні торти привозимо з монтажем на місці.</p>
          <a class="p-link light" href="https://wa.me/${C().whatsapp}?text=${encodeURIComponent(`Вітаю! Скільки коштує доставка торта в ${c.n}?`)}" target="_blank" rel="noopener">Дізнатися ціну доставки →</a>
        </div>`;
      if (window.gsap && !reduce) gsap.from(info.firstElementChild, { y: 20, opacity: 0, duration: 0.6, ease: "expo.out" });
    }

    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-city]");
      if (el && (chips.contains(el) || svg.contains(el))) pick(el.dataset.city);
    });
    svg.addEventListener("keydown", (e) => {
      const el = e.target.closest("[data-city]");
      if (el && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(el.dataset.city); }
    });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((en) => {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        pick("amsterdam");
      }, { threshold: 0.35 });
      io.observe(svg);
    } else pick("amsterdam");
  }

  // Calendar that colours every day: ok / urgent / too close
  function deliveryCalendar() {
    const root = $("[data-cal]");
    if (!root) return;
    const typesHost = $("[data-types]");
    const lead = { bento: [1, "Бенто"], classic: [5, "Класичний торт"], wedding: [14, "Весільний / скульптурний"], candybar: [7, "Candy bar"] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let type = "classic";
    let view = new Date(today.getFullYear(), today.getMonth(), 1);
    let picked = new Date(today);
    picked.setDate(picked.getDate() + 7);
    const nice = (d) => d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
    const days = (d) => Math.round((d - today) / 864e5);
    const status = (d) => {
      const n = days(d), need = lead[type][0];
      if (n < 0) return "past";
      if (n >= need) return "ok";
      if (n >= 1 && type !== "wedding") return "warn";
      return "no";
    };
    typesHost.innerHTML = Object.entries(lead).map(([id, [, n]], i) => `<button type="button" class="p-sticker${id === type ? " is-on" : ""}" data-type="${id}" aria-pressed="${id === type}" style="--r:${[-2, 1.5, -1, 2][i]}deg">${n}</button>`).join("");

    function render() {
      const y = view.getFullYear(), m = view.getMonth();
      const first = (new Date(y, m, 1).getDay() + 6) % 7;
      const total = new Date(y, m + 1, 0).getDate();
      const minView = new Date(today.getFullYear(), today.getMonth(), 1);
      const maxView = new Date(today.getFullYear(), today.getMonth() + 12, 1);
      let cells = "";
      for (let i = 0; i < first; i++) cells += "<span></span>";
      for (let d = 1; d <= total; d++) {
        const date = new Date(y, m, d);
        const s = status(date);
        const isToday = +date === +today;
        const isPicked = picked && +date === +picked;
        const label = { ok: "встигаємо", warn: "терміново", no: "занадто близько", past: "минула дата" }[s];
        cells += `<button type="button" class="cal__day is-${s}${isToday ? " is-today" : ""}${isPicked ? " is-picked" : ""}" data-day="${d}" ${s === "past" ? "disabled" : ""} aria-label="${d} ${MONTHS[m]} — ${label}" aria-pressed="${isPicked}">${d}</button>`;
      }
      let res = "";
      if (picked) {
        const s = status(picked), need = lead[type][0], label = lead[type][1];
        const by = new Date(picked);
        by.setDate(by.getDate() - need);
        const n = days(picked);
        const wa = `https://wa.me/${C().whatsapp}?text=${encodeURIComponent(`Вітаю! Чи встигнете ${label.toLowerCase()} на ${nice(picked)}?`)}`;
        const page = type === "bento" ? "bento.html" : type === "candybar" ? "desserts.html" : type === "wedding" ? "constructor.html?size=tier" : "cakes.html";
        if (s === "ok") res = `<b>Встигаємо! ✓</b><p>${label} на <b>${nice(picked)}</b>: оформіть замовлення до <b>${nice(by)}</b>${+by === +today ? " (тобто сьогодні!)" : ""}.</p><a class="p-btn" href="${page}"><span>Обрати ${label.toLowerCase()}</span></a>`;
        else if (s === "warn") res = `<b>Терміново ⚡</b><p>До свята ${n} дн. Спробуємо вписати! ${type === "bento" ? "" : "Доплата +20%. "}Напишіть менеджеру, щоб перевірити вільне вікно.</p><a class="p-btn" href="${wa}" target="_blank" rel="noopener"><span>Запитати у WhatsApp</span></a>`;
        else res = `<b>Дуже близько 😮</b><p>${n === 0 ? "Сьогодні — лише якщо є вільне вікно." : `Для формату «${label}» потрібно від ${need} днів.`} Напишіть нам — запропонуємо альтернативу (наприклад, бенто).</p><a class="p-btn" href="${wa}" target="_blank" rel="noopener"><span>Написати менеджеру</span></a>`;
        res = `<div class="cal__res is-${s}" aria-live="polite">${res}</div>`;
      }
      root.innerHTML = `
        <div class="cal__top">
          <button type="button" class="cal__nav" data-nav="-1" ${+view <= +minView ? "disabled" : ""} aria-label="Попередній місяць">←</button>
          <b>${MONTHS[m]} <span>${y}</span></b>
          <button type="button" class="cal__nav" data-nav="1" ${+view >= +maxView ? "disabled" : ""} aria-label="Наступний місяць">→</button>
        </div>
        <div class="cal__week" aria-hidden="true"><span>пн</span><span>вт</span><span>ср</span><span>чт</span><span>пт</span><span>сб</span><span>нд</span></div>
        <div class="cal__grid">${cells}</div>
        ${res}`;
    }
    root.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-nav]");
      const day = e.target.closest("[data-day]");
      if (nav) { view = new Date(view.getFullYear(), view.getMonth() + +nav.dataset.nav, 1); render(); }
      if (day) { picked = new Date(view.getFullYear(), view.getMonth(), +day.dataset.day); render(); }
    });
    typesHost.addEventListener("click", (e) => {
      const b = e.target.closest("[data-type]");
      if (!b) return;
      type = b.dataset.type;
      $$("[data-type]", typesHost).forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
      render();
    });
    render();
  }

  // Mini-game: drive the Mariday van, jump over potholes, bumps and cones, keep the cake on the roof
  function deliveryGame() {
    const box = $("[data-game]");
    if (!box) return;
    const cv = $("canvas", box);
    const ctx = cv.getContext("2d");
    const screen = $("[data-screen]", box);
    const hudLives = $("[data-lives]", box), hudScore = $("[data-score]", box), hudBar = $("[data-progress]", box);
    const cherryImg = new Image();
    cherryImg.src = CHERRY();
    const GOAL = 9000;
    let W = 0, H = 0, dpr = 1;
    let state = "intro";
    let t = 0, dist = 0, speed = 330, score = 0, lives = 3, inv = 0, shake = 0;
    let car, obs, berries, nextObs, nextBerry, parts, flagX;
    let best = 0;
    try { best = +localStorage.getItem("mariday_game_best") || 0; } catch { /* no storage */ }

    const ground = () => H - 64;
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = box.clientWidth;
      H = box.clientHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (state !== "play") draw(0);
    }
    function reset() {
      t = 0; dist = 0; speed = 330; score = 0; lives = 3; inv = 0; shake = 0; flagX = null;
      car = { x: Math.max(70, W * 0.16), y: 0, vy: 0, w: 112, h: 44, wheel: 0, tilt: 0, tv: 0, air: false };
      obs = []; berries = []; parts = [];
      nextObs = 1.2; nextBerry = 0.8;
      hud();
    }
    function hud() {
      hudLives.textContent = "🎂".repeat(lives) + "🤍".repeat(3 - lives);
      hudScore.textContent = score;
      hudBar.style.transform = `scaleX(${Math.min(1, dist / GOAL)})`;
      hudBar.nextElementSibling.style.left = `calc(${Math.min(1, dist / GOAL) * 100}% - 12px)`;
    }
    function jump() {
      if (state !== "play") return;
      if (!car.air) {
        car.vy = -760;
        car.air = true;
        car.tv -= 3;
      }
    }

    const rr = (x, y, w, h, r) => {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else ctx.rect(x, y, w, h);
    };

    function update(dt) {
      t += dt;
      speed = Math.min(560, 330 + dist / 40);
      const dx = speed * dt;
      dist += dx;
      // car physics
      if (car.air) {
        car.vy += 2100 * dt;
        car.y += car.vy * dt;
        if (car.y >= 0) {
          car.y = 0;
          car.air = false;
          car.tv += car.vy * 0.006;
          car.vy = 0;
        }
      }
      car.wheel += dx / 13;
      // cake wobble: damped spring
      car.tv += (-60 * car.tilt - 7 * car.tv) * dt;
      car.tilt += car.tv * dt;
      inv = Math.max(0, inv - dt);
      shake = Math.max(0, shake - dt * 30);
      // spawn
      if (dist < GOAL - 900) {
        nextObs -= dt;
        if (nextObs <= 0) {
          const type = ["bump", "hole", "cone"][(Math.random() * 3) | 0];
          obs.push({ type, x: W + 40, w: type === "cone" ? 26 : type === "hole" ? 58 : 52, h: type === "cone" ? 36 : 16, hit: false });
          nextObs = rand(0.95, 1.7) * (380 / speed) * 1.25;
        }
        nextBerry -= dt;
        if (nextBerry <= 0) {
          const n = Math.random() > 0.6 ? 3 : 1;
          const by = ground() - rand(90, 170);
          for (let k = 0; k < n; k++) berries.push({ x: W + 40 + k * 34, y: by - k * 10, got: false });
          nextBerry = rand(0.9, 1.8);
        }
      } else if (flagX === null) flagX = W + 120;
      obs.forEach((o) => (o.x -= dx));
      berries.forEach((b) => (b.x -= dx));
      if (flagX !== null) flagX -= dx;
      obs = obs.filter((o) => o.x > -100);
      berries = berries.filter((b) => b.x > -60 && !b.got);
      // collisions
      const cx1 = car.x + 10, cx2 = car.x + car.w - 10;
      const carBottom = ground() + car.y;
      obs.forEach((o) => {
        if (o.hit || inv > 0) return;
        const overlap = o.x < cx2 && o.x + o.w > cx1;
        if (!overlap) return;
        const clear = o.type === "hole" ? car.air : carBottom < ground() - o.h + 2;
        if (!clear) {
          o.hit = true;
          lives--;
          inv = 1.3;
          shake = 8;
          car.tv += o.type === "cone" ? 9 : -9;
          if (navigator.vibrate) navigator.vibrate(60);
          hud();
          if (lives <= 0) end(false);
        }
      });
      berries.forEach((b) => {
        const top = carBottom - car.h - 52;
        if (b.x > car.x - 6 && b.x < car.x + car.w + 6 && b.y > top && b.y < carBottom) {
          b.got = true;
          score++;
          for (let k = 0; k < 8; k++) parts.push({ x: b.x, y: b.y, vx: rand(-120, 120), vy: rand(-220, -40), life: 0.6 });
          hud();
        }
      });
      parts.forEach((p) => { p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
      parts = parts.filter((p) => p.life > 0);
      if (Math.abs(car.tilt) > 1.15 && state === "play") { lives = 0; hud(); end(false); }
      if (flagX !== null && flagX < car.x + car.w) end(true);
      hud();
    }

    function drawBg(offset) {
      const g = ground();
      const sky = ctx.createLinearGradient(0, 0, 0, g);
      sky.addColorStop(0, "#f9d6de");
      sky.addColorStop(1, "#dbefed");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fbe6b8";
      ctx.beginPath();
      ctx.arc(W * 0.82, g * 0.32, 34, 0, Math.PI * 2);
      ctx.fill();
      // clouds
      ctx.fillStyle = "rgba(255,255,255,.85)";
      for (let i = 0; i < 4; i++) {
        const x = ((i * 330 - offset * 0.15) % (W + 300) + W + 300) % (W + 300) - 150;
        const y = 40 + (i % 2) * 36;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 7); ctx.arc(x + 24, y - 10, 24, 0, 7); ctx.arc(x + 52, y, 18, 0, 7);
        ctx.fill();
      }
      // Dutch canal houses + windmills
      const span = 980;
      for (let i = -1; i < Math.ceil(W / 140) + 2; i++) {
        const base = i * 140 - ((offset * 0.45) % 140);
        const k = (i + Math.floor((offset * 0.45) / 140)) % 7;
        const kk = (k + 7) % 7;
        if (kk === 3) {
          // windmill
          const x = base + 60, y = g - 4;
          ctx.fillStyle = "rgba(109,8,9,.32)";
          ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x - 10, y - 80); ctx.lineTo(x + 10, y - 80); ctx.lineTo(x + 18, y); ctx.fill();
          ctx.save(); ctx.translate(x, y - 82); ctx.rotate(t * 1.5 + i);
          for (let b = 0; b < 4; b++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-4, 0, 8, 54); }
          ctx.restore();
          continue;
        }
        const hgt = [70, 92, 80, 100, 76, 88, 84][kk];
        const col = ["rgba(109,8,9,.22)", "rgba(226,132,154,.45)", "rgba(109,8,9,.16)"][kk % 3];
        ctx.fillStyle = col;
        const x = base + 10, w = 64, y = g - 4;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x, y - hgt);
        ctx.lineTo(x + 10, y - hgt); ctx.lineTo(x + 10, y - hgt - 12); ctx.lineTo(x + 22, y - hgt - 12);
        ctx.lineTo(x + w / 2, y - hgt - 26);
        ctx.lineTo(x + w - 22, y - hgt - 12); ctx.lineTo(x + w - 10, y - hgt - 12); ctx.lineTo(x + w - 10, y - hgt); ctx.lineTo(x + w, y - hgt);
        ctx.lineTo(x + w, y); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.5)";
        for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) ctx.fillRect(x + 14 + c * 24, y - hgt + 10 + r * 22, 12, 14);
      }
      void span;
      // road
      ctx.fillStyle = "#9ed9b8";
      ctx.fillRect(0, g - 6, W, 8);
      ctx.fillStyle = "#4a1416";
      ctx.fillRect(0, g + 2, W, H - g);
      ctx.fillStyle = "rgba(251,230,184,.85)";
      const dash = 60;
      for (let x = -((offset) % (dash * 2)); x < W; x += dash * 2) ctx.fillRect(x, g + 28, dash, 5);
    }

    function drawObs(o) {
      const g = ground();
      if (o.type === "bump") {
        ctx.fillStyle = "#fbe6b8";
        ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, g + 2, o.w / 2, o.h, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#3d0405";
        for (let k = 0; k < 4; k++) ctx.fillRect(o.x + 8 + k * 11, g - o.h * 0.7, 5, o.h * 0.7);
      } else if (o.type === "hole") {
        ctx.fillStyle = "#1c0405";
        ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, g + 10, o.w / 2, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.15)";
        ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, g + 7, o.w / 2 - 6, 4, 0, 0, Math.PI); ctx.fill();
      } else {
        ctx.fillStyle = "#ff8a3d";
        ctx.beginPath(); ctx.moveTo(o.x, g + 2); ctx.lineTo(o.x + o.w / 2, g - o.h); ctx.lineTo(o.x + o.w, g + 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(o.x + 7, g - o.h * 0.45, o.w - 14, 5);
        ctx.fillStyle = "#3d0405";
        ctx.fillRect(o.x - 4, g, o.w + 8, 4);
      }
    }

    function drawCar() {
      const g = ground();
      const x = car.x, y = g + car.y - car.h - 10;
      if (inv > 0 && Math.floor(inv * 12) % 2) ctx.globalAlpha = 0.45;
      // body
      ctx.fillStyle = "#f5bcc8";
      rr(x, y, car.w, car.h, 12); ctx.fill();
      ctx.fillStyle = "#e2849a";
      rr(x, y + car.h - 12, car.w, 12, [0, 0, 12, 12]); ctx.fill();
      ctx.fillStyle = "#bcd6f3";
      rr(x + car.w - 34, y + 6, 26, 18, 5); ctx.fill();
      ctx.fillStyle = "#6d0809";
      ctx.font = '700 11px "Unbounded", sans-serif';
      ctx.fillText("MARIDAY", x + 10, y + 26);
      // wheels
      [x + 24, x + car.w - 24].forEach((wx) => {
        ctx.save();
        ctx.translate(wx, y + car.h + 2);
        ctx.fillStyle = "#2a0607"; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill();
        ctx.rotate(car.wheel);
        ctx.fillStyle = "#dbefed"; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
        ctx.fillRect(-1.5, -10, 3, 20);
        ctx.restore();
      });
      // cake on the roof
      ctx.save();
      ctx.translate(x + car.w / 2 - 6, y);
      ctx.rotate(car.tilt * 0.6);
      ctx.fillStyle = "#fff"; ctx.fillRect(-36, -4, 72, 4);
      ctx.fillStyle = "#fbf3dc"; rr(-28, -28, 56, 24, 5); ctx.fill();
      ctx.fillStyle = "#f5bcc8"; rr(-19, -48, 38, 21, 5); ctx.fill();
      ctx.fillStyle = "#6d0809";
      ctx.beginPath(); ctx.moveTo(-19, -46); for (let k = 0; k <= 6; k++) ctx.lineTo(-19 + k * 6.3, -46 + (k % 2 ? 8 : 2)); ctx.lineTo(19, -46); ctx.closePath(); ctx.fill();
      if (cherryImg.complete) ctx.drawImage(cherryImg, -12, -72, 26, 26);
      ctx.restore();
      ctx.globalAlpha = 1;
      if (Math.abs(car.tilt) > 0.7 && state === "play") {
        ctx.fillStyle = "#c2263f";
        ctx.font = '800 22px "Unbounded", sans-serif';
        ctx.fillText("!", x + car.w / 2 + 30, y - 60);
      }
    }

    function draw(dt) {
      ctx.save();
      if (shake) ctx.translate(rand(-shake, shake), rand(-shake, shake));
      drawBg(dist);
      obs.forEach(drawObs);
      berries.forEach((b) => { if (cherryImg.complete) ctx.drawImage(cherryImg, b.x - 15, b.y - 15, 30, 30); });
      if (flagX !== null) {
        const g = ground();
        ctx.fillStyle = "#6d0809"; ctx.fillRect(flagX, g - 120, 5, 120);
        ctx.fillStyle = "#f5bcc8"; rr(flagX + 5, g - 120, 92, 34, 6); ctx.fill();
        ctx.fillStyle = "#6d0809"; ctx.font = '700 13px "Unbounded", sans-serif'; ctx.fillText("СВЯТО 🎉", flagX + 12, g - 98);
        ["#f5bcc8", "#bcd6f3", "#fbe6b8"].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(flagX + 120 + k * 22, g - 150 + Math.sin(t * 3 + k) * 6, 14, 18, 0, 0, 7); ctx.fill(); ctx.strokeStyle = "rgba(109,8,9,.4)"; ctx.beginPath(); ctx.moveTo(flagX + 120 + k * 22, g - 132); ctx.lineTo(flagX + 110 + k * 12, g); ctx.stroke(); });
      }
      if (car) drawCar();
      ctx.fillStyle = "#e2849a";
      parts.forEach((p) => { ctx.globalAlpha = Math.max(0, p.life / 0.6); ctx.fillRect(p.x, p.y, 4, 4); });
      ctx.globalAlpha = 1;
      ctx.restore();
      void dt;
    }

    let raf = 0, last = 0;
    function loop(now) {
      const dt = Math.min(0.033, (now - last) / 1000 || 0);
      last = now;
      if (state === "play") update(dt);
      draw(dt);
      if (state === "play") raf = requestAnimationFrame(loop);
    }
    function showScreen(html) {
      screen.innerHTML = html;
      screen.hidden = false;
    }
    function start() {
      reset();
      state = "play";
      screen.hidden = true;
      box.focus({ preventScroll: true });
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }
    function pause() {
      if (state !== "play") return;
      state = "pause";
      showScreen(`<h3>Пауза ☕</h3><p>Торт чекає в машині.</p><button type="button" class="p-btn" data-resume><span>Продовжити</span></button>`);
    }
    function resume() {
      state = "play";
      screen.hidden = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function end(win) {
      state = win ? "win" : "lose";
      cancelAnimationFrame(raf);
      draw(0);
      if (win && score > best) {
        best = score;
        try { localStorage.setItem("mariday_game_best", String(best)); } catch { /* no storage */ }
      }
      if (win) {
        showScreen(`<span class="game__big">🎉</span><h3>Торт доставлено!</h3><p>Ви зібрали <b>${score} 🍒</b> і довезли торт ${lives === 3 ? "ідеально цілим" : `з ${lives} з 3 «життів»`}. Рекорд: ${best} 🍒</p><div class="game__btns"><a class="p-btn" href="cakes.html"><span>Обрати справжній торт</span></a><button type="button" class="p-btn p-btn--ghost" data-start><span>Ще раз</span></button></div>`);
        window.burstConfetti?.(screen);
      } else {
        showScreen(`<span class="game__big">😱</span><h3>Ой! Торт не доїхав</h3><p>Саме тому доставку краще довірити нам — возимо обережно й рівно.</p><div class="game__btns"><button type="button" class="p-btn" data-start><span>Ще раз</span></button><a class="p-btn p-btn--ghost" href="contacts.html"><span>Замовити доставку</span></a></div>`);
      }
    }

    showScreen(`<span class="game__big">🚐</span><h3>Довезіть торт цілим</h3><p>Ямки, лежачі поліцейські й конуси — стрибайте <kbd>пробілом</kbd> або тапом. Не розхитайте торт і збирайте вишні!</p><button type="button" class="p-btn p-btn--big" data-start><span>Поїхали</span></button>${best ? `<small>Ваш рекорд: ${best} 🍒</small>` : ""}`);
    screen.addEventListener("click", (e) => {
      if (e.target.closest("[data-start]")) start();
      if (e.target.closest("[data-resume]")) resume();
    });
    box.addEventListener("pointerdown", (e) => {
      if (e.target.closest("[data-screen]") && !screen.hidden) return;
      if (state === "play") { e.preventDefault(); jump(); }
    });
    box.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        if (state === "play") { e.preventDefault(); jump(); }
        else if (state === "pause") { e.preventDefault(); resume(); }
      }
    });
    // Space anywhere while the game is on screen
    addEventListener("keydown", (e) => {
      if (state !== "play" || e.key !== " " || document.activeElement === box) return;
      const r = box.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); jump(); }
    });
    if ("IntersectionObserver" in window) new IntersectionObserver((en) => { if (!en[0].isIntersecting) pause(); }, { threshold: 0.2 }).observe(box);
    document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
    addEventListener("resize", resize);
    reset();
    resize();
    cherryImg.onload = () => { if (state !== "play") draw(0); };
    document.fonts?.ready.then(() => { if (state !== "play") draw(0); });
    window.MaridayGame = { start, jump, get state() { return state; }, get score() { return score; }, get dist() { return dist; }, finish: () => { dist = GOAL - 1; obs = []; } };
  }

  /* ═════════════ CONTACTS ═════════════ */

  function contactsClock() {
    const el = $("[data-clock]");
    if (!el) return;
    const timeEl = $("[data-clock-time]", el);
    const st = $("[data-clock-status]", el);
    const { from, to } = C().hours;
    const fmt = (mins) => (mins >= 60 ? `${Math.floor(mins / 60)} год ${mins % 60} хв` : `${mins} хв`);
    const tick = () => {
      const { h, m, s } = nlTime();
      setHands(el, h, m, s);
      timeEl.textContent = `${pad(h)}:${pad(m)}`;
      const now = h * 60 + m;
      const open = h >= from && h < to;
      el.classList.toggle("is-open", open);
      const left = open ? to * 60 - now : (now < from * 60 ? from * 60 - now : 24 * 60 - now + from * 60);
      st.innerHTML = `<i></i>${open ? `На зв'язку · ще ${fmt(left)}` : `Відповімо через ${fmt(left)}`}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  function contactsWeek() {
    const ul = $("[data-week]");
    if (!ul) return;
    const names = [["Mon", "Понеділок"], ["Tue", "Вівторок"], ["Wed", "Середа"], ["Thu", "Четвер"], ["Fri", "Пʼятниця"], ["Sat", "Субота"], ["Sun", "Неділя"]];
    const { wd } = nlTime();
    const { from, to } = C().hours;
    ul.innerHTML = names.map(([k, n]) => `<li class="${k === wd ? "is-today" : ""}"><span>${n}${k === wd ? " <em>сьогодні</em>" : ""}</span><i></i><b>${pad(from)}:00–${to}:00</b></li>`).join("");
  }

  function contactsCopy() {
    $$("[data-copy]").forEach((b) => b.addEventListener("click", () => {
      (navigator.clipboard?.writeText(b.dataset.copy) || Promise.reject())
        .then(() => { showToast("Скопійовано: " + b.dataset.copy); b.classList.add("is-done"); setTimeout(() => b.classList.remove("is-done"), 1600); })
        .catch(() => showToast(b.dataset.copy));
    }));
  }

  // The message is previewed live in a phone; "send" plays the chat and opens WhatsApp / mail
  function contactsComposer() {
    const form = $("#msg-form");
    if (!form) return;
    const phone = $("[data-phone]");
    const thread = $("[data-thread]", phone);
    let draft = $("[data-draft]", thread);
    const hint = $("[data-phone-hint]", phone);
    let topic = "Торт";
    const hhmm = () => { const { h, m } = nlTime(); return `${pad(h)}:${pad(m)}`; };
    const niceDate = (v) => { if (!v) return ""; const [y, m, d] = v.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("uk-UA", { day: "numeric", month: "long" }); };
    const compose = () => {
      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const lines = [`Вітаю!${name ? ` Мене звати ${name}.` : ""}`, `Тема: ${topic}`];
      if (fd.get("date")) lines.push(`Дата свята: ${niceDate(fd.get("date"))}`);
      if (fd.get("guests")) lines.push(`Гостей: ${fd.get("guests")}`);
      const msg = String(fd.get("message") || "").trim();
      return { text: lines.join("\n") + (msg ? `\n\n${msg}` : ""), msg, name, via: fd.get("via") };
    };
    const scrollDown = () => { thread.scrollTop = thread.scrollHeight; };
    const paint = () => {
      const { text, msg, via } = compose();
      draft.textContent = text;
      draft.classList.toggle("is-empty", !msg);
      phone.classList.toggle("is-mail", via === "mail");
      $("[data-phone-app]", phone).textContent = via === "mail" ? "✉️" : "💬";
      hint.textContent = msg ? "Натисніть «Надіслати ✈»" : "Повідомлення…";
      scrollDown();
    };
    $("[data-topics]", form).addEventListener("click", (e) => {
      const b = e.target.closest("[data-topic]");
      if (!b) return;
      topic = b.dataset.topic;
      $$("[data-topic]", form).forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
      paint();
    });
    form.addEventListener("input", paint);
    form.addEventListener("change", paint);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const { text, msg, name, via } = compose();
      const msgEl = form.elements.message;
      if (!msg) {
        msgEl.classList.add("is-invalid");
        msgEl.focus();
        showToast("Напишіть кілька слів про ваше свято");
        return;
      }
      msgEl.classList.remove("is-invalid");
      const url = via === "mail"
        ? `mailto:${C().email}?subject=${encodeURIComponent("Mariday · " + topic)}&body=${encodeURIComponent(text)}`
        : `https://wa.me/${C().whatsapp}?text=${encodeURIComponent(text)}`;
      // open right away (inside the click) so pop-up blockers stay calm
      if (via === "mail") location.href = url;
      else window.open(url, "_blank", "noopener");
      // play the chat
      draft.classList.remove("is-draft", "is-empty");
      draft.classList.add("is-sent");
      draft.insertAdjacentHTML("beforeend", `<time>${hhmm()} ✓✓</time>`);
      draft.removeAttribute("data-draft");
      const fresh = document.createElement("p");
      fresh.className = "ct-msg ct-msg--out is-draft is-empty";
      fresh.setAttribute("data-draft", "");
      const typing = document.createElement("p");
      typing.className = "ct-msg ct-msg--in ct-msg--typing";
      typing.innerHTML = "<i></i><i></i><i></i>";
      setTimeout(() => { thread.appendChild(typing); $("[data-phone-status]", phone).textContent = "друкує…"; scrollDown(); }, 700);
      setTimeout(() => {
        typing.remove();
        const reply = document.createElement("p");
        reply.className = "ct-msg ct-msg--in";
        reply.innerHTML = `Дякуємо${name ? `, ${esc(name)}` : ""}! ✨ Повідомлення вже у ${via === "mail" ? "пошті" : "WhatsApp"} — відповімо якнайшвидше 🍒<time>${hhmm()}</time>`;
        thread.appendChild(reply);
        thread.appendChild(fresh);
        draft = fresh;
        $("[data-phone-status]", phone).textContent = "онлайн";
        form.elements.message.value = "";
        paint();
      }, 2000);
      window.burstConfetti?.(phone);
      showToast(via === "mail" ? "Відкриваємо пошту з готовим листом ✉️" : "Відкриваємо WhatsApp з готовим повідомленням 💬");
    });
    paint();
  }

  /* ═════════════ FAQ chat bot ═════════════ */

  const SYN = [
    [/цін|варт|кошт|скільки.*(€|євро)|дорог/, "ціна вартість оплат"],
    [/доставк|привез|везет|кур.?єр|адрес/, "доставк забрати"],
    [/алерг|горіх|глютен|лактоз|безглют/, "алергії"],
    [/весіл|наречен|свадьб/, "весільні дегустац"],
    [/напис|надпис|текст/, "напис"],
    [/зберіг|холодильн|скільки.*стоїть|свіж/, "зберігати"],
    [/дегуст|спробува|пробн/, "дегустац"],
    [/завтра|терміново|сьогодн|швидко|срочн/, "завтра терміново"],
    [/змін|поміня|скасу|відмін/, "змінити"],
    [/дизайн|референс|фото|свій/, "дизайн"],
    [/начинк|смак|шар/, "начинки смак"],
    [/передоплат|аванс|ideal|оплат/, "оплатити передоплата"],
  ];
  const stem = (w) => w.slice(0, Math.max(4, Math.min(6, w.length - 1)));
  const tokens = (s) => (s.toLowerCase().match(/[a-zа-яіїєґ']{3,}/g) || []).map(stem);

  function faqBot() {
    const thread = $("[data-thread]");
    if (!thread || !M()) return;
    const all = [...M().faq, ...(M().faqMore || [])].map((q, i) => ({ ...q, i, tq: tokens(q.q), ta: tokens(q.a) }));
    const list = $("#faq-list"), cats = $("#faq-cats"), search = $("#faq-search");
    const quick = $("[data-quick]"), form = $("[data-ask]"), input = $("input", form);
    const status = $("[data-bot-status]");
    const ava = assetPath("img/ig-profile.jpg");
    const asked = new Set();
    let cat = "all";
    let busy = false;

    const time = () => { const { h, m } = nlTime(); return `${pad(h)}:${pad(m)}`; };
    const scrollDown = () => thread.scrollTo({ top: thread.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    function bubble(html, who) {
      const row = document.createElement("div");
      row.className = `fq2-row fq2-row--${who}`;
      row.innerHTML = who === "bot" ? `<img src="${ava}" alt=""><div class="fq2-msg">${html}</div>` : `<div class="fq2-msg">${html}<time>${time()} ✓✓</time></div>`;
      thread.appendChild(row);
      scrollDown();
      return row;
    }
    function botSay(html, after) {
      busy = true;
      status.textContent = "друкує…";
      const typing = bubble('<span class="fq2-typing"><i></i><i></i><i></i></span>', "bot");
      const wait = reduce ? 150 : Math.min(1400, 450 + html.replace(/<[^>]+>/g, "").length * 6);
      setTimeout(() => {
        typing.querySelector(".fq2-msg").innerHTML = html;
        typing.classList.add("is-in");
        status.textContent = "онлайн · відповідає миттєво";
        busy = false;
        scrollDown();
        after?.(typing);
      }, wait);
    }
    function chips(items) {
      quick.innerHTML = items.map((q) => `<button type="button" class="fq2-chip" data-ask-id="${q.i}">${esc(q.q)}</button>`).join("");
    }
    function related(q) {
      const pool = all.filter((x) => x.i !== q.i && !asked.has(x.i));
      return [...pool.filter((x) => x.cat === q.cat), ...pool.filter((x) => x.cat !== q.cat)].slice(0, 3);
    }
    function answer(q) {
      asked.add(q.i);
      paintList();
      botSay(`${esc(q.a)}<span class="fq2-fb">Допомогло? <button type="button" data-fb="yes" aria-label="Так">👍</button><button type="button" data-fb="no" aria-label="Ні">👎</button></span>`, () => chips(related(q)));
    }
    function ask(id) {
      if (busy) return;
      const q = all.find((x) => x.i === +id);
      if (!q) return;
      quick.innerHTML = "";
      bubble(esc(q.q), "me");
      answer(q);
    }
    function askFree(text) {
      if (busy || !text.trim()) return;
      quick.innerHTML = "";
      bubble(esc(text), "me");
      let qs = tokens(text);
      SYN.forEach(([re, add]) => { if (re.test(text.toLowerCase())) qs = qs.concat(tokens(add)); });
      const scored = all.map((q) => {
        let s = 0;
        new Set(qs).forEach((w) => {
          if (q.tq.some((x) => x.startsWith(w) || w.startsWith(x))) s += 2;
          else if (q.ta.some((x) => x.startsWith(w) || w.startsWith(x))) s += 1;
        });
        return [q, s];
      }).sort((a, b) => b[1] - a[1]);
      const [best, score] = scored[0];
      if (score >= 2) {
        if (scored[1][1] === score && scored[1][0].cat !== best.cat) {
          botSay(`Здається, ви про одне з цього 👇`, () => chips([best, scored[1][0], scored[2][0]]));
        } else answer(best);
      } else {
        const wa = `https://wa.me/${C().whatsapp}?text=${encodeURIComponent(text)}`;
        botSay(`Хм, на це краще відповість менеджер 🙂 Надішлю ваше питання?<span class="fq2-links"><a href="${wa}" target="_blank" rel="noopener">💬 WhatsApp</a><a href="${C().instagram}" target="_blank" rel="noopener">📸 Instagram</a></span>`, () => chips(all.filter((x) => !asked.has(x.i)).slice(0, 3)));
      }
    }
    function greet() {
      thread.innerHTML = "";
      quick.innerHTML = "";
      asked.clear();
      paintList();
      botSay("Привіт! 👋 Я помічник Mariday. Оберіть питання нижче або напишіть своє — відповім за секунду.", () => chips([all[0], all[1], all[8], all[4]].filter(Boolean)));
    }

    const counts = {};
    M().faqCats.forEach((c) => (counts[c.id] = all.filter((q) => c.id === "all" || q.cat === c.id).length));
    function paintList() {
      cats.innerHTML = M().faqCats.map((c, i) => `<button type="button" class="p-sticker${c.id === cat ? " is-on" : ""}" data-fcat="${c.id}" aria-pressed="${c.id === cat}" style="--r:${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg"><span aria-hidden="true">${c.emoji}</span> ${esc(c.label)}<sup>${counts[c.id]}</sup></button>`).join("");
      const t = search.value.trim().toLowerCase();
      const items = all.filter((q) => (cat === "all" || q.cat === cat) && (!t || (q.q + " " + q.a).toLowerCase().includes(t)));
      list.innerHTML = items.length
        ? items.map((q) => `<button type="button" class="fq2-item${asked.has(q.i) ? " is-asked" : ""}" data-ask-id="${q.i}"><span>${esc(q.q)}</span><i aria-hidden="true">${asked.has(q.i) ? "✓" : "→"}</i></button>`).join("")
        : `<p class="fq2-none">Нічого не знайшли — напишіть питання в чат →</p>`;
    }

    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-ask-id]");
      if (a) {
        ask(a.dataset.askId);
        if (innerWidth < 960 && list.contains(a)) {
          const top = thread.closest(".fq2-chat").getBoundingClientRect().top + scrollY - 20;
          window.MaridayLenis ? MaridayLenis.scrollTo(top, { duration: 1 }) : scrollTo({ top, behavior: "smooth" });
        }
        return;
      }
      const c = e.target.closest("[data-fcat]");
      if (c) { cat = c.dataset.fcat; paintList(); return; }
      const fb = e.target.closest("[data-fb]");
      if (fb) {
        const box = fb.parentElement;
        box.innerHTML = fb.dataset.fb === "yes" ? "Дякуємо! 🍒" : "Шкода 😔";
        if (fb.dataset.fb === "no") botSay(`Тоді напишіть менеджеру — розберемося особисто 💌<span class="fq2-links"><a href="https://wa.me/${C().whatsapp}" target="_blank" rel="noopener">💬 WhatsApp</a><a href="contacts.html">✉️ Контакти</a></span>`);
      }
    });
    // double-tap a reply to ♥ it
    thread.addEventListener("dblclick", (e) => {
      const msg = e.target.closest(".fq2-row--bot .fq2-msg");
      if (!msg) return;
      msg.classList.toggle("is-liked");
    });
    $("[data-clear]").addEventListener("click", greet);
    search.addEventListener("input", paintList);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value;
      input.value = "";
      askFree(v);
    });
    greet();
  }

  MARIDAY.onReady(() => {
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    const page = document.body.dataset.page;
    if (page === "about") { aboutDay(); aboutFlips(); aboutWall(); aboutLetter(); }
    if (page === "delivery") { deliveryMap(); deliveryCalendar(); deliveryGame(); }
    if (page === "contacts") { contactsClock(); contactsWeek(); contactsCopy(); contactsComposer(); }
    if (page === "faq") faqBot();
    void fine;
  });
})();
