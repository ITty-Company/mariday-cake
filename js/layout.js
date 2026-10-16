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

    // The phone menu is a short centred list; the constructor (the way to order on phones) carries a small star
    function menuLinks() {
      const links = [
        ["cakes.html", "Каталог тортів"],
        ["constructor.html", "Конструктор", " mnav__link--cta"],
        ["bento.html", "Бенто"],
        ["desserts.html", "Десерти"],
        ["weddings.html", "Весілля"],
        ["flavors.html", "Карта смаків"],
      ];
      return links.map(([file, name, mod = ""], i) => `
        <a class="mnav__link${mod}" style="--i:${i}" href="${p(`pages/${file}`)}"${cur(file)}>${name}</a>`).join("");
    }

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
              <span class="hdr__count" id="cart-count" data-n="0">0</span>
            </button>
            <button class="hdr__burger" id="nav-burger" type="button" aria-label="Меню" aria-expanded="false" aria-controls="mobile-nav"><i></i><i></i></button>
          </div>
        </div>
      </div>
      <div class="mnav" id="mobile-nav" aria-hidden="true" data-lenis-prevent>
        <div class="mnav__in">
          <nav class="mnav__list" aria-label="Мобільне меню">${menuLinks()}</nav>
          <div class="mnav__end">
            <nav class="mnav__more" aria-label="Ще сторінки">
              ${[
                ["delivery.html", "Доставка"], ["contacts.html", "Контакти"], ["about.html", "Про нас"], ["reviews.html", "Відгуки"],
                ["faq.html", "FAQ"], ["journal.html", "Журнал"], ["gift.html", "Сертифікат"], ["corporate.html", "Для бізнесу"],
              ].map(([f, name], i) => `<a style="--i:${i}" href="${p(`pages/${f}`)}"${cur(f)}>${name}</a>`).join("")}
            </nav>
            <div class="mnav__foot">
              <a class="mnav__soc" href="https://www.instagram.com/mariday.cake/" target="_blank" rel="noopener" aria-label="Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.6"/></svg>
              </a>
              <a class="mnav__soc" href="https://wa.me/31600000000" target="_blank" rel="noopener" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5l1.2-3.9A8 8 0 1 1 8.6 18.4Z"/><path d="M9.2 8.6c.3 2.9 3 5.9 6 6.4l1-1.3-1.9-1-.8.8c-1.2-.5-2.5-1.8-3-3l.8-.8-1-1.9Z"/></svg>
              </a>
            </div>
          </div>
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
        <a class="footer-admin" href="${p("admin/index.html")}" rel="nofollow">Вхід для адміністратора</a>
        <button type="button" class="to-top" id="to-top">Нагору <i aria-hidden="true">↑</i></button>
      </div>
    `;

    // drawers
    if (!document.getElementById("cart-drawer")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
        <aside class="drawer cbox is-empty" id="cart-drawer" aria-hidden="true" data-lenis-prevent>
          <div class="drawer-panel cbox__panel" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1">
            <div class="cbox__awning" data-cb-drag aria-hidden="true"><i class="cbox__grip"></i></div>
            <div class="cbox__sign" data-cb-drag>
              <h3 class="cbox__title" id="cart-title"><span class="cbox__word">Кошик</span><span class="cbox__script">смаколиків</span><span class="cbox__count" id="cart-head-count" data-n="0">0</span></h3>
              <button type="button" class="cbox__close" id="cart-close" aria-label="Закрити">×</button>
            </div>
            <div class="cbox__body" id="cart-items"></div>
            <div class="cbox__receipt">
              <fieldset class="cb-way">
                <legend class="cb-sr">Як отримати замовлення</legend>
                <label class="cb-way__opt cb-way__opt--pickup">
                  <input type="radio" name="cb-way" value="pickup" checked>
                  <span class="cb-way__card">
                    <svg class="cb-way__ico" viewBox="0 0 32 32" aria-hidden="true"><path class="cb-way__awn" d="M4 11.5h24l-2.4-6H6.4z"/><path class="cb-way__awn" d="M4 11.5a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0"/><path d="M6.5 15v11h19V15M13 26v-6.5h6V26"/></svg>
                    <b>Самовивіз</b><small>Alkmaar · безкоштовно</small>
                  </span>
                </label>
                <label class="cb-way__opt cb-way__opt--delivery">
                  <input type="radio" name="cb-way" value="delivery">
                  <span class="cb-way__card">
                    <svg class="cb-way__ico" viewBox="0 0 32 32" aria-hidden="true"><g class="cb-way__van"><path d="M2.5 8.5h15.5v13.5H2.5zM18 12.5h6.2l4.3 5.3v4.2H18z"/><circle cx="8.5" cy="23" r="2.6"/><circle cx="22.5" cy="23" r="2.6"/></g></svg>
                    <b>Доставка</b><small>по NL · за розрахунком</small>
                  </span>
                </label>
              </fieldset>
              <div class="cb-pay">
                <div class="cb-total"><span id="cart-lines">Разом</span><strong id="cart-total">€0</strong></div>
                <button type="button" class="btn btn-primary" id="checkout-open">Оформити <i aria-hidden="true">→</i></button>
              </div>
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
              <div class="order-photos" id="order-photos"></div>
              <input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
              <label class="check"><input type="checkbox" name="remember"> Запам’ятати контакти в браузері</label>
              <label class="check"><input type="checkbox" name="offer" required> Погоджуюсь з <a href="${p("pages/offer.html")}" target="_blank">публічною офертою</a></label>
              <p class="form-error" id="order-error" role="alert" hidden></p>
              <button type="submit" class="btn btn-primary btn-block">Сформувати заявку</button>
              <p class="form-note">Заявка вважається оформленою після підтвердження менеджером і передоплати.</p>
            </form>
            <div class="order-done" id="order-done" hidden>
              <div class="order-done__seal" aria-hidden="true"><img src="${p("img/cakes/cherries.png")}" alt=""></div>
              <p class="order-done__kicker">Заявка <b id="order-number"></b></p>
              <h4 id="order-done-title">Майже готово!</h4>
              <p id="order-done-text">Надішліть заявку менеджеру в один клік — ми відповімо щодо деталей і передоплати.</p>
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
    // photos for an idea and orders that go straight to the team — admin panel + Telegram (js/ideas.js)
    if (!window.MaridayIdeas && !document.querySelector('script[src*="js/ideas.js"]')) {
      const s = document.createElement("script");
      s.src = p("js/ideas.js?v=1");
      document.head.append(s);
    }
    // a link to any page with #cart opens the box straight away
    if (location.hash === "#cart") openCart();
  }

  const C = () => (window.MARIDAY && MARIDAY.contacts) || { whatsapp: "31600000000", email: "hello@mariday.cake", instagram: "https://www.instagram.com/mariday.cake/" };
  let lastFocus = null;
  let orderText = "";
  let orderBoard = null; // photos for the order (js/ideas.js), created when the form first opens

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

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form._sending) return;
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
      if (fd.get("website")) return; // only a bot fills the hidden field
      if (fd.get("remember")) {
        MaridayContacts.save({ name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone") });
      }
      const btn = form.querySelector('[type="submit"]');
      const label = btn.textContent;
      form._sending = true;
      btn.disabled = true;
      // the order goes with every photo, so ones still uploading are waited for
      if (orderBoard && orderBoard.busy()) {
        btn.textContent = "Завантажую фото…";
        await orderBoard.idle();
      }
      const photos = orderBoard ? orderBoard.urls() : [];
      const cart = MaridayCart.get();
      const num = "M-" + Date.now().toString(36).slice(-5).toUpperCase();
      const delivery = fd.get("fulfillment") === "delivery";
      const design = (i) => (i.id === "custom" && /^https?:/.test(i.variant || "") ? i.variant : "");
      // the cart's short «ідея: …» is dropped where the full idea follows on its own line
      const metaOf = (i) => (i.idea ? (i.meta || "").split(" · ").filter((s) => !s.startsWith("ідея: ")).join(" · ") : i.meta || "");
      const lines = cart.flatMap((i) => [
        `• ${i.name}${metaOf(i) ? " (" + metaOf(i) + ")" : ""} ×${i.qty} — ${formatEUR(i.price * i.qty)}`,
        i.idea ? `   Ідея: ${i.idea}` : "",
        design(i) ? `   Дизайн: ${design(i)}` : "",
      ]).filter(Boolean);
      const core = [
        `Заявка ${num} — Mariday Cake`,
        "",
        ...lines,
        `Разом орієнтовно: ${formatEUR(MaridayCart.total())}`,
        "",
        `Ім'я: ${fd.get("name")}`,
        `Телефон: ${fd.get("phone")}`,
        `Email: ${fd.get("email")}`,
        `Дата: ${fd.get("date")} ${fd.get("time") || ""}`,
        `Отримання: ${delivery ? "доставка — " + fd.get("address") : "самовивіз, Alkmaar"}`,
        fd.get("inscription") ? `Напис: ${fd.get("inscription")}` : "",
        fd.get("comment") ? `Коментар: ${fd.get("comment")}` : "",
      ];
      const tidy = (a) => a.filter((l, i) => l !== "" || a[i - 1] !== "").join("\n");
      // WhatsApp / email can't carry the photos themselves — they get the links
      orderText = tidy([...core, ...(photos.length ? ["", `Фото (${photos.length}):`, ...photos] : [])]);

      // straight to the team: the admin panel's «Заявки», and Telegram via the database
      let sent = false;
      if (window.MaridayIdeas && MaridayIdeas.live) {
        btn.textContent = "Надсилаю заявку…";
        const cut = (v, n) => String(v || "").trim().slice(0, n);
        try {
          await MaridayIdeas.send({
            number: num,
            name: cut(fd.get("name"), 80),
            phone: cut(fd.get("phone"), 40),
            email: cut(fd.get("email"), 120),
            date: cut(`${fd.get("date")} ${fd.get("time") || ""}`, 40),
            way: delivery ? "delivery" : "pickup",
            address: delivery ? cut(fd.get("address"), 300) : "",
            items: cart.map((i) => ({
              name: i.name, meta: metaOf(i), qty: i.qty, price: i.price,
              ...(i.idea ? { idea: i.idea } : {}),
              ...(design(i) ? { link: design(i) } : {}),
              ...(i.image ? { image: new URL(fixSrc(i.image), location.href).href } : {}),
            })),
            total: MaridayCart.total(),
            comment: cut([fd.get("inscription") ? `Напис на торті: «${fd.get("inscription")}»` : "", fd.get("comment") || ""].filter(Boolean).join("\n"), 2000),
            photos,
            text: cut(tidy(core), 6000),
          });
          sent = true;
        } catch (x) {
          console.warn("Mariday: the order did not reach the team", x);
        }
      }
      form._sending = false;
      btn.disabled = false;
      btn.textContent = label;

      try {
        const hist = JSON.parse(localStorage.getItem("mariday_orders") || "[]");
        hist.push({ num, at: new Date().toISOString(), text: orderText, sent });
        localStorage.setItem("mariday_orders", JSON.stringify(hist.slice(-10)));
      } catch { /* storage unavailable */ }

      document.getElementById("order-number").textContent = num;
      document.getElementById("order-wa").href = `https://wa.me/${C().whatsapp}?text=${encodeURIComponent(orderText)}`;
      document.getElementById("order-mail").href = `mailto:${C().email}?subject=${encodeURIComponent("Заявка " + num)}&body=${encodeURIComponent(orderText)}`;
      // sent: the team already has it, WhatsApp is only there to chat; not sent: the old one-click ways
      document.getElementById("order-done-title").textContent = sent ? "Заявку отримано!" : "Майже готово!";
      document.getElementById("order-done-text").textContent = sent
        ? "Кондитер уже бачить її. Напишемо вам у WhatsApp або на email щодо деталей і передоплати."
        : window.MaridayIdeas && MaridayIdeas.live
          ? "Не вдалося надіслати автоматично — надішліть заявку менеджеру в один клік, ми відповімо щодо деталей і передоплати."
          : "Надішліть заявку менеджеру в один клік — ми відповімо щодо деталей і передоплати.";
      const wa = document.getElementById("order-wa");
      wa.textContent = sent ? "Написати нам у WhatsApp" : "Надіслати у WhatsApp";
      wa.className = sent ? "btn btn-outline" : "btn btn-primary";
      document.getElementById("order-mail").style.display = sent ? "none" : "";
      document.getElementById("order-copy").style.display = sent ? "none" : "";
      form.hidden = true;
      document.getElementById("order-summary").hidden = true;
      document.getElementById("order-done").hidden = false;
      MaridayCart.clear();
      orderBoard?.clear();
      try { sessionStorage.removeItem("mariday:ctor-idea"); } catch (_) {}
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
      // «до торта пасують»: a category tab, or a dessert straight into the box (tap again for one more)
      const tab = e.target.closest("[data-cb-tab]");
      if (tab) {
        moreTab = tab.dataset.cbTab;
        drawMore(true);
        return;
      }
      const add = e.target.closest("[data-add-dessert]");
      if (add) {
        const d = ((window.MARIDAY && MARIDAY.desserts) || []).find((x) => x.id === add.dataset.addDessert);
        if (d) {
          MaridayCart.add({ id: d.id, name: d.name, price: d.price, image: d.image, dessert: true, meta: d.unit });
          replay(add, "is-pop");
        }
        return;
      }
      const row = e.target.closest(".cb-item");
      if (!row || row.classList.contains("is-leaving")) return;
      const uid = row.dataset.uid;
      const item = MaridayCart.get().find((i) => i.uid === uid);
      if (!item) return;
      if (e.target.closest("[data-qty='+']")) MaridayCart.setQty(uid, item.qty + 1);
      else if (e.target.closest("[data-qty='-']")) {
        if (item.qty > 1) MaridayCart.setQty(uid, item.qty - 1);
        else leaveRow(row, uid);
      } else if (e.target.closest(".remove-item")) leaveRow(row, uid);
    });
    bindSheetDrag();
    // how they get it: picked in the box, carried over to the order form
    const ways = document.querySelectorAll('#cart-drawer input[name="cb-way"]');
    try {
      const w = sessionStorage.getItem("mariday:way");
      ways.forEach((r) => { r.checked = r.value === (w || "pickup"); });
    } catch (_) {}
    ways.forEach((r) => r.addEventListener("change", () => {
      try { sessionStorage.setItem("mariday:way", r.value); } catch (_) {}
      refreshCartUI();
    }));

    document.addEventListener("mariday:cart", refreshCartUI);
  }

  function bindHeader() {
    const hdr = document.querySelector(".hdr");
    const burger = document.getElementById("nav-burger");
    const menu = document.getElementById("mobile-nav");
    if (!hdr || !burger || !menu) return;

    let menuTint = 0;
    let menuEdge = null;
    let menuPins = [];
    // Safari re-reads its bar colours only while the page scrolls, so a 1px scroll there and back makes it notice
    const nudge = () => {
      const y = window.scrollY;
      window.scrollTo(0, y > 0 ? y - 1 : y + 1);
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
    };
    const setMenu = (open) => {
      menu.classList.toggle("open", open);
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Закрити меню" : "Меню");
      menu.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("mnav-open", open);
      document.dispatchEvent(new CustomEvent("mariday:menu", { detail: { open } }));
      // Safari's bars take their colour from the cherry .mnav-edge layer (css/main.css): it goes in once the menu
      // has opened and is removed as soon as it starts closing, so the bars return to the page with it
      clearTimeout(menuTint);
      if (open) {
        menuTint = setTimeout(() => {
          if (!menuEdge) {
            menuEdge = document.createElement("i");
            menuEdge.className = "mnav-edge";
            menuEdge.setAttribute("aria-hidden", "true");
          }
          document.body.append(menuEdge);
          // a section pinned by the scroll is fixed too, and Safari would take its colour instead: hide it under the menu
          document.querySelectorAll('[style*="position: fixed"]').forEach((el) => {
            if (el.style.visibility !== "hidden") { el.style.visibility = "hidden"; menuPins.push(el); }
          });
          nudge();
        }, 700);
      } else if (menuEdge) {
        menuEdge.remove();
        menuEdge = null;
        menuPins.forEach((el) => (el.style.visibility = ""));
        menuPins = [];
        nudge();
      }
    };
    burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    // everything fits on one screen, so the open menu never scrolls — and neither does the page behind it
    menu.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
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
    // drawn afresh on every opening, so the cakes drop into their cards again
    document.getElementById("cart-items").innerHTML = "";
    renderCartItems();
    refreshCartUI(true);
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    lockScroll(true);
    // focus goes into the box (not onto the × — on a phone that drew a ring round it)
    setTimeout(() => el.querySelector(".cbox__panel")?.focus({ preventScroll: true }), 50);
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
    hideNote();
    form.hidden = false;
    document.getElementById("order-done").hidden = true;
    const sum = document.getElementById("order-summary");
    sum.hidden = false;
    sum.innerHTML = MaridayCart.get().map((i) => `
      <div class="order-summary__row">${i.image || i.shot ? `<img src="${escapeHTML(i.shot || fixSrc(i.image))}" alt="">` : "<span></span>"}<span>${escapeHTML(i.name)} <small>×${i.qty}</small></span><b>${formatEUR(i.price * i.qty)}</b></div>`).join("") +
      `<div class="order-summary__total"><span>Разом орієнтовно</span><b>${formatEUR(MaridayCart.total())}</b></div>`;
    form.fulfillment.value = wayOf();
    form._sync?.();
    // photos: the ones pinned to an idea in the constructor come along, more can be added here
    if (window.MaridayIdeas) {
      orderBoard = orderBoard || MaridayIdeas.board({ hint: "торт, що сподобався, декор, кольори — що завгодно" });
      orderBoard.mount(document.getElementById("order-photos"));
      orderBoard.merge(MaridayCart.get().flatMap((i) => i.photos || []));
    }
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

  /* ── The cart is a patisserie box: every cake stands on its own card in its catalogue colour, as the real
     cut-out popping out of it; desserts and photos without a cut-out are pinned on as little prints. */
  const TONES = [["#f6dbe0", "#c9506d"], ["#e5ddf3", "#7b5ea7"], ["#f6e6bf", "#a3701a"], ["#dbefed", "#2f8f83"], ["#efd3cd", "#8e2a22"], ["#f9d6e3", "#cf467f"]];
  // cut-outs from photos that crop the cake or its plate would show the cut edge (same list as the catalogue)
  const CROPPED = ["berries", "slice", "strawslice", "tiramisu", "meringue"];
  const esc = (s) => escapeHTML(s);
  const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many);
  const photo = (name) => (window.MARIDAY && MARIDAY.img ? MARIDAY.img(name) : p(`img/cakes/${name}.jpg`));
  const wholeCut = (c) => (window.MARIDAY && MARIDAY.cutout && (c.cutout || !CROPPED.includes(c.img)) ? MARIDAY.cutout(c) : "");
  // a photo saved from another page keeps that page's "../": point it at this one
  const fixSrc = (s) => (!s ? "" : /^(https?:|data:|blob:|\/)/.test(s) ? s : p(String(s).replace(/^(\.\.\/)+/, "")));

  function lookOf(it, n) {
    const M = window.MARIDAY || {};
    const [bg, ac] = TONES[n % TONES.length];
    const cake = (M.cakes || []).find((c) => c.id === it.id);
    if (cake) {
      const cut = wholeCut(cake);
      return { src: cut || photo(cake.img), kind: cut ? "cut" : "photo", bg: cake.bg || bg, ac: cake.accent || ac };
    }
    const d = it.dessert && (M.desserts || []).find((x) => x.id === it.id);
    if (d) return { src: photo(d.img), kind: "photo", bg, ac };
    if (it.image) return { src: fixSrc(it.image), kind: "photo", bg, ac };
    // a cake of their own design: its snapshot from the constructor stands on the card like a catalogue cut-out…
    if (it.shot) return { src: it.shot, kind: "cut", bg: "#f9d6e3", ac: "#cf467f" };
    // …or, for one packed before snapshots existed, the cherries stand in for it
    return { src: p("img/cakes/cherries.png"), kind: "icon", bg: "#f9d6e3", ac: "#cf467f" };
  }

  function itemHTML(it, n) {
    const L = lookOf(it, n);
    return `
      <article class="cb-item is-${L.kind}" data-uid="${esc(it.uid)}" style="--cb-bg:${esc(L.bg)};--cb-ac:${esc(L.ac)};--i:${n}">
        <div class="cb-item__stage"><img class="cb-item__cake" src="${esc(L.src)}" alt="" draggable="false"></div>
        <div class="cb-item__info">
          <strong class="cb-item__name">${esc(it.name)}</strong>
          ${it.meta ? `<span class="cb-item__meta">${esc(it.meta)}</span>` : ""}
          <div class="cb-item__row">
            <div class="cb-qty" role="group" aria-label="Кількість">
              <button type="button" data-qty="-" aria-label="Менше">−</button>
              <span data-q aria-live="polite">${esc(it.qty)}</span>
              <button type="button" data-qty="+" aria-label="Більше">+</button>
            </div>
            <span class="cb-item__sum"><small data-unit>${it.qty > 1 ? `${formatEUR(it.price)} × ${it.qty}` : ""}</small><b data-sum>${formatEUR(it.price * it.qty)}</b></span>
          </div>
        </div>
        <button type="button" class="cb-item__x remove-item" aria-label="Видалити ${esc(it.name)}">×</button>
      </article>`;
  }

  // «до торта пасують»: every dessert on the site, by the same categories as the desserts page;
  // a tap puts it in the box, the next tap adds one more
  let moreTab = "all";
  function moreCats() {
    const M = window.MARIDAY || {};
    const ds = M.desserts || [];
    const cats = (M.dessertCats || []).filter((c) => c.id !== "all" && ds.some((d) => d.cat === c.id));
    return ds.length ? [{ id: "all", label: "Усе" }, ...cats] : [];
  }
  function tilesHTML() {
    const ds = ((window.MARIDAY && MARIDAY.desserts) || []).filter((d) => moreTab === "all" || d.cat === moreTab);
    return ds.map((d, n) => `
      <button type="button" class="cb-tile" data-add-dessert="${esc(d.id)}" style="--cb-bg:${TONES[(n + 2) % TONES.length][0]};--i:${n}" aria-label="Додати «${esc(d.name)}» — ${formatEUR(d.price)}">
        <span class="cb-tile__img"><img src="${esc(photo(d.img))}" alt="" loading="lazy" draggable="false"></span>
        <span class="cb-tile__name">${esc(d.name)}</span>
        <span class="cb-tile__price">${formatEUR(d.price)}${d.unit ? ` · ${esc(d.unit)}` : ""}</span>
        <i class="cb-tile__plus" aria-hidden="true">+</i>
        <em class="cb-tile__n" aria-hidden="true"></em>
      </button>`).join("");
  }
  // the tabs and the shelf; on a tab change only the shelf is redrawn. The «×2» badges follow the box
  function drawMore(tabChanged) {
    const slot = document.querySelector("#cart-items .cb-more-slot");
    if (!slot) return;
    const cats = moreCats();
    if (!cats.length) { slot.innerHTML = ""; return; }
    if (!cats.some((c) => c.id === moreTab)) moreTab = "all";
    const row = slot.querySelector(".cb-more__row");
    if (tabChanged && row) {
      slot.querySelectorAll(".cb-tab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.cbTab === moreTab)));
      row.innerHTML = tilesHTML();
      row.scrollLeft = 0;
    } else if (!row) {
      slot.innerHTML = `
        <section class="cb-more" aria-label="Додати десерт">
          <p class="cb-more__title">До торта пасують</p>
          <div class="cb-tabs" role="tablist">${cats.map((c) => `<button type="button" role="tab" class="cb-tab" data-cb-tab="${esc(c.id)}" aria-selected="${c.id === moreTab}">${esc(c.label)}</button>`).join("")}</div>
          <div class="cb-more__row" role="tabpanel">${tilesHTML()}</div>
        </section>`;
    }
    const inBox = {};
    MaridayCart.get().forEach((i) => { if (i.dessert) inBox[i.id] = (inBox[i.id] || 0) + i.qty; });
    slot.querySelectorAll(".cb-tile").forEach((t) => {
      const n = inBox[t.dataset.addDessert] || 0;
      t.querySelector(".cb-tile__n").textContent = n ? `×${n}` : "";
      t.classList.toggle("is-in", !!n);
    });
  }

  // empty: just the open Mariday box with cherries peeking out, one line and the way to the cakes
  function emptyHTML() {
    return `
      <div class="cb-empty">
        <div class="cb-box" aria-hidden="true">
          <i class="cb-box__back"></i>
          <img class="cb-box__cherry" src="${p("img/cakes/cherries.png")}" alt="">
          <i class="cb-box__front"><b>Mariday</b></i>
        </div>
        <p class="cb-empty__title">Тут поки порожньо</p>
        <a class="btn btn-primary cb-empty__go" href="${p("pages/cakes.html")}">До каталогу</a>
        <a class="cb-empty__alt" href="${p("pages/constructor.html")}">або зберіть свій у конструкторі →</a>
      </div>`;
  }

  // restart a one-off animation class
  function replay(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // a removed cake jumps off its card, then the card folds away
  function leaveRow(row, uid) {
    row.classList.add("is-leaving");
    setTimeout(() => {
      row.style.height = row.offsetHeight + "px";
      requestAnimationFrame(() => {
        row.classList.add("is-gone");
        row.style.height = "0px";
      });
    }, 340);
    setTimeout(() => MaridayCart.remove(uid), 620);
  }

  // the list is kept, not redrawn: only the card that changed moves
  function renderCartItems() {
    const host = document.getElementById("cart-items");
    const drawer = document.getElementById("cart-drawer");
    if (!host) return;
    const items = MaridayCart.get();
    drawer?.classList.toggle("is-empty", !items.length);
    if (!items.length) {
      if (!host.querySelector(".cb-empty")) host.innerHTML = emptyHTML();
      return;
    }
    let list = host.querySelector(".cb-list");
    if (!list) {
      host.innerHTML = `<div class="cb-list"></div><div class="cb-more-slot"></div>`;
      list = host.querySelector(".cb-list");
    }
    const rows = new Map([...list.children].map((r) => [r.dataset.uid, r]));
    items.forEach((it, n) => {
      const row = rows.get(it.uid);
      rows.delete(it.uid);
      if (!row) {
        list.insertAdjacentHTML("beforeend", itemHTML(it, n));
        return;
      }
      const q = row.querySelector("[data-q]");
      const was = Number(q.textContent);
      if (was === it.qty) return;
      q.textContent = it.qty;
      row.querySelector("[data-sum]").textContent = formatEUR(it.price * it.qty);
      row.querySelector("[data-unit]").textContent = it.qty > 1 ? `${formatEUR(it.price)} × ${it.qty}` : "";
      replay(row, it.qty > was ? "is-hop" : "is-squash");
    });
    rows.forEach((r) => r.remove());
    drawMore();
  }

  const wayOf = () => document.querySelector('#cart-drawer input[name="cb-way"]:checked')?.value || "pickup";

  // the total rolls like a till: every digit on its own reel
  function rollTotal(el, text, wait) {
    if (!el || el.dataset.sum === text) return;
    el.dataset.sum = text;
    const chars = [...text];
    const shape = chars.map((ch) => (/\d/.test(ch) ? "0" : ch)).join("");
    if (el.dataset.shape !== shape) {
      el.dataset.shape = shape;
      let k = 0;
      el.innerHTML = `<span class="cb-sr"></span>` + chars.map((ch) => (/\d/.test(ch)
        ? `<span class="odo" aria-hidden="true"><span class="odo__reel" style="--d:0;--k:${k++}">${[..."0123456789"].map((x) => `<i>${x}</i>`).join("")}</span></span>`
        : `<span class="odo__s" aria-hidden="true">${esc(ch)}</span>`)).join("");
      void el.offsetWidth;
    }
    el.querySelector(".cb-sr").textContent = text;
    const set = () => {
      const reels = el.querySelectorAll(".odo__reel");
      let k = 0;
      chars.forEach((ch) => { if (/\d/.test(ch)) reels[k++].style.setProperty("--d", ch); });
    };
    wait ? setTimeout(set, wait) : set();
  }

  function refreshCartUI(opening) {
    const c = document.getElementById("cart-count");
    const hc = document.getElementById("cart-head-count");
    const t = document.getElementById("cart-total");
    const lines = document.getElementById("cart-lines");
    const n = MaridayCart.count();
    if (c) { c.textContent = n; c.dataset.n = n; }
    if (hc && hc.textContent !== String(n)) {
      hc.textContent = n;
      hc.dataset.n = n;
      replay(hc, "is-pop");
    }
    // when the box opens, the till rolls up from zero as the receipt slides in
    if (opening === true && t) { t.dataset.sum = ""; t.dataset.shape = ""; }
    rollTotal(t, formatEUR(MaridayCart.total()), opening === true ? 450 : 0);
    // the count is also on the sticker up top, so narrow phones drop it here
    if (lines) lines.innerHTML = !n ? "Разом" : wayOf() === "delivery" ? "Разом + доставка" : `Разом<span class="cb-total__n"> · ${n} ${plural(n, "смаколик", "смаколики", "смаколиків")}</span>`;
    const btn = document.getElementById("checkout-open");
    if (btn) btn.disabled = !n;
    if (document.getElementById("cart-drawer")?.classList.contains("open")) {
      renderCartItems();
    } else {
      document.getElementById("cart-drawer")?.classList.toggle("is-empty", !n);
    }
  }

  // phones: the box is a sheet that is pulled down by its awning to close
  function bindSheetDrag() {
    const panel = document.querySelector("#cart-drawer .cbox__panel");
    if (!panel) return;
    let y0 = null, dy = 0, pid = null;
    const down = (e) => {
      if (!matchMedia("(max-width: 600px)").matches || e.target.closest("button, a")) return;
      y0 = e.clientY; dy = 0; pid = e.pointerId;
      panel.classList.add("is-dragging");
      e.currentTarget.setPointerCapture?.(pid);
    };
    const move = (e) => {
      if (y0 == null || e.pointerId !== pid) return;
      dy = Math.max(0, e.clientY - y0);
      panel.style.transform = `translateY(${dy}px)`;
    };
    const up = () => {
      if (y0 == null) return;
      y0 = null;
      panel.classList.remove("is-dragging");
      panel.style.transform = "";
      if (dy > 90) closeCart();
    };
    panel.querySelectorAll("[data-cb-drag]").forEach((h) => {
      h.addEventListener("pointerdown", down);
      h.addEventListener("pointermove", move);
      h.addEventListener("pointerup", up);
      h.addEventListener("pointercancel", up);
    });
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

  /* ── «У коробці»: a patisserie box rises from the bottom, the cake flies off the page and drops in behind its
     window, the lid slams shut and a bow pops on top. A line in a cook's hand, what exactly went in, what the
     box holds now — and the way straight to the order, so nobody has to go looking for it. */
  const CN_LINES = ["Спакували з любов'ю", "Гарний вибір, чесно!", "Кондитер уже усміхається", "Бантик зав'язано", "Ммм… це буде смачно", "Коробка вже пахне ваніллю"];
  const CN_FIRST = ["Перший смаколик у коробці!", "Почнемо зі смачного!"];
  const CN_AGAIN = ["Ще один? Розумію!", "Подвійна порція щастя", "Свято буде велике!"];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const uidOf = (item) => item.uid || item.id + "-" + (item.size || "") + "-" + (item.flavor || "") + "-" + (item.variant || "");
  let cn = null, cnTimer = null, cnLast = "";
  function cartNote() {
    if (cn) return cn;
    const el = document.createElement("div");
    el.className = "cnote";
    el.innerHTML = `<div class="cnote__card">
        <span class="cnote__box" aria-hidden="true">
          <i class="cnote__back"></i><img class="cnote__cake" alt="" draggable="false"><i class="cnote__front"></i>
          <i class="cnote__lid"></i><i class="cnote__bow"><b></b><b></b><u></u></i><i class="cnote__spark"></i>
        </span>
        <p class="cnote__txt"><small></small><b></b><em></em></p>
        <div class="cnote__btns">
          <button type="button" class="cnote__go" data-cn-go>Оформити <i aria-hidden="true">→</i></button>
          <button type="button" class="cnote__cart" data-cn-cart>Кошик <span></span></button>
        </div>
        <button type="button" class="cnote__x" data-cn-x aria-label="Закрити">×</button>
        <i class="cnote__time" aria-hidden="true"></i>
      </div>
      <p class="cnote-sr" role="status"></p>`;
    document.body.appendChild(el);
    const card = el.querySelector(".cnote__card");
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-cn-go]")) { hideNote(); openOrder(); }
      else if (e.target.closest("[data-cn-cart]")) { hideNote(); openCart(); }
      else if (e.target.closest("[data-cn-x]")) hideNote();
    });
    // the note waits while the pointer or the focus is on it
    const hold = () => { clearTimeout(cnTimer); el.classList.add("is-held"); };
    const go = () => { el.classList.remove("is-held"); armNote(); };
    card.addEventListener("pointerenter", hold);
    card.addEventListener("pointerleave", go);
    card.addEventListener("focusin", hold);
    card.addEventListener("focusout", go);
    card.addEventListener("animationend", (e) => { if (e.animationName === "cnote-down") el.classList.remove("is-out"); });
    cn = { el, card, box: el.querySelector(".cnote__box"), img: el.querySelector(".cnote__cake"), small: el.querySelector("small"), name: el.querySelector(".cnote__txt b"), meta: el.querySelector("em"), count: el.querySelector(".cnote__cart span"), sr: el.querySelector(".cnote-sr") };
    return cn;
  }
  function armNote() {
    clearTimeout(cnTimer);
    if (!cn || !cn.el.classList.contains("is-in")) return;
    // the thin ribbon along the bottom runs out with the time left
    cn.el.classList.remove("is-timing");
    void cn.el.offsetWidth;
    cn.el.classList.add("is-timing");
    cnTimer = setTimeout(hideNote, 6500);
  }
  function hideNote() {
    clearTimeout(cnTimer);
    if (!cn || !cn.el.classList.contains("is-in")) return;
    cn.el.classList.remove("is-in", "is-again", "is-drop", "is-fly", "is-timing", "is-held");
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) cn.el.classList.add("is-out");
  }
  window.hideCartNote = hideNote;

  function showNote(item, fromEl, again) {
    const n = cartNote();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("toast")?.classList.remove("show");
    window.MaridayFavNote?.hide();
    const c = window.MARIDAY && MARIDAY.cakes && MARIDAY.cakes.find((k) => k.id === item.id);
    const cut = c ? wholeCut(c) : "";
    n.img.src = cut || item.shot || fixSrc(item.image) || p("img/cakes/cherries.png");
    n.img.classList.toggle("is-photo", !cut && !!item.image);
    n.el.style.setProperty("--c", (c && c.bg) || "#f6dbe0");
    const total = MaridayCart.count();
    let line = again ? pick(CN_AGAIN) : total === 1 ? pick(CN_FIRST) : pick(CN_LINES);
    if (line === cnLast) line = pick(CN_LINES.filter((l) => l !== cnLast));
    cnLast = line;
    n.small.textContent = line;
    n.name.textContent = item.name;
    n.meta.textContent = item.meta || "";
    n.meta.hidden = !item.meta;
    n.count.textContent = `${total} · ${formatEUR(MaridayCart.total())}`;
    n.sr.textContent = `«${item.name}» у кошику. Разом ${total} ${plural(total, "смаколик", "смаколики", "смаколиків")}, ${formatEUR(MaridayCart.total())}`;

    const was = n.el.classList.contains("is-in");
    n.el.classList.remove("is-in", "is-out", "is-again", "is-drop", "is-fly");
    void n.el.offsetWidth;
    n.el.classList.add("is-in");
    if (was) n.el.classList.add("is-again");
    armNote();

    const cart = document.getElementById("cart-open");
    const bump = () => { if (!cart) return; cart.classList.remove("is-bump"); void cart.offsetWidth; cart.classList.add("is-bump"); };
    const drop = () => { n.el.classList.remove("is-fly"); n.el.classList.add("is-drop"); bump(); };
    if (reduce || !fromEl) return drop();

    // the cake leaves the page in an arc and lands in the box (aimed at where the rising card will stop)
    const a = fromEl.getBoundingClientRect();
    // the note itself stands still, only its card rises: offsets inside it ignore that rise
    const host = n.el.getBoundingClientRect();
    const bx = host.left + n.card.offsetLeft + n.box.offsetLeft + n.box.offsetWidth / 2;
    const by = host.top + n.card.offsetTop + n.box.offsetTop + n.box.offsetHeight / 2;
    const fly = document.createElement("img");
    fly.className = "cnote-fly" + (cut ? "" : " is-photo");
    fly.src = n.img.src;
    fly.alt = "";
    document.body.appendChild(fly);
    const size = 120;
    const sx = a.left + a.width / 2 - size / 2, sy = a.top + a.height / 2 - size / 2;
    const ex = bx - size / 2, ey = by - size / 2 - 30;
    n.el.classList.add("is-fly");
    const anim = fly.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) scale(1.1) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${sx}px, ${sy - 30}px) scale(1.15) rotate(-6deg)`, opacity: 1, offset: 0.12 },
        { transform: `translate(${(sx + ex) / 2}px, ${Math.min(sy, ey) - 160}px) scale(0.85) rotate(12deg)`, offset: 0.55 },
        { transform: `translate(${ex}px, ${ey}px) scale(0.5) rotate(0deg)`, opacity: 1 },
      ],
      { duration: 820, easing: "cubic-bezier(0.45, 0, 0.3, 1)" }
    );
    const land = () => { fly.remove(); drop(); };
    anim.onfinish = land;
    anim.oncancel = land;
  }

  window.addToCartAndNotify = function (item, fromEl) {
    const again = MaridayCart.get().some((i) => i.uid === uidOf(item));
    MaridayCart.add(item);
    showNote(item, fromEl, again);
  };

  // A section a screen or more off the view falls asleep: its looping animations wait until the visitor comes near.
  // Otherwise a phone keeps restyling every sparkle and balloon of the whole page on every frame, and stutters
  function sleepOffscreen() {
    if (!("IntersectionObserver" in window)) return;
    const seen = new WeakSet();
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.toggleAttribute("data-asleep", !e.isIntersecting)), { rootMargin: "100% 50%" });
    const watch = () => document.querySelectorAll("section, footer").forEach((s) => {
      if (seen.has(s) || (s.parentElement && s.parentElement.closest("section"))) return;
      seen.add(s);
      io.observe(s);
    });
    watch();
    setTimeout(watch); // sections the page scripts draw after this
    addEventListener("load", watch);
  }

  MARIDAY.onReady(mountLayout);
  MARIDAY.onReady(sleepOffscreen);
})();
