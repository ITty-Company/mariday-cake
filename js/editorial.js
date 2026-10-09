/* Mariday — editorial interactions: tabs, accordions, sticky steps, film, calculators,
   glossary, quiz, palette, thermometer, brief builder, certificate designer, reviews, journal */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.MARIDAY && MARIDAY.editing);
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const M = () => window.MARIDAY || {};
  const C = () => M().contacts || { whatsapp: "31600000000", email: "hello@mariday.cake", instagram: "https://www.instagram.com/mariday.cake/" };
  const esc = (s) => (window.escapeHTML ? window.escapeHTML(s) : String(s ?? ""));
  const eur = (n) => (window.formatEUR ? window.formatEUR(n) : "€" + Math.round(n));
  const refresh = () => window.MaridayMotion?.refresh?.();
  const reveal = (root) => window.MaridayMotion?.reveal?.(root);
  const toast = (m, a) => window.showToast?.(m, a);
  const pad = (n) => String(n).padStart(2, "0");
  const setRange = (r) => r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min)) * 100 + "%");

  function copy(text, ok = "Скопійовано ✓") {
    const done = () => toast(ok);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => fallback());
    else fallback();
    function fallback() {
      const t = document.createElement("textarea");
      t.value = text;
      t.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(t);
      t.select();
      try { document.execCommand("copy"); done(); } catch { toast("Не вдалося скопіювати"); }
      t.remove();
    }
  }

  /* ───────── Tabs ───────── */
  function tabs() {
    $$("[data-ed-tabs]").forEach((box, k) => {
      const btns = $$(".ed-tabs__bar button", box);
      const panels = $$("[data-panel]", box);
      $(".ed-tabs__bar", box)?.setAttribute("role", "tablist");
      btns.forEach((b, i) => {
        b.setAttribute("role", "tab");
        b.id = b.id || `ed-tab-${k}-${i}`;
        const p = panels.find((x) => x.dataset.panel === b.dataset.tab);
        if (p) { p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", b.id); }
      });
      const show = (id, focus) => {
        btns.forEach((b) => {
          const on = b.dataset.tab === id;
          b.setAttribute("aria-selected", on);
          b.tabIndex = on ? 0 : -1;
          if (on && focus) b.focus();
        });
        panels.forEach((p) => {
          const on = p.dataset.panel === id;
          p.hidden = !on;
          p.classList.toggle("is-in", on && !reduce);
          if (on) reveal(p);
        });
        refresh();
      };
      box.addEventListener("click", (e) => {
        const b = e.target.closest(".ed-tabs__bar button");
        if (b && box.contains(b)) show(b.dataset.tab);
      });
      box.addEventListener("keydown", (e) => {
        if (!e.target.closest(".ed-tabs__bar") || !["ArrowRight", "ArrowLeft"].includes(e.key)) return;
        const i = btns.indexOf(e.target);
        const n = btns[(i + (e.key === "ArrowRight" ? 1 : -1) + btns.length) % btns.length];
        show(n.dataset.tab, true);
      });
      show((btns.find((b) => b.getAttribute("aria-selected") === "true") || btns[0])?.dataset.tab);
    });
  }

  /* ───────── Accordion with a smooth height animation ───────── */
  function accordions() {
    $$(".ed-acc").forEach((acc) => {
      const single = acc.hasAttribute("data-single");
      $$("details", acc).forEach((d) => {
        const sum = $("summary", d);
        const body = $(".ed-acc__body", d);
        sum.addEventListener("click", (e) => {
          if (reduce || !body?.animate) {
            if (single && !d.open) $$("details[open]", acc).forEach((o) => o !== d && (o.open = false));
            setTimeout(refresh, 30);
            return;
          }
          e.preventDefault();
          if (d.open) {
            const a = body.animate([{ height: body.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 380, easing: "cubic-bezier(.19,1,.22,1)" });
            a.onfinish = () => { d.open = false; refresh(); };
          } else {
            if (single) $$("details[open]", acc).forEach((o) => o !== d && $("summary", o).click());
            d.open = true;
            const h = body.offsetHeight;
            body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 520, easing: "cubic-bezier(.19,1,.22,1)" }).onfinish = refresh;
          }
        });
      });
    });
  }

  /* ───────── Sticky steps: the photo follows the active step ───────── */
  function steps() {
    $$("[data-ed-steps]").forEach((box) => {
      const imgs = $$(".ed-steps__media img", box);
      const items = $$(".ed-step", box);
      const count = $(".ed-steps__count", box);
      const set = (i) => {
        items.forEach((s, k) => s.classList.toggle("is-on", k === i));
        imgs.forEach((im, k) => im.classList.toggle("is-on", k === i));
        if (count) count.textContent = `${pad(i + 1)} / ${pad(items.length)}`;
      };
      set(0);
      if (!("IntersectionObserver" in window)) return items.forEach((s) => s.classList.add("is-on"));
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) set(items.indexOf(e.target)); });
      }, { rootMargin: "-45% 0px -45% 0px" });
      items.forEach((s) => io.observe(s));
    });
  }

  /* ───────── Film: plays while on screen ───────── */
  function films() {
    $$("[data-ed-film]").forEach((box) => {
      const v = $("video", box);
      const btn = $(".ed-film__btn", box);
      if (!v) return;
      let wanted = !reduce;
      const paint = () => {
        if (!btn) return;
        btn.textContent = v.paused ? "▶" : "❚❚";
        btn.setAttribute("aria-label", v.paused ? "Відтворити відео" : "Пауза");
      };
      v.addEventListener("play", paint);
      v.addEventListener("pause", paint);
      btn?.addEventListener("click", () => {
        wanted = v.paused;
        wanted ? v.play().catch(() => {}) : v.pause();
      });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((es) => {
          es.forEach((e) => {
            if (e.isIntersecting && wanted) v.play().catch(() => {});
            else if (!e.isIntersecting) v.pause();
          });
        }, { threshold: 0.25 }).observe(box);
      }
      paint();
    });
  }

  /* ───────── Guests → weight → tiers ───────── */
  function calcs() {
    $$("[data-ed-calc]").forEach((box) => {
      const range = $("input[type=range]", box);
      const out = $("[data-guests-out]", box);
      const cake = $(".ed-calc__cake", box);
      const res = $("[data-res]", box);
      const hint = $("[data-hint]", box);
      const link = $("[data-calc-link]", box);
      let grams = +($("[data-grams][aria-pressed=true]", box)?.dataset.grams || 175);
      let lastTiers = 0;
      const W = [240, 190, 146, 108, 80];
      const paint = () => {
        const g = +range.value;
        setRange(range);
        out.textContent = g;
        const kg = Math.max(1.5, Math.ceil(((g * grams) / 1000) * 2) / 2);
        const tiers = kg <= 3.5 ? 1 : kg <= 7 ? 2 : kg <= 12 ? 3 : kg <= 20 ? 4 : 5;
        const sizes = M().sizes || [];
        const size = sizes.find((s) => s.id !== "tier" && parseFloat(s.id) >= kg) || sizes.find((s) => s.id === "tier");
        const from = size ? Math.round(95 * size.priceMult * (size.id === "tier" ? Math.max(1, kg / 6) : 1)) : null;
        if (tiers !== lastTiers) {
          cake.innerHTML = W.slice(0, tiers).map((w) => `<span style="width:${w}px"></span>`).join("");
          lastTiers = tiers;
        }
        res.innerHTML = `
          <div><b>${String(kg).replace(".", ",")} кг</b><small>вага торта</small></div>
          <div><b>${tiers} ${tiers === 1 ? "ярус" : tiers < 5 ? "яруси" : "ярусів"}</b><small>рекомендуємо</small></div>
          <div><b>${from ? "від " + eur(from) : "—"}</b><small>база без декору</small></div>`;
        hint.textContent =
          g <= 12 ? "Камерне свято — ідеальний одноярусний торт або пара бенто поруч ♥"
          : g <= 30 ? "Класичний святковий торт. Додайте капкейки — і стіл виглядатиме щедро"
          : g <= 70 ? "Тут уже просяться яруси й candy bar на 20–30 гостей"
          : "Велике весілля! Радимо ярусний торт + солодкий стіл та дегустацію заздалегідь";
        if (link) link.href = `constructor.html?size=${size?.id || "tier"}`;
      };
      box.addEventListener("click", (e) => {
        const b = e.target.closest("[data-grams]");
        if (!b) return;
        grams = +b.dataset.grams;
        $$("[data-grams]", box).forEach((x) => x.setAttribute("aria-pressed", x === b));
        paint();
      });
      range.addEventListener("input", paint);
      paint();
    });
  }

  /* ───────── Glossary filter ───────── */
  function glossary() {
    $$("[data-ed-gloss]").forEach((box) => {
      const input = $("input[type=search]", box);
      const terms = $$(".ed-term", box);
      const none = $(".ed-gloss__none", box);
      let cat = "all";
      const paint = () => {
        const t = input.value.trim().toLowerCase();
        let n = 0;
        terms.forEach((el) => {
          const ok = (cat === "all" || el.dataset.cat === cat) && (!t || el.textContent.toLowerCase().includes(t));
          el.hidden = !ok;
          if (ok) n++;
        });
        if (none) none.hidden = n > 0;
        refresh();
      };
      box.addEventListener("click", (e) => {
        const c = e.target.closest("[data-gcat]");
        if (!c) return;
        cat = c.dataset.gcat;
        $$("[data-gcat]", box).forEach((x) => { x.classList.toggle("is-on", x === c); x.setAttribute("aria-pressed", x === c); });
        paint();
      });
      input.addEventListener("input", paint);
      paint();
    });
  }

  /* ───────── Generic filter (journal, reviews on static markup) ───────── */
  function filters() {
    $$("[data-ed-filter]").forEach((box) => {
      const items = $$("[data-tags]", box);
      box.addEventListener("click", (e) => {
        const c = e.target.closest("[data-f]");
        if (!c) return;
        const f = c.dataset.f;
        $$("[data-f]", box).forEach((x) => { x.classList.toggle("is-on", x === c); x.setAttribute("aria-pressed", x === c); });
        const shown = [];
        items.forEach((el) => {
          const ok = f === "all" || el.dataset.tags.split(" ").includes(f);
          el.hidden = !ok;
          if (ok) shown.push(el);
        });
        window.MaridayMotion?.stagger?.(shown);
        refresh();
      });
    });
  }

  /* ───────── Article table of contents ───────── */
  function toc() {
    $$("[data-ed-toc]").forEach((nav) => {
      const links = $$("a[href^='#']", nav);
      const heads = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
      if (!heads.length || !("IntersectionObserver" in window)) return;
      const set = (id) => links.forEach((a) => a.classList.toggle("is-on", a.getAttribute("href") === "#" + id));
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) set(e.target.id); });
      }, { rootMargin: "0px 0px -70% 0px" });
      heads.forEach((h) => io.observe(h));
      set(heads[0].id);
    });
  }

  /* ───────── Add to cart from editorial blocks ───────── */
  function addButtons() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ed-add]");
      if (!b) return;
      const d = (M().desserts || []).find((x) => x.id === b.dataset.edAdd);
      if (!d) return;
      const item = { id: d.id, name: d.name, price: d.price, qty: 1, image: d.image, dessert: true, meta: d.unit };
      if (window.addToCartAndNotify) window.addToCartAndNotify(item, b);
      else { window.MaridayCart?.add(item); toast(`«${d.name}» у кошику`); }
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ed-copy]");
      if (b) copy(b.dataset.edCopy, b.dataset.ok || "Скопійовано ✓");
    });
  }

  /* ───────── Hotspots (anatomy of a dessert / a box) ───────── */
  function hotspots() {
    $$("[data-ed-hot]").forEach((box) => {
      const spots = $$("[data-spot]", box);
      const out = $("[data-hot-out]", box);
      const set = (s) => {
        spots.forEach((x) => { x.classList.toggle("is-on", x === s); x.setAttribute("aria-pressed", x === s); });
        if (out) {
          out.innerHTML = `<b>${esc(s.dataset.title)}</b><p>${esc(s.dataset.text)}</p>`;
          if (!reduce && out.animate) out.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: "cubic-bezier(.19,1,.22,1)" });
        }
      };
      spots.forEach((s) => {
        s.addEventListener("click", () => set(s));
        if (fine) s.addEventListener("pointerenter", () => set(s));
      });
      if (spots[0]) set(spots[0]);
    });
  }

  /* ───────── Party palette → candy bar preview ───────── */
  function palette() {
    $$("[data-ed-palette]").forEach((box) => {
      const stage = $("[data-stage]", box);
      const name = $("[data-pal-name]", box);
      const note = $("[data-pal-note]", box);
      const btns = $$("[data-pal]", box);
      const set = (b) => {
        const cols = b.dataset.pal.split(",");
        cols.forEach((c, i) => stage.style.setProperty(`--p${i + 1}`, c));
        btns.forEach((x) => x.setAttribute("aria-pressed", x === b));
        if (name) name.textContent = b.dataset.name;
        if (note) note.textContent = b.dataset.note;
      };
      box.addEventListener("click", (e) => {
        const b = e.target.closest("[data-pal]");
        if (b) set(b);
      });
      const first = btns.find((b) => b.getAttribute("aria-pressed") === "true") || btns[0];
      if (first) set(first);
    });
  }

  /* ───────── "Which dessert are you?" quiz ───────── */
  function quiz() {
    $$("[data-ed-quiz]").forEach((box) => {
      const qs = $$("[data-q]", box);
      const result = $("[data-quiz-result]", box);
      const bar = $("[data-quiz-bar]", box);
      const RES = {
        "red-velvet-cupcakes": { title: "Ви — Red velvet", text: "Елегантні, трішки драматичні й завжди в центрі уваги. Оксамит, кремчиз і малина — ваш стиль." },
        "macaron-set": { title: "Ви — макарон", text: "Витончені, кольорові й неймовірно фотогенічні. Маленькі, але з характером." },
        "brownie-box": { title: "Ви — брауні", text: "Теплі, щирі й без зайвих церемоній. Шоколадна душа компанії." },
        "unicorn-cupcakes": { title: "Ви — капкейк «Єдиноріг»", text: "Свято ходить за вами по п'ятах. Посипка, веселка й гучний сміх." },
        "tiramisu-box": { title: "Ви — тірамісу", text: "Дорослий шарм, кава зранку й розмови до ночі. Класика, яка не втомлює." },
      };
      let score = {};
      let step = 0;
      const show = (i) => {
        qs.forEach((q, k) => (q.hidden = k !== i));
        if (bar) bar.style.width = (i / qs.length) * 100 + "%";
      };
      const finish = () => {
        const id = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
        const d = (M().desserts || []).find((x) => x.id === id);
        const r = RES[id];
        qs.forEach((q) => (q.hidden = true));
        if (bar) bar.style.width = "100%";
        result.hidden = false;
        result.innerHTML = `
          <img src="${d ? d.image : ""}" alt="">
          <div>
            <p class="p-eyebrow">( ваш результат )</p>
            <h3>${esc(r.title)}</h3>
            <p>${esc(r.text)}</p>
            <div class="ed-row">
              <button type="button" class="p-btn" data-ed-add="${id}"><span>Хочу таке · ${d ? eur(d.price) : ""}</span></button>
              <button type="button" class="p-link" data-quiz-again>Пройти ще раз</button>
            </div>
          </div>`;
        if (!reduce && result.animate) result.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 600, easing: "cubic-bezier(.34,1.7,.5,1)" });
        const sec = box.closest("[data-sprinkles]");
        if (sec) {
          const r1 = sec.getBoundingClientRect(), r2 = result.getBoundingClientRect();
          window.MaridayMotion?.burst?.(sec, r2.left - r1.left + r2.width / 2, r2.top - r1.top + 40, 90);
        }
        refresh();
      };
      box.addEventListener("click", (e) => {
        const a = e.target.closest("[data-a]");
        if (a) {
          a.dataset.a.split(" ").forEach((id) => (score[id] = (score[id] || 0) + 1));
          step++;
          step < qs.length ? show(step) : finish();
          return;
        }
        if (e.target.closest("[data-quiz-again]")) {
          score = {};
          step = 0;
          result.hidden = true;
          show(0);
          refresh();
        }
      });
      show(0);
    });
  }

  /* ───────── Storage thermometer ───────── */
  function thermo() {
    $$("[data-ed-thermo]").forEach((box) => {
      const r = $("input[type=range]", box);
      const t = $("[data-temp]", box);
      const fill = $("[data-fill]", box);
      const msg = $("[data-msg]", box);
      const STATES = [
        [1, "is-cold", "Занадто холодно", "Крем може «запотіти», а бісквіт стане щільним. Тримайте торт на середній полиці, не біля задньої стінки."],
        [6, "is-ok", "Ідеально ♥", "+2…+6 °C — саме так торт зберігає форму й смак до 72 годин. Коробка закрита, поруч без різких запахів."],
        [14, "is-warn", "Час подачі", "Прохолодна кімната — торт можна тримати на столі 30–40 хвилин перед подачею, так смак розкриється."],
        [22, "is-hot", "Не більше години", "Кімнатна температура: крем м'якне, декор пливе. Подавайте й повертайте залишки в холодильник."],
        [99, "is-danger", "Терміново в холод!", "Спека, сонце чи гарячий салон авто — кремові торти тут не живуть. Кондиціонер, тінь і холодильник якнайшвидше."],
      ];
      const paint = () => {
        const v = +r.value;
        setRange(r);
        t.textContent = (v > 0 ? "+" : "") + v + " °C";
        fill.style.height = Math.max(6, ((v - r.min) / (r.max - r.min)) * 100) + "%";
        const s = STATES.find(([max]) => v <= max);
        box.dataset.state = s[1];
        msg.innerHTML = `<b>${s[2]}</b><p>${s[3]}</p>`;
      };
      r.addEventListener("input", paint);
      paint();
    });
  }

  /* ───────── Brief builder (contacts) ───────── */
  function brief() {
    $$("[data-ed-brief]").forEach((box) => {
      const form = $("form", box);
      const out = $("[data-brief-out]", box);
      const meter = $("[data-brief-meter]", box);
      const wa = $("[data-brief-wa]", box);
      const copyBtn = $("[data-brief-copy]", box);
      const text = () => {
        const f = new FormData(form);
        const lines = ["Привіт, Mariday! 👋"];
        const what = f.getAll("what");
        if (what.length) lines.push(`Хочу замовити: ${what.join(", ")}.`);
        if (f.get("date")) lines.push(`Дата свята: ${new Date(f.get("date")).toLocaleDateString("uk-UA", { day: "numeric", month: "long" })}.`);
        if (f.get("guests")) lines.push(`Гостей: ${f.get("guests")}.`);
        if (f.get("taste")) lines.push(`Смак: ${f.get("taste")}.`);
        if (f.get("style")) lines.push(`Стиль / кольори: ${f.get("style")}.`);
        if (f.get("budget")) lines.push(`Орієнтовний бюджет: ${f.get("budget")}.`);
        lines.push(f.get("pickup") === "delivery" ? `Потрібна доставка${f.get("city") ? " — " + f.get("city") : ""}.` : "Заберу самостійно в Alkmaar.");
        if (f.get("ref")) lines.push("Референси надішлю наступним повідомленням 📎");
        return lines.join("\n");
      };
      const paint = () => {
        const t = text();
        out.textContent = t;
        const f = new FormData(form);
        const filled = ["date", "guests", "taste", "style", "budget"].filter((k) => f.get(k)).length + (f.getAll("what").length ? 1 : 0);
        const pct = Math.round((filled / 6) * 100);
        meter.style.setProperty("--p", pct + "%");
        meter.dataset.label = pct >= 100 ? "Ідеальний бриф ✨" : pct >= 50 ? "Майже все є" : "Додайте деталі";
        wa.href = `https://wa.me/${C().whatsapp}?text=${encodeURIComponent(t)}`;
        $("[data-city]", box).hidden = f.get("pickup") !== "delivery";
      };
      form.addEventListener("input", paint);
      form.addEventListener("change", paint);
      form.addEventListener("submit", (e) => e.preventDefault());
      copyBtn?.addEventListener("click", () => copy(text(), "Текст скопійовано — вставте в Direct @mariday.cake ♥"));
      paint();
    });
  }

  /* ───────── Gift certificate designer ───────── */
  function certificate() {
    $$("[data-ed-cert]").forEach((box) => {
      const card = $("[data-cert-card]", box);
      const form = $("form", box);
      const amountOut = $$("[data-c-amount]", box);
      const toOut = $("[data-c-to]", box);
      const fromOut = $("[data-c-from]", box);
      const msgOut = $("[data-c-msg]", box);
      const code = $("[data-c-code]", box);
      const custom = $("[data-c-custom]", box);
      const wa = $("[data-c-wa]", box);
      const mail = $("[data-c-mail]", box);
      const hint = $("[data-c-hint]", box);
      const DESIGNS = { blush: "Пудра", cherry: "Вишня", mint: "М'ята", gold: "Шампань" };
      const serial = "MD-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      code.textContent = serial;
      const amount = () => {
        const v = form.amount.value;
        if (v === "custom") return Math.min(1000, Math.max(20, +custom.value || 0));
        return +v;
      };
      const paint = () => {
        const a = amount();
        const wrap = $("[data-c-custom-wrap]", box);
        custom.hidden = false;
        if (wrap) wrap.hidden = form.amount.value !== "custom";
        else custom.hidden = form.amount.value !== "custom";
        amountOut.forEach((o) => (o.textContent = eur(a)));
        card.dataset.design = form.design.value;
        toOut.textContent = form.to.value.trim() || "Для найсолодшої людини";
        fromOut.textContent = form.from.value.trim() ? "від " + form.from.value.trim() : "з любов'ю";
        msgOut.textContent = form.msg.value.trim() || "Нехай цей торт буде таким же особливим, як ти ♥";
        const what = a >= 300 ? "ярусний торт або великий candy bar" : a >= 150 ? "святковий торт на 10–16 гостей" : a >= 80 ? "святковий торт 1,5 кг на 6–8 гостей" : a >= 35 ? "бенто-торт або набір капкейків" : "набір макаронів чи печива";
        hint.textContent = `≈ ${what}`;
        const t = `Привіт, Mariday! Хочу подарунковий сертифікат ${eur(a)} (дизайн «${DESIGNS[form.design.value] || form.design.value}»).\nКому: ${toOut.textContent}\nВід: ${form.from.value.trim() || "—"}\nПобажання: ${msgOut.textContent}\nФормат: ${form.format.value === "print" ? "друкований у конверті" : "електронний (PDF)"}\nНомер чернетки: ${serial}`;
        wa.href = `https://wa.me/${C().whatsapp}?text=${encodeURIComponent(t)}`;
        mail.href = `mailto:${C().email}?subject=${encodeURIComponent("Сертифікат " + serial)}&body=${encodeURIComponent(t)}`;
      };
      form.addEventListener("input", paint);
      form.addEventListener("change", paint);
      form.addEventListener("submit", (e) => e.preventDefault());
      // the card follows the pointer a little
      if (fine && !reduce) {
        card.addEventListener("pointermove", (e) => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
          card.style.setProperty("--gx", (x + 0.5) * 100 + "%");
          card.style.setProperty("--gy", (y + 0.5) * 100 + "%");
        });
        card.addEventListener("pointerleave", () => (card.style.transform = ""));
      }
      paint();
    });
  }

  /* ───────── Reviews wall from data ───────── */
  function reviews() {
    $$("[data-ed-reviews]").forEach((box) => {
      const list = M().reviews || [];
      const grid = $("[data-grid]", box);
      const more = $("[data-more]", box);
      const note = $("[data-sample-note]", box);
      const chips = $("[data-chips]", box);
      const size = +box.dataset.edReviews || 9;
      const TINTS = ["#ffffff", "#f5bcc8", "#fbe6b8", "#ffffff", "#bcd6f3", "#e9c6f0"];
      const cats = [["all", "Усі"], ...[...new Set(list.map((r) => r.occasion))].map((o) => [o, o])];
      let cat = "all";
      let shown = size;
      if (note) note.hidden = !list.some((r) => r.sample);
      if (chips) {
        chips.innerHTML = cats.map(([id, label], i) => `<button type="button" class="p-sticker${i ? "" : " is-on"}" data-rcat="${esc(id)}" aria-pressed="${!i}" style="--r:${[-2, 1.5, -1, 2, -1.5][i % 5]}deg">${esc(label)}<sup>${id === "all" ? list.length : list.filter((r) => r.occasion === id).length}</sup></button>`).join("");
      }
      const card = (r, i) => {
        const dark = i % 7 === 3;
        const init = r.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        return `<article class="ed-quote${dark ? " ed-quote--dark" : ""}"${dark ? "" : ` style="--c:${TINTS[i % TINTS.length]}"`} data-up>
          <div class="ed-quote__stars" aria-label="Оцінка ${r.stars} з 5">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
          ${r.img ? `<img src="${M().img ? M().img(r.img) : r.img}" alt="" loading="lazy">` : ""}
          <blockquote>${esc(r.text)}</blockquote>
          <footer><span class="ed-quote__ava" aria-hidden="true">${esc(init)}</span><span><b>${esc(r.name)}</b><small>${esc(r.city)} · ${esc(r.product)}</small></span><span class="ed-quote__tag">${esc(r.occasion)}</span></footer>
        </article>`;
      };
      const paint = (animate) => {
        const items = list.filter((r) => cat === "all" || r.occasion === cat);
        grid.innerHTML = items.slice(0, shown).map(card).join("");
        if (more) more.hidden = shown >= items.length;
        if (animate) {
          $$("[data-up]", grid).forEach((el) => el.removeAttribute("data-up"));
          window.MaridayMotion?.stagger?.($$(".ed-quote", grid));
        } else reveal(grid);
        refresh();
      };
      box.addEventListener("click", (e) => {
        const c = e.target.closest("[data-rcat]");
        if (c) {
          cat = c.dataset.rcat;
          shown = size;
          $$("[data-rcat]", box).forEach((x) => { x.classList.toggle("is-on", x === c); x.setAttribute("aria-pressed", x === c); });
          paint(true);
        }
      });
      more?.addEventListener("click", () => { shown += size; paint(true); });
      paint(false);
    });
  }

  /* ───────── Rating bars fill when visible ───────── */
  function bars() {
    const els = $$("[data-bar]");
    if (!els.length) return;
    const fill = (el) => el.style.setProperty("--w", el.dataset.bar + "%");
    if (reduce || !("IntersectionObserver" in window)) return els.forEach(fill);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fill(e.target); io.unobserve(e.target); } }), { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  }

  /* ───────── Corporate: quick quote ───────── */
  function corpCalc() {
    $$("[data-ed-corp]").forEach((box) => {
      const r = $("input[type=range]", box);
      const out = $("[data-people]", box);
      const res = $("[data-corp-res]", box);
      const wa = $("[data-corp-wa]", box);
      let kind = "box";
      const KINDS = {
        box: { name: "брендовані бокси з капкейками", per: 6, unit: "шт." },
        cake: { name: "торт з логотипом", per: 0, unit: "" },
        bar: { name: "candy bar для офісу", per: 3, unit: "десерти на гостя" },
        cookie: { name: "печиво з логотипом", per: 2, unit: "шт. на гостя" },
      };
      const paint = () => {
        const n = +r.value;
        setRange(r);
        out.textContent = n;
        const k = KINDS[kind];
        let line;
        if (kind === "cake") {
          const kg = Math.max(1.5, Math.ceil(n * 0.15 * 2) / 2);
          line = `≈ <b>${String(kg).replace(".", ",")} кг</b> торта — по 150 г на людину`;
        } else if (kind === "box") {
          const boxes = Math.ceil(n / k.per);
          line = `≈ <b>${boxes} ${boxes === 1 ? "бокс" : boxes < 5 ? "бокси" : "боксів"}</b> по 6 капкейків`;
        } else {
          line = `≈ <b>${n * k.per}</b> ${k.unit.includes("на гостя") ? "десертів" : "шт."} · ${k.per} на людину`;
        }
        res.innerHTML = `${line}<small>${n >= 50 ? "Обсяг від 50 осіб — запитайте про корпоративні умови" : "Ідеально для команди чи зустрічі з клієнтами"}</small>`;
        wa.href = `https://wa.me/${C().whatsapp}?text=${encodeURIComponent(`Привіт, Mariday! Нас ${n} осіб, цікавить ${k.name}. Підкажете умови й терміни?`)}`;
      };
      box.addEventListener("click", (e) => {
        const b = e.target.closest("[data-kind]");
        if (!b) return;
        kind = b.dataset.kind;
        $$("[data-kind]", box).forEach((x) => x.setAttribute("aria-pressed", x === b));
        paint();
      });
      r.addEventListener("input", paint);
      paint();
    });
  }

  /* ───────── FAQ knowledge base, rendered from the same data as the chat bot ───────── */
  function kb() {
    $$("[data-ed-kb]").forEach((box) => {
      const all = [...(M().faq || []), ...(M().faqMore || [])];
      const cats = (M().faqCats || []).filter((c) => c.id !== "all").map((c) => ({ ...c, qs: all.filter((q) => q.cat === c.id) })).filter((c) => c.qs.length);
      $("[data-kb-nav]", box).innerHTML = cats.map((c) => `<a href="#kb-${c.id}"><span aria-hidden="true">${c.emoji}</span>${esc(c.label)}<sup>${c.qs.length}</sup></a>`).join("");
      $("[data-kb-groups]", box).innerHTML = cats.map((c) => `
        <section class="kb__group" id="kb-${c.id}">
          <h3 class="kb__title"><span aria-hidden="true">${c.emoji}</span>${esc(c.label)}<small>${c.qs.length} ${c.qs.length < 5 ? "питання" : "питань"}</small></h3>
          <div class="ed-acc">${c.qs.map((q, i) => `<details><summary><small>${pad(i + 1)}</small><h4>${esc(q.q)}</h4><i aria-hidden="true">+</i></summary><div class="ed-acc__body"><p>${esc(q.a)}</p></div></details>`).join("")}</div>
        </section>`).join("");
      if ("IntersectionObserver" in window) {
        const links = $$("[data-kb-nav] a", box);
        const io = new IntersectionObserver((es) => es.forEach((e) => {
          if (e.isIntersecting) links.forEach((a) => a.classList.toggle("is-on", a.getAttribute("href") === "#" + e.target.id));
        }), { rootMargin: "-30% 0px -60% 0px" });
        $$(".kb__group", box).forEach((g) => io.observe(g));
      }
    });
  }

  // WhatsApp links follow the number in data.js
  function waLinks() {
    $$("a[data-wa]").forEach((a) => {
      const text = a.dataset.wa ? `?text=${encodeURIComponent(a.dataset.wa)}` : "";
      a.href = `https://wa.me/${C().whatsapp}${text}`;
    });
  }

  /* ───────── Leave a review → WhatsApp / email ───────── */
  function reviewForm() {
    $$("[data-rv-form]").forEach((box) => {
      const form = $("form", box);
      const wa = $("[data-rv-wa]", box);
      const mail = $("[data-rv-mail]", box);
      const paint = () => {
        const f = new FormData(form);
        const stars = +f.get("stars") || 5;
        const t = [
          `Відгук для Mariday ${"★".repeat(stars)}${"☆".repeat(5 - stars)}`,
          `Привід: ${f.get("occasion")}`,
          f.get("text") ? `\n${f.get("text").trim()}` : "",
          `\n— ${(f.get("name") || "").trim() || "гість"}${f.get("city") ? ", " + f.get("city").trim() : ""}`,
          f.get("publish") ? "\n(можна опублікувати)" : "\n(тільки для команди)",
        ].filter(Boolean).join("\n");
        wa.href = `https://wa.me/${C().whatsapp}?text=${encodeURIComponent(t)}`;
        mail.href = `mailto:${C().email}?subject=${encodeURIComponent("Відгук про Mariday")}&body=${encodeURIComponent(t)}`;
      };
      form.addEventListener("input", paint);
      form.addEventListener("change", paint);
      form.addEventListener("submit", (e) => e.preventDefault());
      paint();
    });
  }

  /* ───────── Article checklists remember ticks in this browser ───────── */
  function checklists() {
    $$("[data-ed-check]").forEach((list) => {
      const key = "mariday_check_" + list.dataset.edCheck;
      const boxes = $$("input[type=checkbox]", list);
      const bar = $("[data-check-bar]", list.parentElement);
      let saved = [];
      try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch { saved = []; }
      boxes.forEach((b, i) => (b.checked = saved.includes(i)));
      const paint = () => {
        const done = boxes.filter((b) => b.checked).length;
        if (bar) {
          bar.style.setProperty("--p", Math.round((done / boxes.length) * 100) + "%");
          const out = $("b", bar);
          if (out) out.textContent = `${done} / ${boxes.length}`;
        }
      };
      list.addEventListener("change", () => {
        const ids = boxes.map((b, i) => (b.checked ? i : -1)).filter((i) => i >= 0);
        try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* private mode: ticks live for this visit only */ }
        paint();
      });
      paint();
    });
  }

  /* ───────── Light ranges outside special widgets ───────── */
  function ranges() {
    $$(".ed-range").forEach((r) => { setRange(r); r.addEventListener("input", () => setRange(r)); });
  }

  function init() {
    kb();
    waLinks();
    tabs();
    accordions();
    steps();
    films();
    calcs();
    glossary();
    filters();
    toc();
    addButtons();
    hotspots();
    palette();
    quiz();
    thermo();
    brief();
    certificate();
    reviews();
    bars();
    corpCalc();
    reviewForm();
    checklists();
    ranges();
  }

  MARIDAY.onReady(init);
})();
