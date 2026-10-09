/* Mariday home — ⑮ reviews: guest mail.
   The desk is pinned. As you scroll, postcards slide out of a big envelope one by one, fly up and land on the pile,
   each stamped with a thump as it lands; older cards sink into the pile. The last card invites you to write your own.
   Reviews, postcards and the composer come from js/reviews.js (window.MaridayReviews). */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const hasLibs = !!(window.gsap && window.ScrollTrigger);
  const live = hasLibs && !!window.Lenis && !reduce;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SPRINKLE_COLORS = ["#6d0809", "#f5bcc8", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff", "#9ed9b8"];
  const SHOW = 7;
  const CHERRY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="st" d="M12.5 3.2c-1.2 4.4-3.6 7.3-6.4 9.4M12.5 3.2c.4 4.5 1.9 7.8 4.6 9.8M12.5 3.2c1.6-1 3.6-1 5.2.1"/><circle cx="6.4" cy="16.4" r="4.4"/><circle cx="17.2" cy="17" r="4.4"/></svg>';
  const plural = (n, f) => { const a = n % 10, b = n % 100; return f[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 1 : 2]; };

  function burst(host, x, y, count = 20, spread = 0.7) {
    if (!hasLibs || reduce) return;
    for (let i = 0; i < count; i++) {
      const sp = document.createElement("i");
      sp.style.cssText = `position:absolute;z-index:60;left:${x}px;top:${y}px;width:6px;height:15px;margin:-7px 0 0 -3px;border-radius:3px;pointer-events:none;background:${SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]}`;
      host.appendChild(sp);
      const a = Math.random() * Math.PI * 2;
      const d = gsap.utils.random(60, 180) * spread;
      gsap.fromTo(sp, { x: 0, y: 0, rotation: gsap.utils.random(0, 180) }, { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.7 + 60, rotation: "+=" + gsap.utils.random(-300, 300), opacity: 0, duration: gsap.utils.random(0.8, 1.3), ease: "power2.out", onComplete: () => sp.remove() });
    }
  }

  function toast(msg) {
    let t = $(".x-rvtoast");
    if (!t) {
      t = document.createElement("p");
      t.className = "x-rvtoast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove("is-on"), 3600);
  }

  // the wax seal with the average score (structure is static; numbers come from the review store)
  function seal(host, s) {
    const label = `${s.count} ${plural(s.count, ["листівка", "листівки", "листівок"])}`;
    let bumps = "";
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      bumps += `<circle cx="${(100 + Math.cos(a) * 86).toFixed(1)}" cy="${(100 + Math.sin(a) * 86).toFixed(1)}" r="11"/>`;
    }
    const n = Math.round(s.avg);
    host.setAttribute("aria-label", `Середня оцінка ${s.avg.toFixed(1)} з 5, ${label}`);
    host.innerHTML = `
      <svg class="x-rvseal__bg" viewBox="0 0 200 200" aria-hidden="true"><g>${bumps}<circle cx="100" cy="100" r="88"/></g></svg>
      <svg class="x-rvseal__ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="xpost-seal" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0"/></defs>
        <text textLength="436" lengthAdjust="spacing"><textPath href="#xpost-seal">ПОШТА ВІД ГОСТЕЙ ✦ ${label.toUpperCase()} ✦ ALKMAAR ✦</textPath></text></svg>
      <span class="x-rvseal__core" aria-hidden="true"><b>${s.avg.toFixed(1)}</b><small>середня</small><span class="x-rvseal__rate">${Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? "on" : ""}">${CHERRY}</i>`).join("")}</span></span>`;
  }

  async function init() {
    const sec = $(".x-post");
    const R = window.MaridayReviews;
    if (!sec || !R) return;
    const pin = $(".x-post__pin", sec);
    const desk = $("[data-post-desk]", sec);
    const pile = $("[data-post-pile]", sec);
    const env = $(".x-post__env", sec);
    const nEl = $("[data-post-n]", sec);
    const totalEl = $("[data-post-total]", sec);
    const dlg = $("#x-mail");

    let cards = [];
    let n = 0;
    let p = 0; // 0 = everything in the envelope, k = k cards on the pile
    let landed = 0;
    let st = null;

    /* the composer lives in a dialog */
    const lenis = () => window.marLenis;
    function openMail() {
      if (!dlg) return;
      dlg.showModal();
      lenis()?.stop();
      if (hasLibs && !reduce) gsap.fromTo($(".x-mail__box", dlg), { y: 80, rotation: -4, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "expo.out" });
    }
    $("[data-post-write]", sec).addEventListener("click", openMail);
    if (dlg) {
      $$("[data-mail-close]", dlg).forEach((b) => b.addEventListener("click", () => dlg.close()));
      dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener("close", () => lenis()?.start());
      R.composer($("[data-composer]", dlg), {
        onSent: () => {
          dlg.close();
          toast("Дякуємо! Ваша листівка вже на столі ♥");
          // jump back to where the first card lands, so the new postcard flies out of the envelope first
          setTimeout(() => { if (st) goTo(1); }, 300);
        },
      });
    }

    const ctaCard = () => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "x-pc x-pc--cta";
      b.innerHTML = '<span class="x-pc__ctaq">Ваша листівка — наступна?</span><span class="x-pc__ctago">✎ Написати</span><span class="x-pc__stamp"><img src="img/ig-profile.jpg" alt="" loading="lazy"></span>';
      b.addEventListener("click", openMail);
      return b;
    };

    // each card's place on the pile: a little off-centre and tilted, so the pile looks hand-made
    const spot = (k) => ({ x: (((k * 37) % 9) - 4) * 5, r: (((k * 53) % 11) - 5) * 1.3 });

    function build(list) {
      pile.innerHTML = "";
      cards = list.slice(0, SHOW).map((r) => R.card(r, { clamp: true }));
      cards.push(ctaCard());
      cards = cards.map((c, k) => {
        const w = document.createElement("div");
        w.className = "x-post__card";
        w.appendChild(c);
        // the topmost card in the DOM sits on top until the script stacks them
        w.style.zIndex = 10 + k;
        pile.appendChild(w);
        return w;
      });
      n = cards.length;
      totalEl.textContent = pad(n);
      seal($("[data-post-seal]", sec), R.stats(list));
      // a click on a card turns it over (but never on the "write" card)
      cards.forEach((w) => {
        const pc = $(".x-pc", w);
        const btn = $(".x-pc__flip", w);
        if (!btn) return;
        pc.addEventListener("click", (e) => {
          if (e.target.closest("a")) return;
          btn.setAttribute("aria-pressed", String(pc.classList.toggle("is-flipped")));
        });
      });
      landed = 0;
      render();
    }

    // where every card is at progress p: in the envelope, rising out of it, flying to the pile, or sinking into it
    function render() {
      if (!live) {
        nEl.textContent = pad(1);
        return;
      }
      const D = desk.getBoundingClientRect();
      const E = env.getBoundingClientRect();
      // card tops (cards scale from their top edge): tucked into the envelope, and fully out above it
      cards.forEach((w, k) => {
        const ch = w.offsetHeight || 200;
        const inY = E.top - D.top + E.height - ch * 0.84 - 8;
        const outY = E.top - D.top - ch * 0.92;
        const t = clamp(p - k, 0, 1);
        const s = spot(k);
        let x = 0, y = inY, sc = 0.84, r = 0, z = 2, o = k < Math.floor(p) + 1.001 ? 1 : 0; // only the next card waits in the envelope
        if (t > 0 && t <= 0.42) {
          const u = gsap.parseEase("power2.out")(t / 0.42);
          y = inY + (outY - inY) * u;
          sc = 0.84 + 0.06 * u;
          r = Math.sin(u * Math.PI) * -4;
          z = u > 0.6 ? 40 + k : 2;
        } else if (t > 0.42) {
          const u = gsap.parseEase("power3.inOut")((t - 0.42) / 0.58);
          x = s.x * u;
          y = outY + (0 - outY) * u - Math.sin(u * Math.PI) * 40;
          sc = 0.9 + 0.1 * u;
          r = s.r * u + Math.sin(u * Math.PI) * 10 * (k % 2 ? 1 : -1);
          z = 40 + k;
        }
        // cards that already landed sink into the pile as newer ones arrive on top
        const depth = Math.max(0, p - (k + 1));
        if (depth > 0) {
          y += Math.min(depth, 4) * 9;
          sc *= 1 - Math.min(depth, 4) * 0.035;
          r += Math.min(depth, 4) * (k % 2 ? 1.6 : -1.6);
          o = clamp(4.5 - depth, 0, 1);
        }
        w.style.zIndex = z;
        w.style.opacity = o;
        w.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
        w.style.visibility = o ? "visible" : "hidden";
        w.classList.toggle("is-waiting", t < 1);
        $(".x-pc", w)?.setAttribute("tabindex", depth < 1 && t >= 1 ? "0" : "-1");
      });
      // a card that just landed is stamped
      const nowLanded = clamp(Math.floor(p + 0.001), 0, n);
      if (nowLanded > landed) {
        const w = cards[nowLanded - 1];
        const pm = $(".x-pc__pm", w);
        if (pm) gsap.fromTo(pm, { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 0.55, duration: 0.35, ease: "power4.in", clearProps: "scale,opacity" });
        gsap.fromTo($(".x-pc", w), { scale: 1.05 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)", clearProps: "transform" });
        const b = w.getBoundingClientRect(), h = pin.getBoundingClientRect();
        burst(pin, b.left - h.left + b.width * 0.75, b.top - h.top + b.height * 0.35, 16, 0.6);
      }
      landed = nowLanded;
      nEl.textContent = pad(clamp(Math.round(p), 1, n));
    }

    // p for a scroll position: the first card comes out while the section scrolls in, the rest while it is pinned
    const pAt = (y) => {
      if (!st) return 0;
      const pre = st.start - innerHeight * 0.55;
      if (y < st.start) return clamp((y - pre) / (st.start - pre), 0, 1);
      return 1 + clamp((y - st.start) / (st.end - st.start), 0, 1) * (n - 1);
    };
    const yOf = (pv) => st.start + ((pv - 1) / (n - 1)) * (st.end - st.start) + 2;
    function goTo(pv) {
      pv = clamp(Math.round(pv), 1, n);
      if (!st) return;
      const y = yOf(pv);
      if (lenis()) lenis().scrollTo(y, { duration: 1.2 });
      else scrollTo({ top: y, behavior: "smooth" });
    }
    $$("[data-post-go]", sec).forEach((b) => b.addEventListener("click", () => {
      if (!st) {
        pile.scrollBy({ left: +b.dataset.postGo * (cards[0]?.offsetWidth || 300), behavior: reduce ? "auto" : "smooth" });
        return;
      }
      goTo(Math.round(p) + +b.dataset.postGo);
    }));
    desk.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      $(`[data-post-go="${d}"]`, sec).click();
    });

    build(await R.load());
    document.addEventListener("mariday:review", async () => build(await R.load()));
    if (!live) return;

    sec.classList.add("is-live");
    const state = { p: 0 };
    const pTo = gsap.quickTo(state, "p", { duration: 0.6, ease: "power3.out", onUpdate: () => { p = state.p; render(); } });
    st = ScrollTrigger.create({
      trigger: sec,
      start: "top top",
      end: () => "+=" + innerHeight * 0.6 * Math.max(1, n - 1),
      pin,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: () => render(),
    });
    ScrollTrigger.create({ trigger: sec, start: "top bottom", end: () => st.end + 1, onUpdate: () => pTo(pAt(scrollY)), onRefresh: () => pTo(pAt(scrollY)) });

    // the title is served and the seal is pressed when the desk scrolls in
    gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 70%", once: true } })
      .from(".x-post__w1", { yPercent: 40, opacity: 0, duration: 1, ease: "expo.out" })
      .from(".x-post__script", { scale: 0.4, rotation: -30, opacity: 0, duration: 1, ease: "back.out(2)" }, 0.3)
      .from(".x-post__seal", { scale: 2.6, opacity: 0, rotation: -60, duration: 0.45, ease: "power4.in" }, 0.6)
      .from(".x-post__env-flap", { scaleY: 0, transformOrigin: "50% 100%", duration: 0.7, ease: "back.out(2)" }, 0.4);

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  MARIDAY.onReady(init);
})();
