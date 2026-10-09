/* Shared header, footer, cart drawer, order modal */
(function () {
  function prefix() {
    return location.pathname.includes("/pages/") ? "../" : "";
  }

  function p(path) {
    return prefix() + path;
  }

  function mountLayout() {
    const headerHost = document.getElementById("site-header");
    const footerHost = document.getElementById("site-footer");
    if (!headerHost || !footerHost) return;

    const here = location.pathname.split("/").pop() || "index.html";
    const cur = (file) => (here === file ? ' aria-current="page"' : "");
    const tickerItems = `
      <span>Замовлення підтверджується після передоплати</span><i>✦</i>
      <span>Терміново (+1 день) — доплата +20%</span><i>✦</i>
      <span>Самовивіз в Alkmaar · доставка по Нідерландах</span><i>✦</i>
      <span>Бенто — від 1 дня</span><i>✦</i>`;

    headerHost.innerHTML = `
      <div class="hdr">
        <div class="hdr__ticker" aria-label="Умови замовлення">
          <div class="hdr__ticker-track">${tickerItems}${tickerItems}</div>
        </div>
        <div class="hdr__bar">
          <a class="hdr__logo" href="${p("index.html")}" aria-label="Mariday Cake — на головну">
            <img src="${p("img/cakes/cherries.png")}" alt="">
            <span class="hdr__mark">Mariday</span>
            <span class="hdr__sub">cake</span>
          </a>
          <nav class="hdr__nav" aria-label="Головне меню">
            <div class="hdr__drop">
              <button type="button" class="hdr__link" aria-haspopup="true">Торти <i aria-hidden="true">▾</i></button>
              <div class="hdr__menu">
                <a href="${p("pages/cakes.html")}"${cur("cakes.html")}>Каталог тортів <b>→</b></a>
                <a href="${p("pages/constructor.html")}"${cur("constructor.html")}>Конструктор <b>→</b></a>
                <a href="${p("pages/bento.html")}"${cur("bento.html")}>Міні-торти / бенто <b>→</b></a>
                <a href="${p("pages/flavors.html")}"${cur("flavors.html")}>Карта смаків <b>→</b></a>
                <a href="${p("pages/cake-price.html")}"${cur("cake-price.html")}>З чого складається ціна <b>→</b></a>
              </div>
            </div>
            <a class="hdr__link" href="${p("pages/desserts.html")}"${cur("desserts.html")}>Десерти</a>
            <div class="hdr__drop">
              <button type="button" class="hdr__link" aria-haspopup="true"${["weddings.html", "corporate.html", "gift.html"].includes(here) ? ' aria-current="page"' : ""}>Свята <i aria-hidden="true">▾</i></button>
              <div class="hdr__menu">
                <a href="${p("pages/weddings.html")}"${cur("weddings.html")}>Весільні торти <b>→</b></a>
                <a href="${p("pages/desserts.html")}">Candy bar під ключ <b>→</b></a>
                <a href="${p("pages/corporate.html")}"${cur("corporate.html")}>Для бізнесу <b>→</b></a>
                <a href="${p("pages/gift.html")}"${cur("gift.html")}>Подарунковий сертифікат <b>→</b></a>
              </div>
            </div>
            <div class="hdr__drop">
              <button type="button" class="hdr__link" aria-haspopup="true"${["about.html", "reviews.html"].includes(here) || here.startsWith("journal") ? ' aria-current="page"' : ""}>Про нас <i aria-hidden="true">▾</i></button>
              <div class="hdr__menu">
                <a href="${p("pages/about.html")}"${cur("about.html")}>Наша історія <b>→</b></a>
                <a href="${p("pages/reviews.html")}"${cur("reviews.html")}>Відгуки <b>→</b></a>
                <a href="${p("pages/journal.html")}"${cur("journal.html")}>Журнал <b>→</b></a>
              </div>
            </div>
            <a class="hdr__link" href="${p("pages/delivery.html")}"${cur("delivery.html")}>Доставка</a>
            <a class="hdr__link" href="${p("pages/contacts.html")}"${cur("contacts.html")}>Контакти</a>
            <a class="hdr__link" href="${p("pages/faq.html")}"${cur("faq.html")}>FAQ</a>
          </nav>
          <div class="hdr__actions">
            <a class="hdr__cta" href="${p("pages/constructor.html")}">Замовити</a>
            <button class="hdr__cart" id="cart-open" type="button" aria-label="Кошик">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>
              <span class="hdr__count" id="cart-count">0</span>
            </button>
            <button class="hdr__burger" id="nav-burger" type="button" aria-label="Меню" aria-expanded="false" aria-controls="mobile-nav"><i></i><i></i></button>
          </div>
        </div>
      </div>
      <div class="mnav" id="mobile-nav" aria-hidden="true" data-lenis-prevent>
        <img class="mnav__cherry mnav__cherry--a" src="${p("img/cakes/cherries.png")}" alt="">
        <img class="mnav__cherry mnav__cherry--b" src="${p("img/cakes/cherries.png")}" alt="">
        <nav class="mnav__links" aria-label="Мобільне меню">
          <a style="--i:0" href="${p("pages/cakes.html")}"><small>01</small>Каталог тортів</a>
          <a style="--i:1" href="${p("pages/constructor.html")}"><small>02</small>Конструктор</a>
          <a style="--i:2" href="${p("pages/bento.html")}"><small>03</small>Бенто</a>
          <a style="--i:3" href="${p("pages/flavors.html")}"><small>04</small>Карта смаків</a>
          <a style="--i:4" href="${p("pages/desserts.html")}"><small>05</small>Десерти</a>
          <a style="--i:5" href="${p("pages/delivery.html")}"><small>06</small>Доставка</a>
          <a style="--i:6" href="${p("pages/about.html")}"><small>07</small>Про нас</a>
          <a style="--i:7" href="${p("pages/contacts.html")}"><small>08</small>Контакти</a>
          <a style="--i:8" href="${p("pages/faq.html")}"><small>09</small>FAQ</a>
        </nav>
        <nav class="mnav__more" aria-label="Ще сторінки">
          <a href="${p("pages/weddings.html")}">💍 Весілля</a>
          <a href="${p("pages/reviews.html")}">★ Відгуки</a>
          <a href="${p("pages/journal.html")}">📖 Журнал</a>
          <a href="${p("pages/gift.html")}">🎁 Сертифікат</a>
          <a href="${p("pages/corporate.html")}">🤝 Для бізнесу</a>
        </nav>
        <div class="mnav__foot">
          <a class="mnav__cta" href="${p("pages/constructor.html")}">Зібрати свій торт</a>
          <div class="mnav__social">
            <a href="https://www.instagram.com/mariday.cake/" target="_blank" rel="noopener">Instagram</a>
            <a href="https://wa.me/31600000000" target="_blank" rel="noopener">WhatsApp</a>
          </div>
          <p class="mnav__note">з любов'ю з Alkmaar ♥</p>
        </div>
      </div>
    `;

    footerHost.innerHTML = `
      <div class="footer-hello">
        <p class="footer-kicker">( з любов'ю з Alkmaar ♥ )</p>
        <a class="footer-ig" href="https://www.instagram.com/mariday.cake/" target="_blank" rel="noopener">@mariday.cake <i aria-hidden="true">↗</i></a>
      </div>
      <div class="footer-grid">
        <div>
          <div class="footer-brand">MARIDAY CAKE</div>
          <p>Luxury cakes · Alkmaar, Nederland<br>Весільні торти · бенто · candy bar</p>
          <a class="footer-cta" href="${p("pages/constructor.html")}">Зібрати свій торт →</a>
        </div>
        <div>
          <h4>Каталог</h4>
          <a href="${p("pages/cakes.html")}">Торти</a>
          <a href="${p("pages/bento.html")}">Бенто</a>
          <a href="${p("pages/desserts.html")}">Десерти</a>
          <a href="${p("pages/flavors.html")}">Смаки</a>
          <a href="${p("pages/weddings.html")}">Весільні торти</a>
          <a href="${p("pages/gift.html")}">Сертифікати</a>
        </div>
        <div>
          <h4>Клієнтам</h4>
          <a href="${p("pages/delivery.html")}">Доставка і оплата</a>
          <a href="${p("pages/cake-price.html")}">Ціноутворення</a>
          <a href="${p("pages/faq.html")}">FAQ</a>
          <a href="${p("pages/contacts.html")}">Контакти</a>
          <a href="${p("pages/corporate.html")}">Для бізнесу</a>
        </div>
        <div>
          <h4>Mariday</h4>
          <a href="${p("pages/about.html")}">Про нас</a>
          <a href="${p("pages/reviews.html")}">Відгуки</a>
          <a href="${p("pages/journal.html")}">Журнал</a>
        </div>
        <div>
          <h4>Документи</h4>
          <a href="${p("pages/privacy.html")}">Політика конфіденційності</a>
          <a href="${p("pages/offer.html")}">Публічна оферта</a>
        </div>
      </div>
      <div class="footer-word" aria-hidden="true">${"MARIDAY".split("").map((ch) => `<span>${ch}</span>`).join("")}<img src="${p("img/cakes/cherries.png")}" alt=""></div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Mariday Cake · officially registered brand</span>
        <button type="button" class="to-top" id="to-top">Нагору <i aria-hidden="true">↑</i></button>
      </div>
    `;

    // drawers
    if (!document.getElementById("cart-drawer")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
        <aside class="drawer" id="cart-drawer" aria-hidden="true" data-lenis-prevent>
          <div class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div class="drawer-head">
              <h3 id="cart-title">Кошик <sup id="cart-head-count">0</sup></h3>
              <button type="button" class="icon-btn" id="cart-close" aria-label="Закрити">×</button>
            </div>
            <div class="drawer-body" id="cart-items"></div>
            <div class="drawer-foot">
              <div class="cart-total"><span>Разом</span><strong id="cart-total">€0</strong></div>
              <p class="cart-note">Самовивіз у Alkmaar — безкоштовно · доставка за розрахунком</p>
              <button type="button" class="btn btn-primary btn-block" id="checkout-open">Оформити замовлення →</button>
            </div>
          </div>
        </aside>
        <div class="modal" id="order-modal" aria-hidden="true" data-lenis-prevent>
          <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="order-title">
            <div class="drawer-head">
              <h3 id="order-title">Оформлення замовлення</h3>
              <button type="button" class="icon-btn" id="order-close" aria-label="Закрити">×</button>
            </div>
            <div class="order-summary" id="order-summary"></div>
            <form id="order-form" class="order-form" novalidate>
              <div class="order-grid">
                <label>Ваше ім’я<input name="name" required autocomplete="name" placeholder="Марія"></label>
                <label>Телефон / WhatsApp<input name="phone" required autocomplete="tel" inputmode="tel" placeholder="+31 6 ..."></label>
              </div>
              <label>Email<input name="email" type="email" required autocomplete="email" placeholder="you@email.com"></label>
              <div class="order-grid">
                <label>Дата видачі<input name="date" type="date" required></label>
                <label>Час<input name="time" type="time" value="15:00"></label>
              </div>
              <p class="order-urgent" id="order-urgent" hidden>⚡ Термінове замовлення — до тортів додається +20% (крім бенто). Менеджер підтвердить можливість.</p>
              <fieldset class="order-switch">
                <legend>Спосіб отримання</legend>
                <label class="radio"><input type="radio" name="fulfillment" value="pickup" checked><span>Самовивіз · Alkmaar</span></label>
                <label class="radio"><input type="radio" name="fulfillment" value="delivery"><span>Доставка по NL</span></label>
              </fieldset>
              <label id="order-address" hidden>Адреса доставки<textarea name="address" rows="2" placeholder="Вулиця, будинок, місто"></textarea></label>
              <label>Напис на торті<input name="inscription" maxlength="40" placeholder="Якщо потрібен напис"></label>
              <label>Коментар до замовлення<textarea name="comment" rows="3" placeholder="Побажання, алергії, референси"></textarea></label>
              <label class="check"><input type="checkbox" name="remember"> Запам’ятати контакти в браузері</label>
              <label class="check"><input type="checkbox" name="offer" required> Погоджуюсь з <a href="${p("pages/offer.html")}" target="_blank">публічною офертою</a></label>
              <p class="form-error" id="order-error" role="alert" hidden></p>
              <button type="submit" class="btn btn-primary btn-block">Сформувати заявку</button>
              <p class="form-note">Заявка вважається оформленою після підтвердження менеджером і передоплати.</p>
            </form>
            <div class="order-done" id="order-done" hidden>
              <div class="order-done__seal" aria-hidden="true"><img src="${p("img/cakes/cherries.png")}" alt=""></div>
              <p class="order-done__kicker">Заявка <b id="order-number"></b></p>
              <h4>Майже готово!</h4>
              <p>Надішліть заявку менеджеру в один клік — ми відповімо щодо деталей і передоплати.</p>
              <div class="order-done__actions">
                <a class="btn btn-primary" id="order-wa" target="_blank" rel="noopener">Надіслати у WhatsApp</a>
                <a class="btn btn-outline" id="order-mail">Надіслати на email</a>
                <button type="button" class="btn btn-ghost" id="order-copy">Скопіювати текст для Instagram</button>
              </div>
            </div>
          </div>
        </div>
        <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
        `
      );
    }

    bindChrome();
    refreshCartUI();
  }

  const C = () => (window.MARIDAY && MARIDAY.contacts) || { whatsapp: "31600000000", email: "hello@mariday.cake", instagram: "https://www.instagram.com/mariday.cake/" };
  let lastFocus = null;
  let orderText = "";

  function isoDate(d) {
    const z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }

  function bindChrome() {
    bindHeader();

    document.getElementById("cart-open")?.addEventListener("click", openCart);
    document.getElementById("cart-close")?.addEventListener("click", closeCart);
    document.getElementById("cart-drawer")?.addEventListener("click", (e) => {
      if (e.target.id === "cart-drawer") closeCart();
    });
    document.getElementById("checkout-open")?.addEventListener("click", () => {
      closeCart();
      openOrder();
    });
    document.getElementById("order-close")?.addEventListener("click", closeOrder);
    document.getElementById("order-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "order-modal") closeOrder();
    });
    document.getElementById("to-top")?.addEventListener("click", () => {
      if (window.MaridayLenis) window.MaridayLenis.scrollTo(0, { duration: 1.4 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (document.getElementById("order-modal")?.classList.contains("open")) closeOrder();
      else if (document.getElementById("cart-drawer")?.classList.contains("open")) closeCart();
    });

    const form = document.getElementById("order-form");
    const saved = MaridayContacts.get();
    if (saved && form) {
      form.name.value = saved.name || "";
      form.email.value = saved.email || "";
      form.phone.value = saved.phone || "";
      form.remember.checked = true;
    }

    if (form) {
      const today = new Date();
      form.date.min = isoDate(today);
      // a day picked on the home page's tear-off calendar
      try {
        const picked = sessionStorage.getItem("mariday:date");
        if (picked && picked >= form.date.min && !form.date.value) form.date.value = picked;
      } catch (_) {}
      const syncForm = () => {
        const delivery = form.fulfillment.value === "delivery";
        const addr = document.getElementById("order-address");
        addr.hidden = !delivery;
        form.address.required = delivery;
        const urgent = document.getElementById("order-urgent");
        const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const nonBento = MaridayCart.get().some((i) => i.id !== "bento" && !i.dessert);
        urgent.hidden = !(form.date.value && form.date.value <= isoDate(tomorrow) && nonBento);
      };
      form.addEventListener("change", syncForm);
      form.addEventListener("input", (e) => {
        if (e.target.name === "date") syncForm();
        e.target.classList.remove("is-invalid");
      });
      form._sync = syncForm;
    }

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const err = document.getElementById("order-error");
      const bad = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
      bad.forEach((el) => el.classList.add("is-invalid"));
      if (bad.length) {
        err.hidden = false;
        err.textContent = bad.some((el) => el.name === "offer")
          ? "Підтвердіть згоду з публічною офертою та заповніть позначені поля."
          : "Будь ласка, заповніть позначені поля.";
        bad[0].focus();
        return;
      }
      err.hidden = true;
      const fd = new FormData(form);
      if (fd.get("remember")) {
        MaridayContacts.save({ name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone") });
      }
      const cart = MaridayCart.get();
      const num = "M-" + Date.now().toString(36).slice(-5).toUpperCase();
      const lines = cart.map((i) => `• ${i.name}${i.meta ? " (" + i.meta + ")" : ""} ×${i.qty} — ${formatEUR(i.price * i.qty)}`);
      orderText = [
        `Заявка ${num} — Mariday Cake`,
        "",
        ...lines,
        `Разом орієнтовно: ${formatEUR(MaridayCart.total())}`,
        "",
        `Ім'я: ${fd.get("name")}`,
        `Телефон: ${fd.get("phone")}`,
        `Email: ${fd.get("email")}`,
        `Дата: ${fd.get("date")} ${fd.get("time") || ""}`,
        `Отримання: ${fd.get("fulfillment") === "delivery" ? "доставка — " + fd.get("address") : "самовивіз, Alkmaar"}`,
        fd.get("inscription") ? `Напис: ${fd.get("inscription")}` : "",
        fd.get("comment") ? `Коментар: ${fd.get("comment")}` : "",
      ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");

      try {
        const hist = JSON.parse(localStorage.getItem("mariday_orders") || "[]");
        hist.push({ num, at: new Date().toISOString(), text: orderText });
        localStorage.setItem("mariday_orders", JSON.stringify(hist.slice(-10)));
      } catch { /* storage unavailable */ }

      document.getElementById("order-number").textContent = num;
      document.getElementById("order-wa").href = `https://wa.me/${C().whatsapp}?text=${encodeURIComponent(orderText)}`;
      document.getElementById("order-mail").href = `mailto:${C().email}?subject=${encodeURIComponent("Заявка " + num)}&body=${encodeURIComponent(orderText)}`;
      form.hidden = true;
      document.getElementById("order-summary").hidden = true;
      document.getElementById("order-done").hidden = false;
      MaridayCart.clear();
      form.reset();
      if (saved || fd.get("remember")) {
        const s = MaridayContacts.get();
        if (s) { form.name.value = s.name; form.email.value = s.email; form.phone.value = s.phone; form.remember.checked = true; }
      }
      burstConfetti(document.querySelector(".order-done__seal"));
    });

    document.getElementById("order-copy")?.addEventListener("click", async (e) => {
      try {
        await navigator.clipboard.writeText(orderText);
        showToast("Текст заявки скопійовано — вставте його в Direct @mariday.cake");
      } catch {
        showToast("Не вдалося скопіювати — надішліть заявку у WhatsApp або email");
      }
      e.currentTarget.blur();
    });

    document.getElementById("cart-items")?.addEventListener("click", (e) => {
      const row = e.target.closest(".cart-row");
      if (!row) return;
      const uid = row.dataset.uid;
      const item = MaridayCart.get().find((i) => i.uid === uid);
      if (!item) return;
      if (e.target.closest("[data-qty='+']")) MaridayCart.setQty(uid, item.qty + 1);
      else if (e.target.closest("[data-qty='-']")) MaridayCart.setQty(uid, item.qty - 1);
      else if (e.target.closest(".remove-item")) {
        row.classList.add("is-leaving");
        setTimeout(() => MaridayCart.remove(uid), 280);
      }
    });

    document.addEventListener("mariday:cart", refreshCartUI);
  }

  function bindHeader() {
    const hdr = document.querySelector(".hdr");
    const burger = document.getElementById("nav-burger");
    const menu = document.getElementById("mobile-nav");
    if (!hdr || !burger || !menu) return;

    const setMenu = (open) => {
      menu.classList.toggle("open", open);
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Закрити меню" : "Меню");
      menu.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("mnav-open", open);
      document.dispatchEvent(new CustomEvent("mariday:menu", { detail: { open } }));
    };
    burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) setMenu(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 1000 && menu.classList.contains("open")) setMenu(false); });

    // Glass background after leaving the top; hide on scroll down, reveal on scroll up
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      hdr.classList.toggle("hdr--solid", y > 40);
      if (document.body.classList.contains("mnav-open") || y < 160) hdr.classList.remove("hdr--hidden");
      else if (dy > 6) hdr.classList.add("hdr--hidden");
      else if (dy < -6) hdr.classList.remove("hdr--hidden");
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function lockScroll(lock) {
    document.documentElement.classList.toggle("is-locked", lock);
    if (window.MaridayLenis) lock ? window.MaridayLenis.stop() : window.MaridayLenis.start();
  }

  function openCart() {
    const el = document.getElementById("cart-drawer");
    lastFocus = document.activeElement;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    renderCartItems();
    lockScroll(true);
    setTimeout(() => document.getElementById("cart-close")?.focus(), 50);
  }
  function closeCart() {
    const el = document.getElementById("cart-drawer");
    if (!el.classList.contains("open")) return;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    lockScroll(false);
    lastFocus?.focus?.();
  }
  function openOrder() {
    if (!MaridayCart.count()) {
      showToast("Спочатку додайте торт у кошик");
      return;
    }
    const el = document.getElementById("order-modal");
    const form = document.getElementById("order-form");
    form.hidden = false;
    document.getElementById("order-done").hidden = true;
    const sum = document.getElementById("order-summary");
    sum.hidden = false;
    sum.innerHTML = MaridayCart.get().map((i) => `
      <div class="order-summary__row">${i.image ? `<img src="${escapeHTML(i.image)}" alt="">` : "<span></span>"}<span>${escapeHTML(i.name)} <small>×${i.qty}</small></span><b>${formatEUR(i.price * i.qty)}</b></div>`).join("") +
      `<div class="order-summary__total"><span>Разом орієнтовно</span><b>${formatEUR(MaridayCart.total())}</b></div>`;
    form._sync?.();
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    lockScroll(true);
    setTimeout(() => form.name.focus(), 80);
  }
  function closeOrder() {
    const el = document.getElementById("order-modal");
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    lockScroll(false);
  }

  function renderCartItems() {
    const host = document.getElementById("cart-items");
    const items = MaridayCart.get();
    if (!items.length) {
      host.innerHTML = `
        <div class="empty-cart">
          <img src="${p("img/cakes/cherries.png")}" alt="">
          <p class="empty-cart__title">Тут поки порожньо</p>
          <p>Оберіть торт у каталозі або зберіть свій у конструкторі.</p>
          <div class="empty-cart__links">
            <a class="btn btn-primary" href="${p("pages/cakes.html")}">До каталогу</a>
            <a class="btn btn-outline" href="${p("pages/constructor.html")}">Конструктор</a>
          </div>
        </div>`;
      return;
    }
    host.innerHTML = items
      .map(
        (i) => `
      <div class="cart-row" data-uid="${escapeHTML(i.uid)}">
        <div class="cart-row__img">${i.image ? `<img src="${escapeHTML(i.image)}" alt="">` : `<img class="is-icon" src="${p("img/cakes/cherries.png")}" alt="">`}</div>
        <div class="cart-row__info">
          <strong>${escapeHTML(i.name)}</strong>
          ${i.meta ? `<div class="muted">${escapeHTML(i.meta)}</div>` : ""}
          <div class="cart-row__bottom">
            <div class="qty" aria-label="Кількість">
              <button type="button" data-qty="-" aria-label="Менше">−</button>
              <span>${i.qty}</span>
              <button type="button" data-qty="+" aria-label="Більше">+</button>
            </div>
            <b>${formatEUR(i.price * i.qty)}</b>
          </div>
        </div>
        <button type="button" class="icon-btn remove-item" aria-label="Видалити ${escapeHTML(i.name)}">×</button>
      </div>`
      )
      .join("");
  }

  function refreshCartUI() {
    const c = document.getElementById("cart-count");
    const hc = document.getElementById("cart-head-count");
    const t = document.getElementById("cart-total");
    const n = MaridayCart.count();
    if (c) c.textContent = n;
    if (hc) hc.textContent = n;
    if (t) t.textContent = formatEUR(MaridayCart.total());
    const btn = document.getElementById("checkout-open");
    if (btn) btn.disabled = !n;
    if (document.getElementById("cart-drawer")?.classList.contains("open")) {
      renderCartItems();
    }
  }

  let toastTimer = null;
  window.showToast = function (msg, action) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.innerHTML = `<img src="${p("img/cakes/cherries.png")}" alt=""><span>${escapeHTML(msg)}</span>${action ? `<button type="button">${escapeHTML(action.label)}</button>` : ""}`;
    if (action) t.querySelector("button").addEventListener("click", () => { action.run(); t.classList.remove("show"); });
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => { if (!t.classList.contains("show")) t.hidden = true; }, 350);
    }, 3600);
  };

  // A little photo (or cherry) flies from the clicked element into the cart icon
  window.flyToCart = function (fromEl, imgSrc) {
    const cart = document.getElementById("cart-open");
    if (!fromEl || !cart || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = fromEl.getBoundingClientRect();
    const b = cart.getBoundingClientRect();
    const dot = document.createElement("img");
    dot.className = "fly-dot";
    dot.src = imgSrc || p("img/cakes/cherries.png");
    dot.alt = "";
    document.body.appendChild(dot);
    const sx = a.left + a.width / 2 - 32, sy = a.top + a.height / 2 - 32;
    const ex = b.left + b.width / 2 - 32, ey = b.top + b.height / 2 - 32;
    const anim = dot.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) scale(1) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${(sx + ex) / 2}px, ${Math.min(sy, ey) - 140}px) scale(0.8) rotate(-180deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${ex}px, ${ey}px) scale(0.2) rotate(-320deg)`, opacity: 0.4 },
      ],
      { duration: 900, easing: "cubic-bezier(0.5, 0, 0.3, 1)" }
    );
    anim.onfinish = () => {
      dot.remove();
      cart.classList.remove("is-bump");
      void cart.offsetWidth;
      cart.classList.add("is-bump");
    };
  };

  function burstConfetti(anchor) {
    if (!anchor || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#6d0809", "#f5bcc8", "#e2849a", "#bcd6f3", "#fbe6b8", "#ffffff"];
    for (let i = 0; i < 36; i++) {
      const s = document.createElement("i");
      s.className = "confetti-bit";
      s.style.background = colors[i % colors.length];
      anchor.appendChild(s);
      const ang = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 110;
      s.animate(
        [
          { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist + 40}px)) rotate(${Math.random() * 540}deg)`, opacity: 0 },
        ],
        { duration: 900 + Math.random() * 500, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }
      ).onfinish = () => s.remove();
    }
  }
  window.burstConfetti = burstConfetti;

  window.openOrderModal = openOrder;
  window.openCartDrawer = openCart;
  window.addToCartAndNotify = function (item, fromEl) {
    MaridayCart.add(item);
    flyToCart(fromEl, item.image);
    showToast(`«${item.name}» у кошику`, { label: "Відкрити", run: openCart });
  };

  MARIDAY.onReady(mountLayout);
})();
