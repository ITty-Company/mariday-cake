/* Mariday — the wedding page as the story of a wedding day (pages/weddings.html, css/weddings.css).
   ① the proposal: a velvet ring box opens and a wedding cake from the catalogue rises out of it; a passed note says «так» or asks for the next one
   ② «про вас двох»: each of you ticks tastes, the tiers of a real cake get their fillings (top — yours, bottom — theirs)
   ③ the way of the cake: it fills in from the bottom tier up while the steps scroll past; each step plays its scene
   ④ toss the bouquet: it flies onto one of the wedding cakes on the columns and opens that cake's style
   ⑤ the banquet hall: guests are seats at round tables, tiers drop onto the stand, each seat coloured by its tier
   ⑥ the étagère, ⑦ the guest book written in, ⑧ notes tied with bows, ⑨ save the date
   Every cake shown is one the catalogue sells right now (MARIDAY.cakes, admin-managed). Works without GSAP;
   with reduced motion everything is simply shown. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const M = () => window.MARIDAY;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const esc = (s) => window.escapeHTML(String(s == null ? "" : s));
  const href = (id) => `product.html?id=${encodeURIComponent(id)}`;
  const eur = (n) => `€${Math.round(n)}`;
  const T = (ms) => (reduce ? 0 : ms);

  /* ───────── the cakes: wedding ones from the live catalogue, whole cut-outs only ───────── */
  const CROPPED = ["berries", "slice", "strawslice", "tiramisu", "meringue"];
  const cut = (c) => (M().cutout ? M().cutout(c) : "");
  const whole = (c) => (c.cutout || !CROPPED.includes(c.img) ? cut(c) : "");
  const isWedding = (c) => (c.cats || []).includes("wedding") || (c.tags || []).some((t) => /весіл/i.test(t));
  let POOL = [];
  const pool = () => {
    if (POOL.length) return POOL;
    const all = M().cakes.filter((c) => whole(c));
    const wed = all.filter(isWedding);
    POOL = wed.length >= 3 ? wed : [...wed, ...all.filter((c) => !wed.includes(c))];
    return POOL;
  };
  // the cakes a section prefers while the catalogue has them, then the rest of the wedding ones
  const ordered = (ids) => {
    const p = pool();
    return [...new Set([...ids.map((id) => p.find((c) => c.id === id)).filter(Boolean), ...p])];
  };
  const used = new Set();
  const take = (ids) => {
    const list = ordered(ids);
    const c = list.find((x) => !used.has(x.id)) || list[0];
    if (c) used.add(c.id);
    return c;
  };

  // where the cake really is inside its cut-out, so it stands right on its plate / column / envelope
  const boxes = new Map();
  const trim = (src) => {
    if (boxes.has(src)) return boxes.get(src);
    const p = new Promise((done) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => {
        try {
          const W = 140;
          const H = Math.max(1, Math.round((W * im.naturalHeight) / im.naturalWidth));
          const cv = document.createElement("canvas");
          cv.width = W;
          cv.height = H;
          const cx = cv.getContext("2d", { willReadFrequently: true });
          cx.drawImage(im, 0, 0, W, H);
          const d = cx.getImageData(0, 0, W, H).data;
          let x0 = W, y0 = H, x1 = -1, y1 = -1;
          for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
              if (d[(y * W + x) * 4 + 3] < 40) continue;
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              y1 = y;
            }
          }
          if (x1 < 0) return done(null);
          const b = { x: x0 / W, y: y0 / H, w: (x1 + 1 - x0) / W, h: (y1 + 1 - y0) / H };
          b.ar = (b.h * im.naturalHeight) / (b.w * im.naturalWidth);
          done(b);
        } catch (e) {
          done(null);
        }
      };
      im.onerror = () => done(null);
      im.src = src;
    });
    const safe = Promise.race([p, new Promise((r) => setTimeout(() => r(null), 6000))]);
    boxes.set(src, safe);
    return safe;
  };
  const pic = (c, b, cls = "") => {
    const src = esc(whole(c));
    const st = b ? `style="width:${(100 / b.w).toFixed(2)}%;left:${((-b.x / b.w) * 100).toFixed(2)}%;top:${((-b.y / b.h) * 100).toFixed(2)}%"` : `class="is-fit"`;
    return `<span class="wd-pic ${cls}" style="--ar:${(b ? b.ar : 1.2).toFixed(3)}"><img src="${src}" crossorigin="anonymous" alt="${esc(c.name)}" draggable="false" ${st}></span>`;
  };
  const place = async (host, c, cls) => {
    if (!host || !c) return;
    const b = await trim(whole(c));
    host.innerHTML = pic(c, b, cls);
  };

  function splitInto(el, text, cls, word) {
    el.textContent = "";
    const parts = word ? text.split(/(\s+)/) : [...text];
    let i = 0;
    parts.forEach((ch) => {
      if (word && /^\s+$/.test(ch)) return el.appendChild(document.createTextNode(" "));
      const s = document.createElement("span");
      s.className = cls;
      s.style.setProperty("--i", i);
      s.style.setProperty("--cr", `${i % 2 ? 12 : -12}deg`);
      s.textContent = ch === " " ? " " : ch;
      el.appendChild(s);
      i++;
    });
  }
  // a class once the element is far enough into view; never taken back, so nothing waits on staying there
  const seen = (els, cls = "is-in", margin = "0px 0px -12% 0px") => {
    if (reduce || !("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add(cls));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add(cls);
      e.target.dispatchEvent(new CustomEvent("wd:in"));
      io.unobserve(e.target);
    }), { rootMargin: margin });
    els.forEach((e) => io.observe(e));
  };

  /* ───────── headings: glazed letters jump in, the script word is piped after them ───────── */
  function headings() {
    $$("[data-wd-split]").forEach((w) => {
      w.closest(".wd-h2").setAttribute("aria-label", `${w.textContent} ${w.nextElementSibling ? w.nextElementSibling.textContent : ""}`.trim());
      splitInto(w, w.textContent, "wd-ch");
      $$(".wd-ch, .wd-h2__s", w.closest(".wd-h2")).forEach((s) => s.setAttribute("aria-hidden", "true"));
    });
    seen($$(".wd-h2"), "is-in", "0px 0px -8% 0px");
  }

  /* ───────── ① the proposal ───────── */
  const HERO = ["floral-poetry", "white-symphony", "burgundy-orchid", "pearl-bow", "cherry-romance", "a-little-bite-of-love", "berry-romance", "blue-heart"];
  function proposal() {
    const box = $("[data-wd-prop]");
    if (!box) return;
    const list = ordered(HERO);
    if (!list.length) return;
    used.add(list[0].id);
    const stage = $("[data-wd-stage]", box);
    const host = $("[data-wd-hero-cake]", box);
    const name = $("[data-wd-hero-name]", box);
    const price = $("[data-wd-hero-price]", box);
    const link = $("[data-wd-hero-link]", box);
    const ask = $("[data-wd-ask]", box);
    const yes = $("[data-wd-yes]", box);
    const next = $("[data-wd-next]", box);
    let i = 0;
    let busy = false;
    const later = (ms) => new Promise((r) => setTimeout(r, T(ms)));
    const label = (c) => {
      name.textContent = c.name;
      price.textContent = Number(c.price) ? `від ${eur(c.price)} →` : "подивитися →";
      link.href = href(c.id);
      link.setAttribute("aria-label", `${c.name} — відкрити торт`);
    };
    const show = (c, b) => {
      host.innerHTML = pic(c, b);
      host.style.setProperty("--ar", (b ? b.ar : 1.2).toFixed(3));
      label(c);
    };
    // the next ones are measured while this one is on show
    const warm = () => list.slice(i + 1, i + 3).forEach((c) => trim(whole(c)));
    const setYes = (on) => {
      yes.setAttribute("aria-pressed", String(on));
      ask.classList.toggle("is-yes", on);
      link.classList.toggle("is-loved", on);
    };
    yes.setAttribute("aria-pressed", "false");
    next.setAttribute("aria-pressed", "false");

    // the box opens a beat after the page lands, then the cake rises out of the cushion
    trim(whole(list[0])).then(async (b) => {
      show(list[0], b);
      warm();
      await later(250);
      box.classList.add("is-open");
      await later(380);
      box.classList.add("is-up");
    });

    // «покажи інший»: the cake sinks, the lid shuts with a little hop and opens on the next one
    next.addEventListener("click", async () => {
      if (busy || list.length < 2) return;
      busy = true;
      next.setAttribute("aria-pressed", "true");
      setYes(false);
      i = (i + 1) % list.length;
      const c = list[i];
      const pending = trim(whole(c));
      box.classList.remove("is-up");
      await later(380);
      box.classList.remove("is-open");
      await later(560);
      box.classList.remove("is-thud");
      void box.offsetWidth;
      box.classList.add("is-thud");
      show(c, await pending);
      warm();
      await later(300);
      box.classList.add("is-open");
      next.setAttribute("aria-pressed", "false");
      await later(380);
      box.classList.add("is-up");
      await later(500);
      busy = false;
    });

    // «так!»: petals and hearts thrown up out of the box, the card gets its stamp, the date link shows up
    yes.addEventListener("click", () => {
      const on = yes.getAttribute("aria-pressed") !== "true";
      setYes(on);
      if (!on || reduce) return;
      const sr = stage.getBoundingClientRect();
      const br = $(".wd-box__front", box).getBoundingClientRect();
      const x0 = br.left - sr.left + br.width / 2;
      const y0 = br.top - sr.top;
      for (let k = 0; k < 26; k++) {
        const p = document.createElement("i");
        p.className = "wd-throw" + (k % 4 === 0 ? " is-heart" : "");
        if (k % 4 === 0) p.textContent = "♥";
        stage.appendChild(p);
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const up = 160 + Math.random() * 200;
        const dx = Math.cos(ang) * up * 0.9;
        const dy = Math.sin(ang) * up;
        const spin = (Math.random() - 0.5) * 720;
        p.animate(
          [
            { transform: `translate(${x0}px, ${y0}px) rotate(0deg) scale(0.4)`, opacity: 1 },
            { transform: `translate(${x0 + dx}px, ${y0 + dy}px) rotate(${spin / 2}deg) scale(1)`, opacity: 1, offset: 0.45 },
            { transform: `translate(${x0 + dx * 1.4}px, ${y0 + dy + 260}px) rotate(${spin}deg) scale(0.9)`, opacity: 0 },
          ],
          { duration: 1500 + Math.random() * 700, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)" }
        ).onfinish = () => p.remove();
      }
    });

    // the box turns a little after the pointer, as if it were held out across the table
    if (!reduce && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const tilt = $(".wd-box", box);
      stage.addEventListener("pointermove", (e) => {
        const r = stage.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty("--ry", `${(-9 + nx * 22).toFixed(1)}deg`);
        tilt.style.setProperty("--rx", `${(ny * -6).toFixed(1)}deg`);
      });
      stage.addEventListener("pointerleave", () => {
        tilt.style.removeProperty("--ry");
        tilt.style.removeProperty("--rx");
      });
    }
  }

  /* ───────── ② about the two of you: a tasting duet ───────── */
  // each taste: how it reads in a flavour, its taste "diagnosis" as the main love, and as an extra
  const TASTES = [
    { id: "choc", label: "шоколад", e: "🍫", re: /шокол|kinder|bueno|снікерс|какао|брауні/i, who: "шоколадне серце", plus: "з шоколадом" },
    { id: "berry", label: "ягоди", e: "🍓", re: /ягід|ягод|малин|полун|вишн|смородин|лохин|ожин/i, who: "ягідна душа", plus: "з ягідкою" },
    { id: "nut", label: "горіхи", e: "🥜", re: /горіх|фісташ|арахіс|фундук|bueno|снікерс|мигдал|пекан/i, who: "горіховий гурман", plus: "з горішками" },
    { id: "caramel", label: "карамель", e: "🍯", re: /карамел|банан|снікерс|ірис/i, who: "карамельний ласун", plus: "з карамеллю" },
    { id: "citrus", label: "цитрус", e: "🍋", re: /лимон|цитрус|апельсин|лайм|маракуй|манго/i, who: "цитрусова іскра", plus: "з кислинкою" },
    { id: "vanilla", label: "ваніль і вершки", e: "🍦", re: /ваніл|пломбір|вершк|kinder|молоч/i, who: "ніжний класик", plus: "з вершками" },
  ];
  const tasteOf = (id) => TASTES.find((t) => t.id === id);
  function twoOfYou() {
    const box = $("[data-wd-two]");
    if (!box) return;
    const flavors = (M().flavors || []).filter((f) => f && f.name);
    const metaOf = (f) => ((M().flavorMeta || {})[f && f.id] || { layers: ["#f0dca0", "#f7efe6", "#c2263f"] });
    const picked = { a: new Set(["berry", "citrus", "vanilla"]), b: new Set(["choc", "nut", "berry"]) };
    const cakeHost = $("[data-wd-two-cake]", box);

    $$("[data-side]", box).forEach((wrap) => {
      const side = wrap.dataset.side;
      wrap.innerHTML = TASTES.map((t) => `<button type="button" class="wd-chip" data-t="${t.id}" aria-pressed="${picked[side].has(t.id)}"><span aria-hidden="true">${t.e}</span>${t.label}</button>`).join("");
      wrap.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-t]");
        if (!btn) return;
        const id = btn.dataset.t;
        const s = picked[side];
        const on = !s.has(id);
        on ? s.add(id) : s.delete(id);
        btn.setAttribute("aria-pressed", on);
        say(side);
        if (!on) return paint();
        // it lands in the tier it now feeds: shared — the middle one, otherwise this side's own
        const other = picked[side === "a" ? "b" : "a"];
        const k = other.has(id) ? "mid" : side === "a" ? "top" : "low";
        fly($("span", btn), slices[k], tasteOf(id).e).then(() => land(k));
      });
    });
    place(cakeHost, take(["burgundy-orchid", "white-symphony", "floral-poetry", "a-little-bite-of-love"]));

    /* the taste diagnosis: the first love, then what it comes with */
    const says = { a: $("[data-say=a]", box), b: $("[data-say=b]", box) };
    const diagnosis = (set) => {
      const l = TASTES.filter((t) => set.has(t.id));
      if (!l.length) return "поки думає…";
      if (l.length >= 5) return "смакує все й одразу";
      const extra = l.slice(1).map((t, i) => (i ? t.plus.replace(/^з /, "") : t.plus));
      const tail = extra.length > 1 ? `${extra.slice(0, -1).join(", ")} і ${extra[extra.length - 1]}` : extra.join("");
      return [l[0].who, tail].filter(Boolean).join(" ");
    };
    const say = (side) => {
      const t = diagnosis(picked[side]);
      if (says[side].textContent === t) return;
      says[side].textContent = t;
      bump(says[side]);
    };
    const bump = (el, cls = "is-new") => {
      if (reduce || !el) return;
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    };

    /* the tiers: a filling for each, shown as a slice of its layers with the reason underneath */
    const text = (f) => `${f.name} ${f.desc || ""}`;
    const hits = (f, set) => TASTES.filter((t) => set.has(t.id) && t.re.test(text(f)));
    const score = (f, set) => hits(f, set).length;
    const best = (rank, not) => {
      const left = flavors.filter((f) => !not.includes(f));
      return left.slice().sort((p, q) => rank(q) - rank(p))[0] || left[0];
    };
    const outs = { top: $("[data-tier=top]", box), mid: $("[data-tier=mid]", box), low: $("[data-tier=low]", box) };
    const whys = { top: $("[data-why=top]", box), mid: $("[data-why=mid]", box), low: $("[data-why=low]", box) };
    const slices = { top: $("[data-slice=top]", box), mid: $("[data-slice=mid]", box), low: $("[data-slice=low]", box) };
    const cut = (f) => {
      const ls = metaOf(f).layers;
      const rows = [];
      ls.forEach((c, i) => {
        rows.push(c);
        if (i < ls.length - 1) rows.push("#fbf3e6");
      });
      return `<span class="wd-slice__in">${rows.reverse().map((c) => `<i style="background:${c}"></i>`).join("")}</span>`;
    };
    const show = (k, f, why) => {
      const t = f ? f.name : "—";
      whys[k].textContent = why;
      if (outs[k].textContent === t) return;
      outs[k].textContent = t;
      slices[k].innerHTML = f ? cut(f) : "";
      bump(outs[k]);
      bump(slices[k], "is-cut");
    };
    const list = (ts) => ts.map((t) => t.label).join(" · ");
    const paint = () => {
      match();
      if (!flavors.length) return;
      const A = picked.a;
      const B = picked.b;
      const both = new Set([...A].filter((id) => B.has(id)));
      const top = best((f) => score(f, A) * 2 - score(f, B) * 0.5, []);
      const low = best((f) => score(f, B) * 2 - score(f, A) * 0.5, [top]);
      // the shared tier: something both of you would pick, the more of both the better
      const mid = best((f) => score(f, both) * 4 + Math.min(score(f, A), score(f, B)) * 3 + score(f, A) + score(f, B), [top, low]);
      const why = (f, set, none) => {
        const h = f ? hits(f, set) : [];
        return h.length ? `бо: ${list(h)}` : none;
      };
      show("top", top, why(top, A, "наш сюрприз для вас"));
      show("mid", mid, both.size ? why(mid, both, "те, що любите обоє") : "компроміс на двох");
      show("low", low, why(low, B, "наш сюрприз для половинки"));
    };

    /* the match: two gold rings come together as your tastes do */
    const mBox = $("[data-wd-match]", box);
    const mN = $("[data-wd-match-n]", mBox);
    const mSay = $("[data-wd-match-say]", mBox);
    const hearts = $(".wd-match__hearts", mBox);
    let shown = 0;
    let shared = -1;
    let raf = 0;
    const match = () => {
      const all = new Set([...picked.a, ...picked.b]);
      const common = TASTES.filter((t) => picked.a.has(t.id) && picked.b.has(t.id));
      const j = all.size ? common.length / all.size : 0;
      const pct = all.size ? Math.round(35 + 65 * j) : 0;
      mBox.style.setProperty("--m", j.toFixed(3));
      mBox.classList.toggle("is-perfect", all.size > 0 && j === 1);
      const t = !all.size ? "позначте смаки — і торт підкаже ♥"
        : j === 1 ? "ідеальна пара: ви навіть смакуєте однаково ♥"
        : !common.length ? "протилежності притягуються — середній ярус вас помирить"
        : `вас єднає: ${list(common)}`;
      if (mSay.textContent !== t) {
        mSay.textContent = t;
        bump(mSay);
      }
      if (shared >= 0 && common.length > shared) love();
      shared = common.length;
      // the number counts to the new value
      cancelAnimationFrame(raf);
      if (reduce) return (mN.textContent = `${(shown = pct)}%`);
      const from = shown;
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 600);
        shown = Math.round(from + (pct - from) * (1 - Math.pow(1 - k, 3)));
        mN.textContent = `${shown}%`;
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const love = () => {
      if (reduce) return;
      bump(mBox, "is-love");
      hearts.innerHTML = Array.from({ length: 9 }, (_, i) => {
        const a = (-90 + (i - 4) * 19 + (Math.random() * 10 - 5)) * (Math.PI / 180);
        const d = 70 + Math.random() * 50;
        return `<i style="--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d).toFixed(0)}px;--d:${(i * 0.03).toFixed(2)}s;--s:${(0.7 + Math.random() * 0.6).toFixed(2)}">♥</i>`;
      }).join("");
    };

    /* the flight: the ingredient arcs from its chip into the slice of its tier */
    const fly = (from, to, emoji, delay = 0) => {
      if (reduce || !from || !to || !document.body.animate) return Promise.resolve();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      if (!a.width || !b.width) return Promise.resolve();
      const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
      const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
      const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - 80 - Math.abs(x1 - x0) * 0.18;
      const N = 12;
      const frames = Array.from({ length: N + 1 }, (_, i) => {
        const t = i / N;
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
        const sc = 1 + Math.sin(t * Math.PI) * 0.6 - t * 0.45;
        return { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${(t * 340 * (x1 > x0 ? 1 : -1)).toFixed(0)}deg) scale(${sc.toFixed(2)})`, opacity: i === N ? 0.2 : 1 };
      });
      const el = document.createElement("span");
      el.className = "wd-fly";
      el.textContent = emoji;
      el.setAttribute("aria-hidden", "true");
      document.body.appendChild(el);
      const an = el.animate(frames, { duration: 760 + Math.min(300, Math.hypot(x1 - x0, y1 - y0) * 0.3), delay, easing: "cubic-bezier(.4,.1,.6,1)", fill: "both" });
      return an.finished.catch(() => {}).then(() => el.remove());
    };
    // where it lands the slice squashes, the cake hops, the tier picks its filling again
    const land = (k) => {
      paint();
      bump(slices[k], "is-plop");
      bump(cakeHost, "is-hop");
    };

    paint();
    say("a");
    say("b");

    // when the section comes in, the tastes already ticked fly over once, so the game shows itself
    if (reduce) return;
    box.classList.add("is-armed");
    box.addEventListener("wd:in", () => {
      let n = 0;
      ["a", "b"].forEach((side) => {
        $$(`[data-side=${side}] [aria-pressed=true]`, box).forEach((btn) => {
          const id = btn.dataset.t;
          const other = picked[side === "a" ? "b" : "a"];
          const k = other.has(id) ? "mid" : side === "a" ? "top" : "low";
          fly($("span", btn), slices[k], tasteOf(id).e, 650 + n++ * 140).then(() => {
            bump(slices[k], "is-plop");
            bump(cakeHost, "is-hop");
          });
        });
      });
    }, { once: true });
    seen([box], "is-in", "0px 0px -20% 0px");
  }

  /* ───────── ③ the way of the cake ───────── */
  function way() {
    const sec = $(".wd-way");
    const grid = $("[data-wd-way]");
    if (!sec || !grid) return;
    const steps = $$(".wd-step", grid);
    const when = $("[data-wd-when]", grid);
    const host = $("[data-wd-way-cake]", grid);
    const c = take(["white-symphony", "floral-poetry", "burgundy-orchid", "a-little-bite-of-love"]);
    if (c) trim(whole(c)).then((b) => (host.innerHTML = pic(c, b, "wd-way__ghost") + pic(c, b, "wd-way__real")));
    seen(steps, "is-in", "0px 0px -14% 0px");
    if (reduce) {
      sec.style.setProperty("--p", 1);
      sec.classList.add("is-done");
      when.textContent = "сьогодні ♥";
      return;
    }
    document.documentElement.classList.add("wd-js");
    let here = -1;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = innerHeight;
      const first = steps[0].getBoundingClientRect();
      const last = steps[steps.length - 1].getBoundingClientRect();
      const from = first.top - vh * 0.62;
      const to = last.top - vh * 0.62;
      const k = Math.min(1, Math.max(0, -from / Math.max(1, to - from)));
      sec.style.setProperty("--p", (0.12 + 0.88 * k).toFixed(4));
      sec.classList.toggle("is-done", k >= 0.999);
      let h = 0;
      steps.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.62) h = i; });
      if (h !== here) {
        here = h;
        steps.forEach((s, i) => s.classList.toggle("is-here", i === h));
        when.textContent = steps[h].dataset.when || "";
        when.classList.remove("is-new");
        void when.offsetWidth;
        when.classList.add("is-new");
      }
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", ask);
    tick();
  }

  /* ───────── ④ toss the bouquet ───────── */
  // styles we talk about with couples, matched to the catalogue's own tags; the most specific go first
  const STYLES = [
    { re: /орхіде|бордов/i, name: "Бордо й орхідеї", text: "Глибокий бордо на білому, квіти каскадом зверху донизу. Для вечірнього весілля з характером." },
    { re: /вінтаж|lambeth/i, name: "Вінтаж Lambeth", text: "Пишні рюші, гірлянди з крему, вишні чи перли. Ретро, яке зараз на піку, — і дуже фотогенічне." },
    { re: /ягід|полуни|малин/i, name: "Ягідна корона", text: "Свіжа полуниця, лохина й малина зверху й між ярусами. Літо, сад, яскраво й дуже апетитно." },
    { re: /перлин|бант|couture/i, name: "Перли й банти", text: "Атласний бант, мереживо й перли з цукру. Для пари, яка любить кутюр і класичну елегантність." },
    { re: /серце/i, name: "Серце з квітів", text: "Не яруси, а ціла скульптура з квітів. Для камерного весілля, заручин чи річниці." },
    { re: /квітков|троянд|півон/i, name: "Квітковий каскад", text: "Живі квіти «стікають» ярусами. Найромантичніший вибір — квіти підбираємо в палітрі вашого букета." },
    { re: /біл|мінімал|багатоярус/i, name: "Білий шовк", text: "Один колір, рельєф крему, мінімум декору. Торт як скульптура — для стриманих і дуже стильних весіль." },
  ];
  const TOSS = ["floral-poetry", "burgundy-orchid", "white-symphony", "cherry-romance", "berry-romance", "pearl-bow", "a-little-bite-of-love", "blue-heart"];
  function toss() {
    const hall = $("[data-wd-toss]");
    if (!hall) return;
    const row = $("[data-wd-toss-row]", hall);
    const card = $("[data-wd-toss-card]", hall);
    const btn = $("[data-wd-bouquet]", hall);
    const cakes = ordered(TOSS);
    // the cakes we know get their own style; new ones from the admin panel are matched by their tags
    const KNOWN = { "burgundy-orchid": 0, "cherry-romance": 1, "a-little-bite-of-love": 1, "berry-romance": 2, "pearl-bow": 3, "blue-heart": 4, "floral-poetry": 5, "white-symphony": 6 };
    const style = new Map();
    const taken = new Set();
    cakes.forEach((c) => {
      const k = KNOWN[c.id];
      if (k == null || taken.has(k)) return;
      taken.add(k);
      style.set(c.id, STYLES[k]);
    });
    STYLES.forEach((s, k) => {
      if (taken.has(k)) return;
      const c = cakes.find((x) => !style.has(x.id) && s.re.test(`${(x.tags || []).join(" ")} ${x.name}`));
      if (c) { style.set(c.id, s); taken.add(k); }
    });
    const items = [...cakes.filter((c) => style.has(c.id)), ...cakes.filter((c) => !style.has(c.id))].slice(0, 6)
      .sort((p, q) => cakes.indexOf(p) - cakes.indexOf(q))
      .map((c) => ({ c, s: style.get(c.id) || { name: c.name, text: c.desc || "" } }));
    if (!items.length) return;
    Promise.all(items.map(({ c }) => trim(whole(c)))).then((bs) => {
      row.innerHTML = items.map(({ c, s }, i) => `<button type="button" class="wd-col" data-i="${i}" aria-label="${esc(s.name)} — ${esc(c.name)}"><span class="wd-col__cake">${pic(c, bs[i])}</span><span class="wd-col__pillar" aria-hidden="true"></span><span class="wd-col__name">${esc(s.name)}</span></button>`).join("");
      $$("img", row).forEach((im) => im.setAttribute("alt", ""));
    });

    let cur = -1;
    let flying = false;
    let touched = false;
    let landed = null;
    const openCard = (i) => {
      const { c, s } = items[i];
      card.hidden = false;
      card.innerHTML = `<div><small>ваш стиль — це знак 💐</small><h3>${esc(s.name)}</h3><p>${esc(s.text)}</p></div><a href="${href(c.id)}"><b>${esc(c.name)}</b><span>${Number(c.price) ? `від ${eur(c.price)} →` : "подивитися →"}</span></a>`;
      card.classList.remove("is-new");
      void card.offsetWidth;
      card.classList.add("is-new");
    };
    const pick = (i) => {
      cur = i;
      $$(".wd-col", row).forEach((el, k) => el.classList.toggle("is-picked", k === i));
      openCard(i);
    };
    const spot = (i) => {
      const col = $$(".wd-col", row)[i];
      if (!col) return null;
      const h = hall.getBoundingClientRect();
      const p = $(".wd-col__pillar", col).getBoundingClientRect();
      return { x: p.left - h.left + p.width * 0.62, y: p.top - h.top - p.height * 0.05 };
    };
    const lay = (i) => {
      const at = spot(i);
      if (!at) return;
      if (!landed) {
        landed = document.createElement("span");
        landed.className = "wd-landed";
        landed.setAttribute("aria-hidden", "true");
        landed.innerHTML = $("svg", btn).outerHTML;
        hall.appendChild(landed);
      }
      landed.style.left = `${at.x - landed.offsetWidth * 0.2}px`;
      landed.style.top = `${at.y - landed.offsetHeight * 0.55}px`;
    };
    const fly = (i) => {
      if (flying || !$$(".wd-col", row).length) return;
      const to = spot(i);
      if (!to) return;
      if (reduce) { pick(i); lay(i); return; }
      flying = true;
      const h = hall.getBoundingClientRect();
      const src = (landed || btn).getBoundingClientRect();
      const from = { x: src.left - h.left + src.width / 2, y: src.top - h.top + src.height / 3 };
      const f = document.createElement("span");
      f.className = "wd-flying";
      f.setAttribute("aria-hidden", "true");
      f.innerHTML = $("svg", btn).outerHTML;
      hall.appendChild(f);
      if (landed) landed.style.opacity = "0";
      btn.classList.add("is-gone");
      const w = f.offsetWidth;
      const arc = Math.max(160, Math.abs(to.x - from.x) * 0.45);
      const N = 16;
      const frames = Array.from({ length: N + 1 }, (_, k) => {
        const t = k / N;
        const x = from.x + (to.x - from.x) * t - w / 2;
        const y = from.y + (to.y - from.y) * t - arc * 4 * t * (1 - t) - w * 0.6;
        return { transform: `translate(${x}px, ${y}px) rotate(${t * 610}deg) scale(${1 + 0.25 * Math.sin(Math.PI * t)})` };
      });
      f.animate(frames, { duration: 950, easing: "cubic-bezier(.3,.1,.5,1)", fill: "forwards" }).onfinish = () => {
        f.remove();
        lay(i);
        if (landed) landed.style.opacity = "1";
        pick(i);
        flying = false;
        setTimeout(() => btn.classList.remove("is-gone"), 350);
      };
    };
    const random = () => {
      const n = $$(".wd-col", row).length;
      if (n < 2) return 0;
      let i = cur;
      while (i === cur) i = Math.floor(Math.random() * n);
      return i;
    };
    btn.addEventListener("click", () => { touched = true; fly(random()); });
    row.addEventListener("click", (e) => {
      const col = e.target.closest(".wd-col");
      if (!col) return;
      touched = true;
      +col.dataset.i === cur ? openCard(cur) : fly(+col.dataset.i);
    });
    addEventListener("resize", () => { if (cur >= 0) lay(cur); });
    // the first bouquet flies by itself as the hall comes into view
    hall.addEventListener("wd:in", () => setTimeout(() => { if (!touched && cur < 0) fly(0); }, T(500)), { once: true });
    seen([hall], "is-in", "0px 0px -30% 0px");
  }

  /* ───────── ⑤ the banquet hall ───────── */
  function calc() {
    const box = $("[data-wd-calc]");
    if (!box) return;
    const range = $(".wd-ring", box);
    const out = $("[data-wd-guests]", box);
    const seats = $("[data-wd-seats]", box);
    const tiersEl = $("[data-wd-tiers]", box);
    const res = $("[data-wd-res]", box);
    const hint = $("[data-wd-hint]", box);
    const COLORS = ["#a3161b", "#e98fa4", "#e2b45a", "#7fa36b", "#7b5ea7"];
    const W = [100, 78, 60, 45, 33];
    const PER = 10;
    const TABLES = Math.ceil(+range.max / PER);
    seats.innerHTML = Array.from({ length: TABLES }, () => `<span class="wd-table">${Array.from({ length: PER }, (_, k) => `<i class="wd-seat" style="--a:${k * (360 / PER)}deg"></i>`).join("")}</span>`).join("");
    const tables = $$(".wd-table", seats);
    const seatEls = $$(".wd-seat", seats);
    let grams = +($("[data-grams][aria-pressed=true]", box)?.dataset.grams || 175);
    let shown = 0;
    const paint = () => {
      const g = +range.value;
      range.style.setProperty("--p", `${((g - range.min) / (range.max - range.min)) * 100}%`);
      out.textContent = g;
      const kg = Math.max(1.5, Math.ceil(((g * grams) / 1000) * 2) / 2);
      const tiers = kg <= 3.5 ? 1 : kg <= 7 ? 2 : kg <= 12 ? 3 : kg <= 20 ? 4 : 5;
      const sizes = M().sizes || [];
      const size = sizes.find((s) => s.id !== "tier" && parseFloat(s.id) >= kg) || sizes.find((s) => s.id === "tier");
      const from = size ? Math.round(95 * size.priceMult * (size.id === "tier" ? Math.max(1, kg / 6) : 1)) : null;

      // tiers: new ones drop onto the stack, extra ones are lifted off the top
      while (shown < tiers) {
        const t = document.createElement("span");
        t.className = `wd-tier-c${reduce ? "" : " is-drop"}`;
        t.style.setProperty("--w", `${W[shown]}%`);
        t.style.setProperty("--c", COLORS[shown]);
        t.style.animationDelay = `${(shown - tiersEl.children.length) * 0.08}s`;
        tiersEl.appendChild(t);
        shown++;
      }
      while (shown > tiers) { tiersEl.lastElementChild.remove(); shown--; }
      $$(".wd-tier-c", tiersEl).forEach((t, i) => t.classList.toggle("is-top", i === tiers - 1));

      // every seat is fed by a tier: the bigger the tier, the more guests it serves
      const area = W.slice(0, tiers).map((w) => w * w);
      const sum = area.reduce((a, b) => a + b, 0);
      const bound = [];
      let acc = 0;
      area.forEach((a) => { acc += a; bound.push(Math.round((acc / sum) * g)); });
      seatEls.forEach((s, i) => {
        const on = i < g;
        s.classList.toggle("is-on", on);
        s.style.setProperty("--c", on ? COLORS[bound.findIndex((b) => i < b)] : "");
      });
      tables.forEach((t, i) => t.classList.toggle("is-empty", i * PER >= g));

      res.innerHTML = `
        <div><b>${String(kg).replace(".", ",")} кг</b><small>вага торта</small></div>
        <div><b>${tiers} ${tiers === 1 ? "ярус" : tiers < 5 ? "яруси" : "ярусів"}</b><small>радимо</small></div>
        <div><b>${from ? `від ${eur(from)}` : "—"}</b><small>база без декору</small></div>`;
      hint.textContent =
        g <= 20 ? "Камерне свято — один ярус або торт + бенто для пари ♥"
        : g <= 45 ? "Два яруси — дві начинки, кожному по смаку"
        : g <= 75 ? "Класичний весільний торт на три яруси"
        : g <= 110 ? "Або 2–3 яруси + candy bar — так навіть зручніше"
        : "Велике весілля! Церемоніальний торт + солодкий стіл";
    };
    box.addEventListener("click", (e) => {
      const fmt = e.target.closest("[data-grams]");
      if (fmt) {
        grams = +fmt.dataset.grams;
        $$("[data-grams]", box).forEach((x) => x.setAttribute("aria-pressed", x === fmt));
        paint();
      }
      const q = e.target.closest("[data-guests]");
      if (q) {
        range.value = q.dataset.guests;
        paint();
      }
    });
    range.addEventListener("input", paint);
    paint();
  }

  /* ───────── ⑥ the étagère: a tag makes its plate's sweets hop ───────── */
  function etagere() {
    const box = $("[data-wd-sweet]");
    if (!box) return;
    const plates = $$(".wd-plate", box);
    const hop = (n) => {
      const p = plates[n];
      if (!p || reduce) return;
      p.classList.remove("is-hop");
      void p.offsetWidth;
      p.classList.add("is-hop");
    };
    $$(".wd-tag", box).forEach((t) => {
      ["pointerenter", "focus"].forEach((ev) => t.addEventListener(ev, () => hop(+t.dataset.plate)));
    });
    box.addEventListener("wd:in", () => plates.forEach((_, i) => setTimeout(() => hop(plates.length - 1 - i), i * 160)), { once: true });
    seen([box], "is-in", "0px 0px -25% 0px");
  }

  /* ───────── ⑦ the guest book: a cake pressed on the left page, the note written on the right ───────── */
  function book() {
    const box = $("[data-wd-book]");
    if (!box) return;
    place($("[data-wd-book-cake]", box), take(["cherry-romance", "a-little-bite-of-love", "pearl-bow", "berry-romance"]));
    let i = 0;
    $$("[data-wd-ink] p", box).forEach((p) => {
      const words = p.textContent.split(/(\s+)/);
      p.textContent = "";
      words.forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) return p.appendChild(document.createTextNode(" "));
        const s = document.createElement("span");
        s.className = "wd-w";
        s.style.setProperty("--i", i++);
        s.textContent = w;
        p.appendChild(s);
      });
    });
    seen([box], "is-in", "0px 0px -25% 0px");
  }

  /* ───────── ⑧ notes tied with a bow ───────── */
  function notes() {
    const box = $("[data-wd-notes]");
    if (!box) return;
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const note = b.closest(".wd-note");
      const open = !note.classList.contains("is-open");
      $$(".wd-note", box).forEach((n) => {
        const on = n === note && open;
        n.classList.toggle("is-open", on);
        $("button", n).setAttribute("aria-expanded", on);
      });
    });
  }

  /* ───────── ⑨ save the date ───────── */
  function calendar() {
    const box = $("[data-wd-cal]");
    if (!box) return;
    const sec = box.closest("section");
    const days = $("[data-cal-days]", box);
    const title = $("[data-cal-month]", box);
    const pickOut = $("[data-cal-pick]", box);
    const go = $("[data-cal-go]");
    const prev = $("[data-cal='-1']", box);
    const next = $("[data-cal='1']", box);
    const day0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = day0(new Date());
    // a wedding cake needs at least three weeks: earlier days are greyed out
    const min = new Date(today); min.setDate(min.getDate() + 21);
    const maxMonth = new Date(today.getFullYear(), today.getMonth() + 18, 1);
    let view = new Date(min.getFullYear(), min.getMonth(), 1);
    let chosen = null;
    const fmtMonth = new Intl.DateTimeFormat("uk", { month: "long", year: "numeric" });
    const fmtDay = new Intl.DateTimeFormat("uk", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const clean = (s) => s.replace(/\s*р\.$/, "");
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const HEART = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 90C20 72 4 48 16 28 26 12 44 14 50 30 56 14 76 10 86 26 98 46 80 72 50 90"/></svg>`;
    const render = () => {
      title.textContent = cap(clean(fmtMonth.format(view)));
      prev.disabled = view <= new Date(min.getFullYear(), min.getMonth(), 1);
      next.disabled = view >= maxMonth;
      const lead = (view.getDay() + 6) % 7;
      const n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      let html = Array.from({ length: lead }, () => "<span></span>").join("");
      for (let d = 1; d <= n; d++) {
        const date = new Date(view.getFullYear(), view.getMonth(), d);
        const off = date < min;
        const on = chosen && +date === +chosen;
        html += `<button type="button" data-d="${d}" class="${date.getDay() === 6 ? "is-sat" : ""}"${off ? " disabled" : ""} aria-pressed="${!!on}" aria-label="${esc(cap(clean(fmtDay.format(date))))}">${d}${on ? HEART : ""}</button>`;
      }
      days.innerHTML = html;
    };
    box.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-cal]");
      if (nav && !nav.disabled) {
        view = new Date(view.getFullYear(), view.getMonth() + +nav.dataset.cal, 1);
        return render();
      }
      const b = e.target.closest("[data-d]");
      if (!b || b.disabled) return;
      chosen = new Date(view.getFullYear(), view.getMonth(), +b.dataset.d);
      render();
      pickOut.textContent = `${cap(clean(fmtDay.format(chosen)))} — перевіримо, чи вільна ця дата ♥`;
      if (go) go.href = `contacts.html?date=${iso(chosen)}&topic=wedding`;
      if (sec && window.MaridayMotion) {
        const r = sec.getBoundingClientRect();
        const c = b.getBoundingClientRect();
        MaridayMotion.burst(sec, c.left - r.left + c.width / 2, c.top - r.top, 46);
      }
    });
    render();
  }

  MARIDAY.onReady(() => {
    if (!M() || !M().cakes) return;
    if (!reduce) document.documentElement.classList.add("wd-js");
    headings();
    proposal();
    twoOfYou();
    way();
    toss();
    calc();
    etagere();
    book();
    notes();
    calendar();
  });
})();
