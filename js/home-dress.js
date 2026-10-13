/* Mariday home — ⑭ occasion: the party window.
   Eight real cakes stand on a turntable under a lamp. The stage is pinned; scrolling (or dragging the table, a chip,
   the dice, a tap on a cake) turns it so the next cake comes to the front, hops, and its party props pop on —
   candles, balloons, a plaque. The room redecorates itself for each occasion: soft glows in its colours, its own air
   on a canvas (petals, confetti, bubbles…). Hand notes point at the cake.
   The turntable is drawn flat: every frame each cake gets its x/y on the table's ellipse, a scale, a blur and a
   z-index from its depth — no 3D transforms, so drop-shadows and blurs keep working. */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const hasLibs = !!(window.gsap && window.ScrollTrigger);
  const live = hasLibs && !!window.Lenis && !reduce;
  const animate = hasLibs && !reduce;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const STEP = 45; // degrees between two cakes on the table
  const SPRINKLE_COLORS = ["#6d0809", "#f5bcc8", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff", "#9ed9b8"];

  const OCCASIONS = [
    { word: "весілля", name: "Весілля", text: "Яруси, живі квіти й дегустація начинок перед замовленням. Вагу рахуємо за нормою 150–200 г на гостя.", notes: ["яруси й живі квіти", "дегустація до замовлення", "150–200 г на гостя"], cta: "Весільні торти", href: "pages/cakes.html", wash: "#fbeff0", glow: ["#f6c6d0", "#f9e3c2"], dots: ["#f2b6c3", "#e9c98e", "#dcb5cf", "#b9d4bd"], air: "petals" },
    { word: "день народження", name: "День народження", text: "Напис, свічки й улюблена начинка іменинника — від бенто до двох ярусів.", notes: ["ваш напис кремом", "свічки — наші", "від бенто до 2 ярусів"], cta: "Зібрати в конструкторі", href: "pages/constructor.html", wash: "#fde3ea", glow: ["#f7a9c0", "#fde3a0"], dots: ["#ef6f8f", "#5fa8e8", "#f3c03f", "#5cc79b"], air: "confetti" },
    { word: "гендер-паті", name: "Гендер-паті", text: "Нейтральний декор зовні — і колір-сюрприз усередині. Дізнаєтесь із першим шматком.", notes: ["зовні — нейтрально", "рожевий чи блакитний — усередині", "секрет до першого шматка"], cta: "Зібрати в конструкторі", href: "pages/constructor.html", wash: "#e8eef8", glow: ["#f6b6c9", "#b8d4f5"], dots: ["#f28aa8", "#7fb4ec", "#f6b6c9", "#a9cdf3"], air: "puffs" },
    { word: "хрестини", name: "Хрестини", text: "Світлі пастельні відтінки, ніжні квіти й спокійний, урочистий дизайн.", notes: ["пастель", "ніжні квіти", "ім’я та дата — кремом"], cta: "Зібрати в конструкторі", href: "pages/constructor.html", wash: "#efe8f7", glow: ["#dccbf2", "#f7f1fd"], dots: ["#c7b2ea", "#e2cf94", "#b9d3ee", "#f3c9d6"], air: "sparkles" },
    { word: "бебі-шауер", name: "Бебі-шауер", text: "Пастель, мінімалізм і бенто для гостей — легкий солодкий стіл без зайвого.", notes: ["мінімалізм", "бенто кожному гостю", "капкейки на стіл"], cta: "Подивитись бенто", href: "pages/bento.html", wash: "#e5f0fb", glow: ["#bcdcf7", "#fbe9b5"], dots: ["#8fc3ef", "#f5d77e", "#f4b1c4", "#9fdcc4"], air: "bubbles" },
    { word: "річниця", name: "Річниця", text: "Бенто з вашою датою чи маленька копія весільного торта — для двох.", notes: ["ваша дата кремом", "копія весільного — на двох", "ягоди сезону"], cta: "Подивитись бенто", href: "pages/bento.html", wash: "#fbe1e4", glow: ["#f4a7b3", "#fbd0d5"], dots: ["#e0485f", "#f28aa0", "#b3123a", "#f6c2cb"], air: "hearts" },
    { word: "корпоратив", name: "Корпоратив", text: "Логотип компанії, капкейки й candy bar на всю команду.", notes: ["логотип — їстівний", "капкейки на всю команду", "candy bar"], cta: "Candy bar", href: "pages/desserts.html", wash: "#fdf1d8", glow: ["#f3d48a", "#fff1d0"], dots: ["#d9a93a", "#f1d27a", "#b8862a", "#c9b27a"], air: "gold" },
    { word: "просто так", name: "Просто так", text: "Бенто з жартом чи компліментом — найкращий привід без приводу.", notes: ["жарт або комплімент", "бенто на одного", "напис — будь-який"], cta: "Подивитись бенто", href: "pages/bento.html", wash: "#e3f4f1", glow: ["#b9e6da", "#f7c3cf"], dots: ["#ef8aa2", "#86b9e8", "#f3c25a", "#74c7a0"], air: "sprinkles" },
  ];
  const N = OCCASIONS.length;
  const NOTE_SIDES = ["l", "r", "r", "l"];
  const ARROW = '<svg class="x-dress__arrow" viewBox="0 0 64 44" aria-hidden="true"><path d="M2,2 C24,6 42,16 58,38"/><path d="M48,36 L58,38 L56,28"/></svg>';

  function burst(host, x, y, count = 30, spread = 1) {
    if (!animate) return;
    for (let i = 0; i < count; i++) {
      const sp = document.createElement("i");
      sp.style.cssText = `position:absolute;z-index:20;left:${x}px;top:${y}px;width:6px;height:16px;margin:-8px 0 0 -3px;border-radius:3px;pointer-events:none;background:${SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]}`;
      host.appendChild(sp);
      const a = Math.random() * Math.PI * 2;
      const d = gsap.utils.random(80, 220) * spread;
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

  // ─── the room's air: what floats around the window changes with the occasion ───
  // petals for a wedding, confetti for a birthday, pink and blue puffs for a gender reveal, sparkles for a christening,
  // soap bubbles for a baby shower, hearts for an anniversary, gold flakes for the office party, sprinkles just because.
  // Each kind is drawn once into a few small sprites; every frame the canvas only stamps them — moved, turned, flipped.
  // Scrolling blows the air upwards, the pointer pushes it aside, and on a new occasion the old air fades out while the
  // new one bursts out from behind the cake. Two of these run: the room's air behind the cakes, and a few big, blurred
  // pieces drifting in front of them (opts scales count, size, speed, opacity and blur for that near layer).
  function makeAir(canvas, live, opts = {}) {
    const O = { count: 1, size: 1, speed: 1, alpha: 1, blur: 0, ...opts };
    const g = canvas.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const blur = "filter" in g ? O.blur : 0;
    const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
    // a blurred sprite gets a margin, so the blur isn't cut off at its edges
    const sprite = (w, h, draw) => {
      const pad = Math.ceil(blur * 2.5);
      const c = document.createElement("canvas");
      c.width = Math.ceil((w + pad * 2) * DPR);
      c.height = Math.ceil((h + pad * 2) * DPR);
      const x = c.getContext("2d");
      x.scale(DPR, DPR);
      x.translate(pad, pad);
      if (blur) x.filter = `blur(${blur}px)`;
      draw(x, w, h);
      c.w = w + pad * 2;
      c.h = h + pad * 2;
      return c;
    };
    const petal = (c1, c2) => sprite(22, 28, (x, w, h) => {
      const gr = x.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, c1);
      gr.addColorStop(1, c2);
      x.fillStyle = gr;
      x.beginPath();
      x.moveTo(w * 0.5, h * 0.03);
      x.bezierCurveTo(w * 1.04, h * 0.22, w * 0.9, h * 0.86, w * 0.5, h * 0.97);
      x.bezierCurveTo(w * 0.1, h * 0.86, -w * 0.04, h * 0.22, w * 0.5, h * 0.03);
      x.fill();
      x.strokeStyle = "rgba(255,255,255,0.6)";
      x.lineWidth = 0.8;
      x.beginPath();
      x.moveTo(w * 0.5, h * 0.18);
      x.quadraticCurveTo(w * 0.42, h * 0.55, w * 0.52, h * 0.88);
      x.stroke();
    });
    const chip = (c, w, h) => sprite(w, h, (x) => { x.fillStyle = c; rr(x, 0, 0, w, h, Math.min(w, h) / 2.4); x.fill(); });
    const curl = (c) => sprite(32, 14, (x, w, h) => {
      x.strokeStyle = c;
      x.lineWidth = 2.8;
      x.lineCap = "round";
      x.beginPath();
      x.moveTo(2, h / 2);
      x.bezierCurveTo(w * 0.28, -h * 0.3, w * 0.4, h * 1.3, w * 0.62, h / 2);
      x.bezierCurveTo(w * 0.78, -h * 0.1, w * 0.9, h * 0.3, w - 2, h / 2);
      x.stroke();
    });
    const puff = (rgb) => sprite(120, 100, (x, w, h) => {
      [[0.5, 0.58, 0.42], [0.3, 0.5, 0.3], [0.7, 0.46, 0.32], [0.5, 0.36, 0.3]].forEach(([cx, cy, r]) => {
        const gr = x.createRadialGradient(w * cx, h * cy, 0, w * cx, h * cy, w * r);
        gr.addColorStop(0, `rgba(${rgb},0.75)`);
        gr.addColorStop(1, `rgba(${rgb},0)`);
        x.fillStyle = gr;
        x.fillRect(0, 0, w, h);
      });
    });
    const star = (c) => sprite(30, 30, (x, w, h) => {
      const cx = w / 2, cy = h / 2;
      const glow = x.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
      glow.addColorStop(0, "rgba(255,248,220,0.85)");
      glow.addColorStop(0.35, "rgba(255,240,200,0.3)");
      glow.addColorStop(1, "rgba(255,240,200,0)");
      x.fillStyle = glow;
      x.fillRect(0, 0, w, h);
      const R = w * 0.42;
      x.fillStyle = c;
      x.beginPath();
      x.moveTo(cx, cy - R);
      x.quadraticCurveTo(cx, cy, cx + R, cy);
      x.quadraticCurveTo(cx, cy, cx, cy + R);
      x.quadraticCurveTo(cx, cy, cx - R, cy);
      x.quadraticCurveTo(cx, cy, cx, cy - R);
      x.fill();
    });
    const bubble = sprite(44, 44, (x, w, h) => {
      const cx = w / 2, cy = h / 2, r = w / 2 - 1.5;
      const fill = x.createRadialGradient(cx * 0.75, cy * 0.65, r * 0.1, cx, cy, r);
      fill.addColorStop(0, "rgba(255,255,255,0.06)");
      fill.addColorStop(0.75, "rgba(255,255,255,0.16)");
      fill.addColorStop(1, "rgba(255,255,255,0.45)");
      x.fillStyle = fill;
      x.beginPath();
      x.arc(cx, cy, r, 0, Math.PI * 2);
      x.fill();
      const rim = x.createLinearGradient(0, 0, w, h);
      rim.addColorStop(0, "rgba(246,140,180,0.9)");
      rim.addColorStop(0.5, "rgba(120,180,245,0.85)");
      rim.addColorStop(1, "rgba(110,210,170,0.9)");
      x.strokeStyle = rim;
      x.lineWidth = 1.5;
      x.stroke();
      x.strokeStyle = "rgba(255,255,255,0.95)";
      x.lineWidth = 2.2;
      x.lineCap = "round";
      x.beginPath();
      x.arc(cx, cy, r * 0.7, Math.PI * 1.08, Math.PI * 1.42);
      x.stroke();
      x.fillStyle = "#fff";
      x.beginPath();
      x.arc(cx + r * 0.4, cy - r * 0.42, r * 0.08, 0, Math.PI * 2);
      x.fill();
    });
    const heart = (c1, c2) => sprite(26, 24, (x, w, h) => {
      const gr = x.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, c1);
      gr.addColorStop(1, c2);
      x.fillStyle = gr;
      x.beginPath();
      x.moveTo(w / 2, h * 0.94);
      x.bezierCurveTo(-w * 0.16, h * 0.45, w * 0.1, -h * 0.12, w / 2, h * 0.26);
      x.bezierCurveTo(w * 0.9, -h * 0.12, w * 1.16, h * 0.45, w / 2, h * 0.94);
      x.fill();
      x.fillStyle = "rgba(255,255,255,0.6)";
      x.beginPath();
      x.ellipse(w * 0.3, h * 0.3, w * 0.09, h * 0.05, -0.6, 0, Math.PI * 2);
      x.fill();
    });
    const flake = (w, h) => sprite(w, h, (x) => {
      const gr = x.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, "#fff4c8");
      gr.addColorStop(0.45, "#e7bc50");
      gr.addColorStop(1, "#a5741c");
      x.fillStyle = gr;
      rr(x, 0, 0, w, h, 1);
      x.fill();
    });
    const FUN = ["#ef6f8f", "#5fa8e8", "#f3c03f", "#5cc79b", "#f5bcc8", "#6d0809", "#b99be8"];
    // n: how many on a 1440×800 window; size: the sprite's scale range; vy: px/s (+ falls, − rises); sway: px; spin: rad/s;
    // flip: tumbles in 3D; twinkle: breathes; a: opacity range
    // (far: only in the room behind — a puff of smoke in front of the cakes would hide them)
    const KINDS = {
      petals: { n: 36, sp: [petal("#fde1e7", "#f19db1"), petal("#fffaf6", "#f4cdd6"), petal("#fbc9d4", "#e47f98")], size: [0.95, 1.7], vy: [26, 52], sway: [16, 38], spin: 1.1, flip: 1, a: [0.8, 1] },
      confetti: { n: 62, sp: [...FUN.map((c) => chip(c, 16, 8)), ...FUN.slice(0, 4).map(curl)], size: [0.8, 1.35], vy: [48, 92], sway: [8, 26], spin: 4, flip: 1, a: [0.85, 1] },
      puffs: { n: 15, far: 1, sp: [puff("246,160,190"), puff("140,185,240"), puff("250,200,215"), puff("175,205,245")], size: [0.9, 1.8], vy: [-12, -26], sway: [6, 16], spin: 0.15, a: [0.65, 1] },
      sparkles: { n: 44, sp: [star("#ffffff"), star("#f1d98f"), star("#d3c0f0"), star("#ffffff")], size: [0.55, 1.3], vy: [-5, -16], sway: [3, 10], spin: 0.4, twinkle: 1, a: [0.8, 1] },
      bubbles: { n: 30, sp: [bubble], size: [0.5, 1.45], vy: [-20, -42], sway: [10, 26], spin: 0, a: [0.85, 1] },
      hearts: { n: 32, sp: [heart("#f6889d", "#c51f40"), heart("#fbc0cb", "#ea6f8a"), heart("#e5435c", "#8c0e24")], size: [0.75, 1.5], vy: [-18, -38], sway: [8, 22], spin: 0.5, a: [0.8, 1] },
      gold: { n: 62, sp: [flake(10, 10), flake(13, 7), flake(7, 11), curl("#d9ab45"), star("#f1d98f")], size: [0.7, 1.3], vy: [38, 78], sway: [8, 24], spin: 5, flip: 1, a: [0.85, 1] },
      sprinkles: { n: 66, sp: FUN.map((c) => chip(c, 18, 5.5)), size: [0.8, 1.35], vy: [42, 84], sway: [5, 15], spin: 3, a: [0.9, 1] },
    };
    const R = (a, b) => a + Math.random() * (b - a);
    let W = 0, H = 0, density = 1, kind = "", parts = [], last = 0;
    const ptr = { x: 0, y: 0, on: false };
    function resize() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      density = Math.max(0.4, Math.min(1.2, (W * H) / (1440 * 800)));
      if (!live) draw();
    }
    // "in": somewhere in the room, fading in; "edge": just outside the edge it comes from, already opaque
    function spawn(K, where) {
      const z = R(0.45, 1);
      const sp = K.sp[Math.floor(Math.random() * K.sp.length)];
      const m = Math.max(sp.w, sp.h) * 1.4 * O.size;
      const vy = R(K.vy[0], K.vy[1]) * O.speed;
      const p = { K, sp, z, m, vy, s: R(K.size[0], K.size[1]) * (0.55 + 0.45 * z) * O.size, x: R(-m, W + m), y: R(0, H), vx: R(-6, 6), ph: R(0, 7), pf: R(0.6, 1.6), sw: R(K.sway[0], K.sway[1]) * O.speed, rot: R(0, 7), spin: R(-K.spin, K.spin), fp: R(0, 7), ff: R(1.5, 4), a: R(K.a[0], K.a[1]) * (0.6 + 0.4 * z) * O.alpha, fade: 0, dying: false, entering: false, bx: 0, by: 0, life: 0 };
      if (where === "edge") {
        p.y = vy > 0 ? -m - R(0, H * 0.7) : H + m + R(0, H * 0.7);
        p.fade = 1;
        p.entering = true;
      }
      return p;
    }
    const countOf = (K) => (K.far && O.count < 1 ? 0 : Math.round(K.n * density * O.count));
    function set(name) {
      if (name === kind || !KINDS[name]) return;
      kind = name;
      const K = KINDS[name];
      const n = countOf(K);
      if (!live) {
        parts = Array.from({ length: n }, () => Object.assign(spawn(K, "in"), { fade: 1 }));
        draw();
        return;
      }
      parts.forEach((p) => (p.dying = true));
      for (let i = 0; i < n; i++) parts.push(spawn(K, i < n * 0.5 ? "in" : "edge"));
    }
    // a handful of the new air bursts out from a point (behind the front cake), slows down and joins the room for a while
    function burst(x, y, n) {
      const K = KINDS[kind];
      if (!live || !K || !countOf(K)) return;
      for (let i = 0; i < n; i++) {
        const p = spawn(K, "in");
        const a = R(0, Math.PI * 2), v = R(180, 460) * O.speed;
        Object.assign(p, { x, y, fade: 1, bx: Math.cos(a) * v, by: Math.sin(a) * v * 0.8 - 140, life: R(2.4, 4) });
        parts.push(p);
      }
    }
    function draw() {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        const tw = p.K.twinkle ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p.fp)) : 1;
        const al = p.a * p.fade * tw;
        if (al < 0.01) continue;
        const fx = p.K.flip ? Math.cos(p.fp) : 1;
        const s = p.s * DPR * (p.K.twinkle ? 0.8 + 0.2 * tw : 1);
        const c = Math.cos(p.rot), sn = Math.sin(p.rot);
        g.setTransform(c * s * fx, sn * s * fx, -sn * s, c * s, p.x * DPR, p.y * DPR);
        g.globalAlpha = al;
        g.drawImage(p.sp, -p.sp.w / 2, -p.sp.h / 2, p.sp.w, p.sp.h);
      }
      g.globalAlpha = 1;
    }
    function step(v) {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const push = Math.max(-40, Math.min(40, v)) * 0.55 * O.speed;
      const damp = Math.max(0, 1 - 2.4 * dt);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.ph += p.pf * dt;
        p.fp += p.ff * dt;
        p.rot += p.spin * dt;
        p.x += (p.vx + Math.cos(p.ph) * p.sw) * dt;
        p.y += p.vy * (0.55 + 0.45 * p.z) * dt - push * p.z;
        if (p.life) {
          p.x += p.bx * dt;
          p.y += p.by * dt;
          p.bx *= damp;
          p.by *= damp;
          p.life -= dt;
          if (p.life <= 0) { p.life = 0; p.dying = true; }
        }
        if (ptr.on) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.hypot(dx, dy);
          if (d < 130 && d > 0.1) {
            const f = (1 - d / 130) * 320 * dt;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }
        if (p.dying) {
          p.fade -= dt * 1.5;
          if (p.fade <= 0) parts.splice(i, 1);
          continue;
        }
        p.fade = Math.min(1, p.fade + dt * 1.1);
        const span = H + 2 * p.m;
        if (p.entering) {
          if (p.y > -p.m && p.y < H + p.m) p.entering = false;
        } else if (p.y > H + p.m) p.y -= span;
        else if (p.y < -p.m) p.y += span;
        if (p.x > W + p.m) p.x -= W + 2 * p.m;
        else if (p.x < -p.m) p.x += W + 2 * p.m;
      }
      draw();
    }
    const wake = () => { last = performance.now(); };
    return { set, burst, step, resize, wake, ptr };
  }

  // ─── the way out: the room doesn't end in a straight line — its floor is a fondant drape in the occasion's colour
  // hanging over the reviews. The swags sag as the seam rises up the screen and stretch on a fast scroll; cream pearls
  // are piped along the hem left to right, and a rosette pops onto every joint with a pair of cherries hanging from it
  // that swing with the scroll and with the pointer brushing past. A finger on a swag presses it down a little.
  function drape(sec, pin) {
    const el = document.createElement("div");
    el.className = "x-dress__drape";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `<svg><defs>
      <pattern id="x-drape-dots" patternUnits="userSpaceOnUse" width="26" height="26"><circle cx="1" cy="1" r="1.2"/></pattern>
      <radialGradient id="x-drape-cherry" cx="0.36" cy="0.3" r="0.8"><stop offset="0" stop-color="#ff8fa3"/><stop offset="0.42" stop-color="#c0142a"/><stop offset="1" stop-color="#5a0206"/></radialGradient>
      <linearGradient id="x-drape-tone" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="60"><stop class="x-drape__wash" offset="0"/><stop class="x-drape__wash" offset="0.15"/><stop class="x-drape__hem" offset="1"/></linearGradient>
      <filter id="x-drape-shadow" x="-5%" y="-20%" width="110%" height="260%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dy="9" result="b"/><feFlood flood-color="#3d0405" flood-opacity="0.14"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="x-drape-lift" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feOffset dy="3" result="b"/><feFlood flood-color="#3d0405" flood-opacity="0.22"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <clipPath id="x-drape-cut"><rect x="-100" y="0" width="20000" height="4000"/></clipPath>
      <clipPath id="x-drape-pipe"><rect class="x-drape__tip" x="-20" y="-40" width="0" height="400"/></clipPath>
    </defs>
    <g clip-path="url(#x-drape-cut)"><g filter="url(#x-drape-shadow)">
      <path class="x-drape__body"/><path class="x-drape__dots" fill="url(#x-drape-dots)"/>
      <path class="x-drape__fold"/><path class="x-drape__sheen"/>
      <g clip-path="url(#x-drape-pipe)"><path class="x-drape__pearls x-drape__pearls--shade"/><path class="x-drape__pearls"/><path class="x-drape__pearls x-drape__pearls--glint"/></g>
    </g></g>
    <g class="x-drape__knots" filter="url(#x-drape-lift)"></g></svg>`;
    sec.appendChild(el);
    const svg = $("svg", el);
    const [body, dots, fold, sheen] = ["body", "dots", "fold", "sheen"].map((c) => $(`.x-drape__${c}`, svg));
    const pearls = $$(".x-drape__pearls", svg);
    const tip = $(".x-drape__tip", svg);
    const knotsEl = $(".x-drape__knots", svg);
    const pattern = $("pattern", svg);
    const tone = $("#x-drape-tone", svg);
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const backOut = (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;

    // a piped rose: a cream disc with a swirl on it
    let swirl = "";
    for (let j = 0; j <= 44; j++) {
      const t = j / 44, a = t * Math.PI * 5.2, r = 1 + t * 8.4;
      swirl += `${j ? "L" : "M"}${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r * 0.9).toFixed(2)}`;
    }
    const KNOT = `<g class="x-drape__cherry">
        <path class="x-drape__leaf" d="M1,6 C7,0 15,2 18,7 C12,11 6,11 1,6Z"/>
        <path class="x-drape__stem" d="M0,3 C2,12 -3,20 -7,25 M0,3 C1,13 5,21 7,27"/>
        <circle cx="-7" cy="31" r="7.4" fill="url(#x-drape-cherry)"/><circle cx="7" cy="33" r="7.4" fill="url(#x-drape-cherry)"/>
        <ellipse class="x-drape__shine" cx="-9.4" cy="28.4" rx="2" ry="1.4"/><ellipse class="x-drape__shine" cx="4.6" cy="30.4" rx="2" ry="1.4"/>
      </g>
      <g class="x-drape__rose"><circle r="10.6"/><path d="${swirl}"/></g>`;

    // n swags across the width, each hanging between two pins at height A; depth: a swag's full sag
    let W = 0, k = 1, n = 0, w = 0, A = 0, depth = 0, knots = [], poke = [], pokeV = [];
    const align = () => {
      // the drape is cut from the same cloth: its dots carry on from the room's
      const ph = pin.getBoundingClientRect().height;
      pattern.setAttribute("patternTransform", `translate(0 ${(-(ph % 26)).toFixed(2)})`);
    };
    const layout = () => {
      W = el.offsetWidth || innerWidth;
      k = Math.min(1.1, Math.max(0.62, W / 1440));
      n = Math.max(3, Math.round(W / (240 * k)));
      w = W / n;
      A = 7 * k;
      depth = w * 0.24;
      // the cloth leaves the room in the room's colour and deepens into the occasion's glow towards the hem
      tone.setAttribute("y2", (A + depth).toFixed(1));
      const H = Math.ceil(A + depth * 1.7 + 24 * k);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.style.height = H + "px";
      fold.style.strokeWidth = (2.2 * k).toFixed(2);
      sheen.style.strokeWidth = (3 * k).toFixed(2);
      const gap = (13 * k).toFixed(2);
      pearls.forEach((p, j) => {
        p.style.strokeDasharray = `0 ${gap}`;
        p.style.strokeWidth = ([8.6, 8.6, 2.6][j] * k).toFixed(2);
      });
      pearls[0].setAttribute("transform", `translate(0 ${(1.4 * k).toFixed(2)})`);
      pearls[2].setAttribute("transform", `translate(${(-1.4 * k).toFixed(2)} ${(-1.6 * k).toFixed(2)})`);
      knotsEl.innerHTML = "";
      knots = [];
      for (let i = 1; i < n; i++) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", `translate(${(i * w).toFixed(1)} ${A.toFixed(1)}) scale(${k.toFixed(3)})`);
        g.innerHTML = KNOT;
        knotsEl.appendChild(g);
        knots.push({ x: i * w, ch: $(".x-drape__cherry", g), rose: $(".x-drape__rose", g), a: 0, v: 0, dir: i % 2 ? 1 : -1, on: false });
      }
      poke = new Array(n).fill(0);
      pokeV = new Array(n).fill(0);
      align();
    };

    // p: how far the seam has risen (0 at the bottom of the screen, 1 at the top); s: the springy stretch from scroll
    // speed; t: time, for a slow breath of the cloth
    const draw = (p, s, t) => {
      const g = 1 - (1 - clamp(p / 0.45)) ** 2;
      const front = (W + 40) * clamp((p - 0.03) / 0.4);
      let hem = "", folds = "", shine = "";
      for (let i = 0; i < n; i++) {
        const x0 = i * w, x1 = x0 + w;
        const D = Math.max(4, depth * (0.32 + 0.68 * g) * (1 + s * 0.45) + Math.sin(t * 1.3 + i * 1.9) * 1.3 * k + poke[i]);
        // a cubic with both handles at h sags to 0.75·h in the middle
        const h = D / 0.75;
        hem += ` C${(x0 + w * 0.12).toFixed(1)},${(A + h).toFixed(1)} ${(x1 - w * 0.12).toFixed(1)},${(A + h).toFixed(1)} ${x1.toFixed(1)},${A.toFixed(1)}`;
        // the pleats gather at the pins: two folds and a line of light inside each swag
        const arc = (q) => `M${(x0 + 2).toFixed(1)},${A.toFixed(1)} C${(x0 + w * 0.17).toFixed(1)},${(A + h * q).toFixed(1)} ${(x1 - w * 0.17).toFixed(1)},${(A + h * q).toFixed(1)} ${(x1 - 2).toFixed(1)},${A.toFixed(1)}`;
        folds += arc(0.62) + arc(0.3);
        shine += arc(0.84);
      }
      const cloth = `M0,-1 L0,${A.toFixed(1)}${hem} L${W},-1 Z`;
      body.setAttribute("d", cloth);
      dots.setAttribute("d", cloth);
      fold.setAttribute("d", folds);
      sheen.setAttribute("d", shine);
      pearls.forEach((pp) => pp.setAttribute("d", `M0,${A.toFixed(1)}${hem}`));
      tip.setAttribute("width", Math.max(0, front + 20).toFixed(1));
      // the piping reaches a pin: the rose pops on, the cherries drop from it and swing
      knots.forEach((kn) => {
        const q = clamp((front - kn.x) / (70 * k));
        const on = q > 0.35;
        if (on && !kn.on) kn.v += 4.2 * kn.dir;
        kn.on = on;
        kn.rose.setAttribute("transform", `scale(${backOut(q).toFixed(3)})`);
        const c = clamp((q - 0.25) / 0.6);
        kn.ch.setAttribute("transform", `rotate(${((kn.a * 180) / Math.PI).toFixed(2)}) translate(0 ${((1 - c) * -14).toFixed(1)}) scale(${(c && backOut(c)).toFixed(3)})`);
      });
    };

    layout();
    if (!animate) {
      draw(1, 0, 0);
      return { run() {} };
    }
    draw(0, 0, 0);

    const ptr = { x: 0, y: 0, vx: 0, on: false };
    const onMove = (e) => {
      if (e.pointerType === "touch") return;
      const r = svg.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (ptr.on) ptr.vx += x - ptr.x;
      Object.assign(ptr, { x, y, on: true });
    };
    let pp = 0, s = 0, sv = 0, ps = 0, prevTop = null;
    const tick = (time, dtMs) => {
      const top = el.getBoundingClientRect().top;
      const vh = innerHeight;
      const dt = Math.min(0.05, Math.max(1 / 240, (dtMs || 16) / 1000));
      // screens per second, positive while scrolling down: the cloth lags behind the rising seam and pulls longer
      const speed = prevTop == null ? 0 : (prevTop - top) / vh / dt;
      prevTop = top;
      sv += (Math.max(-0.5, Math.min(1, speed * 0.3)) - s) * 0.1;
      sv *= 0.8;
      s += sv;
      pp += (clamp(1 - top / vh) - pp) * 0.2;
      // the cherries: a jolt whenever the stretch changes, a flick from the pointer brushing past; then a damped swing
      const ds = s - ps;
      ps = s;
      knots.forEach((kn) => {
        kn.v += ds * 30 * kn.dir;
        if (ptr.on && Math.abs(ptr.x - kn.x) < 34 * k && ptr.y > A - 16 * k && ptr.y < A + 50 * k) kn.v += ptr.vx * 0.045;
        kn.v += (-34 * kn.a - 1.7 * kn.v) * dt;
        kn.a = Math.max(-1.1, Math.min(1.1, kn.a + kn.v * dt));
      });
      // a pointer resting on a swag presses it down
      for (let i = 0; i < n; i++) {
        const mid = (i + 0.5) * w;
        const near = ptr.on && Math.abs(ptr.x - mid) < w / 2 && ptr.y > 0 && ptr.y < A + depth * 1.1;
        const want = near ? 13 * k * (1 - Math.abs(ptr.x - mid) / (w / 2)) : 0;
        pokeV[i] = (pokeV[i] + (want - poke[i]) * 0.12) * 0.8;
        poke[i] += pokeV[i];
      }
      ptr.vx = 0;
      draw(pp, s, time);
    };
    const settle = (p) => {
      pp = p;
      s = sv = ps = 0;
      knots.forEach((kn) => { kn.a = kn.v = 0; kn.on = p > 0.5; });
      poke.fill(0);
      pokeV.fill(0);
      draw(pp, 0, 0);
    };

    let lastW = W;
    addEventListener("resize", () => {
      if (el.offsetWidth === lastW) return align();
      lastW = el.offsetWidth;
      layout();
      draw(pp, 0, 0);
    });

    return {
      // after the pin exists, so the trigger is measured below its spacer
      run() {
        ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: () => `top -${svg.getBoundingClientRect().height}px`,
          onRefresh: (self) => {
            align();
            if (!self.isActive) settle(self.progress > 0.5 ? 1 : 0);
          },
          onToggle: (self) => {
            if (self.isActive) {
              prevTop = null;
              gsap.ticker.add(tick);
              addEventListener("pointermove", onMove, { passive: true });
            } else {
              gsap.ticker.remove(tick);
              removeEventListener("pointermove", onMove);
              ptr.on = false;
              settle(self.progress > 0.5 ? 1 : 0);
            }
          },
        });
      },
    };
  }

  function init() {
    const sec = $(".x-dress");
    if (!sec) return;
    const pin = $(".x-dress__pin", sec);
    const stage = $("[data-dress-stage]", sec);
    const ring = $("[data-dress-ring]", sec);
    const table = $(".x-dress__table", sec);
    const lamp = $(".x-dress__lamp", sec);
    const disc = $("[data-dress-disc]", sec);
    const nameEl = $("[data-dress-name]", sec);
    const textEl = $("[data-dress-text]", sec);
    const notesEl = $("[data-dress-notes]", sec);
    const cta = $("[data-dress-cta]", sec);
    const chipsEl = $("[data-dress-chips]", sec);
    const dot = $(".x-dress__dot", chipsEl);
    const lucky = $("[data-dress-lucky]", sec);
    // the room's air behind the cakes, and (moving only) a few big blurred pieces drifting in front of them
    const airs = [makeAir($(".x-dress__air", sec), animate)];
    const nearCv = $(".x-dress__air--near", sec);
    if (animate && nearCv) airs.push(makeAir(nearCv, true, { count: 0.13, size: 2.5, speed: 1.6, alpha: 0.55, blur: 2.6 }));
    else if (nearCv) nearCv.remove();
    const air = {
      set: (k) => airs.forEach((a) => a.set(k)),
      step: (v) => airs.forEach((a) => a.step(v)),
      resize: () => airs.forEach((a) => a.resize()),
      wake: () => airs.forEach((a) => a.wake()),
      point: (x, y, on) => airs.forEach((a) => Object.assign(a.ptr, { x, y, on })),
      burst: (x, y) => airs.forEach((a, k) => a.burst(x, y, k ? 3 : 22)),
    };
    const cakes = $$("[data-dress-cake]", ring).sort((a, b) => +a.dataset.dressCake - +b.dataset.dressCake);
    const pics = cakes.map((c) => $(".x-dress__pic", c));
    const props = cakes.map((c) => [...$(".x-dress__props", c).children]);
    if (cakes.length !== N) return;

    // a chip per occasion: the cake's own cut-out on a little plate
    const chips = OCCASIONS.map((o, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "x-dress__chip";
      b.setAttribute("aria-label", o.name);
      const src = $("img", cakes[i]).getAttribute("src");
      b.innerHTML = `<i><img src="${src}" alt="" loading="lazy"></i><span>${o.name}</span>`;
      b.addEventListener("click", () => go(i));
      chipsEl.appendChild(b);
      return b;
    });

    // ─── the turntable ───
    // angle: how far the table has turned (cake i is in front when angle = i·STEP); target: where the scroll wants it;
    // extra: a whole spin the dice adds; drag: the pointer's pull while dragging
    const S = { angle: 0, target: 0, extra: 0, drag: 0 };
    let R = 0, RY = 0, drawn = null;
    const measure = () => { R = ring.clientWidth / 2; RY = R * 0.34; };
    function render(force) {
      const a = S.angle + S.extra + S.drag;
      if (!force && a === drawn) return;
      drawn = a;
      disc.style.rotate = a + "deg";
      for (let i = 0; i < N; i++) {
        const t = ((i * STEP - a) * Math.PI) / 180;
        const d = Math.cos(t); // 1 in front, -1 at the back
        const k = (d + 1) / 2;
        // smaller towards the back, and the cake right in front steps forward into the light
        const s = (0.45 + 0.55 * k) * (1 + 0.3 * k ** 16);
        const blur = (1 - k) * 2.2;
        const c = cakes[i];
        c.style.transform = `translate(${(Math.sin(t) * R).toFixed(1)}px, ${(d * RY).toFixed(1)}px) scale(${s.toFixed(3)})`;
        c.style.zIndex = 1 + Math.round(k * 100);
        c.style.filter = blur < 0.08 ? "" : `blur(${blur.toFixed(2)}px) brightness(${(0.82 + 0.18 * k).toFixed(3)})`;
      }
    }

    let onScreen = false;

    const tick = () => {
      const diff = S.target - S.angle;
      if (!animate || Math.abs(diff) < 0.02) S.angle = S.target;
      else S.angle += diff * 0.11;
      render();
      if (!animate) return;
      if (onScreen) air.step((window.marLenis && window.marLenis.velocity) || 0);
    };

    // ─── the front cake: props, notes, info ───
    let cur = -1;
    let tl = null;
    const moveDot = (i) => {
      const b = chips[i];
      const x = b.offsetLeft + b.offsetWidth / 2;
      if (animate) gsap.to(dot, { x, duration: 0.6, ease: "elastic.out(1, 0.6)" });
      else dot.style.transform = `translateX(${x}px)`;
      const left = b.offsetLeft - (chipsEl.clientWidth - b.offsetWidth) / 2;
      chipsEl.scrollTo({ left, behavior: animate ? "smooth" : "auto" });
    };
    const writeInfo = (o, i) => {
      nameEl.innerHTML = "";
      o.name.split(" ").forEach((w, k) => {
        if (k) nameEl.appendChild(document.createTextNode(" "));
        const s = document.createElement("span");
        s.className = "w";
        s.textContent = w;
        nameEl.appendChild(s);
      });
      textEl.textContent = o.text;
      notesEl.innerHTML = "";
      o.notes.forEach((t, k) => {
        const li = document.createElement("li");
        li.className = "x-dress__note";
        li.dataset.side = NOTE_SIDES[k % NOTE_SIDES.length];
        li.textContent = t;
        li.insertAdjacentHTML("beforeend", ARROW);
        notesEl.appendChild(li);
      });
      cta.href = o.href;
      $("span", cta).textContent = o.cta;
      chips.forEach((c, k) => c.setAttribute("aria-current", String(k === i)));
      cakes.forEach((c, k) => c.classList.toggle("is-front", k === i));
      sec.style.setProperty("--wash", o.wash);
      sec.style.setProperty("--glow-a", o.glow[0]);
      sec.style.setProperty("--glow-b", o.glow[1]);
    };
    const frontPoint = (i) => {
      const sb = stage.getBoundingClientRect(), cb = cakes[i].getBoundingClientRect();
      return [cb.left - sb.left + cb.width / 2, cb.top - sb.top + cb.height * 0.5];
    };

    function setIndex(i, dir = 1) {
      if (i === cur) return;
      const o = OCCASIONS[i];
      const prev = cur;
      cur = i;
      moveDot(i);
      if (!animate || prev < 0) {
        writeInfo(o, i);
        air.set(o.air);
        if (animate) props.forEach((p, k) => gsap.set(p, { "--pop": k === i ? 1 : 0, "--py": "0px", opacity: k === i ? 1 : 0 }));
        return;
      }
      if (tl) tl.progress(1).kill();
      tl = gsap.timeline();

      // the old props pop off; the new cake hops as it arrives, the table dips, and its props pop on
      // (props and notes pop through CSS variables: GSAP would freeze their percentage translate into pixels)
      tl.to(props[prev], { "--pop": 0, "--py": "-14px", opacity: 0, duration: 0.22, stagger: 0.02, ease: "back.in(2)" }, 0)
        .to(pics[i], { y: -28, duration: 0.26, ease: "power2.out" }, 0.18)
        .to(pics[i], { y: 0, duration: 0.7, ease: "bounce.out" }, 0.44)
        .fromTo(table, { scaleY: 1 }, { scaleY: 0.95, duration: 0.09, yoyo: true, repeat: 1 }, 0.44)
        .call(() => {
          const [x, y] = frontPoint(i);
          burst(stage, x, y, 24, 0.9);
          // the new occasion's air bursts out from behind the cake (the air canvases cover the whole pin)
          const pb = pin.getBoundingClientRect(), sb = stage.getBoundingClientRect();
          air.burst(x + sb.left - pb.left, y + sb.top - pb.top);
        }, null, 0.46)
        .fromTo(props[i], { "--pop": 0, "--py": "-30px", opacity: 0 }, { "--pop": 1, "--py": "0px", opacity: 1, duration: 0.7, stagger: 0.07, ease: "back.out(2.4)" }, 0.5);

      air.set(o.air);

      // the info: the name word by word, the line; the notes are pinned up one after another
      tl.to([nameEl, textEl], { opacity: 0, y: -10, duration: 0.18, ease: "power1.in" }, 0)
        .to([...notesEl.children], { "--pop": 0, opacity: 0, duration: 0.18, stagger: 0.03, ease: "back.in(2)" }, 0)
        .call(() => {
          writeInfo(o, i);
          gsap.set(nameEl, { opacity: 1, y: 0 });
          gsap.fromTo($$(".w", nameEl), { yPercent: 90, opacity: 0, rotation: 6 }, { yPercent: 0, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.06, ease: "back.out(2)" });
          gsap.fromTo([...notesEl.children], { "--pop": 0, "--spin": "-14deg", opacity: 0 }, { "--pop": 1, "--spin": "0deg", opacity: 1, duration: 0.6, stagger: 0.1, delay: 0.35, ease: "back.out(2.6)" });
        }, null, 0.2)
        .fromTo(textEl, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" }, 0.35);
    }

    // ─── getting to a cake: by scroll when pinned, directly otherwise ───
    let st = null;
    const posOf = (i) => st.start + (st.end - st.start) * (i / (N - 1)) + 2;
    function go(i) {
      i = ((i % N) + N) % N;
      if (st) {
        const y = posOf(i);
        if (window.marLenis) window.marLenis.scrollTo(y, { duration: 1.1 });
        else scrollTo({ top: y, behavior: "smooth" });
      } else {
        S.target = i * STEP;
        if (!hasLibs) { S.angle = S.target; render(true); }
        setIndex(i, i > cur ? 1 : -1);
      }
    }

    // a tap on the front cake turns to the next one; a tap on any other brings it round
    let dragEnd = 0;
    cakes.forEach((c, i) => c.addEventListener("click", () => {
      if (performance.now() - dragEnd < 300) return;
      go(i === cur ? cur + 1 : i);
    }));

    // the dice: a whole extra spin while the scroll takes us to a random cake
    lucky.addEventListener("click", () => {
      let k = cur;
      while (k === cur) k = Math.floor(Math.random() * N);
      if (animate) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        lucky.classList.remove("is-spin");
        void lucky.offsetWidth;
        lucky.classList.add("is-spin");
        // a full turn is invisible once it is complete, so extra simply resets to 0
        gsap.fromTo(S, { extra: 0 }, { extra: 360 * dir, duration: 1.5, ease: "power2.inOut", overwrite: "auto", onComplete: () => { S.extra = 0; } });
      }
      go(k);
    });

    // dragging the table (mouse, or a sideways swipe on a phone — vertical swipes still scroll)
    let pdown = null, dragging = false;
    stage.addEventListener("pointerdown", (e) => {
      if (e.button) return;
      pdown = { x: e.clientX, id: e.pointerId };
      dragging = false;
    });
    stage.addEventListener("pointermove", (e) => {
      if (!pdown || e.pointerId !== pdown.id) return;
      const dx = e.clientX - pdown.x;
      if (!dragging && Math.abs(dx) > 6) {
        dragging = true;
        stage.classList.add("is-drag");
        try { stage.setPointerCapture(pdown.id); } catch (_) { /* the pointer is gone already */ }
      }
      if (dragging) { S.drag = -dx * (STEP / 150); render(); }
    });
    const release = (e) => {
      if (!pdown || (e && e.pointerId !== pdown.id)) return;
      pdown = null;
      stage.classList.remove("is-drag");
      if (!dragging) return;
      dragging = false;
      dragEnd = performance.now();
      // keep the table where it was pulled to, then glide to the nearest cake
      S.angle += S.drag;
      S.drag = 0;
      go(Math.max(0, Math.min(N - 1, Math.round(S.angle / STEP))));
    };
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);
    stage.addEventListener("lostpointercapture", release);

    // the title's letters each carry their own slice of the glaze (a letter with a transform falls out of the
    // parent's background-clip, so the glaze is cut per letter and lined up by hand)
    const inner = $(".x-dress__w1 > span", sec);
    const letters = $$(".x-dress__ltr", inner);
    const glaze = () => {
      inner.style.setProperty("--ww", `${inner.offsetWidth}px`);
      letters.forEach((lt) => lt.style.setProperty("--lx", `${lt.offsetLeft - inner.offsetLeft}px`));
      inner.classList.add("is-split");
    };

    // ─── start ───
    measure();
    glaze();
    air.resize();
    setIndex(0);
    render(true);
    if (hasLibs) gsap.ticker.add(tick);
    const relayout = () => { measure(); glaze(); air.resize(); render(true); moveDot(cur); };
    addEventListener("resize", relayout);
    if (window.ResizeObserver) new ResizeObserver(relayout).observe(stage);
    document.fonts?.ready.then(relayout);
    const exit = drape(sec, pin);
    if (!animate) return;

    sec.classList.add("is-anim");
    if (window.IntersectionObserver) new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; air.wake(); }, { rootMargin: "120px 0px" }).observe(sec);
    else onScreen = true;
    props.forEach((p, k) => { if (k) gsap.set(p, { "--pop": 0, opacity: 0 }); });

    // the window tilts a touch after the pointer
    const ringX = gsap.quickTo(ring, "x", { duration: 0.9, ease: "power3" });
    pin.addEventListener("pointermove", (e) => {
      if (dragging || e.pointerType === "touch") return;
      const r = pin.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      ringX(px * 26);
      // the air parts around the pointer
      air.point(e.clientX - r.left, e.clientY - r.top, true);
    });
    pin.addEventListener("pointerleave", () => air.point(0, 0, false));

    // the opening: the title is served, the lamp swings in, the table rises and the cakes drop onto it (back ones first)
    gsap.set(pics, { y: -340, opacity: 0 });
    gsap.set(table, { y: 60, opacity: 0, scale: 0.8, transformOrigin: "50% 100%" });
    gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 88%", once: true } })
      .from(letters, { yPercent: 70, opacity: 0, rotation: 8, duration: 0.55, stagger: 0.025, ease: "back.out(2)" }, 0)
      .fromTo(".x-dress__script", { clipPath: "inset(-60% 100% -90% -30%)" }, { clipPath: "inset(-60% -30% -90% -30%)", duration: 0.6, ease: "power2.inOut", clearProps: "clipPath" }, 0.2)
      .from(lamp, { rotation: -16, transformOrigin: "50% 0", duration: 1.4, ease: "elastic.out(1, 0.3)" }, 0)
      .to(table, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" }, 0.1)
      .to(pics, { y: 0, opacity: 1, duration: 0.7, stagger: (i) => 0.14 * (Math.cos((i * Math.PI) / 4) + 1), ease: "bounce.out" }, 0.25)
      .from(".x-dress__sub", { opacity: 0, x: -20, duration: 0.5 }, 0.45)
      .from(chips, { y: 20, opacity: 0, duration: 0.4, stagger: 0.03, ease: "back.out(2)" }, 0.45);

    if (!live) return exit.run();
    sec.classList.add("is-live");
    st = ScrollTrigger.create({
      trigger: sec,
      start: "top top",
      end: () => "+=" + innerHeight * 0.75 * (N - 1),
      pin,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        S.target = self.progress * STEP * (N - 1);
        const i = Math.min(N - 1, Math.round(S.target / STEP));
        if (i !== cur) setIndex(i, self.direction);
      },
    });
    exit.run();
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  MARIDAY.onReady(init);
})();
