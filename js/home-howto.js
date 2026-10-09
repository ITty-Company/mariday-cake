/* Mariday home — how to order: six-step intro + a ticket printer that prints the order as you scroll */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const hasLibs = !!(window.gsap && window.ScrollTrigger);
  const live = hasLibs && !!window.Lenis && !reduce;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const SPRINKLE_COLORS = ["#6d0809", "#f5bcc8", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff", "#9ed9b8"];

  function burst(host, x, y, count = 30, spread = 1) {
    if (!hasLibs || reduce) return;
    for (let i = 0; i < count; i++) {
      const sp = document.createElement("i");
      sp.style.cssText = `left:${x}px;top:${y}px;background:${SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]}`;
      host.appendChild(sp);
      const a = Math.random() * Math.PI * 2;
      const d = gsap.utils.random(70, 200) * spread;
      gsap.fromTo(sp, { x: 0, y: 0, rotation: gsap.utils.random(0, 180), scale: 0.4 }, {
        x: Math.cos(a) * d,
        y: Math.sin(a) * d * 0.75 + 70,
        rotation: "+=" + gsap.utils.random(-400, 400),
        scale: 1,
        opacity: 0,
        duration: gsap.utils.random(0.9, 1.5),
        ease: "power2.out",
        onComplete: () => sp.remove(),
      });
    }
  }

  // wrap every word (or char) of a text node tree in spans, keeping inline tags like <em>
  function split(el, cls, byChar) {
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          const parts = byChar ? [...n.textContent] : n.textContent.split(/(\s+)/);
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const s = document.createElement("span");
            s.className = cls;
            s.textContent = part;
            frag.appendChild(s);
            out.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(el);
    return out;
  }

  /* ───────── ⑩ Як зробити замовлення? ───────── */
  function how() {
    const sec = $(".x-how");
    if (!sec) return;
    const script = $("[data-jelly]", sec);
    // outer span is animated by GSAP, the inner one does the CSS hover jelly
    const letters = split(script, "x-how__lt", true);
    letters.forEach((s) => { s.innerHTML = `<span>${s.textContent}</span>`; });

    // every stop rolls the page down to that step of the printer
    $$("[data-goto]", sec).forEach((btn) => btn.addEventListener("click", () => {
      const k = +btn.dataset.goto;
      const nav = $(`.x-ticket.is-live .x-ticket__nav [data-step="${k}"]`);
      if (nav) nav.click();
      else $$(".x-tstep")[k]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }));

    const road = road_(sec);

    if (!live) {
      road.stops.forEach((s) => s.classList.add("is-on"));
      return;
    }
    sec.classList.add("is-live");

    // sprinkles scattered around the edges, drifting at different depths while the section scrolls by
    const SPRINKLES = [[5, 14, -30], [12, 84, 40], [24, 92, -60], [41, 10, 20], [49, 88, 75], [58, 22, -15], [66, 94, 50], [79, 8, -45], [94, 62, 30], [3, 50, 65], [90, 26, 10], [46, 60, -70]];
    const host = document.createElement("div");
    host.className = "x-how__sprinkles";
    host.setAttribute("aria-hidden", "true");
    sec.prepend(host);
    const drift = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    SPRINKLES.forEach(([x, y, r], i) => {
      const sp = document.createElement("i");
      sp.style.cssText = `left:${x}%;top:${y}%;background:${SPRINKLE_COLORS[1 + (i % (SPRINKLE_COLORS.length - 1))]};opacity:${0.45 + (i % 3) * 0.2}`;
      host.appendChild(sp);
      gsap.set(sp, { rotation: r, scale: 0.8 + (i % 3) * 0.25 });
      drift.fromTo(sp, { y: 60 + (i % 4) * 50 }, { y: -60 - (i % 4) * 50, rotation: r + (i % 2 ? 90 : -90), ease: "none" }, 0);
    });

    // headline rises softly, the swash is piped under the script word
    const l1 = split($(".x-how__l1", sec), "x-how__ch", true);
    const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 65%", once: true } });
    tl.from(l1, { yPercent: 60, opacity: 0, duration: 0.8, stagger: 0.025, ease: "expo.out" })
      .from(letters, { yPercent: 40, opacity: 0, duration: 0.8, stagger: 0.035, ease: "expo.out" }, 0.2)
      .from(".x-how__sub, .x-how__cta", { y: 16, opacity: 0, duration: 0.9, stagger: 0.12, ease: "expo.out" }, 0.45)
      .fromTo(".x-how__sub mark", { backgroundSize: "0% 0.42em" }, { backgroundSize: "100% 0.42em", duration: 0.8, ease: "power2.inOut" }, 1.1)
      .fromTo(".x-how__swash path", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, 0.95);

    // the stops pop up as the road comes into view
    gsap.from(road.stops.map((s) => $("button", s)), { scale: 0, rotation: -60, duration: 0.8, stagger: 0.08, ease: "back.out(2)", clearProps: "transform", scrollTrigger: { trigger: road.el, start: "top 85%", once: true } });

    // then scrolling pipes the cream along the road and rolls the cherry from stop to stop
    const st = { p: 0 };
    gsap.to(st, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: road.el, start: "top 80%", end: "bottom 85%", scrub: 0.8 },
      onUpdate: () => road.set(st.p),
    });
    road.set(0);
  }

  // builds a smooth cream path through the centres of the stops (re-measured on resize) and places the cherry on it
  function road_(sec) {
    const el = $("[data-road]", sec);
    const svg = $(".x-how__path", el);
    const paths = $$("path", svg);
    const cream = $(".x-how__path-cream", svg);
    const cherry = $(".x-how__cherry", el);
    const stops = $$(".x-how__stop", el);
    const phone = matchMedia("(max-width: 760px)");
    let len = 0, marks = [], p = 1, reached = -1, popped = false;

    const build = () => {
      const box = el.getBoundingClientRect();
      const pts = stops.map((s) => {
        const r = s.getBoundingClientRect();
        return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
      });
      const tail = sec.getBoundingClientRect().bottom - box.top; // the road runs off the bottom, into the printer
      const f = (n) => n.toFixed(1);
      let d;
      if (phone.matches) {
        // a vertical trail that wiggles left and right between the stops
        const [x0, y0] = pts[0];
        d = `M${f(x0)},${f(y0 - 70)} L${f(x0)},${f(y0)}`;
        for (let i = 1; i < pts.length; i++) {
          const [ax, ay] = pts[i - 1], [bx, by] = pts[i], w = (i % 2 ? 1 : -1) * 34, dy = by - ay;
          d += ` C${f(ax + w)},${f(ay + dy * 0.35)} ${f(bx + w)},${f(by - dy * 0.35)} ${f(bx)},${f(by)}`;
        }
        const [lx, ly] = pts[pts.length - 1];
        d += ` C${f(lx - 30)},${f(ly + 50)} ${f(lx)},${f(tail - 40)} ${f(lx)},${f(tail + 10)}`;
      } else {
        // a horizontal wave: flat at every stop, so the labels outside the wave stay clear
        const [x0, y0] = pts[0];
        d = `M${f(Math.min(-20, x0 - 120))},${f(y0)} L${f(x0)},${f(y0)}`;
        for (let i = 1; i < pts.length; i++) {
          const [ax, ay] = pts[i - 1], [bx, by] = pts[i], h = (bx - ax) * 0.5;
          d += ` C${f(ax + h)},${f(ay)} ${f(bx - h)},${f(by)} ${f(bx)},${f(by)}`;
        }
        const [lx, ly] = pts[pts.length - 1], w = el.clientWidth;
        const ex = Math.min(lx + 70, w + 40);
        d += ` C${f(ex)},${f(ly)} ${f(ex)},${f((ly + tail) / 2)} ${f(ex)},${f(tail + 10)}`;
      }
      paths.forEach((pa) => pa.setAttribute("d", d));
      len = cream.getTotalLength();
      cream.style.strokeDasharray = `${len} ${len}`;
      // where along the path each stop sits
      const N = 600, samples = [];
      for (let k = 0; k <= N; k++) samples.push(cream.getPointAtLength((len * k) / N));
      marks = pts.map(([x, y]) => {
        let best = 0, bd = Infinity;
        samples.forEach((q, k) => { const dd = (q.x - x) ** 2 + (q.y - y) ** 2; if (dd < bd) { bd = dd; best = k; } });
        return best / N;
      });
      el.classList.add("is-drawn");
      set(p);
    };

    const set = (np) => {
      p = np;
      if (!len) return;
      const at = len * p;
      cream.style.strokeDashoffset = len - at;
      const q = cream.getPointAtLength(at);
      const q2 = cream.getPointAtLength(Math.min(len, at + 2));
      const ang = (Math.atan2(q2.y - q.y, q2.x - q.x) * 180) / Math.PI;
      // the cherry tilts with the slope of the road and bobs a little as it rolls
      cherry.style.transform = `translate(${q.x}px, ${q.y}px) rotate(${phone.matches ? 0 : ang * 0.45}deg) translateY(${Math.sin(at / 18) * 2}px)`;
      cherry.style.opacity = p > 0.985 ? Math.max(0, (1 - p) / 0.015) : 1;
      let r = -1;
      marks.forEach((m, i) => { if (p >= m - 0.004) r = i; });
      if (r !== reached) {
        stops.forEach((s, i) => { s.classList.toggle("is-on", i <= r); s.classList.toggle("is-here", i === r); });
        if (r > reached && r >= 0 && hasLibs && !reduce) {
          gsap.fromTo($("button", stops[r]), { scale: 1.25 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)", clearProps: "transform" });
          if (r === stops.length - 1 && !popped) {
            popped = true;
            const sb = stops[r].getBoundingClientRect(), hb = burstHost.getBoundingClientRect();
            burst(burstHost, sb.left + sb.width / 2 - hb.left, sb.top + sb.height / 2 - hb.top, 34);
          }
        }
        reached = r;
      }
    };

    const burstHost = document.createElement("div");
    burstHost.className = "x-ticket__burst";
    burstHost.setAttribute("aria-hidden", "true");
    sec.appendChild(burstHost);

    build();
    let raf = 0;
    const rebuild = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(build); };
    if (window.ResizeObserver) new ResizeObserver(rebuild).observe(el);
    else addEventListener("resize", rebuild);
    document.fonts?.ready.then(rebuild);
    addEventListener("load", rebuild);
    return { el, stops, set };
  }

  /* ───────── ⑪ The ticket printer ───────── */
  function ticket() {
    const sec = $(".x-ticket");
    if (!sec) return;
    const pin = $(".x-ticket__pin", sec);
    const cards = $$(".x-tstep", sec);
    const btns = $$(".x-ticket__nav button", sec);
    const receipt = $(".x-receipt", sec);
    const lines = $$(".x-receipt__lines li", sec);
    const head = $(".x-receipt__head", sec);
    const lcd = $("[data-ticket-lcd]", sec);
    const nums = $$(".x-tstep__n", sec);
    const sceneHost = $("[data-scenes]", sec);
    const stamp = $(".x-receipt__stamp", sec);
    const burstHost = $(".x-ticket__burst", sec);
    const n = cards.length;

    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
    $("[data-ticket-no]", sec).textContent = String(1000 + ((dayOfYear * 37) % 9000)).padStart(4, "0");
    $("[data-ticket-date]", sec).textContent = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;

    if (!live) {
      lines.forEach((li) => li.classList.add("is-on"));
      sec.classList.add("is-complete");
      lcd.textContent = "ГОТОВО ✓";
      return;
    }
    sec.classList.add("is-live");
    pin.appendChild(burstHost);

    // every step floods the pin with its own colour, starting from the scene card
    const WASH = ["#dbefed", "#fbe4ea", "#fdf0d4", "#e0ebf8", "#eee5f5", "#f9dce3"];
    const wash = document.createElement("div");
    wash.className = "x-ticket__wash";
    wash.setAttribute("aria-hidden", "true");
    pin.prepend(wash);
    let washColor = WASH[0];
    const flood = (color) => {
      if (color === washColor) return;
      washColor = color;
      const p = pin.getBoundingClientRect();
      const r = (sceneHost && sceneHost.offsetParent ? sceneHost : $(".x-printer", sec)).getBoundingClientRect();
      const at = `${r.left - p.left + r.width / 2}px ${r.top - p.top + r.height / 2}px`;
      const layer = document.createElement("i");
      layer.style.background = color;
      wash.appendChild(layer);
      gsap.fromTo(layer, { clipPath: `circle(0% at ${at})` }, {
        clipPath: `circle(150% at ${at})`,
        duration: 1.1,
        ease: "power3.inOut",
        onComplete: () => {
          wash.style.background = color;
          [...wash.children].forEach((c) => c !== layer && c.remove());
          layer.remove();
        },
      });
    };

    // the LCD flashes whatever the visitor just did, then goes back to the step counter
    let lcdHold = 0;
    const lcdFlash = (msg) => {
      lcd.textContent = msg;
      clearTimeout(lcdHold);
      lcdHold = setTimeout(() => { lcdHold = 0; paintNav(); }, 1600);
      gsap.fromTo(".x-printer__led", { scale: 2.2 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
    };

    // receipt lines are rewritten with the visitor's choices
    const receiptSet = (key, text) => {
      const el = $(`[data-r="${key}"]`, sec);
      if (!el || el.textContent === text) return;
      el.textContent = text;
      const li = el.closest("li");
      gsap.fromTo(li, { backgroundColor: "rgba(226, 132, 154, 0.75)" }, { backgroundColor: "rgba(226, 132, 154, 0)", duration: 1.2, clearProps: "backgroundColor" });
    };

    const scenes = window.MarScenes
      ? window.MarScenes(sec, {
        burst: (x, y, count, spread) => burst(sceneHost, x, y, count, spread),
        lcd: lcdFlash,
        receipt: receiptSet,
      })
      : null;

    // timeline of the paper: header, then one slot per step, then the footer, then the stamp
    const HEAD = 0.07;
    const FOOT = 0.88;
    const DONE = 0.95;
    const seg = (FOOT - HEAD) / n;
    let H = 0;
    let marks = [];

    const measure = () => {
      H = receipt.offsetHeight;
      const bottomOf = (el) => el.offsetTop + el.offsetHeight;
      marks = [bottomOf(head) + 4, ...lines.map((li) => bottomOf(li) + 2), H];
      render();
    };

    // how much paper is out of the slot at progress p
    const shown = (p) => {
      if (p <= HEAD) return gsap.utils.interpolate(0, marks[0], p / HEAD);
      if (p >= FOOT) return gsap.utils.interpolate(marks[n], marks[n + 1], Math.min(1, (p - FOOT) / (DONE - FOOT)));
      const k = Math.min(n - 1, Math.floor((p - HEAD) / seg));
      const t = gsap.utils.clamp(0, 1, ((p - HEAD) / seg - k) / 0.55);
      return gsap.utils.interpolate(marks[k], marks[k + 1], gsap.parseEase("power2.inOut")(t));
    };
    const stepAt = (p) => gsap.utils.clamp(0, n - 1, Math.floor((p - HEAD) / seg));

    let cur = 0;
    let complete = false;
    let lastY = null;
    let idle;
    const state = { p: 0 };

    const setStep = (i) => {
      if (i === cur) return;
      const dir = i > cur ? 1 : -1;
      cards.forEach((c, k) => {
        c.classList.toggle("was-on", k === cur);
        c.classList.toggle("is-on", k === i);
      });
      cur = i;
      if (scenes) scenes.show(i, dir);
      flood(complete ? WASH[0] : WASH[i]);
      paintNav();
    };

    const paintNav = () => {
      btns.forEach((b, k) => {
        b.classList.toggle("is-on", k === cur && !complete);
        b.classList.toggle("is-done", k < cur || complete);
        b.setAttribute("aria-current", k === cur ? "step" : "false");
      });
      lines.forEach((li, k) => li.classList.toggle("is-cur", k === cur && !complete));
      if (!lcdHold) lcd.textContent = complete ? "ГОТОВО ✓" : `КРОК ${pad(cur + 1)}/${pad(n)}`;
    };

    const setComplete = (on) => {
      if (on === complete) return;
      complete = on;
      sec.classList.toggle("is-complete", on);
      flood(on ? WASH[0] : WASH[cur]);
      paintNav();
      if (on) {
        gsap.delayedCall(0.3, () => {
          if (!complete) return;
          const p = pin.getBoundingClientRect();
          const s = stamp.getBoundingClientRect();
          burst(burstHost, s.left - p.left + s.width / 2, s.top - p.top + s.height / 2, 40, 1.3);
          gsap.fromTo(".x-printer", { y: 0 }, { y: 6, duration: 0.08, yoyo: true, repeat: 3, ease: "power1.inOut" });
        });
      }
    };

    const render = () => {
      if (!H) return;
      const p = state.p;
      const out = shown(p);
      const y = H - out;
      receipt.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      if (lastY !== null && Math.abs(y - lastY) > 0.4) {
        sec.classList.add("is-printing");
        clearTimeout(idle);
        idle = setTimeout(() => sec.classList.remove("is-printing"), 140);
      }
      lastY = y;
      lines.forEach((li, k) => li.classList.toggle("is-on", out >= marks[k + 1] - 6));
      sec.classList.toggle("is-moving", p > 0.02);
      // the outlined number fills with cream while its step is on screen
      const local = gsap.utils.clamp(0, 1, (p - HEAD) / seg - stepAt(p));
      nums.forEach((el, k) => {
        const f = k < stepAt(p) || p >= FOOT ? 1 : k === stepAt(p) ? 0.12 + local * 0.88 : 0;
        el.style.setProperty("--f", `${(f * 104).toFixed(1)}%`);
        el.style.setProperty("--wx", `${(p * 900).toFixed(0)}px`);
      });
      setStep(stepAt(p));
      setComplete(p >= DONE);
    };

    const pTo = gsap.quickTo(state, "p", { duration: 0.6, ease: "power3.out", onUpdate: render });
    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top top",
      end: () => "+=" + innerHeight * (n * 0.8 + 0.9),
      pin,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => pTo(self.progress),
      onRefresh: () => { measure(); if (scenes) scenes.reflow(); },
    });

    btns.forEach((b, k) => b.addEventListener("click", () => {
      const p = HEAD + seg * (k + 0.6);
      const y = st.start + (st.end - st.start) * p;
      if (window.marLenis) window.marLenis.scrollTo(y, { duration: 1.3 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    }));

    // the first scene deals itself in when the section scrolls into view
    if (scenes) ScrollTrigger.create({ trigger: sec, start: "top 65%", once: true, onEnter: () => scenes.show(cur, 1) });
    paintNav();
    measure();
    addEventListener("load", measure);
    document.fonts?.ready.then(measure);
  }

  function init() {
    how();
    ticket();
    if (live) {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    }
  }

  MARIDAY.onReady(init);
})();
