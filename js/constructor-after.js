/* The constructor page's ending (pages/constructor.html, css/constructor-after.css): the order's tickets slide along
   the kitchen rail, the section title's letters jump in, and a piping bag runs a shell border along the top of the
   footer while cherries drop on it. Its own file, so js/constructor.js can change without touching it. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gs = () => (window.gsap && !reduce ? window.gsap : null);
  const f1 = (n) => n.toFixed(1);
  const rng = (seed) => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  /* ═════════════ ③ what happens next: tickets slide along the rail ═════════════ */
  function rail() {
    const host = $("[data-mk-rail]");
    if (!host) return;
    const tickets = $$(".mk-tk", host);
    const swing = (el, v) => {
      if (reduce || !el.animate) return;
      el.animate([{ rotate: "0deg" }, { rotate: `${v}deg` }, { rotate: `${-v * 0.55}deg` }, { rotate: `${v * 0.25}deg` }, { rotate: "0deg" }], { duration: 1300, easing: "ease-out", composite: "add" });
    };
    if (fine) tickets.forEach((el) => el.addEventListener("pointerenter", () => swing($(".mk-tk__paper", el), 6)));
    const g = gs();
    if (!g || !window.ScrollTrigger) return;
    g.set(tickets, { x: () => innerWidth * 0.9, rotation: 18 });
    ScrollTrigger.create({
      trigger: host,
      start: "top 78%",
      once: true,
      onEnter: () => g.to(tickets, { x: 0, rotation: 0, duration: 1.2, ease: "back.out(1.1)", stagger: 0.16, onComplete: () => g.set(tickets, { clearProps: "transform" }) }),
    });
  }

  /* ═════════════ ④ the finish: a shell border piped along the top of the footer, cherries on top ═════════════ */
  function outro() {
    const host = $("[data-mk-outro]");
    if (!host) return;
    const svg = $(".mk-outro__shells", host);
    // one shell: a puffy head pointing right, its tail tucked under the shell before it
    const shell = (x, y, k) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k})">
      <path d="M-38 8 C-26 8 -18 -14 -2 -14 C12 -14 18 -2 14 7 C10 15 -6 15 -20 12 C-28 10 -34 9 -38 8 Z" fill="url(#mkShellG)" stroke="rgba(109,8,9,.2)" stroke-width="1.2"/>
      <path d="M-30 8 C-16 6 -8 -6 8 -8 M-26 10 C-12 9 -2 3 14 2 M-32 7 C-20 2 -12 -11 0 -13" fill="none" stroke="#ead3c3" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M-8 -9 C-2 -12 4 -11 8 -9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></g>`;
    function build() {
      const H = svg.clientHeight || 60;
      const W = (host.clientWidth * 60) / H;
      const r = rng(5);
      const step = 34;
      let out = "";
      // drawn right to left, so every head sits over the next one's tail
      for (let x = Math.ceil(W / step + 1) * step; x > -step; x -= step) out += shell(x + r() * 2, 30 + (r() - 0.5) * 2.4, 0.94 + r() * 0.12);
      svg.setAttribute("viewBox", `0 0 ${f1(W)} 60`);
      svg.innerHTML = `<defs><linearGradient id="mkShellG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fffdf9"/><stop offset="1" stop-color="#f4e3d6"/></linearGradient></defs>${out}`;
    }
    build();
    addEventListener("resize", build);
    if (reduce || !("IntersectionObserver" in window)) return host.classList.add("is-in", "is-done");
    host.classList.add("is-armed");
    const io = new IntersectionObserver((ents) => {
      if (!ents.some((x) => x.isIntersecting)) return;
      io.disconnect();
      host.classList.add("is-in");
      setTimeout(() => host.classList.add("is-done"), 2700);
    }, { threshold: 0.6 });
    io.observe(host);
  }

  // the title of a section: letters jump in, the script is piped across when it comes into view
  function headings() {
    $$("[data-mk-split]").forEach((el) => {
      const w = el.textContent;
      el.innerHTML = [...w].map((ch, i) => `<span class="mk-ch" style="--i:${i};--cr:${i % 2 ? 12 : -12}deg">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
    });
    const hs = $$(".mk-h2");
    if (reduce || !("IntersectionObserver" in window)) return hs.forEach((h) => h.classList.add("is-in"));
    document.documentElement.classList.add("mk-js");
    const io = new IntersectionObserver((ents) => ents.forEach((x) => {
      if (!x.isIntersecting) return;
      x.target.classList.add("is-in");
      io.unobserve(x.target);
    }), { threshold: 0.4 });
    hs.forEach((h) => io.observe(h));
  }

  const start = () => {
    rail();
    outro();
    headings();
  };
  if (window.MARIDAY && MARIDAY.onReady) MARIDAY.onReady(start);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
