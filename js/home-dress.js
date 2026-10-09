/* Mariday home — ⑭ occasion: one cake, eight parties.
   The stage is pinned; scrolling (or a chip, the dice, a tap on the cake) dresses the same cake for the next
   occasion: the old decorations pop off, the cake twirls, changes tiers and colours mid-spin, the new decorations
   pop on, a real cake's polaroid is swapped, and the occasion's name rolls through behind it. */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const hasLibs = !!(window.gsap && window.ScrollTrigger);
  const live = hasLibs && !!window.Lenis && !reduce;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const SPRINKLE_COLORS = ["#6d0809", "#f5bcc8", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff", "#9ed9b8"];

  // c: tier colours bottom → top, drip: glaze over the tiers (transparent = none), rim: cream scallops
  const OCCASIONS = [
    { word: "весілля", name: "Весілля", text: "Яруси, живі квіти й дегустація начинок перед замовленням. Вагу рахуємо за нормою 150–200 г на гостя.", tags: ["яруси", "живі квіти", "дегустація"], cta: "Весільні торти", href: "pages/cakes.html", img: "img/cakes/roses.jpg", tiers: 3, c: ["#fffaf3", "#fffaf3", "#fffaf3"], drip: "rgba(0,0,0,0)", rim: "#f5dde3", wash: "#fbeff0" },
    { word: "день народження", name: "День народження", text: "Напис, свічки й улюблена начинка іменинника — від бенто до двох ярусів.", tags: ["напис", "свічки", "від бенто до 2 ярусів"], cta: "Зібрати в конструкторі", href: "pages/constructor.html", img: "img/cakes/pink.jpg", tiers: 2, c: ["#f5bcc8", "#fffaf3", "#fffaf3"], drip: "#6d0809", rim: "#fffaf3", wash: "#fde3ea" },
    { word: "гендер-паті", name: "Гендер-паті", text: "Нейтральний декор зовні — і колір-сюрприз усередині. Дізнаєтесь із першим шматком.", tags: ["нейтральний декор", "колір усередині"], cta: "Зібрати в конструкторі", href: "pages/constructor.html", img: "img/cakes/donuts.jpg", tiers: 2, c: ["#fffaf3", "#eef0f3", "#fffaf3"], drip: "rgba(0,0,0,0)", rim: "#dfe3ea", wash: "#e8eef8" },
    { word: "хрестини", name: "Хрестини", text: "Світлі пастельні відтінки, ніжні квіти й спокійний, урочистий дизайн.", tags: ["пастель", "ніжні квіти"], cta: "Зібрати в конструкторі", href: "pages/constructor.html", img: "img/cakes/lilac.jpg", tiers: 2, c: ["#e7dcf3", "#fffaf3", "#fffaf3"], drip: "rgba(0,0,0,0)", rim: "#fffaf3", wash: "#efe8f7" },
    { word: "бебі-шауер", name: "Бебі-шауер", text: "Пастель, мінімалізм і бенто для гостей — легкий солодкий стіл без зайвого.", tags: ["мінімалізм", "бенто для гостей"], cta: "Подивитись бенто", href: "pages/bento.html", img: "img/cakes/cupcakes.jpg", tiers: 1, size: "s", c: ["#bcd6f3", "#fffaf3", "#fffaf3"], drip: "#ffffff", rim: "#ffffff", wash: "#e5f0fb" },
    { word: "річниця", name: "Річниця", text: "Бенто з вашою датою чи маленька копія весільного торта — для двох.", tags: ["ваша дата", "торт на двох"], cta: "Подивитись бенто", href: "pages/bento.html", img: "img/cakes/berries.jpg", tiers: 2, c: ["#c0142a", "#fffaf3", "#fffaf3"], drip: "#f5bcc8", rim: "#fffaf3", wash: "#fbe1e4" },
    { word: "корпоратив", name: "Корпоратив", text: "Логотип компанії, капкейки й candy bar на всю команду.", tags: ["логотип", "капкейки", "candy bar"], cta: "Candy bar", href: "pages/desserts.html", img: "img/cakes/gold.jpg", tiers: 1, c: ["#fbe6b8", "#fffaf3", "#fffaf3"], drip: "#6d0809", rim: "#fffaf3", wash: "#fdf1d8" },
    { word: "просто так", name: "Просто так", text: "Бенто з жартом чи компліментом — найкращий привід без приводу.", tags: ["жарт", "комплімент", "бенто"], cta: "Подивитись бенто", href: "pages/bento.html", img: "img/cakes/swirl.jpg", tiers: 1, size: "s", c: ["#dbefed", "#fffaf3", "#fffaf3"], drip: "#f5bcc8", rim: "#ffffff", wash: "#e3f4f1" },
  ];
  const N = OCCASIONS.length;

  function burst(host, x, y, count = 30, spread = 1) {
    if (!hasLibs || reduce) return;
    for (let i = 0; i < count; i++) {
      const sp = document.createElement("i");
      sp.className = "x-dress__spr";
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

  function init() {
    const sec = $(".x-dress");
    if (!sec) return;
    const pin = $(".x-dress__pin", sec);
    const cake = $("[data-dress-cake]", sec);
    const word = $("[data-dress-word]", sec);
    const photo = $(".x-dress__photo", sec);
    const img = $("[data-dress-img]", sec);
    const nEl = $("[data-dress-n]", sec);
    const nameEl = $("[data-dress-name]", sec);
    const textEl = $("[data-dress-text]", sec);
    const tagsEl = $("[data-dress-tags]", sec);
    const cta = $("[data-dress-cta]", sec);
    const chipsEl = $("[data-dress-chips]", sec);
    const dot = $(".x-dress__dot", chipsEl);
    const decos = $$(".x-dress__deco", cake);
    const animate = hasLibs && !reduce;

    // preload the photos so a swap never shows an empty frame
    OCCASIONS.forEach((o) => { const im = new Image(); im.src = o.img; });

    const chips = OCCASIONS.map((o, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = o.name;
      b.addEventListener("click", () => go(i));
      chipsEl.appendChild(b);
      return b;
    });

    let cur = -1;
    let tl = null;

    const groupsFor = (i) => decos.filter((d) => +d.dataset.for === i);
    const kids = (groups) => groups.flatMap((g) => [...g.children]);

    // everything about the cake that changes in the middle of the twirl
    const dressUp = (o, i) => {
      cake.style.setProperty("--c1", o.c[0]);
      cake.style.setProperty("--c2", o.c[1]);
      cake.style.setProperty("--c3", o.c[2]);
      cake.style.setProperty("--drip", o.drip);
      cake.style.setProperty("--rim", o.rim);
      cake.dataset.tiers = o.tiers;
      if (o.size) cake.dataset.size = o.size;
      else delete cake.dataset.size;
      decos.forEach((d) => d.classList.toggle("is-on", +d.dataset.for === i));
    };

    const moveDot = (i) => {
      const b = chips[i];
      const x = b.offsetLeft + b.offsetWidth / 2;
      if (animate) gsap.to(dot, { x, duration: 0.6, ease: "elastic.out(1, 0.6)" });
      else dot.style.transform = `translateX(${x}px)`;
      // keep the current chip in view when the row scrolls (phones)
      const left = b.offsetLeft - (chipsEl.clientWidth - b.offsetWidth) / 2;
      chipsEl.scrollTo({ left, behavior: animate ? "smooth" : "auto" });
    };

    const writeInfo = (o, i) => {
      nEl.textContent = pad(i + 1);
      nameEl.innerHTML = "";
      o.name.split(" ").forEach((w, k) => {
        if (k) nameEl.appendChild(document.createTextNode(" "));
        const s = document.createElement("span");
        s.className = "w";
        s.textContent = w;
        nameEl.appendChild(s);
      });
      textEl.textContent = o.text;
      tagsEl.innerHTML = "";
      o.tags.forEach((t) => { const li = document.createElement("li"); li.textContent = t; tagsEl.appendChild(li); });
      cta.href = o.href;
      $("span", cta).textContent = o.cta;
      word.textContent = o.word;
      chips.forEach((c, k) => c.setAttribute("aria-current", String(k === i)));
      sec.style.setProperty("--wash", o.wash);
    };

    function set(i, dir = 1) {
      if (i === cur) return;
      const o = OCCASIONS[i];
      const prev = cur;
      cur = i;
      moveDot(i);
      if (!animate || prev < 0) {
        dressUp(o, i);
        writeInfo(o, i);
        img.src = o.img;
        return;
      }
      if (tl) tl.progress(1).kill();
      const old = kids(groupsFor(prev));
      const fresh = kids(groupsFor(i));
      const stage = $(".x-dress__stage", sec);
      const sb = stage.getBoundingClientRect(), cb = cake.getBoundingClientRect();
      tl = gsap.timeline();

      // the old outfit pops off, the cake twirls, and halfway round it is wearing the new one
      tl.to(old, { scale: 0, opacity: 0, y: -20, duration: 0.25, stagger: 0.02, ease: "back.in(2)" }, 0)
        .to(cake, { scaleX: 0.04, rotation: dir * 4, duration: 0.24, ease: "power2.in" }, 0.12)
        .call(() => {
          dressUp(o, i);
          burst(stage, cb.left - sb.left + cb.width / 2, cb.top - sb.top + cb.height * 0.6, 26, 0.9);
        })
        .to(cake, { scaleX: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.45)" })
        .fromTo(fresh, { scale: 0, opacity: 0, y: -40 }, { scale: 1, opacity: 1, y: 0, duration: 0.75, stagger: 0.06, ease: "back.out(2.6)" }, "-=0.55");

      // the occasion's name rolls through behind the cake
      tl.to(word, { yPercent: -110 * dir, opacity: 0, duration: 0.3, ease: "power2.in" }, 0)
        .call(() => { word.textContent = o.word; }, null, 0.3)
        .fromTo(word, { yPercent: 110 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: "expo.out" }, 0.3);

      // the polaroid of the last cake is flicked away, the new one drops on top
      const ghost = photo.cloneNode(true);
      ghost.classList.add("x-dress__photo--fly");
      photo.after(ghost);
      img.src = o.img;
      tl.to(ghost, { x: 140 * dir, y: -60, rotation: 40 * dir, opacity: 0, duration: 0.6, ease: "power2.in", onComplete: () => ghost.remove() }, 0)
        .fromTo(photo, { y: -220, rotation: -25 * dir, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.9, ease: "back.out(1.5)" }, 0.2);

      // the info panel: number, name word by word, text, tags
      tl.to([nEl, nameEl, textEl, tagsEl], { opacity: 0, y: -10, duration: 0.18, ease: "power1.in" }, 0)
        .call(() => {
          writeInfo(o, i);
          gsap.set([nameEl, tagsEl], { opacity: 1, y: 0 });
          gsap.fromTo($$(".w", nameEl), { yPercent: 90, opacity: 0, rotation: 6 }, { yPercent: 0, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.06, ease: "back.out(2)" });
          gsap.fromTo([...tagsEl.children], { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.07, delay: 0.18, ease: "back.out(3)" });
        }, null, 0.2)
        .fromTo(nEl, { yPercent: 60 * dir, opacity: 0, y: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" }, 0.22)
        .fromTo(textEl, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" }, 0.35);
    }

    // scroll position of occasion i inside the pin
    let st = null;
    const posOf = (i) => st.start + (st.end - st.start) * (i / (N - 1)) + 2;
    function go(i) {
      i = ((i % N) + N) % N;
      if (st) {
        const y = posOf(i);
        if (window.marLenis) window.marLenis.scrollTo(y, { duration: 1.1 });
        else scrollTo({ top: y, behavior: "smooth" });
      } else {
        set(i, i > cur ? 1 : -1);
      }
    }
    cake.addEventListener("click", () => go(cur + 1));
    $("[data-dress-lucky]", sec).addEventListener("click", () => {
      let k = cur;
      while (k === cur) k = Math.floor(Math.random() * N);
      go(k);
    });

    set(0);
    addEventListener("resize", () => moveDot(cur));
    document.fonts?.ready.then(() => moveDot(cur));
    if (!live) return;

    sec.classList.add("is-live");
    // the decorations of every other occasion start hidden, so they can pop on later
    decos.forEach((d) => { if (+d.dataset.for !== 0) gsap.set([...d.children], { scale: 0, opacity: 0 }); });

    st = ScrollTrigger.create({
      trigger: sec,
      start: "top top",
      end: () => "+=" + innerHeight * 0.75 * (N - 1),
      pin,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const i = Math.min(N - 1, Math.round(self.progress * (N - 1)));
        if (i !== cur) set(i, self.direction);
      },
    });

    // the title is served when the stage scrolls in
    gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 70%", once: true } })
      .from(".x-dress__w1", { yPercent: 40, opacity: 0, duration: 1, ease: "expo.out" })
      .from(".x-dress__script", { scale: 0.4, rotation: -30, opacity: 0, duration: 1, ease: "back.out(2)" }, 0.3)
      .from(cake, { y: 120, scale: 0.8, opacity: 0, duration: 1.1, ease: "back.out(1.4)" }, 0.2)
      .from(photo, { y: -200, rotation: -30, opacity: 0, duration: 1, ease: "back.out(1.5)" }, 0.5)
      .from(chips, { y: 20, opacity: 0, duration: 0.5, stagger: 0.04, ease: "back.out(2)" }, 0.6);

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  MARIDAY.onReady(init);
})();
