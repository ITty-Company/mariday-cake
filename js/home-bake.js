/* Mariday home — ⑲ final CTA: bake your own cake.
   The oven preheats as the section scrolls in (knobs turn, the display counts to 180°). Hold the button (mouse,
   touch, Space or Enter) and it bakes: the batter rises and turns golden, the oven glows and rumbles, the timer runs
   down. Let go early and the cake sinks back. When it is done the bell rings, the door drops open, the cake rides out
   onto the plate, the icing and a cherry land on it — and the real "build a cake" button appears. */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const hasLibs = !!(window.gsap && window.ScrollTrigger);
  const animate = hasLibs && !reduce;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SPRINKLE_COLORS = ["#f5bcc8", "#dbefed", "#fbe6b8", "#ffffff", "#bcd6f3", "#e2849a"];
  const BAKE_MS = 2600; // holding time from raw batter to done
  const SINK_PER_S = 0.35; // how fast it falls back when let go
  const RAW = [246, 231, 200];
  const GOLD = [217, 154, 78];

  function burst(host, x, y, count = 40, spread = 1) {
    if (!animate) return;
    for (let i = 0; i < count; i++) {
      const sp = document.createElement("i");
      sp.style.cssText = `position:absolute;z-index:30;left:${x}px;top:${y}px;width:6px;height:16px;margin:-8px 0 0 -3px;border-radius:3px;pointer-events:none;background:${SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]}`;
      host.appendChild(sp);
      const a = Math.random() * Math.PI * 2;
      const d = gsap.utils.random(80, 260) * spread;
      gsap.fromTo(sp, { x: 0, y: 0, rotation: gsap.utils.random(0, 180) }, { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8 + 90, rotation: "+=" + gsap.utils.random(-400, 400), opacity: 0, duration: gsap.utils.random(1, 1.7), ease: "power2.out", onComplete: () => sp.remove() });
    }
  }

  function init() {
    const sec = $(".x-bake");
    if (!sec) return;
    const oven = $("[data-oven]", sec);
    const lcd = $("[data-oven-lcd]", sec);
    const knobs = $$("[data-knob]", sec);
    const batter = $("[data-batter]", sec);
    const door = $("[data-oven-door]", sec);
    const bell = $("[data-bell]", sec);
    const smell = $(".x-bake__smell", sec);
    const cake = $("[data-baked]", sec);
    const stage = $(".x-bake__stage", sec);
    const btn = $("[data-bake-hold]", sec);
    const ring = $("[data-bake-ring]", sec);
    const label = $("[data-bake-label]", sec);
    const live = $("[data-bake-live]", sec);
    const LABEL = label.innerHTML;

    // the cream glaze on the title catches the light under the pointer
    const w1 = $(".x-bake__w1 > span", sec);
    if (animate && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      sec.addEventListener("pointermove", (e) => {
        const r = w1.getBoundingClientRect();
        w1.style.setProperty("--gx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      });
    }

    let b = 0; // baking progress 0..1
    let holding = false;
    let done = false;
    let raf = 0;
    let last = 0;
    let warned = 0;

    const mix = (t) => `rgb(${RAW.map((c, i) => Math.round(c + (GOLD[i] - c) * t)).join(",")})`;
    const paint = () => {
      const heat = holding ? 0.55 + b * 0.45 : b * 0.6;
      oven.style.setProperty("--heat", heat.toFixed(3));
      oven.style.setProperty("--lamp", holding ? "1" : (b * 0.5).toFixed(3));
      batter.style.height = `${(30 + b * 115).toFixed(1)}%`;
      batter.style.setProperty("--batter", mix(clamp((b - 0.2) / 0.8, 0, 1)));
      ring.style.strokeDashoffset = (1 - b).toFixed(4);
      smell.style.opacity = clamp((b - 0.4) * 2.5, 0, 1) * (holding ? 1 : 0.5);
      if (holding || b > 0) {
        const left = Math.ceil((1 - b) * 25);
        lcd.textContent = `00:${String(left).padStart(2, "0")}`;
      }
      // a little rumble while it bakes
      if (animate) oven.style.transform = holding ? `translate(${(Math.random() - 0.5) * 2.4}px, ${(Math.random() - 0.5) * 1.6}px)` : "";
    };

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (holding) b = clamp(b + dt / (BAKE_MS / 1000), 0, 1);
      else b = clamp(b - dt * SINK_PER_S, 0, 1);
      paint();
      if (b >= 1 && holding) return finish();
      if (holding || b > 0) raf = requestAnimationFrame(tick);
      else { raf = 0; lcd.textContent = "180°"; }
    };
    const loop = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };

    function start() {
      if (done || holding) return;
      holding = true;
      btn.classList.add("is-down");
      label.innerHTML = "печемо…<br>не відпускайте";
      if (!animate) return finish();
      loop();
    }
    function stop() {
      if (!holding) return;
      holding = false;
      btn.classList.remove("is-down");
      if (done) return;
      if (b > 0.04) {
        label.innerHTML = "ой, опадає 😅<br>тримайте!";
        warned = setTimeout(() => { if (!holding && !done) label.innerHTML = LABEL; }, 1600);
      } else label.innerHTML = LABEL;
      loop();
    }

    function finish() {
      done = true;
      holding = false;
      cancelAnimationFrame(raf);
      raf = 0;
      clearTimeout(warned);
      b = 1;
      paint();
      oven.style.transform = "";
      lcd.textContent = "ГОТОВО";
      btn.classList.remove("is-down");
      live.textContent = "Готово! Торт спечено. Тепер можна зібрати справжній у конструкторі.";
      if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
      if (!animate) {
        sec.classList.add("is-baked");
        cake.style.opacity = 1;
        batter.style.opacity = 0;
        return;
      }
      const tin = $(".x-oven__tin", oven).getBoundingClientRect();
      const cb = cake.getBoundingClientRect();
      const sb = stage.getBoundingClientRect();
      const from = { x: tin.left + tin.width / 2 - (cb.left + cb.width / 2), y: tin.top + tin.height / 2 - (cb.top + cb.height * 0.62), s: tin.width / cb.width };
      const icing = $(".x-bake__icing", cake);
      const cherry = $(".x-bake__cherry", cake);
      gsap.timeline()
        // ding!
        .fromTo(bell, { opacity: 0, scale: 0.3, rotation: -30 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(3)" })
        .to(bell, { rotation: 8, duration: 0.09, yoyo: true, repeat: 5, ease: "sine.inOut" })
        // the door drops open towards you
        .to(door, { rotationX: -100, duration: 0.7, ease: "bounce.out" }, 0.4)
        .to(oven, { "--heat": 0.25, "--lamp": 0, duration: 0.8 }, 0.5)
        // the cake rides out onto the plate
        .set(batter, { opacity: 0 }, 0.95)
        .fromTo(cake, { opacity: 1, x: from.x, y: from.y, scale: from.s }, { x: 0, y: 14, scale: 1.15, duration: 1, ease: "back.out(1.3)" }, 0.95)
        .set([icing, cherry], { opacity: 0 }, 0)
        // icing pours on, the cherry drops on top
        .fromTo(icing, { opacity: 1, y: -60, scaleY: 0.4 }, { y: 0, scaleY: 1, duration: 0.6, ease: "bounce.out" }, 1.8)
        .fromTo(cherry, { opacity: 1, y: -160 }, { y: 0, duration: 0.7, ease: "bounce.out" }, 2.2)
        .call(() => {
          const c = cherry.getBoundingClientRect();
          burst(stage, c.left - sb.left + c.width / 2, c.top - sb.top + c.height / 2, 46, 1.2);
          sec.classList.add("is-baked");
          gsap.from(".x-bake__done > *", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(2)" });
        }, null, 2.6)
        .to(bell, { opacity: 0, duration: 0.4 }, 3.4);
    }

    function reset() {
      done = false;
      b = 0;
      sec.classList.remove("is-baked");
      label.innerHTML = LABEL;
      if (animate) {
        gsap.to(door, { rotationX: 0, duration: 0.6, ease: "power2.inOut" });
        gsap.to(cake, { opacity: 0, y: 40, duration: 0.4 });
        gsap.set(batter, { opacity: 1 });
      }
      batter.style.opacity = "";
      if (!animate) cake.style.opacity = 0;
      paint();
      lcd.textContent = "180°";
      btn.focus();
    }

    // pointer: hold anywhere on the button; leaving it or lifting the finger counts as letting go
    btn.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      e.preventDefault();
      btn.setPointerCapture?.(e.pointerId);
      start();
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => btn.addEventListener(t, stop));
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
    // keyboard: Space / Enter held down
    btn.addEventListener("keydown", (e) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      if (!e.repeat) start();
    });
    // (preventDefault on keyup too, or Space would also fire a click that bakes it in one go)
    btn.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); stop(); } });
    btn.addEventListener("blur", stop);
    // a plain click (e.g. a screen reader activating it) can't "hold", so it bakes in one go
    btn.addEventListener("click", (e) => { if (e.detail === 0 && !done) { holding = true; finish(); } });
    $("[data-bake-again]", sec).addEventListener("click", reset);

    paint();
    if (!animate) { lcd.textContent = "180°"; return; }

    // preheat as the oven scrolls into view
    gsap.set(cake, { opacity: 0 });
    const pre = { t: 0 };
    gsap.timeline({ scrollTrigger: { trigger: oven, start: "top 80%", once: true } })
      .from(".x-bake__w1", { yPercent: 40, opacity: 0, duration: 1, ease: "expo.out" }, 0)
      .from(".x-bake__script", { scale: 0.4, rotation: -30, opacity: 0, duration: 1, ease: "back.out(2)" }, 0.3)
      .from(oven, { y: 120, opacity: 0, duration: 1, ease: "back.out(1.4)" }, 0.1)
      .fromTo(knobs, { "--k": "-120deg" }, { "--k": "60deg", duration: 1.2, stagger: 0.15, ease: "back.out(1.6)" }, 0.6)
      .to(pre, { t: 1, duration: 1.4, ease: "power2.out", onUpdate: () => { if (!holding && !done && b === 0) { lcd.textContent = `${Math.round(pre.t * 180)}°`; oven.style.setProperty("--lamp", (Math.sin(pre.t * 20) * 0.5 + 0.5).toFixed(2)); } } }, 0.7)
      .call(() => { if (!holding && !done) oven.style.setProperty("--lamp", "0"); })
      .from(btn, { scale: 0, rotation: -90, duration: 0.9, ease: "back.out(2)" }, 0.9);
  }

  MARIDAY.onReady(init);
})();
