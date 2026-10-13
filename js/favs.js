/* Mariday — favourites (css/favs.css). Loaded on the catalogue (js/catalog.js) and the cake page (js/app.js).
   ① MaridayFavNote.show(id, on, fromEl): a cream note slides up from the bottom — the cake pops out of a sticker in its
     own colour, a glossy heart flies from the tapped ♥ and stamps onto it. Taking a cake out breaks the heart in two
     and offers «Повернути».
   ② MaridayFavNote.emptyHTML(favOnly): the empty «Обране» shelf — a bare plinth with a dashed cake marked out on it,
     a few cakes queuing on either side. Tap one's ♥ and it jumps onto the plinth. Below: the way to the whole
     catalogue and to the constructor.
   Every ♥ on the page follows the favourites, so «Повернути» keeps the hearts on the cards in step. */
(function () {
  const M = () => window.MARIDAY;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => window.escapeHTML(s);
  const page = (f) => (location.pathname.includes("/pages/") ? "" : "pages/") + f;
  // as in catalog.js: these cut-outs come from photos that crop the cake, so the cut edge would show
  const CROPPED = ["berries", "slice", "strawslice", "tiramisu", "meringue"];
  const ROOMS = ["#f6dbe0", "#e5ddf3", "#f6e6bf", "#dbefed", "#efd3cd", "#f9d6e3"];
  const cakes = () => (M() && M().cakes) || [];
  const cakeOf = (id) => cakes().find((c) => c.id === id);
  const whole = (c) => {
    const u = M().cutout ? M().cutout(c) : "";
    return u && (c.cutout || !CROPPED.includes(c.img)) ? u : "";
  };
  const room = (c) => c.bg || ROOMS[cakes().indexOf(c) % ROOMS.length];
  // a heart in two halves: whole while it is loved, it cracks apart when it is not
  const HEART = `<span class="fh" aria-hidden="true"><i></i><i></i></span>`;

  // little hearts thrown out of a point on the screen
  function burst(x, y, n = 7) {
    const w = document.createElement("span");
    w.className = "fburst";
    w.setAttribute("aria-hidden", "true");
    w.style.left = `${x}px`;
    w.style.top = `${y}px`;
    w.innerHTML = Array.from({ length: n }, (_, i) => `<i style="--a:${Math.round((i * 360) / n + Math.random() * 30)}deg;--r:${Math.round(26 + Math.random() * 22)}px;--s:${(0.55 + Math.random() * 0.5).toFixed(2)}"></i>`).join("");
    document.body.appendChild(w);
    setTimeout(() => w.remove(), 900);
  }
  const centre = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  /* ───────── ① the note ───────── */
  let el, card, img, small, name, btn, heart, sr, timer, now;
  function build() {
    if (el) return;
    el = document.createElement("div");
    el.className = "fnote";
    el.innerHTML = `<div class="fnote__card">
        <span class="fnote__disc" aria-hidden="true"><img alt="" draggable="false"></span>
        <span class="fnote__stamp">${HEART}</span>
        <p class="fnote__txt"><small></small><b></b></p>
        <button type="button" class="fnote__btn"></button>
      </div>`;
    document.body.appendChild(el);
    // what a screen reader hears, in a live region that is always there
    sr = document.createElement("p");
    sr.className = "fnote-sr";
    sr.setAttribute("role", "status");
    document.body.appendChild(sr);
    card = el.querySelector(".fnote__card");
    img = el.querySelector("img");
    small = el.querySelector("small");
    name = el.querySelector("b");
    btn = el.querySelector(".fnote__btn");
    heart = el.querySelector(".fnote__stamp");
    btn.addEventListener("click", () => {
      if (!now) return;
      if (now.on) {
        hide();
        api.here ? api.here.open() : (location.href = page("cakes.html?fav=1"));
      } else {
        // «Повернути»: back into favourites, the heart mends
        MaridayFavs.toggle(now.id);
        show(now.id, true);
      }
    });
    // the note waits while the pointer or the focus is on it
    card.addEventListener("pointerenter", () => clearTimeout(timer));
    card.addEventListener("pointerleave", arm);
    card.addEventListener("focusin", () => clearTimeout(timer));
    card.addEventListener("focusout", arm);
    card.addEventListener("animationend", (e) => {
      if (e.animationName === "fnote-down") el.classList.remove("is-out");
    });
  }
  // a removal stays a little longer: there is «Повернути» to reach for
  function arm() {
    clearTimeout(timer);
    timer = setTimeout(hide, now && !now.on ? 6000 : 4200);
  }
  function hide() {
    clearTimeout(timer);
    if (!el || !el.classList.contains("is-in")) return;
    el.classList.remove("is-in", "is-again", "is-stamp");
    if (!reduce()) el.classList.add("is-out");
  }

  function show(id, on, from) {
    const c = cakeOf(id);
    if (!c) return;
    build();
    // the plain cherry toast steps aside so the two don't stack
    document.getElementById("toast")?.classList.remove("show");
    const cut = whole(c);
    img.src = cut || c.image;
    img.classList.toggle("is-photo", !cut);
    el.style.setProperty("--c", room(c));
    small.textContent = on ? "тепер в обраному" : "прибрано з обраного";
    name.textContent = c.name;
    btn.textContent = on ? "Усе обране" : "Повернути";
    // already looking at «Обране» on the catalogue — nowhere to send them
    btn.hidden = on && !!(api.here && api.here.showing());
    sr.textContent = on ? `«${c.name}» додано в обране` : `«${c.name}» прибрано з обраного`;
    now = { id, on };

    const again = el.classList.contains("is-in");
    el.classList.remove("is-in", "is-out", "is-again", "is-stamp", "is-fly");
    void el.offsetWidth;
    el.classList.toggle("is-off", !on);
    el.classList.add("is-in");
    if (again) el.classList.add("is-again");
    arm();

    if (!on || !from || reduce()) {
      el.style.setProperty("--sd", on ? "0.35s" : "0.2s");
      el.classList.add("is-stamp");
      return;
    }
    el.style.setProperty("--sd", "0s");
    // a heart leaves the button and lands on the cake's sticker
    const [sx, sy] = centre(from);
    burst(sx, sy);
    el.classList.add("is-fly");
    const r = heart.getBoundingClientRect();
    // the card is still rising: aim at where it will stop
    const lift = parseFloat((getComputedStyle(card).translate || "0 0").split(" ")[1]) || 0;
    const ex = r.left + r.width / 2;
    const ey = r.top + r.height / 2 - lift;
    const f = document.createElement("span");
    f.className = "fh fh--fly";
    f.setAttribute("aria-hidden", "true");
    f.innerHTML = "<i></i><i></i>";
    f.style.left = `${sx}px`;
    f.style.top = `${sy}px`;
    document.body.appendChild(f);
    const dx = ex - sx;
    const dy = ey - sy;
    const up = Math.min(dy, 0) - 110;
    const a = f.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.7)" },
        { transform: `translate(calc(-50% + ${dx * 0.35}px), calc(-50% + ${up}px)) scale(1.35) rotate(-14deg)`, offset: 0.45 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(-8deg)` },
      ],
      { duration: 760, easing: "cubic-bezier(0.45, 0, 0.3, 1)" }
    );
    const land = () => {
      f.remove();
      el.classList.remove("is-fly");
      el.classList.add("is-stamp");
    };
    a.onfinish = land;
    a.oncancel = land;
  }

  // every ♥ on the page shows what is in favourites (after the catalogue has repainted its shelves)
  document.addEventListener("mariday:favs", () => {
    queueMicrotask(() => {
      document.querySelectorAll("[data-fav]").forEach((b) => {
        const on = MaridayFavs.has(b.dataset.fav);
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
    });
  });

  /* ───────── ② the empty shelf ───────── */
  const pickHTML = (c, i) => `
    <button type="button" class="fe__pick" data-fe-pick="${esc(c.id)}" style="--c:${esc(room(c))};--d:${(-i * 0.8).toFixed(1)}s" aria-label="Додати «${esc(c.name)}» в обране">
      <span class="fe__disc" aria-hidden="true"><img src="${esc(whole(c))}" alt="" draggable="false"><span class="fe__chip">${HEART}</span></span>
      <span class="fe__name" aria-hidden="true">${esc(c.name)}</span>
    </button>`;

  function emptyHTML(fav) {
    const [w, s, hand, tag] = fav
      ? ["Серце", "ще вільне", "тицьніть ♥ — і торт стане на порожнє місце", "для улюбленого"]
      : ["Полиця", "поки порожня", "для цього приводу тортів ще немає", "скоро тут"];
    // four cakes with clean cut-outs queue up beside the plinth, a different four each time
    const queue = fav ? cakes().filter((c) => whole(c) && !MaridayFavs.has(c.id)) : [];
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    const four = queue.slice(0, 4).map(pickHTML);
    const letters = [...w].map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join("");
    return `
      <div class="kt-empty fe${fav ? " fe--fav" : ""}">
        <h3 class="fe__title" aria-label="${w} ${s}"><span class="fe__w" aria-hidden="true">${letters}</span><span class="fe__s" aria-hidden="true">${s}</span></h3>
        <p class="fe__hand">${hand}</p>
        <div class="fe__floor${four.length ? "" : " is-solo"}">
          <div class="fe__queue fe__queue--l">${four.slice(0, 2).join("")}</div>
          <div class="fe__stage" aria-hidden="true">
            <span class="fe__beam"></span>
            <span class="fe__plinth"></span>
            <span class="fe__slot"><svg viewBox="0 0 160 150" fill="none"><path d="M80 17c1-7 6-12 14-13"/><circle cx="80" cy="25" r="8.5"/><rect x="42" y="38" width="76" height="44" rx="9"/><rect x="18" y="82" width="124" height="56" rx="10"/><path d="M80 123c-8-6-13-10-13-15a6 6 0 0 1 13-2 6 6 0 0 1 13 2c0 5-5 9-13 15z"/></svg></span>
            <span class="fe__tag"><span class="fe__paper" data-fe-tag>${tag}</span></span>
          </div>
          <div class="fe__queue fe__queue--r">${four.slice(2).join("")}</div>
        </div>
        <div class="fe__go">
          <a class="p-btn" href="cakes.html" data-kt-all><span>До каталогу</span></a>
          <a class="p-btn p-btn--ghost" href="constructor.html"><span>Зібрати свій торт</span></a>
        </div>
      </div>`;
  }

  // tap a queuing cake: it jumps onto the plinth, the dashed outline gives way, the tag says «зайнято»,
  // and only then does it go into favourites (the catalogue repaints and the cake drops onto a real shelf)
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fe-pick]");
    if (!b) return;
    const root = b.closest(".fe");
    if (root.classList.contains("is-landing")) return;
    root.classList.add("is-landing");
    b.classList.add("is-picked");
    const id = b.dataset.fePick;
    const go = () => {
      MaridayFavs.toggle(id);
      show(id, true);
    };
    const pic = b.querySelector("img");
    const slot = root.querySelector(".fe__slot");
    if (reduce() || !pic || !slot) return go();

    const [hx, hy] = centre(b.querySelector(".fe__chip"));
    burst(hx, hy, 6);
    const a = pic.getBoundingClientRect();
    const t = slot.getBoundingClientRect();
    const k = Math.min(t.width / a.width, t.height / a.height);
    const fly = pic.cloneNode();
    fly.className = "fe-fly";
    Object.assign(fly.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    document.body.appendChild(fly);
    pic.style.visibility = "hidden";
    // bottom-centre of the cake onto the bottom-centre of the outline
    const dx = t.left + t.width / 2 - (a.left + a.width / 2);
    const dy = t.bottom - a.bottom;
    const anim = fly.animate(
      [
        { transform: "none" },
        { transform: `translate(${dx * 0.5}px, ${Math.min(dy, 0) - 150}px) scale(${((1 + k) / 2).toFixed(3)}) rotate(${dx > 0 ? 10 : -10}deg)`, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(${k.toFixed(3)})` },
      ],
      { duration: 820, easing: "cubic-bezier(0.45, 0, 0.3, 1)", fill: "forwards" }
    );
    anim.onfinish = () => {
      root.classList.add("is-landed");
      const tag = root.querySelector("[data-fe-tag]");
      if (tag) tag.textContent = "зайнято ♥";
      const [px, py] = centre(slot);
      burst(px, py - t.height * 0.2, 9);
      setTimeout(() => {
        fly.remove();
        go();
      }, 750);
    };
  });

  const api = { show, hide, emptyHTML, here: null };
  window.MaridayFavNote = api;
})();
