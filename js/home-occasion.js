/* Mariday home — ⑭ occasion cake wheel.
   One cake seen from above, cut into eight slices — one per occasion, each its own cake photo.
   Spin it (drag with inertia, click a slice, ← → keys, chips or "random"): it snaps to a slice,
   the cake server clicks over every cut, and the slice under it slides out of the cake with its story. */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const $ = (s, r = document) => r.querySelector(s);
  const pad = (n) => String(n).padStart(2, "0");
  const mod = (n, m) => ((n % m) + m) % m;
  const NS = "http://www.w3.org/2000/svg";

  const OCCASIONS = [
    { word: "весілля", name: "Весілля", text: "Яруси, живі квіти й дегустація начинок перед замовленням. Вагу рахуємо за нормою 150–200 г на гостя.", tags: ["яруси", "живі квіти", "дегустація"], cta: "Весільні торти", href: "pages/cakes.html", img: "img/cakes/roses.jpg" },
    { word: "день народження", name: "День народження", text: "Напис, свічки й улюблена начинка іменинника — від бенто до двох ярусів.", tags: ["напис", "свічки", "від бенто до 2 ярусів"], cta: "Зібрати в конструкторі", href: "pages/constructor.html", img: "img/cakes/pink.jpg" },
    { word: "гендер-паті", name: "Гендер-паті", text: "Нейтральний декор зовні — і колір-сюрприз усередині. Дізнаєтесь із першим шматком.", tags: ["нейтральний декор", "колір усередині"], cta: "Зібрати в конструкторі", href: "pages/constructor.html", img: "img/cakes/donuts.jpg" },
    { word: "хрестини", name: "Хрестини", text: "Світлі пастельні відтінки, ніжні квіти й спокійний, урочистий дизайн.", tags: ["пастель", "ніжні квіти"], cta: "Зібрати в конструкторі", href: "pages/constructor.html", img: "img/cakes/lilac.jpg" },
    { word: "бебі-шауер", name: "Бебі-шауер", text: "Пастель, мінімалізм і бенто для гостей — легкий солодкий стіл без зайвого.", tags: ["мінімалізм", "бенто для гостей"], cta: "Подивитись бенто", href: "pages/bento.html", img: "img/cakes/cupcakes.jpg" },
    { word: "річниця", name: "Річниця", text: "Бенто з вашою датою чи маленька копія весільного торта — для двох.", tags: ["ваша дата", "торт на двох"], cta: "Подивитись бенто", href: "pages/bento.html", img: "img/cakes/berries.jpg" },
    { word: "корпоратив", name: "Корпоратив", text: "Логотип компанії, капкейки й candy bar на всю команду.", tags: ["логотип", "капкейки", "candy bar"], cta: "Candy bar", href: "pages/desserts.html", img: "img/cakes/gold.jpg" },
    { word: "просто так", name: "Просто так", text: "Бенто з жартом чи компліментом — найкращий привід без приводу.", tags: ["жарт", "комплімент", "бенто"], cta: "Подивитись бенто", href: "pages/bento.html", img: "img/cakes/swirl.jpg" },
  ];
  const N = OCCASIONS.length;
  const STEP = 360 / N;

  /* geometry, in the svg's 0–1000 box (the viewBox has 20 spare units around for the pulled slice) */
  const C = 500;
  const R_CAKE = 372;
  const R_TEXT = 446;
  const pt = (r, deg) => {
    const a = (deg * Math.PI) / 180;
    return [C + r * Math.sin(a), C - r * Math.cos(a)];
  };
  const fx = (n) => n.toFixed(1);

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function buildSvg(svg) {
    const [ax, ay] = pt(R_CAKE, -STEP / 2);
    const [bx, by] = pt(R_CAKE, STEP / 2);
    const wedge = `M${C},${C} L${fx(ax)},${fx(ay)} A${R_CAKE},${R_CAKE} 0 0 1 ${fx(bx)},${fx(by)} Z`;

    svg.innerHTML = `
      <defs>
        <radialGradient id="xf-plate" cx="50%" cy="46%" r="54%"><stop offset="0" stop-color="#ffffff"/><stop offset=".78" stop-color="#fbf6f5"/><stop offset=".9" stop-color="#efe3e3"/><stop offset="1" stop-color="#e2d1d2"/></radialGradient>
        <radialGradient id="xf-cream" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fff6f2"/><stop offset="1" stop-color="#ecd9d6"/></radialGradient>
        <radialGradient id="xf-cherry" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#d63045"/><stop offset=".55" stop-color="#8f0c14"/><stop offset="1" stop-color="#470304"/></radialGradient>
        <radialGradient id="xf-shade" cx="50%" cy="50%" r="50%"><stop offset=".55" stop-color="#3d0405" stop-opacity="0"/><stop offset="1" stop-color="#3d0405" stop-opacity=".28"/></radialGradient>
        <clipPath id="xf-wedge"><path d="${wedge}"/></clipPath>
        <path id="xf-rim" d="M${C},${C - R_TEXT} a${R_TEXT},${R_TEXT} 0 1,1 0,${2 * R_TEXT} a${R_TEXT},${R_TEXT} 0 1,1 0,${-2 * R_TEXT} a${R_TEXT},${R_TEXT} 0 1,1 0,${2 * R_TEXT} a${R_TEXT},${R_TEXT} 0 1,1 0,${-2 * R_TEXT}"/>
      </defs>
      <circle class="x-fest__plate" cx="${C}" cy="${C}" r="496" fill="url(#xf-plate)"/>
      <circle cx="${C}" cy="${C}" r="404" fill="none" stroke="rgba(109,8,9,.07)" stroke-width="2"/>
      <circle cx="${C}" cy="${C}" r="488" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="3"/>`;

    const spin = el("g", { class: "x-fest__spin" }, svg);
    const rim = el("g", { class: "x-fest__rim" }, spin);
    const cake = el("g", { class: "x-fest__cake" }, spin);
    el("circle", { cx: C, cy: C, r: R_CAKE + 4, fill: "rgba(61,4,5,.16)", class: "x-fest__base" }, cake);

    const slices = OCCASIONS.map((o, i) => {
      const at = el("g", { transform: `rotate(${i * STEP} ${C} ${C})` }, cake);
      const slice = el("g", { class: "x-fest__slice", "data-i": i }, at);
      el("path", { d: wedge, class: "x-fest__crumb" }, slice);
      el("image", { href: o.img, x: 320, y: 96, width: 360, height: 420, preserveAspectRatio: "xMidYMid slice", "clip-path": "url(#xf-wedge)" }, slice);
      el("path", { d: wedge, fill: "url(#xf-shade)", "pointer-events": "none" }, slice);
      el("path", { d: wedge, class: "x-fest__cut" }, slice);
      // piped cream along the slice's edge, a cherry on the middle rosette
      [-14, 0, 14].forEach((deg) => {
        const [x, y] = pt(R_CAKE - 26, deg);
        const g = el("g", { transform: `translate(${fx(x)} ${fx(y)}) rotate(${deg})`, class: "x-fest__rose" }, slice);
        el("circle", { r: 25, fill: "url(#xf-cream)" }, g);
        el("path", { d: "M-12,4 a12,12 0 1,1 12,10 a7,7 0 1,1 -5,-12", fill: "none", stroke: "rgba(109,8,9,.13)", "stroke-width": 2.4, "stroke-linecap": "round" }, g);
        if (deg === 0) {
          el("circle", { cx: 0, cy: -4, r: 13, fill: "url(#xf-cherry)" }, g);
          el("ellipse", { cx: -4, cy: -9, rx: 4, ry: 2.6, fill: "rgba(255,255,255,.7)", transform: "rotate(-30 -4 -9)" }, g);
        }
      });
      // occasion name on the plate rim
      const t = el("text", { class: "x-fest__label", dy: "0.36em" }, rim);
      const tp = el("textPath", { href: "#xf-rim", startOffset: `${((360 + i * STEP) / 720) * 100}%`, "text-anchor": "middle" }, t);
      tp.textContent = o.word;
      return { slice, label: t };
    });

    // rim dots between the names
    for (let i = 0; i < N; i++) {
      const [x, y] = pt(R_TEXT, i * STEP + STEP / 2);
      el("circle", { cx: fx(x), cy: fx(y), r: 4, fill: "var(--pink-deep)" }, rim);
    }

    // centre: cream disc and real cherries
    el("circle", { cx: C, cy: C, r: 74, fill: "url(#xf-cream)", stroke: "rgba(109,8,9,.08)", "stroke-width": 2 }, cake);
    el("image", { href: "img/cakes/cherries.png", x: C - 70, y: C - 82, width: 140, height: 140, class: "x-fest__cherries" }, cake);

    return { spin, slices };
  }

  /* a tiny tween so the wheel works with or without GSAP */
  function tween(from, to, ms, ease, onUpdate, onDone) {
    let id = 0;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      onUpdate(from + (to - from) * ease(k));
      if (k < 1) id = requestAnimationFrame(step);
      else onDone && onDone();
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }
  const easeOut = (k) => 1 - Math.pow(1 - k, 4);
  const easeBack = (k) => {
    const s = 1.4;
    return 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
  };

  function fest() {
    const section = $("#occasion.x-fest");
    if (!section) return;
    const wheel = $("[data-fest-wheel]", section);
    const svg = $("[data-fest-svg]", section);
    const server = $("[data-fest-server]", section);
    const info = $("[data-fest-info]", section);
    const nEl = $("[data-fest-n]", info);
    const nameEl = $("[data-fest-name]", info);
    const textEl = $("[data-fest-text]", info);
    const tagsEl = $("[data-fest-tags]", info);
    const cta = $("[data-fest-cta]", info);
    const lucky = $("[data-fest-lucky]", section);
    const chipsEl = $("[data-fest-chips]", section);

    const { spin, slices } = buildSvg(svg);
    const chips = OCCASIONS.map((o, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "x-fest__chip";
      b.textContent = o.name;
      b.addEventListener("click", () => goTo(i));
      chipsEl.appendChild(b);
      return b;
    });

    let rot = 0;
    let active = -1;
    let lastCut = 0;
    let stop = null;

    const restart = (node, cls) => {
      node.classList.remove(cls);
      void node.offsetWidth;
      node.classList.add(cls);
    };

    const render = (r) => {
      rot = r;
      spin.setAttribute("transform", `rotate(${r.toFixed(2)} ${C} ${C})`);
      // the server clicks every time a cut passes under it
      const cut = Math.floor((r + STEP / 2) / STEP);
      if (cut !== lastCut) {
        lastCut = cut;
        if (!reduce) restart(server, "is-tick");
      }
    };

    const indexAt = (r) => mod(Math.round(-r / STEP), N);

    const show = (i) => {
      slices.forEach((s, k) => {
        s.slice.classList.toggle("is-on", k === i);
        s.label.classList.toggle("is-on", k === i);
      });
      chips.forEach((c, k) => c.setAttribute("aria-pressed", String(k === i)));
      wheel.classList.toggle("is-picked", i >= 0);
      if (i < 0 || i === active) return;
      active = i;
      const o = OCCASIONS[i];
      nEl.textContent = pad(i + 1);
      nameEl.textContent = o.name;
      textEl.textContent = o.text;
      tagsEl.replaceChildren(...o.tags.map((t) => Object.assign(document.createElement("li"), { textContent: t })));
      cta.querySelector("span").textContent = o.cta;
      cta.setAttribute("href", o.href);
      if (!reduce) restart(info, "is-swap");
    };

    const settle = (target, ms, ease = easeBack) => {
      stop && stop();
      show(-1);
      if (reduce || ms === 0) {
        render(target);
        show(indexAt(target));
        return;
      }
      stop = tween(rot, target, ms, ease, render, () => {
        stop = null;
        show(indexAt(target));
      });
    };

    function goTo(i, ms) {
      const base = -i * STEP;
      const target = base + 360 * Math.round((rot - base) / 360);
      settle(target, ms ?? 500 + Math.abs(target - rot) * 4);
    }

    /* ── drag with inertia ── */
    const angleOf = (e) => {
      const r = svg.getBoundingClientRect();
      return (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    };
    let drag = null;
    wheel.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      stop && stop();
      stop = null;
      wheel.setPointerCapture(e.pointerId);
      drag = { a: angleOf(e), x: e.clientX, y: e.clientY, moved: 0, v: 0, t: performance.now(), hit: e.target.closest(".x-fest__slice") };
      wheel.classList.add("is-drag");
    });
    wheel.addEventListener("pointermove", (e) => {
      if (!drag) return;
      drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.x, e.clientY - drag.y));
      if (drag.moved < 5) return;
      if (wheel.classList.contains("is-picked")) show(-1);
      const a = angleOf(e);
      const d = mod(a - drag.a + 180, 360) - 180;
      const now = performance.now();
      drag.v = drag.v * 0.6 + (d / Math.max(1, now - drag.t)) * 0.4;
      drag.a = a;
      drag.t = now;
      render(rot + d);
      section.classList.add("is-played");
    });
    const release = () => {
      if (!drag) return;
      const { moved, v, hit, t } = drag;
      drag = null;
      wheel.classList.remove("is-drag");
      if (moved < 5) {
        if (hit) {
          section.classList.add("is-played");
          goTo(Number(hit.dataset.i));
        } else settle(STEP * Math.round(rot / STEP), 300);
        return;
      }
      const fresh = performance.now() - t < 80 ? v : 0;
      const fling = Math.max(-900, Math.min(900, fresh * 420));
      const target = STEP * Math.round((rot + fling) / STEP);
      settle(target, 500 + Math.min(1700, Math.abs(target - rot) * 3.2), Math.abs(fling) > 40 ? easeOut : easeBack);
    };
    wheel.addEventListener("pointerup", release);
    wheel.addEventListener("pointercancel", release);

    wheel.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      section.classList.add("is-played");
      goTo(mod(active + (e.key === "ArrowRight" ? 1 : -1), N));
    });

    lucky.addEventListener("click", () => {
      section.classList.add("is-played");
      let i = Math.floor(Math.random() * (N - 1));
      if (i >= active) i++;
      const base = STEP * Math.round(rot / STEP);
      const turn = mod(-i * STEP - base, 360);
      settle(base + turn + 720, reduce ? 0 : 2600, easeOut);
    });

    /* ── the cake spins in when it scrolls into view ── */
    if (!reduce && "IntersectionObserver" in window) {
      render(-200);
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        section.classList.add("is-in");
        setTimeout(() => settle(0, 1900, easeOut), 250);
      }, { threshold: 0.35 });
      io.observe(wheel);
    } else {
      section.classList.add("is-in");
      render(0);
      show(0);
    }
  }

  MARIDAY.onReady(fest);
})();
