/* Mariday — the candy bar article (pages/journal-candybar.html, css/candybar.css). One party, told by things you touch:
   ① the table is laid: real desserts on stands, tap one and it gets bitten (three bites and it's gone, crumbs fly);
     an empty table says it was perfect and lays itself again
   ② a till prints the per-guest receipt; tap a line and one guest's plate fills with what that party needs
   ③ three glass cloches lift (cream, crunch, chocolate) and the desserts can be tasted; a tray crowds past five kinds
   ④ ribbon spools — or a photo of your invitation — repaint a tower of real macarons and the whole section
   ⑤ scrolling turns a flat buffet into a bar that breathes in heights; odd groups of macarons
   ⑥ scrolling turns the clock from 17:00 to 23:00: the sky goes dark, the notes pile up, the table empties, neon on
   ⑦ every ticked line of the checklist puts one more dessert on a three-tier stand
   Needs no GSAP; with reduced motion everything is simply shown in its final state. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const M = () => window.MARIDAY || {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const live = !reduce && "IntersectionObserver" in window;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const cut = (name) => `../img/cutouts/${name}.webp`;
  const anim = (el, frames, opts) => (live && el.animate ? el.animate(frames, opts) : null);
  const once = (el, fn, opts = { threshold: 0.25 }) => {
    if (!el) return;
    if (!live) return fn();
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.disconnect(); fn(); } }), opts);
    io.observe(el);
  };
  const DROP = (dy = -140) => [
    { transform: `translateY(${dy}px) rotate(${rnd(-14, 14)}deg)`, opacity: 0 },
    { transform: "translateY(8px) rotate(0deg)", opacity: 1, offset: 0.65 },
    { transform: "translateY(-6px)", offset: 0.82 },
    { transform: "none", opacity: 1 },
  ];

  /* ───────── a dessert you can bite: each bite is three overlapping circles cut out of the photo ───────── */
  const BITES = [[0.84, 0.16], [0.14, 0.2], [0.55, 0.02]];
  function setBites(el, n) {
    const img = el.tagName === "IMG" ? el : $("img", el);
    if (!img) return;
    el.dataset.bites = n;
    if (!n) {
      ["maskImage", "webkitMaskImage"].forEach((k) => (img.style[k] = ""));
      return;
    }
    const a = (img.offsetHeight || 1) / (img.offsetWidth || 1);
    const r = 17; // % of the width
    const layers = [];
    BITES.slice(0, Math.min(n, 3)).forEach(([x, y]) => {
      [[-0.75, 0.2], [0, 0], [0.75, 0.2]].forEach(([dx, dy]) => {
        const cx = x * 100 + dx * r;
        const cy = y * 100 + (dy * r) / a;
        layers.push(`radial-gradient(ellipse ${r}% ${(r / a).toFixed(1)}% at ${cx.toFixed(1)}% ${cy.toFixed(1)}%, transparent 97%, #000 100%)`);
      });
    });
    const m = layers.join(",");
    img.style.webkitMaskImage = m;
    img.style.maskImage = m;
    img.style.webkitMaskComposite = "source-in";
    img.style.maskComposite = "intersect";
    img.style.webkitMaskRepeat = img.style.maskRepeat = "no-repeat";
  }
  const CRUMBS = ["#e9c08f", "#d79a63", "#f5bcc8", "#fff3e4", "#7b3a24", "#f2d29b"];
  function crumbs(host, x, y, n = 9) {
    if (!live) return;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("i");
      c.className = "cb-crumb";
      c.style.left = `${x}px`;
      c.style.top = `${y}px`;
      c.style.setProperty("--c", CRUMBS[i % CRUMBS.length]);
      c.style.setProperty("--s", `${rnd(4, 9).toFixed(1)}px`);
      host.appendChild(c);
      const dx = rnd(-70, 70);
      const up = rnd(-60, -20);
      const a = c.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx * 0.6}px,${up}px) rotate(${rnd(-180, 180)}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px,${rnd(70, 140)}px) rotate(${rnd(-360, 360)}deg)`, opacity: 0 },
      ], { duration: rnd(700, 1100), easing: "cubic-bezier(.3,.1,.6,1)" });
      a.onfinish = () => c.remove();
    }
  }
  function say(host, x, y, text) {
    if (!live || !text) return;
    const s = document.createElement("span");
    s.className = "cb-say";
    s.textContent = text;
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    host.appendChild(s);
    s.animate([
      { transform: "translate(-50%, 0) scale(.4) rotate(-8deg)", opacity: 0 },
      { transform: "translate(-50%, -30px) scale(1.1) rotate(-4deg)", opacity: 1, offset: 0.3 },
      { transform: "translate(-50%, -70px) scale(1) rotate(-2deg)", opacity: 0 },
    ], { duration: 1200, easing: "ease-out" }).onfinish = () => s.remove();
  }
  // bites the dessert once; returns true when it has just been finished
  function bite(btn, host, word) {
    const n = (+btn.dataset.bites || 0) + 1;
    const hr = host.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const [fx, fy] = BITES[Math.min(n, 3) - 1];
    const x = br.left - hr.left + br.width * fx;
    const y = br.top - hr.top + br.height * Math.max(0.1, fy);
    crumbs(host, x, y);
    if (word) say(host, x, y - 10, word);
    if (n < 3) {
      setBites(btn, n);
      anim(btn, [{ transform: "scale(1)" }, { transform: "scale(.92) rotate(-4deg)" }, { transform: "scale(1)" }], { duration: 320, easing: "ease-out" });
      return false;
    }
    setBites(btn, 3);
    const done = () => btn.classList.add("is-gone");
    const a = anim(btn, [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(.2) rotate(20deg)", opacity: 0 }], { duration: 380, easing: "ease-in" });
    if (a) a.onfinish = done; else done();
    return true;
  }
  function serve(btn, delay = 0) {
    setBites(btn, 0);
    btn.classList.remove("is-gone");
    anim(btn, DROP(-180), { duration: 720, delay, easing: "cubic-bezier(.3,.6,.4,1)", fill: "backwards" });
  }

  /* ───────── the catalogue cake in the middle of the table ───────── */
  function starCake() {
    const cakes = (M().cakes || []).filter((c) => M().cutout && M().cutout(c));
    const c = cakes.find((x) => x.id === "cherry-romance") || cakes[0];
    if (!c) return;
    const src = M().cutout(c);
    $$("[data-cb-star] img, img[data-cb-star2]").forEach((img) => {
      img.src = src;
      img.alt = "";
    });
    const b = $("[data-cb-star]");
    if (b) b.setAttribute("aria-label", `Надкусити торт «${c.name}»`);
  }

  /* ───────── ① the party table ───────── */
  const HERO_SAY = ["Ням ♡", "Ще шматочок?", "Хтось уже вдруге підходить…", "Так і має бути!", "Крихти на скатертині — добрий знак", "Ще трохи — і стіл порожній"];
  function heroTable() {
    const spread = $("[data-cb-spread]");
    if (!spread) return;
    const items = $$(".cb-eat", spread);
    const out = $("[data-cb-say]", spread);
    const hint = $(".cb-hint", spread);
    const empty = $("[data-cb-empty]", spread);
    let bites = 0;
    // the table is laid as the page opens
    if (live) {
      anim($(".cb-cloth", spread), [{ transform: "translateY(60%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
      $$(".cb-tier__stand", spread).forEach((s, i) => anim(s, [{ transform: "scaleY(0)", transformOrigin: "50% 100%" }, { transform: "scaleY(1)", transformOrigin: "50% 100%" }], { duration: 600, delay: 150 + i * 60, easing: "cubic-bezier(.3,1.4,.5,1)", fill: "backwards" }));
      items.forEach((b, i) => anim(b, DROP(-220), { duration: 760, delay: 280 + i * 45, easing: "cubic-bezier(.3,.6,.4,1)", fill: "backwards" }));
    }
    const left = () => items.filter((b) => (+b.dataset.bites || 0) < 3).length;
    items.forEach((b) => b.addEventListener("click", () => {
      if ((+b.dataset.bites || 0) >= 3) return;
      const word = ["ням", "м-м", "хрум"][bites % 3];
      const gone = bite(b, spread, word);
      bites++;
      if (out) {
        out.textContent = HERO_SAY[(bites - 1) % HERO_SAY.length];
        hint.classList.remove("is-pop"); void hint.offsetWidth; hint.classList.add("is-pop");
      }
      if (gone && !left()) setTimeout(() => {
        empty.hidden = false;
        anim(empty, [{ transform: "translate(-50%,-50%) scale(.6)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1)", opacity: 1 }], { duration: 500, easing: "cubic-bezier(.3,1.5,.5,1)" });
        if (out) out.textContent = "Ось він — ідеальний candy bar";
      }, 450);
    }));
    $("[data-cb-refill]", spread)?.addEventListener("click", () => {
      empty.hidden = true;
      bites = 0;
      if (out) out.textContent = "Клацніть на десерт — і надкусіть";
      items.forEach((b, i) => serve(b, i * 50));
      items[0]?.focus({ preventScroll: true });
    });
  }

  /* ───────── ② the till and one guest's plate ───────── */
  const PLATES = {
    any: ["candy-mac", "ds-cupcake", "ds-brownie", "candy-cup", "ds-cookie"],
    kids: ["ds-donut3", "candy-cup", "ds-cookie", "ds-mint"],
    office: ["ds-brownie", "candy-mac", "ds-choccup", "ds-cookie"],
  };
  function till() {
    const box = $("[data-cb-till]");
    const guest = $("[data-cb-guest]");
    if (!box || !guest) return;
    const paper = $("[data-cb-paper]", box);
    const disp = $("[data-cb-disp]", box);
    const keys = $$(".cb-till__keys i", box);
    const row = $("[data-cb-guest-row]", guest);
    const sayEl = $("[data-cb-guest-say]", guest);
    const lines = $$(".cb-line", box);
    const press = (k) => { k.classList.add("is-down"); setTimeout(() => k.classList.remove("is-down"), 140); };

    const fill = (line, first) => {
      const n = +line.dataset.n;
      const pool = PLATES[line.hasAttribute("data-kids") ? "kids" : line.hasAttribute("data-office") ? "office" : "any"];
      const range = $("em", line).textContent;
      if (sayEl) sayEl.innerHTML = `одному гостю — <b>${range}</b>`;
      const old = $$("span", row);
      const draw = () => {
        row.innerHTML = Array.from({ length: n + 1 }, (_, i) => `<span${i === n ? ' class="is-opt"' : ""}><img src="${cut(pool[i % pool.length])}" alt=""></span>`).join("");
        $$("span", row).forEach((s, i) => anim(s, DROP(-160), { duration: 650, delay: i * 90, easing: "cubic-bezier(.3,.6,.4,1)", fill: "backwards" }));
      };
      if (first || !live || !old.length) return draw();
      old.forEach((s, i) => anim(s, [{ transform: "none", opacity: 1 }, { transform: `translate(${(i - old.length / 2) * 40}px, -40px) rotate(${rnd(-30, 30)}deg)`, opacity: 0 }], { duration: 260, easing: "ease-in", fill: "forwards" }));
      setTimeout(draw, 230);
    };
    lines.forEach((line) => line.addEventListener("click", () => {
      lines.forEach((l) => l.setAttribute("aria-pressed", l === line));
      disp.textContent = $("em", line).textContent;
      for (let i = 0; i < 3; i++) setTimeout(() => press(keys[Math.floor(Math.random() * keys.length)]), i * 110);
      box.classList.add("is-ching");
      setTimeout(() => box.classList.remove("is-ching"), 520);
      fill(line);
    }));
    fill(lines[0], true);
    if (!live) return;
    paper.style.transform = "translateY(101%)";
    guest.style.visibility = "hidden";
    once(box, () => {
      paper.style.transform = "";
      paper.animate([{ transform: "translateY(101%)" }, { transform: "none" }], { duration: 1500, easing: "steps(20, end)" });
      let k = 0;
      const tap = setInterval(() => { press(keys[k++ % keys.length]); }, 90);
      setTimeout(() => clearInterval(tap), 1400);
    });
    // the plate fills as soon as it is on screen (on a phone it comes long before the till)
    once(guest, () => setTimeout(() => {
      guest.style.visibility = "";
      fill(lines.find((l) => l.getAttribute("aria-pressed") === "true") || lines[0], true);
    }, 250), { threshold: 0.35 });
  }

  /* ───────── ③ cloches and the tray of kinds ───────── */
  function cloches() {
    const bands = $("[data-cb-cloches]");
    if (!bands) return;
    const domes = $$(".cb-dome", bands);
    once(bands, () => domes.forEach((d, i) => setTimeout(() => {
      d.classList.add("is-open");
      const b = $(".cb-eat", d);
      anim(b, [{ transform: "none" }, { transform: "translateY(-26px) rotate(-6deg)", offset: 0.4 }, { transform: "none" }], { duration: 650, delay: 180, easing: "cubic-bezier(.3,1.4,.5,1)" });
    }, live ? 120 + i * 260 : 0)), { threshold: 0.2 });
    domes.forEach((d) => {
      const b = $(".cb-eat", d);
      const host = d.closest(".cb-band");
      b.addEventListener("click", () => {
        if ((+b.dataset.bites || 0) >= 3) return;
        if (bite(b, host, b.dataset.say)) setTimeout(() => serve(b), 1200);
      });
    });
  }

  const KINDS = ["candy-cup", "candy-mac", "ds-brownie", "ds-cookie", "cherrycup", "ds-donut3", "ds-mint", "ds-blackoreo"];
  function kinds() {
    const box = $("[data-cb-kinds]");
    if (!box) return;
    const slots = $("[data-cb-tray]", box);
    const tray = $(".cb-tray", box);
    const out = $("[data-cb-kinds-out]", box);
    let n = 0;
    const words = (k) => (k <= 2 ? "бідненько…" : k === 3 ? "ще б один" : k <= 5 ? `${k} види — саме те ♡`.replace("5 види", "5 видів") : k === 6 ? "гості губляться" : "половина лишиться");
    const paint = () => {
      out.textContent = words(n);
      out.classList.toggle("is-bad", n < 3 || n > 5);
      slots.style.setProperty("--gap", n > 5 ? `${-(n - 5) * 9}px` : "0px");
      tray.classList.remove("is-crowd");
      if (n > 5) { void tray.offsetWidth; tray.classList.add("is-crowd"); }
    };
    const add = (delay = 0) => {
      if (n >= KINDS.length) return;
      const img = document.createElement("img");
      img.src = cut(KINDS[n]);
      img.alt = "";
      slots.appendChild(img);
      n++;
      anim(img, DROP(-150), { duration: 650, delay, easing: "cubic-bezier(.3,.6,.4,1)", fill: "backwards" });
      paint();
    };
    const drop = () => {
      if (n <= 1) return;
      const img = slots.lastElementChild;
      n--;
      const a = anim(img, [{ transform: "none", opacity: 1 }, { transform: "translate(60px,-50px) rotate(40deg)", opacity: 0 }], { duration: 320, easing: "ease-in" });
      if (a) a.onfinish = () => img.remove(); else img.remove();
      paint();
    };
    $$("[data-cb-kind]", box).forEach((b) => b.addEventListener("click", () => (b.dataset.cbKind === "1" ? add() : drop())));
    once(box, () => { for (let i = 0; i < 4; i++) add(live ? i * 160 : 0); });
  }

  /* ───────── ④ palette: spools, your photo, the macaron tower ───────── */
  const TOWER = [["a", 5], ["b", 4], ["c", 3], ["b", 2], ["d", 1]];
  function palette() {
    const sec = $("[data-cb-pal]");
    if (!sec) return;
    const cone = $("[data-cb-cone]", sec);
    cone.innerHTML = TOWER.map(([t, k], r) => `<div class="cb-tower__row">${Array.from({ length: k }, (_, i) =>
      `<span class="cb-mac" data-t="${t}" style="--dl:${(r * 0.09 + i * 0.03).toFixed(2)}s"><img src="${cut("candy-mac")}" alt=""><i></i></span>`).join("")}</div>`).join("");
    const macs = $$(".cb-mac", cone);
    const hop = () => macs.forEach((m) => { m.classList.remove("is-hop"); void m.offsetWidth; m.classList.add("is-hop"); });
    const spools = $$("[data-pal-set]", sec);
    const photo = $("[data-cb-photo]", sec);
    const pic = $("[data-cb-pic]", sec);
    const choose = (set) => {
      sec.dataset.pal = set;
      ["--pb", "--ps", "--pi", "--pa"].forEach((v) => sec.style.removeProperty(v));
      spools.forEach((s) => s.setAttribute("aria-pressed", s.dataset.palSet === set));
      photo.classList.remove("is-on");
      photo.style.removeProperty("--c");
      hop();
    };
    spools.forEach((s) => s.addEventListener("click", () => choose(s.dataset.palSet)));
    // the tower is built as the section comes in
    once(cone, () => macs.forEach((m, i) => anim(m, DROP(-120), { duration: 600, delay: i * 45, easing: "cubic-bezier(.3,.6,.4,1)", fill: "backwards" })));

    const file = $("[data-cb-file]", sec);
    file?.addEventListener("change", () => {
      const f = file.files && file.files[0];
      if (!f || !/^image\//.test(f.type)) return;
      photo.classList.add("is-busy");
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        const pal = fromPhoto(img);
        photo.classList.remove("is-busy");
        if (!pal) return;
        sec.dataset.pal = "custom";
        Object.entries(pal).forEach(([k, v]) => sec.style.setProperty(k, v));
        spools.forEach((s) => s.setAttribute("aria-pressed", "false"));
        photo.classList.add("is-on");
        const im = $("img", pic);
        if (im.src.startsWith("blob:")) URL.revokeObjectURL(im.src);
        im.src = url;
        pic.hidden = false;
        anim(pic, [{ transform: "translateY(-60px) rotate(10deg)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 600, easing: "cubic-bezier(.3,1.4,.5,1)" });
        hop();
      };
      img.onerror = () => photo.classList.remove("is-busy");
      img.src = url;
    });
  }
  // a few strong colours of a photo → the four colours of the section
  function fromPhoto(img) {
    const S = 56;
    const cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const k = Math.min(S / img.width, S / img.height);
    const w = Math.max(1, Math.round(img.width * k));
    const ht = Math.max(1, Math.round(img.height * k));
    ctx.drawImage(img, 0, 0, w, ht);
    const d = ctx.getImageData(0, 0, w, ht).data;
    const px = [];
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) px.push([d[i], d[i + 1], d[i + 2]]);
    if (!px.length) return null;
    // k-means with spread-out seeds
    const K = 5;
    const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    const cs = [px[Math.floor(px.length / 2)].slice()];
    while (cs.length < K) cs.push(px.reduce((best, p) => (Math.min(...cs.map((c) => dist(p, c))) > Math.min(...cs.map((c) => dist(best, c))) ? p : best), px[0]).slice());
    let n = [];
    for (let it = 0; it < 8; it++) {
      const sum = cs.map(() => [0, 0, 0]);
      n = cs.map(() => 0);
      px.forEach((p) => {
        let j = 0;
        cs.forEach((c, q) => { if (dist(p, c) < dist(p, cs[j])) j = q; });
        sum[j][0] += p[0]; sum[j][1] += p[1]; sum[j][2] += p[2]; n[j]++;
      });
      cs.forEach((c, j) => { if (n[j]) for (let z = 0; z < 3; z++) c[z] = sum[j][z] / n[j]; });
    }
    const cl = cs.map((c, j) => ({ hsl: toHsl(c), n: n[j] })).filter((c) => c.n).sort((a, b) => b.n - a.n);
    const colourful = cl.filter((c) => c.hsl[1] > 0.14 && c.hsl[2] > 0.12 && c.hsl[2] < 0.94);
    const main = colourful[0] || cl[0];
    const others = colourful.filter((c) => c !== main);
    const hueGap = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
    const acc = others.sort((a, b) => hueGap(b.hsl[0], main.hsl[0]) * b.hsl[1] - hueGap(a.hsl[0], main.hsl[0]) * a.hsl[1])[0] || main;
    const [h, s] = main.hsl;
    const [ha, sa] = acc.hsl;
    const sat = (v, lo, hi) => clamp(v, lo, hi);
    return {
      "--pb": hsl(h, sat(s * 0.6, 0.15, 0.5), 0.955),
      "--ps": hsl(h, sat(s, 0.3, 0.62), 0.8),
      "--pa": hsl(ha, sat(sa, 0.3, 0.6), 0.6),
      "--pi": hsl(ha === h ? h : ha, sat(Math.max(s, sa), 0.35, 0.7), 0.24),
    };
  }
  function toHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn;
    const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  const hsl = (h, s, l) => `hsl(${h.toFixed(0)} ${(s * 100).toFixed(0)}% ${(l * 100).toFixed(0)}%)`;

  /* ───────── scroll-driven scenes share one loop ───────── */
  const scenes = [];
  function loop() {
    let raf = 0;
    const tick = () => {
      raf = 0;
      let moving = false;
      scenes.forEach((s) => {
        const target = s.target();
        s.p += (target - s.p) * 0.18;
        if (Math.abs(target - s.p) < 0.0005) s.p = target; else moving = true;
        s.draw(s.p);
      });
      if (moving) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    kick();
  }
  const progress = (box) => () => {
    const r = box.getBoundingClientRect();
    const run = box.offsetHeight - innerHeight;
    return run > 0 ? clamp(-r.top / run) : 0;
  };

  /* ───────── ⑤ heights: flat → composed ───────── */
  const STAGES = [[0.06, 0.28], [0.28, 0.48], [0.48, 0.68], [0.68, 0.88]];
  function heights() {
    const sec = $("[data-cb-stage]");
    if (!sec) return;
    const steps = $$(".cb-steps li", sec);
    if (live) {
      sec.classList.add("is-live");
      const track = $(".cb-stage__track", sec);
      scenes.push({
        p: 0,
        target: progress(track),
        draw(p) {
          const s = STAGES.map(([a, b]) => ease(clamp((p - a) / (b - a))));
          s.forEach((v, i) => sec.style.setProperty(`--s${i + 1}`, v.toFixed(3)));
          sec.style.setProperty("--sat", clamp((p - 0.04) / 0.84).toFixed(3));
          const cur = STAGES.reduce((c, [a], i) => (p >= a ? i : c), 0);
          steps.forEach((li, i) => {
            li.classList.toggle("is-hot", i === cur);
            li.classList.toggle("is-done", s[i] > 0.96);
          });
        },
      });
    } else steps.forEach((li) => li.classList.add("is-done"));
    oddTray(sec);
  }
  function oddTray(sec) {
    const row = $("[data-cb-odd-row]", sec);
    const out = $("[data-cb-odd-out]", sec);
    if (!row) return;
    let n = 0;
    const paint = () => (out.textContent = n % 2 ? `${n} — живо ✓` : `${n} — як у шеренгу`);
    const add = (delay = 0) => {
      if (n >= 7) return;
      const img = document.createElement("img");
      img.src = cut("candy-mac");
      img.alt = "";
      row.appendChild(img);
      n++;
      anim(img, DROP(-120), { duration: 560, delay, easing: "cubic-bezier(.3,.6,.4,1)", fill: "backwards" });
      paint();
    };
    const drop = () => {
      if (n <= 1) return;
      const img = row.lastElementChild;
      n--;
      const a = anim(img, [{ transform: "none", opacity: 1 }, { transform: "translate(40px,-40px) rotate(30deg)", opacity: 0 }], { duration: 280, easing: "ease-in" });
      if (a) a.onfinish = () => img.remove(); else img.remove();
      paint();
    };
    $$("[data-cb-odd-step]", sec).forEach((b) => b.addEventListener("click", () => (b.dataset.cbOddStep === "1" ? add() : drop())));
    once(row, () => { for (let i = 0; i < 3; i++) add(live ? i * 140 : 0); });
  }

  /* ───────── ⑥ the evening ───────── */
  function evening() {
    const sec = $("[data-cb-night]");
    if (!sec) return;
    const tips = $$("[data-cb-tips] li", sec);
    const sweets = $$("[data-cb-eve] img", sec);
    const hand = { h: $(".cb-clock__h", sec), m: $(".cb-clock__m", sec) };
    const clock = $("[data-cb-clock]", sec);
    const setClock = (t) => {
      const mins = Math.round((t * 360) / 5) * 5; // 17:00 + up to six hours, in steps of five minutes
      const hh = 17 + Math.floor(mins / 60);
      const mm = mins % 60;
      hand.h.setAttribute("transform", `rotate(${((hh % 12) + mm / 60) * 30} 100 100)`);
      hand.m.setAttribute("transform", `rotate(${mm * 6} 100 100)`);
      clock.textContent = `${hh}:${String(mm).padStart(2, "0")}`;
    };
    if (!live) { setClock(1); return; }
    sec.classList.add("is-live", "is-day");
    sweets.forEach((img, i) => (img.style.transitionDelay = `${i * 0.05}s`));
    scenes.push({
      p: 0,
      target: progress(sec),
      draw(p) {
        const t = clamp(p / 0.94);
        sec.style.setProperty("--t", t.toFixed(4));
        sec.style.setProperty("--dusk", clamp(1 - Math.abs(t - 0.42) * 3.2).toFixed(3));
        sec.classList.toggle("is-day", t < 0.4);
        setClock(t);
        // notes pile up, the newest on top
        const on = tips.filter((li) => t >= +li.dataset.at);
        tips.forEach((li) => {
          const k = on.indexOf(li);
          li.classList.toggle("is-on", k >= 0);
          li.classList.toggle("is-old", k >= 0 && k < on.length - 1);
          if (k >= 0) { li.style.setProperty("--age", Math.min(3, on.length - 1 - k)); li.style.zIndex = k + 1; }
        });
        // served at 18:30, then eaten one by one
        sweets.forEach((img, i) => {
          img.classList.toggle("is-in", t >= 0.28);
          const b = clamp(Math.floor((t - (0.36 + i * 0.055)) / 0.016), 0, 3);
          if (+img.dataset.bites !== b) setBites(img, b);
          img.classList.toggle("is-gone", b >= 3);
        });
        sec.classList.toggle("is-served", t >= 0.27);
        sec.classList.toggle("is-end", t >= 0.88);
      },
    });
  }

  /* ───────── ⑦ the three-tier stand fills with the checklist ───────── */
  const ETAGERE = [["candy-mac", "ds-cupcake", "ds-cookie", "candy-cup", "ds-brownie"], ["cherrycup", "ds-mint", "ds-redvelvet"], ["ds-vanilla", "ds-choccup"]];
  function etagere() {
    const box = $("[data-cb-etagere]");
    const list = $('[data-ed-check="candybar"]');
    if (!box || !list) return;
    const rows = [".cb-etagere__tier--1", ".cb-etagere__tier--2", ".cb-etagere__tier--3"].map((s) => $(`${s} .cb-etagere__row`, box));
    const imgs = [];
    ETAGERE.forEach((names, r) => names.forEach((nm) => {
      const img = document.createElement("img");
      img.src = cut(nm);
      img.alt = "";
      img.hidden = true;
      rows[r].appendChild(img);
      imgs.push(img);
    }));
    const sayEl = $("[data-cb-et-say]", box);
    const boxes = $$("input[type=checkbox]", list);
    let shown = 0;
    const paint = (first) => {
      const n = boxes.filter((b) => b.checked).length;
      imgs.forEach((img, i) => {
        const on = i < n;
        if (on && img.hidden && !first) anim(img, DROP(-120), { duration: 600, easing: "cubic-bezier(.3,.6,.4,1)" });
        img.hidden = !on;
      });
      sayEl.textContent = n === 0 ? "поки порожньо…" : n < 5 ? "вже щось є" : n < 10 ? "ого, апетитно" : "готово до свята!";
      if (n === imgs.length && shown < n && !first) {
        box.classList.remove("is-full"); void box.offsetWidth; box.classList.add("is-full");
      }
      shown = n;
    };
    list.addEventListener("change", () => paint(false));
    paint(true);
  }

  function prices() {
    const packs = (M().desserts || []).filter((d) => d.cat === "candybar");
    const el = $("[data-cb-from]");
    if (el && packs.length) el.textContent = `€${Math.min(...packs.map((d) => d.price))}`;
  }

  /* ───────── the candy necklace shows up only while a chapter is on screen ───────── */
  function beads() {
    const nav = $(".cb-beads");
    const chapters = $$(".cb-ch[aria-labelledby]");
    if (!nav || !chapters.length || !("IntersectionObserver" in window)) return;
    const seen = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      nav.classList.toggle("is-shown", seen.size > 0);
    }, { rootMargin: "-45% 0px -45% 0px" });
    chapters.forEach((c) => io.observe(c));
  }

  const init = () => {
    starCake();
    heroTable();
    till();
    cloches();
    kinds();
    palette();
    heights();
    evening();
    etagere();
    prices();
    beads();
    if (scenes.length) loop();
  };
  if (window.MARIDAY && MARIDAY.onReady) MARIDAY.onReady(init);
  else init();
})();
