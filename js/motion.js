/* Cinematic motion: reveals, parallax, rail drag, sticky header */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function initReveals() {
    const nodes = [...document.querySelectorAll("[data-reveal]")];
    if (!nodes.length) return;

    if (reduce) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }

    // Hero texts animate via .page-ready CSS; mark them in after paint
    requestAnimationFrame(() => {
      document.querySelectorAll(".hero-luxe [data-reveal]").forEach((n) => {
        n.classList.add("is-in");
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach((n) => {
      if (!n.closest(".hero-luxe")) io.observe(n);
    });
  }

  function initParallax() {
    if (reduce) return;
    const layers = [...document.querySelectorAll("[data-parallax], [data-parallax-slow]")];
    if (!layers.length) return;

    let ticking = false;
    function update() {
      const y = window.scrollY;
      layers.forEach((el) => {
        const slow = el.hasAttribute("data-parallax-slow");
        const factor = slow ? 0.06 : 0.1;
        const img = el.querySelector("img");
        if (!img) return;
        // Only nudge after hero has settled — avoid fighting entrance animation
        const shift = y * factor;
        img.style.transform = `translate3d(0, ${shift}px, 0) scale(${slow ? 1.04 : 1.06})`;
      });
      ticking = false;
    }

    // Delay first parallax so CSS entrance anim can finish
    setTimeout(() => {
      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
          }
        },
        { passive: true }
      );
    }, 2600);
  }

  function initRail() {
    const rail = document.querySelector("[data-rail]");
    const track = rail?.querySelector(".rail__track");
    if (!rail || !track) return;

    let x = 0;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    let moved = false;

    function maxScroll() {
      return Math.max(0, track.scrollWidth - rail.clientWidth);
    }

    function apply(nx) {
      x = Math.max(0, Math.min(maxScroll(), nx));
      track.style.transform = `translate3d(${-x}px, 0, 0)`;
    }

    // Wheel → horizontal
    rail.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          apply(x + e.deltaY);
        }
      },
      { passive: false }
    );

    rail.addEventListener("pointerdown", (e) => {
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = x;
      rail.setPointerCapture(e.pointerId);
    });

    rail.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      apply(startScroll - dx);
    });

    function endDrag() {
      dragging = false;
    }
    rail.addEventListener("pointerup", endDrag);
    rail.addEventListener("pointercancel", endDrag);

    // Prevent click-through after drag
    rail.addEventListener(
      "click",
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
        }
      },
      true
    );

    window.addEventListener("resize", () => apply(x));
  }

  function initHeader() {
    if (!document.body.classList.contains("home")) return;
    const onScroll = () => {
      document.body.classList.toggle("is-scrolled", window.scrollY > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initScrollNext() {
    document.querySelector("[data-scroll-next]")?.addEventListener("click", () => {
      const next = document.querySelector(".atelier");
      next?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  }

  function initMoodSelector() {
    const screen = document.querySelector("[data-mood-screen]");
    const buttons = [...document.querySelectorAll("[data-mood]")];
    if (!screen || !buttons.length) return;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((item) => item.classList.toggle("active", item === button));
        screen.classList.add("is-changing");
        screen.innerHTML = `<span>${button.dataset.mood}</span><strong>${button.dataset.note}</strong>`;
        window.setTimeout(() => screen.classList.remove("is-changing"), 260);
      });
    });
  }

  onReady(() => {
    initReveals();
    initParallax();
    initRail();
    initHeader();
    initScrollNext();
    initMoodSelector();
  });
})();
