/* Mariday home — lower half: cloche, order path, cake toppers, photo ring, seals, chat FAQ */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const hasLibs = !!(window.gsap && window.ScrollTrigger);
  const live = hasLibs && !reduce;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const SPRINKLE_COLORS = ["#6d0809", "#f5bcc8", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff", "#9ed9b8"];

  /* ───────── ⑫ Cake of the month ───────── */
  function monthName() {
    const now = new Date();
    const name = new Intl.DateTimeFormat("uk-UA", { month: "long" }).format(now);
    $$("[data-month-name]").forEach((el) => { el.textContent = name; });
    $$("[data-month-year]").forEach((el) => { el.textContent = now.getFullYear(); });
  }

  // The glass cloche lifts off the plate as the section scrolls in; the layer tags pop out from under it
  function cloche() {
    const vis = $(".x-month__visual");
    const taste = $(".x-taste");
    if (!vis) return;
    if (!live) {
      vis.classList.add("is-open");
      taste?.classList.add("is-in");
      return;
    }
    if (taste) ScrollTrigger.create({ trigger: taste, start: "top 88%", once: true, onEnter: () => taste.classList.add("is-in") });
    gsap.timeline({
      scrollTrigger: {
        trigger: vis,
        start: "top 75%",
        end: "center 45%",
        scrub: 0.8,
        onUpdate: (self) => vis.classList.toggle("is-open", self.progress > 0.55),
      },
    })
      .to(".x-month__cloche", { yPercent: -46, xPercent: 16, rotation: 18, ease: "power2.inOut" })
      .fromTo(".x-month__plate", { rotation: -25 }, { rotation: 0, ease: "power2.out" }, 0);
  }

  /* ───────── ⑬ Order path: piped cream line with a cherry riding on it ───────── */
  function road() {
    const host = $("#x-road");
    if (!host) return;
    const steps = $$(".x-pstep", host);
    const svg = $(".x-road__svg", host);
    const edge = $(".x-road__edge", svg);
    const reveal = $(".x-road__reveal", svg);
    const rider = $(".x-road__rider", host);
    const state = { p: live ? 0 : 1 };
    let len = 0;
    let stops = [];

    const build = () => {
      const hr = host.getBoundingClientRect();
      const W = hr.width;
      const H = host.offsetHeight;
      if (!W || !H) return;
      svg.setAttribute("viewBox", `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
      const nodes = steps.map((s) => {
        const r = $(".x-pstep__node", s).getBoundingClientRect();
        return [r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2];
      });
      const mobile = W < 700;
      const swing = mobile ? 24 : Math.min(320, W * 0.26);
      const x0 = nodes[0][0];
      const pts = [...nodes, [x0, H - 30]];
      const segs = [];
      let prev = [x0, 0];
      pts.forEach((pt, i) => {
        const dy = pt[1] - prev[1];
        const s = (i % 2 ? -1 : 1) * swing;
        segs.push(`C${(prev[0] + s).toFixed(1)},${(prev[1] + dy * 0.45).toFixed(1)} ${(pt[0] + s).toFixed(1)},${(pt[1] - dy * 0.45).toFixed(1)} ${pt[0].toFixed(1)},${pt[1].toFixed(1)}`);
        prev = pt;
      });
      const start = `M${x0.toFixed(1)},0 `;
      $$("path:not(.x-road__reveal)", svg).concat(reveal).forEach((p) => p.setAttribute("d", start + segs.join(" ")));
      len = edge.getTotalLength();
      // path length up to each step's node, as a fraction of the whole line
      const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
      svg.appendChild(probe);
      stops = nodes.map((_, i) => {
        probe.setAttribute("d", start + segs.slice(0, i + 1).join(" "));
        return probe.getTotalLength() / len;
      });
      probe.remove();
      render();
    };

    const render = () => {
      if (!len) return;
      reveal.style.strokeDashoffset = String(1 - state.p);
      const at = state.p * len;
      const pt = edge.getPointAtLength(at);
      rider.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px) rotate(${(Math.sin(at / 60) * 14).toFixed(1)}deg)`;
      rider.style.opacity = state.p > 0.995 ? "0" : "1";
      steps.forEach((s, i) => s.classList.toggle("is-on", state.p >= stops[i] - 0.004));
    };

    if (!live) {
      build();
      addEventListener("resize", build);
      return;
    }
    const pTo = gsap.quickTo(state, "p", { duration: 0.7, ease: "power3.out", onUpdate: render });
    ScrollTrigger.create({
      trigger: host,
      start: "top 62%",
      end: "bottom 75%",
      onUpdate: (self) => pTo(self.progress),
      onRefresh: build,
    });
    build();
  }

  /* ───────── ⑭ Occasion stickers become cake toppers ───────── */
  const OCCASIONS = {
    wedding: { title: "Торт на весілля", text: "Яруси, живі квіти й дегустація начинок перед замовленням. Вагу рахуємо за нормою 150–200 г на гостя.", cta: "Весільні торти", href: "pages/cakes.html" },
    birthday: { title: "Торт на день народження", text: "Напис, свічки й улюблена начинка іменинника — від бенто до двох ярусів.", cta: "Зібрати в конструкторі", href: "pages/constructor.html" },
    gender: { title: "Торт на гендер-паті", text: "Нейтральний декор зовні — і колір-сюрприз усередині. Дізнаєтесь із першим шматком.", cta: "Зібрати в конструкторі", href: "pages/constructor.html" },
    christening: { title: "Торт на хрестини", text: "Світлі пастельні відтінки, ніжні квіти й спокійний, урочистий дизайн.", cta: "Зібрати в конструкторі", href: "pages/constructor.html" },
    babyshower: { title: "Торт на бебі-шауер", text: "Пастель, мінімалізм і бенто для гостей — легкий солодкий стіл без зайвого.", cta: "Подивитись бенто", href: "pages/bento.html" },
    anniversary: { title: "Торт на річницю", text: "Бенто з вашою датою чи маленька копія весільного торта — для двох.", cta: "Подивитись бенто", href: "pages/bento.html" },
    corporate: { title: "Торт на корпоратив", text: "Логотип компанії, капкейки й candy bar на всю команду.", cta: "Candy bar", href: "pages/desserts.html" },
    justbecause: { title: "Торт просто так", text: "Бенто з жартом чи компліментом — найкращий привід без приводу.", cta: "Подивитись бенто", href: "pages/bento.html" },
  };

  function toppers() {
    const area = $("#x-topper");
    if (!area) return;
    const slot = $("[data-topper-slot]", area);
    const burstHost = $(".x-topper__burst", area);
    const card = $(".x-board__card");
    const nameEl = $("[data-topper-name]");
    const textEl = $("[data-topper-text]");
    const hintEl = $("[data-topper-hint]");
    const cta = $("[data-topper-cta]");
    const defaults = { text: textEl.textContent, hint: hintEl.textContent, cta: cta.querySelector("span").textContent, href: cta.getAttribute("href") };
    const items = $$(".x-sticker", area);
    let current = null;
    let z = 10;

    const describe = (occ) => {
      const o = OCCASIONS[occ];
      nameEl.hidden = !o;
      nameEl.textContent = o ? o.title : "";
      textEl.textContent = o ? o.text : defaults.text;
      hintEl.textContent = o ? "інший привід? киньте інший стікер ↗" : defaults.hint;
      cta.querySelector("span").textContent = o ? o.cta : defaults.cta;
      cta.setAttribute("href", o ? o.href : defaults.href);
      card.classList.toggle("is-set", !!o);
      card.classList.remove("is-pop");
      void card.offsetWidth;
      card.classList.add("is-pop");
    };

    if (!hasLibs) {
      items.forEach((el) => el.dataset.occ && el.addEventListener("click", () => describe(el.dataset.occ)));
      return;
    }

    const restRotation = (el) => parseFloat(el.style.getPropertyValue("--r")) || 0;
    const centerOf = (r) => [r.left + r.width / 2, r.top + r.height / 2];
    const overSlot = (el) => {
      const s = slot.getBoundingClientRect();
      const [cx, cy] = centerOf(el.getBoundingClientRect());
      return cx > s.left - 40 && cx < s.right + 40 && cy > s.top - 40 && cy < s.bottom + 40;
    };

    const burst = (x, y) => {
      for (let i = 0; i < 28; i++) {
        const sp = document.createElement("i");
        sp.style.cssText = `left:${x}px;top:${y}px;background:${SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]}`;
        burstHost.appendChild(sp);
        const a = Math.random() * Math.PI * 2;
        const d = gsap.utils.random(60, 170);
        gsap.fromTo(sp, { x: 0, y: 0, rotation: gsap.utils.random(0, 180), scale: 0.4 }, {
          x: Math.cos(a) * d,
          y: Math.sin(a) * d * 0.7 + 60,
          rotation: "+=" + gsap.utils.random(-360, 360),
          scale: 1,
          opacity: 0,
          duration: reduce ? 0.4 : gsap.utils.random(0.9, 1.4),
          ease: "power2.out",
          onComplete: () => sp.remove(),
        });
      }
    };

    const sendHome = (el) => {
      el.classList.remove("is-top");
      gsap.to(el, { x: 0, y: 0, rotation: restRotation(el), scale: 1, duration: reduce ? 0.3 : 0.9, ease: "elastic.out(1, 0.5)" });
    };

    const place = (el) => {
      if (current && current !== el) sendHome(current);
      current = el;
      const s = slot.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const [sx, sy] = centerOf(s);
      const [cx, cy] = centerOf(r);
      el.classList.add("is-top");
      el.style.zIndex = ++z;
      gsap.to(el, { x: gsap.getProperty(el, "x") + sx - cx, y: gsap.getProperty(el, "y") + sy - cy, rotation: 0, scale: 1.12, duration: reduce ? 0.3 : 0.7, ease: "back.out(2)" });
      area.classList.add("is-set");
      const a = area.getBoundingClientRect();
      burst(sx - a.left, sy - a.top);
      describe(el.dataset.occ);
    };

    const clear = () => {
      current = null;
      area.classList.remove("is-set");
      describe(null);
    };

    gsap.set(items, { rotation: (i, el) => restRotation(el) });
    if (live) {
      gsap.from(items, {
        scale: 0,
        rotation: () => gsap.utils.random(-60, 60),
        duration: 1,
        stagger: 0.06,
        ease: "back.out(2)",
        scrollTrigger: { trigger: area, start: "top 75%" },
      });
    }

    items.forEach((el) => {
      const occ = el.dataset.occ;
      el.addEventListener("dragstart", (e) => e.preventDefault());
      // keyboard: Enter / Space on a sticker puts it on the cake
      el.addEventListener("click", (e) => {
        if (e.detail === 0 && occ) place(el);
      });
      el.addEventListener("pointerdown", (e) => {
        if (e.button > 0) return;
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
        let moved = 0;
        gsap.to(el, { scale: 1.12, duration: 0.3, ease: "power3.out" });

        const move = (ev) => {
          moved = Math.max(moved, Math.hypot(ev.clientX - startX, ev.clientY - startY));
          const nx = gsap.utils.clamp(minX, maxX, baseX + ev.clientX - startX);
          const ny = gsap.utils.clamp(minY, maxY, baseY + ev.clientY - startY);
          const tiltBy = gsap.utils.clamp(-20, 20, (ev.clientX - lastX) * 1.2);
          lastX = ev.clientX;
          gsap.to(el, { x: nx, y: ny, rotation: tiltBy, duration: 0.25, ease: "power3.out", overwrite: "auto" });
          if (occ) slot.classList.toggle("is-hot", overSlot(el));
        };
        const up = () => {
          el.classList.remove("is-drag");
          slot.classList.remove("is-hot");
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerup", up);
          el.removeEventListener("pointercancel", up);
          gsap.delayedCall(0.26, () => {
            if (occ && (moved < 6 || overSlot(el))) {
              place(el);
              return;
            }
            if (el === current) {
              el.classList.remove("is-top");
              clear();
            }
            gsap.to(el, { scale: 1, rotation: gsap.utils.random(-10, 10), duration: 0.9, ease: "elastic.out(1, 0.45)" });
          });
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
      });
    });
  }

  /* ───────── ⑯ Feed: 3D photo ring driven by scroll, drag and a slow idle spin ───────── */
  function ring() {
    const scene = $("#x-ring-scene");
    const ringEl = $("#x-ring");
    if (!scene || !ringEl) return;
    const figs = $$("figure", ringEl);
    const step = 360 / figs.length;
    let scrollA = 0;
    let dragA = 0;
    let idle = 0;
    let vel = 0;
    let dragging = false;
    let visible = !live;

    const render = () => {
      const a = scrollA + dragA + idle;
      ringEl.style.setProperty("--a", a.toFixed(2) + "deg");
      figs.forEach((f, i) => {
        const c = Math.cos(((i * step + a) * Math.PI) / 180);
        f.style.filter = `brightness(${(0.55 + 0.45 * (c + 1) / 2).toFixed(3)})`;
      });
    };
    render();

    scene.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a") || e.button > 0) return;
      dragging = true;
      scene.classList.add("is-drag");
      let lastX = e.clientX;
      const move = (ev) => {
        const d = (ev.clientX - lastX) * 0.28;
        lastX = ev.clientX;
        dragA += d;
        vel = d;
        if (!live) render();
      };
      const up = () => {
        dragging = false;
        scene.classList.remove("is-drag");
        removeEventListener("pointermove", move);
        removeEventListener("pointerup", up);
        removeEventListener("pointercancel", up);
      };
      addEventListener("pointermove", move);
      addEventListener("pointerup", up);
      addEventListener("pointercancel", up);
    });

    if (!live) return;
    ScrollTrigger.create({
      trigger: scene,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => { scrollA = -self.progress * 200; },
      onToggle: (self) => { visible = self.isActive; },
    });
    gsap.ticker.add(() => {
      if (!visible) return;
      if (!dragging) {
        dragA += vel;
        vel *= 0.94;
        idle -= 0.05;
      }
      render();
    });
  }

  /* ───────── ⑰ Stats: scalloped seals with odometer digits ───────── */
  function scallopPath(n = 22, R = 86) {
    const pt = (i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return `${(Math.cos(a) * R).toFixed(2)},${(Math.sin(a) * R).toFixed(2)}`;
    };
    const rb = (R * Math.sin(Math.PI / n)).toFixed(2);
    let d = `M${pt(0)}`;
    for (let i = 1; i <= n; i++) d += ` A${rb},${rb} 0 0 1 ${pt(i)}`;
    return d + " Z";
  }

  function seals() {
    const d = scallopPath();
    $$(".x-seal").forEach((seal) => {
      seal.insertAdjacentHTML("afterbegin", `<svg class="x-seal__edge" viewBox="-100 -100 200 200" aria-hidden="true"><path d="${d}"/></svg>`);
    });
    const cols = [];
    $$(".x-odo").forEach((el) => {
      const txt = Number(el.dataset.odo).toLocaleString("uk-UA");
      el.setAttribute("aria-label", txt);
      el.innerHTML = [...txt].map((ch) => {
        if (!/\d/.test(ch)) return '<span class="x-odo__sp" aria-hidden="true"></span>';
        const digits = "01234567890123456789".split("").map((n) => `<i>${n}</i>`).join("");
        return `<span class="x-odo__d" aria-hidden="true"><span class="x-odo__col" data-d="${ch}">${digits}</span></span>`;
      }).join("");
      cols.push(...$$(".x-odo__col", el));
    });
    const roll = () => cols.forEach((c, i) => {
      c.style.transitionDelay = (i * 0.07).toFixed(2) + "s";
      c.style.transform = `translateY(-${Number(c.dataset.d) + 10}em)`;
    });
    if (!live) {
      cols.forEach((c) => { c.style.transition = "none"; });
      roll();
      return;
    }
    const row = $(".x-stats__row");
    ScrollTrigger.create({ trigger: row, start: "top 80%", once: true, onEnter: roll });
    gsap.from(".x-seal", { scale: 0, rotation: -120, duration: 1.1, stagger: 0.1, ease: "back.out(1.7)", scrollTrigger: { trigger: row, start: "top 85%" } });
  }

  /* ───────── ⑱ FAQ as a Direct chat ───────── */
  function chat() {
    const host = $("#x-chat");
    if (!host || !window.MARIDAY?.faq) return;
    host.innerHTML = MARIDAY.faq.map((q, i) => `
      <div class="x-q">
        <button class="x-q__btn" type="button" aria-expanded="false" aria-controls="x-qa-${i}">
          <span class="x-q__n">${pad(i + 1)}</span><span>${q.q}</span><i class="x-q__icon" aria-hidden="true"></i>
        </button>
        <div class="x-q__a" id="x-qa-${i}" role="region">
          <div><div class="x-q__reply"><img src="img/ig-profile.jpg" alt=""><p class="x-q__bubble"><span class="x-q__typing" aria-hidden="true"><i></i><i></i><i></i></span><span class="x-q__msg">${q.a}</span></p></div></div>
        </div>
      </div>`).join("");

    const setOpen = (item, open, typing) => {
      const btn = $(".x-q__btn", item);
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      clearTimeout(item._t);
      item.classList.toggle("is-typing", open && typing);
      if (open && typing) item._t = setTimeout(() => item.classList.remove("is-typing"), 750);
      if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 700);
    };
    host.addEventListener("click", (e) => {
      const btn = e.target.closest(".x-q__btn");
      if (!btn) return;
      const item = btn.parentElement;
      setOpen(item, !item.classList.contains("is-open"), !reduce);
    });
    const first = $(".x-q", host);
    if (first) setOpen(first, true, false);
  }

  /* ───────── Footer wordmark ───────── */
  function footerWord() {
    const word = $(".footer-word");
    if (!word || !live) return;
    gsap.from($$("span", word), {
      yPercent: 110,
      rotation: (i) => (i % 2 ? 12 : -12),
      duration: 1.2,
      stagger: 0.06,
      ease: "expo.out",
      scrollTrigger: { trigger: word, start: "top 95%" },
    });
  }

  function init() {
    monthName();
    chat();
    seals();
    toppers();
    ring();
    road();
    cloche();
    footerWord();
    if (window.ScrollTrigger) addEventListener("load", () => ScrollTrigger.refresh());
  }

  MARIDAY.onReady(init);
})();
