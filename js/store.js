/* Mariday — where the admin panel and the on-page editor keep what you change.
   Supabase when MARIDAY.backend is filled in (everyone sees the changes);
   otherwise a trial mode in this browser only (localStorage), so the panel can be tried before connecting. */
(function () {
  const M = window.MARIDAY;
  const cfg = M.backend || {};
  const live = !!(cfg.supabaseUrl && cfg.supabaseKey);
  const bucket = cfg.bucket || "media";
  const SESSION = "mariday-admin";
  const DEMO = "mariday-demo";

  const readJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch (e) { return d; } };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const slug = (s) => String(s || "").toLowerCase()
    .replace(/[ʼ'’]/g, "")
    .replace(/[а-яіїєґё]/g, (ch) => ({ а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", ё: "e" }[ch] || ""))
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

  // ── session
  let session = readJSON(SESSION, null);
  const saveSession = (s) => {
    session = s;
    if (s) writeJSON(SESSION, s); else localStorage.removeItem(SESSION);
  };
  async function auth(path, body) {
    const r = await fetch(`${cfg.supabaseUrl}/auth/v1/${path}`, {
      method: "POST",
      headers: { apikey: cfg.supabaseKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error_description || j.msg || j.message || "Не вдалося увійти");
    return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), email: j.user && j.user.email };
  }
  // a token that is about to run out is renewed before the request
  async function token() {
    if (!session) throw new Error("Потрібно увійти");
    if (session.demo) return "demo";
    if (session.expires_at * 1000 - Date.now() < 60e3) {
      try { saveSession({ ...(await auth("token?grant_type=refresh_token", { refresh_token: session.refresh_token })), email: session.email }); }
      catch (e) { saveSession(null); throw new Error("Сесія завершилась — увійдіть знову"); }
    }
    return session.access_token;
  }
  async function api(path, opt = {}) {
    const t = await token();
    const r = await fetch(`${cfg.supabaseUrl}${path}`, {
      ...opt,
      headers: { apikey: cfg.supabaseKey, Authorization: `Bearer ${t}`, ...(opt.body && !(opt.body instanceof Blob) ? { "Content-Type": "application/json" } : {}), ...opt.headers },
    });
    if (r.status === 401 || r.status === 403) throw new Error("Немає доступу. Перевірте, що ваш email доданий до таблиці admins (README).");
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.message || j.error || `Помилка ${r.status}`);
    }
    return r.status === 204 ? null : r.json().catch(() => null);
  }

  // ── trial mode: everything in one bundle in this browser
  const demo = () => readJSON(DEMO, { content: [], edits: {} });
  const saveDemo = (d) => {
    try { writeJSON(DEMO, d); }
    catch (e) { throw new Error("У пробному режимі закінчилось місце в браузері — підключіть Supabase, щоб зберігати фото."); }
  };

  // Photos are shrunk in the browser before upload: a cake photo needs ~1800px, not a 12 MB original.
  // PNG/WebP keep their transparency (cut-outs for the showcase)
  async function shrink(file, max = 1800) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
    const bmp = await createImageBitmap(file).catch(() => null);
    if (!bmp) return file;
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const alpha = file.type !== "image/jpeg";
    const blob = await new Promise((r) => c.toBlob(r, "image/webp", alpha ? 0.9 : 0.86));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: "image/webp" }) : file;
  }

  const Store = {
    live,
    slug,
    get session() { return session; },
    get email() { return session && (session.demo ? "пробний режим" : session.email); },

    async login(email, password) {
      if (!live) throw new Error("Supabase ще не підключено");
      saveSession(await auth("token?grant_type=password", { email, password }));
    },
    startDemo() { saveSession({ demo: true, access_token: "demo", expires_at: 4102444800, email: "" }); },
    async logout() {
      if (live && session && !session.demo) await api("/auth/v1/logout", { method: "POST" }).catch(() => {});
      saveSession(null);
    },

    // content: { key: data } of everything saved so far (keys never saved keep the defaults from data.js)
    async loadContent() {
      const rows = live && !session.demo ? await api("/rest/v1/content?select=key,data,updated_at") : demo().content;
      const out = {};
      (rows || []).forEach((r) => { out[r.key] = r.data; });
      return out;
    },
    async saveContent(key, data) {
      if (live && !session.demo) {
        await api("/rest/v1/content?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ key, data, updated_at: new Date().toISOString() }]) });
      } else {
        const d = demo();
        d.content = d.content.filter((r) => r.key !== key).concat({ key, data });
        saveDemo(d);
      }
      localStorage.removeItem("mariday-content-v1"); // the site reloads it fresh
    },
    async resetContent(key) {
      if (live && !session.demo) await api(`/rest/v1/content?key=eq.${encodeURIComponent(key)}`, { method: "DELETE" });
      else { const d = demo(); d.content = d.content.filter((r) => r.key !== key); saveDemo(d); }
      localStorage.removeItem("mariday-content-v1");
    },

    // edits made right on a page: [{ sel, kind, value }]
    async loadEdits(page) {
      if (live && !session.demo) return (await api(`/rest/v1/page_edits?select=sel,kind,value&order=id${page ? `&page=eq.${encodeURIComponent(page)}` : ""}`)) || [];
      return page ? demo().edits[page] || [] : Object.values(demo().edits).flat();
    },
    async editCounts() {
      if (live && !session.demo) {
        const rows = (await api("/rest/v1/page_edits?select=page")) || [];
        return rows.reduce((o, r) => ((o[r.page] = (o[r.page] || 0) + 1), o), {});
      }
      const e = demo().edits;
      return Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v.length]));
    },
    async saveEdits(page, list) {
      if (!list.length) return;
      if (live && !session.demo) {
        await api("/rest/v1/page_edits?on_conflict=page,sel", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(list.map((e) => ({ page, sel: e.sel, kind: e.kind, value: e.value }))) });
      } else {
        const d = demo();
        const cur = (d.edits[page] || []).filter((e) => !list.some((n) => n.sel === e.sel));
        d.edits[page] = cur.concat(list.map(({ sel, kind, value }) => ({ sel, kind, value })));
        saveDemo(d);
      }
      localStorage.removeItem("mariday-content-v1");
    },
    async resetEdits(page, sel) {
      if (live && !session.demo) {
        await api(`/rest/v1/page_edits?page=eq.${encodeURIComponent(page)}${sel ? `&sel=eq.${encodeURIComponent(sel)}` : ""}`, { method: "DELETE" });
      } else {
        const d = demo();
        d.edits[page] = sel ? (d.edits[page] || []).filter((e) => e.sel !== sel) : [];
        saveDemo(d);
      }
      localStorage.removeItem("mariday-content-v1");
    },

    // files: returns the URL to put in the data
    async upload(file, folder = "uploads") {
      const f = file.type.startsWith("image/") ? await shrink(file) : file;
      if (live && !session.demo) {
        const name = `${folder}/${Date.now().toString(36)}-${slug(f.name.replace(/\.\w+$/, "")) || "file"}.${(f.name.split(".").pop() || "bin").toLowerCase()}`;
        await api(`/storage/v1/object/${bucket}/${name}`, { method: "POST", headers: { "Content-Type": f.type || "application/octet-stream", "x-upsert": "true", "cache-control": "31536000" }, body: f });
        return `${cfg.supabaseUrl}/storage/v1/object/public/${bucket}/${name}`;
      }
      if (f.size > 1.5e6) throw new Error("У пробному режимі файли до 1,5 МБ. Підключіть Supabase для великих фото й відео.");
      return await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(f); });
    },
    async listMedia() {
      if (!(live && !session.demo)) return [];
      const rows = (await api(`/storage/v1/object/list/${bucket}`, { method: "POST", body: JSON.stringify({ prefix: "uploads", limit: 500, sortBy: { column: "created_at", order: "desc" } }) })) || [];
      return rows.filter((r) => r.id).map((r) => ({ name: r.name, url: `${cfg.supabaseUrl}/storage/v1/object/public/${bucket}/uploads/${r.name}`, size: r.metadata && r.metadata.size, type: r.metadata && r.metadata.mimetype }));
    },
    async removeMedia(url) {
      const path = url.split(`/object/public/${bucket}/`)[1];
      if (path) await api(`/storage/v1/object/${bucket}`, { method: "DELETE", body: JSON.stringify({ prefixes: [path] }) });
    },
  };
  M.store = Store;
})();
