/* Mariday home — how to order: the making of your cake.
   One cake stand stays in the middle of the screen while the six chapters scroll past it. The cake on it is
   sketched from a reference (a pencil draws it from the cake's own photo), cut open and filled with the chosen
   flavour, weighed on the stand turned kitchen scale, photographed into a chat, booked with a wax seal, then
   painted and piped into the real cake and packed into a box — and at the end the bow is pulled and the box
   opens on it with the candles lit. Every chapter has a settled state, so scrolling back rewinds cleanly. */
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
    { name: "фісташка-малина", desc: "горіховий бісквіт · кремчиз з фісташкою · малинове конфі", c: { sp: "#c9d89a", cr: "#fbf6ea", fi: "#d8344f", tp: "#f6eadb", dc: "#d8344f" } },
    { name: "kinder bueno", desc: "шоколадний бісквіт · фундучне праліне · вафельна крихта", c: { sp: "#6b3a22", cr: "#f4e6d0", fi: "#c08a52", tp: "#7a4428", dc: "#f4e6d0" } },
    { name: "лісові ягоди", desc: "шифон · кремчиз · малина, вишня, смородина", c: { sp: "#f3dca8", cr: "#fff8ef", fi: "#8c2245", tp: "#fffaf3", dc: "#6d1a3c" } },
    { name: "малина-лимон", desc: "лимонний сироп · малинове конфі · лимонний гель", c: { sp: "#f7e38a", cr: "#fffaf0", fi: "#e8506a", tp: "#fff4c2", dc: "#e8506a" } },
  ];
  const TITLES = ["дизайн", "начинка", "вага", "заявка", "передоплата", "свято"];
  const SWASH = '<svg class="x-make__swash" viewBox="0 0 220 26" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4,16 C30,4 52,24 80,14 S128,4 150,15 S196,22 216,8"/></svg>';
  // the drawing's design space: twice the paper (320 × 350 scene px); the cake stands on the cut line CX at BY
  const PW = 640, PH = 700, CX = 320, BY = PH * 0.975;
  const PAPER = { x: 70, y: 120, w: 320, h: 350 };
  const bookedDate = () => new Date(Date.now() + 10 * 864e5);
  const kgOf = (g) => Math.max(1.5, Math.round(g * 0.18 * 2) / 2);
  const fmtKg = (kg) => String(kg).replace(".", ",");
  const sizeOf = (kg) => `Ø ${Math.round(14 + kg * 2.6)} см · ${Math.round(kg * 5.6)} порцій`;
  const breathe = () => new Promise((r) => setTimeout(r, 0));

  function burst(host, x, y, count = 30, spread = 1, colors = SPRINKLE_COLORS, tag = "i") {
    if (!hasLibs || reduce) return;
    for (let i = 0; i < count; i++) {
      const sp = document.createElement(tag);
      sp.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]}`;
      host.appendChild(sp);
      const a = Math.random() * Math.PI * 2;
      const d = gsap.utils.random(70, 200) * spread;
      gsap.fromTo(sp, { x: 0, y: 0, rotation: gsap.utils.random(0, 180), scale: 0.4 }, {
        x: Math.cos(a) * d, y: Math.sin(a) * d * 0.75 + 70, rotation: "+=" + gsap.utils.random(-400, 400), scale: 1, opacity: 0,
        duration: gsap.utils.random(0.9, 1.5), ease: "power2.out", onComplete: () => sp.remove(),
      });
    }
  }

  /* ─── the drawing: a pencil sketch and a watercolour wash made from the cake's own cut-out ───
     The sketch is a colour-dodge of a blurred copy (dark wherever a pixel is darker than its neighbourhood) plus
     the silhouette and some hatching in the shadows; the wash is a blurred, brighter copy. The work is split
     into short tasks so scrolling never stutters while a design is prepared. */
  function boxBlur(src, w, h, r) {
    const tmp = new Float32Array(src.length), out = new Float32Array(src.length), k = 1 / (2 * r + 1);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let acc = 0;
      for (let x = -r; x <= r; x++) acc += src[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        tmp[row + x] = acc * k;
        acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = acc * k;
        acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    return out;
  }
  async function softened(a, r, passes) {
    for (let i = 0; i < passes; i++) { a = boxBlur(a, PW, PH, r); await breathe(); }
    return a;
  }

  async function sketchCake(img) {
    const c = document.createElement("canvas");
    c.width = PW; c.height = PH;
    const g = c.getContext("2d", { willReadFrequently: true });
    const s = Math.min((PW * 0.9) / img.naturalWidth, (PH * 0.9) / img.naturalHeight);
    const box = [(PW - img.naturalWidth * s) / 2, BY - img.naturalHeight * s, img.naturalWidth * s, img.naturalHeight * s];
    g.drawImage(img, ...box);
    const d = g.getImageData(0, 0, PW, PH).data; // throws for a cross-origin image, e.g. a page opened from disk
    const N = PW * PH;
    const L = new Float32Array(N), A = new Float32Array(N), R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
    const rowW = new Int32Array(PH), rowL = new Int32Array(PH).fill(PW), rowR = new Int32Array(PH);
    let x0 = PW, y0 = PH, x1 = 0, y1 = 0, tr = 0, tg = 0, tb = 0, tw = 0;
    for (let i = 0; i < N; i++) {
      const a = d[i * 4 + 3] / 255, r = d[i * 4] / 255, gg = d[i * 4 + 1] / 255, b = d[i * 4 + 2] / 255;
      A[i] = a;
      L[i] = (0.3 * r + 0.59 * gg + 0.11 * b) * a + 1 - a;
      R[i] = r * a; G[i] = gg * a; B[i] = b * a;
      if (a > 0.5) {
        const x = i % PW, y = (i / PW) | 0;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
        rowW[y]++;
        if (x < rowL[y]) rowL[y] = x;
        if (x > rowR[y]) rowR[y] = x;
        // the brush takes the cake's most vivid colour
        const sat = Math.max(r, gg, b) - Math.min(r, gg, b), w = sat * sat * sat;
        tr += r * w; tg += gg * w; tb += b * w; tw += w;
      }
    }
    if (x1 < x0) throw new Error("empty image");
    // the body of the cake: the longest run of rows nearly as wide as the widest one (toppers and stems are narrow)
    let maxW = 0;
    for (let y = 0; y < PH; y++) if (rowW[y] > maxW) maxW = rowW[y];
    let rim = y0, base = y1, runStart = -1, best = 0;
    for (let y = 0; y <= PH; y++) {
      const wide = y < PH && rowW[y] >= maxW * 0.55;
      if (wide && runStart < 0) runStart = y;
      if (!wide && runStart >= 0) {
        if (y - runStart > best) { best = y - runStart; rim = runStart; base = y - 1; }
        runStart = -1;
      }
    }
    const ry = Math.min(base, rim + 6);
    await breathe();
    const Lb = await softened(L, 3, 3);
    const Ab = await softened(A, 2, 2);
    const sk = new ImageData(PW, PH), o = sk.data;
    for (let y = 0; y < PH; y++) {
      for (let x = 0; x < PW; x++) {
        const i = y * PW + x;
        let dark = Math.max(0, 1 - L[i] / Math.max(0.02, Lb[i])) * 4.2 + Math.min(1, Math.abs(A[i] - Ab[i]) * 5);
        const tone = (1 - Lb[i]) * A[i];
        if (tone > 0.32 && (x + y) % 7 === 0) dark += (tone - 0.25) * 1.1;
        if (tone > 0.6 && (x - y + PH) % 9 === 0) dark += (tone - 0.5) * 1.1;
        o[i * 4] = 70; o[i * 4 + 1] = 38; o[i * 4 + 2] = 40;
        o[i * 4 + 3] = Math.min(1, dark) * (0.72 + Math.random() * 0.28) * 255;
      }
    }
    await breathe();
    const Rb = await softened(R, 4, 2), Gb = await softened(G, 4, 2), Bb = await softened(B, 4, 2), Aw = await softened(A, 4, 2);
    const wa = new ImageData(PW, PH), q = wa.data;
    for (let i = 0; i < N; i++) {
      const a = Aw[i];
      if (a < 0.01) continue;
      const r = Rb[i] / a, gg = Gb[i] / a, b = Bb[i] / a, l = 0.3 * r + 0.59 * gg + 0.11 * b;
      // more saturated, then lifted towards the paper
      q[i * 4] = ((l + (r - l) * 1.35) * 0.82 + 0.18) * 255;
      q[i * 4 + 1] = ((l + (gg - l) * 1.35) * 0.82 + 0.18) * 255;
      q[i * 4 + 2] = ((l + (b - l) * 1.35) * 0.82 + 0.18) * 255;
      q[i * 4 + 3] = Math.min(1, a * 1.1) * 0.8 * 255;
    }
    const toCanvas = (id) => {
      const cc = document.createElement("canvas");
      cc.width = PW; cc.height = PH;
      cc.getContext("2d").putImageData(id, 0, 0);
      return cc;
    };
    const bbox = [x0, y0, x1, y1];
    const hex = (v) => Math.round(Math.min(1, v) * 255);
    return {
      img, box, bbox, rim, base, rimL: rowL[ry], rimR: rowR[ry],
      sketch: toCanvas(sk), wash: toCanvas(wa),
      tint: tw ? `rgb(${hex(tr / tw)},${hex(tg / tw)},${hex(tb / tw)})` : "#e2849a",
      scrib: scribble(bbox), blobs: blobs(bbox),
    };
  }
  // what the pencil, brush and bag can work with when the image can't be read: the photo is simply shown instead
  const plainArt = () => ({ img: null, bbox: [160, 120, 480, 682], rim: 230, base: 630, rimL: 190, rimR: 450, scrib: scribble([160, 120, 480, 682]), blobs: blobs([160, 120, 480, 682]), tint: "#e2849a" });

  // the pencil's route: rows of loops, left to right and back, top to bottom; a fat stroke along it reveals the sketch
  function scribble([x0, y0, x1, y1]) {
    x0 -= 16; x1 += 16; y0 -= 16; y1 += 10;
    const rows = Math.max(4, Math.round((y1 - y0) / 95));
    const gap = (y1 - y0) / rows, r = gap * 0.72;
    const pts = [];
    for (let i = 0; i <= rows; i++) {
      const y = y0 + gap * i, ltr = i % 2 === 0;
      const loops = Math.max(2, Math.round((x1 - x0) / (r * 3)));
      const n = loops * 18;
      for (let k = 0; k <= n; k++) {
        const t = k / n, th = t * loops * Math.PI * 2 + i;
        const x = ltr ? x0 + (x1 - x0) * t : x1 - (x1 - x0) * t;
        pts.push([x + Math.cos(th) * r * 0.75 * (ltr ? 1 : -1), y + Math.sin(th) * r * 0.9]);
      }
    }
    const len = [0];
    for (let k = 1; k < pts.length; k++) len.push(len[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    return { pts, len, w: gap * 1.7 };
  }
  // where the brush drops colour: two columns of three, snaking down, big enough to overlap into one wash
  function blobs([x0, y0, x1, y1]) {
    const cw = (x1 - x0) / 2, ch = (y1 - y0) / 3, R = Math.hypot(cw, ch) * 0.64;
    const out = [];
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 2; i++) {
        const c = j % 2 ? 1 - i : i;
        out.push({ x: x0 + cw * (c + 0.5) + (Math.random() - 0.5) * cw * 0.3, y: y0 + ch * (j + 0.5) + (Math.random() - 0.5) * ch * 0.3, r: R * (0.95 + Math.random() * 0.2), s: Math.random() * 6 });
      }
    }
    return out;
  }
  // a watery blot: a circle with a wobbly rim
  function blot(g, b, f) {
    if (f <= 0) return;
    const r = b.r * f;
    for (let k = 0; k <= 30; k++) {
      const a = (k / 30) * Math.PI * 2, rr = r * (1 + 0.1 * Math.sin(a * 3 + b.s) + 0.06 * Math.sin(a * 7 + b.s * 2));
      const x = b.x + Math.cos(a) * rr, y = b.y + Math.sin(a) * rr;
      if (k) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.closePath();
  }

  function init() {
    const sec = $(".x-make");
    if (!sec) return;
    const burstHost = $(".x-make__burst", sec);
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
          c.style.cssText = `left:${x + gsap.utils.random(-1, 1) * Math.max(r.width, 520)}px;top:${y - r.height / 2 - 160}px;background:${SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]}`;
          burstHost.appendChild(c);
          gsap.fromTo(c, { y: gsap.utils.random(-80, 0), rotation: gsap.utils.random(0, 360), opacity: 1 }, { y: gsap.utils.random(420, 720), x: "+=" + gsap.utils.random(-70, 70), rotation: "+=" + gsap.utils.random(300, 900), opacity: 0, duration: gsap.utils.random(1.8, 3), delay: gsap.utils.random(0, 0.8), ease: "power1.in", onComplete: () => c.remove() });
        }
      },
    };

    glaze(sec);
    const opener = opening(sec, fx);
    const order = { design: 0, flavor: 0, guests: 14, pickup: 0 };
    const stage = makeStage(sec, fx, order);
    const steps = $$(".x-make__st", sec);
    const liveText = $("[data-make-live]", sec);
    candles(sec, fx);

    $("[data-make-go]", sec).addEventListener("click", () => {
      const r = steps[0].getBoundingClientRect();
      const y = scrollY + r.top - innerHeight * 0.12;
      if (window.marLenis) window.marLenis.scrollTo(y, { duration: 1.6 });
      else scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    });

    if (!live) {
      steps.forEach((s) => s.classList.add("is-on"));
      sec.classList.add("is-party");
      stage.static();
      return;
    }
    sec.classList.add("is-live");

    // sprinkles scattered around the edges, drifting at different depths while the section scrolls by
    const SPRINKLES = [[4, 6, -30], [95, 9, 40], [3, 30, -60], [97, 34, 20], [6, 52, 75], [94, 58, -15], [3, 76, 50], [96, 82, -45], [8, 94, 30], [92, 97, 65]];
    const host = document.createElement("div");
    host.className = "x-make__sprinkles";
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

    // every chapter: its text entrance, and the giant outlined number drifting behind it at its own pace
    const cards = steps.map((st) => {
      const ghost = $(".x-make__ghost", st);
      gsap.fromTo(ghost, { yPercent: -35 }, { yPercent: 35, ease: "none", scrollTrigger: { trigger: st, start: "top bottom", end: "bottom top", scrub: 0.8 } });
      return cardIn(st);
    });

    // which chapter the reader is at: 0 = before the first, 1–6 = the chapters, 7 = the party at the end
    let cur = 0;
    const setStep = (n) => {
      if (n === cur) return;
      const prev = cur;
      cur = n;
      steps.forEach((s, k) => { s.classList.toggle("is-on", k < n); s.classList.toggle("is-here", k === n - 1); });
      if (n > prev) for (let k = prev; k < Math.min(n, 6); k++) cards[k].restart();
      else for (let k = n; k < 6; k++) cards[k].pause(0);
      sec.classList.toggle("is-party", n === 7);
      liveText.textContent = n === 0 ? "" : n === 7 ? "Торт готовий — коробка відкрита" : `Крок ${n} з 6: ${TITLES[n - 1]}`;
      stage.go(n);
    };
    steps.forEach((st, i) => ScrollTrigger.create({
      trigger: st, start: "top 15%", end: "bottom 15%",
      onToggle: (self) => { if (self.isActive) setStep(i + 1); else if (self.direction < 0 && i === 0) setStep(0); },
    }));
    ScrollTrigger.create({ trigger: $("[data-fin]", sec), start: "top 98%", onEnter: () => setStep(7), onLeaveBack: () => setStep(6) });
  }

  // a chapter's text: the number rolls like an odometer, words jump in, the script word is written and underlined,
  // the controls and the link tickets drop in. Built paused at its start, so the chapter waits until it is reached.
  function cardIn(st) {
    const card = $(".x-make__card", st);
    const no = $(".x-make__no", card);
    const h3 = $("h3", card);
    const em = $("em", h3);
    [...no.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).forEach((n) => {
      const frag = document.createDocumentFragment();
      // the real number stays as text for copying and screen readers; the rolling columns are decoration
      const real = document.createElement("span");
      real.className = "x-make__sr";
      real.textContent = n.textContent.trim();
      frag.appendChild(real);
      [...n.textContent.trim()].forEach((d) => {
        const odo = document.createElement("span");
        odo.className = "x-make__odo";
        odo.setAttribute("aria-hidden", "true");
        odo.innerHTML = `<span data-d="${d}">${"<i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i>".repeat(2)}</span>`;
        frag.appendChild(odo);
      });
      n.replaceWith(frag);
    });
    [...h3.childNodes].filter((n) => n.nodeType === 3).forEach((n) => {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) return frag.appendChild(document.createTextNode(w));
        const s = document.createElement("span");
        s.className = "x-make__wd";
        s.textContent = w;
        frag.appendChild(s);
      });
      n.replaceWith(frag);
    });
    em.insertAdjacentHTML("beforeend", SWASH);

    const cols = $$(".x-make__odo > span", no);
    const words = $$(".x-make__wd", h3);
    const p = $(":scope > p:not(.x-make__no):not(.x-make__note)", card);
    const ctl = $(".x-make__ctl", card);
    const tags = $$(".x-make__tag", card);
    const note = $(".x-make__note", card);
    const tl = gsap.timeline({ paused: true, onStart: () => card.classList.add("is-anim"), onComplete: () => card.classList.remove("is-anim") });
    tl.fromTo(cols, { yPercent: 0 }, { yPercent: (i, el) => -((10 + +el.dataset.d) / 20) * 100, duration: 1.4, stagger: 0.15, ease: "expo.out" }, 0)
      .fromTo(words, { yPercent: 110, opacity: 0, rotation: 8 }, { yPercent: 0, opacity: 1, rotation: 0, duration: 0.7, stagger: 0.07, ease: "back.out(1.8)" }, 0.1)
      .fromTo(em, { clipPath: "inset(-80% 130% -80% -30%)" }, { clipPath: "inset(-80% -30% -80% -30%)", duration: 0.9, ease: "power2.inOut" }, 0.3)
      .fromTo($(".x-make__swash path", em), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, 1)
      .fromTo(p, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" }, 0.45);
    if (ctl) tl.fromTo(ctl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" }, 0.6);
    tl.fromTo(tags, { y: -60, opacity: 0, rotation: (i) => (i % 2 ? 1 : -1) * 28 }, { y: 0, opacity: 1, rotation: 0, duration: 1, stagger: 0.1, ease: "elastic.out(1, 0.55)", clearProps: "transform" }, 0.7);
    if (note) tl.fromTo(note, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(3)" }, 1.2);
    tl.progress(1).progress(0);
    return tl;
  }

  // the opening: the letters of the title carry their own slice of glaze, the glaze drips off them, a piping bag
  // writes the script word, ingredients float round
  function opening(sec, fx) {
    const head = $(".x-make__head", sec);
    const title = $(".x-make__title", head);
    const w1 = $(".x-make__w1", head);
    const inner = $(".x-make__w1 > span", head);
    const script = $(".x-make__script", head);
    const bag = $(".x-make__bag", head);
    const floats = $$(".x-fl", head);
    const animate = hasLibs && !reduce;

    // split the glazed word into letters, grouped per word so a line can only break between words
    const letters = [];
    [...inner.childNodes].forEach((n) => {
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(" ").forEach((word, k) => {
        if (k) frag.appendChild(document.createTextNode(" "));
        const wd = document.createElement("span");
        wd.className = "x-make__word";
        [...word].forEach((ch) => {
          const s = document.createElement("span");
          s.className = "x-make__lt";
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
    drips.className = "x-make__drips";
    w1.appendChild(drips);
    let dripEls = [];
    let dripsHidden = false;
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
    const HIDE = "inset(-80% 125% -80% -30%)";
    gsap.set(script, { clipPath: HIDE });
    const nozzle = (p) => {
      const sr = script.getBoundingClientRect(), tr = title.getBoundingClientRect();
      return { x: sr.left - tr.left + sr.width * (0.05 + 0.9 * p), y: sr.top - tr.top + sr.height * (0.74 - 0.4 * p) + Math.sin(p * Math.PI * 10) * sr.height * 0.1 };
    };
    const place = (x, y, tilt) => { bag.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) rotate(${tilt.toFixed(1)}deg)`; };
    const writeScript = () => {
      const o = { p: 0, f: 0 };
      return gsap.timeline()
        .set(bag, { opacity: 1 })
        .to(o, { f: 1, duration: 0.55, ease: "power2.out", onUpdate: () => {
          const a = nozzle(0), tr = title.getBoundingClientRect();
          place(tr.width + 60 + (a.x - tr.width - 60) * o.f, -120 + (a.y + 120) * o.f, 30 - 58 * o.f);
        } })
        .to(o, { p: 1, duration: 1.5, ease: "power1.inOut", onUpdate: () => {
          const a = nozzle(o.p);
          place(a.x, a.y, -28 + Math.sin(o.p * Math.PI * 10) * 9);
          script.style.clipPath = `inset(-80% ${((1 - o.p) * 155 - 30).toFixed(1)}% -80% -30%)`;
        } })
        .call(() => { script.style.clipPath = "none"; fx.pop(bag, 16, 0.5); })
        .to(bag, { y: "-=140", x: "+=80", rotation: 25, opacity: 0, duration: 0.6, ease: "power2.in" });
    };

    return {
      intro() {
        dripsHidden = true;
        gsap.set(dripEls, { scaleY: 0 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: head, start: "top 75%", once: true } });
        tl.from(floats, { scale: 0, opacity: 0, duration: 0.9, stagger: 0.05, ease: "back.out(2.4)" }, 0)
          .from(letters, { yPercent: -280, rotation: () => gsap.utils.random(-45, 45), opacity: 0, duration: 1, stagger: 0.07, ease: "bounce.out" }, 0.15)
          .call(() => {
            dripsHidden = false;
            gsap.fromTo(dripEls, { scaleY: 0 }, { scaleY: 1, duration: 1.4, stagger: { each: 0.04, from: "random" }, ease: "elastic.out(1, 0.55)" });
          }, null, 1.05)
          .add(writeScript(), 1.2)
          .from([".x-make__sub", ".x-make__cta"], { y: 18, opacity: 0, duration: 0.9, stagger: 0.12, ease: "expo.out" }, 1.6)
          .fromTo(".x-make__sub mark", { backgroundSize: "0% 0.42em" }, { backgroundSize: "100% 0.42em", duration: 0.8, ease: "power2.inOut" }, 2.1)
          .from(".x-make__head .x-make__call", { scale: 0, opacity: 0, duration: 0.7, stagger: 0.2, ease: "back.out(2.5)" }, 2.6);
      },
    };
  }

  // the wet highlight on the glazed title follows the pointer
  function glaze(sec) {
    const w = $(".x-make__w1 > span", sec);
    if (!w || !matchMedia("(hover: hover) and (pointer: fine)").matches || reduce) return;
    sec.addEventListener("pointermove", (e) => {
      const r = w.getBoundingClientRect();
      w.style.setProperty("--gx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    });
  }

  // the finale cake: blow out every candle for a wish, then they light up again
  function candles(sec, fx) {
    const all = $$(".x-mk-candle", sec);
    const hint = $("[data-candle-hint]", sec);
    const text = hint.textContent;
    all.forEach((c) => c.addEventListener("click", () => {
      if (c.classList.contains("is-out") || c.classList.contains("is-unlit")) return;
      c.classList.add("is-out");
      c.setAttribute("aria-label", "Свічку задуто");
      if (all.every((x) => x.classList.contains("is-out"))) {
        hint.textContent = "бажання прийнято ✦";
        fx.pop($("[data-paper]", sec), 40, 1.2);
        fx.hearts($("[data-paper]", sec), 6);
        setTimeout(() => {
          all.forEach((x) => { x.classList.remove("is-out"); x.setAttribute("aria-label", "Задути свічку"); });
          hint.textContent = text;
        }, 3200);
      }
    }));
  }

  /* ═══ the stage ═══ */
  function makeStage(sec, fx, order) {
    const stage = $("[data-stage]", sec);
    const scene = $("[data-scene]", stage);
    const q = (s) => $(s, scene);
    const line = q("[data-line]"), string = q(".x-mk-string path"), refs = $$("[data-ref]", scene), yours = q(".x-mk-ref--yours");
    const ghost = q(".x-mk-ghost");
    const paper = q("[data-paper]"), sheet = q(".x-mk-paper__sheet"), tape = q(".x-mk-paper__tape"), head = q(".x-mk-paper__head");
    const still = q("[data-still]"), cv = q("[data-cv]"), sketchNo = q("[data-sketch-no]"), sketchName = q("[data-sketch-name]");
    const slice = q("[data-slice]"), berry = q(".x-mk-slice__berry"), layers = $$(".x-mk-slice > i:not(.x-mk-slice__berry)", scene);
    const pencil = q('[data-tool="pencil"]'), brush = q('[data-tool="brush"]'), bag = q('[data-tool="bag"]'), knife = q("[data-knife]");
    const dial = q("[data-dial]"), needle = q(".x-mk-dial__needle"), dialKg = q("[data-dial-kg]");
    const phone = q("[data-phone]"), flash = q("[data-flash]"), shot = q("[data-shot]"), shotImg = q("[data-shot-img]");
    const ticket = q("[data-ticket]");
    const box = q("[data-box]"), back = q(".x-mk-box__back"), sides = $$(".x-mk-box__side", scene), frontWall = q(".x-mk-box__front"), sticker = q("[data-sticker]");
    const lid = q(".x-mk-box__lid"), ribV = q(".x-mk-box__rib--v"), ribH = q(".x-mk-box__rib--h"), bow = q("[data-bow]"), tag = q("[data-tag]");
    const garland = q("[data-garland]"), gstring = q(".x-mk-garland path"), flags = $$(".x-mk-garland i", scene);
    const lights = $$(".x-mk-candle", scene), cherry = q("[data-cherry]"), fxHost = q("[data-fx]");
    const wish = $$(".x-make__fin h3 em", sec);
    const animate = hasLibs && !reduce;
    const designs = refs.map((r) => ({ cut: r.dataset.cut, photo: $("img", r).getAttribute("src"), name: r.dataset.name, short: r.dataset.short }));
    flags.forEach((f, i) => {
      const t = (i + 1) / (flags.length + 1);
      f.style.left = `${t * 100}%`;
      f.style.top = `${(1 - t) * (1 - t) * 6 + 2 * (1 - t) * t * 50 + t * t * 6}px`;
    });

    // ── the designs: prepared ahead of time, while the section is still a little way off ──
    const made = [];
    const prepare = (i) => made[i] || (made[i] = new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => sketchCake(im).then(res, rej);
      im.onerror = rej;
      im.src = designs[i].cut;
    }));
    let art = null;
    let noCanvas = false;
    const load = async (i) => {
      try { art = await prepare(i); paper.classList.remove("is-still"); }
      catch (e) { art = plainArt(); noCanvas = true; paper.classList.add("is-still"); }
      still.src = designs[i].cut;
    };

    // ── the spec of the order, printed wherever it shows ──
    const flavor = () => FLAVORS[order.flavor];
    const kgText = () => `${fmtKg(kgOf(order.guests))} кг · ${order.guests} гостей`;
    const dateText = () => { const d = bookedDate(); return `${d.getDate()} ${MONTHS_OF[d.getMonth()]}`; };
    const spec = () => {
      const dz = designs[order.design];
      sketchName.textContent = dz.name;
      sketchNo.textContent = String(17 + order.design).padStart(3, "0");
      q("[data-spec-design]").textContent = dz.short;
      q("[data-spec-flavor]").textContent = flavor().name;
      q("[data-spec-kg]").textContent = kgText();
      q("[data-tag-1]").textContent = `${dz.short} · ${flavor().name}`;
      q("[data-tag-2]").textContent = kgText();
      q("[data-tag-3]").textContent = dateText();
      q("[data-chat-m1]").textContent = `Привіт! Хочу такий торт на ${order.guests} гостей 🍰`;
      q("[data-chat-m2]").textContent = `начинка — ${flavor().name} ♥`;
      sticker.textContent = order.pickup ? "доставка · по NL" : "самовивіз · Alkmaar";
      q("[data-chat-pic]").src = shotImg.src = dz.photo;
      dialKg.textContent = fmtKg(kgOf(order.guests));
    };

    // ── drawing ──
    const S = { sk: 0, cut: 0, z: 1, g: 1, wa: 0, re: 0 };
    const g = cv.getContext("2d");
    const mask = document.createElement("canvas"), mg = mask.getContext("2d");
    const tmp = document.createElement("canvas"), tg = tmp.getContext("2d");
    mask.width = tmp.width = PW;
    mask.height = tmp.height = PH;
    let inked = 0, sc = 1;
    const zoom = () => S.z * S.g;
    // a point of the drawing (PW space) in scene pixels, with the drawing's zoom about the cake's foot
    const at = (px, py) => { const zz = zoom(); return [PAPER.x + (CX + (px - CX) * zz) / 2, PAPER.y + (BY + (py - BY) * zz) / 2]; };
    const front = (p) => art.bbox[0] - 70 + (art.bbox[2] - art.bbox[0] + 140) * p;
    const grow = (p, i, n) => { const t = Math.max(0, Math.min(1, (p - (0.7 * i) / n) / 0.3)); return 1 - (1 - t) ** 3; };
    const draw = () => {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, cv.width, cv.height);
      if (!art || !art.sketch) return;
      const zz = zoom();
      g.setTransform(sc, 0, 0, sc, 0, 0);
      g.translate(CX, BY); g.scale(zz, zz); g.translate(-CX, -BY);
      if (S.re >= 1 && S.cut <= 0) { g.drawImage(art.img, ...art.box); return; }
      const base = () => {
        if (S.wa > 0) {
          g.save();
          if (S.wa < 1) { g.beginPath(); art.blobs.forEach((b, i) => blot(g, b, grow(S.wa, i, art.blobs.length))); g.clip(); }
          g.drawImage(art.wash, 0, 0);
          g.restore();
        }
        if (S.sk >= 1) g.drawImage(art.sketch, 0, 0);
        else if (S.sk > 0) {
          tg.globalCompositeOperation = "source-over";
          tg.clearRect(0, 0, PW, PH);
          tg.drawImage(art.sketch, 0, 0);
          tg.globalCompositeOperation = "destination-in";
          tg.drawImage(mask, 0, 0);
          g.drawImage(tmp, 0, 0);
        }
      };
      if (S.cut > 0) {
        // the left half stays; the right half slides away and leans back, showing the cut face between them
        g.save(); g.beginPath(); g.rect(-PW, -PH, PW + CX, PH * 3); g.clip(); base(); g.restore();
        g.save();
        g.translate(CX + 100 * S.cut, BY); g.rotate((7 * S.cut * Math.PI) / 180); g.translate(-CX, -BY);
        g.beginPath(); g.rect(CX, -PH, PW, PH * 3); g.clip(); base();
        g.restore();
      } else base();
      if (S.re > 0 && S.re < 1) {
        // the real cake is piped on from the left, behind a wavy edge of cream with a shine running along it
        const f = front(S.re);
        g.save();
        g.beginPath(); g.moveTo(-10, -10);
        for (let y = -10; y <= PH + 12; y += 12) g.lineTo(f + Math.sin(y / 30 + S.re * 9) * 18, y);
        g.lineTo(-10, PH + 12); g.closePath(); g.clip();
        g.drawImage(art.img, ...art.box);
        g.restore();
        g.save();
        g.globalCompositeOperation = "source-atop";
        const gr = g.createLinearGradient(f - 80, 0, f + 24, 0);
        gr.addColorStop(0, "rgba(255, 250, 236, 0)");
        gr.addColorStop(0.78, "rgba(255, 250, 236, 0.9)");
        gr.addColorStop(1, "rgba(255, 250, 236, 0)");
        g.fillStyle = gr;
        g.fillRect(f - 80, -PH, 104, PH * 3);
        g.restore();
      }
    };
    // inks the pencil's route up to p on the mask; returns where the pencil tip is
    const inkTo = (p) => {
      const { pts, len, w } = art.scrib;
      const target = p * len[len.length - 1];
      let i = inked;
      mg.lineWidth = w;
      mg.lineCap = mg.lineJoin = "round";
      mg.beginPath();
      mg.moveTo(pts[i][0], pts[i][1]);
      while (i < pts.length - 1 && len[i + 1] <= target) { i++; mg.lineTo(pts[i][0], pts[i][1]); }
      let tip = pts[i];
      if (i < pts.length - 1) {
        const f = (target - len[i]) / (len[i + 1] - len[i] || 1);
        tip = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
        mg.lineTo(tip[0], tip[1]);
      }
      mg.stroke();
      inked = i;
      return tip;
    };
    // the cut face stands on the cake's foot, as tall as its body, inside the paper
    const placeSlice = () => {
      if (!art) return;
      const zz = zoom();
      const h = ((art.base - art.rim) * zz) / 2;
      gsap.set(slice, { top: (BY + (art.base - BY) * zz) / 2 - h, height: h });
    };
    const paint = () => {
      Object.entries(flavor().c).forEach(([key, v]) => slice.style.setProperty(`--${key}`, v));
    };
    const fit = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      const k = Math.min(w / 460, h / 600);
      scene.style.setProperty("--k", k.toFixed(4));
      const dpr = Math.min(2, devicePixelRatio || 1);
      const cw = Math.round(PAPER.w * k * dpr), ch = Math.round(PAPER.h * k * dpr);
      if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
      sc = cw / PW;
      draw();
    };

    // ── the tools: the tip of each sits on its wrapper's origin ──
    const REST = { x: 404, y: 436, a: -96 };
    const T = { pencil: { ...REST }, brush: { x: 0, y: 0, a: 0 }, bag: { x: 0, y: 0, a: 0 } };
    const put = (tool, t) => { tool.style.transform = `translate(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px) rotate(${t.a.toFixed(1)}deg)`; };
    const park = () => { Object.assign(T.pencil, REST); put(pencil, T.pencil); };
    const spark = (x, y) => {
      const s = document.createElement("i");
      s.textContent = "✦";
      s.style.left = `${(x + gsap.utils.random(-16, 16)).toFixed(1)}px`;
      s.style.top = `${(y + gsap.utils.random(-16, 16)).toFixed(1)}px`;
      fxHost.appendChild(s);
      gsap.timeline({ onComplete: () => s.remove() })
        .fromTo(s, { scale: 0, rotation: 0 }, { scale: gsap.utils.random(0.6, 1.3), rotation: 90, duration: 0.25, ease: "back.out(3)" })
        .to(s, { scale: 0, rotation: 200, y: gsap.utils.random(-40, -14), x: gsap.utils.random(-18, 18), duration: 0.55, ease: "power2.in" });
    };
    const crumb = (x, y) => {
      const b = document.createElement("b");
      b.style.left = `${x.toFixed(1)}px`;
      b.style.top = `${y.toFixed(1)}px`;
      fxHost.appendChild(b);
      gsap.fromTo(b, { x: 0, y: 0, opacity: 0.8 }, { x: gsap.utils.random(-12, 12), y: gsap.utils.random(14, 34), opacity: 0, duration: 0.8, ease: "power1.in", onComplete: () => b.remove() });
    };

    // ── the cherry, the candles and the scale ──
    const rimPoint = (f, lift = 0) => { const zz = zoom(); return [PAPER.x + (CX + (art.rimL + (art.rimR - art.rimL) * f - CX) * zz) / 2, PAPER.y + (BY + (art.rim - BY) * zz) / 2 - lift]; };
    const onPlate = () => gsap.set(cherry, { x: 118, y: 452, rotation: 0, scale: 1 });
    const onCake = () => { const [x, y] = rimPoint(0.12, 4); gsap.set(cherry, { x, y, rotation: 0, scale: 1 }); };
    const onLid = () => gsap.set(cherry, { x: 330, y: 128, rotation: 0, scale: 1 });
    // a hop to a point: up, then a bounce down onto it
    const hopTo = (x, y, h = 120) => gsap.timeline().to(cherry, { x, y: y - h, rotation: -20, duration: 0.32, ease: "power2.out" }).to(cherry, { y, rotation: 0, duration: 0.32, ease: "bounce.out" });
    const placeCandles = () => lights.forEach((c, i) => { const [x, y] = rimPoint(0.3 + i * 0.17); gsap.set(c, { x, y }); });
    const growth = () => Math.min(1.3, Math.pow(kgOf(order.guests) / 2.5, 0.3));
    const aim = () => { needle.style.setProperty("--a", `${(-120 + ((kgOf(order.guests) - 1.5) / 9.5) * 240).toFixed(1)}deg`); };

    // ── the little scenes with a life of their own ──
    const chat = chatScene(scene, fx);
    const booking = bookingScene(scene, fx);

    // ── the settled state of every chapter; each entrance ends in exactly this ──
    let tl = null, cur = 0;
    const setBox = (n) => {
      const parts = [back, ...sides, frontWall, lid];
      if (n === 6) {
        gsap.set(parts, { clearProps: "transform,opacity" });
        gsap.set([ribV, ribH, bow], { clearProps: "transform" });
        gsap.set([tag, sticker], { clearProps: "transform", opacity: 1 });
      } else if (n === 7) {
        gsap.set(lid, { y: -300, rotation: -35, opacity: 0 });
        gsap.set(frontWall, { rotationX: -100, opacity: 0, transformOrigin: "50% 100%", transformPerspective: 900 });
        gsap.set(sides, { opacity: 0, scaleX: 0 });
        gsap.set(back, { rotationX: 95, opacity: 0, transformOrigin: "50% 100%", transformPerspective: 900 });
        gsap.set(ribV, { scaleY: 0 }); gsap.set(ribH, { scaleX: 0 }); gsap.set(bow, { scale: 0 });
        gsap.set([tag, sticker], { opacity: 0 });
      } else {
        gsap.set(parts, { opacity: 0 });
        gsap.set(ribV, { scaleY: 0 }); gsap.set(ribH, { scaleX: 0 }); gsap.set(bow, { scale: 0 });
        gsap.set([tag, sticker], { opacity: 0 });
      }
    };
    const settle = (n, keep) => {
      if (!keep && tl) { tl.kill(); tl = null; }
      if (demoRestore) demoRestore();
      const mid = n >= 2 && n <= 5, side = n === 4 || n === 5;
      gsap.set(line, { y: n === 1 ? 0 : -150, autoAlpha: n === 1 ? 1 : 0 });
      gsap.set(string, { strokeDashoffset: 0 });
      gsap.set(refs, { clearProps: "transform,opacity" });
      gsap.set(ghost, { opacity: n === 0 ? 1 : 0, scale: 1 });
      gsap.set(paper, { opacity: n === 0 ? 0 : 1, x: side ? -72 : 0, y: n === 0 ? 50 : 0, scale: side ? 0.88 : 1, rotation: 0 });
      gsap.set([sheet, tape], { opacity: n >= 6 ? 0 : 1 });
      gsap.set(head, { opacity: n >= 2 && n < 6 ? 1 : 0 });
      gsap.set(still, { opacity: n >= 1 && noCanvas ? 1 : 0 });
      S.sk = n >= 1 ? 1 : 0; S.cut = mid ? 1 : 0; S.z = mid ? 0.9 : 1; S.g = n >= 3 ? growth() : 1; S.wa = n >= 6 ? 1 : 0; S.re = n >= 6 ? 1 : 0;
      placeSlice();
      gsap.set(slice, { opacity: mid ? 1 : 0, scaleY: 1 });
      gsap.set([berry, ...layers], { clearProps: "transform,opacity" });
      park();
      gsap.set(pencil, { opacity: side ? 0 : 1 });
      gsap.set([brush, bag, knife], { opacity: 0 });
      gsap.set(dial, { scale: n >= 3 && n <= 5 ? 1 : 0, rotation: 0 });
      aim();
      gsap.set(phone, { y: n === 4 ? 0 : 160, opacity: n === 4 ? 1 : 0 });
      chat.reset();
      if (n === 4) chat.done();
      gsap.set([flash, shot], { opacity: 0 });
      gsap.set(ticket, { y: n === 5 ? 0 : 140, opacity: n === 5 ? 1 : 0, rotation: 0 });
      booking.reset();
      if (n === 5) booking.done();
      setBox(n);
      if (n === 7 && art) onCake(); else if (n === 6) onLid(); else onPlate();
      lights.forEach((c) => c.classList.toggle("is-unlit", n !== 7));
      gsap.set(lights, { opacity: n === 7 ? 1 : 0, scale: 1 });
      if (n === 7 && art) placeCandles();
      gsap.set(garland, { opacity: n === 7 ? 1 : 0 });
      gsap.set(gstring, { scaleY: 1 });
      gsap.set(flags, { clearProps: "transform,opacity" });
      gsap.set(wish, { clipPath: n === 7 ? "inset(-80% -30% -80% -30%)" : "inset(-80% 130% -80% -30%)" });
      draw();
    };

    // ── the entrances ──
    // 01 · the line is strung, the references are pegged on, the paper rises and the pencil sketches the cake
    const sketchIn = () => {
      const t = T.pencil, o = { p: 0 };
      let n = 0;
      const start = () => at(...art.scrib.pts[0]);
      const s = gsap.timeline()
        .call(() => { mg.clearRect(0, 0, PW, PH); inked = 0; S.sk = 0.001; draw(); })
        .to(t, { x: () => start()[0], y: () => start()[1], a: -38, duration: 0.5, ease: "power2.inOut", onUpdate: () => put(pencil, t) })
        .to(o, {
          p: 1, duration: 2.6, ease: "power1.inOut",
          onUpdate: () => {
            S.sk = Math.max(0.001, o.p);
            const [x, y] = at(...inkTo(o.p));
            t.x = x; t.y = y; t.a = -38 + Math.sin(o.p * 90) * 5;
            put(pencil, t);
            if (++n % 6 === 0) crumb(x, y);
            draw();
          },
        })
        .call(() => { S.sk = 1; draw(); })
        .to(t, { x: REST.x, y: REST.y, a: REST.a, duration: 0.6, ease: "power2.inOut", onUpdate: () => put(pencil, t) });
      if (noCanvas) s.fromTo(still, { opacity: 0 }, { opacity: 1, duration: 2.6, ease: "none" }, 0.5);
      return s;
    };
    const hop = () => gsap.timeline().to(cherry, { y: "-=26", duration: 0.2, ease: "power2.out" }).to(cherry, { y: "+=26", duration: 0.24, ease: "bounce.out" });
    const enter1 = () => gsap.timeline()
      .set(line, { y: -150, autoAlpha: 1 })
      .to(ghost, { scale: 0.6, opacity: 0, duration: 0.45, ease: "power2.in" }, 0)
      .fromTo(string, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, 0.1)
      .to(line, { y: 0, duration: 0.9, ease: "elastic.out(1, 0.55)" }, 0.1)
      .fromTo(refs, { y: -80, opacity: 0, rotation: () => gsap.utils.random(-30, 30) }, { y: 0, opacity: 1, rotation: 0, duration: 1, stagger: 0.09, ease: "elastic.out(1, 0.5)", clearProps: "transform,opacity" }, 0.25)
      .fromTo(paper, { y: 60, opacity: 0, rotation: -5 }, { y: 0, opacity: 1, rotation: 0, duration: 0.8, ease: "back.out(1.6)" }, 0.3)
      .add(sketchIn(), 1)
      .add(hop(), ">-0.3")
      .call(() => fx.hearts(paper, 3), null, "<");

    // 02 · the knife comes down the middle, the right half falls away and the cut face is stacked up, layer by layer
    const stackLayers = () => gsap.timeline()
      .fromTo([...layers].reverse(), { y: -150, opacity: 0, rotation: () => gsap.utils.random(-8, 8) }, { y: 0, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.07, ease: "bounce.out" })
      .fromTo(berry, { y: -200, opacity: 0, scaleY: 1.3 }, { y: 0, opacity: 1, scaleY: 1, duration: 0.7, ease: "bounce.out" }, ">-0.15")
      .call(() => fx.pop(berry, 12, 0.5));
    const enter2 = () => {
      const rimY = at(0, art.rim)[1];
      return gsap.timeline()
        .to(line, { y: -150, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 0)
        .to(head, { opacity: 1, duration: 0.5 }, 0.4)
        .fromTo(knife, { y: rimY - 270, opacity: 0 }, { y: rimY - 110, opacity: 1, duration: 0.45, ease: "power3.in" }, 0.25)
        .call(() => fx.pop(knife, 10, 0.4))
        .to(knife, { y: rimY - 300, opacity: 0, duration: 0.4, ease: "power2.in" }, "+=0.12")
        .to(S, { cut: 1, z: 0.9, duration: 1.1, ease: "elastic.out(1, 0.6)", onUpdate: () => { draw(); placeSlice(); } }, "-=0.25")
        .set(slice, { opacity: 1 }, "<0.1")
        .add(stackLayers(), "<");
    };

    // 03 · the stand becomes a scale and the cake grows to the party's size
    let touched = false, demoRestore = null;
    const weigh = (animated) => {
      spec();
      aim();
      placeSlice();
      if (animated) gsap.to(S, { g: growth(), duration: 0.9, ease: "elastic.out(1, 0.5)", onUpdate: () => { draw(); placeSlice(); }, overwrite: "auto" });
      else { S.g = growth(); draw(); }
    };
    const enter3 = () => {
      const s = gsap.timeline()
        .fromTo(dial, { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" }, 0)
        .call(() => fx.pop(dial, 12, 0.5), null, 0.1);
      if (touched) s.to(S, { g: growth(), duration: 1.2, ease: "elastic.out(1, 0.5)", onUpdate: () => { draw(); placeSlice(); } }, 0.4);
      else {
        // a quick demo: the party grows from a few guests to the real number, and the cake with it;
        // interrupted or not, the order ends up where it was
        const real = order.guests, o = { g: 4 };
        demoRestore = () => { demoRestore = null; input.value = real; applyGuests(false); S.g = growth(); draw(); placeSlice(); };
        s.call(() => { input.value = 4; applyGuests(false); }, null, 0.3)
          .to(o, { g: real, duration: 2, ease: "power2.inOut", onUpdate: () => { if (touched) return; input.value = Math.round(o.g); applyGuests(false); S.g = growth(); draw(); placeSlice(); } }, 0.5)
          .call(() => demoRestore && demoRestore());
      }
      return s;
    };

    // 04 · the paper moves aside, the phone comes up, a flash — and the photo flies into the chat, which plays itself
    const enter4 = () => {
      spec();
      chat.reset();
      return gsap.timeline()
        .to(paper, { x: -72, scale: 0.88, duration: 0.6, ease: "power2.inOut" }, 0)
        .to(pencil, { opacity: 0, duration: 0.3 }, 0)
        .to(phone, { y: 0, opacity: 1, duration: 0.7, ease: "back.out(1.4)" }, 0.2)
        .to(flash, { opacity: 0.9, duration: 0.07, yoyo: true, repeat: 1 }, 0.95)
        .fromTo(shot, { x: 110, y: 230, scale: 0.4, rotation: -10, opacity: 0 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, 1)
        .to(shot, { x: 304, y: 180, scale: 0.6, rotation: 8, duration: 0.6, ease: "power2.inOut" }, 1.4)
        .to(shot, { opacity: 0, duration: 0.2 }, 1.9)
        .add(chat.play(), 1.95);
    };

    // 05 · the phone goes, the ticket comes with the spec ticked off, the date flips and the wax seal is stamped
    const enter5 = () => {
      spec();
      booking.reset();
      return gsap.timeline()
        .to(phone, { y: 160, opacity: 0, duration: 0.45, ease: "power2.in" }, 0)
        .fromTo(ticket, { y: 140, opacity: 0, rotation: 6 }, { y: 0, opacity: 1, rotation: 0, duration: 0.7, ease: "back.out(1.5)" }, 0.3)
        .add(booking.play(), 0.9);
    };

    // 06 · the drawing is painted and piped into the real cake, the cherry goes on top, and the box closes round it
    const washIn = () => {
      const t = T.brush, o = { p: 0 }, n = art.blobs.length;
      const first = () => at(art.blobs[0].x, art.blobs[0].y);
      return gsap.timeline()
        .call(() => { brush.style.setProperty("--tint", art.tint); Object.assign(t, { x: REST.x + 40, y: REST.y - 120, a: -70 }); put(brush, t); })
        .to(brush, { opacity: 1, duration: 0.2 })
        .to(t, { x: () => first()[0], y: () => first()[1], a: -50, duration: 0.45, ease: "power2.inOut", onUpdate: () => put(brush, t) }, "<")
        .to(o, {
          p: 1, duration: 1.5, ease: "none",
          onUpdate: () => {
            S.wa = o.p;
            const f = Math.min(n - 0.001, (o.p * n) / 0.7), i = Math.floor(f), u = f - i;
            const b = art.blobs[i], nb = art.blobs[Math.min(n - 1, i + 1)];
            const m = u < 0.7 ? 0 : (u - 0.7) / 0.3, sw = u * Math.PI * 4;
            const [x, y] = at(b.x + (nb.x - b.x) * m + Math.cos(sw) * 18, b.y + (nb.y - b.y) * m + Math.sin(sw) * 12);
            t.x = x; t.y = y; t.a = -50 + Math.sin(sw) * 8;
            put(brush, t);
            draw();
          },
        })
        .call(() => { S.wa = 1; draw(); })
        .to(t, { x: "+=120", y: "-=90", a: -20, duration: 0.45, ease: "power2.in", onUpdate: () => put(brush, t) })
        .to(brush, { opacity: 0, duration: 0.2 }, "<0.25");
    };
    const realIn = () => {
      const t = T.bag, o = { p: 0 };
      let last = 0;
      return gsap.timeline()
        .call(() => { const [x, y] = at(front(0), art.rim); Object.assign(t, { x, y: y - 90, a: 16 }); put(bag, t); })
        .to(bag, { opacity: 1, duration: 0.2 })
        .to(t, { y: "+=90", duration: 0.4, ease: "back.out(2)", onUpdate: () => put(bag, t) }, "<")
        .to(o, {
          p: 1, duration: 1.5, ease: "power1.inOut",
          onUpdate: () => {
            S.re = o.p;
            const [x, y] = at(front(o.p), art.rim + (art.base - art.rim) * (0.5 - 0.5 * Math.cos(o.p * Math.PI * 6)));
            t.x = x; t.y = y; t.a = 12 * Math.sin(o.p * Math.PI * 6);
            put(bag, t);
            draw();
            const now = performance.now();
            if (now - last > 55) { last = now; spark(x, y); }
          },
        })
        .to([sheet, tape, head], { opacity: 0, duration: 0.6 }, "<0.9")
        .call(() => { S.re = 1; draw(); fx.pop(paper, 26, 0.9); })
        .to(t, { y: "-=150", x: "+=50", a: 32, duration: 0.5, ease: "power2.in", onUpdate: () => put(bag, t) })
        .to(bag, { opacity: 0, duration: 0.2 }, "<0.3");
    };
    const hopUp = () => {
      const [x, y] = rimPoint(0.12, 4);
      return gsap.timeline()
        .to(cherry, { x, y: y - 130, rotation: -30, duration: 0.38, ease: "power2.out" })
        .to(cherry, { y, rotation: 0, duration: 0.34, ease: "bounce.out" })
        .call(() => fx.pop(cherry, 14, 0.5));
    };
    const boxUp = () => gsap.timeline()
      .fromTo(back, { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" })
      .add(hopTo(118, 452, 130), "<")
      .fromTo(sides, { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, "<0.35")
      .fromTo(frontWall, { opacity: 0, y: 160 }, { opacity: 1, y: 0, duration: 0.65, ease: "back.out(1.4)" }, "<0.1")
      .fromTo(lid, { opacity: 0, y: -160, rotation: -8 }, { opacity: 1, y: 0, rotation: 0, duration: 0.6, ease: "bounce.out" }, ">-0.1")
      .call(() => fx.pop(lid, 18, 0.7))
      .add(hopTo(330, 128, 150), ">-0.05")
      .fromTo(ribV, { scaleY: 0 }, { scaleY: 1, duration: 0.4, ease: "power2.inOut" })
      .fromTo(ribH, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.inOut" }, "<0.1")
      .fromTo(bow, { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.45)" })
      .fromTo(tag, { opacity: 0, rotation: -40 }, { opacity: 1, rotation: 0, duration: 1.1, ease: "elastic.out(1, 0.35)" }, "<0.1")
      .fromTo(sticker, { opacity: 0, scale: 2.2, rotation: -30 }, { opacity: 1, scale: 1, rotation: -8, duration: 0.3, ease: "power4.in" }, "<0.2")
      .call(() => fx.pop(sticker, 10, 0.4));
    const enter6 = () => {
      spec();
      return gsap.timeline()
        .to(ticket, { y: 140, opacity: 0, duration: 0.45, ease: "power2.in" }, 0)
        .to(paper, { x: 0, scale: 1, duration: 0.7, ease: "power2.inOut" }, 0.1)
        .to(pencil, { opacity: 1, duration: 0.3 }, 0.6)
        .to(slice, { scaleY: 0, opacity: 0, duration: 0.5, ease: "power2.in" }, 0.2)
        .to(S, { cut: 0, z: 1, duration: 0.9, ease: "power2.inOut", onUpdate: draw }, 0.3)
        .add(washIn(), 1.1)
        .add(realIn(), ">-0.1")
        .add(hopUp(), ">-0.3")
        .add(boxUp(), ">-0.2");
    };

    // 07 · the bow is pulled: the lid flies off, the walls fold down, candles light one by one, bunting and confetti
    const partyIn = () => {
      placeCandles();
      const s = gsap.timeline()
        .fromTo(lights, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: "back.out(2.5)" })
        .fromTo(gstring, { scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 0.9, ease: "elastic.out(1, 0.5)" }, 0.2)
        .set(garland, { opacity: 1 }, 0.2)
        .fromTo(flags, { y: -40, opacity: 0, rotation: -50 }, { y: 0, opacity: 1, rotation: 0, duration: 1.1, stagger: 0.06, ease: "elastic.out(1, 0.45)" }, 0.4)
        .fromTo(wish, { clipPath: "inset(-80% 130% -80% -30%)" }, { clipPath: "inset(-80% -30% -80% -30%)", duration: 1.1, stagger: 0.3, ease: "power2.inOut" }, 0.5);
      lights.forEach((c, k) => s.call(() => c.classList.remove("is-unlit"), null, 0.6 + k * 0.26));
      return s;
    };
    const enter7 = () => gsap.timeline()
      .to(bow, { scale: 0, rotation: 60, duration: 0.35, ease: "back.in(2)" }, 0)
      .to(tag, { y: 120, rotation: 30, opacity: 0, duration: 0.6, ease: "power2.in" }, 0.05)
      .to(ribV, { scaleY: 0, duration: 0.3, ease: "power2.in" }, 0.2)
      .to(ribH, { scaleX: 0, duration: 0.3, ease: "power2.in" }, 0.25)
      .to(lid, { y: -300, rotation: -35, opacity: 0, duration: 0.7, ease: "power2.in" }, 0.45)
      .add(hopTo(...rimPoint(0.12, 4), 160), 0.5)
      .to(frontWall, { rotationX: -100, opacity: 0, duration: 0.75, ease: "power2.in", transformOrigin: "50% 100%", transformPerspective: 900 }, 0.6)
      .to(sides, { opacity: 0, scaleX: 0, duration: 0.4 }, 0.8)
      .to(back, { rotationX: 95, opacity: 0, duration: 0.6, ease: "power2.in", transformOrigin: "50% 100%", transformPerspective: 900 }, 0.85)
      .call(() => { fx.pop(paper, 44, 1.3); fx.rain(stage, 70); }, null, 1)
      .add(partyIn(), 1);

    const ENTER = { 1: enter1, 2: enter2, 3: enter3, 4: enter4, 5: enter5, 6: enter6, 7: enter7 };
    let seq = 0;
    const go = async (n) => {
      if (n === cur) return;
      const from = cur;
      cur = n;
      const id = ++seq;
      if (n < from || n === 0) { settle(n); return; }
      if (!art) { await load(order.design); spec(); fit(); }
      if (id !== seq) return;
      settle(n - 1);
      tl = ENTER[n]();
      tl.call(() => settle(n, true));
    };

    // ── the references: pick one and it is sketched (only while the line is down, in the first chapter) ──
    const upload = (i) => {
      if (refs[i] !== yours || yours.classList.contains("is-up")) return Promise.resolve();
      if (!animate) { yours.classList.add("is-up"); return Promise.resolve(); }
      yours.classList.add("is-loading");
      return new Promise((res) => setTimeout(() => {
        yours.classList.remove("is-loading");
        yours.classList.add("is-up");
        fx.hearts(yours, 2);
        res();
      }, 800));
    };
    const pick = async (i) => {
      order.design = i;
      refs.forEach((r, j) => r.setAttribute("aria-pressed", String(i === j)));
      const id = ++seq;
      await upload(i);
      await load(i);
      if (id !== seq) return;
      spec();
      if (cur === 1 && live) {
        // the sheet is torn off and a fresh one sketched
        if (tl) tl.kill();
        tl = gsap.timeline()
          .to(paper, { rotation: 8, y: 40, opacity: 0, duration: 0.35, ease: "power2.in", onComplete: () => { S.sk = 0; draw(); } })
          .call(() => { settle(0, true); gsap.set(line, { y: 0, autoAlpha: 1 }); gsap.set(ghost, { opacity: 0 }); })
          .fromTo(paper, { y: 60, opacity: 0, rotation: -5 }, { y: 0, opacity: 1, rotation: 0, duration: 0.7, ease: "back.out(1.6)" })
          .add(sketchIn(), ">-0.2")
          .add(hop(), ">-0.3")
          .call(() => settle(1, true));
      } else settle(cur, true);
    };
    refs.forEach((r, i) => r.addEventListener("click", () => pick(i)));

    // ── the chapter controls in the cards ──
    const chips = $$("[data-flavor]", sec), desc = $("[data-flavor-desc]", sec);
    let swap = null;
    const pickFlavor = (k, focus) => {
      chips.forEach((c, i) => { c.setAttribute("aria-checked", String(i === k)); c.tabIndex = i === k ? 0 : -1; });
      if (focus) chips[k].focus();
      if (k === order.flavor) return;
      order.flavor = k;
      desc.textContent = flavor().desc;
      spec();
      if (!animate || cur !== 2) { paint(); return; }
      if (swap) swap.kill();
      // the old layers are knocked off sideways and the new flavour is stacked in their place
      swap = gsap.timeline()
        .to([berry, ...layers], { x: 70, opacity: 0, rotation: 12, duration: 0.22, stagger: 0.025, ease: "power2.in" })
        .call(paint)
        .set([berry, ...layers], { x: 0, rotation: 0 })
        .add(stackLayers());
    };
    chips.forEach((c, i) => {
      c.tabIndex = i === 0 ? 0 : -1;
      c.addEventListener("click", () => pickFlavor(i));
      c.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        pickFlavor((i + step + chips.length) % chips.length, true);
      });
    });
    const input = $("[data-guests]", sec), out = $("[data-kg-out]", sec), guestsOut = $("[data-guests-out]", sec), size = $("[data-kg-size]", sec), plates = $("[data-plates]", sec);
    let lastKg = "";
    const applyGuests = (fromUser) => {
      const gg = +input.value;
      order.guests = gg;
      const kg = kgOf(gg);
      guestsOut.textContent = gg;
      size.textContent = sizeOf(kg);
      const have = plates.children.length;
      for (let k = have; k < gg; k++) {
        const pl = document.createElement("i");
        plates.appendChild(pl);
        if (animate) gsap.fromTo(pl, { scale: 0 }, { scale: 1, duration: 0.4, delay: (k - have) * 0.015, ease: "back.out(3)" });
      }
      for (let k = have; k > gg; k--) plates.lastElementChild.remove();
      const txt = fmtKg(kg);
      if (txt !== lastKg) {
        lastKg = txt;
        out.textContent = txt;
        if (animate) gsap.fromTo(out, { scale: 1.15 }, { scale: 1, duration: 0.5, ease: "back.out(3)", transformOrigin: "0 100%" });
      }
      if (fromUser) { touched = true; weigh(animate && cur >= 3); } else spec();
    };
    input.addEventListener("input", (e) => applyGuests(e.isTrusted));
    applyGuests(false);
    const ways = $$("[data-pickup]", sec);
    ways.forEach((c, i) => c.addEventListener("click", () => {
      ways.forEach((w, j) => w.setAttribute("aria-checked", String(i === j)));
      order.pickup = i;
      spec();
      if (animate && cur >= 6) gsap.fromTo(sticker, { scale: 1.6, rotation: -30 }, { scale: 1, rotation: -8, duration: 0.5, ease: "back.out(2)" });
    }));

    // ── wiring ──
    paint();
    spec();
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
    const warm = () => prepare(0).then(() => designs.forEach((_, i) => i && setTimeout(() => prepare(i).catch(() => {}), 350 * i)), () => {});
    if (window.IntersectionObserver) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); warm(); } }, { rootMargin: "1200px 0px" });
      io.observe(stage);
    } else warm();
    if (live) settle(0);

    return {
      go,
      // without the script's motion: the finished cake on its stand
      async static() {
        paper.classList.add("is-still");
        still.src = designs[order.design].cut;
        still.style.opacity = "1";
      },
    };
  }

  // 04 · the request is typed into the compose bar, sent with a paper plane, the photo follows, it is read and answered
  function chatScene(scene, fx) {
    const el = $("[data-chat]", scene);
    const msgs = $$(".x-mk-chat__msg", el);
    const [m1, m2, reply] = msgs;
    const typing = $(".x-mk-chat__typing", el);
    const pic = $(".x-mk-chat__pic", el);
    const field = $("[data-chat-field]", el);
    const plane = $(".x-mk-chat__send svg", el);
    const status = $("[data-chat-status]", el);
    const PH_ = field.textContent;
    const react = document.createElement("i");
    react.className = "x-mk-chat__react";
    react.textContent = "♥";
    m1.appendChild(react);
    if (!hasLibs) return { reset() {}, done() {}, play() {} };
    let tl = null;
    const reset = () => {
      if (tl) tl.kill();
      gsap.set([...msgs, pic, typing, react], { autoAlpha: 0 });
      gsap.set(plane, { x: 0, y: 0, rotation: 0, opacity: 1 });
      el.classList.remove("is-read");
      field.textContent = PH_;
      field.classList.add("is-ph");
      status.textContent = "онлайн";
    };
    const done = () => {
      gsap.set([m1, m2, reply, pic, react], { autoAlpha: 1 });
      el.classList.add("is-read");
    };
    const type = (msg) => {
      const text = $("span", msg).textContent;
      const o = { n: 0 };
      return gsap.to(o, { n: text.length, duration: text.length * 0.026, ease: "none", onStart: () => field.classList.remove("is-ph"), onUpdate: () => { field.textContent = text.slice(0, Math.round(o.n)); } });
    };
    const send = (msg) => gsap.timeline()
      .to(plane, { x: 34, y: -30, rotation: -20, opacity: 0, duration: 0.3, ease: "power2.in" })
      .call(() => { field.textContent = ""; })
      .fromTo(msg, { autoAlpha: 0, y: 26, scale: 0.8, transformOrigin: "100% 100%" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, 0.1)
      .fromTo(plane, { x: -16, y: 12, rotation: 0, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, 0.35);
    reset();
    return {
      reset, done,
      play() {
        tl = gsap.timeline()
          .add(type(m1))
          .add(send(m1), "+=0.1")
          .fromTo(pic, { autoAlpha: 0, y: 26, scale: 0.8, transformOrigin: "100% 100%" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, "+=0.2")
          .add(type(m2), "+=0.25")
          .add(send(m2), "+=0.1")
          .call(() => { field.textContent = PH_; field.classList.add("is-ph"); el.classList.add("is-read"); status.textContent = "друкує…"; }, null, "+=0.4")
          .to(typing, { autoAlpha: 1, duration: 0.2 })
          .to(typing, { autoAlpha: 0, duration: 0.15 }, "+=1.1")
          .fromTo(reply, { autoAlpha: 0, y: 20, scale: 0.8, transformOrigin: "0% 100%" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, "<")
          .call(() => { status.textContent = "онлайн"; })
          .fromTo(react, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" }, "+=0.3")
          .call(() => fx.hearts(react, 4), null, "<");
        return tl;
      },
    };
  }

  // 05 · the spec is ticked off, the calendar flips day by day to the booked date, circles it, and the seal is stamped
  function bookingScene(scene, fx) {
    const el = $("[data-ticket]", scene);
    const items = $$(".x-mk-ticket__spec li", el);
    const day = $("[data-date-day]", el);
    const month = $("[data-date-month]", el);
    const ring = $(".x-mk-ticket__ring", el);
    const seal = $("[data-seal]", el);
    const no = $("[data-ticket-no]", el);
    no.textContent = String(2300 + (new Date().getDate() % 20) + 17);
    const show = (d) => { day.textContent = d.getDate(); month.textContent = MONTHS_OF[d.getMonth()]; };
    show(bookedDate());
    if (!hasLibs) return { reset() {}, done() {}, play() {} };
    let tl = null;
    const reset = () => {
      if (tl) tl.kill();
      show(new Date());
      items.forEach((li) => li.classList.add("is-todo"));
      gsap.set(ring, { strokeDashoffset: 1 });
      gsap.set(seal, { opacity: 0 });
      gsap.set(day, { clearProps: "transform" });
    };
    const done = () => {
      show(bookedDate());
      items.forEach((li) => li.classList.remove("is-todo"));
      gsap.set(ring, { strokeDashoffset: 0 });
      gsap.set(seal, { opacity: 1, scale: 1, rotation: 0 });
    };
    reset();
    return {
      reset, done,
      play() {
        tl = gsap.timeline();
        items.forEach((li, i) => tl.call(() => { li.classList.remove("is-todo"); fx.pop($("i", li), 6, 0.25); }, null, i * 0.28));
        const now = Date.now();
        // ten flips, quick at first and slowing down onto the date
        for (let k = 1; k <= 10; k++) {
          const dur = 0.05 + (k / 10) ** 3 * 0.3;
          tl.to(day, { rotationX: 90, duration: dur, ease: "power1.in", transformPerspective: 300 }, k === 1 ? 0.9 : ">")
            .call(() => show(new Date(now + k * 864e5)))
            .fromTo(day, { rotationX: -90 }, { rotationX: 0, duration: dur, ease: "power1.out", transformPerspective: 300 });
        }
        tl.to(ring, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, "+=0.05")
          .fromTo(seal, { opacity: 0, scale: 3.2, rotation: -60 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.32, ease: "power4.in" }, "+=0.1")
          .call(() => fx.wax(seal))
          .fromTo(el, { x: -8, y: 4 }, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" })
          .fromTo(seal, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.35)" }, "<");
        return tl;
      },
    };
  }

  MARIDAY.onReady(init);
})();
