/* Final CTA: tear-off calendar of reasons (drag a page down → next day; CTA hands the date to checkout), jelly title, draggable stickers, "торт" easter egg */
(function () {
  // fixed dates beat everything else ("MM-DD")
  const HOLIDAYS = {
    "01-01": "Новий рік. Олів’є вже набридло",
    "02-14": "День закоханих. Торт — теж мова кохання",
    "03-08": "8 березня. Квіти зів’януть, а торт — ні",
    "04-27": "Koningsdag. Помаранчевий крем — офіційно 🧡",
    "06-01": "День захисту дітей (і вашої внутрішньої дитини)",
    "08-24": "День Незалежності 💙💛",
    "10-01": "День захисників і захисниць 💙💛",
    "10-31": "Гелловін. Страшно смачно 🎃",
    "12-05": "Sinterklaas. Пеперноти — це не торт 😏",
    "12-25": "Різдво. Пряничний настрій обов’язковий",
    "12-31": "31 грудня. Торт — головна страва",
  };
  const WEEKDAY = [
    "Неділя. Торт до кави — це традиція",
    "Понеділок. Дієту офіційно перенесено",
    "Вівторок. Найнудніший день — врятуйте його",
    "Середа. Пів тижня позаду — нагорода!",
    "Четвер. Майже п’ятниця, а це вже свято",
    "П’ятниця. Цього цілком достатньо",
    "Субота. Гості самі себе не запросять",
  ];
  const REASONS = [
    "Ваш потяг NS прийшов вчасно",
    "Велосипед досі на місці 🚲",
    "Кіт нарешті вас помітив",
    "Сусід перестав свердлити",
    "У Алкмарі сонце. Це рідкість!",
    "Дощ — отже, сидимо вдома з тортом",
    "Ви випили 8 склянок води. Час нагороди",
    "Мама подзвонила просто так",
    "Вивчили нове слово: gezellig",
    "Хтось сказав «gefeliciteerd», а торта нема",
    "Пральна машина не з’їла шкарпетку",
    "Подруга повернулася з відпустки",
    "Річниця того дня, коли ви купили фікус",
    "Ви розібрали пошту. Героїзм!",
    "Нічого не сталося — і це прекрасно",
    "Бос у відпустці",
  ];
  const MILESTONES = {
    7: "Тиждень пролетів. Торт сам себе не замовить 😏",
    30: "Місяць без торта? Ми починаємо хвилюватися 🥺",
    100: "Сто днів! Ви — чемпіон із відривання календарів 🏆",
  };
  const MONTHS = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
  const WD = ["неділя", "понеділок", "вівторок", "середа", "четвер", "пʼятниця", "субота"];
  const SECRET = ["торт", "tort", "cake"];
  const RAIN = ["🎂", "🍰", "🧁", "🍒", "🍓", "✨"];

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const calm = () => reduce || document.documentElement.classList.contains("x-static");

  function init() {
    const sec = document.querySelector(".x-cta");
    if (!sec) return;
    const toast = toaster(sec);
    jelly(sec);
    stickers(sec);
    tearCalendar(sec, toast);
    secret(sec, toast);
  }

  function toaster(sec) {
    const el = sec.querySelector(".x-cta__toast");
    let t;
    return (msg) => {
      if (!el) return;
      el.textContent = msg;
      el.classList.add("is-on");
      clearTimeout(t);
      t = setTimeout(() => el.classList.remove("is-on"), 3200);
    };
  }

  /* ── letters that wobble like jelly when touched ── */
  function jelly(sec) {
    const host = sec.querySelector(".x-cta__jelly .x-ri") || sec.querySelector(".x-cta__jelly");
    if (!host) return;
    const text = host.textContent;
    host.textContent = "";
    [...text].forEach((ch) => {
      const s = document.createElement("span");
      s.className = "x-j";
      s.textContent = ch;
      host.appendChild(s);
    });
    if (reduce) return;
    host.addEventListener("pointerover", (e) => {
      const l = e.target.closest(".x-j");
      if (!l || l.getAnimations().length) return;
      l.animate(
        [
          { transform: "scale(1, 1)" },
          { transform: "scale(1.25, 0.75) translateY(6%)" },
          { transform: "scale(0.85, 1.2) translateY(-14%)" },
          { transform: "scale(1.08, 0.94)" },
          { transform: "scale(0.97, 1.03)" },
          { transform: "scale(1, 1)" },
        ],
        { duration: 750, easing: "ease-out" }
      );
    });
  }

  /* ── stickers you can grab and throw around ── */
  function stickers(sec) {
    let z = 4;
    sec.querySelectorAll(".x-cta__st").forEach((st) => {
      let sx = 0, sy = 0, bx = 0, by = 0;
      st.addEventListener("pointerdown", (e) => {
        e.stopPropagation(); // no sprinkle burst while grabbing
        st.setPointerCapture(e.pointerId);
        st.classList.add("is-drag");
        st.style.zIndex = ++z;
        sx = e.clientX; sy = e.clientY;
        bx = parseFloat(st.style.getPropertyValue("--dx")) || 0;
        by = parseFloat(st.style.getPropertyValue("--dy")) || 0;
      });
      st.addEventListener("pointermove", (e) => {
        if (!st.classList.contains("is-drag")) return;
        st.style.setProperty("--dx", `${bx + e.clientX - sx}px`);
        st.style.setProperty("--dy", `${by + e.clientY - sy}px`);
      });
      const drop = () => {
        if (!st.classList.contains("is-drag")) return;
        st.classList.remove("is-drag");
        st.style.setProperty("--r", `${Math.round(Math.random() * 24 - 12)}deg`);
      };
      st.addEventListener("pointerup", drop);
      st.addEventListener("pointercancel", drop);
    });
  }

  /* ── tear-off calendar: every day has a reason for cake ── */
  function tearCalendar(sec, toast) {
    const root = sec.querySelector("[data-tear]");
    if (!root) return;
    const stack = root.querySelector("[data-tear-stack]");
    const stubs = root.querySelector(".x-tear__stubs");
    const rip = root.querySelector("[data-tear-rip]");
    const want = root.querySelector("[data-tear-want]");
    const live = root.querySelector("[data-tear-live]");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const dayOf = (i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const dayOfYear = (d) => Math.round((d - new Date(d.getFullYear(), 0, 1)) / 864e5) + 1;
    const toNewYear = (d) => Math.round((new Date(d.getFullYear() + 1, 0, 1) - d) / 864e5);
    const nice = (d) => d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });

    function reason(d, i) {
      if (i === 0) return "Ви догортали сайт до кінця. Це вже привід 🎉";
      const fixed = HOLIDAYS[`${pad(d.getMonth() + 1)}-${pad(d.getDate())}`];
      if (fixed) return fixed;
      const doy = dayOfYear(d);
      return doy % 3 === 0 ? WEEKDAY[d.getDay()] : REASONS[(doy * 7) % REASONS.length];
    }
    // lead time from the FAQ: bento from 1 day, cakes ideally 5–7 days ahead, "tomorrow" is +20%
    function slot(i) {
      if (i === 0) return ["is-rush", "сьогодні — лише бенто"];
      if (i === 1) return ["is-rush", "терміново · +20%"];
      if (i < 5) return ["is-few", "встигнемо · уточнимо"];
      return ["is-free", "ідеальний термін ✓"];
    }

    function page(i) {
      const d = dayOf(i);
      const [cls, label] = slot(i);
      const el = document.createElement("div");
      el.className = "x-page" + (d.getDay() === 0 || d.getDay() === 6 || HOLIDAYS[`${pad(d.getMonth() + 1)}-${pad(d.getDate())}`] ? " is-weekend" : "");
      el.innerHTML = `
        <div class="x-page__top"><span>${MONTHS[d.getMonth()]}</span><span>${d.getFullYear()}</span></div>
        <p class="x-page__day">${d.getDate()}</p>
        <p class="x-page__wd">${i === 0 ? "сьогодні, " : i === 1 ? "завтра, " : ""}${WD[d.getDay()]}</p>
        <hr class="x-page__rule">
        <p class="x-page__kicker">Привід дня</p>
        <p class="x-page__why"></p>
        <div class="x-page__foot"><span>${dayOfYear(d)}-й день · до НР ${toNewYear(d)}</span><span class="x-page__slot ${cls}">${label}</span></div>`;
      el.querySelector(".x-page__why").textContent = reason(d, i);
      return el;
    }

    let n = 0; // offset of the visible page from today
    let torn = 0;
    let top = page(0);
    let under = page(1);
    stack.append(under, top);

    function sync() {
      const d = dayOf(n);
      want.textContent = n === 0 ? "Бенто на сьогодні →" : `Торт на ${nice(d)} →`;
      want.href = n === 0 ? "pages/bento.html" : "pages/constructor.html";
      live.textContent = `${nice(d)}, ${WD[d.getDay()]}. Привід дня: ${reason(d, n)}.`;
    }

    function addStub() {
      const pts = ["0 0", "100% 0"];
      for (let x = 100; x >= 0; x -= 5 + Math.random() * 6) pts.push(`${x.toFixed(1)}% ${(25 + Math.random() * 75).toFixed(0)}%`);
      pts.push("0 40%");
      const st = document.createElement("i");
      st.style.setProperty("--cut", `polygon(${pts.join(",")})`);
      stubs.appendChild(st);
      if (stubs.children.length > 4) stubs.firstElementChild.remove();
    }

    function tear(dir = Math.random() < 0.5 ? -1 : 1, from = { x: 0, y: 0, r: 0 }) {
      const leaving = top;
      top = under;
      n++;
      under = page(n + 1);
      stack.prepend(under);
      torn++;
      addStub();
      sync();
      if (MILESTONES[torn]) toast(MILESTONES[torn]);

      if (calm()) return leaving.remove();
      // the page loses its top edge where it was glued to the pad
      const jag = ["0 6%"];
      for (let x = 0; x <= 100; x += 6 + Math.random() * 6) jag.push(`${x.toFixed(1)}% ${(Math.random() * 3).toFixed(1)}%`);
      jag.push("100% 4%", "100% 100%", "0 100%");
      leaving.style.clipPath = `polygon(${jag.join(",")})`;
      leaving.classList.add("x-page--fly");
      const H = stack.clientHeight;
      leaving.animate(
        [
          { transform: `translate(${from.x}px, ${from.y}px) rotate(${from.r}deg)`, opacity: 1 },
          { transform: `translate(${from.x + dir * 60}px, ${from.y + H * 0.35}px) rotate(${from.r + dir * 14}deg)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${from.x + dir * 220}px, ${from.y + H * 1.6}px) rotate(${from.r + dir * 48}deg)`, opacity: 0 },
        ],
        { duration: 1000, easing: "cubic-bezier(.3,.1,.6,1)", fill: "forwards" }
      ).onfinish = () => leaving.remove();
      top.animate([{ filter: "brightness(0.9)" }, { filter: "brightness(1)" }], { duration: 400 });
    }

    // drag the page down (or sideways) until it rips off
    let drag = null;
    stack.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); // the pad is not a sprinkle target
      if (e.button !== 0) return;
      drag = { sx: e.clientX, sy: e.clientY, x: 0, y: 0, r: 0, moved: false, id: e.pointerId };
    });
    stack.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx;
      const dy = Math.max(0, e.clientY - drag.sy);
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        stack.setPointerCapture(e.pointerId);
        stack.classList.add("is-drag");
      }
      // paper resists: it bends, it doesn't slide
      drag.x = dx * 0.35;
      drag.y = dy * 0.3;
      drag.r = dx * 0.05 + (dy * Math.sign(dx || 1)) * 0.02;
      top.style.transform = `translate(${drag.x}px, ${drag.y}px) rotate(${drag.r}deg)`;
      if (Math.hypot(dx, dy) > 130) release(e, true);
    });
    function release(e, force) {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      stack.classList.remove("is-drag");
      const page = top;
      if (force || !d.moved) {
        page.style.transform = "";
        return tear(d.x ? Math.sign(d.x) : undefined, d.moved ? d : undefined);
      }
      page.animate([{ transform: page.style.transform }, { transform: "none" }], { duration: 500, easing: "cubic-bezier(.2,1.6,.4,1)" });
      page.style.transform = "";
    }
    stack.addEventListener("pointerup", (e) => release(e, false));
    stack.addEventListener("pointercancel", (e) => {
      if (drag) drag.moved = true; // spring back, never tear on cancel
      release(e, false);
    });
    stack.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        tear();
      }
    });
    rip.addEventListener("click", () => tear());
    // hand the chosen day to the checkout form (js/layout.js prefills it)
    want.addEventListener("click", () => {
      try { sessionStorage.setItem("mariday:date", iso(dayOf(n))); } catch (_) {}
    });

    sync();
  }

  /* ── type "торт" while the section is on screen → it rains cake ── */
  function secret(sec, toast) {
    let visible = false;
    let buf = "";
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.3 }).observe(sec);

    document.addEventListener("keydown", (e) => {
      if (!visible || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (e.target.closest?.("input, textarea, [contenteditable]")) return;
      buf = (buf + e.key.toLowerCase()).slice(-6);
      if (SECRET.some((w) => buf.endsWith(w))) {
        buf = "";
        rain(sec);
        toast("🎉 Секретний рівень: тортопад!");
      }
    });
    // touch devices have no keyboard: a triple-tap on the hint does the same
    const hint = sec.querySelector(".x-cta__hint");
    let taps = [];
    hint?.addEventListener("pointerdown", () => {
      const now = Date.now();
      taps = taps.filter((t) => now - t < 600).concat(now);
      if (taps.length >= 3) {
        taps = [];
        rain(sec);
        toast("🎉 Секретний рівень: тортопад!");
      }
    });
  }

  function rain(sec) {
    if (calm()) return;
    const H = sec.clientHeight;
    for (let i = 0; i < 46; i++) {
      const d = document.createElement("span");
      d.className = "x-cta__drop";
      d.textContent = RAIN[(Math.random() * RAIN.length) | 0];
      d.style.left = `${Math.random() * 100}%`;
      d.style.setProperty("--s", `${1.4 + Math.random() * 2.4}rem`);
      sec.appendChild(d);
      const spin = (Math.random() - 0.5) * 720;
      const drift = (Math.random() - 0.5) * 160;
      d.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)" },
          { transform: `translate(${drift}px, ${H + 120}px) rotate(${spin}deg)` },
        ],
        { duration: 2200 + Math.random() * 2000, delay: Math.random() * 900, easing: "cubic-bezier(.45,0,.75,.6)", fill: "backwards" }
      ).onfinish = () => d.remove();
    }
  }

  MARIDAY.onReady(init);
})();
