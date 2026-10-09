/* Mariday — live content. The defaults live in js/data.js; whatever the admin panel (/admin) saves to Supabase
   is laid on top of them here, before any page script draws anything:
   · collections (cakes, desserts, flavours, FAQ, contacts…) from the `content` table replace the defaults key by key;
   · texts and photos edited right on a page (?edit=1) come from `page_edits` and are put back into the HTML.
   Page scripts start through MARIDAY.onReady(fn) instead of DOMContentLoaded, so they always see the final data. */
(function () {
  const M = (window.MARIDAY = window.MARIDAY || {});
  const cfg = M.backend || {};
  const live = !!(cfg.supabaseUrl && cfg.supabaseKey);
  const CACHE = "mariday-content-v1";
  const WAIT = 1500; // how long a page waits for fresh content before it draws from the last copy it saw

  // Everything the admin can edit as data. Keys missing from Supabase keep their defaults from data.js
  M.contentKeys = [
    "cakes", "desserts", "dessertCats", "flavors", "flavorMeta", "moods", "sizes", "categories",
    "bentoDecor", "bentoBase", "priceFactors", "faq", "faqMore", "faqCats", "reviews", "reviewOccasions", "contacts",
  ];
  const clone = (v) => JSON.parse(JSON.stringify(v));
  M.defaults = {};
  M.contentKeys.forEach((k) => { if (k in M) M.defaults[k] = clone(M[k]); });

  // ── paths: photos can be a name from img/cakes (the originals) or a full URL (uploaded in the admin panel)
  const inPages = /\/(pages|admin)\//.test(location.pathname);
  M.root = inPages ? "../" : "";
  const isUrl = (s) => /^(https?:|data:|blob:|\/)/.test(String(s || ""));
  M.img = (name) => (isUrl(name) ? name : `${M.root}img/cakes/${name}.jpg`);
  // the showcase on the home page needs a cake without its background: an uploaded cut-out, or one of the originals
  const CUTOUTS = ["berries", "drip", "forest", "gold", "lilac", "pink", "piping", "roses"];
  M.cutout = (c) => (c.cutout ? M.img(c.cutout) : CUTOUTS.includes(c.img) ? `${M.root}img/cutouts/gl-${c.img}.webp` : "");

  // the page this is, as the key its edits are stored under: "index", "pages/product"…
  const file = location.pathname.split("/").pop().replace(/\.html$/, "") || "index";
  M.pageKey = location.pathname.includes("/admin/") ? "admin" : inPages ? `pages/${file}` : file;

  // ── the admin's session (written by the admin panel); with ?edit=1 it turns the page into an editor
  M.session = (() => {
    try {
      const s = JSON.parse(localStorage.getItem("mariday-admin") || "null");
      return s && s.access_token && s.expires_at * 1000 > Date.now() ? s : null;
    } catch (e) { return null; }
  })();
  M.editing = !!(M.session && new URLSearchParams(location.search).has("edit"));

  // ── applying content
  function applyContent(rows) {
    (rows || []).forEach((r) => {
      if (M.contentKeys.includes(r.key) && r.data != null) M[r.key] = clone(r.data);
    });
    // items switched off in the admin panel are kept there, but visitors don't see them
    if (!M.editing) ["cakes", "desserts", "flavors", "reviews", "faq", "faqMore"].forEach((k) => {
      if (Array.isArray(M[k])) M[k] = M[k].filter((it) => !(it && it.hidden));
    });
    (M.cakes || []).forEach((c) => { c.image = M.img(c.img); });
    (M.desserts || []).forEach((d) => { d.image = M.img(d.img); });
    // the reviews form posts to the same project unless it has its own
    const rb = M.reviewsBackend;
    if (rb && !rb.supabaseUrl && live) { rb.supabaseUrl = cfg.supabaseUrl; rb.supabaseKey = cfg.supabaseKey; }
  }

  // Edited HTML may only carry simple inline markup — the same spans and accents the page already uses
  const KEEP = new Set(["SPAN", "B", "STRONG", "I", "EM", "BR", "SMALL", "SUP", "SUB", "U", "S", "MARK"]);
  M.cleanHTML = function (html) {
    const t = document.createElement("template");
    t.innerHTML = String(html || "");
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 1) {
          if (!KEEP.has(n.tagName)) {
            walk(n);
            n.replaceWith(...n.childNodes);
            return;
          }
          [...n.attributes].forEach((a) => { if (a.name !== "class") n.removeAttribute(a.name); });
          walk(n);
        } else if (n.nodeType !== 3) n.remove();
      });
    };
    walk(t.content);
    return t.innerHTML;
  };
  const safeUrl = (u) => (/^(https?:|\.{0,2}\/|img\/|video\/|pages\/|#|mailto:|tel:)/.test(String(u || "")) ? u : "");

  // Every element on a page is addressed by its path in the HTML as the file is written, before any script touches it
  M.pathOf = function (el) {
    const parts = [];
    for (let n = el; n && n !== document.body && n.nodeType === 1; n = n.parentElement) {
      let i = 1;
      for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
      parts.unshift(`${n.tagName.toLowerCase()}:nth-of-type(${i})`);
    }
    return "body > " + parts.join(" > ");
  };

  function applyEdits(list) {
    (list || []).forEach((e) => {
      let el = null;
      try { el = document.querySelector(e.sel.split("|")[0]); } catch (err) { return; } // «…|href» rows: the link's address
      if (!el) return;
      if (e.kind === "html") el.innerHTML = M.cleanHTML(e.value);
      else if (e.kind === "text") el.textContent = e.value;
      else if (e.kind === "img" && safeUrl(e.value)) { el.src = e.value; el.removeAttribute("srcset"); }
      else if (e.kind === "bg" && safeUrl(e.value)) el.style.backgroundImage = `url("${e.value}")`;
      else if (e.kind === "video" && safeUrl(e.value)) { el.src = e.value; el.removeAttribute("poster"); }
      else if (e.kind === "href" && safeUrl(e.value)) el.setAttribute("href", e.value);
    });
  }

  // While editing: tag every text and picture of the page as written in the HTML with its address (data-mk),
  // before the page scripts add header, footer and cards — those come from data and are edited in the panel
  const TEXT = new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "A", "LI", "B", "STRONG", "EM", "I", "SMALL", "LABEL", "BUTTON", "FIGCAPTION", "BLOCKQUOTE", "CITE", "TD", "TH", "DT", "DD", "SUMMARY", "DIV", "U", "MARK", "TIME", "Q", "SUP"]);
  function markEditable() {
    document.body.querySelectorAll("*").forEach((el) => {
      if (el.closest("script, style, noscript, template, svg, [data-no-edit]")) return;
      let kind = "";
      if (el.tagName === "IMG") kind = "img";
      else if (el.tagName === "VIDEO") kind = "video";
      else if (TEXT.has(el.tagName) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) kind = "text";
      else if (/background-image/.test(el.getAttribute("style") || "")) kind = "bg";
      if (kind) { el.dataset.mk = M.pathOf(el); el.dataset.mkKind = kind; }
    });
  }

  // ── loading
  const rest = (path, token) => fetch(`${cfg.supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: cfg.supabaseKey, Authorization: `Bearer ${token || cfg.supabaseKey}` },
    cache: "no-store",
  }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))));

  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (e) { /* private mode */ }

  // trial mode (no Supabase yet): what the admin tried in the panel, shown only in the admin's own browser
  const trial = () => {
    try { return JSON.parse(localStorage.getItem("mariday-demo") || "null"); } catch (e) { return null; }
  };
  const fresh = !live ? Promise.resolve(trial()) : Promise.all([
    rest("content?select=key,data"),
    rest(`page_edits?select=sel,kind,value&page=eq.${encodeURIComponent(M.pageKey)}&order=id`),
  ]).then(([content, edits]) => {
    const pack = { content, edits: { ...(cached && cached.edits), [M.pageKey]: edits }, at: Date.now() };
    try { localStorage.setItem(CACHE, JSON.stringify(pack)); } catch (e) { /* full or private */ }
    return pack;
  }).catch(() => null);

  const timeout = new Promise((r) => setTimeout(() => r(null), WAIT));
  const domReady = new Promise((r) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", r, { once: true }) : r()));
  const queue = [];
  let started = false;

  M.ready = Promise.all([Promise.race([fresh, timeout]), domReady]).then(([pack]) => {
    const use = pack || (live ? cached : null); // offline or slow: the last copy this browser saw
    applyContent(use && use.content);
    applyEdits(use && use.edits && use.edits[M.pageKey]);
    if (M.editing) {
      markEditable();
      const s = document.createElement("script");
      s.src = `${M.root}js/editor.js?v=1`;
      document.head.append(s);
    }
    started = true;
    queue.splice(0).forEach((fn) => { try { fn(); } catch (err) { console.error(err); } });
  });

  // page scripts start here, in the order they were registered — the same order DOMContentLoaded would run them
  M.onReady = (fn) => (started ? fn() : queue.push(fn));
})();
