/* Mariday home — order steps: one playable scene per step.
   Whatever the visitor does here (likes a cake, picks a flavour, sets guests, books a date)
   flies into the printer and is printed on the receipt. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const MONTHS = ["січень", "лютий", "березень", "квітень", "травень", "червень", "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"];
  const DAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "нд"];

  const FLAVORS = [
    { id: "pistachio-raspberry", name: "Фісташка–малина", short: "фісташка-малина", desc: "горіховий бісквіт · кремчиз з фісташкою · малинове конфі", c: { sp: "#c9d89a", cr: "#fbf6ea", fi: "#d8344f", fd: "#a3132e", tp: "#f6eadb", dc: "#d8344f" } },
    { id: "kinder", name: "Kinder Bueno", short: "kinder bueno", desc: "шоколадний бісквіт · фундучне праліне · вафельна крихта", c: { sp: "#6b3a22", cr: "#f4e6d0", fi: "#c08a52", fd: "#8a5530", tp: "#7a4428", dc: "#f4e6d0" } },
    { id: "snickers", name: "Снікерс", short: "снікерс", desc: "шоколадний бісквіт · м’яка карамель · смажений арахіс", c: { sp: "#5a2e1c", cr: "#f1dfc3", fi: "#d39a48", fd: "#9b6a2c", tp: "#4a2516", dc: "#d39a48" } },
    { id: "berry-forest", name: "Лісові ягоди", short: "лісові ягоди", desc: "шифон · кремчиз · малина, вишня, смородина", c: { sp: "#f3dca8", cr: "#fff8ef", fi: "#8c2245", fd: "#4d0f2a", tp: "#fffaf3", dc: "#6d1a3c" } },
    { id: "lemon-raspberry", name: "Малина–лимон", short: "малина-лимон", desc: "лимонний сироп · малинове конфі · лимонний гель", c: { sp: "#f7e38a", cr: "#fffaf0", fi: "#e8506a", fd: "#fbe36a", tp: "#fff4c2", dc: "#e8506a" } },
    { id: "banana-caramel", name: "Банан–карамель", short: "банан-карамель", desc: "банановий бісквіт · м’яка карамель · свіжий банан", c: { sp: "#f2d58e", cr: "#fff6e6", fi: "#c7853c", fd: "#f7e7a1", tp: "#e0a85a", dc: "#f7e7a1" } },
  ];

  window.MarScenes = function (sec, ctx) {
    const root = $("[data-scenes]", sec);
    if (!root) return null;
    const scenes = $$(".x-scene", root);
    const note = $("[data-scene-note]", root);
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

    // the order the visitor is assembling
    const order = {
      design: null,
      designImg: null,
      flavor: FLAVORS[0],
      guests: 14,
      kg: 2.5,
      date: null,
    };
    const fmtKg = (kg) => String(kg).replace(".", ",");
    const fmtDate = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;

    // something small flies on an arc from the scene into the printer slot, then the printer reacts
    const fly = (fromEl, html, after) => {
      const slot = $(".x-printer__slot", sec);
      if (!slot || !fromEl) return after && after();
      const a = fromEl.getBoundingClientRect();
      const b = slot.getBoundingClientRect();
      const el = document.createElement("span");
      el.className = "x-fly";
      el.innerHTML = html;
      document.body.appendChild(el);
      const x0 = a.left + a.width / 2;
      const y0 = a.top + a.height / 2;
      const x1 = b.left + b.width / 2;
      const y1 = b.top + 4;
      const peak = Math.min(y0, y1) - 120;
      const p = { t: 0 };
      gsap.to(p, {
        t: 1,
        duration: 0.85,
        ease: "power1.inOut",
        onUpdate: () => {
          const t = p.t;
          const x = x0 + (x1 - x0) * t;
          const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * peak + t * t * y1;
          gsap.set(el, { x, y, rotation: t * 300, scale: 1 - t * 0.55 });
        },
        onComplete: () => {
          el.remove();
          gsap.fromTo(".x-printer__body", { scaleY: 1 }, { scaleY: 0.94, duration: 0.09, yoyo: true, repeat: 1, transformOrigin: "50% 100%" });
          after && after();
        },
      });
    };

    /* ───── 01 · swipe deck ───── */
    const design = (() => {
      const el = scenes[0];
      const deck = $("[data-swipe]", el);
      const count = $("[data-swipe-count]", el);
      const cakes = ((window.MARIDAY && MARIDAY.cakes) || []).slice(0, 7);
      if (!cakes.length) return { enter() {} };
      deck.innerHTML = cakes.map((c) => `
        <figure class="x-swipe__card" data-name="${c.name}" data-img="${MARIDAY.img(c.img)}">
          <img src="${MARIDAY.img(c.img)}" alt="" loading="lazy" draggable="false">
          <figcaption><span>${(c.tags && c.tags[0]) || "торт"} · від ${c.price} €</span><b>${c.name}</b></figcaption>
          <b class="x-swipe__stamp x-swipe__stamp--yes">хочу ♥</b>
          <b class="x-swipe__stamp x-swipe__stamp--no">далі</b>
        </figure>`).join("");
      let cards = $$(".x-swipe__card", deck);
      let likes = 0;
      let busy = false;

      const layout = (anim) => {
        cards.forEach((c, k) => {
          const props = { x: 0, y: k * 9, scale: 1 - k * 0.045, rotation: k === 0 ? 0 : (k % 2 ? 3 : -3) * Math.min(k, 2), opacity: k < 4 ? 1 : 0, zIndex: cards.length - k };
          if (anim) gsap.to(c, { ...props, duration: 0.6, ease: "back.out(1.6)" });
          else gsap.set(c, props);
          gsap.set($(".x-swipe__stamp--yes", c), { opacity: 0 });
          gsap.set($(".x-swipe__stamp--no", c), { opacity: 0 });
        });
      };
      layout(false);

      const fling = (dir) => {
        if (busy) return;
        busy = true;
        const top = cards[0];
        gsap.set($(dir > 0 ? ".x-swipe__stamp--yes" : ".x-swipe__stamp--no", top), { opacity: 1 });
        if (dir > 0) {
          likes++;
          count.textContent = `♥ ${likes}`;
          gsap.fromTo(count, { scale: 1.6 }, { scale: 1, duration: 0.6, ease: "back.out(3)" });
          order.design = top.dataset.name;
          order.designImg = top.dataset.img;
          const r = root.getBoundingClientRect();
          const t = top.getBoundingClientRect();
          ctx.burst(t.left - r.left + t.width / 2, t.top - r.top + t.height / 2, 26);
          fly(top, "♥", () => {
            ctx.receipt("design", order.design);
            ctx.lcd("♥ ЗБЕРЕЖЕНО");
          });
        }
        gsap.to(top, {
          x: dir * 420,
          y: "+=50",
          rotation: dir * 32,
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            cards.push(cards.shift());
            gsap.set(top, { x: 0, y: cards.length * 9, rotation: 0, opacity: 0 });
            layout(true);
            busy = false;
          },
        });
      };

      // drag the top card
      let drag = null;
      deck.addEventListener("pointerdown", (e) => {
        const top = cards[0];
        if (busy || !top.contains(e.target)) return;
        drag = { x: e.clientX, y: e.clientY, dx: 0, id: e.pointerId };
        top.setPointerCapture(e.pointerId);
        gsap.killTweensOf(top);
      });
      deck.addEventListener("pointermove", (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const top = cards[0];
        drag.dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        gsap.set(top, { x: drag.dx, y: dy * 0.35, rotation: drag.dx / 9 });
        gsap.set($(".x-swipe__stamp--yes", top), { opacity: gsap.utils.clamp(0, 1, drag.dx / 80) });
        gsap.set($(".x-swipe__stamp--no", top), { opacity: gsap.utils.clamp(0, 1, -drag.dx / 80) });
      });
      const release = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = drag.dx;
        drag = null;
        if (Math.abs(dx) > 80) fling(Math.sign(dx));
        else layout(true);
      };
      deck.addEventListener("pointerup", release);
      deck.addEventListener("pointercancel", release);
      $("[data-swipe-yes]", el).addEventListener("click", () => fling(1));
      $("[data-swipe-no]", el).addEventListener("click", () => fling(-1));

      return {
        enter() {
          gsap.fromTo(cards.slice(0, 4), { y: 260, rotation: () => gsap.utils.random(-25, 25), opacity: 0 }, {
            y: (k) => k * 9,
            rotation: (k) => (k === 0 ? 0 : (k % 2 ? 3 : -3) * Math.min(k, 2)),
            opacity: 1,
            duration: 0.8,
            stagger: { each: 0.08, from: "end" },
            ease: "back.out(1.4)",
            delay: 0.25,
          });
          // the top card teases a swipe so people know it moves
          gsap.timeline({ delay: 1.3 })
            .to(cards[0], { x: 46, rotation: 6, duration: 0.35, ease: "power2.out" })
            .to($(".x-swipe__stamp--yes", cards[0]), { opacity: 0.8, duration: 0.2 }, "<")
            .to(cards[0], { x: 0, rotation: 0, duration: 0.7, ease: "elastic.out(1, 0.45)" })
            .to($(".x-swipe__stamp--yes", cards[0]), { opacity: 0, duration: 0.2 }, "<");
        },
      };
    })();

    /* ───── 02 · slice builder ───── */
    const flavor = (() => {
      const el = scenes[1];
      const chips = $("[data-chips]", el);
      const desc = $("[data-slice-desc]", el);
      const layers = $$(".x-slice__l", el).reverse(); // bottom first
      const deco = $$(".x-slice__deco i", el);
      chips.innerHTML = FLAVORS.map((f, i) => `<button type="button" class="x-chip" role="radio" aria-checked="${i === 0}" data-i="${i}" style="--a:${f.c.sp};--b:${f.c.fi}"><i></i>${f.name}</button>`).join("");

      const paint = (f) => {
        Object.entries(f.c).forEach(([k, v]) => el.style.setProperty(`--${k}`, v));
        desc.textContent = f.desc;
      };
      paint(order.flavor);

      const build = () => {
        gsap.killTweensOf([...layers, ...deco]);
        gsap.fromTo(layers, { y: -320, opacity: 0, scaleY: 1 }, {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.075,
          ease: "bounce.out",
        });
        gsap.fromTo(deco, { y: -200, scale: 0.4, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.8, stagger: 0.09, ease: "back.out(3)", delay: layers.length * 0.075 + 0.25 });
      };

      chips.addEventListener("click", (e) => {
        const b = e.target.closest(".x-chip");
        if (!b) return;
        const f = FLAVORS[+b.dataset.i];
        $$(".x-chip", chips).forEach((c) => c.setAttribute("aria-checked", c === b ? "true" : "false"));
        if (f === order.flavor) return;
        order.flavor = f;
        paint(f);
        build();
        fly(b, `<i style="width:16px;height:16px;border-radius:50%;background:conic-gradient(${f.c.sp} 0 50%, ${f.c.fi} 0)"></i>`, () => {
          ctx.receipt("flavor", f.short);
          ctx.lcd("СМАК ✓");
        });
      });

      return { enter: () => gsap.delayedCall(0.2, build) };
    })();

    /* ───── 03 · guests → kg ───── */
    const weight = (() => {
      const el = scenes[2];
      const input = $("[data-guests]", el);
      const out = $("[data-guests-out]", el);
      const kgEl = $("[data-kg]", el);
      const sizeEl = $("[data-kg-size]", el);
      const cake = $("[data-kg-cake]", el);
      const tiers = $$(".x-kg__tier", el);
      const plates = $("[data-plates]", el);
      const sizes = (window.MARIDAY && MARIDAY.sizes) || [];
      const shownKg = { v: 2.5 };
      let printed = null;

      const pick = (g) => {
        const need = g * 0.175;
        const s = sizes.find((x) => x.id !== "tier" && parseFloat(x.id) >= need) || sizes.find((x) => x.id === "tier");
        const kg = s && s.id !== "tier" ? parseFloat(s.id) : Math.max(5, Math.ceil(need * 2) / 2);
        return { kg, tier: !s || s.id === "tier", label: s ? s.label : "", serves: s ? s.serves : "" };
      };

      const set = (g, fromUser) => {
        g = Math.round(g);
        order.guests = g;
        out.textContent = g;
        input.value = g;
        input.style.setProperty("--p", `${((g - input.min) / (input.max - input.min)) * 100}%`);
        const r = pick(g);
        if (r.kg !== order.kg || !kgEl.dataset.ok) {
          kgEl.dataset.ok = 1;
          gsap.to(shownKg, { v: r.kg, duration: 0.5, ease: "power2.out", onUpdate: () => { kgEl.textContent = fmtKg(Math.round(shownKg.v * 10) / 10); } });
          gsap.fromTo(kgEl, { scale: 1.15 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
        }
        order.kg = r.kg;
        sizeEl.textContent = r.tier ? "ярусний торт ✦" : `${r.serves}`;
        const nTiers = r.tier ? 3 : r.kg >= 3 ? 2 : 1;
        tiers.forEach((t) => t.classList.toggle("is-on", +t.dataset.t <= nTiers));
        cake.style.setProperty("--w", `${Math.min(240, 140 + r.kg * 20)}px`);
        // one plate per guest
        const have = plates.children.length;
        if (g > have) {
          const add = [];
          for (let i = have; i < g; i++) {
            const p = document.createElement("i");
            plates.appendChild(p);
            add.push(p);
          }
          gsap.from(add, { scale: 0, rotation: -120, duration: 0.4, stagger: 0.012, ease: "back.out(3)" });
        } else {
          [...plates.children].slice(g).forEach((p) => p.remove());
        }
        if (fromUser) {
          clearTimeout(set.t);
          set.t = setTimeout(() => {
            const key = `${g}/${r.kg}`;
            if (key === printed) return;
            printed = key;
            fly(input, "⚖", () => {
              ctx.receipt("weight", `${g} гостей · ${fmtKg(r.kg)} кг`);
              ctx.lcd(`${fmtKg(r.kg)} КГ ✓`);
            });
          }, 650);
        }
      };
      set(order.guests);
      input.addEventListener("input", () => set(+input.value, true));

      return {
        enter() {
          // the slider glides by itself once, as a hint that it's alive
          const v = { g: 4 };
          set(4);
          gsap.to(v, { g: order.guests > 4 ? order.guests : 14, duration: 1.4, delay: 0.35, ease: "power2.inOut", onUpdate: () => set(v.g) });
        },
      };
    })();

    /* ───── 04 · chat ───── */
    const chat = (() => {
      const el = scenes[3];
      const log = $("[data-chat-log]", el);
      const field = $("[data-chat-field]", el);
      const send = $("[data-chat-send]", el);
      let tl = null;
      const now = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

      const bubble = (side, html, cls = "") => {
        const m = document.createElement("div");
        m.className = `x-msg x-msg--${side} ${cls}`;
        m.innerHTML = html + (cls.includes("typing") ? "" : `<time>${now()}</time>`);
        log.appendChild(m);
        while (log.children.length > 5) log.firstElementChild.remove();
        gsap.from(m, { scale: 0.5, opacity: 0, y: 16, transformOrigin: side === "out" ? "100% 100%" : "0 100%", duration: 0.5, ease: "back.out(2)" });
        return m;
      };

      const plane = () => {
        const svg = $("svg", send).cloneNode(true);
        const r = send.getBoundingClientRect();
        const s = sec.getBoundingClientRect();
        svg.style.cssText = `position:absolute;z-index:40;left:${r.left - s.left + 11}px;top:${r.top - s.top + 11}px;width:20px;height:20px;fill:none;stroke:var(--cherry);stroke-width:2;pointer-events:none`;
        sec.appendChild(svg);
        gsap.to(svg, { x: 180, y: -260, rotation: -20, scale: 2.2, opacity: 0, duration: 1.1, ease: "power2.in", onComplete: () => svg.remove() });
      };

      const text = () => {
        const parts = [`Привіт! Хочу торт${order.design ? ` «${order.design}»` : ""}`, order.flavor.short, `${fmtKg(order.kg)} кг на ${order.guests} гостей`];
        if (order.date) parts.push(`на ${fmtDate(order.date)}`);
        return parts.join(", ") + " ♥";
      };

      const play = () => {
        if (tl) tl.kill();
        log.innerHTML = "";
        field.textContent = "";
        const msg = text();
        const typed = { n: 0 };
        let out;
        let typing;
        tl = gsap.timeline({ delay: 0.3 })
          .add(() => field.classList.add("is-typing"))
          .to(typed, { n: msg.length, duration: Math.min(2.2, msg.length * 0.03), ease: "none", onUpdate: () => { field.textContent = msg.slice(0, Math.round(typed.n)); } })
          .add(() => { field.classList.remove("is-typing"); send.classList.add("is-ready"); }, "+=0.15")
          .add(() => {
            send.classList.remove("is-ready");
            plane();
            field.textContent = "";
            out = bubble("out", esc(msg));
          }, "+=0.45")
          .add(() => {
            if (order.designImg) bubble("out", `<img src="${order.designImg}" alt="">`, "x-msg--photo");
          }, "+=0.35")
          .add(() => { out.classList.add("is-read"); typing = bubble("in", "<i></i><i></i><i></i>", "x-msg--typing"); }, "+=0.5")
          .add(() => {
            typing.remove();
            bubble("in", "Вітаю! ♥ Все записала. Зараз надішлю деталі й передоплату ✦");
            ctx.receipt("request", "надіслано у WhatsApp ✓✓");
            ctx.lcd("НАДІСЛАНО ✓✓");
          }, "+=1.3");
      };

      $("[data-chat-replay]", el).addEventListener("click", play);
      send.addEventListener("click", play);
      return { enter: play, leave: () => tl && tl.pause() };
    })();

    /* ───── 05 · calendar + wax seal ───── */
    const calendar = (() => {
      const el = scenes[4];
      const cal = $("[data-cal]", el);
      const grid = $("[data-cal-grid]", el);
      const month = $("[data-cal-month]", el);
      const ring = $("[data-cal-ring]", el);
      const ringPath = $("path", ring);
      const seal = $("[data-seal]", el);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const min = new Date(today);
      min.setDate(min.getDate() + 5);
      const def = new Date(today);
      def.setDate(def.getDate() + 12);
      order.date = def;
      const y = def.getFullYear();
      const m = def.getMonth();
      const len = ringPath.getTotalLength ? ringPath.getTotalLength() : 160;
      gsap.set(ringPath, { strokeDasharray: len, strokeDashoffset: len });

      month.innerHTML = `${MONTHS[m]} ${y}<small>оберіть день</small>`;
      const first = (new Date(y, m, 1).getDay() + 6) % 7;
      const days = new Date(y, m + 1, 0).getDate();
      let html = DAYS.map((d) => `<span>${d}</span>`).join("");
      for (let i = 0; i < first; i++) html += "<i></i>";
      for (let d = 1; d <= days; d++) {
        const dt = new Date(y, m, d);
        html += `<button type="button" data-d="${d}" ${dt < min ? "disabled" : ""} aria-label="${d} ${MONTHS[m]}">${d}</button>`;
      }
      grid.innerHTML = html;

      const place = (btn, draw) => {
        $$("button.is-pick", grid).forEach((b) => b.classList.remove("is-pick"));
        btn.classList.add("is-pick");
        const c = cal.getBoundingClientRect();
        const b = btn.getBoundingClientRect();
        ring.style.left = `${b.left - c.left + b.width / 2 - 24}px`;
        ring.style.top = `${b.top - c.top + b.height / 2 - 20}px`;
        ring.style.opacity = 1;
        if (draw) {
          gsap.fromTo(ringPath, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out", delay: 0.1 });
          stamp();
        }
      };

      const stamp = () => {
        gsap.killTweensOf(seal);
        gsap.timeline({ delay: 0.55 })
          .fromTo(seal, { opacity: 0, scale: 2.6, rotation: 25 }, { opacity: 1, scale: 1, rotation: -12, duration: 0.42, ease: "power4.in" })
          .to(el, { x: 3, y: 2, duration: 0.05, yoyo: true, repeat: 3 })
          .add(() => {
            const r = root.getBoundingClientRect();
            const s = seal.getBoundingClientRect();
            ctx.burst(s.left - r.left + s.width / 2, s.top - r.top + s.height / 2, 18, 0.7);
          }, "<");
      };

      grid.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b || b.disabled) return;
        order.date = new Date(y, m, +b.dataset.d);
        place(b, true);
        fly(b, "✦", () => {
          ctx.receipt("date", `${fmtDate(order.date)} · 50% ✓`);
          ctx.lcd(`ДАТА ${fmtDate(order.date)}`);
        });
      });

      return {
        enter() {
          gsap.from($$("button", grid), { scale: 0, opacity: 0, duration: 0.4, stagger: { each: 0.012 }, ease: "back.out(2)" });
          gsap.delayedCall(0.6, () => {
            const b = $(`button[data-d="${order.date.getDate()}"]`, grid);
            if (b) place(b, true);
          });
        },
        reflow() {
          const b = $("button.is-pick", grid);
          if (b) place(b, false);
        },
      };
    })();

    /* ───── 06 · blow the candles ───── */
    const party = (() => {
      const el = scenes[5];
      const candles = $$(".x-candle", el);
      const cakeEl = $("[data-party]", el);
      let celebrated = false;

      const smoke = (c) => {
        const r = el.getBoundingClientRect();
        const b = c.getBoundingClientRect();
        for (let i = 0; i < 4; i++) {
          const s = document.createElement("i");
          s.className = "x-party__smoke";
          s.style.left = `${b.left - r.left + b.width / 2 - 5}px`;
          s.style.top = `${b.top - r.top + 10}px`;
          el.appendChild(s);
          gsap.to(s, { y: -70 - i * 12, x: gsap.utils.random(-18, 18), scale: 2.4, opacity: 0, duration: 1.4, delay: i * 0.1, ease: "power1.out", onComplete: () => s.remove() });
        }
      };

      const blow = (c) => {
        if (c.classList.contains("is-out")) return;
        c.classList.add("is-out");
        smoke(c);
        if (candles.every((x) => x.classList.contains("is-out")) && !celebrated) {
          celebrated = true;
          el.classList.add("is-out");
          const r = root.getBoundingClientRect();
          const k = cakeEl.getBoundingClientRect();
          ctx.burst(k.left - r.left + k.width / 2, k.top - r.top + k.height * 0.4, 60, 1.6);
          gsap.delayedCall(0.35, () => ctx.burst(k.left - r.left + k.width / 2, k.top - r.top, 40, 1.2));
          ctx.receipt("party", "бажання загадано ✦");
          ctx.lcd("З СВЯТОМ ♥");
        }
      };

      candles.forEach((c) => {
        c.addEventListener("click", () => blow(c));
        if (fine) c.addEventListener("pointerenter", () => blow(c));
      });
      // touch: a swipe across the flames blows them too
      cakeEl.addEventListener("pointermove", (e) => {
        if (e.pointerType === "mouse") return;
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const c = hit && hit.closest(".x-candle");
        if (c) blow(c);
      });
      const relight = () => {
        celebrated = false;
        el.classList.remove("is-out");
        candles.forEach((c, i) => setTimeout(() => c.classList.remove("is-out"), i * 120));
      };
      $("[data-party-again]", el).addEventListener("click", relight);

      return {
        enter() {
          relight();
          gsap.from(cakeEl, { y: 120, opacity: 0, duration: 0.9, ease: "back.out(1.6)", delay: 0.2 });
        },
      };
    })();

    const parts = [design, flavor, weight, chat, calendar, party];
    let cur = -1;

    function show(i, dir = 1) {
      if (i === cur) return;
      const prev = scenes[cur];
      const next = scenes[i];
      if (parts[cur] && parts[cur].leave) parts[cur].leave();
      if (prev) {
        gsap.killTweensOf(prev);
        gsap.to(prev, {
          x: 160 * dir,
          y: -40,
          rotation: 14 * dir,
          rotationY: -30 * dir,
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => prev.classList.remove("is-on"),
        });
      }
      cur = i;
      next.classList.add("is-on");
      gsap.killTweensOf(next);
      gsap.fromTo(next, { x: -120 * dir, y: 90, rotation: -10 * dir, rotationY: 25 * dir, opacity: 0 }, { x: 0, y: 0, rotation: i % 2 ? 2.5 : -2.5, rotationY: 0, opacity: 1, duration: 1, delay: prev ? 0.2 : 0, ease: "back.out(1.5)" });
      if (parts[i] && parts[i].enter) parts[i].enter();
      const card = $$(".x-tstep", sec)[i];
      if (note && card) {
        gsap.timeline()
          .to(note, { scale: 0.6, opacity: 0, duration: 0.2 })
          .add(() => { note.textContent = card.dataset.note; })
          .to(note, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(3)" });
      }
    }

    scenes.forEach((s) => s.classList.remove("is-on"));
    return { show, order, reflow: () => calendar.reflow && calendar.reflow() };
  };
})();
