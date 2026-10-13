/* Mariday — the catalogue as a patisserie window (pages/cakes.html, css/catalog.css).
   ① the table: a few cakes of the collection land on porcelain stands and hop when the pointer passes (not a link)
   ③ the shop: «Кому торт?» stickers, a riding bar (what is shown, sort, favourites) and the shelves —
     when the choice changes, cakes that stay hop to their new places, new ones drop onto their plinths
   ④ the glass dome: lift it and a random cake from the window is standing under it
   Works without GSAP; with reduced motion everything is simply shown. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const M = () => window.MARIDAY;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const esc = (s) => window.escapeHTML(s);
  const href = (id) => `product.html?id=${encodeURIComponent(id)}`;
  const params = new URLSearchParams(location.search);

  const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many);
  const cakesWord = (n) => `${n} ${plural(n, "торт", "торти", "тортів")}`;

  // rooms for cakes that have no colour of their own yet (new ones from the admin panel)
  const ROOMS = [["#f6dbe0", "#c9506d"], ["#e5ddf3", "#7b5ea7"], ["#f6e6bf", "#a3701a"], ["#dbefed", "#2f8f83"], ["#efd3cd", "#8e2a22"], ["#f9d6e3", "#cf467f"]];
  const tone = (c) => (c.bg ? [c.bg, c.accent || "#c9506d"] : ROOMS[M().cakes.indexOf(c) % ROOMS.length]);
  const cut = (c) => (M().cutout ? M().cutout(c) : "");
  // these cut-outs come from photos that crop the cake or its plate, so the cut edge would show:
  // the table and the dome leave them out, the shelves show them as whole photos
  const CROPPED = ["berries", "slice", "strawslice", "tiramisu", "meringue"];
  const whole = (c) => (c.cutout || !CROPPED.includes(c.img) ? cut(c) : "");
  const price = (c) => Number(c.price) || 0;
  // what the bar says for each reason
  const NOW = { all: "Усі торти", friends: "Для друзів", kids: "Для дітей", parents: "Для батьків", colleagues: "Для колег", loved: "Для коханих", wedding: "Весільні", dessert: "Десертні" };

  function splitInto(el, text) {
    el.textContent = "";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "kt-ch";
      s.style.setProperty("--i", i);
      s.style.setProperty("--cr", `${i % 2 ? 12 : -12}deg`);
      s.textContent = ch === " " ? "\u00a0" : ch;
      el.appendChild(s);
    });
  }

  /* ───────── the numbers in the hero follow the collection as it is edited in the admin panel ───────── */
  function totals() {
    const list = M().cakes;
    if (!list.length) return;
    const n = list.length;
    const min = Math.min(...list.map(price));
    const eb = $("[data-kt-total]");
    if (eb) eb.textContent = `( ${n} ${plural(n, "дизайн", "дизайни", "дизайнів")} · від €${min} )`;
    $$("[data-kt-count]").forEach((el) => (el.textContent = cakesWord(n)));
  }

  /* ───────── ① the table ───────── */
  // the cakes the table prefers while the collection has them; otherwise hits first, then the catalogue order
  const TABLE = ["cherry-romance", "a-little-bite-of-love", "strawberry-love", "berry-romance", "floral-poetry", "pearl-bow", "burgundy-orchid"];
  // where the cake really is inside its cut-out (the canvas around it is transparent), so it stands right on its plate
  const trim = (src) => new Promise((done) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.fetchPriority = "high";
    im.onload = () => {
      try {
        const W = 160;
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

  function table() {
    const host = $("[data-kt-table]");
    if (!host) return;
    const spread = $(".kt-table__spread", host);
    // only whole cut-out cakes go on the table, and only a few of them; the lilac cut-out comes on a stand of its own
    const pool = M().cakes.filter((c) => whole(c) && (c.cutout || c.img !== "lilac"));
    const hit = (c) => (c.tags || []).some((t) => /хіт|бестсел/i.test(t));
    const picks = [...new Set([...TABLE.map((id) => pool.find((c) => c.id === id)).filter(Boolean), ...pool.filter(hit), ...pool])].slice(0, 7);
    if (!picks.length) return;
    // the flattest cakes get the low stands, the tallest tiers stand on the cloth (the very tallest at the ends),
    // the one in between is raised on the tall stand in the middle; smaller screens put the two ends away, phones every bare one
    const kinds = [["tall"], ["low", "low"], ["low", "tall", "low"], ["bare", "low", "low", "bare"], ["bare", "low", "tall", "low", "bare"],
      ["bare", "low", "tall", "tall", "low", "bare"], ["bare", "low", "bare", "tall", "bare", "low", "bare"]][picks.length - 1];
    if (!reduce) host.classList.add("is-js");

    const lay = (boxes) => {
      const ranked = picks.map((c, i) => ({ c, b: boxes && boxes[i] })).sort((p, q) => (p.b ? p.b.ar : 1) - (q.b ? q.b.ar : 1));
      const spots = kinds.map(() => null);
      const mid = (kinds.length - 1) / 2;
      const outwards = kinds.map((k, i) => i).sort((a, b) => Math.abs(b - mid) - Math.abs(a - mid));
      // the cherry cake, when it is there, keeps the tall stand in the middle
      const star = ranked.findIndex((p) => p.c.id === TABLE[0]);
      const centre = kinds.indexOf("tall");
      if (star >= 0 && centre >= 0) spots[centre] = ranked.splice(star, 1)[0];
      [["low", () => ranked.shift()], ["bare", () => ranked.pop()], ["tall", () => ranked.shift()]].forEach(([kind, take]) =>
        outwards.forEach((i) => { if (kinds[i] === kind && !spots[i]) spots[i] = take(); }));
      // just cakes on display: nothing to click, nothing written
      spread.innerHTML = spots.map(({ c, b }, i) => {
        const k = kinds[i];
        const pic = b
          ? `style="width:${(100 / b.w).toFixed(2)}%;left:${((-b.x / b.w) * 100).toFixed(2)}%;top:${((-b.y / b.h) * 100).toFixed(2)}%"`
          : `class="is-fit"`;
        return `<span class="kt-spot kt-spot--${k}${Math.abs(i - mid) >= 3 ? " kt-spot--far" : ""}" style="--ar:${(b ? b.ar : 1).toFixed(3)};--dl:${(0.12 + Math.abs(i - mid) * 0.1).toFixed(2)}s"><span class="kt-spot__cake"><span class="kt-spot__drop"><span class="kt-spot__hop"><span class="kt-spot__pic"><img src="${esc(whole(c))}" crossorigin="anonymous" alt="" draggable="false" ${pic}></span></span></span></span>${k === "bare" ? "" : `<span class="kt-stand" aria-hidden="true"><i></i></span>`}</span>`;
      }).join("");
      // the table is there at once; the cakes land on it as soon as they are laid out
      if (!reduce) requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add("is-up")));
    };
    // measure the cut-outs first (they have to load anyway); a very slow connection gets them untrimmed rather than none
    let laid = false;
    const once = (boxes) => { if (!laid) { laid = true; lay(boxes); } };
    Promise.all(picks.map((c) => trim(whole(c)))).then(once);
    setTimeout(() => once(null), 6000);
  }

  /* ───────── ③ the shop ───────── */
  function cardHTML(c) {
    const fav = MaridayFavs.has(c.id);
    const cu = whole(c);
    const [bg, ac] = tone(c);
    const hit = (c.tags || []).some((t) => /хіт|бестсел/i.test(t));
    const k = M().cakes.indexOf(c);
    return `
      <article class="kt-card" data-id="${esc(c.id)}" style="--room:${bg};--accent:${ac};--tr:${[5, -3, 7, -6, 4, -4][k % 6]}deg;--td:${(-k * 0.7).toFixed(1)}s">
        <a class="kt-card__room" href="${href(c.id)}" aria-label="${esc(c.name)} — від €${price(c)}">
          <span class="kt-card__lamp" aria-hidden="true"></span>
          <span class="kt-card__plinth" aria-hidden="true"></span>
          <span class="kt-card__cake"><span class="kt-card__lift"><span class="kt-card__hop"><img class="${cu ? "" : "is-photo"}" src="${cu || c.image}" alt="${esc(c.name)}" loading="lazy" draggable="false"></span></span></span>
          ${hit ? `<span class="kt-card__hit" aria-hidden="true">хіт</span>` : ""}
          <span class="kt-card__tag" aria-hidden="true"><span class="kt-card__paper"><small>від</small><b>€${price(c)}</b></span></span>
        </a>
        <div class="kt-card__body">
          <h3><a href="${href(c.id)}">${esc(c.name)}</a></h3>
          <ul class="p-tags">${(c.tags || []).slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          <div class="kt-card__row"><span class="kt-card__days">⏳ від ${c.days || 5} дн.</span><button type="button" class="p-fav${fav ? " is-on" : ""}" data-fav="${esc(c.id)}" aria-pressed="${fav}" aria-label="Додати «${esc(c.name)}» в обране" title="В обране">♥</button><a class="kt-card__go" href="${href(c.id)}">Обрати →</a></div>
        </div>
      </article>`;
  }

  function shop() {
    const grid = $("#kt-grid");
    if (!grid) return;
    const who = $("#kt-who");
    const pills = $("#kt-pills");
    const bar = $("#kt-bar");
    const sortHost = $("#kt-sort");
    const favBtn = $("#kt-favs");
    const nowEl = $("[data-kt-now]");
    const nEl = $("[data-kt-n]");
    const cats = M().categories;
    let active = cats.some((c) => c.id === params.get("cat")) ? params.get("cat") : "all";
    let sort = "pop";
    let favOnly = params.get("fav") === "1";
    // «Обране» shows every favourite, whatever reason was picked before
    if (favOnly) active = "all";
    const live = !reduce && "IntersectionObserver" in window;
    const inCat = (c, id) => id === "all" || (c.cats || []).includes(id);

    // the stickers: each reason shows a cake of its own popping out of the circle
    const counts = {};
    cats.forEach((cat) => (counts[cat.id] = M().cakes.filter((k) => inCat(k, cat.id)).length));
    const used = new Set();
    const face = (id) => {
      const list = M().cakes.filter((k) => inCat(k, id));
      const withCut = list.filter((k) => whole(k));
      // «all» goes last and takes three cakes no other sticker shows
      if (id === "all") return [...withCut.filter((x) => !used.has(x.id)), ...withCut].slice(0, 3).map((k) => `<img src="${whole(k)}" alt="">`).join("");
      // a different cake on every sticker where the collection allows it
      const k = withCut.find((x) => !used.has(x.id)) || withCut[0] || list[0];
      if (!k) return "";
      used.add(k.id);
      return whole(k) ? `<img src="${whole(k)}" alt="">` : `<img class="is-photo" src="${k.image}" alt="">`;
    };
    // the reasons with the fewest cakes choose their face first, so the stickers don't repeat
    const faces = {};
    [...cats].sort((a, b) => (a.id === "all") - (b.id === "all") || counts[a.id] - counts[b.id]).forEach((cat) => (faces[cat.id] = face(cat.id)));
    who.innerHTML = "";
    cats.forEach((cat, i) => {
      const [bg] = tone(M().cakes.find((k) => inCat(k, cat.id) && k.bg) || M().cakes[i % M().cakes.length] || {});
      const b = document.createElement("button");
      b.type = "button";
      b.className = "kt-who__b";
      b.dataset.cat = cat.id;
      b.style.setProperty("--r", `${[-4, 3, -2, 4, -3, 2, -4, 3][i % 8]}deg`);
      b.style.setProperty("--c", bg || "#f6dbe0");
      b.innerHTML = `<span class="kt-who__disc" aria-hidden="true"></span><span class="kt-who__l">${esc(cat.label)}</span><sup aria-label="${cakesWord(counts[cat.id])}">${counts[cat.id]}</sup>`;
      who.appendChild(b);
      $(".kt-who__disc", b).innerHTML = faces[cat.id];
    });
    pills.innerHTML = cats.map((cat) => `<button type="button" data-cat="${cat.id}">${esc(cat.label)}</button>`).join("");

    // the little sign the bar folds into over the shelves
    bar.insertAdjacentHTML("afterbegin", `<button type="button" class="kt-plaque" aria-controls="kt-pills" aria-expanded="true" tabindex="-1"><b aria-hidden="true"></b><span class="kt-plaque__n" aria-hidden="true"></span><i class="kt-plaque__fav" aria-hidden="true" hidden></i><span class="kt-plaque__open" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><path d="M3 6.5h14M3 13.5h14" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="13" cy="6.5" r="2.3" fill="#a3161b" stroke="#fff" stroke-width="1.6"/><circle cx="7" cy="13.5" r="2.3" fill="#a3161b" stroke="#fff" stroke-width="1.6"/></svg></span></button>`);
    const sign = $(".kt-plaque", bar);
    const signNow = $("b", sign);
    const signN = $(".kt-plaque__n", sign);
    const signFav = $(".kt-plaque__fav", sign);
    const measure = () => {
      bar.style.setProperty("--tw", `${sign.offsetWidth}px`);
      bar.style.setProperty("--th", `${sign.offsetHeight}px`);
    };

    const paintControls = () => {
      $$("[data-cat]", who).concat($$("[data-cat]", pills)).forEach((b) => {
        const on = b.dataset.cat === active;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      sortHost.innerHTML = [["pop", "Популярні"], ["asc", "Дешевші"], ["desc", "Дорожчі"]]
        .map(([id, l]) => `<button type="button" class="${sort === id ? "is-on" : ""}" data-sort="${id}" aria-pressed="${sort === id}">${l}</button>`).join("");
      favBtn.classList.toggle("is-on", favOnly);
      favBtn.setAttribute("aria-pressed", String(favOnly));
      favBtn.querySelector("b").textContent = MaridayFavs.get().length;
      const nf = MaridayFavs.get().length;
      signFav.hidden = !nf || favOnly;
      signFav.textContent = `♥ ${nf}`;
      measure();
    };

    // the heading of the bar (and of the sign) jumps in letter by letter when it changes
    let lastNow = "";
    const paintNow = (n) => {
      const cat = cats.find((c) => c.id === active);
      const text = favOnly ? "Обране ♥" : NOW[active] || (cat ? cat.label : "Торти");
      if (text !== lastNow) {
        lastNow = text;
        [nowEl, signNow].forEach((el) => (reduce ? (el.textContent = text) : splitInto(el, text)));
        nowEl.setAttribute("aria-label", text);
      }
      nEl.textContent = signN.textContent = cakesWord(n);
      sign.setAttribute("aria-label", `${text}, ${cakesWord(n)} — показати фільтри`);
      measure();
    };

    // cakes appear as their shelf scrolls into view; a row of them lands one after another
    let io = null;
    if (live) {
      grid.classList.add("is-js");
      io = new IntersectionObserver((entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
        vis.forEach((e, k) => {
          e.target.style.setProperty("--dl", `${(k * 0.09).toFixed(2)}s`);
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    }

    const nodes = new Map();
    const node = (c) => {
      let el = nodes.get(c.id);
      if (!el) {
        const t = document.createElement("template");
        t.innerHTML = cardHTML(c).trim();
        el = t.content.firstElementChild;
        nodes.set(c.id, el);
      }
      return el;
    };

    function paint(animate) {
      let list = M().cakes.filter((c) => inCat(c, active));
      if (favOnly) list = list.filter((c) => MaridayFavs.has(c.id));
      if (sort === "asc") list = [...list].sort((a, b) => price(a) - price(b));
      if (sort === "desc") list = [...list].sort((a, b) => price(b) - price(a));
      paintControls();
      paintNow(list.length);

      const motion = animate && live;
      const current = $$(".kt-card:not(.is-leaving)", grid);
      const first = new Map();
      const g0 = grid.getBoundingClientRect();
      if (motion) current.forEach((el) => first.set(el, el.getBoundingClientRect()));
      const keep = new Set(list.map((c) => c.id));
      const leaving = current.filter((el) => !keep.has(el.dataset.id));

      $(".kt-empty", grid)?.remove();
      const next = list.map(node);
      next.forEach((el) => grid.appendChild(el));
      leaving.forEach((el) => {
        if (!motion) return el.remove();
        // pinned where it stood, it falls out of the window while the others move
        const r = first.get(el);
        Object.assign(el.style, { position: "absolute", left: `${r.left - g0.left}px`, top: `${r.top - g0.top}px`, width: `${r.width}px` });
        el.classList.add("is-leaving");
        grid.appendChild(el);
        setTimeout(() => { el.remove(); Object.assign(el.style, { position: "", left: "", top: "", width: "" }); el.classList.remove("is-leaving"); }, 520);
      });
      // nothing on the shelves: the bare plinth from js/favs.js, cakes queuing to be hearted, the way to the whole window
      if (!list.length) grid.insertAdjacentHTML("beforeend", MaridayFavNote.emptyHTML(favOnly));

      if (live) {
        let fresh = 0;
        next.forEach((el) => {
          const r0 = first.get(el);
          if (r0) {
            // FLIP: from where it stood to its new place, with a hop on the way
            const r1 = el.getBoundingClientRect();
            const dx = r0.left - r1.left;
            const dy = r0.top - r1.top;
            if (Math.abs(dx) + Math.abs(dy) > 2 && el.animate) {
              el.getAnimations().forEach((a) => a.cancel());
              el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 850, easing: "cubic-bezier(0.19, 1, 0.22, 1)" });
              el.classList.remove("is-hop");
              void el.offsetWidth;
              el.classList.add("is-hop");
            }
          } else if (motion && el.classList.contains("is-in")) {
            // came back from an earlier visit: drop in again
            el.classList.remove("is-in");
            void el.offsetWidth;
            el.style.setProperty("--dl", `${(0.12 + fresh++ * 0.07).toFixed(2)}s`);
            el.classList.add("is-in");
          } else if (!el.classList.contains("is-in")) {
            io.observe(el);
          }
        });
      }

      MaridayMotion?.refresh?.();
      const url = new URL(location.href);
      active === "all" ? url.searchParams.delete("cat") : url.searchParams.set("cat", active);
      favOnly ? url.searchParams.set("fav", "1") : url.searchParams.delete("fav");
      history.replaceState(null, "", url);
    }
    grid.addEventListener("animationend", (e) => {
      if (e.animationName === "kt-shelf-hop") e.target.closest(".kt-card")?.classList.remove("is-hop");
    });

    const pick = (id, from) => {
      if (id === active && !favOnly) return;
      active = id;
      favOnly = false;
      if (from) { from.classList.remove("is-boing"); void from.offsetWidth; from.classList.add("is-boing"); }
      paint(true);
      // from the big stickers, bring the shelves into view
      if (from && from.closest("#kt-who")) {
        const y = bar.getBoundingClientRect().top;
        if (y > innerHeight * 0.75) (window.MaridayLenis ? MaridayLenis.scrollTo(bar, { offset: -20, duration: 1.1 }) : bar.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
      }
    };
    who.addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) pick(b.dataset.cat, b); });
    pills.addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) pick(b.dataset.cat, b); });
    sortHost.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sort]");
      if (!b || b.dataset.sort === sort) return;
      sort = b.dataset.sort;
      paint(true);
    });
    favBtn.addEventListener("click", () => { favOnly = !favOnly; if (favOnly) active = "all"; paint(true); });
    // the note that pops up on ♥ (js/favs.js) opens «Обране» right here instead of reloading the page
    MaridayFavNote.here = {
      showing: () => favOnly,
      open: () => {
        if (!favOnly) { favOnly = true; active = "all"; paint(true); }
        const y = grid.getBoundingClientRect().top;
        if (y < 0 || y > innerHeight * 0.6) (window.MaridayLenis ? MaridayLenis.scrollTo(grid, { offset: -150, duration: 1.1 }) : scrollTo({ top: scrollY + y - 150, behavior: reduce ? "auto" : "smooth" }));
      },
    };
    grid.addEventListener("click", (e) => {
      // «До каталогу» on the empty shelf: back to the whole window
      if (e.target.closest("[data-kt-all]")) { e.preventDefault(); return pick("all"); }
      const btn = e.target.closest("[data-fav]");
      if (!btn) return;
      e.preventDefault();
      const on = MaridayFavs.toggle(btn.dataset.fav).includes(btn.dataset.fav);
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.remove("is-pop");
      void btn.offsetWidth;
      btn.classList.add("is-pop");
      MaridayFavNote.show(btn.dataset.fav, on, btn);
    });
    document.addEventListener("mariday:favs", () => {
      paintControls();
      if (favOnly) paint(true);
    });

    // once the big stickers scroll away, the bar folds into the sign; hover it, tap it or Tab to it and it unfolds,
    // the reasons dropping on a strip below. Scrolling on (or a tap elsewhere) folds it up again.
    let compact = false;
    let open = false;
    let hover = false;
    let openY = 0;
    let leaveT = 0;
    // the sign swings on its twine with the speed of the scroll and settles
    let ang = 0;
    let vel = 0;
    let raf = 0;
    const swing = () => {
      vel = (vel - ang * 0.05) * 0.93;
      ang = Math.max(-6, Math.min(6, ang + vel));
      if (Math.abs(ang) < 0.03 && Math.abs(vel) < 0.03) { ang = vel = 0; raf = 0; }
      else raf = requestAnimationFrame(swing);
      sign.style.setProperty("--sw", `${ang.toFixed(2)}deg`);
    };
    const kick = (dy) => {
      if (reduce || !dy) return;
      vel += Math.max(-0.4, Math.min(0.4, dy * 0.01));
      if (!raf) raf = requestAnimationFrame(swing);
    };
    const fold = () => {
      const tucked = compact && !open && !hover;
      if (tucked && !bar.classList.contains("is-tucked")) setTimeout(() => kick(40), 450);
      bar.classList.toggle("is-tucked", tucked);
      sign.setAttribute("aria-expanded", String(!tucked));
      sign.tabIndex = tucked ? 0 : -1;
    };
    const unfold = (on) => { open = on; openY = scrollY; fold(); };

    sign.addEventListener("click", (e) => {
      unfold(true);
      // from the keyboard: straight to the reasons, once they are shown
      if (!e.detail) setTimeout(() => (pills.querySelector(".is-on") || pills.querySelector("button"))?.focus({ preventScroll: true }), 350);
    });
    if (fine) {
      sign.addEventListener("pointerenter", () => { clearTimeout(leaveT); hover = true; fold(); });
      bar.addEventListener("pointerenter", () => clearTimeout(leaveT));
      bar.addEventListener("pointerleave", () => { clearTimeout(leaveT); leaveT = setTimeout(() => { hover = false; fold(); }, 380); });
    }
    document.addEventListener("pointerdown", (e) => { if (open && !bar.contains(e.target)) unfold(false); });
    // Tab out of the bar folds it (the sign hiding under a tap blurs with no next target — that is not leaving)
    bar.addEventListener("focusout", (e) => { if (open && e.relatedTarget && !bar.contains(e.relatedTarget)) unfold(false); });
    bar.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !compact) return;
      hover = false;
      unfold(false);
      setTimeout(() => sign.focus(), 400);
    });
    // (read from the stickers' position on every scroll: a jump straight past them must fold the bar too)
    const watch = () => {
      const now = who.getBoundingClientRect().bottom < 0;
      if (now === compact) return;
      compact = now;
      bar.classList.toggle("is-compact", compact);
      if (!compact) open = false;
      fold();
    };
    let lastY = scrollY;
    addEventListener("scroll", () => {
      const y = scrollY;
      watch();
      if (open && Math.abs(y - openY) > 180 && !bar.querySelector(":focus-visible")) unfold(false);
      if (bar.classList.contains("is-tucked")) kick(y - lastY);
      lastY = y;
    }, { passive: true });
    addEventListener("resize", () => { measure(); watch(); });
    document.fonts?.ready.then(measure);
    watch();

    // when the site header slides back in, the bar (or the sign) moves down to hang just below it
    const hdr = $(".hdr");
    if (hdr) {
      const syncTop = () => (hdr.classList.contains("hdr--hidden") ? bar.style.removeProperty("--kt-top") : bar.style.setProperty("--kt-top", `${hdr.offsetHeight + 10}px`));
      new MutationObserver(syncTop).observe(hdr, { attributes: true, attributeFilter: ["class"] });
      hdr.addEventListener("transitionend", syncTop);
      syncTop();
    }

    paint(false);
  }

  /* ───────── ④ the glass dome ───────── */
  function luck() {
    const sec = $(".kt-luck");
    if (!sec) return;
    const btns = $$("[data-kt-lift]", sec);
    const img = $(".kt-luck__cake img", sec);
    const wait = $("[data-kt-luck-wait]", sec);
    const got = $(".kt-luck__got", sec);
    const ticket = $("[data-kt-ticket]", sec);
    const tries = $("[data-kt-try]", sec);
    const nameEl = $("[data-kt-luck-name]", sec);
    const pool = () => M().cakes.filter((c) => whole(c));
    let bag = [];
    let last = "";
    let open = false;
    let busy = false;
    let n = 0;
    let rollT = 0;
    const T = (ms) => (reduce ? 0 : ms);
    const next = () => {
      if (!bag.length) bag = pool().map((c) => c.id).sort(() => Math.random() - 0.5);
      let id = bag.pop();
      if (id === last && bag.length) id = bag.pop();
      last = id;
      return M().cakes.find((c) => c.id === id);
    };
    const replay = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    // the name spins past like a slot reel, slowing down until it stops on the cake under the dome
    const roll = (c) => {
      clearTimeout(rollT);
      got.classList.remove("is-landed");
      const names = pool().map((x) => x.name).filter((x) => x !== c.name);
      const steps = reduce || !names.length ? [] : [45, 45, 50, 55, 65, 80, 100, 130, 170, 220];
      got.classList.toggle("is-rolling", steps.length > 0);
      const tick = (i) => {
        if (i >= steps.length) {
          nameEl.textContent = c.name;
          got.classList.remove("is-rolling");
          replay(got, "is-landed");
          return;
        }
        nameEl.textContent = names[Math.floor(Math.random() * names.length)];
        rollT = setTimeout(() => tick(i + 1), steps[i]);
      };
      tick(0);
    };
    const show = (c) => {
      wait.hidden = true;
      got.hidden = false;
      got.style.animation = "none";
      void got.offsetWidth;
      got.style.animation = "";
      n += 1;
      if (tries) { tries.textContent = String(n).padStart(2, "0"); replay(tries, "is-tick"); }
      if (ticket && !reduce) replay(ticket, "is-print");
      roll(c);
      $("[data-kt-luck-desc]", sec).textContent = c.desc || "";
      $("[data-kt-luck-price]", sec).textContent = `від €${price(c)}`;
      $("[data-kt-luck-link]", sec).href = href(c.id);
    };
    const label = () => btns.forEach((b) => {
      const t = open ? "Ще разок ✦" : "Підняти ковпак";
      const span = $(":scope > span:only-child", b);
      if (span) span.textContent = t;
      else b.setAttribute("aria-label", open ? "Накрити й спробувати ще" : "Підняти ковпак");
    });
    const reveal = () => {
      const c = next();
      if (!c) return;
      const go = () => {
        sec.classList.add("is-open");
        open = true;
        label();
        show(c);
        setTimeout(() => {
          const s = sec.getBoundingClientRect();
          const r = img.getBoundingClientRect();
          window.MaridayMotion?.burst?.(sec, r.left + r.width / 2 - s.left, r.top - s.top + 10, 120);
          busy = false;
        }, T(380));
      };
      img.src = whole(c);
      img.alt = c.name;
      img.decode ? img.decode().then(go, go) : go();
    };
    const lift = () => {
      if (busy) return;
      busy = true;
      if (!open) return reveal();
      // cover it, shuffle, lift again
      sec.classList.add("is-closing", "is-busy");
      sec.classList.remove("is-open");
      open = false;
      setTimeout(() => {
        sec.classList.remove("is-closing");
        sec.classList.add("is-shuffle");
        setTimeout(() => { sec.classList.remove("is-shuffle", "is-busy"); reveal(); }, T(720));
      }, T(560));
    };
    btns.forEach((b) => b.addEventListener("click", lift));
    label();
  }

  /* ───────── ⑤ the glaze under the last card: the drips run down once it is in view ───────── */
  function pour() {
    const el = $("[data-kt-pour]");
    if (!el || reduce || !("IntersectionObserver" in window)) return;
    el.classList.add("is-armed");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      el.classList.add("is-in");
      io.disconnect();
    }), { threshold: 0.4 });
    io.observe(el);
  }

  /* ───────── section headings: glazed letters jump in, the script word is piped after them ───────── */
  function headings() {
    const hs = $$(".kt-h2");
    hs.forEach((h) => { const w = $("[data-kt-split]", h); if (w) splitInto(w, w.textContent); });
    if (reduce || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("kt-js");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    }), { threshold: 0.35 });
    hs.forEach((h) => io.observe(h));
  }

  MARIDAY.onReady(() => {
    if (!M() || !M().cakes) return;
    totals();
    headings();
    table();
    shop();
    luck();
    pour();
  });
})();
