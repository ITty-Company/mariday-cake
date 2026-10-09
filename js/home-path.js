/* Mariday home — how to order: the cherry's road.
   A piped-cream trail is drawn through the six stops (re-measured on resize); as you scroll, a cherry rolls
   along it at eye level, leaving sprinkles behind. Every stop it reaches plays its chapter in — the number
   rolls, the words jump in, the script word is written — and its little scene comes to life. At the end the
   cherry lands on the cake: bunting drops, candles light, confetti falls. Scroll back up and it all rewinds. */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const hasLibs = !!(window.gsap && window.ScrollTrigger);
  const live = hasLibs && !!window.Lenis && !reduce;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SPRINKLE_COLORS = ["#6d0809", "#f5bcc8", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff", "#9ed9b8"];
  const WAX = ["#6d0809", "#8f0f14", "#c4262f", "#470304"];
  const MONTHS_OF = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
  const FLAVORS = [
    { desc: "горіховий бісквіт · кремчиз з фісташкою · малинове конфі", c: { sp: "#c9d89a", cr: "#fbf6ea", fi: "#d8344f", tp: "#f6eadb", dc: "#d8344f" } },
    { desc: "шоколадний бісквіт · фундучне праліне · вафельна крихта", c: { sp: "#6b3a22", cr: "#f4e6d0", fi: "#c08a52", tp: "#7a4428", dc: "#f4e6d0" } },
    { desc: "шифон · кремчиз · малина, вишня, смородина", c: { sp: "#f3dca8", cr: "#fff8ef", fi: "#8c2245", tp: "#fffaf3", dc: "#6d1a3c" } },
    { desc: "лимонний сироп · малинове конфі · лимонний гель", c: { sp: "#f7e38a", cr: "#fffaf0", fi: "#e8506a", tp: "#fff4c2", dc: "#e8506a" } },
  ];
  const SWASH = '<svg class="x-path__swash" viewBox="0 0 220 26" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4,16 C30,4 52,24 80,14 S128,4 150,15 S196,22 216,8"/></svg>';
  const bookedDate = () => new Date(Date.now() + 10 * 864e5);

  function burst(host, x, y, count = 30, spread = 1, colors = SPRINKLE_COLORS, tag = "i") {
    if (!hasLibs || reduce) return;
    for (let i = 0; i < count; i++) {
      const sp = document.createElement(tag);
      sp.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]}`;
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

  function init() {
    const sec = $(".x-path");
    if (!sec) return;
    const burstHost = $(".x-path__burst", sec);
    const at = (el) => {
      const a = el.getBoundingClientRect(), h = burstHost.getBoundingClientRect();
      return [a.left + a.width / 2 - h.left, a.top + a.height / 2 - h.top, a];
    };
    // effects shared by the chapters, in the section's coordinates
    const fx = {
      pop: (el, count = 30, spread = 1, colors) => { const [x, y] = at(el); burst(burstHost, x, y, count, spread, colors); },
      wax: (el) => { const [x, y] = at(el); burst(burstHost, x, y, 16, 0.55, WAX, "u"); },
      hearts: (el, count = 5) => {
        if (!hasLibs || reduce) return;
        const [x, y] = at(el);
        for (let i = 0; i < count; i++) {
          const h = document.createElement("b");
          h.textContent = "♥";
          h.style.cssText = `left:${x + gsap.utils.random(-50, 50)}px;top:${y}px`;
          burstHost.appendChild(h);
          gsap.fromTo(h, { y: 0, scale: 0.3, opacity: 1 }, { y: gsap.utils.random(-160, -90), x: gsap.utils.random(-30, 30), rotation: gsap.utils.random(-30, 30), scale: gsap.utils.random(0.8, 1.4), opacity: 0, duration: gsap.utils.random(1.2, 1.8), delay: i * 0.08, ease: "power1.out", onComplete: () => h.remove() });
        }
      },
      // confetti falls from above the element down past it
      rain: (el, count = 60) => {
        if (!hasLibs || reduce) return;
        const [x, y, r] = at(el);
        for (let i = 0; i < count; i++) {
          const c = document.createElement("i");
          c.style.cssText = `left:${x + gsap.utils.random(-1, 1) * Math.max(r.width, 520)}px;top:${y - r.height / 2 - 260}px;background:${SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]}`;
          burstHost.appendChild(c);
          gsap.fromTo(c, { y: gsap.utils.random(-80, 0), rotation: gsap.utils.random(0, 360), opacity: 1 }, { y: gsap.utils.random(420, 720), x: "+=" + gsap.utils.random(-70, 70), rotation: "+=" + gsap.utils.random(300, 900), opacity: 0, duration: gsap.utils.random(1.8, 3), delay: gsap.utils.random(0, 0.8), ease: "power1.in", onComplete: () => c.remove() });
        }
      },
    };

    glaze(sec);
    const opener = opening(sec, fx);
    bookingDate(sec);
    const stations = $$(".x-path__st", sec);
    const scenes = [deck(sec, fx), slice(sec, fx), weight(sec), chat(sec, fx), booking(sec, fx), cakeBox(sec, fx)];
    candles(sec, fx);

    const road = road_(sec);

    $("[data-path-go]", sec).addEventListener("click", () => {
      const r = $(".x-path__stop", stations[0]).getBoundingClientRect();
      const y = scrollY + r.top + r.height / 2 - innerHeight * 0.58 + 2;
      if (window.marLenis) window.marLenis.scrollTo(y, { duration: 1.6 });
      else scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    });

    if (!live) {
      stations.forEach((s) => s.classList.add("is-on"));
      sec.classList.add("is-landed");
      scenes[5].open(true);
      road.draw(1);
      return;
    }
    sec.classList.add("is-live");

    // sprinkles scattered around the edges, drifting at different depths while the section scrolls by
    const SPRINKLES = [[4, 6, -30], [95, 9, 40], [3, 30, -60], [97, 34, 20], [6, 52, 75], [94, 58, -15], [3, 76, 50], [96, 82, -45], [8, 94, 30], [92, 97, 65]];
    const host = document.createElement("div");
    host.className = "x-path__sprinkles";
    host.setAttribute("aria-hidden", "true");
    sec.prepend(host);
    const drift = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    SPRINKLES.forEach(([x, y, r], i) => {
      const sp = document.createElement("i");
      sp.style.cssText = `left:${x}%;top:${y}%;background:${SPRINKLE_COLORS[1 + (i % (SPRINKLE_COLORS.length - 1))]};opacity:${0.5 + (i % 3) * 0.2}`;
      host.appendChild(sp);
      gsap.set(sp, { rotation: r, scale: 0.8 + (i % 3) * 0.25 });
      drift.fromTo(sp, { y: 80 + (i % 4) * 60 }, { y: -80 - (i % 4) * 60, rotation: r + (i % 2 ? 120 : -120), ease: "none" }, 0);
    });

    opener.intro();

    // the real cakes beside the road drift at their own depth and bob gently
    $$(".x-path__lm", sec).forEach((im, i) => {
      const d = +im.dataset.depth || 1;
      gsap.fromTo(im, { y: 160 * d }, { y: -160 * d, rotation: `+=${(i % 2 ? 1 : -1) * 14}`, ease: "none", scrollTrigger: { trigger: road.el, start: "top bottom", end: "bottom top", scrub: 0.8 } });
      gsap.from(im, { scale: 0, opacity: 0, duration: 1, ease: "back.out(2)", scrollTrigger: { trigger: im, start: "top 92%", once: true } });
    });

    // every chapter gets a huge outlined number drifting behind it, and its own entrance timeline
    const cards = stations.map((st, i) => {
      const ghost = document.createElement("span");
      ghost.className = "x-path__ghost";
      ghost.setAttribute("aria-hidden", "true");
      ghost.textContent = String(i + 1).padStart(2, "0");
      st.appendChild(ghost);
      gsap.fromTo(ghost, { yPercent: -35 }, { yPercent: 35, ease: "none", scrollTrigger: { trigger: st, start: "top bottom", end: "bottom top", scrub: 0.8 } });
      return cardIn(st);
    });

    const enter = (i) => {
      const st = stations[i];
      cards[i].restart();
      scenes[i].enter();
      const stop = $(".x-path__stop", st);
      const tok = $(".x-path__tok", st);
      gsap.fromTo(tok, { scale: 1.35 }, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.35)", clearProps: "scale" });
      [0, 0.18].forEach((d) => {
        const ring = document.createElement("i");
        ring.className = "x-path__ripple";
        stop.appendChild(ring);
        gsap.fromTo(ring, { scale: 0.7, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 1, delay: d, ease: "power2.out", onComplete: () => ring.remove() });
      });
      fx.pop(tok, 14, 0.6);
      // the cherry hops as it rolls over the stop
      gsap.fromTo(road, { hop: 0 }, { hop: -24, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", onUpdate: () => road.draw(road.cur) });
    };
    const leave = (i) => {
      cards[i].pause(0);
      scenes[i].leave();
    };

    // the finale: bunting drops, candles light one by one, the wish is written, confetti rains
    const cake = $(".x-path__cake", sec);
    const flags = $$(".x-path__garland i", sec);
    const string = $(".x-path__garland path", sec);
    const lights = $$(".x-path__candle", sec);
    const wish = $(".x-path__fin h3 em", sec);
    flags.forEach((f, i) => {
      const t = (i + 1) / (flags.length + 1);
      f.style.left = `${t * 100}%`;
      f.style.top = `${(1 - t) * (1 - t) * 6 + 2 * (1 - t) * t * 50 + t * t * 6}px`;
    });
    lights.forEach((c) => c.classList.add("is-unlit"));
    const HIDDEN = "inset(-80% 130% -80% -30%)";
    gsap.set(wish, { clipPath: HIDDEN });
    let lightTimers = [];
    const land = (on) => {
      lightTimers.forEach(clearTimeout);
      lightTimers = [];
      if (!on) {
        lights.forEach((c) => c.classList.add("is-unlit"));
        gsap.killTweensOf(wish);
        gsap.set(wish, { clipPath: HIDDEN });
        return;
      }
      const top = $(".x-path__topper", sec);
      gsap.fromTo($("svg", top), { y: -46, scaleY: 1.15, scaleX: 0.9 }, { y: 0, scaleY: 1, scaleX: 1, duration: 0.9, ease: "bounce.out" });
      gsap.delayedCall(0.25, () => fx.pop(top, 44, 1.3));
      gsap.fromTo(cake, { scaleY: 1 }, { scaleY: 0.95, duration: 0.1, delay: 0.25, yoyo: true, repeat: 1, transformOrigin: "50% 100%" });
      gsap.fromTo(string, { scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 0.9, delay: 0.3, ease: "elastic.out(1, 0.5)" });
      gsap.fromTo(flags, { y: -40, opacity: 0, rotation: -50 }, { y: 0, opacity: 1, rotation: 0, duration: 1.1, delay: 0.5, stagger: 0.06, ease: "elastic.out(1, 0.45)" });
      lights.forEach((c, k) => lightTimers.push(setTimeout(() => c.classList.remove("is-unlit"), 900 + k * 260)));
      gsap.fromTo(wish, { clipPath: HIDDEN }, { clipPath: "inset(-80% -30% -80% -30%)", duration: 1.2, delay: 0.5, ease: "power2.inOut" });
      gsap.delayedCall(0.6, () => fx.rain(cake, 70));
    };

    // the cherry rides on the line 58% down the screen; the stops it has passed are open
    let reached = -1;
    let landed = false;
    let trailAt = null;
    const trail = document.createElement("div");
    trail.className = "x-path__trail";
    trail.setAttribute("aria-hidden", "true");
    road.el.appendChild(trail);
    const state = { l: 0 };
    const render = () => {
      const r = road.draw(state.l);
      // a sprinkle drops off the cherry every few dozen pixels it rolls
      if (trailAt === null || Math.hypot(r.x - trailAt[0], r.y - trailAt[1]) > 30) {
        if (trailAt !== null && !landed) {
          const sp = document.createElement("i");
          sp.style.cssText = `left:${r.x}px;top:${r.y - 10}px;background:${SPRINKLE_COLORS[1 + Math.floor(Math.random() * (SPRINKLE_COLORS.length - 1))]}`;
          trail.appendChild(sp);
          gsap.fromTo(sp, { rotation: gsap.utils.random(0, 180), scale: 1 }, { x: gsap.utils.random(-22, 22), y: gsap.utils.random(-8, 18), rotation: "+=" + gsap.utils.random(-120, 120), scale: 0.6, opacity: 0, duration: gsap.utils.random(1.4, 2.2), ease: "power2.out", onComplete: () => sp.remove() });
        }
        trailAt = [r.x, r.y];
      }
      if (r.stop !== reached) {
        stations.forEach((s, i) => { s.classList.toggle("is-on", i <= r.stop); s.classList.toggle("is-here", i === r.stop); });
        for (let k = reached + 1; k <= r.stop; k++) enter(k);
        for (let k = reached; k > r.stop; k--) leave(k);
        reached = r.stop;
      }
      if (r.end !== landed) {
        landed = r.end;
        sec.classList.toggle("is-landed", landed);
        land(landed);
      }
    };
    const lTo = gsap.quickTo(state, "l", { duration: 0.7, ease: "power3.out", onUpdate: render });
    const track = () => lTo(road.at(innerHeight * 0.58 - road.el.getBoundingClientRect().top));
    road.onBuild = () => { state.l = Math.min(state.l, road.total()); render(); track(); };
    ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onUpdate: track, onRefresh: track });
    render();
    track();
  }

  // a chapter's text: the number rolls like an odometer, words jump in, the script word is written and underlined,
  // the link tickets drop in. Built paused at its start, so the chapter waits empty until the cherry arrives.
  function cardIn(st) {
    const card = $(".x-path__card", st);
    const no = $(".x-path__no", card);
    const h3 = $("h3", card);
    const em = $("em", h3);
    // odometer: each digit is a column 0–9 0–9 that rolls to its digit in the second run
    [...no.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).forEach((n) => {
      const frag = document.createDocumentFragment();
      // the real number stays as text for copying and screen readers; the rolling columns are decoration
      const real = document.createElement("span");
      real.className = "x-path__sr";
      real.textContent = n.textContent.trim();
      frag.appendChild(real);
      [...n.textContent.trim()].forEach((d) => {
        const odo = document.createElement("span");
        odo.className = "x-path__odo";
        odo.setAttribute("aria-hidden", "true");
        odo.innerHTML = `<span data-d="${d}">${"<i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i>".repeat(2)}</span>`;
        frag.appendChild(odo);
      });
      n.replaceWith(frag);
    });
    // words of the heading, outside the script word
    [...h3.childNodes].filter((n) => n.nodeType === 3).forEach((n) => {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) return frag.appendChild(document.createTextNode(w));
        const s = document.createElement("span");
        s.className = "x-path__wd";
        s.textContent = w;
        frag.appendChild(s);
      });
      n.replaceWith(frag);
    });
    em.insertAdjacentHTML("beforeend", SWASH);

    const cols = $$(".x-path__odo > span", no);
    const words = $$(".x-path__wd", h3);
    const p = $(":scope > p:not(.x-path__no)", card);
    const tags = $$(".x-path__tag", card);
    const note = $(".x-path__note", st);
    const tl = gsap.timeline({ paused: true, onStart: () => card.classList.add("is-anim"), onComplete: () => card.classList.remove("is-anim") });
    tl.fromTo(cols, { yPercent: 0 }, { yPercent: (i, el) => -((10 + +el.dataset.d) / 20) * 100, duration: 1.4, stagger: 0.15, ease: "expo.out" }, 0)
      .fromTo(words, { yPercent: 110, opacity: 0, rotation: 8 }, { yPercent: 0, opacity: 1, rotation: 0, duration: 0.7, stagger: 0.07, ease: "back.out(1.8)" }, 0.1)
      .fromTo(em, { clipPath: "inset(-80% 130% -80% -30%)" }, { clipPath: "inset(-80% -30% -80% -30%)", duration: 0.9, ease: "power2.inOut" }, 0.3)
      .fromTo($(".x-path__swash path", em), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, 1)
      .fromTo(p, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" }, 0.45)
      .fromTo(tags, { y: -60, opacity: 0, rotation: (i) => (i % 2 ? 1 : -1) * 28 }, { y: 0, opacity: 1, rotation: 0, duration: 1, stagger: 0.1, ease: "elastic.out(1, 0.55)", clearProps: "transform" }, 0.6);
    if (note) tl.fromTo(note, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(3)" }, 1.2);
    tl.progress(1).progress(0);
    return tl;
  }

  // builds a smooth cream path through the centres of the stops and ends on the cake top
  function road_(sec) {
    const el = $("[data-path-route]", sec);
    const paths = $$(".x-path__svg path", el);
    const cream = $(".x-path__cream", el);
    const shine = $(".x-path__shine", el);
    const cherry = $(".x-path__cherry", el);
    const stops = $$(".x-path__stop", el);
    const cake = $("[data-path-end]", el);
    const topper = $(".x-path__topper", cake);
    const phone = matchMedia("(max-width: 760px)");
    const api = { el, onBuild: null, hop: 0, cur: 0 };
    const roseHost = $(".x-path__roses", el);
    let len = 0, ys = [], ls = [], marks = [], prev = 0, roses = [];

    const build = () => {
      const box = el.getBoundingClientRect();
      const pts = stops.map((s) => {
        const r = s.getBoundingClientRect();
        return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
      });
      const c = cake.getBoundingClientRect();
      pts.push([c.left + c.width / 2 - box.left, c.top - box.top + topper.offsetTop + topper.offsetWidth * 0.867]);
      // how far a leg may swing out: well inside the lane between the chapters
      const cols = getComputedStyle(stops[0].parentElement).gridTemplateColumns.split(" ").map(parseFloat);
      const lane = cols.length > 2 ? cols[1] : cols[0];
      const swing = phone.matches ? 20 : Math.min(lane * 0.42, 100);
      const f = (n) => n.toFixed(1);
      // vertical S-curves: each leg leaves its stop heading down and swings out to one side before the next
      let d = `M${f(pts[0][0])},0 L${f(pts[0][0])},${f(pts[0][1])}`;
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dy = by - ay, w = (i % 2 ? -1 : 1) * swing;
        // the last leg drops straight down onto the cake, between the candles
        const last = i === pts.length - 1;
        d += ` C${f(ax + w)},${f(ay + dy * 0.4)} ${f(last ? bx : bx + w)},${f(by - dy * (last ? 0.55 : 0.4))} ${f(bx)},${f(by)}`;
      }
      paths.forEach((p) => p.setAttribute("d", d));
      len = cream.getTotalLength();
      [cream, shine].forEach((p) => { p.style.strokeDasharray = `${len} ${len}`; });
      // the path only ever goes down, so a table of y → length answers "where is the cherry at this height"
      const N = Math.min(1600, Math.ceil(len / 3));
      ys = []; ls = [];
      for (let k = 0; k <= N; k++) {
        const l = (len * k) / N, q = cream.getPointAtLength(l);
        ys.push(Math.max(q.y, ys.length ? ys[ys.length - 1] : 0)); ls.push(l);
      }
      marks = pts.map(([, y]) => api.at(y));
      // rosettes along the road, kept clear of the stops and the cake
      roseHost.innerHTML = "";
      roses = [];
      const gap = phone.matches ? 80 : 110;
      for (let l = 60; l < len - 50; l += gap) {
        if (marks.some((m) => Math.abs(m - l) < 55)) continue;
        const q = cream.getPointAtLength(l);
        const r = document.createElement("i");
        r.style.left = `${q.x.toFixed(1)}px`;
        r.style.top = `${q.y.toFixed(1)}px`;
        roseHost.appendChild(r);
        roses.push({ el: r, l, on: false });
      }
      el.classList.add("is-drawn");
      if (api.onBuild) api.onBuild();
      else api.draw(api.cur);
    };

    api.total = () => len;
    api.at = (y) => {
      if (!ls.length || y <= ys[0]) return 0;
      if (y >= ys[ys.length - 1]) return len;
      let lo = 0, hi = ys.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ys[m] < y) lo = m; else hi = m; }
      const t = (y - ys[lo]) / (ys[hi] - ys[lo] || 1);
      return ls[lo] + (ls[hi] - ls[lo]) * t;
    };
    // p ≤ 1 is a share of the road (static mode), anything bigger is a length in px
    api.draw = (l) => {
      api.cur = l;
      if (!len) return { stop: -1, end: false, x: 0, y: 0 };
      if (l <= 1 && !live) l *= len;
      l = Math.max(0, Math.min(len, l));
      [cream, shine].forEach((p) => { p.style.strokeDashoffset = len - l; });
      const q = cream.getPointAtLength(l);
      const q2 = cream.getPointAtLength(Math.min(len, l + 3));
      // the cherry leans the way the road turns, rocks as it rolls and stretches when it goes fast
      const lean = (Math.atan2(q2.x - q.x, q2.y - q.y) * 180) / Math.PI;
      const s = Math.min(Math.abs(l - prev) / 50, 0.24);
      prev = l;
      cherry.style.transform = `translate(${q.x.toFixed(1)}px, ${(q.y + api.hop).toFixed(1)}px) rotate(${(lean * 0.55 + Math.sin(l / 26) * 4).toFixed(1)}deg) scale(${(1 - s * 0.45).toFixed(3)}, ${(1 + s).toFixed(3)})`;
      roses.forEach((r) => { const on = l >= r.l; if (on !== r.on) { r.on = on; r.el.classList.toggle("is-on", on); } });
      let stop = -1;
      for (let i = 0; i < stops.length; i++) if (l >= marks[i] - 4) stop = i;
      return { stop, end: l >= len - 3, x: q.x, y: q.y };
    };

    build();
    let raf = 0;
    const rebuild = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(build); };
    if (window.ResizeObserver) new ResizeObserver(rebuild).observe(el);
    else addEventListener("resize", rebuild);
    document.fonts?.ready.then(rebuild);
    addEventListener("load", rebuild);
    return api;
  }

  // the opening: the letters of the title carry their own slice of glaze, the glaze drips off them, a piping bag
  // writes the script word, ingredients float round, and the little map of stops jumps to any stop
  function opening(sec, fx) {
    const head = $(".x-path__head", sec);
    const title = $(".x-path__title", head);
    const w1 = $(".x-path__w1", head);
    const inner = $(".x-path__w1 > span", head);
    const script = $(".x-path__script", head);
    const bag = $(".x-path__bag", head);
    const floats = $$(".x-fl", head);
    const animate = hasLibs && !reduce;

    // split the glazed word into letters
    const letters = [];
    [...inner.childNodes].forEach((n) => {
      if (n.nodeType !== 3) return;
      // letters are grouped per word, so a line can only break between words
      const frag = document.createDocumentFragment();
      n.textContent.split(" ").forEach((word, k) => {
        if (k) frag.appendChild(document.createTextNode(" "));
        const wd = document.createElement("span");
        wd.className = "x-path__word";
        [...word].forEach((ch) => {
          const s = document.createElement("span");
          s.className = "x-path__lt";
          s.textContent = ch;
          wd.appendChild(s);
          letters.push(s);
        });
        frag.appendChild(wd);
      });
      n.replaceWith(frag);
    });
    inner.classList.add("is-split");

    // drips hang under the letters; sizes follow the title's font size
    const drips = document.createElement("span");
    drips.className = "x-path__drips";
    w1.appendChild(drips);
    let dripEls = [];
    let dripsHidden = false; // until the letters have landed
    const measure = () => {
      const fs = parseFloat(getComputedStyle(title).fontSize);
      inner.style.setProperty("--ww", `${inner.offsetWidth}px`);
      drips.innerHTML = "";
      dripEls = [];
      letters.forEach((lt, i) => {
        lt.style.setProperty("--lx", `${lt.offsetLeft - inner.offsetLeft}px`);
        const two = i % 3 === 1;
        [0, 1].slice(0, two ? 2 : 1).forEach((k) => {
          const d = document.createElement("i");
          const w = fs * (0.07 + ((i * 7 + k * 3) % 5) * 0.012);
          const h = fs * (0.1 + ((i * 13 + k * 5) % 7) * 0.055);
          const f = two ? (k ? 0.74 : 0.26) : 0.3 + ((i * 11) % 5) * 0.1;
          d.style.cssText = `left:${(lt.offsetLeft + lt.offsetWidth * f).toFixed(1)}px;top:${(lt.offsetTop + lt.offsetHeight - fs * 0.07).toFixed(1)}px;--w:${w.toFixed(1)}px;--h:${h.toFixed(1)}px`;
          if (dripsHidden) d.style.transform = "scaleY(0)";
          drips.appendChild(d);
          dripEls.push(d);
        });
      });
    };
    measure();
    document.fonts?.ready.then(measure);
    if (window.ResizeObserver) new ResizeObserver(() => measure()).observe(inner);


    if (!animate) return { intro() {} };

    // ingredients drift with the mouse (each at its own depth) and with the scroll
    const movers = floats.map((el) => ({ d: +el.dataset.depth || 0.5, x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }), y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" }) }));
    sec.addEventListener("pointermove", (e) => {
      const mx = e.clientX / innerWidth - 0.5, my = e.clientY / innerHeight - 0.5;
      movers.forEach((m) => { m.x(mx * m.d * -70); m.y(my * m.d * -50); });
    });
    floats.forEach((el) => gsap.to(el, { yPercent: -(+el.dataset.depth || 0.5) * 260, rotation: (+el.dataset.depth || 0.5) * 60, ease: "none", scrollTrigger: { trigger: head, start: "top bottom", end: "bottom top", scrub: 0.8 } }));

    // a letter wobbles like jelly when the pointer touches it
    letters.forEach((lt) => lt.addEventListener("pointerenter", () => gsap.fromTo(lt, { scaleY: 0.72, scaleX: 1.2 }, { scaleY: 1, scaleX: 1, duration: 0.9, ease: "elastic.out(1, 0.32)" })));

    // now and then a drop of glaze falls off a drip
    let inView = false;
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(head);
    setInterval(() => {
      if (!inView || document.hidden || !dripEls.length) return;
      const d = dripEls[Math.floor(Math.random() * dripEls.length)];
      if (gsap.getProperty(d, "scaleY") < 0.95) return;
      const drop = document.createElement("b");
      drop.style.cssText = `left:${d.style.left};top:${parseFloat(d.style.top) + parseFloat(d.style.getPropertyValue("--h"))}px;--w:${d.style.getPropertyValue("--w")}`;
      drips.appendChild(drop);
      gsap.fromTo(d, { scaleY: 1 }, { scaleY: 1.18, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" });
      gsap.fromTo(drop, { y: 0, scaleY: 0.6, opacity: 1 }, { y: parseFloat(getComputedStyle(title).fontSize) * 1.1, scaleY: 1.3, opacity: 0, duration: 0.9, delay: 0.2, ease: "power2.in", onComplete: () => drop.remove() });
    }, 1500);

    // where the piping bag's nozzle is while it writes: along the tilted script word, wiggling like handwriting
    // generous margins, so swashes and the "?" reaching outside the word box are never cut
    const HIDE = "inset(-80% 125% -80% -30%)";
    gsap.set(script, { clipPath: HIDE });
    const nozzle = (p) => {
      const sr = script.getBoundingClientRect(), tr = title.getBoundingClientRect();
      return {
        x: sr.left - tr.left + sr.width * (0.05 + 0.9 * p),
        y: sr.top - tr.top + sr.height * (0.74 - 0.4 * p) + Math.sin(p * Math.PI * 10) * sr.height * 0.1,
      };
    };
    const place = (x, y, tilt) => { bag.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) rotate(${tilt.toFixed(1)}deg)`; };
    const writeScript = () => {
      const o = { p: 0, f: 0 };
      return gsap.timeline()
        .set(bag, { opacity: 1 })
        // flies in from the top right to the start of the word
        .to(o, { f: 1, duration: 0.55, ease: "power2.out", onUpdate: () => {
          const a = nozzle(0), tr = title.getBoundingClientRect();
          place(tr.width + 60 + (a.x - tr.width - 60) * o.f, -120 + (a.y + 120) * o.f, 30 - 58 * o.f);
        } })
        // pipes the word, letter by letter
        .to(o, { p: 1, duration: 1.5, ease: "power1.inOut", onUpdate: () => {
          const a = nozzle(o.p);
          place(a.x, a.y, -28 + Math.sin(o.p * Math.PI * 10) * 9);
          script.style.clipPath = `inset(-80% ${((1 - o.p) * 155 - 30).toFixed(1)}% -80% -30%)`;
        } })
        .call(() => { script.style.clipPath = "none"; fx.pop(bag, 16, 0.5); })
        // and is lifted away
        .to(bag, { y: "-=140", x: "+=80", rotation: 25, opacity: 0, duration: 0.6, ease: "power2.in" });
    };

    return {
      intro() {
        dripsHidden = true;
        gsap.set(dripEls, { scaleY: 0 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: head, start: "top 75%", once: true } });
        tl.from(floats, { scale: 0, opacity: 0, duration: 0.9, stagger: 0.05, ease: "back.out(2.4)" }, 0)
          // the letters drop in one by one and bounce on the cake
          .from(letters, { yPercent: -280, rotation: () => gsap.utils.random(-45, 45), opacity: 0, duration: 1, stagger: 0.07, ease: "bounce.out" }, 0.15)
          // the glaze starts to drip
          .call(() => {
            dripsHidden = false;
            gsap.fromTo(dripEls, { scaleY: 0 }, { scaleY: 1, duration: 1.4, stagger: { each: 0.04, from: "random" }, ease: "elastic.out(1, 0.55)" });
          }, null, 1.05)
          .add(writeScript(), 1.2)
          .from(".x-path__sub, .x-path__cta", { y: 18, opacity: 0, duration: 0.9, stagger: 0.12, ease: "expo.out" }, 1.6)
          .fromTo(".x-path__sub mark", { backgroundSize: "0% 0.42em" }, { backgroundSize: "100% 0.42em", duration: 0.8, ease: "power2.inOut" }, 2.1)
          .from(".x-path__call", { scale: 0, opacity: 0, duration: 0.7, stagger: 0.2, ease: "back.out(2.5)" }, 2.6);
      },
    };
  }

  // the wet highlight on the glazed title follows the pointer
  function glaze(sec) {
    const w = $(".x-path__w1 > span", sec);
    if (!w || !matchMedia("(hover: hover) and (pointer: fine)").matches || reduce) return;
    sec.addEventListener("pointermove", (e) => {
      const r = w.getBoundingClientRect();
      w.style.setProperty("--gx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    });
  }

  // the booking ticket shows a date ten days from today
  function bookingDate(sec) {
    const d = bookedDate();
    $("[data-date-day]", sec).textContent = d.getDate();
    $("[data-date-month]", sec).textContent = MONTHS_OF[d.getMonth()];
  }

  const NOOP = { enter() {}, leave() {} };

  // 01 · polaroids are dealt from the air, then shuffle themselves; tap to shuffle, the deck tilts under the pointer
  function deck(sec, fx) {
    const el = $("[data-deck]", sec);
    const st = el.closest(".x-path__st");
    const SLOTS = [["-11deg", "-34%"], ["9deg", "34%"], ["-2deg", "0%"]];
    const figs = () => $$("figure", el);
    const place = () => figs().forEach((f, i) => { f.style.setProperty("--r", SLOTS[i][0]); f.style.setProperty("--x", SLOTS[i][1]); });
    let busy = false;
    let hover = false;
    const shuffle = () => {
      if (busy) return;
      const top = el.lastElementChild;
      if (!hasLibs || reduce) { el.prepend(top); place(); return; }
      busy = true;
      el.classList.add("is-dealing");
      // the top card is flicked up and away, then slides in at the bottom of the pile
      gsap.to(top, {
        "--fy": "-90px", "--fx": "60px", "--fr": "28deg", duration: 0.28, ease: "power2.out",
        onComplete: () => {
          el.classList.remove("is-dealing");
          el.prepend(top);
          place();
          top.style.setProperty("--fx", "0px");
          top.style.setProperty("--fy", "0px");
          top.style.setProperty("--fr", "0deg");
          fx.hearts(el.lastElementChild, 3);
          setTimeout(() => { busy = false; }, 500);
        },
      });
    };
    el.addEventListener("click", shuffle);
    if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--tx", `${(((e.clientX - r.left) / r.width - 0.5) * 22).toFixed(1)}deg`);
        el.style.setProperty("--ty", `${(((e.clientY - r.top) / r.height - 0.5) * -22).toFixed(1)}deg`);
      });
      el.addEventListener("pointerenter", () => { hover = true; });
      el.addEventListener("pointerleave", () => { hover = false; el.style.setProperty("--tx", "0deg"); el.style.setProperty("--ty", "0deg"); });
    }
    if (!live) return NOOP;

    let timer = 0;
    gsap.set(figs(), { opacity: 0 });
    return {
      enter() {
        el.classList.add("is-dealing");
        const all = figs();
        all.forEach((f, i) => gsap.fromTo(f,
          { "--fx": `${gsap.utils.random(-320, 320)}px`, "--fy": "-360px", "--fr": `${gsap.utils.random(-120, 120)}deg`, opacity: 0 },
          { "--fx": "0px", "--fy": "0px", "--fr": "0deg", opacity: 1, duration: 1.1, delay: 0.15 + i * 0.16, ease: "back.out(1.3)", onComplete: i === all.length - 1 ? () => { el.classList.remove("is-dealing"); fx.hearts(f, 5); } : null }));
        clearInterval(timer);
        timer = setInterval(() => { if (st.classList.contains("is-here") && !hover) shuffle(); }, 2800);
      },
      leave() {
        clearInterval(timer);
        gsap.killTweensOf(figs());
        el.classList.remove("is-dealing");
        gsap.set(figs(), { opacity: 0 });
      },
    };
  }

  // 02 · the slice is stacked layer by layer and a berry drops on top; another flavour re-stacks it
  function slice(sec, fx) {
    const el = $("[data-slice]", sec);
    const cake = $(".x-pv-slice__cake", el);
    const layers = $$(".x-pv-slice__cake > i:not(.x-pv-slice__plate):not(.x-pv-slice__berry)", el);
    const berry = $(".x-pv-slice__berry", el);
    const desc = $("[data-slice-desc]", el);
    const chips = $$("[data-flavor]", el);
    const halfL = $(".x-pv-split__l", el);
    const halfR = $(".x-pv-split__r", el);
    const knife = $(".x-pv-split__knife", el);
    const animate = hasLibs && !reduce;
    let cur = 0;
    let swap = null;
    const paint = (k) => {
      Object.entries(FLAVORS[k].c).forEach(([key, v]) => cake.style.setProperty(`--${key}`, v));
      desc.textContent = FLAVORS[k].desc;
    };
    const stack = () => gsap.timeline()
      .fromTo([...layers].reverse(), { y: -150, opacity: 0, rotation: () => gsap.utils.random(-8, 8) }, { y: 0, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.07, ease: "bounce.out" })
      .fromTo(berry, { y: -200, opacity: 0, scaleY: 1.3 }, { y: 0, opacity: 1, scaleY: 1, duration: 0.7, ease: "bounce.out" }, ">-0.15")
      .call(() => fx.pop(berry, 12, 0.5));
    const pick = (k, focus) => {
      chips.forEach((c, i) => { c.setAttribute("aria-checked", String(i === k)); c.tabIndex = i === k ? 0 : -1; });
      if (focus) chips[k].focus();
      if (k === cur) return;
      cur = k;
      if (!animate) return paint(k);
      if (swap) swap.kill();
      // the old layers are knocked off sideways, the new flavour is stacked in their place
      swap = gsap.timeline()
        .to([berry, ...layers], { x: 70, opacity: 0, rotation: 12, duration: 0.22, stagger: 0.025, ease: "power2.in" })
        .to(desc, { opacity: 0, duration: 0.15 }, 0)
        .call(() => paint(k))
        .set([berry, ...layers], { x: 0, rotation: 0 })
        .add(stack())
        .to(desc, { opacity: 1, duration: 0.3 }, "<0.2");
    };
    chips.forEach((c, i) => {
      c.tabIndex = i === 0 ? 0 : -1;
      c.addEventListener("click", () => pick(i));
      c.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        pick((i + step + chips.length) % chips.length, true);
      });
    });
    if (!live) return NOOP;

    gsap.set([berry, ...layers], { opacity: 0 });
    const closed = () => gsap.set([halfL, halfR], { xPercent: 0, rotation: 0 });
    let cut = null;
    closed();
    return {
      enter() {
        if (swap) swap.kill();
        if (cut) cut.kill();
        closed();
        // the knife comes down through the whole cake, then the halves fall apart and the slice is stacked between
        cut = gsap.timeline({ delay: 0.25 })
          .fromTo(knife, { y: -120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.in" })
          .call(() => fx.pop(knife, 10, 0.4))
          .to(knife, { y: -160, opacity: 0, duration: 0.4, ease: "power2.in" }, "+=0.15")
          .to(halfL, { xPercent: -40, rotation: -10, duration: 1, ease: "elastic.out(1, 0.6)" }, "-=0.2")
          .to(halfR, { xPercent: 40, rotation: 10, duration: 1, ease: "elastic.out(1, 0.6)" }, "<");
        swap = stack().delay(1.2);
        gsap.fromTo(chips, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, delay: 0.9, stagger: 0.06, ease: "back.out(2.5)", clearProps: "transform" });
      },
      leave() {
        if (swap) swap.kill();
        if (cut) cut.kill();
        closed();
        gsap.set(knife, { opacity: 0 });
        gsap.set([berry, ...layers], { opacity: 0 });
      },
    };
  }

  // 03 · guests → kilograms (≈180 g a guest, from 1,5 kg); a plate pops up per guest, the cake grows tiers
  function weight(sec) {
    const el = $("[data-kg]", sec);
    const input = $("[data-guests]", el);
    const out = $("[data-kg-out]", el);
    const guests = $("[data-guests-out]", el);
    const plates = $("[data-plates]", el);
    const cake = $(".x-pv-kg__cake", el);
    const animate = hasLibs && !reduce;
    let last = "";
    let tiers = "";
    let touched = false;
    const set = () => {
      const g = +input.value;
      const kg = Math.max(1.5, Math.round(g * 0.18 * 2) / 2);
      const txt = String(kg).replace(".", ",");
      guests.textContent = g;
      // one plate per guest
      const have = plates.children.length;
      for (let k = have; k < g; k++) {
        const pl = document.createElement("i");
        plates.appendChild(pl);
        if (animate) gsap.fromTo(pl, { scale: 0 }, { scale: 1, duration: 0.4, delay: (k - have) * 0.015, ease: "back.out(3)" });
      }
      for (let k = have; k > g; k--) plates.lastElementChild.remove();
      const t = kg < 3 ? "1" : kg < 6 ? "2" : "3";
      const [lo, hi] = t === "1" ? [1.5, 3] : t === "2" ? [3, 6] : [6, 11];
      cake.style.setProperty("--k", (0.78 + 0.27 * Math.min(1, (kg - lo) / (hi - lo))).toFixed(3));
      if (t !== tiers) {
        if (tiers && animate) gsap.fromTo(cake, { rotation: t > tiers ? -6 : 6 }, { rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.3)", transformOrigin: "50% 100%" });
        tiers = t;
        el.dataset.tiers = t;
      }
      if (txt === last) return;
      last = txt;
      out.textContent = txt;
      if (animate) gsap.fromTo(out, { scale: 1.15 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
    };
    input.addEventListener("input", (e) => { if (e.isTrusted) touched = true; set(); });
    set();
    if (!live) return NOOP;

    let demo = null;
    return {
      // a quick demo: the slider runs from a few guests up to a party of fourteen
      enter() {
        if (touched) return;
        if (demo) demo.kill();
        const o = { g: 4 };
        input.value = 4;
        set();
        demo = gsap.to(o, { g: 14, duration: 1.8, delay: 0.5, ease: "power2.inOut", onUpdate: () => { if (touched) return demo.kill(); input.value = Math.round(o.g); set(); } });
      },
      leave() { if (demo) demo.kill(); },
    };
  }

  // 04 · the request is typed into the compose bar, sent with a paper plane, read, and answered
  function chat(sec, fx) {
    const el = $("[data-chat]", sec);
    const msgs = $$(".x-pv-chat__msg", el);
    const [m1, m2, reply] = msgs;
    const typing = $(".x-pv-chat__typing", el);
    const pic = $(".x-pv-chat__pic", el);
    const field = $("[data-chat-field]", el);
    const plane = $(".x-pv-chat__send svg", el);
    const status = $("[data-chat-status]", el);
    const PH = field.textContent;
    const react = document.createElement("i");
    react.className = "x-pv-chat__react";
    react.textContent = "♥";
    m1.appendChild(react);
    if (!live) return NOOP;

    let tl = null;
    const reset = () => {
      if (tl) tl.kill();
      gsap.set([...msgs, pic, typing, react], { autoAlpha: 0 });
      gsap.set(plane, { x: 0, y: 0, rotation: 0, opacity: 1 });
      el.classList.remove("is-read");
      field.textContent = PH;
      field.classList.add("is-ph");
      status.textContent = "онлайн";
    };
    const type = (msg) => {
      const text = $("span", msg).textContent;
      const o = { n: 0 };
      return gsap.to(o, {
        n: text.length,
        duration: text.length * 0.032,
        ease: "none",
        onStart: () => field.classList.remove("is-ph"),
        onUpdate: () => { field.textContent = text.slice(0, Math.round(o.n)); },
      });
    };
    const send = (msg) => gsap.timeline()
      .to(plane, { x: 34, y: -30, rotation: -20, opacity: 0, duration: 0.3, ease: "power2.in" })
      .call(() => { field.textContent = ""; })
      .fromTo(msg, { autoAlpha: 0, y: 26, scale: 0.8, transformOrigin: "100% 100%" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, 0.1)
      .fromTo(plane, { x: -16, y: 12, rotation: 0, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, 0.35);
    reset();
    return {
      enter() {
        reset();
        tl = gsap.timeline({ delay: 0.5 })
          .add(type(m1))
          .add(send(m1), "+=0.15")
          .add(send(pic), "+=0.35")
          .add(type(m2), "+=0.3")
          .add(send(m2), "+=0.15")
          .call(() => { field.textContent = PH; field.classList.add("is-ph"); el.classList.add("is-read"); status.textContent = "друкує…"; }, null, "+=0.4")
          .to(typing, { autoAlpha: 1, duration: 0.2 })
          .to(typing, { autoAlpha: 0, duration: 0.15 }, "+=1.2")
          .fromTo(reply, { autoAlpha: 0, y: 20, scale: 0.8, transformOrigin: "0% 100%" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, "<")
          .call(() => { status.textContent = "онлайн"; })
          .fromTo(react, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" }, "+=0.3")
          .call(() => fx.hearts(react, 4), null, "<");
      },
      leave: reset,
    };
  }

  // 05 · the calendar flips day by day to the booked date, circles it, and the wax seal is stamped down
  function booking(sec, fx) {
    const el = $(".x-pv-date", sec);
    const ticket = $(".x-pv-date__ticket", el);
    const day = $("[data-date-day]", el);
    const month = $("[data-date-month]", el);
    const ring = $(".x-pv-date__ring", el);
    const seal = $(".x-pv-date__seal", el);
    if (!live) return NOOP;

    let tl = null;
    const show = (d) => { day.textContent = d.getDate(); month.textContent = MONTHS_OF[d.getMonth()]; };
    const reset = () => {
      if (tl) tl.kill();
      show(new Date());
      gsap.set(ring, { strokeDashoffset: 1 });
      gsap.set(seal, { opacity: 0 });
      gsap.set([day, ticket], { clearProps: "transform" });
    };
    reset();
    return {
      enter() {
        reset();
        tl = gsap.timeline({ delay: 0.4 });
        const now = Date.now();
        // ten flips, quick at first and slowing down onto the date
        for (let k = 1; k <= 10; k++) {
          const dur = 0.05 + (k / 10) ** 3 * 0.32;
          tl.to(day, { rotationX: 90, duration: dur, ease: "power1.in", transformPerspective: 300 })
            .call(() => show(new Date(now + k * 864e5)))
            .fromTo(day, { rotationX: -90 }, { rotationX: 0, duration: dur, ease: "power1.out", transformPerspective: 300 });
        }
        tl.to(ring, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, "+=0.05")
          .fromTo(seal, { opacity: 0, scale: 3.2, rotation: -60 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.32, ease: "power4.in" }, "+=0.1")
          .call(() => fx.wax(seal))
          .fromTo(ticket, { x: -8, y: 4 }, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" })
          .fromTo(seal, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.35)" }, "<");
      },
      leave: reset,
    };
  }

  // 06 · the cake box rattles, the lid flies off, the cake rises out and stars twinkle
  function cakeBox(sec, fx) {
    const btn = $("[data-box]", sec);
    const open = (on) => {
      if (btn.classList.contains("is-open") === on) return;
      btn.classList.toggle("is-open", on);
      btn.setAttribute("aria-label", on ? "Закрити коробку" : "Відкрити коробку");
      if (on) { fx.pop($(".x-pv-box__peek", btn), 26, 0.9); fx.hearts(btn, 4); }
    };
    btn.addEventListener("click", () => open(!btn.classList.contains("is-open")));
    if (!live) return { open, ...NOOP };

    let tl = null;
    return {
      open,
      enter() {
        if (tl) tl.kill();
        open(false);
        tl = gsap.timeline({ delay: 0.4 })
          .to(btn, { keyframes: [{ rotation: 7 }, { rotation: -6 }, { rotation: 5 }, { rotation: -3 }, { rotation: 0 }], duration: 0.7, ease: "power1.inOut", transformOrigin: "50% 100%" })
          .to(btn, { scaleY: 0.92, scaleX: 1.05, duration: 0.12, transformOrigin: "50% 100%" })
          .to(btn, { scaleY: 1, scaleX: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" })
          .call(() => open(true), null, "<");
      },
      leave() {
        if (tl) tl.kill();
        gsap.set(btn, { clearProps: "transform" });
        open(false);
      },
    };
  }

  // the finale cake: blow out every candle for a wish, then they light up again
  function candles(sec, fx) {
    const all = $$(".x-path__candle", sec);
    const hint = $("[data-candle-hint]", sec);
    const text = hint.textContent;
    all.forEach((c) => c.addEventListener("click", () => {
      if (c.classList.contains("is-out") || c.classList.contains("is-unlit")) return;
      c.classList.add("is-out");
      c.setAttribute("aria-label", "Свічку задуто");
      if (all.every((x) => x.classList.contains("is-out"))) {
        hint.textContent = "бажання прийнято ✦";
        fx.pop($(".x-path__cake", sec), 40, 1.2);
        fx.hearts($(".x-path__cake", sec), 6);
        setTimeout(() => {
          all.forEach((x) => { x.classList.remove("is-out"); x.setAttribute("aria-label", "Задути свічку"); });
          hint.textContent = text;
        }, 3200);
      }
    }));
  }

  MARIDAY.onReady(init);
})();
