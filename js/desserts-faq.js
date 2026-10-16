/* ⑧ Short answers: five desserts on a shelf. Pick one — it hops up and answers in the bubble,
   the others lean towards it to listen. Works as an ARIA tablist (arrows / Home / End). */
(() => {
  const root = document.querySelector("[data-dq]");
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
  const bubble = root.querySelector(".dq__bubble");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cur = -1;

  const pick = (i, focus) => {
    if (i === cur) return;
    cur = i;
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      panels[k].classList.toggle("is-on", on);
      // neighbours lean in towards the speaker, the closer ones a bit more
      const d = k - i;
      t.style.setProperty("--lean", on ? "0deg" : `${(d < 0 ? 1 : -1) * (Math.abs(d) === 1 ? 7 : 4)}deg`);
    });
    root.style.setProperty("--i", i);
    root.style.setProperty("--c", tabs[i].style.getPropertyValue("--c"));
    if (focus) tabs[i].focus();
    if (reduce || root.classList.contains("is-wait")) return;
    const d = tabs[i].querySelector(".dq__d");
    d.classList.remove("is-hop");
    bubble.classList.remove("is-pop");
    void d.offsetWidth;
    d.classList.add("is-hop");
    bubble.classList.add("is-pop");
  };

  tabs.forEach((t, i) => {
    t.style.setProperty("--n", i);
    t.addEventListener("click", () => pick(i));
    t.querySelector(".dq__d").addEventListener("animationend", (e) => {
      if (e.animationName === "dq-hop") e.currentTarget.classList.remove("is-hop");
    });
  });
  bubble.addEventListener("animationend", (e) => { if (e.animationName === "dq-pop") bubble.classList.remove("is-pop"); });

  root.addEventListener("keydown", (e) => {
    const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (k == null && e.key !== "Home" && e.key !== "End") return;
    if (!e.target.matches('[role="tab"]')) return;
    e.preventDefault();
    const n = tabs.length;
    pick(e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (cur + k + n) % n, true);
  });

  pick(0);

  // entrance: the desserts drop onto the shelf one by one, then the first one speaks
  if (reduce || !("IntersectionObserver" in window)) return;
  const r = root.getBoundingClientRect();
  if (r.top < innerHeight * 0.85) return; // already on screen (reload mid-page): no hiding
  root.classList.add("is-wait");
  const io = new IntersectionObserver((es) => {
    if (!es.some((x) => x.isIntersecting)) return;
    io.disconnect();
    root.classList.replace("is-wait", "is-in");
    setTimeout(() => root.classList.remove("is-in"), 1100);
  }, { rootMargin: "0px 0px -12% 0px" });
  io.observe(root);
})();
