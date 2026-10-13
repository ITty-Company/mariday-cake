/* Mariday — photos a guest pins to their idea (constructor, order form) and the order itself, sent straight to the
   team: it lands in the admin panel («Заявки») and the database forwards it to Telegram (supabase/setup.sql).
   Works when MARIDAY.backend is filled in; without it the photo boards stay hidden and orders go by WhatsApp/email. */
(function () {
  if (window.MaridayIdeas) return;
  const M = window.MARIDAY || {};
  const cfg = M.backend || {};
  const live = !!(cfg.supabaseUrl && cfg.supabaseKey);
  const base = String(cfg.supabaseUrl || "").replace(/\/+$/, "");
  const auth = { apikey: cfg.supabaseKey, Authorization: `Bearer ${cfg.supabaseKey}` };
  const MAX = 10;
  const BUCKET = "ideas";

  // the board's styles sit with the other css; linked from here so no page needs one more tag
  const self = document.currentScript && document.currentScript.src;
  if (self && !document.querySelector("link[data-ideas-css]")) {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = new URL("../css/ideas.css?v=1", self).href;
    l.setAttribute("data-ideas-css", "");
    document.head.append(l);
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(36).padStart(2, "0")).join("");

  // A phone photo is 4–12 MB; ~1600px JPEG is plenty for a reference and Telegram takes it without fuss
  async function decode(file) {
    const bmp = await createImageBitmap(file).catch(() => null);
    if (bmp) return bmp;
    // Safari opens HEIC and friends through <img> even where createImageBitmap gives up
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } catch (e) {
      return null;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
  async function shrink(file, max = 1600) {
    const pic = await decode(file);
    if (!pic) throw new Error("Це фото не відкривається — збережіть його як JPG і спробуйте ще раз");
    const w = pic.naturalWidth || pic.width, h = pic.naturalHeight || pic.height;
    const k = Math.min(1, max / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h * k));
    const x = c.getContext("2d");
    x.fillStyle = "#fff"; // a transparent PNG gets a white sheet, not black
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(pic, 0, 0, c.width, c.height);
    if (pic.close) pic.close();
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
    if (!blob) throw new Error("Не вдалося підготувати фото");
    return blob;
  }

  // XHR rather than fetch: it reports upload progress for the little bar under each photo
  function put(url, blob, onProgress) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open("POST", url);
      Object.entries({ ...auth, "Content-Type": "image/jpeg", "cache-control": "31536000" }).forEach(([k, v]) => x.setRequestHeader(k, v));
      x.upload.onprogress = (e) => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
      x.onload = () => {
        if (x.status >= 200 && x.status < 300) return resolve();
        let msg = "";
        try { msg = JSON.parse(x.responseText).message || ""; } catch (e) { /* not json */ }
        reject(new Error(/bucket not found|row-level security|policy/i.test(msg)
          ? "Фото поки не приймаються — опишіть ідею словами або надішліть фото у WhatsApp після оформлення."
          : /too large|size/i.test(msg) ? "Фото завелике" : "Не вдалося завантажити фото — спробуйте ще раз"));
      };
      x.onerror = () => reject(new Error("Немає з'єднання — фото не завантажилось"));
      x.send(blob);
    });
  }

  async function upload(file, onProgress) {
    if (!live) throw new Error("Фото можна надіслати у WhatsApp після оформлення");
    if (file.type && !/^image\//.test(file.type)) throw new Error(`«${file.name}» — це не фото`);
    const blob = await shrink(file);
    const name = `guests/${Date.now().toString(36)}-${rand()}.jpg`;
    await put(`${base}/storage/v1/object/${BUCKET}/${name}`, blob, onProgress);
    return `${base}/storage/v1/object/public/${BUCKET}/${name}`;
  }

  /* ── a board of photos: polaroids taped in a row, «+» to add more (or drop files on it), × to take one off.
     One board can be mounted again into a fresh element (the constructor redraws its stations) without losing
     uploads that are still on their way. */
  function board(opts = {}) {
    const max = opts.max || MAX;
    let keySeq = 0;
    let list = (opts.photos || []).slice(0, max).map((url) => ({ k: ++keySeq, url }));
    let host = null;
    const waiting = new Set();
    const tilt = (k) => [-4, 3, -2, 5, -3, 2, -5, 4, -1, 3][k % 10];
    const urls = () => list.filter((p) => p.url).map((p) => p.url);
    const changed = () => opts.onChange && opts.onChange(urls());

    function paint() {
      if (!host || !host.isConnected) return;
      const n = list.length;
      host.innerHTML = `
        <div class="ib__head"><span class="ib__t">${esc(opts.title || "Фото-референси")} <b>${n}/${max}</b></span>${opts.hint ? `<small>${esc(opts.hint)}</small>` : ""}</div>
        <ul class="ib__list">
          ${list.map((p, i) => `<li class="ib__ph${p.url ? "" : " is-up"}" style="--r:${tilt(p.k)}deg" data-k="${p.k}">
            <img src="${esc(p.url || p.prev)}" alt="Фото ${i + 1}" loading="lazy" decoding="async">
            <i class="ib__bar" style="--p:${p.p || 0}" aria-hidden="true"></i>
            <button type="button" class="ib__x" data-ib-x aria-label="Прибрати фото ${i + 1}">×</button>
          </li>`).join("")}
          ${n < max ? `<li class="ib__addli"><button type="button" class="ib__add" data-ib-add>
            <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 10.5h5l2.2-3.5h7.6l2.2 3.5h5v15H5z"/><circle cx="16" cy="17.5" r="4.8"/><path class="ib__plus" d="M25 3.5v6M22 6.5h6"/></svg>
            <b>${n ? "Ще фото" : "Додати фото"}</b><small>до ${max} шт.</small>
          </button></li>` : ""}
        </ul>
        <p class="ib__err" role="alert" hidden></p>
        <input type="file" accept="image/*" multiple hidden data-ib-file>`;
    }
    function oops(msg) {
      const p = host && host.querySelector(".ib__err");
      if (!p) return;
      p.textContent = msg;
      p.hidden = false;
      clearTimeout(oops.t);
      oops.t = setTimeout(() => { p.hidden = true; }, 6000);
    }

    function add(files) {
      files = [...files].filter((f) => !f.type || /^image\//.test(f.type));
      const room = max - list.length;
      if (!files.length) return;
      if (room <= 0) return oops(`Можна до ${max} фото`);
      if (files.length > room) oops(`Можна до ${max} фото — додали перші ${room}`);
      files.slice(0, room).forEach((f) => {
        const p = { k: ++keySeq, prev: URL.createObjectURL(f), p: 0 };
        list.push(p);
        const job = upload(f, (v) => {
          p.p = v;
          const bar = host && host.querySelector(`[data-k="${p.k}"] .ib__bar`);
          if (bar) bar.style.setProperty("--p", v);
        }).then((url) => {
          p.url = url;
          const img = new Image();
          img.src = url; // warm the cache before the preview is swapped
        }).catch((e) => {
          list = list.filter((x) => x !== p);
          paint();
          oops(e.message);
        }).finally(() => {
          waiting.delete(job);
          setTimeout(() => URL.revokeObjectURL(p.prev), 4000);
          paint();
          changed();
        });
        waiting.add(job);
      });
      paint();
    }

    function bind(el) {
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-ib-add]")) return el.querySelector("[data-ib-file]").click();
        const x = e.target.closest("[data-ib-x]");
        if (x) {
          const k = +x.closest("[data-k]").dataset.k;
          list = list.filter((p) => p.k !== k);
          paint();
          changed();
          el.querySelector("[data-ib-add]")?.focus();
        }
      });
      el.addEventListener("change", (e) => {
        if (!e.target.matches("[data-ib-file]")) return;
        add(e.target.files);
        e.target.value = "";
      });
      el.addEventListener("dragover", (e) => {
        if (![...(e.dataTransfer?.types || [])].includes("Files")) return;
        e.preventDefault();
        el.classList.add("is-over");
      });
      el.addEventListener("dragleave", (e) => { if (!el.contains(e.relatedTarget)) el.classList.remove("is-over"); });
      el.addEventListener("drop", (e) => {
        if (!e.dataTransfer?.files?.length) return;
        e.preventDefault();
        el.classList.remove("is-over");
        add(e.dataTransfer.files);
      });
    }

    return {
      mount(el) {
        if (!el) return;
        if (!live) { el.hidden = true; return; }
        host = el;
        el.classList.add("ib");
        if (!el._ib) { bind(el); el._ib = true; }
        paint();
      },
      urls,
      busy: () => waiting.size > 0,
      idle: () => Promise.allSettled([...waiting]),
      // photos that came from elsewhere (the constructor's cake in the cart) join the board, never twice
      merge(more) {
        (more || []).forEach((url) => { if (list.length < max && !list.some((p) => p.url === url)) list.push({ k: ++keySeq, url }); });
        paint();
      },
      clear() { list = []; paint(); changed(); },
    };
  }

  // the order goes into Supabase; the guest can't read orders back, so nothing is returned
  async function send(order) {
    if (!live) throw new Error("offline");
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(`${base}/rest/v1/orders`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(order),
        signal: ctl.signal,
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || `HTTP ${r.status}`);
      }
    } finally {
      clearTimeout(t);
    }
  }

  window.MaridayIdeas = { live, max: MAX, board, upload, send };
  document.dispatchEvent(new CustomEvent("mariday:ideas"));
})();
