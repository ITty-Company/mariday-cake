/* Mariday home — how to order: the Mariday box.
   The six steps are printed on the six faces of a cake box — a staircase dieline lying on a cutting mat. One scrubbed
   timeline drives a camera down the steps (each face plays its little scene when the camera gets there) and back out;
   then a scalpel cuts the dieline out of its sheet, it is flipped like a pancake and folded into the box (real hinge
   maths, so the faces meet), the ribbon wraps round and the bow pops on. Pull the bow (or scroll on) and the box
   opens: the lid flies off, the walls fall open, the cake inside gets its cherry, the candles light up.
   What the visitor picks on the way (design, flavour, guests) is written on the gift tag and carried into the links. */
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
    { id: "pistachio-raspberry", name: "фісташка-малина", with: "з фісташкою й малиною ♥", desc: "горіховий бісквіт · кремчиз з фісташкою · малинове конфі", c: { sp: "#c9d89a", cr: "#fbf6ea", fi: "#d8344f", tp: "#f6eadb", dc: "#d8344f" } },
    { id: "kinder", name: "kinder bueno", with: "з kinder bueno ♥", desc: "шоколадний бісквіт · фундучне праліне · вафельна крихта", c: { sp: "#6b3a22", cr: "#f4e6d0", fi: "#c08a52", tp: "#7a4428", dc: "#f4e6d0" } },
    { id: "berry-forest", name: "лісові ягоди", with: "з лісовими ягодами ♥", desc: "шифон · кремчиз · малина, вишня, смородина", c: { sp: "#f3dca8", cr: "#fff8ef", fi: "#8c2245", tp: "#fffaf3", dc: "#6d1a3c" } },
    { id: "lemon-raspberry", name: "малина-лимон", with: "з малиною й лимоном ♥", desc: "лимонний сироп · малинове конфі · лимонний гель", c: { sp: "#f7e38a", cr: "#fffaf0", fi: "#e8506a", tp: "#fff4c2", dc: "#e8506a" } },
  ];
  // the polaroids of step 01 and what they mean for the constructor
  const DESIGNS = {
    lilac: { word: "бузковий", color: "lilac", img: "img/cakes/lilac.jpg" },
    gold: { word: "золотий", color: "butter", img: "img/cakes/gold.jpg" },
    pink: { word: "рожевий", color: "powder", img: "img/cakes/pink.jpg" },
  };
  const SWASH = '<svg class="x-path__swash" viewBox="0 0 220 26" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4,16 C30,4 52,24 80,14 S128,4 150,15 S196,22 216,8"/></svg>';
  const guestsWord = (n) => (n % 10 === 1 && n % 100 !== 11 ? "гість" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "гості" : "гостей");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ─── 4×4 matrices, column-major like CSS matrix3d() ─── */
  const M4 = {
    I: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    mul(a, b) {
      const o = new Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      return o;
    },
    T: (x, y, z = 0) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
    // rotation by a (radians) about the unit axis [x, y, z]
    R([x, y, z], a) {
      const c = Math.cos(a), s = Math.sin(a), t = 1 - c;
      return [t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0, t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0, t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0, 0, 0, 0, 1];
    },
    S: (k) => [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1],
    // rotation about the line through p along the unit axis
    about: (p, axis, a) => M4.mul(M4.T(p[0], p[1], p[2]), M4.mul(M4.R(axis, a), M4.T(-p[0], -p[1], -p[2]))),
    pt: (m, [x, y, z]) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]],
    dir: (m, [x, y, z]) => [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z],
    css: (m) => `matrix3d(${m.map((v) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(6))).join(",")})`,
  };
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

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
    // effects shared by the scenes, in the section's coordinates
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
    const order = orderOf(sec);
    bookingDate(sec, order);
    const scenes = [deck(sec, fx, order), slice(sec, fx, order), weight(sec, order), chat(sec, fx, order), booking(sec, fx), route(sec, fx)];
    candles(sec, fx);
    if (live) sec.classList.add("is-live");
    const stage = boxStage(sec, fx, scenes);
    $("[data-path-go]", sec).addEventListener("click", () => stage.go(0));
    if (live) opener.intro();
  }

  // what the visitor has picked so far; every change is written on the gift tag, the finale and into the links
  function orderOf(sec) {
    const C = (window.MARIDAY && MARIDAY.contacts) || { whatsapp: "31600000000" };
    const st = { design: "pink", flavor: 0, guests: 14, date: new Date(Date.now() + 10 * 864e5) };
    const kgOf = (g) => Math.max(1.5, Math.round(g * 0.18 * 2) / 2);
    const sizeOf = (kg) => (kg <= 1.5 ? "1.5" : kg <= 2 ? "2" : kg <= 2.5 ? "2.5" : kg <= 3 ? "3" : kg <= 4 ? "4" : "tier");
    const subs = [];
    const api = {
      st,
      kg: () => String(kgOf(st.guests)).replace(".", ","),
      date: () => `${st.date.getDate()} ${MONTHS_OF[st.date.getMonth()]}`,
      set(k, v) { if (st[k] === v) return; st[k] = v; subs.forEach((f) => f()); },
      on(f) { subs.push(f); },
    };
    const write = () => {
      const f = FLAVORS[st.flavor];
      const people = `${st.guests} ${guestsWord(st.guests)}`;
      $("[data-tag-1]", sec).textContent = `${st.design} · ${f.name}`;
      $("[data-tag-2]", sec).textContent = `${people} · ${api.kg()} кг`;
      $("[data-tag-3]", sec).textContent = api.date();
      $("[data-fin-sum]", sec).textContent = `${st.design} · ${f.name} · ${people} · ${api.kg()} кг`;
      const ctor = `pages/constructor.html?${new URLSearchParams({ flavor: f.id, size: sizeOf(kgOf(st.guests)), color: DESIGNS[st.design].color })}`;
      $$("[data-ctor]", sec).forEach((a) => { a.href = ctor; });
      const text = `Привіт! Хочу торт у стилі «${st.design}» з начинкою «${f.name}» на ${people} (≈${api.kg()} кг), на ${api.date()}. Підкажете, чи вільна дата? 🍰`;
      $$("[data-wa]", sec).forEach((a) => { a.href = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`; });
    };
    api.on(write);
    write();
    return api;
  }

  /* ─── the dieline ───
     A staircase of six faces, 100u each; face 3 (index 2) stays on the mat and becomes the bottom of the box. */
  const CELLS = [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]];
  const ROOT = 2;
  const TREE = [[2, 1], [1, 0], [2, 3], [3, 4], [4, 5]]; // [parent, child], parents first
  const FOLD_ORDER = [2, 3, 0, 1, 4]; // far walls rise first (the camera sees them), then the near ones, the lid last
  // the outline, clockwise: [x1, y1, x2, y2, face, side]
  const EDGES = [[0, 0, 100, 0, 0, "top"], [100, 0, 200, 0, 1, "top"], [200, 0, 200, 100, 1, "right"], [200, 100, 300, 100, 3, "top"], [300, 100, 300, 200, 3, "right"], [300, 200, 400, 200, 5, "top"], [400, 200, 400, 300, 5, "right"], [400, 300, 300, 300, 5, "bottom"], [300, 300, 200, 300, 4, "bottom"], [200, 300, 200, 200, 4, "left"], [200, 200, 100, 200, 2, "bottom"], [100, 200, 100, 100, 2, "left"], [100, 100, 0, 100, 0, "bottom"], [0, 100, 0, 0, 0, "left"]];
  // one glue flap for each pair of edges that meet in the folded box
  const FLAPPED = ["0-left", "1-top", "1-right", "2-left", "2-bottom", "3-right", "5-bottom"];
  const FD = 15, FT = 13; // flap depth and the inset of its slanted ends
  const VB = "-40 -40 480 380";

  function outlinePath() {
    let d = "";
    EDGES.forEach(([x1, y1, x2, y2, f, side], k) => {
      if (!k) d += `M${x1} ${y1}`;
      if (FLAPPED.includes(`${f}-${side}`)) {
        const tx = Math.sign(x2 - x1), ty = Math.sign(y2 - y1), nx = ty, ny = -tx;
        d += ` L${x1 + nx * FD + tx * FT} ${y1 + ny * FD + ty * FT} L${x2 + nx * FD - tx * FT} ${y2 + ny * FD - ty * FT}`;
      }
      d += ` L${x2} ${y2}`;
    });
    return `${d} Z`;
  }
  const foldPath = () => "M100 0V100M100 100H200M200 100V200M200 200H300M300 200V300" +
    EDGES.filter(([, , , , f, s]) => FLAPPED.includes(`${f}-${s}`)).map(([x1, y1, x2, y2]) => `M${x1} ${y1}L${x2} ${y2}`).join("");

  // the printed sheet round the dieline: crop marks, registration targets, colour bars, a job label
  function paperSVG(out) {
    const M = 34;
    const crop = [[0, 0, -1, -1], [400, 0, 1, -1], [400, 300, 1, 1], [0, 300, -1, 1]].map(([x, y, sx, sy]) => `M${x + sx * 5} ${y}h${sx * 13}M${x} ${y + sy * 5}v${sy * 13}`).join("");
    const reg = [[200, -21], [-21, 150], [421, 150]].map(([x, y]) => `<g transform="translate(${x} ${y})"><circle r="4.2" class="x-pp-mark"/><path class="x-pp-mark" d="M-7 0h14M0-7v14"/></g>`).join("");
    const bars = ["#6d0809", "#e2849a", "#f5bcc8", "#fbe6b8", "#f2d29b", "#bcd6f3", "#e9d3f0", "#a9d6c6"].map((c, i) => `<rect x="${262 + i * 8.5}" y="-27" width="8.5" height="8.5" fill="${c}"/>`).join("");
    let code = "", x = 8;
    for (let i = 0; i < 22; i++) { const w = [0.5, 0.9, 1.5][(i * 7) % 3]; code += `M${x.toFixed(1)} 45h${w}v11h${-w}z`; x += w + [0.6, 1, 0.8][(i * 5) % 3]; }
    return `<defs><filter id="x-pp-sh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0.8" dy="1.8" stdDeviation="2" flood-color="#123c30" flood-opacity="0.3"/></filter></defs>
      <path class="x-pp-fill" filter="url(#x-pp-sh)" fill-rule="evenodd" d="M${-M} ${-M}H${400 + M}V${300 + M}H${-M}Z ${out}"/>
      <path class="x-pp-mark" d="${crop}"/>${reg}${bars}
      <g transform="translate(314 16) rotate(-3)"><rect width="74" height="62" rx="4" class="x-pp-mark" stroke-dasharray="2 2"/><text class="x-pp-title" x="7" y="21" font-size="13">Mariday</text><text class="x-pp-text" x="8" y="31" font-size="3.3">коробка-інструкція</text><text class="x-pp-text" x="8" y="38" font-size="3.3">6 граней · 6 кроків</text><path d="${code}" fill="#6d0809"/><text class="x-pp-text" x="44" y="55" font-size="3">№06 · NL</text></g>
      <text class="x-pp-text" x="0" y="327" font-size="3.4">mariday · cake box · dieline · 25 × 25 × 25 см · друк з двох боків</text>`;
  }

  // a chapter's text: the number rolls like an odometer, words jump in, the script word is written and underlined,
  // the link tickets drop in. It plays when the camera arrives at the face; otherwise the face is simply printed.
  function cardIn(face, more) {
    const no = $(".x-face__no", face);
    const h3 = $(".x-face__title", face);
    const em = $("em", h3);
    [...no.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).forEach((n) => {
      const frag = document.createDocumentFragment();
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
    if (!live) { cols.forEach((c) => { c.style.transform = `translateY(${-((10 + +c.dataset.d) / 20) * 100}%)`; }); return null; }
    const words = $$(".x-path__wd", h3);
    const p = $(":scope > p", more);
    const tags = $$(".x-path__tag", more);
    const note = $(".x-face__note", face);
    const tl = gsap.timeline({ paused: true, onStart: () => face.classList.add("is-anim"), onComplete: () => face.classList.remove("is-anim") });
    tl.fromTo(cols, { yPercent: 0 }, { yPercent: (i, el) => -((10 + +el.dataset.d) / 20) * 100, duration: 1.4, stagger: 0.15, ease: "expo.out" }, 0)
      .fromTo(words, { yPercent: 110, opacity: 0, rotation: 8 }, { yPercent: 0, opacity: 1, rotation: 0, duration: 0.7, stagger: 0.07, ease: "back.out(1.8)" }, 0.1)
      .fromTo(em, { clipPath: "inset(-80% 130% -80% -30%)" }, { clipPath: "inset(-80% -30% -80% -30%)", duration: 0.9, ease: "power2.inOut" }, 0.3)
      .fromTo($(".x-path__swash path", em), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, 1)
      .fromTo(p, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" }, 0.45)
      .fromTo(tags, { y: -60, opacity: 0, rotation: (i) => (i % 2 ? 1 : -1) * 28 }, { y: 0, opacity: 1, rotation: 0, duration: 1, stagger: 0.1, ease: "elastic.out(1, 0.55)", clearProps: "transform" }, 0.6);
    if (note) tl.fromTo(note, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(3)" }, 1.2);
    tl.progress(1);
    return tl;
  }

  function boxStage(sec, fx, scenes) {
    const box = $("[data-box]", sec);
    const pin = $(".x-box__pin", box);
    const world = $("[data-world]", box);
    const net = $("[data-net]", box);
    const faces = $$(".x-face", box);
    const fronts = faces.map((f) => $(".x-face__front", f));
    const mores = faces.map((f) => $("[data-more]", f));
    const lines = $("[data-lines]", box);
    const paper = $("[data-paper]", box);
    const sheet = $(".x-box__sheet", box);
    const notes = $(".x-box__notes", box);
    const scalpel = $(".x-box__scalpel", box);
    const bow = $("[data-bow]", box);
    const bowBtn = $("[data-bow-btn]", box);
    const tag = $(".x-box__tag", box);
    const cake = $("[data-cake]", box);
    const map = $(".x-box__map", box);
    const mapBtns = $$("[data-go]", map);
    const capHost = $("[data-cap]", box);
    const hint = $("[data-hint]", box);
    const fin = $(".x-box__fin", box);
    const names = faces.map((f) => $(".x-face__title", f).textContent.replace(/\s+/g, " ").trim());
    const cards = faces.map((f, i) => cardIn(f, mores[i]));

    // without the script every face is printed in full, one under another
    if (!live) return { go: (i) => faces[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }) };

    /* ── build what the script draws ── */
    const OUT = outlinePath();
    paper.setAttribute("viewBox", VB);
    paper.innerHTML = paperSVG(OUT);
    lines.setAttribute("viewBox", VB);
    lines.innerHTML = `<path class="x-ln-fold" d="${foldPath()}"/><path class="x-ln-cut" d="${OUT}"/><path class="x-ln-done" d="${OUT}"/>`;
    const groove = $(".x-ln-done", lines);
    const cutLen = groove.getTotalLength();
    groove.style.strokeDasharray = `${cutLen} ${cutLen}`;
    groove.style.strokeDashoffset = cutLen;

    // the tag lies on the lid
    fronts[5].appendChild(tag);
    bow.dataset.pull = "тягніть за бантик ✦";

    // hinges: where each child face turns and which way (towards its unprinted side, so the print ends up outside)
    const HINGE = TREE.map(([p, c]) => {
      const [px, py] = CELLS[p], [cx, cy] = CELLS[c];
      const a = px === cx ? [px, Math.max(py, cy), 0] : [Math.max(px, cx), py, 0];
      const axis = px === cx ? [1, 0, 0] : [0, 1, 0];
      const moved = M4.pt(M4.about(a, axis, Math.PI / 2), [cx + 0.5, cy + 0.5, 0]);
      return { p, c, a, axis, sgn: moved[2] < 0 ? 1 : -1 };
    });
    const hingeM = (S, th) => {
      const H = [];
      H[ROOT] = M4.I();
      HINGE.forEach((h, k) => { H[h.c] = M4.mul(H[h.p], M4.about(scl(h.a, S), h.axis, (h.sgn * th[k] * Math.PI) / 2)); });
      return H;
    };
    const flipM = (S, flip, lift, wob) => {
      const c = [2 * S, 1.5 * S, 0];
      return M4.mul(M4.T(0, 0, lift), M4.mul(M4.about(c, [0, 0, 1], wob), M4.about(c, [1, 0, 0], flip * Math.PI)));
    };
    const placeM = (S, i) => M4.T(CELLS[i][0] * S, CELLS[i][1] * S, 0);

    // glue flaps: local x runs back along their edge, y outwards, so the board faces the viewer like the print
    const flaps = FLAPPED.map((key) => {
      const [fs, side] = key.split("-");
      const i = +fs;
      const [x1, y1, x2, y2] = EDGES.find((e) => e[4] === i && e[5] === side);
      const t = [Math.sign(x2 - x1), Math.sign(y2 - y1), 0];
      const X = scl(t, -1), Y = [t[1], -t[0], 0];
      const el = document.createElement("i");
      el.className = "x-flap";
      el.setAttribute("aria-hidden", "true");
      if (key === "2-left") el.innerHTML = "<b>клей</b>";
      net.insertBefore(el, $(".x-box__faces", net));
      // the face's own frame: edge end relative to the face's corner
      const B = [x2 - CELLS[i][0] * 100, y2 - CELLS[i][1] * 100, 0];
      const basis = (u) => [X[0], X[1], 0, 0, Y[0], Y[1], 0, 0, 0, 0, 1, 0, B[0] * u, B[1] * u, 0, 1];
      // which way folds the flap to the unprinted side
      const probe = M4.pt(M4.mul(basis(1), M4.R([1, 0, 0], Math.PI / 2)), [50, 7, 0]);
      return { el, i, basis, sgn: probe[2] < 0 ? 1 : -1 };
    });

    // the ribbon runs straight down each wall: which way that is on each face once folded
    const FINAL = (() => {
      const H = hingeM(1, [1, 1, 1, 1, 1]);
      const G = flipM(1, 1, 0, 0);
      return faces.map((f, i) => M4.mul(G, M4.mul(H[i], placeM(1, i))));
    })();
    faces.forEach((f, i) => {
      const yDir = M4.dir(FINAL[i], [0, 1, 0]);
      const kinds = i === 5 || i === ROOT ? ["v", "h"] : [Math.abs(yDir[2]) > 0.7 ? "v" : "h"];
      kinds.forEach((k) => {
        const b = document.createElement("i");
        b.className = `x-face__band x-face__band--${k}`;
        b.setAttribute("aria-hidden", "true");
        fronts[i].appendChild(b);
      });
    });

    const shade = document.createElement("i");
    shade.className = "x-box__shade";
    shade.setAttribute("aria-hidden", "true");
    world.insertBefore(shade, net);

    // the mat's ruler numbers and an angle guide
    const scale = document.createElement("div");
    scale.className = "x-box__scale";
    scale.setAttribute("aria-hidden", "true");
    let sc = "";
    for (let k = -8; k <= 22; k++) sc += `<span style="left:calc(var(--u) * ${k * 25});top:calc(var(--u) * -62)">${(k + 8) * 5}</span>`;
    for (let k = -8; k <= 18; k++) sc += `<span style="left:calc(var(--u) * -78);top:calc(var(--u) * ${k * 25})">${(k + 8) * 5}</span>`;
    scale.innerHTML = sc;
    const arc = document.createElement("i");
    arc.className = "x-box__arc";
    arc.style.cssText = "left:calc(var(--u) * 455);top:calc(var(--u) * 245)";
    $(".x-box__props", box).append(scale, arc);

    /* ── layout: how big a face is on this screen, where the camera goes ── */
    const capItems = mores.map((m, i) => {
      const w = document.createElement("div");
      w.className = "x-box__cap-item";
      w.dataset.i = i;
      capHost.appendChild(w);
      return w;
    });
    const homes = mores.map((m) => ({ parent: m.parentNode, next: m.nextElementSibling }));
    let inCap = false;
    const moveCaption = (on) => {
      if (on === inCap) return;
      inCap = on;
      mores.forEach((m, i) => { if (on) capItems[i].appendChild(m); else homes[i].parent.insertBefore(m, homes[i].next); });
    };

    let L = {};
    function layout() {
      const vw = pin.clientWidth || innerWidth;
      const vh = pin.clientHeight || innerHeight;
      const cap = vw < 720 || vw / vh < 0.8;
      const S = Math.round(Math.max(240, cap ? Math.min(vw * 0.84, vh * 0.44, 500) : Math.min(700, vh * 0.72, vw * 0.48)));
      const u = S / 100;
      sec.style.setProperty("--u", `${u}px`);
      sec.style.setProperty("--persp", `${Math.round(Math.max(1500, vh * 2.4))}px`);
      sec.classList.toggle("is-cap", cap);
      moveCaption(cap);
      const top = 70;
      if (cap) capHost.style.setProperty("--cap-h", `${Math.max(150, vh - (top + S + 16) - 12)}px`);
      L = {
        vw, vh, S, u, cap,
        fx: CELLS.map(([cx]) => (cx + 0.5) * S),
        fy: CELLS.map(([, cy]) => (cy + 0.5) * S),
        readOy: cap ? -(vh / 2 - (top + S / 2)) : vh * 0.015,
        ov: Math.min((vw * (cap ? 0.98 : 0.88)) / (4.8 * S), (vh * 0.8) / (3.8 * S)),
        boxS: cap ? Math.min((vw * 0.62) / (1.7 * S), (vh * 0.34) / S) : Math.min((vh * 0.46) / S, (vw * 0.34) / S),
        boxOx: cap ? 0 : vw * 0.16,
        boxOy: cap ? -vh * 0.17 : vh * 0.07,
      };
    }
    layout();

    /* ── the timeline, in screen heights of scroll ── */
    const TLF = [];
    let t = 0.5;
    for (let i = 0; i < 6; i++) { const go = t + 0.05; TLF.push({ go, at: go + 0.34, out: go + 0.76 }); t = go + 0.76; }
    const T = {};
    T.back = t; t += 0.3;
    T.cut = t; t += 0.55;
    T.slide = t - 0.06; t += 0.16;
    T.flip = t; t += 0.55;
    T.fold = t; t += 0.82;
    T.ribbon = t; t += 0.32;
    T.tied = t;
    const TOTAL = t + 0.5;

    const cam = { x: 0, y: 0, s: 1, rx: 0, rz: 0, ox: 0, oy: 0 };
    const swoop = { v: 0 };
    const fold = { cut: 0, slide: 0, flip: 0, flaps: 0, h0: 0, h1: 0, h2: 0, h3: 0, h4: 0, band: 0, bow: 0, orbit: 0 };
    const open = { untie: 0, lid: 0, w0: 0, w1: 0, w3: 0, w4: 0, cake: 0, oy: 0, s: 1, rx: 0 };
    const D2R = Math.PI / 180;
    const LIGHT = norm([-0.35, -0.55, 0.76]);

    const tl = gsap.timeline({ paused: true, defaults: { ease: "none" }, onUpdate: () => { render(); stepAt(tl.time()); } });
    tl.fromTo(cam, { x: () => 2 * L.S, y: () => 1.5 * L.S, s: () => L.ov * 1.3, rx: 50, rz: -18, ox: 0, oy: 0 }, { s: () => L.ov, rx: 0, rz: 0, duration: 0.5, ease: "power2.inOut" }, 0);
    TLF.forEach((f, i) => {
      tl.to(cam, { x: () => L.fx[i], y: () => L.fy[i], s: 1, ox: 0, oy: () => L.readOy, duration: f.at - f.go, ease: "power3.inOut" }, f.go);
      tl.fromTo(swoop, { v: 0 }, { v: 1, duration: f.at - f.go, immediateRender: false }, f.go);
    });
    tl.to(cam, { x: () => 2 * L.S, y: () => 1.5 * L.S, s: () => L.ov, oy: 0, duration: 0.3, ease: "power2.inOut" }, T.back)
      .fromTo(fold, { cut: 0 }, { cut: 1, duration: 0.55, ease: "power1.inOut" }, T.cut)
      .to(cam, { s: () => L.ov * 1.05, rz: 2, duration: 0.55, ease: "sine.inOut" }, T.cut)
      .fromTo(fold, { slide: 0 }, { slide: 1, duration: 0.32, ease: "power2.in" }, T.slide)
      .fromTo(fold, { flip: 0 }, { flip: 1, duration: 0.55, ease: "power2.inOut" }, T.flip)
      .to(cam, { x: () => 1.5 * L.S, y: () => 1.5 * L.S, s: () => L.boxS, rx: 58, rz: -42, ox: () => L.boxOx, oy: () => L.boxOy, duration: 0.75, ease: "power2.inOut" }, T.flip)
      .fromTo(fold, { flaps: 0 }, { flaps: 1, duration: 0.14, ease: "power2.inOut" }, T.fold - 0.04);
    FOLD_ORDER.forEach((k, n) => {
      const last = n === FOLD_ORDER.length - 1;
      tl.fromTo(fold, { [`h${k}`]: 0 }, { [`h${k}`]: 1, duration: last ? 0.24 : 0.2, ease: last ? "power3.in" : "back.out(1.15)" }, T.fold + 0.1 + n * 0.15);
    });
    tl.fromTo(fold, { orbit: 0 }, { orbit: 14, duration: 1.4, ease: "sine.inOut" }, T.fold)
      .fromTo(fold, { band: 0 }, { band: 1, duration: 0.26, ease: "power2.inOut" }, T.ribbon)
      .fromTo(fold, { bow: 0 }, { bow: 1, duration: 0.14, ease: "back.out(2.6)" }, T.ribbon + 0.16)
      .set({}, {}, TOTAL);

    /* ── drawing a frame ── */
    let scAng = -28;
    let dustAt = 0;
    function render() {
      const { vw, vh, S, u } = L;
      const sw = Math.sin(Math.PI * swoop.v);
      const rx = cam.rx + sw * 9 - open.rx;
      const rz = cam.rz + sw * 2.5 + fold.orbit;
      const s = cam.s * (1 - sw * 0.1) * open.s;
      world.style.transform = `translate3d(${(vw / 2 + cam.ox).toFixed(1)}px, ${(vh / 2 + cam.oy + open.oy).toFixed(1)}px, 0) rotateX(${rx.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale3d(${s.toFixed(4)}, ${s.toFixed(4)}, ${s.toFixed(4)}) translate3d(${(-cam.x).toFixed(1)}px, ${(-cam.y).toFixed(1)}px, 0)`;
      const Rcam = M4.mul(M4.R([1, 0, 0], rx * D2R), M4.R([0, 0, 1], rz * D2R));

      // the cut: a groove follows the scalpel round the dieline, paper dust flies off its tip
      groove.style.strokeDashoffset = (cutLen * (1 - fold.cut)).toFixed(2);
      const rest = [-46 * u, 322 * u, -28];
      let sx = rest[0], sy = rest[1], sa = rest[2];
      if (fold.cut > 0 && fold.cut < 1) {
        const l = cutLen * fold.cut;
        const p = groove.getPointAtLength(l), p2 = groove.getPointAtLength(Math.min(cutLen, l + 1.5));
        let target = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI + 65;
        const dA = ((target - scAng + 540) % 360) - 180;
        scAng += dA * 0.35;
        const k = smooth(0, 0.05, fold.cut) * (1 - smooth(0.95, 1, fold.cut));
        sx = lerp(rest[0], p.x * u, k);
        sy = lerp(rest[1], p.y * u, k);
        sa = lerp(rest[2], scAng, k);
        if (k > 0.9 && Math.abs(l - dustAt) > 5) { dustAt = l; dust(p.x * u, p.y * u); }
      }
      scalpel.style.transform = `translate3d(${(sx - 2.2 * u).toFixed(1)}px, ${sy.toFixed(1)}px, ${fold.cut > 0 && fold.cut < 1 ? 8 : 2}px) rotate(${sa.toFixed(2)}deg)`;
      scalpel.style.opacity = fold.slide > 0.5 ? String(1 - smooth(0.5, 1, fold.slide)) : "";

      // the sheet the dieline was cut from slides off the mat; the pencil notes and fold lines go with it
      const sl = fold.slide;
      sheet.style.transform = `translate3d(${(-330 * u * sl).toFixed(1)}px, ${(150 * u * sl).toFixed(1)}px, -2px) rotate(${(-13 * sl).toFixed(2)}deg)`;
      sheet.style.visibility = sl >= 1 ? "hidden" : "";
      const fade = 1 - smooth(0, 0.6, sl);
      lines.style.opacity = notes.style.opacity = fade.toFixed(3);

      // lift, flip and fold
      const air = Math.sin(Math.PI * fold.flip);
      const G = flipM(S, fold.flip, air * S * 0.9, air * 10 * D2R);
      const H = hingeM(S, [fold.h0, fold.h1, fold.h2, fold.h3, fold.h4]);
      const W = faces.map((f, i) => M4.mul(G, M4.mul(H[i], placeM(S, i))));
      // the box opens: the walls fall outwards about their bottom edges, the lid flies off
      [0, 1, 3, 4].forEach((i) => {
        const a = open[`w${i}`];
        if (!a) return;
        const cs = [[0, 0, 0], [S, 0, 0], [0, S, 0], [S, S, 0]].map((p) => M4.pt(W[i], p)).sort((p, q) => p[2] - q[2]);
        const [p, q] = cs;
        const axis = norm(sub(q, p));
        const n = norm(M4.dir(W[i], [0, 0, 1]));
        const top = scl(add(cs[2], cs[3]), 0.5);
        const probe = M4.pt(M4.about(p, axis, 0.2), top);
        const sg = dot(sub(probe, top), n) > 0 ? 1 : -1;
        W[i] = M4.mul(M4.about(p, axis, (sg * a * Math.PI) / 2), W[i]);
      });
      if (open.lid) {
        const k = open.lid;
        const c = M4.pt(W[5], [S / 2, S / 2, 0]);
        W[5] = M4.mul(M4.T(-0.5 * S * k, -1.1 * S * k, 1.7 * S * k), M4.mul(M4.about(c, norm([1, -0.6, 0]), -k * 1.3), W[5]));
      }
      faces[5].style.opacity = open.lid ? String(1 - smooth(0.55, 1, open.lid)) : "";

      const band = (fold.band * (1 - open.untie));
      faces.forEach((f, i) => {
        f.style.transform = M4.css(W[i]);
        const n = norm(M4.dir(Rcam, M4.dir(W[i], [0, 0, 1])));
        const b = dot(n, LIGHT);
        f.style.setProperty("--sh", clamp((0.74 - b) * 0.42, 0, 0.42).toFixed(3));
        f.style.setProperty("--shb", clamp((0.74 + b) * 0.36, 0, 0.42).toFixed(3));
        f.style.setProperty("--band", (i === 5 ? smooth(0, 0.55, band) : smooth(0.35, 1, band)).toFixed(3));
      });
      tag.style.setProperty("--tag", smooth(0.5, 1, fold.bow * (1 - open.untie)).toFixed(3));
      flaps.forEach((fl) => { fl.el.style.transform = M4.css(M4.mul(W[fl.i], M4.mul(fl.basis(u), M4.R([1, 0, 0], (fl.sgn * fold.flaps * Math.PI) / 2)))); });

      // the shadow: wide and soft under the sheet in the air, tight under the box
      const walls = (fold.h0 + fold.h1 + fold.h2 + fold.h3) / 4;
      const opened = (open.w0 + open.w1 + open.w3 + open.w4) / 4;
      const cx = lerp(2 * S, 1.5 * S, smooth(0, 0.6, walls)), cy = 1.5 * S;
      const shS = lerp(lerp(3.4, 1.18, smooth(0.05, 0.9, walls)), 2.2, opened);
      shade.style.transform = `translate3d(${(cx - S / 2).toFixed(1)}px, ${(cy - S / 2).toFixed(1)}px, -1px) scale(${shS.toFixed(3)})`;
      shade.style.opacity = Math.max(air * 0.45, smooth(0.02, 0.5, walls) * 0.6 * (1 - opened * 0.5)).toFixed(3);

      // billboards turned to the camera: the bow on the lid, the cake on the bottom
      const bb = (p, w, h, extra = M4.I()) => M4.mul(M4.T(p[0], p[1], p[2]), M4.mul(M4.R([0, 0, 1], -rz * D2R), M4.mul(M4.R([1, 0, 0], -Math.PI / 2), M4.mul(extra, M4.T(-w / 2, -h, 0)))));
      const lidC = M4.pt(W[5], [S / 2, S / 2, 0]);
      const lidN = norm(M4.dir(W[5], [0, 0, 1]));
      const bw = bow.offsetWidth, bh = bow.offsetHeight;
      const up = open.untie;
      bow.style.transform = M4.css(bb(add(lidC, scl(lidN, 2 + up * S * 0.5)), bw, bh, M4.mul(M4.T(bw / 2, bh, 0), M4.mul(M4.R([0, 0, 1], up * 0.6), M4.T(-bw / 2, -bh, 0)))));
      bow.style.setProperty("--bow", (fold.bow * (1 - smooth(0.3, 1, up))).toFixed(3));
      bow.style.setProperty("--pull", revealed ? "0" : smooth(0.85, 1, fold.bow).toFixed(3));
      bow.style.visibility = fold.bow > 0.001 && up < 1 ? "" : "hidden";
      if (cake.classList.contains("is-on")) {
        const cw = cake.offsetWidth, ch = cake.offsetHeight;
        const k = open.cake;
        const squash = M4.mul(M4.T(cw / 2, ch, 0), M4.mul([lerp(0.7, 1, k), 0, 0, 0, 0, lerp(0.5, 1, k), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], M4.T(-cw / 2, -ch, 0)));
        cake.style.transform = M4.css(bb([1.5 * S, 1.5 * S, 1.5], cw, ch, squash));
      }
    }

    function dust(x, y) {
      for (let k = 0; k < 2; k++) {
        const d = document.createElement("i");
        d.className = "x-box__dust";
        d.style.left = `${x}px`;
        d.style.top = `${y}px`;
        world.appendChild(d);
        gsap.fromTo(d, { x: 0, y: 0, z: 4, scale: 1, opacity: 1 }, { x: gsap.utils.random(-14, 14) * L.u * 0.3, y: gsap.utils.random(-14, 14) * L.u * 0.3, z: 2, scale: 0.3, opacity: 0, duration: gsap.utils.random(0.6, 1.1), ease: "power2.out", onComplete: () => d.remove() });
      }
    }

    /* ── which step is on screen ── */
    let cur = -1;
    let started = false;
    function stepAt(time) {
      hint.classList.toggle("is-gone", time > TLF[0].go + 0.06);
      map.classList.toggle("is-gone", time < TLF[0].go || time > T.back + 0.12);
      let i = -1;
      TLF.forEach((f, k) => { if (time >= f.go + 0.2 && time < f.out + 0.03) i = k; });
      if (i !== cur) {
        if (cur >= 0) { scenes[cur].leave(); cards[cur].progress(1); }
        cur = i;
        if (i >= 0) { scenes[i].enter(); cards[i].restart(); }
        mapBtns.forEach((b, k) => { b.classList.toggle("is-here", k === i); b.classList.toggle("is-done", i >= 0 && k < i); });
        if (i >= 0) { $("[data-map-no]", map).textContent = String(i + 1).padStart(2, "0"); $("[data-map-name]", map).textContent = names[i]; }
        capItems.forEach((w, k) => w.classList.toggle("is-on", k === i));
      }
      capHost.classList.toggle("is-gone", cur < 0);
      if (time > T.tied + 0.42) reveal(true);
      else if (time < T.tied - 0.05) reveal(false);
      started = true;
    }

    /* ── the reveal: untie, lid off, walls down, the cherry lands on the cake ── */
    let revealed = false;
    let revealTl = null;
    let lightTimers = [];
    const lights = $$(".x-box__candle", cake);
    const topper = $(".x-box__topper svg", cake);
    const flags = $$(".x-box__garland i", cake);
    const string = $(".x-box__garland path", cake);
    flags.forEach((f, i) => {
      const k = (i + 1) / (flags.length + 1);
      f.style.left = `${k * 100}%`;
      f.style.top = `${((((1 - k) * (1 - k) * 6 + 2 * (1 - k) * k * 50 + k * k * 6) / 56) * 100).toFixed(1)}%`;
    });
    lights.forEach((c) => c.classList.add("is-unlit"));
    function reveal(on) {
      if (on === revealed) return;
      revealed = on;
      if (revealTl) revealTl.kill();
      lightTimers.forEach(clearTimeout);
      lightTimers = [];
      if (!on) {
        Object.assign(open, { untie: 0, lid: 0, w0: 0, w1: 0, w3: 0, w4: 0, cake: 0, oy: 0, s: 1, rx: 0 });
        cake.classList.remove("is-on");
        fin.classList.remove("is-on");
        lights.forEach((c) => c.classList.add("is-unlit"));
        gsap.set(flags, { opacity: 0 });
        render();
        return;
      }
      cake.classList.add("is-on");
      gsap.set(flags, { opacity: 0 });
      gsap.set(topper, { y: -400, opacity: 0 });
      revealTl = gsap.timeline({ onUpdate: render })
        .to(open, { untie: 1, duration: 0.5, ease: "power2.in" }, 0)
        .to(open, { lid: 1, duration: 1.1, ease: "power2.out" }, 0.35)
        .to(open, { w1: 1, duration: 1.2, ease: "bounce.out" }, 0.7)
        .to(open, { w0: 1, duration: 1.2, ease: "bounce.out" }, 0.8)
        .to(open, { w3: 1, duration: 1.2, ease: "bounce.out" }, 0.9)
        .to(open, { w4: 1, duration: 1.2, ease: "bounce.out" }, 1)
        .fromTo(open, { cake: 0 }, { cake: 1, duration: 1, ease: "elastic.out(1, 0.45)" }, 0.85)
        .to(open, { oy: () => (L.cap ? -L.vh * 0.02 : L.vh * 0.04), s: 1.12, rx: 8, duration: 1.8, ease: "power2.inOut" }, 0.6)
        .call(() => fx.pop(bowBtn, 24, 0.8), null, 0.1)
        .add(() => {
          gsap.fromTo(topper, { y: -400, opacity: 1, scaleY: 1.2 }, { y: 0, scaleY: 1, duration: 0.9, ease: "bounce.out" });
          gsap.delayedCall(0.3, () => fx.pop(topper, 40, 1.2));
          gsap.fromTo(string, { scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 0.9, delay: 0.3, ease: "elastic.out(1, 0.5)" });
          gsap.fromTo(flags, { y: -40, opacity: 0, rotation: -50 }, { y: 0, opacity: 1, rotation: 0, duration: 1.1, delay: 0.45, stagger: 0.06, ease: "elastic.out(1, 0.45)" });
          lights.forEach((c, k) => lightTimers.push(setTimeout(() => c.classList.remove("is-unlit"), 900 + k * 260)));
          gsap.delayedCall(0.6, () => fx.rain(cake, 70));
        }, 1.35)
        .call(() => fin.classList.add("is-on"), null, 1.6);
    }
    bowBtn.addEventListener("click", () => {
      if (!st) return;
      const y = st.start + (T.tied + 0.48) * ((st.end - st.start) / TOTAL);
      if (window.marLenis) window.marLenis.scrollTo(y, { duration: 1.2 });
      else scrollTo({ top: y, behavior: "smooth" });
      reveal(true);
    });

    /* ── scroll ── */
    const st = ScrollTrigger.create({
      trigger: box,
      start: "top top",
      end: () => `+=${Math.round(TOTAL * (pin.clientHeight || innerHeight))}`,
      pin,
      anticipatePin: 1,
      scrub: 0.9,
      animation: tl,
      invalidateOnRefresh: true,
    });
    ScrollTrigger.addEventListener("refreshInit", layout);
    render();
    stepAt(0);

    const go = (i) => {
      const y = st.start + (TLF[i].at + 0.12) * ((st.end - st.start) / TOTAL);
      if (window.marLenis) window.marLenis.scrollTo(y, { duration: 1.6 });
      else scrollTo({ top: y, behavior: "smooth" });
    };
    mapBtns.forEach((b, i) => b.addEventListener("click", () => go(i)));
    // keyboard: tabbing into a face (or its caption) brings the camera to it
    faces.forEach((f, i) => f.addEventListener("focusin", () => { if (cur !== i) go(i); }));
    capItems.forEach((w, i) => w.addEventListener("focusin", () => { if (cur !== i) go(i); }));
    return { go };
  }

  // the booking ticket shows a date ten days from today
  function bookingDate(sec, order) {
    const d = order.st.date;
    $("[data-date-day]", sec).textContent = d.getDate();
    $("[data-date-month]", sec).textContent = MONTHS_OF[d.getMonth()];
  }

  const NOOP = { enter() {}, leave() {} };

  // 01 · polaroids are dealt from the air and shuffled once round; tap to shuffle — the top one is your design
  function deck(sec, fx, order) {
    const el = $("[data-deck]", sec);
    const SLOTS = [["-11deg", "-30%"], ["9deg", "30%"], ["-2deg", "0%"]];
    const figs = () => $$("figure", el);
    const place = () => {
      figs().forEach((f, i) => { f.style.setProperty("--r", SLOTS[i][0]); f.style.setProperty("--x", SLOTS[i][1]); });
      order.set("design", el.lastElementChild.dataset.design);
    };
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
    place();
    if (!live) return NOOP;

    let timers = [];
    const settle = () => { gsap.killTweensOf(figs()); el.classList.remove("is-dealing"); figs().forEach((f) => { f.style.setProperty("--fx", "0px"); f.style.setProperty("--fy", "0px"); f.style.setProperty("--fr", "0deg"); f.style.opacity = ""; }); };
    return {
      enter() {
        timers.forEach(clearTimeout);
        el.classList.add("is-dealing");
        const all = figs();
        all.forEach((f, i) => gsap.fromTo(f,
          { "--fx": `${gsap.utils.random(-260, 260)}px`, "--fy": "-320px", "--fr": `${gsap.utils.random(-120, 120)}deg`, opacity: 0 },
          { "--fx": "0px", "--fy": "0px", "--fr": "0deg", opacity: 1, duration: 1.1, delay: 0.25 + i * 0.16, ease: "back.out(1.3)", onComplete: i === all.length - 1 ? () => { el.classList.remove("is-dealing"); fx.hearts(f, 5); } : null }));
        // once round the deck, back to where it started
        timers = [2.4, 3.5, 4.6].map((s) => setTimeout(() => { if (!hover) shuffle(); }, s * 1000));
      },
      leave() { timers.forEach(clearTimeout); settle(); },
    };
  }

  // 02 · the cake is cut, the halves fall apart and the slice is stacked layer by layer; a chip re-fills it
  function slice(sec, fx, order) {
    const el = $("[data-slice]", sec);
    const cake = $(".x-sc-slice__cake", el);
    const layers = $$(".x-sc-slice__cake > i:not(.x-sc-slice__plate):not(.x-sc-slice__berry)", el);
    const berry = $(".x-sc-slice__berry", el);
    const desc = $("[data-slice-desc]", el);
    const chips = $$("[data-flavor]", sec);
    const halfL = $(".x-sc-split__l", el);
    const halfR = $(".x-sc-split__r", el);
    const knife = $(".x-sc-split__knife", el);
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
      order.set("flavor", k);
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

    const apart = () => gsap.set([halfL, halfR], { xPercent: (i) => (i ? 40 : -40), rotation: (i) => (i ? 10 : -10) });
    let cut = null;
    apart();
    const finish = () => {
      if (swap) swap.kill();
      if (cut) cut.kill();
      apart();
      gsap.set(knife, { opacity: 0 });
      gsap.set([berry, ...layers], { x: 0, y: 0, rotation: 0, opacity: 1, scaleY: 1 });
      gsap.set(desc, { opacity: 1 });
    };
    return {
      enter() {
        finish();
        gsap.set([halfL, halfR], { xPercent: 0, rotation: 0 });
        gsap.set([berry, ...layers], { opacity: 0 });
        // the knife comes down through the whole cake, then the halves fall apart and the slice is stacked between
        cut = gsap.timeline({ delay: 0.35 })
          .fromTo(knife, { y: -120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.in" })
          .call(() => fx.pop(knife, 10, 0.4))
          .to(knife, { y: -160, opacity: 0, duration: 0.4, ease: "power2.in" }, "+=0.15")
          .to(halfL, { xPercent: -40, rotation: -10, duration: 1, ease: "elastic.out(1, 0.6)" }, "-=0.2")
          .to(halfR, { xPercent: 40, rotation: 10, duration: 1, ease: "elastic.out(1, 0.6)" }, "<");
        swap = stack().delay(1.3);
      },
      leave: finish,
    };
  }

  // 03 · guests → kilograms (≈180 g a guest, from 1,5 kg); a plate pops up per guest, the cake grows tiers
  function weight(sec, order) {
    const el = $("[data-kg]", sec);
    const input = $("[data-guests]", sec);
    const out = $("[data-kg-out]", el);
    const guests = $("[data-guests-out]", sec);
    const plates = $("[data-plates]", el);
    const cake = $(".x-sc-kg__cake", el);
    const animate = hasLibs && !reduce;
    let last = "";
    let tiers = "";
    let touched = false;
    const set = () => {
      const g = +input.value;
      const kg = Math.max(1.5, Math.round(g * 0.18 * 2) / 2);
      const txt = String(kg).replace(".", ",");
      guests.textContent = g;
      order.set("guests", g);
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
        demo = gsap.to(o, { g: 14, duration: 1.8, delay: 0.6, ease: "power2.inOut", onUpdate: () => { if (touched) return demo.kill(); input.value = Math.round(o.g); set(); } });
      },
      leave() { if (demo) demo.progress(1); },
    };
  }

  // 04 · the request is typed into the compose bar from your choices, sent with a paper plane, read and answered
  function chat(sec, fx, order) {
    const el = $("[data-chat]", sec);
    const msgs = $$(".x-sc-chat__msg", el);
    const [m1, m2, reply] = msgs;
    const typing = $(".x-sc-chat__typing", el);
    const pic = $(".x-sc-chat__pic", el);
    const picImg = $("[data-chat-pic]", el);
    const field = $("[data-chat-field]", el);
    const plane = $(".x-sc-chat__send svg", el);
    const status = $("[data-chat-status]", el);
    const PH = field.textContent;
    const react = document.createElement("i");
    react.className = "x-sc-chat__react";
    react.textContent = "♥";
    m1.appendChild(react);
    const write = () => {
      const { design, flavor, guests } = order.st;
      $("[data-chat-1]", el).textContent = `Привіт! Хочу ${DESIGNS[design].word} торт на ${guests} ${guestsWord(guests)} 🍰`;
      $("[data-chat-2]", el).textContent = FLAVORS[flavor].with;
      picImg.src = DESIGNS[design].img;
    };
    write();
    order.on(write);
    if (!live) return NOOP;

    let tl = null;
    const done = () => {
      if (tl) tl.kill();
      gsap.set([m1, m2, reply, pic, react], { autoAlpha: 1, y: 0, scale: 1 });
      gsap.set(typing, { autoAlpha: 0 });
      gsap.set(plane, { x: 0, y: 0, rotation: 0, opacity: 1 });
      el.classList.add("is-read");
      field.textContent = PH;
      field.classList.add("is-ph");
      status.textContent = "онлайн";
    };
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
      return gsap.to(o, { n: text.length, duration: text.length * 0.03, ease: "none", onStart: () => field.classList.remove("is-ph"), onUpdate: () => { field.textContent = text.slice(0, Math.round(o.n)); } });
    };
    const send = (msg) => gsap.timeline()
      .to(plane, { x: 34, y: -30, rotation: -20, opacity: 0, duration: 0.3, ease: "power2.in" })
      .call(() => { field.textContent = ""; })
      .fromTo(msg, { autoAlpha: 0, y: 26, scale: 0.8, transformOrigin: "100% 100%" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, 0.1)
      .fromTo(plane, { x: -16, y: 12, rotation: 0, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, 0.35);
    done();
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
      leave: done,
    };
  }

  // 05 · the calendar flips day by day to the booked date, circles it, and the wax seal is pressed down
  function booking(sec, fx) {
    const el = $(".x-sc-date", sec);
    const ticket = $(".x-sc-date__ticket", el);
    const day = $("[data-date-day]", el);
    const month = $("[data-date-month]", el);
    const ring = $(".x-sc-date__ring", el);
    const seal = $(".x-sc-date__seal", el);
    if (!live) return NOOP;

    let tl = null;
    const show = (d) => { day.textContent = d.getDate(); month.textContent = MONTHS_OF[d.getMonth()]; };
    const done = () => {
      if (tl) tl.kill();
      show(new Date(Date.now() + 10 * 864e5));
      gsap.set(ring, { strokeDashoffset: 0 });
      gsap.set(seal, { opacity: 1, scale: 1, rotation: 0 });
      gsap.set([day, ticket], { clearProps: "transform" });
    };
    done();
    return {
      enter() {
        done();
        show(new Date());
        gsap.set(ring, { strokeDashoffset: 1 });
        gsap.set(seal, { opacity: 0 });
        tl = gsap.timeline({ delay: 0.45 });
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
      leave: done,
    };
  }

  // 06 · a little van drives from Alkmaar to your party, drawing its route, and the party pin bounces
  function route(sec, fx) {
    const el = $("[data-map]", sec);
    const path = $("[data-route]", el);
    const trace = $("[data-trace]", el);
    const van = $("[data-van]", el);
    const end = $(".x-sc-map__pin--end", el);
    const len = path.getTotalLength();
    const put = (k) => {
      const p = path.getPointAtLength(len * k), q = path.getPointAtLength(Math.min(len, len * k + 1));
      const a = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
      van.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${a.toFixed(1)})`);
      trace.style.strokeDashoffset = (1 - k).toFixed(4);
    };
    put(1);
    if (!live) return NOOP;
    let tl = null;
    const o = { k: 1 };
    const done = () => { if (tl) tl.kill(); o.k = 1; put(1); gsap.set(end, { clearProps: "transform" }); };
    return {
      enter() {
        done();
        o.k = 0;
        put(0);
        tl = gsap.timeline({ delay: 0.5 })
          .to(o, { k: 1, duration: 2.6, ease: "power1.inOut", onUpdate: () => put(o.k) })
          .fromTo(end, { scale: 0.4, transformOrigin: "50% 100%" }, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.35)" })
          .call(() => fx.hearts(end, 5), null, "<");
      },
      leave: done,
    };
  }

  // the finale cake: blow out every candle for a wish, then they light up again
  function candles(sec, fx) {
    const all = $$(".x-box__candle", sec);
    const hint = $("[data-candle-hint]", sec);
    const text = hint.textContent;
    const cake = $("[data-cake]", sec);
    all.forEach((c) => c.addEventListener("click", () => {
      if (c.classList.contains("is-out") || c.classList.contains("is-unlit")) return;
      c.classList.add("is-out");
      c.setAttribute("aria-label", "Свічку задуто");
      if (all.every((x) => x.classList.contains("is-out"))) {
        hint.textContent = "бажання прийнято ✦";
        fx.pop(cake, 40, 1.2);
        fx.hearts(cake, 6);
        setTimeout(() => {
          all.forEach((x) => { x.classList.remove("is-out"); x.setAttribute("aria-label", "Задути свічку"); });
          hint.textContent = text;
        }, 3200);
      }
    }));
  }

  // the opening: the letters of the title carry their own slice of glaze, the glaze drips off them, a piping bag
  // writes the script word, and ingredients float round
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

  MARIDAY.onReady(init);
})();
