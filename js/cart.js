/* Cart + favorites + order helpers */
(function () {
  const CART_KEY = "mariday_cart";
  const FAV_KEY = "mariday_favs";
  const CONTACT_KEY = "mariday_contacts";

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable (private mode) — the session still works in memory */
    }
  }

  window.MaridayCart = {
    get() {
      return read(CART_KEY, []);
    },
    set(items) {
      write(CART_KEY, items);
      document.dispatchEvent(new CustomEvent("mariday:cart"));
    },
    add(item) {
      const items = this.get();
      const key = item.uid || item.id + "-" + (item.size || "") + "-" + (item.flavor || "") + "-" + (item.variant || "");
      const existing = items.find((i) => i.uid === key);
      if (existing) {
        existing.qty += item.qty || 1;
      } else {
        items.push({ ...item, uid: key, qty: item.qty || 1 });
      }
      this.set(items);
      return items;
    },
    setQty(uid, qty) {
      const items = this.get();
      const it = items.find((i) => i.uid === uid);
      if (!it) return;
      if (qty <= 0) return this.remove(uid);
      it.qty = Math.min(99, qty);
      this.set(items);
    },
    remove(uid) {
      this.set(this.get().filter((i) => i.uid !== uid));
    },
    clear() {
      this.set([]);
    },
    count() {
      return this.get().reduce((s, i) => s + i.qty, 0);
    },
    total() {
      return this.get().reduce((s, i) => s + i.price * i.qty, 0);
    },
  };

  window.MaridayFavs = {
    get() {
      return read(FAV_KEY, []);
    },
    toggle(id) {
      const list = this.get();
      const i = list.indexOf(id);
      if (i >= 0) list.splice(i, 1);
      else list.push(id);
      write(FAV_KEY, list);
      document.dispatchEvent(new CustomEvent("mariday:favs"));
      return list;
    },
    has(id) {
      return this.get().includes(id);
    },
  };

  window.MaridayContacts = {
    get() {
      return read(CONTACT_KEY, null);
    },
    save(data) {
      write(CONTACT_KEY, data);
    },
  };

  window.formatEUR = function (n) {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);
  };

  window.assetPath = function (file) {
    return location.pathname.includes("/pages/") ? "../" + file : file;
  };

  // Escape user-typed text before it goes into innerHTML
  window.escapeHTML = function (s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  };
})();
