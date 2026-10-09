/* Cake meter: a tiny cake in the corner gains one layer per section scrolled; the final CTA drops the cherry on top */
(function () {
  const LAYERS = [
    { sel: ".x-cut", id: "inside", label: "що всередині", kind: "sponge" },
    { sel: ".x-drop", id: "manifesto", label: "маніфест", kind: "cream" },
    { sel: ".x-h", id: "collection", label: "колекція", kind: "berry" },
    { sel: ".x-order", id: "x-order", label: "меню", kind: "choco" },
    { sel: ".x-board", id: "occasion", label: "для якого свята", kind: "cream" },
    { sel: ".x-reviews", id: "reviews", label: "відгуки", kind: "glaze" },
  ];
  const FINAL = { sel: ".x-cta", id: "order-now", label: "замовити" };

  function init() {
    const items = LAYERS.map((l) => ({ ...l, sec: document.querySelector(l.sel) })).filter((l) => l.sec);
    const finalSec = document.querySelector(FINAL.sel);
    if (!items.length) return;
    [...items, { ...FINAL, sec: finalSec }].forEach((l) => { if (l.sec && !l.sec.id) l.sec.id = l.id; });

    const meter = document.createElement("nav");
    meter.className = "x-meter";
    meter.setAttribute("aria-label", "Ваш торт: навігація по сторінці");
    meter.innerHTML = `
      <div class="x-meter__cake">
        ${finalSec ? `<a class="x-meter__cherry" href="#${finalSec.id}" aria-label="Перейти: ${FINAL.label}"><img src="img/cakes/cherries.png" alt=""></a>` : ""}
        <div class="x-meter__stack">
          ${items.map((l) => `<a class="x-meter__l x-meter__l--${l.kind}" href="#${l.sec.id}"><span>${l.label}</span></a>`).join("")}
        </div>
        <i class="x-meter__plate" aria-hidden="true"></i>
      </div>
      <p class="x-meter__cap" aria-live="polite"></p>`;
    document.body.appendChild(meter);

    const layers = [...meter.querySelectorAll(".x-meter__l")];
    const cap = meter.querySelector(".x-meter__cap");
    let shown = -1;
    let done = null;

    function update() {
      const line = innerHeight * 0.6;
      const n = items.filter((l) => l.sec.getBoundingClientRect().top < line).length;
      const fin = !!finalSec && finalSec.getBoundingClientRect().top < line;
      if (n === shown && fin === done) return;
      shown = n;
      done = fin;
      layers.forEach((el, i) => el.classList.toggle("is-on", i < n));
      meter.classList.toggle("is-visible", n > 0 || scrollY > innerHeight * 0.45);
      meter.classList.toggle("is-done", fin);
      cap.textContent = fin ? "готово ♥" : `ваш торт · ${n}/${items.length}`;
    }

    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    update();
  }

  MARIDAY.onReady(init);
})();
