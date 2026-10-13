/* Mariday home — ⑮ reviews: what guests say.
   Two endless rows of review cards drift past each other in opposite directions. Scrolling the page pushes them along
   (or back), a hover stops a row, and a row can be dragged, swiped or scrolled sideways with a trackpad — it glides
   on with the throw. A card opens the whole review in a little window. Nothing is pinned: the page scrolls straight on.
   Cards come in three kinds: a quote, a photo of the cake, and a short review written big. Reviews are written on
   pages/reviews.html; the one just written lands first in the top row, tagged "новий ♥" (store: js/reviews.js). */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const hasLibs = !!window.gsap;
  const animate = !reduce;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SPEED = 26; // px/s each row drifts on its own
  const SPRINKLE_COLORS = ["#6d0809", "#f5bcc8", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff", "#9ed9b8"];
  const CHERRY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="st" d="M12.5 3.2c-1.2 4.4-3.6 7.3-6.4 9.4M12.5 3.2c.4 4.5 1.9 7.8 4.6 9.8M12.5 3.2c1.6-1 3.6-1 5.2.1"/><circle cx="6.4" cy="16.4" r="4.4"/><circle cx="17.2" cy="17" r="4.4"/></svg>';
  const cherries = (n) => Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? "on" : ""}">${CHERRY}</i>`).join("");
  const plural = (n, f) => { const a = n % 10, b = n % 100; return f[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 1 : 2]; };
  const initials = (name) => name.split(/\s+/).map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();

  function burst(host, x, y, count = 28) {
    if (!hasLibs || reduce) return;
    for (let i = 0; i < count; i++) {
      const sp = document.createElement("i");
      sp.style.cssText = `position:absolute;z-index:30;left:${x}px;top:${y}px;width:6px;height:15px;margin:-7px 0 0 -3px;border-radius:3px;pointer-events:none;background:${SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]}`;
      host.appendChild(sp);
      const a = Math.random() * Math.PI * 2, d = gsap.utils.random(70, 200);
      gsap.fromTo(sp, { x: 0, y: 0, rotation: gsap.utils.random(0, 180) }, { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.7 + 60, rotation: "+=" + gsap.utils.random(-300, 300), opacity: 0, duration: gsap.utils.random(0.9, 1.4), ease: "power2.out", onComplete: () => sp.remove() });
    }
  }

  // ─── cards (static structure from a template; anything a guest typed is set with textContent only) ───
  // a short review is written big; every third longer one with a real photo shows the cake; the rest are quotes
  // (a photo drawn by lot — `auto` — never becomes the picture of someone's review)
  const kindOf = (r, m, k) => (r.text.length <= 125 ? "big" : k % 3 === 1 && !m.auto ? "photo" : "quote");
  function reviewCard(r, m, k, fresh) {
    const kind = kindOf(r, m, k);
    const el = document.createElement("article");
    el.className = `x-gc x-gc--${kind} x-gc--${r.color}${fresh ? " is-fresh" : ""}`;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Відгук від ${r.name} — відкрити повністю`);
    const occ = m.occasion ? '<span class="x-gc__occ"></span>' : "";
    const rate = `<span class="x-gc__rate" role="img" aria-label="Оцінка ${r.rating} з 5">${cherries(r.rating)}</span>`;
    const who = kind === "quote" && !m.auto
      ? '<footer class="x-gc__who"><img class="x-gc__pic" alt="" loading="lazy" draggable="false"><span class="x-gc__by"><b class="x-gc__name"></b><small class="x-gc__meta"></small></span></footer>'
      : `<footer class="x-gc__who"><span class="x-gc__ava" aria-hidden="true">${initials(r.name)}</span><span class="x-gc__by"><b class="x-gc__name"></b><small class="x-gc__meta"></small></span></footer>`;
    el.innerHTML = kind === "photo"
      ? `<span class="x-gc__ph"><img alt="" loading="lazy" draggable="false">${occ}${rate}</span><p class="x-gc__text"></p>${who}`
      : `<div class="x-gc__top">${rate}${occ}</div><p class="x-gc__text"></p>${who}`;
    $(".x-gc__text", el).textContent = r.text;
    $(".x-gc__name", el).textContent = r.name;
    $(".x-gc__meta", el).textContent = [r.city, r.product].filter(Boolean).join(" · ");
    if (m.occasion) $(".x-gc__occ", el).textContent = m.occasion;
    const img = $(".x-gc__ph img, .x-gc__pic", el);
    if (img) img.src = m.photo;
    if (fresh || m.mine) {
      const tag = document.createElement("span");
      tag.className = "x-gc__mine";
      tag.textContent = fresh ? "новий ♥" : "ваш ♥";
      el.prepend(tag);
    }
    return el;
  }
  const ctaCard = () => {
    const el = document.createElement("a");
    el.className = "x-gc x-gc--cta";
    el.href = "pages/reviews.html#leave";
    el.innerHTML = '<span class="x-gc__ask">а ваш<br>відгук?</span><span class="x-gc__hint">Розкажіть, як смакувало, — він одразу з’явиться тут ♥</span><span class="x-gc__go">Написати →</span>';
    return el;
  };

  function init() {
    const sec = $(".x-post");
    const R = window.MaridayReviews;
    if (!sec || !R) return;
    const score = $("[data-post-score]", sec);
    const box = $("#x-rvbox");
    const lenis = () => window.marLenis;
    const rows = $$("[data-post-row]", sec).map((el, k) => ({ el, track: $(".x-post__track", el), dir: k ? 1 : -1, x: 0, half: 0, v: 0, hs: 1, hover: false, hold: 0, n: 0 }));
    let list = [];

    /* ─── the whole review in a little window ─── */
    function openReview(i) {
      const r = list[i];
      if (!r || !box) return;
      const m = R.meta(r);
      $("[data-rvbox-ph]", box).src = m.auto ? "" : m.photo;
      $("[data-rvbox-ph]", box).hidden = m.auto;
      $("[data-rvbox-rate]", box).innerHTML = cherries(r.rating);
      $("[data-rvbox-rate]", box).setAttribute("aria-label", `Оцінка ${r.rating} з 5`);
      $("[data-rvbox-occ]", box).textContent = m.occasion;
      $("[data-rvbox-occ]", box).hidden = !m.occasion;
      $("[data-rvbox-text]", box).textContent = r.text;
      $("[data-rvbox-name]", box).textContent = r.name;
      $("[data-rvbox-meta]", box).textContent = [r.city, r.product, m.date].filter(Boolean).join(" · ");
      box.className = `x-rvbox x-gc--${r.color}${m.auto ? " x-rvbox--text" : ""}`;
      box.showModal();
      lenis()?.stop();
      if (hasLibs && !reduce) gsap.fromTo($(".x-rvbox__in", box), { y: 60, rotation: -3, scale: 0.94, opacity: 0 }, { y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.7, ease: "expo.out" });
    }
    if (box) {
      $("[data-rvbox-close]", box).addEventListener("click", () => box.close());
      box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
      box.addEventListener("close", () => lenis()?.start());
    }

    /* ─── laying out the rows: the reviews alternate between them, then each row is repeated for the loop ─── */
    function measure() {
      rows.forEach((row) => {
        const kids = row.track.children;
        row.half = row.n && kids.length > row.n ? kids[row.n].offsetLeft - kids[0].offsetLeft : 0;
      });
    }
    function build(fresh) {
      const s = R.stats(list);
      score.innerHTML = `<b>${s.avg.toFixed(1)}</b><span class="x-post__rate" role="img" aria-label="Середня оцінка ${s.avg.toFixed(1)} з 5">${cherries(Math.round(s.avg))}</span><small>${s.count} ${plural(s.count, ["відгук", "відгуки", "відгуків"])}</small>`;
      // the review just written goes first in the top row
      const order = list.map((r, i) => i);
      const fi = fresh ? list.findIndex((r) => r.id === fresh) : -1;
      if (fi > 0) order.unshift(...order.splice(fi, 1));
      const parts = [[], []];
      order.forEach((i, k) => parts[k % 2].push(i));
      rows.forEach((row, k) => {
        row.track.innerHTML = "";
        const own = parts[k].map((i, j) => {
          const c = reviewCard(list[i], R.meta(list[i]), j * 2 + k, i === fi);
          c.dataset.i = i;
          return c;
        });
        // one invitation to write in the lower row
        if (k === 1) own.splice(Math.min(3, own.length), 0, ctaCard());
        own.forEach((c) => row.track.appendChild(c));
        row.n = own.length;
        row.x = 0;
        if (!animate) return;
        // copies of the row follow it, so it never runs out; they are only there to be seen
        const reps = Math.max(1, Math.ceil(innerWidth / Math.max(1, row.track.scrollWidth)) + 1);
        for (let r = 0; r < reps; r++) own.forEach((c) => {
          const cl = c.cloneNode(true);
          cl.setAttribute("aria-hidden", "true");
          cl.tabIndex = -1;
          cl.removeAttribute("role");
          row.track.appendChild(cl);
        });
      });
      measure();
      if (fi >= 0) {
        rows[0].hold = 5; // the top row waits a moment, so the new review can be read
        requestAnimationFrame(() => {
          const c = $(".x-gc.is-fresh", rows[0].track);
          if (!c) return;
          const sb = sec.getBoundingClientRect(), cb = c.getBoundingClientRect();
          if (hasLibs && !reduce) gsap.from(c, { y: -60, rotation: -6, scale: 0.85, duration: 1, ease: "back.out(1.8)", clearProps: "transform" });
          setTimeout(() => burst(sec, cb.left - sb.left + cb.width / 2, cb.top - sb.top + 30), 350);
        });
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    // clicks, Enter or Space on a card open it (copies included); a drag never counts as a click
    let dragged = false;
    sec.addEventListener("click", (e) => {
      if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; return; }
      const c = e.target.closest(".x-gc[data-i]");
      if (c) openReview(+c.dataset.i);
    }, true);
    sec.addEventListener("keydown", (e) => {
      const c = e.target.closest?.(".x-gc[data-i]");
      if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openReview(+c.dataset.i); }
    });

    const fresh = R.takeFresh();
    R.load().then((l) => {
      list = l;
      build(fresh);
      // arriving from the reviews page ("see it on the home page"): bring the section into view
      if (fresh && location.hash === "#reviews") {
        const go = () => (lenis() ? lenis().scrollTo(sec, { offset: -30, duration: 1.4 }) : sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));
        if (document.readyState === "complete") setTimeout(go, 600);
        else addEventListener("load", () => setTimeout(go, 600), { once: true });
      }
    });
    document.addEventListener("mariday:review", async (e) => { list = await R.load(); build(e.detail?.id); });
    if (!animate) { sec.classList.add("is-static"); return; }

    /* ─── motion: drift, scroll push, hover stop, drag and throw, trackpad ─── */
    let onScreen = false, last = performance.now();
    if (window.IntersectionObserver) new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; last = performance.now(); }, { rootMargin: "80px 0px" }).observe(sec);
    else onScreen = true;
    const loop = () => {
      requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!onScreen) return;
      const v = (lenis() && lenis().velocity) || 0;
      rows.forEach((row) => {
        if (!row.half) return;
        if (row.hold > 0) row.hold -= dt;
        row.hs += ((row.hover || row.hold > 0 ? 0 : 1) - row.hs) * Math.min(1, dt * 4);
        if (!row.drag) {
          row.x += (row.dir * SPEED * row.hs + row.dir * clamp(v, -60, 60) * 9) * dt + row.v * dt;
          row.v *= Math.max(0, 1 - dt * 2.6);
        }
        row.x = (((row.x % row.half) - row.half) % row.half);
        row.track.style.transform = `translate3d(${row.x.toFixed(1)}px, 0, 0)`;
      });
    };
    requestAnimationFrame(loop);
    addEventListener("resize", measure);
    document.fonts?.ready.then(measure);

    rows.forEach((row) => {
      const el = row.el;
      el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") row.hover = true; });
      el.addEventListener("pointerleave", () => { row.hover = false; });
      // keyboard: a focused card stops its row and is brought into view
      el.addEventListener("focusin", (e) => {
        row.hover = true;
        const c = e.target.closest(".x-gc");
        if (c && row.half) row.x = -(c.offsetLeft - parseFloat(getComputedStyle(row.track).paddingLeft || 0));
      });
      el.addEventListener("focusout", () => { row.hover = false; });
      // drag: the row follows the hand (sideways only — a vertical swipe still scrolls the page), then glides on
      let p = null;
      el.addEventListener("pointerdown", (e) => {
        if (e.button) return;
        p = { id: e.pointerId, x0: e.clientX, y0: e.clientY, rx: row.x, lx: e.clientX, t: performance.now(), vx: 0, on: false };
        dragged = false;
      });
      el.addEventListener("pointermove", (e) => {
        if (!p || e.pointerId !== p.id) return;
        const dx = e.clientX - p.x0, dy = e.clientY - p.y0;
        if (!p.on) {
          if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
          p.on = true;
          dragged = true;
          row.drag = true;
          row.v = 0;
          el.classList.add("is-drag");
          try { el.setPointerCapture(p.id); } catch (_) { /* pointer gone */ }
        }
        const now = performance.now();
        p.vx = p.vx * 0.6 + ((e.clientX - p.lx) / Math.max(1, now - p.t)) * 1000 * 0.4;
        p.lx = e.clientX;
        p.t = now;
        row.x = p.rx + dx;
      });
      const up = (e) => {
        if (!p || (e && e.pointerId !== p.id)) return;
        if (p.on) {
          row.v = clamp(p.vx, -2600, 2600);
          // the click that follows a drag is swallowed above; if none comes (a touch swipe), forget the drag anyway
          setTimeout(() => { dragged = false; }, 0);
        }
        p = null;
        row.drag = false;
        el.classList.remove("is-drag");
      };
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
      el.addEventListener("lostpointercapture", up);
      // a sideways trackpad swipe moves the row (and keeps the browser from going back a page, and Lenis out of it)
      el.addEventListener("wheel", (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        e.stopPropagation();
        row.x -= e.deltaX;
        row.v = 0;
      }, { passive: false });
    });

    // the title is served, then the rows slide in from either side
    if (window.ScrollTrigger && hasLibs) {
      gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 88%", once: true } })
        .from(".x-post__w1", { yPercent: 40, opacity: 0, duration: 0.7, ease: "expo.out" })
        .from(".x-post__script", { scale: 0.4, rotation: -30, opacity: 0, duration: 0.6, ease: "back.out(2)" }, 0.15)
        .from(".x-post__side > *", { y: 24, opacity: 0, duration: 0.5, stagger: 0.06, ease: "back.out(2)" }, 0.2)
        .from(rows.map((r) => r.el), { xPercent: (i) => (i ? -14 : 14), opacity: 0, duration: 0.9, stagger: 0.08, ease: "expo.out" }, 0.1);
    }
  }

  MARIDAY.onReady(init);
})();
